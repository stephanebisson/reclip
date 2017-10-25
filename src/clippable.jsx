import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import './jquery.clippable'

export class Clippable extends React.Component {
	componentDidMount() {
		this.clippableContainer = ReactDOM.findDOMNode( this )
		let clippableArea = $( this.clippableContainer ).find( '.clippable-area' )
		this.clippableNode = clippableArea.length ? clippableArea[0] : this.clippableContainer
		this.doClip()
	}
	componentDidUpdate() {
		this.doClip()
	}
	doClip() {
		$( this.clippableNode ).clip( {
			idealSize: {},
			clippableContainer: this.clippableContainer
		} )
	}
	render() {
		return <div className={ this.props.className + ' clippable' }>{ this.props.children }</div>
	}
}

export class ClippableArea extends React.Component {
	render() {
		return <div className={ this.props.className + ' clippable-area' }>{ this.props.children }</div>
	}
}
