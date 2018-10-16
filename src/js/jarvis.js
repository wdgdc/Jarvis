/* global jQuery, _, Bloodhound */

class Jarvis {

	constructor( options = {} ) {
		// cut the mustard
		if ( ! jQuery || !_ || ! Bloodhound ) {
			return;
		}

		// default settings
		this.settings = jQuery.extend( {
			keyCode: 191,
			separator:'»',
			loadingimg:'/wp-content/plugins/wp-jarvis/img/wpspin.gif',
			icons: {},
		}, options );

		// merge the default dashicons that you can't scape from the admin menu for remote data
		this.settings.icons = jQuery.extend( {
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
		}, this.settings.icons );

		// make sure our keycode is an int
		this.settings.keyCode = parseInt( this.settings.keyCode, 10 );

		// internal flag
		this.opened = false;
		// array for storing wordpress links as datums for autocomplete
		this.localData = [];

		// the current search term to re-open the modal with the same term
		this.term = '';

		// modal node
		this.modal = document.createElement('div');
		this.modal.id = 'jarvis-modal';

		// modal overlay node
		this.overlay = document.createElement( 'div' );
		this.overlay.id = 'jarvis-overlay';
		this.overlay.addEventListener( 'click', () => this.close(), true);

		// search input node
		this.search = document.createElement('input');
		this.search.type = 'text';
		this.search.id = 'jarvis-search';

		// loading icon node
		this.loading     = document.createElement('img');
		this.loading.src = this.settings.loadingimg;
		this.loading.id  = 'jarvis-loading';

		// underscore template for suggestion
		this.templates = {
			suggestion: _.template(`
				<span class="<%= prefix %> <%= kind %>">
					<a href="<%= href %>">
						<span class="<% print( icon.classes.join(' ') ) %>" style='<%= icon.style %>' title="<%= prefix %>"></span>
						<span class="jarvis-title" title="<%- title %>"><%- title %></span>
					</a>
				</span>
			`)
		};

		// function for determining if the quick key should fire
		this.inputFocused = function(e) {
			return /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.target.contentEditable === 'true';
		}

		// does the url argument match the jarvis-search action
		this.isJarvisUrl = function(url) {
			return /action=jarvis-search/.test(url);
		}

		// test if constructor was called after the page is loaded, or on DOMContentLoaded
		if ( /complete|loaded/.test( document.readyState ) ) {
			this.init();
		} else {
			document.addEventListener( 'DOMContentLoaded', this.init.bind(this) );
		}
	}

	init() {
		// scrape wordpress menu for sidebar links
		jQuery('#adminmenu a').each( (i, elem) => {
			this.localData.push( new JarvisSuggestionMenu(elem) );
			return;
		});

		// Prevent Firefox from using quick search with keyCode
		document.addEventListener( 'keydown', (e) => {
			if ( e.keyCode === this.settings.keyCode && ! this.inputFocused(e)) {
				e.preventDefault();
				e.stopPropagation();
			}
		}, true); // use true for event capture

		// menu bar icon click
		jQuery(document).on( 'click', '#wp-admin-bar-jarvis_menubar_icon a', (e) => {
			e.preventDefault();
			this.open();
		} );

		// listen for keyCode
		jQuery(document).on( 'keyup', (e) => {
			e.preventDefault();
			e.stopPropagation();
			switch(true) {
				// handle esc key
				case this.opened && e.keyCode === 27:
					this.close();
					break;
				// return if editable field is focused
				case util.inputInFocus(e):
					return;
				// open jarvis
				case !this.opened && e.keyCode === this.settings.keyCode:
					this.open();
					break;
			}
		});

		// resize jarvis window on resize
		jQuery(window).on('resize', this.resize.bind(this) );

		// showing spinners
		jQuery(document).ajaxSend( ( event, jqXHR, settings ) => {
			if (this.opened && this.isJarvisUrl( settings.url ) ) {
				this.modal.appendChild(this.loading);
			}
		});

		// hiding spinners
		jQuery(document).ajaxComplete( (event, jqXHR, settings) => {
			if (this.opened && this.isJarvisUrl( settings.url ) ) {
				this.loading.parentNode.removeChild(this.loading);
			}
		});
	}

	open() {
		this.opened = true;
		this.modal.appendChild(this.search);
		document.body.appendChild(this.overlay);
		document.body.appendChild(this.modal);
		this.resize();

		jQuery( this.search ).typeahead( {
				hint: true,
				highlight: true,
				minLength: 1
			},
			{
				name: 'results',
				limit: 10,
				display: 'title',
				source: new Bloodhound( {
					local: this.localData,
					datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
					queryTokenizer: Bloodhound.tokenizers.whitespace,
					remote: {
						url: window.ajaxurl + '?action=jarvis-search&q=%s&nonce=' + this.settings.nonce,
						wildcard: '%s',
						transform: (response) => {
							return response.data.map( (data) => new JarvisSuggestionRemote(data) );
						}
					}
				}),
				templates: {
					suggestion: (data) => {
						return this.templates.suggestion(data);
					}
				}
			}
		).on('typeahead:selected', (e, item) => {
			location.href = item.href;
		}).on('keyup', () => {
			self.term = this.value;
		}).typeahead('val', this.term).focus();
	}

	close() {
		this.opened = false;
		this.overlay.parentNode.removeChild( this.overlay );
		this.modal.parentNode.removeChild( this.modal );
		jQuery(this.search).typeahead( 'destroy' );
	}

	toggle() {
		return ( this.opened ) ? this.close() : this.open();
	}

	resize() {
		if ( this.opened ) {
			this.modal.style.marginLeft = Math.ceil(-1 * this.modal.offsetWidth / 2) + 'px';
		}
	}
};

window.Jarvis = Jarvis;
