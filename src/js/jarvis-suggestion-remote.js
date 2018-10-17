class JarvisSuggestionRemote extends JarvisSuggestionBase {
	constructor(data) {
		super();

		for ( let prop in data ) {
			if ( data.hasOwnProperty( prop ) ) {
				this[prop] = data[prop];
			}
		}

		this.source = 'remote';

		if ( typeof this.att_src === 'string' && this.att_src.length > 0 ) {
			this.icon.type = 'image';
			this.icon.style = `background-image: url(${this.att_src})`;
		} else {
			this.setIcon( this.type );
		}
	}
}