class JarvisSuggestionMenu extends JarvisSuggestionBase {
	constructor( link = null ) {
		super();

		// remove child span element counts from section name
		let sanitize = function(node) {
			return jQuery(node).clone().find( 'span' ).remove().end().text();
		};

		this.link        = link;
		this.id          = link.id || null;
		this.section     = jQuery( this.link ).closest( '.menu-top' );
		this.prefix      = this.section.find( '.wp-menu-name' ).text();
		this.title       = jQuery(this.link).text();
		this.kind        = 'href';
		this.href        = link.href;
		// this.iconClasses = [ 'jarvis-icon', 'dashicons-before' ];
		// this.iconStyle   = '';
		// this.iconType    = 'dashicon';

		let $wpMenuIcon = this.section.find('.wp-menu-image').first();

		switch( true ) {
			case $wpMenuIcon.hasClass( 'svg' ):
				let computedStyle = window.getComputedStyle($wpMenuIcon.get(0));
				this.icon.type  = 'svg';
				this.icon.style = `background-position: center; background-repeat: no-repeat; background-image: ${computedStyle.backgroundImage}; background-size: ${computedStyle.backgroundSize}`;
				break;
			case $wpMenuIcon.hasClass( 'dashicons-before' ):
				this.icon.type = 'dashicon';
				this.icon.classes.push( $wpMenuIcon.attr('class').trim().split(' ').filter( c => [ 'dashicons-before', 'wp-menu-image' ].indexOf(c) === -1 ).shift() );
				break;
			case this.section.find('.wp-menu-image img').length > 0:
				this.icon.type = 'image';
				this.icon.style = `background-image: ${window.getComputedStyle($wpMenuIcon[0]).backgroundImage}`;
				break;
		}

		this.icon.classes.push( `jarvis-icon--${this.iconType}` );

		// console.log(wpMenuImage);

		// this.icon = (() => {
		// 	let bg = this.section.find('.wp-menu-image')[0],
		// 		img = this.section.find('.wp-menu-image img')[0],
		// 		styles,
		// 		classes;

		// 	if ( bg && bg.className.indexOf( 'dashicons-before' ) > -1 ) {
		// 		classes = bg.className.split(' ');
		// 		classes.splice( jQuery.inArray('wp-menu-image', classes), 1 );
		// 		classes.splice( jQuery.inArray('dashicons-before', classes), 1 );
		// 		return {
		// 			type: 'dashicon',
		// 			icon: classes[0]
		// 		};
		// 	} else if (img) {
		// 		// icon is image (plugin based)
		// 		return {
		// 			type: 'image',
		// 			icon: 'background-image:url(' + img.src + ');background-position:center'
		// 		};
		// 	} else if (bg) {
		// 		// icon is background image, possibly sprite (thus the background-position calculation);
		// 		styles = util.getComputedStyle(bg);
		// 		if (typeof styles.backgroundPosition === 'string') { //
		// 			return {
		// 				type: 'image',
		// 				icon: 'background-image:' + styles.backgroundImage + ';background-position:' + styles.backgroundPosition
		// 			};
		// 		} else {
		// 			return {
		// 				type: 'image',
		// 				icon: 'background-image:' + styles.backgroundImage + ';background-position-x:'+ styles.backgroundPositionX +';background-position-y:'+ styles.backgroundPositionY
		// 			};
		// 		}
		// 	} else {
		// 		return null;
		// 	}
		// })();

		// // store reference in icons object to match later with types from server
		// self.icons[ prefix.toLowerCase() ] = icon;

		// switch(true) {
		// 	// if prefix is empty or same as title just use the title
		// 	case prefix === '':
		// 	case prefix === title:
		// 		slug = title;
		// 		break;
		// 	// use the section name and the title for default
		// 	default:
		// 		slug = prefix + ' ' + self.settings.separator + ' ' + title;
		// }

		// entry = {
		// 	id: this.id || null,
		// 	kind: 'href',
		// 	href: this.href,
		// 	prefix: util.trim(prefix).toLowerCase(),
		// 	title: util.trim(slug),
		// 	type: 'menu',
		// };
		// if (icon) {
		// 	entry.icontype = icon.type;
		// 	switch(icon.type) {
		// 		case 'dashicon':
		// 			entry.iconclass = 'dashicons-before '+ icon.icon;
		// 			entry.image = '';
		// 		break;
		// 		case 'image':
		// 			entry.iconclass = 'image-icon';
		// 			entry.image = icon.icon;
		// 		break;
		// 	}
		// }

		// console.log(link, this);

		return;
	}
}