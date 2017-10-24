import React from 'react'
import ReactDOM from 'react-dom'

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

class InputSuggestion extends React.Component {
	constructor( props ) {
	    super( props )
	}
	componentWillMount() {
		this.filterEntries( '' )
	}
	componentDidMount() {
		let rawNode = ReactDOM.findDOMNode(this)
	}
	handleChange( event ) {
		this.filterEntries( event.target.value )
	}
	filterEntries( input ) {
		let suggestions = input ? entries.filter( e => e.startsWith( input ) ) : entries
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
				<div className="suggestions">
					{this.state.suggestions.map( s => <Item key={s} item={s} /> )}
				</div>
			</div>
		)
	}
}

export default InputSuggestion
