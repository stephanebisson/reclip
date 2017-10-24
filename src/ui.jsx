import React from 'react'

const entries = [
	'Amsterdam',
	'Antwerp',
	'Adelaide',
	'Akureyri',
	'Addis Ababa',
	'Bruge',
	'Boston',
	'Bangalore',
	'Bombay',
	'Baltimore',
	'Bangkok',
	'Buenos Aires',
	'Bago',
	'Baoji',
	'Baoshan',
	'Baraki',
	'Chennai',
	'Chicago',
	'Denver',
	'Dadong'
]

const Item = ( { item } ) =>
	<div className="suggestion">
		<span>{item}</span>
	</div>

const Footer = () =>
	<div>
		<span>This is a footer</span>
	</div>

class InputSuggestion extends React.Component {
	constructor( props ) {
	    super( props )
	}
	componentWillMount() {
		this.filterEntries( '' )
	}
	componentDidMount() {
		this.scrollableContainerNode = this.props.scrollableContainerNode || window

		console.log( this.clippableNode, this.clippableContainer, this.scrollableContainerNode )
	}
	handleChange( event ) {
		this.filterEntries( event.target.value )
	}
	filterEntries( input ) {
		let suggestions = input ?
			entries.filter( e => e.toLowerCase().startsWith( input.toLowerCase() ) ) :
			entries
		suggestions = suggestions.sort()
		this.setState( { input, suggestions } )
	}
	render() {
		return (
			<div>
				<input type="text" 
					autoFocus
					placeholder="Type here..."
					value={ this.state.input } 
					onChange={ this.handleChange.bind( this ) } />
				<div className="suggestions-box" ref={ e => this.clippableContainer = e }>
					<div className="suggestions" ref={ e => this.clippableNode = e }>
						{this.state.suggestions.map( s => <Item key={s} item={s} /> )}
					</div>
					<Footer />
				</div>
			</div>
		)
	}
}

export default InputSuggestion
