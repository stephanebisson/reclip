import React from 'react'
import { Clippable, ClippableArea } from './clippable.jsx'

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
		<span>{ item }</span>
	</div>

const Footer = () =>
	<div>
		<span>This is a footer</span>
	</div>

class InputSuggestion extends React.Component {
	componentWillMount() {
		this.filterEntries( '' )
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
				<Clippable className="suggestions-box">
					<ClippableArea className="suggestions">
						{this.state.suggestions.map( s => <Item key={s} item={s} /> )}
					</ClippableArea>
					<Footer />
				</Clippable>
			</div>
		)
	}
}

export default InputSuggestion
