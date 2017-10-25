import $ from 'jquery';

// OO.ui.Element.static.getDocument
// Get the document of an element
var	getElementDocument = function ( obj ) {
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
	// OO.ui.Element.static.getWindow
	getWindow = function ( obj ) {
		var doc = getElementDocument( obj );
		return doc ? doc.defaultView : window;
	},
	clip = function (
		idealDimensions,
		scrollableContainerNode,
		// Optional
		clippableContainerNode
	) {
		var $clippableContainer, $clippable, $clippableScrollableContainer,
			$clippableScroller, $clippableWindow,
			extraHeight, extraWidth, ccOffset,
			$scrollableContainer, scOffset, scHeight, scWidth,
			ccWidth, scrollerIsWindow, scrollTop, scrollLeft,
			desiredWidth, desiredHeight, allotedWidth, allotedHeight,
			naturalWidth, naturalHeight, clipWidth, clipHeight,
			buffer = 7, // Chosen by fair dice roll
			result = {};

		clippableNode = this;

		clippableContainerNode = clippableContainerNode || clippableNode;

		$clippableContainer = $( clippableContainerNode );
		$clippable = $( clippableNode );
		$clippableScrollableContainer = $( scrollableContainerNode || 'body' );

		$clippableScroller = $clippableScrollableContainer.is( 'html, body' ) ?
			// OO.ui.Element.static.getWindow( $clippableScrollableContainer )
			$( getWindow( $clippableScrollableContainer ) ) :
			$clippableScrollableContainer;
		$clippableWindow = $( getWindow( $clippableContainer ) ); // Supposed to be getWindow( this.$element ) for the clippable element in general

		extraHeight = $clippableContainer.outerHeight() - $clippable.outerHeight();
		extraWidth = $clippableContainer.outerWidth() - $clippable.outerWidth();
		ccOffset = $clippableContainer.offset();
		if ( $clippableScrollableContainer.is( 'html, body' ) ) {
			$scrollableContainer = $clippableWindow;
			scOffset = { top: 0, left: 0 };
		} else {
			$scrollableContainer = $clippableScrollableContainer;
			scOffset = $scrollableContainer.offset();
		}
		scHeight = $scrollableContainer.innerHeight() - buffer;
		scWidth = $scrollableContainer.innerWidth() - buffer;
		ccWidth = $clippableContainer.outerWidth() + buffer;
		scrollerIsWindow = $clippableScroller[ 0 ] === $clippableWindow[ 0 ];
		scrollTop = scrollerIsWindow ? $clippableScroller.scrollTop() : 0;
		scrollLeft = scrollerIsWindow ? $clippableScroller.scrollLeft() : 0;
		desiredWidth = ccOffset.left < 0 ?
			ccWidth + ccOffset.left :
			( scOffset.left + scrollLeft + scWidth ) - ccOffset.left;
		desiredHeight = ( scOffset.top + scrollTop + scHeight ) - ccOffset.top;
		// It should never be desirable to exceed the dimensions of the browser viewport... right?
		desiredWidth = Math.min( desiredWidth, document.documentElement.clientWidth );
		desiredHeight = Math.min( desiredHeight, document.documentElement.clientHeight );
		allotedWidth = Math.ceil( desiredWidth - extraWidth );
		allotedHeight = Math.ceil( desiredHeight - extraHeight );
		naturalWidth = $clippable.prop( 'scrollWidth' );
		naturalHeight = $clippable.prop( 'scrollHeight' );
		clipWidth = allotedWidth < naturalWidth;
		clipHeight = allotedHeight < naturalHeight;

		if ( clipWidth ) {
			// The order matters here. If overflow is not set first, Chrome displays bogus scrollbars. See T157672.
			// Forcing a reflow is a smaller workaround than calling reconsiderScrollbars() for this case.
			result.overflowX = 'scroll';
			void $clippable[ 0 ].offsetHeight; // Force reflow

			result.width = Math.max( 0, allotedWidth );
			result.maxWidth = '';
		} else {
			result.overflowX = '';
			result.width = idealDimensions.width || '';
			result.maxWidth = Math.max( 0, allotedWidth );
		}
		if ( clipHeight ) {
			// The order matters here. If overflow is not set first, Chrome displays bogus scrollbars. See T157672.
			// Forcing a reflow is a smaller workaround than calling reconsiderScrollbars() for this case.
			result.overflowY = 'scroll';
			void $clippable[ 0 ].offsetHeight; // Force reflow
			result.height = Math.max( 0, allotedHeight );
			result.maxHeight = '';
		} else {
			result.overflowY = '';
			result.height = idealDimensions.height || '';
			result.maxHeight = Math.max( 0, allotedHeight );
		}

		// // If we stopped clipping in at least one of the dimensions
		// if ( ( this.clippedHorizontally && !clipWidth ) || ( this.clippedVertically && !clipHeight ) ) {
		// 	OO.ui.Element.static.reconsiderScrollbars( $clippable[ 0 ] );
		// }

		// this.clippedHorizontally = clipWidth;
		// this.clippedVertically = clipHeight;

		$clippable.css( result );
		
		// already applied but returning the data just for fun
		return result;
	};

$.fn.clip = clip;

// export default clip;