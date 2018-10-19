class JarvisSuggestionRemote extends JarvisSuggestionBase {
	constructor(data) {
		super();

		for ( let prop in data ) {
			if ( data.hasOwnProperty( prop ) ) {
				this[prop] = data[prop];
			}
		}

		this.source = 'remote';

		if ( parseInt( this.exact_id, 10 ) > 0 ) {
			this.pills.push( `ID ${this.id}` );
		}

		this.pills.push( this.type );

		if ( typeof this.att_src === 'string' && this.att_src.length > 0 ) {
			this.icon.type = 'image';
			this.icon.img = `<img src="${this.att_src}" alt="">`;
		} else {
			this.setIcon( this.type );
		}
	}
}