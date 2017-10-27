import $ from 'jquery';

var tools = {
	/**
	 * Get the window of an element or document.
	 *
	 * @method
	 * @param {jQuery|HTMLElement|HTMLDocument|Window} obj Context to get the window for
	 * @return {Window} Window object
	 */
	getWindow ( obj ) {
		var doc = this.getDocument( obj );
		return doc ? doc.defaultView : window;
	},
	/**
	 * Get the document of an element.
	 *
	 * @method
	 * @param {jQuery|HTMLElement|HTMLDocument|Window} obj Object to get the document for
	 * @return {HTMLDocument|null} Document object
	 */
	getDocument ( obj ) {
		// jQuery - selections created "offscreen" won't have a context, so .context isn't reliable
		return ( obj[ 0 ] && obj[ 0 ].ownerDocument ) ||
			// Empty jQuery selections might have a context
			obj.context ||
			// HTMLElement
			obj.ownerDocument ||
			// Window
			obj.document ||
			// HTMLDocument
			( obj.nodeType === Node.DOCUMENT_NODE && obj ) ||
			null;
	},
	/**
	 * Get closest scrollable container.
	 *
	 * Traverses up until either a scrollable element or the root is reached, in which case the root
	 * scrollable element will be returned (see #getRootScrollableElement).
	 *
	 * @method
	 * @param {HTMLElement} el Element to find scrollable container for
	 * @param {string} [dimension] Dimension of scrolling to look for; `x`, `y` or omit for either
	 * @return {HTMLElement} Closest scrollable container
	 */
	getClosestScrollableElementContainer ( el, dimension ) {
		var i, val,
			// Browsers do not correctly return the computed value of 'overflow' when 'overflow-x' and
			// 'overflow-y' have different values, so we need to check the separate properties.
			props = [ 'overflow-x', 'overflow-y' ],
			$parent = $( el ).parent();

		if ( dimension === 'x' || dimension === 'y' ) {
			props = [ 'overflow-' + dimension ];
		}

		// Special case for the document root (which doesn't really have any scrollable container, since
		// it is the ultimate scrollable container, but this is probably saner than null or exception)
		if ( $( el ).is( 'html, body' ) ) {
			return tools.getRootScrollableElement( el );
		}

		while ( $parent.length ) {
			if ( $parent[ 0 ] === tools.getRootScrollableElement( el ) ) {
				return $parent[ 0 ];
			}
			i = props.length;
			while ( i-- ) {
				val = $parent.css( props[ i ] );
				// We assume that elements with 'overflow' (in any direction) set to 'hidden' will never be
				// scrolled in that direction, but they can actually be scrolled programatically. The user can
				// unintentionally perform a scroll in such case even if the application doesn't scroll
				// programatically, e.g. when jumping to an anchor, or when using built-in find functionality.
				// This could cause funny issues...
				if ( val === 'auto' || val === 'scroll' ) {
					return $parent[ 0 ];
				}
			}
			$parent = $parent.parent();
		}
		// The element is unattached... return something mostly sane
		return tools.getRootScrollableElement( el );
	},
	/**
	 * Get the root scrollable element of given element's document.
	 *
	 * On Blink-based browsers (Chrome etc.), `document.documentElement` can't be used to get or set
	 * the scrollTop property; instead we have to use `document.body`. Changing and testing the value
	 * lets us use 'body' or 'documentElement' based on what is working.
	 *
	 * https://code.google.com/p/chromium/issues/detail?id=303131
	 *
	 * @method
	 * @param {HTMLElement} el Element to find root scrollable parent for
	 * @return {HTMLElement} Scrollable parent, `document.body` or `document.documentElement`
	 *     depending on browser
	 */
	getRootScrollableElement ( el ) {
		var scrollTop, body;

		if ( this.vars.scrollableElement === undefined ) {
			body = el.ownerDocument.body;
			scrollTop = body.scrollTop;
			body.scrollTop = 1;

			// In some browsers (observed in Chrome 56 on Linux Mint 18.1),
			// body.scrollTop doesn't become exactly 1, but a fractional value like 0.76
			if ( Math.round( body.scrollTop ) === 1 ) {
				body.scrollTop = scrollTop;
				this.vars.scrollableElement = 'body';
			} else {
				this.vars.scrollableElement = 'documentElement';
			}
		}

		return el.ownerDocument[ this.vars.scrollableElement ];
	},
	/**
	 * Force the browser to reconsider whether it really needs to render scrollbars inside the element
	 * and reserve space for them, because it probably doesn't.
	 *
	 * Workaround primarily for <https://code.google.com/p/chromium/issues/detail?id=387290>, but also
	 * similar bugs in other browsers. "Just" forcing a reflow is not sufficient in all cases, we need
	 * to first actually detach (or hide, but detaching is simpler) all children, *then* force a reflow,
	 * and then reattach (or show) them back.
	 *
	 * @method
	 * @param {HTMLElement} el Element to reconsider the scrollbars on
	 */
	reconsiderScrollbars ( el ) {
		var i, len, scrollLeft, scrollTop, nodes = [];
		// Save scroll position
		scrollLeft = el.scrollLeft;
		scrollTop = el.scrollTop;
		// Detach all children
		while ( el.firstChild ) {
			nodes.push( el.firstChild );
			el.removeChild( el.firstChild );
		}
		// Force reflow
		void el.offsetHeight;
		// Reattach all children
		for ( i = 0, len = nodes.length; i < len; i++ ) {
			el.appendChild( nodes[ i ] );
		}
		// Restore scroll position (no-op if scrollbars disappeared)
		el.scrollLeft = scrollLeft;
		el.scrollTop = scrollTop;
	},
	vars: {}
}

class Clippable {
	constructor ( $clippable, config ) {
		config = config || {};

		this.$clippable = $clippable;
		this.$clippableContainer = config.$clippableContainer || this.$clippable;

		this.idealWidth = config.width;
		this.idealHeight = config.height;
		this.$clippableScrollableContainer = null;
		this.$clippableScroller = null;
		this.$clippableWindow = null;
		this.onClippableScrollHandler = this.clip.bind( this );
		this.onClippableWindowResizeHandler = this.clip.bind( this );

		this.initialize();
	}
	initialize() {
		this.$clippableScrollableContainer = $( tools.getClosestScrollableElementContainer( this.$clippable[ 0 ] ) );
		// If the clippable container is the root, we have to listen to scroll events and check
		// jQuery.scrollTop on the window because of browser inconsistencies
		this.$clippableScroller = this.$clippableScrollableContainer.is( 'html, body' ) ?
			$( tools.getWindow( this.$clippableScrollableContainer ) ) :
			this.$clippableScrollableContainer;
		this.$clippableScroller.on( 'scroll', this.onClippableScrollHandler );
		this.$clippableWindow = $( tools.getWindow( this.$clippable ) ) // Originally in OOUI this was this.$element
			.on( 'resize', this.onClippableWindowResizeHandler );
		// Initial clip after visible
		this.clip();
	}
	unclippable() {
		this.$clippable.css( {
			width: '',
			height: '',
			maxWidth: '',
			maxHeight: '',
			overflowX: '',
			overflowY: ''
		} );
		tools.reconsiderScrollbars( this.$clippable[ 0 ] );

		this.$clippableScrollableContainer = null;
		this.$clippableScroller.off( 'scroll', this.onClippableScrollHandler );
		this.$clippableScroller = null;
		this.$clippableWindow.off( 'resize', this.onClippableWindowResizeHandler );
		this.$clippableWindow = null;
	}
	clip() {
		var $container, extraHeight, extraWidth, ccOffset,
			$scrollableContainer, scOffset, scHeight, scWidth,
			ccWidth, scrollerIsWindow, scrollTop, scrollLeft,
			desiredWidth, desiredHeight, allotedWidth, allotedHeight,
			naturalWidth, naturalHeight, clipWidth, clipHeight,
			buffer = 7; // Chosen by fair dice roll

		// if ( !this.clipping ) {
		// 	// this.$clippableScrollableContainer and this.$clippableWindow are null, so the below will fail
		// 	return this;
		// }

		$container = this.$clippableContainer || this.$clippable;
		extraHeight = $container.outerHeight() - this.$clippable.outerHeight();
		extraWidth = $container.outerWidth() - this.$clippable.outerWidth();
		ccOffset = $container.offset();
		if ( this.$clippableScrollableContainer.is( 'html, body' ) ) {
			$scrollableContainer = this.$clippableWindow;
			scOffset = { top: 0, left: 0 };
		} else {
			$scrollableContainer = this.$clippableScrollableContainer;
			scOffset = $scrollableContainer.offset();
		}
		scHeight = $scrollableContainer.innerHeight() - buffer;
		scWidth = $scrollableContainer.innerWidth() - buffer;
		ccWidth = $container.outerWidth() + buffer;
		scrollerIsWindow = this.$clippableScroller[ 0 ] === this.$clippableWindow[ 0 ];
		scrollTop = scrollerIsWindow ? this.$clippableScroller.scrollTop() : 0;
		scrollLeft = scrollerIsWindow ? this.$clippableScroller.scrollLeft() : 0;
		desiredWidth = ccOffset.left < 0 ?
			ccWidth + ccOffset.left :
			( scOffset.left + scrollLeft + scWidth ) - ccOffset.left;
		desiredHeight = ( scOffset.top + scrollTop + scHeight ) - ccOffset.top;
		// It should never be desirable to exceed the dimensions of the browser viewport... right?
		desiredWidth = Math.min( desiredWidth, document.documentElement.clientWidth );
		desiredHeight = Math.min( desiredHeight, document.documentElement.clientHeight );
		allotedWidth = Math.ceil( desiredWidth - extraWidth );
		allotedHeight = Math.ceil( desiredHeight - extraHeight );
		naturalWidth = this.$clippable.prop( 'scrollWidth' );
		naturalHeight = this.$clippable.prop( 'scrollHeight' );
		clipWidth = allotedWidth < naturalWidth;
		clipHeight = allotedHeight < naturalHeight;

		if ( clipWidth ) {
			// The order matters here. If overflow is not set first, Chrome displays bogus scrollbars. See T157672.
			// Forcing a reflow is a smaller workaround than calling reconsiderScrollbars() for this case.
			this.$clippable.css( 'overflowX', 'scroll' );
			void this.$clippable[ 0 ].offsetHeight; // Force reflow
			this.$clippable.css( {
				width: Math.max( 0, allotedWidth ),
				maxWidth: ''
			} );
		} else {
			this.$clippable.css( {
				overflowX: '',
				width: this.idealWidth || '',
				maxWidth: Math.max( 0, allotedWidth )
			} );
		}
		if ( clipHeight ) {
			// The order matters here. If overflow is not set first, Chrome displays bogus scrollbars. See T157672.
			// Forcing a reflow is a smaller workaround than calling reconsiderScrollbars() for this case.
			this.$clippable.css( 'overflowY', 'scroll' );
			void this.$clippable[ 0 ].offsetHeight; // Force reflow
			this.$clippable.css( {
				height: Math.max( 0, allotedHeight ),
				maxHeight: ''
			} );
		} else {
			this.$clippable.css( {
				overflowY: '',
				height: this.idealHeight || '',
				maxHeight: Math.max( 0, allotedHeight )
			} );
		}

		// If we stopped clipping in at least one of the dimensions
		if ( ( this.clippedHorizontally && !clipWidth ) || ( this.clippedVertically && !clipHeight ) ) {
			tools.reconsiderScrollbars( this.$clippable[ 0 ] );
		}

		this.clippedHorizontally = clipWidth;
		this.clippedVertically = clipHeight;

		return this;
	}
}

// ---------- jQuery plugin: clippable ----------

$.fn.clippable = function ( config ) {
	var clippable = this.data( 'clippable' );

	config = config || {};

	if ( !clippable ) {
		clippable = new Clippable( this, {
			$clippableContainer: config.$clippableContainer
		} );
		this.data( 'clippable', clippable );
	}
};

$.fn.clip = function( config ) {
	var clippable = this.data( 'clippable' );

	if ( clippable ) {
		clippable.clip();
	} else {
		clippable = new Clippable( this, config );
		this.data( 'clippable', clippable );
	}
};
