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
			icons: {},
		}, options );

		// merge the default dashicons that you can't scape from the admin menu for remote data
		if ( this.settings.icons && jarvisIcons ) {
			jarvisIcons = jQuery.extend( jarvisIcons, this.settings.icons );
		}

		// make sure our keycode is an int
		this.settings.keyCode = parseInt( this.settings.keyCode, 10 );

		// internal flag
		this.opened = false;
		// array for storing wordpress links as datums for autocomplete
		this.localData = [];

		// the current search term to re-open the modal with the same term
		this.term = '';

		// flag for whether the ctrlKey is currently pressed
		this.ctrlKey = false;

		this.node = document.createElement( 'div' );
		this.node.className = `jarvis jarvis--${this.settings.theme}`;
		this.node.id = 'jarvis';

		// modal node
		this.modal = document.createElement( 'div' );
		this.modal.className = 'jarvis__modal';

		// modal overlay node
		this.overlay = document.createElement( 'div' );
		this.overlay.className = 'jarvis__overlay';
		this.overlay.addEventListener( 'click', () => this.close(), true );

		// search input node
		this.search = document.createElement( 'input' );
		this.search.type = 'text';

		this.modal.appendChild( this.search );
		this.node.appendChild( this.modal );
		this.node.appendChild( this.overlay );

		// loading icon node
		this.loading    = document.createElement( 'span' );
		this.loading.className = 'jarvis__loading';

		// underscore template for suggestion
		this.templates = {
			suggestion: _.template( `
				<span class="<%= kind %>">
					<a href="<%= href %>" data-source="<%= source %>" data-type="<%= type %>">
						<span class="<% print( icon.classes.join( ' ' ) ) %>" style='<%= icon.style %>' title="<%= prefix %>"><%= icon.img %></span>
						<span class="jarvis__title" title="<%- title %>"><%- title %></span>
						<% if ( pills ) { %>
							<span class="jarvis__pills">
								<% _.each( pills, function(pill) { %>
									<span class="jarvis__pill"><%= pill %></span>
								<% } ); %>
							</span>
						<% } %>
					</a>
				</span>
			` )
		};

		// function for determining if the quick key should fire
		this.inputFocused = function( e ) {
			return /INPUT|SELECT|TEXTAREA/.test( e.target.tagName ) || e.target.contentEditable === 'true';
		}

		// does the url argument match the jarvis-search action
		this.isJarvisUrl = function( url ) {
			return /action=jarvis-search/.test( url );
		}

		// test if constructor was called after the page is loaded, or on DOMContentLoaded
		if ( /complete|loaded/.test( document.readyState ) ) {
			this.init();
		} else {
			document.addEventListener( 'DOMContentLoaded', this.init.bind( this ) );
		}
	}

	init() {
		// scrape wordpress menu for sidebar links
		jQuery( '#adminmenu a' ).each( ( i, elem ) => {
			this.localData.push( new JarvisSuggestionMenu( elem ) );
			return;
		} );

		// Prevent Firefox from using quick search with keyCode
		document.addEventListener( 'keydown', ( e ) => {
			if ( e.keyCode === this.settings.keyCode && ! this.inputFocused( e ) ) {
				e.preventDefault();
				e.stopPropagation();
			}
		}, true ); // use true for event capture

		// menu bar icon click
		jQuery( document ).on( 'click', '#wp-admin-bar-jarvis_menubar_icon a', ( e ) => {
			e.preventDefault();
			this.open();
		} );

		// let the typeahead:selected event handle ctrl+click so it's consistent with keyboard ctrl+enter
		jQuery( document ).on( 'click', '.tt-suggestion a', ( e ) => {
			if ( e.ctrlKey === true ) {
				e.preventDefault();
			}
		} );

		// record the ctrlKey status so we can use it in typeaheads custom triggered events
		jQuery( document ).on( 'keydown keyup', '#jarvis-search', ( e ) => {
			this.ctrlKey = e.ctrlKey;
		} );

		// listen for keyCode
		jQuery( document ).on( 'keyup', ( e ) => {
			// handle esc key - must go before inputFocused check so we can close when jarvis search is focused
			if ( this.opened && e.keyCode === 27 ) {
				e.preventDefault();
				e.stopPropagation();
				this.close();
				return;
			}

			// return if editable field is focused
			if ( this.inputFocused( e ) ) {
				return;
			}

			// open jarvis
			if ( ! this.opened && e.keyCode === this.settings.keyCode ) {
				e.preventDefault();
				e.stopPropagation();
				this.open();
				return;
			}
		} );

		// resize jarvis window on resize
		jQuery( window ).on( 'resize', this.resize.bind( this ) );

		// showing spinners
		jQuery( document ).ajaxSend( ( event, jqXHR, settings ) => {
			if ( this.opened && this.isJarvisUrl( settings.url ) ) {
				this.modal.appendChild( this.loading );
			}
		} );

		// hiding spinners
		jQuery( document ).ajaxComplete( ( event, jqXHR, settings ) => {
			if ( this.opened && this.isJarvisUrl( settings.url ) ) {
				this.loading.parentNode.removeChild( this.loading );
			}
		} );
	}

	open() {
		this.opened = true;
		document.body.appendChild( this.node );

		this.resize();

		jQuery( this.search ).typeahead( {
			hint      : true,
			highlight : true,
			minLength : 1,
			classNames: {
				cursor    : 'jarvis__cursor',
				dataset   : 'jarvis__dataset',
				empty     : 'jarvis__empty',
				highlight : 'jarvis__highlight',
				hint      : 'jarvis__hint',
				input     : 'jarvis__input',
				menu      : 'jarvis__menu',
				open      : 'jarvis__open',
				selectable: 'jarvis__selectable',
				suggestion: 'jarvis__suggestion',
				wrapper   : 'jarvis__wrap',
			}
		}, {
			name: 'results',
			limit: 10,
			display: 'title',
			source: new Bloodhound( {
				local: this.localData,
				datumTokenizer: Bloodhound.tokenizers.obj.whitespace( 'title' ),
				queryTokenizer: Bloodhound.tokenizers.whitespace,
				remote: {
					url: window.ajaxurl + '?action=jarvis-search&q=%s&nonce=' + this.settings.nonce,
					wildcard: '%s',
					transform: ( response ) => {
						return response.data.map( data => new JarvisSuggestionRemote( data ) );
					},
				}
			} ),
			templates: {
				suggestion: ( data ) => this.templates.suggestion( data ),
			}
		} ).on( 'typeahead:select', ( e, item ) => {
			if ( this.ctrlKey ) {
				window.open( item.href, '_blank' );
			} else {
				location.href = item.href;
			}
		} ).on( 'keyup', () => {
			self.term = this.value;
		} ).typeahead( 'val', this.term ).focus();
	}

	close() {
		this.opened = false;
		this.node.parentNode.removeChild( this.node );
		jQuery( this.search ).typeahead( 'destroy' );
	}

	toggle() {
		return ( this.opened ) ? this.close() : this.open();
	}

	resize() {
		if ( this.opened ) {
			this.modal.style.marginLeft = Math.ceil( -1 * this.modal.offsetWidth / 2 ) + 'px';
		}
	}
};

window.Jarvis = Jarvis;
