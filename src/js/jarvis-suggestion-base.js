
let jarvisIcons = {
	attachment: {
		type: 'dashicon',
		icon: 'dashicons-admin-media',
	},
	category: {
		type: 'dashicon',
		icon: 'dashicons-category',
	},
	nav_menu: {
		type: 'dashicon',
		icon: 'dashicons-admin-appearance',
	},
	nav_menu_item: {
		type: 'dashicon',
		icon: 'dashicons-admin-appearance',
	},
	page: {
		type: 'dashicon',
		icon: 'dashicons-admin-page',
	},
	post: {
		type: 'dashicon',
		icon: 'dashicons-admin-post',
	},
	post_tag: {
		type: 'dashicon',
		icon: 'dashicons-tag',
	},
	post_format: {
		type: 'dashicon',
		icon: 'dashicons-format-standard',
	},
	term: {
		type: 'dashicon',
		icon: 'dashicons-category',
	},
	user: {
		type: 'dashicon',
		icon: 'dashicons-admin-users',
	},
};

let suggestionCounter = 0;
class JarvisSuggestionBase {
	constructor() {
		this.href    = '';
		this.kind    = '';
		this.prefix  = '';
		this.section = '';
		this.source  = '';
		this.title   = '';
		this.type    = '';
		this.pills   = [];
		this.classes = [];

		this.iconKey = '';
		this.icon    = {
			type: 'dashicon',
			icon: '',
			style: '',
			img: '',
			classes: [
				'jarvis__icon',
			],
		};
	}

	setIcon( iconKey ) {
		if ( typeof jarvisIcons !== 'object' ) {
			return;
		}

		if ( ! jarvisIcons[ iconKey ] && this.kind ) {
			switch( this.kind ) {
				case 'term':
					iconKey = 'post_tag';
					break;
				case 'post':
					iconKey = 'post';
					break;
				case 'user':
					iconKey = 'user';
					break;
			}
		}

		if ( typeof jarvisIcons[ iconKey ] === 'object' ) {
			this.iconKey = iconKey;
			this.icon = jQuery.extend( this.icon, jarvisIcons[ this.iconKey ] );

			if ( this.icon.type === 'dashicon' ) {
				this.icon.classes.push( 'dashicons-before' );

				if ( this.icon.classes.indexOf( this.icon.icon ) === -1 ) {
					this.icon.classes.push( this.icon.icon );
				}
			}

			return this.icon;
		}

		return false;
	}
}