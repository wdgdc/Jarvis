/**
 * This class is for modeling a wp-admin menu item
 */
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
		this.pills.push( this.type );
		this.classes.push( `jarvis__suggestion--${this.kind}`);

		if ( jQuery( this.link ).is( '.wp-submenu a' ) ) {
			this.title = `${this.prefix} » ${jQuery( this.link ).clone().children().remove().end().text()}`;
		} else {
			this.title = this.prefix;
		}

		this.scrapeIcon();
	}

	scrapeIcon() {
		let $wpMenuIcon = this.section.find( '.wp-menu-image' ).first();

		// try and get the icon key from the top level link post_type= param of the link href so it matches up to remote data
		let $wpMenuLink = this.section.find('> a').first();
		if ( $wpMenuLink.length > 0 && $wpMenuLink.attr('href').indexOf('?') > -1 ) {
			let qs = this.link.href.substr( $wpMenuLink.attr('href').indexOf('?') + 1 );
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

		this.classes.push( `jarvis__suggestion--${this.iconKey}`);

		if ( $wpMenuIcon.length && typeof jarvisIcons === 'object' ) {
			if ( ! jarvisIcons[ this.iconKey ] ) {
				let computedStyle;

				switch( true ) {
					case this.section.find('.wp-menu-image img').length > 0:
						// img tag inside icon - old school
						this.icon.type = 'image';
						this.icon.img = this.section.find('.wp-menu-image img').get(0).outerHTML;
						break;

					case $wpMenuIcon.hasClass( 'svg' ):
						// base64 encoded svg
						computedStyle = window.getComputedStyle( $wpMenuIcon.get( 0 ) );
						if ( /^url\("data:image\/svg\+xml\;base64,/.test( computedStyle.backgroundImage ) ) {
							this.icon.type = 'svg';
							this.icon.img  = atob( computedStyle.backgroundImage.replace( /^url\("data:image\/svg\+xml\;base64,/, '' ).replace( /\"\)$/, '' ) );
							this.icon.img  = this.icon.img.replace( /<\?xml [^>]+\?>/g, '' ).replace( /\sid="[^\"]+"/g, '' ).replace( /<!--[\s\S]*?-->/g, '' ).replace( /<(title|desc|defs)>[^<]+?<\/(title|desc|defs)>/g, '' );
						}
						break;

					case $wpMenuIcon.hasClass( 'dashicons-before' ):
						computedStyle = window.getComputedStyle( $wpMenuIcon.get( 0 ), ':before' );

						if ( computedStyle.fontFamily === 'dashicons' ) {
							// proper dashicon
							this.icon.type = 'dashicon';
							this.icon.classes.push( $wpMenuIcon.attr('class').trim().split(' ').filter( c => [ 'dashicons-before', 'wp-menu-image' ].indexOf(c) === -1 ).shift() );
						} else {
							// custom icons on top of a dashicon using css (woocommerce does this)
							let style = document.getElementById( 'jarvis_style' );
							if ( ! style ) {
								style = document.createElement('style');
								style.type = 'text/css';
								style.id = 'jarvis_style';
								document.head.appendChild(style);
							}

							let css = `.jarvis__suggestion--${this.iconKey} .jarvis__icon::before { font-family: ${computedStyle.fontFamily}; content: ${computedStyle.content}; }` + "\n";

							style.appendChild( document.createTextNode(css) );
						}
						break;
				}
				jarvisIcons[ this.iconKey ] = this.icon;
			}

			this.setIcon( this.iconKey );
		}
	}
}
