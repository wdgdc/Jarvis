class JarvisSuggestionMenu extends JarvisSuggestionBase {
	constructor( link ) {
		super();

		this.source  = 'menu';
		this.link    = link;
		this.section = jQuery( this.link ).closest( 'li.menu-top' ).first();
		this.prefix  = this.section.find( '.wp-menu-name' ).clone().children().remove().end().text();
		this.kind    = 'menu';
		this.type    = this.kind;
		this.href    = link.href;
		this.title   = jQuery( this.link ).text();

		if ( jQuery( this.link ).is( '.wp-submenu a' ) ) {
			this.title = `${this.prefix} » ${this.title}`;
		}

		this.scrapeIcon();
	}

	scrapeIcon() {
		let $wpMenuIcon = this.section.find( '.wp-menu-image' ).first();

		// try and get the icon key from the post_type= param of the link href so it matches up to remote data
		if ( this.link.href.indexOf('?') > -1 ) {
			let qs = this.link.href.substr( this.link.href.indexOf('?') + 1 );
			let params = qs.split("&");

			for ( let i = 0; i < params.length; i++ ) {
				let pairs = params[i].split('=');
				if ( pairs[0] === 'post_type' && pairs[1].length > 0 ) {
					this.iconKey = pairs[1];
					break;
				}
			}
		}

		if ( ! this.iconKey ) {
			this.iconKey = this.section.attr('id');
		}

		if ( $wpMenuIcon.length && typeof jarvisIcons === 'object' ) {
			if ( ! jarvisIcons[ this.iconKey ] ) {
				let computedStyle;

				switch( true ) {
					case $wpMenuIcon.hasClass( 'dashicons-before' ):
						this.icon.type = 'dashicon';
						this.icon.classes.push( $wpMenuIcon.attr('class').trim().split(' ').filter( c => [ 'dashicons-before', 'wp-menu-image' ].indexOf(c) === -1 ).shift() );
						break;
					case $wpMenuIcon.hasClass( 'svg' ):
						computedStyle = window.getComputedStyle( $wpMenuIcon.get( 0 ) );
						this.icon.type  = 'svg';
						this.icon.style = `background-position: left center; background-repeat: no-repeat; background-image: ${computedStyle.backgroundImage}; background-size: ${computedStyle.backgroundSize}`;
						break;
					case this.section.find('.wp-menu-image img').length > 0:
						computedStyle = window.getComputedStyle( $wpMenuIcon.get( 0 ) );
						this.icon.type = 'image';
						this.icon.style = `background-position: left center; background-repeat: no-repeat; background-image: ${computedStyle.backgroundImage}; background-size: ${computedStyle.backgroundSize}; `;
						break;
				}
				jarvisIcons[ this.iconKey ] = this.icon;
			}

			this.setIcon( this.iconKey );
		}
	}
}
