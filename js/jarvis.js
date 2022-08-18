import $ from 'jquery';
import _ from 'lodash';
import '../node_modules/typeahead.js/dist/typeahead.jquery.js'; // this is side-effects only, but gives us our dependencies in closure scope
import Bloodhound from '../node_modules/typeahead.js/dist/bloodhound.js';

/**
 * function for determining if the quick key should fire
 */
const inputFocused = function () {
	return /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) || document.activeElement.contentEditable === 'true';
}

const decodeEntities = function (str) {
	const textarea = document.createElement('textarea');
	textarea.innerHTML = str;
	return textarea.value;
}

/**
 * Object to store icons data by key
 */
let iconStore = {
	store: {
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
			icon: 'dashicons-menu',
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
	},

	add: function (key, type, icon) {
		if (!this.store[key]) {
			this.store[key] = {
				type: type,
				icon: icon,
			};
		}

		return this.store[key];
	},

	remove: function (key) {
		if (this.store[key]) {
			delete this.store[key];
		}
	},

	get: function (key) {
		return (typeof this.store[key] === 'object') ? this.store[key] : false;
	},
};

class Suggestion {

	/**
	 * Base Suggestion class constrcutor that contains the suggestion model
	 *
	 * @param object data
	 * @param string type
	 */
	constructor(data = {}, type = '') {
		this.attributes = [];
		this.classes = [];
		this.href = '';
		this.icon = null;
		this.iconClasses = ['jarvis__icon'];
		this.iconKey = '';
		this.iconStyle = '';
		this.iconType = 'dashicon';
		this.kind = '';
		this.prefix = '';
		this.section = '';
		this.title = '';
		this.type = '';

		for (let prop in data) {
			if (data.hasOwnProperty(prop)) {
				this[prop] = data[prop];
			}
		}

		if (typeof this.type === 'string' && this.type.length > 0 && this.attributes.indexOf(this.type) === -1) {
			this.attributes.push(this.type);
		}

		if (this.iconKey && this.iconType && this.icon && !iconStore.get(this.iconKey)) {
			iconStore.add(this.iconKey, this.iconType, this.icon);
		}

		this.setIcon(this.iconKey);
	}

	/**
	 * Set the icon of this suggestion to the icon key in the icon store
	 *
	 * @param string iconKey
	 */
	setIcon(iconKey = '') {
		// image icon - usually unique per suggestion - no reason to cache it
		if (this.iconType === 'image' && this.icon) {
			return;
		}

		if (!iconStore.get(iconKey) && this.kind) {
			switch (this.kind) {
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

		let storedIcon = iconStore.get(iconKey);

		if (storedIcon) {
			this.iconKey = iconKey;
			this.iconType = storedIcon.type;
			this.icon = storedIcon.icon;

			if (this.iconType === 'dashicon') {
				this.iconClasses.push('dashicons-before');

				if (this.iconClasses.indexOf(this.icon) === -1) {
					this.iconClasses.push(this.icon);
				}
			}

			return this.icon;
		}

		return false;
	}
}

class MenuSuggestion extends Suggestion {
	/**
	 * Heavily modify the base suggestion model for menu items
	 */
	constructor(link) {
		super();

		this.link = link;
		this.section = jQuery(this.link).closest('li.menu-top').first();
		this.prefix = this.section.find('.wp-menu-name').clone().children().remove().end().text();
		this.kind = 'menu';
		this.type = this.kind;
		this.href = link.href;

		this.attributes.push(this.type);
		this.classes.push(`jarvis__suggestion--${this.kind}`);

		if (jQuery(this.link).is('.wp-submenu a')) {
			this.title = `${this.prefix} » ${jQuery(this.link).clone().children().remove().end().text()}`;
		} else {
			this.title = this.prefix;
		}

		let $wpMenuIcon = this.section.find('.wp-menu-image').first();

		// try and get the icon key from the top level link post_type= param of the link href so it matches up to remote data
		let $wpMenuLink = this.section.find('> a').first();
		if ($wpMenuLink.length > 0) {
			let linkHref = $wpMenuLink.attr('href');
			let qsIndex = linkHref.indexOf('?');

			if (qsIndex > -1) {
				let qs = linkHref.substr(linkHref.indexOf('?') + 1);
				let params = qs.split("&");

				for (let i = 0; i < params.length; i++) {
					let pairs = params[i].split('=');
					if (pairs.length === 2 && pairs[0] === 'post_type' && pairs[1].length > 0) {
						this.iconKey = pairs[1];
						break;
					}
				}
			}
		}

		if (!this.iconKey) {
			this.iconKey = this.section.attr('id');
		}

		this.classes.push(`jarvis__suggestion--${this.iconKey}`);

		if ($wpMenuIcon.length > 0) {
			if (!iconStore.get(this.iconKey)) {
				let computedStyle;

				switch (true) {
					case this.section.find('.wp-menu-image img').length > 0:
						// img tag inside icon - old school
						this.iconType = 'image';
						this.icon = this.section.find('.wp-menu-image img').first().attr('src');
						break;

					case $wpMenuIcon.hasClass('svg'):
						// base64 encoded svg
						computedStyle = window.getComputedStyle($wpMenuIcon.get(0));
						if (/^url\("data:image\/svg\+xml\;base64,/.test(computedStyle.backgroundImage)) {
							this.iconType = 'svg';
							this.icon = atob(computedStyle.backgroundImage.replace(/^url\("data:image\/svg\+xml\;base64,/, '').replace(/\"\)$/, ''));
							this.icon = this.icon.replace(/<\?xml [^>]+\?>/g, '').replace(/\sid="[^\"]+"/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<(title|desc|defs)>[^<]+?<\/(title|desc|defs)>/g, '');
						}
						break;

					case $wpMenuIcon.hasClass('dashicons-before'):

						computedStyle = window.getComputedStyle($wpMenuIcon.get(0), ':before');

						if (computedStyle.fontFamily === 'dashicons') {
							// proper dashicon
							this.iconType = 'dashicon';
							this.icon = $wpMenuIcon.attr('class').trim().split(' ').filter(c => ['dashicons-before', 'wp-menu-image'].indexOf(c) === -1).shift();
							this.iconClasses.push(this.icon);
							this.iconClasses.push('dashicons-before');
						} else {
							// custom icons on top of a dashicon using css (woocommerce does this)
							let style = document.getElementById('jarvis_style');
							if (!style) {
								style = document.createElement('style');
								style.type = 'text/css';
								style.id = 'jarvis_style';
								document.head.appendChild(style);
							}

							let css = `.jarvis__suggestion--${this.iconKey} .jarvis__icon::before { font-family: ${computedStyle.fontFamily}; content: ${computedStyle.content}; }` + "\n";

							style.appendChild(document.createTextNode(css));
						}
						break;
				}

				iconStore.add(this.iconKey, this.iconType, this.icon);
			}

			this.setIcon(this.iconKey);
		}
	}
}

/**
 * underscore template for typeahead suggestion
 */
const templates = {
	suggestion: _.template(`
		<span class="<% print( classes.join( ' ' ) ) %>">
			<a href="<%= href %>" data-type="<%= type %>">
				<span class="<% print( iconClasses.join( ' ' ) ) %>" style='<%= iconStyle %>' title="<%= prefix %>">
				<% if ( iconType === 'image' ) { %>
					<img src="<%= icon %>" alt="<%= title %>">
				<% } else if ( iconType === 'svg' ) { %>
					<%= icon %>
				<% } %>
				</span>
				<span class="jarvis__title" title="<%= title %>"><%= title %></span>
				<% if ( attributes ) { %>
					<span class="jarvis__pills">
						<% _.each( attributes, function(attr) { %>
							<span class="jarvis__pill"><%= attr %></span>
						<% } ); %>
					</span>
				<% } %>
			</a>
		</span>
	`)
};

export default class Jarvis {
	/**
	 * The main interface to Jarvis
	 *
	 * @param object settings
	 * @param array instants
	 */
	constructor(settings = {}, instants = []) {
		this.iconStore = iconStore;

		// default settings
		this.settings = {
			hotkey: '/',
			searchurl: '/wp-json/jarvis/v1/search',
		};

		// merge constructor settings with defaults
		for (const s in settings) {
			if (settings.hasOwnProperty(s)) {
				this.settings[s] = settings[s];
			}
		}

		// internal flag for modal open/close
		this.opened = false;

		// array for storing wordpress links as datums for autocomplete
		this.suggestions = [];

		// hold the instant suggestions to get processed after the menu links
		this.instants = instants;

		// the current search term to re-open the modal with the same term
		this.term = '';

		// flag for whether the ctrlKey is currently pressed
		this.ctrlKey = false;

		// outer jarvis node
		this.node = document.createElement('div');
		this.node.className = `jarvis jarvis--${this.settings.theme}`;
		this.node.id = 'jarvis';

		// modal node
		this.modal = document.createElement('div');
		this.modal.className = 'jarvis__modal';

		// modal overlay node
		this.overlay = document.createElement('div');
		this.overlay.className = 'jarvis__overlay';
		this.overlay.addEventListener('click', () => this.close());

		// search input node
		this.search = document.createElement('input');
		this.search.type = 'text';
		this.$search = $(this.search); // jquery version for typeahead

		// add our internal nodes to the outer node
		this.node.appendChild(this.overlay);
		this.node.appendChild(this.modal);
		this.modal.appendChild(this.search);

		// loading icon node
		this.loading = document.createElement('i');
		this.loading.className = 'jarvis__loading';

		// does the url argument match the searchurl
		this.isJarvisUrl = function (url) {
			const matches = (new URL(url, location.origin)).pathname.match(/^\/wp-json\/jarvis\//);
			return matches && matches.length > 0;
		}

		// test if constructor was called after the page is loaded, or on DOMContentLoaded
		if (/complete|loaded/.test(document.readyState)) {
			this.init();
		} else {
			document.addEventListener('DOMContentLoaded', this.init.bind(this));
		}
	}

	init() {
		// scrape wordpress menu for sidebar links
		$('#adminmenu a').each((i, elem) => {
			this.suggestions.push(new MenuSuggestion(elem));
			return;
		});

		// process the instant suggestions after the icons have been scraped
		if (Array.isArray(this.instants)) {
			this.suggestions = this.suggestions.concat(this.instants.map(inst => new Suggestion(inst)));
		}

		// Prevent Firefox from using quick search with the hotkey
		document.addEventListener('keydown', (e) => {
			if (e.key === this.settings.hotkey && !inputFocused()) {
				e.preventDefault();
				e.stopPropagation();
			}
		}, true); // use true for event capture

		// menu bar icon click
		$(document).on('click', '#wp-admin-bar-jarvis_menubar_icon a', (e) => {
			e.preventDefault();
			this.open();
		});

		// let the typeahead:selected event handle ctrl+click so it's consistent with keyboard ctrl+enter
		// prevent default for ajax actions
		$(document).on('click', '.jarvis__suggestion a', (e) => {
			if (e.ctrlKey === true || e.currentTarget.getAttribute('data-type') === 'ajax') {
				e.preventDefault();
				return;
			}
		});

		// record the ctrlKey status so we can use it in typeaheads custom triggered events
		$(document).on('keydown keyup', '#jarvis-search', (e) => {
			this.ctrlKey = e.ctrlKey;
		});

		// listen for hotkey
		$(document).on('keyup', (e) => {
			// handle esc key - must go before inputFocused check so we can close when jarvis search is focused
			if (this.opened && e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				this.close();
				return;
			}

			// return if editable field is focused
			if (inputFocused()) {
				return;
			}

			// open jarvis
			if (!this.opened && e.key === this.settings.hotkey) {
				e.preventDefault();
				e.stopPropagation();
				return this.open();
			}
		});

		// showing spinners & adding nonce headers
		$(document).ajaxSend((event, jqXHR, settings) => {
			if (this.opened && this.isJarvisUrl(settings.url)) {
				// add our loading icon to the UI
				this.modal.appendChild(this.loading);
				// add our nonce to the header so the rest api considers it a logged in request
				jqXHR.setRequestHeader('X-WP-Nonce', this.settings.nonce);
			}
		});

		// hiding spinners
		$(document).ajaxComplete((event, jqXHR, settings) => {
			if (this.opened && this.isJarvisUrl(settings.url) && this.loading.parentNode) {
				// hide our loading icon on ajaxComplete
				this.loading.parentNode.removeChild(this.loading);
			}
		});
	}

	open() {
		this.opened = true;
		document.body.appendChild(this.node); // append our primary node to the body

		this.$search.typeahead({
			hint: true,
			highlight: true,
			minLength: 1,
			classNames: {
				cursor: 'jarvis__cursor',
				dataset: 'jarvis__dataset',
				empty: 'jarvis__empty',
				highlight: 'jarvis__highlight',
				hint: 'jarvis__hint',
				input: 'jarvis__input',
				menu: 'jarvis__menu',
				open: 'jarvis__open',
				selectable: 'jarvis__selectable',
				suggestion: 'jarvis__suggestion',
				wrapper: 'jarvis__wrap',
			}
		}, {
			name: 'results',
			limit: 10,
			display: (str) => decodeEntities(str.title),
			source: new Bloodhound({
				local: this.suggestions,
				datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
				queryTokenizer: Bloodhound.tokenizers.whitespace,
				remote: {
					url: `${this.settings.searchurl}?q=%s`,
					wildcard: '%s',
					transform: (response) => {
						if (Array.isArray(response)) {
							return response.map((data) => new Suggestion(data, 'remote'));
						}

						return response;
					},
				}
			}),
			templates: {
				suggestion: (data) => templates.suggestion(data),
			}
		});

		this.$search.on('typeahead:select', (e, item) => {
			if (item.type === 'ajax') {
				return this.ajax(item);
			}

			if (this.ctrlKey) {
				window.open(item.href, '_blank');
			} else {
				location.href = item.href;
			}
		});

		this.$search.on('keyup', () => {
			this.term = this.search.value;
		});

		this.$search.typeahead('val', this.term);
		this.$search.focus().select();

		return this;
	}

	close() {
		this.opened = false;
		this.node.parentNode.removeChild(this.node);
		this.$search.typeahead('destroy');

		return this;
	}

	toggle() {
		return (this.opened) ? this.close() : this.open();
	}

	ajax(item) {
		this.modal.appendChild(this.loading);

		$.ajax({
			url: item.href,
			success: (data, status, jqXHR) => {
				this.term = '';
				if (this.loading.parentNode) {
					this.modal.removeChild(this.loading);
				}

				this.close();
			},
			error: (jqXHR, status, error) => {
				if (this.loading.parentNode) {
					this.modal.removeChild(this.loading);
				}
			}
		});
	}
}
