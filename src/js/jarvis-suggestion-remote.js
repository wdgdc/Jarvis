class JarvisSuggestionRemote extends JarvisSuggestionBase {
	constructor(data) {
		super();

		for ( let prop in data ) {
			if ( data.hasOwnProperty( prop ) ) {
				this[prop] = data[prop];
			}
		}

		console.log(this);

		// let iconType = ( this.type && this.icons[ this.type ] ) ? this.icons[ this.type ] : 'post';
		// this.icon.type = this.icons[ iconType ].type;
		// this.icon.icon = this.icons[ iconType ].icon;
	}
}