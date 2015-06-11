var Jarvis = (function(window, $) {
	'use strict';
	
	var jarvis, util;
	
	util = {
		// shortcut for creating elements with attributes and innerHTML (not a fan of the jquery way)
		createElement:function(tag, atts, html) {
			var elem = document.createElement(tag);
			if (atts) for(var att in atts) elem.setAttribute(att, atts[att]);
			if (html) elem.innerHTML = html;
			return elem;
		},
		// returns boolean if page focus is in an editable area
		inputInFocus:function(e) {
			return /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.target.contentEditable === 'true';		
		},
		isJarvisXhr:function(e, jqXHR, settings) {
			return /action=jarvis-search/.test(settings.url);
		},
		getComputedStyle:function(elem) {
			return (window.getComputedStyle) ? window.getComputedStyle(elem, false) : elem.currentStyle;
		},
		// trim whitespace from string
		trim:function(str) {
			return (String.prototype.trim) ? str.trim() : str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
	}

	jarvis = function(opts) {
		var self = this; // closure reference to instance
		this.settings = {hotkey: 191,separator:'»',loadingimg:'/wp-content/plugins/wp-jarvis/img/wpspin.gif'}; 
		$.extend(this.settings, opts); 	// defaults and extend options
		
		this.localData = []; // array for storing wordpress links as datums for autocomplete
		this.modal = util.createElement('div', {id:'jarvis-modal'}); // modal reference
		this.search = util.createElement('input', {type:'text',id:'jarvis-search'}); // search input reference
		this.overlay = util.createElement('div', {id:'jarvis-overlay'}); // background reference
		this.loading = util.createElement('img', {src: this.settings.loadingimg, id:'jarvis-loading'});
		$(this.overlay).on('click', function(e) { // listener for clicking on background
			self.close(e);
		});
		
		// object to store scraped icons from wordpress admin
		this.icons = {};
		
		// test if constructor was called after the page is loaded, or on jQuery.ready
		if (/complete|loaded/.test(document.readyState)) {
			this.init();
		} else {
			$(function(e) {
				self.init.call(self, e);
			});
		}
	}
	
	jarvis.prototype = {
		// close method
		close:function(e) {
			this.opened = false;
			this.overlay.parentNode.removeChild(this.overlay);
			this.modal.parentNode.removeChild(this.modal);
			$(this.search).typeahead('destroy');
		},
		init:function() {
			var self = this, option, links, section, node, iconMap, entry;
			
			// scrape wordpress menu for sidebar links
			$('#adminmenu a').each(function(i, elem) {
				var prefix, section, title, slug, sanitize, icon;
				
				// remove child span element counts from section name
				sanitize = function(elem) {
					return $(elem).clone().find('span').remove().end().text();
				}
				section = $(this).closest('.menu-top')
				prefix = sanitize(section.find('a > .wp-menu-name')); 
				title = sanitize(this);
				
				// Get section icon by calculating live background image and position
				icon = (function() {
					var bg = section.find('.wp-menu-image')[0], 
						img = section.find('.wp-menu-image img')[0], 
						styles, 
						classes;
					
					if (bg && bg.className.indexOf('dashicons-before') > -1) {
						classes = bg.className.split(' ');
						classes.splice($.inArray('wp-menu-image', classes), 1);
						classes.splice($.inArray('dashicons-before', classes), 1);
						return {
							type: 'dashicon',
							icon: classes[0]
						};
					} else if (img) {
						// icon is image (plugin based)
						return {
							type: 'image',
							icon: 'background-image:url(' + img.src + ');background-position:center'
						};
					} else if (bg) {
						// icon is background image, possibly sprite (thus the background-position calculation);
						styles = util.getComputedStyle(bg);
						if (typeof styles.backgroundPosition === 'string') { // 
							return {
								type: 'image',
								icon: 'background-image:' + styles.backgroundImage + ';background-position:' + styles.backgroundPosition
							};
						} else {
							return {
								type: 'image',
								icon: 'background-image:' + styles.backgroundImage + ';background-position-x:'+ styles.backgroundPositionX +';background-position-y:'+ styles.backgroundPositionY
							};
						}							
					} else {
						return null;
					}
				})();
								
				// store reference in icons object to match later with types from server
				self.icons[prefix.toLowerCase()] = icon;
				
				
				switch(true) {
					// if prefix is empty or same as title just use the title
					case prefix === '':
					case prefix === title: 
						slug = title; 
						break;
					// use the section name and the title for default
					default:
						slug = prefix + ' ' + self.settings.separator + ' ' + title;
				}
				
				entry = {
					id: this.id || null,
					kind: 'href',
					href: this.href,
					prefix: util.trim(prefix).toLowerCase(),
					title: util.trim(slug),
					type: 'menu',
				};
				if (icon) {
					entry.icontype = icon.type;
					switch(icon.type) {
						case 'dashicon':
							entry.iconclass = 'dashicons-before '+ icon.icon;
							entry.image = '';
						break;
						case 'image':
							entry.iconclass = 'image-icon';
							entry.image = icon.icon;
						break;
					}
				}
				
				self.localData.push(entry);
			});
			
			iconMap = {
				'attachment':{
					'image-icon':'media',
					'dashicon':'dashicons-admin-media'
				},
				'category':{
					'image-icon':'posts',
					'dashicon':'dashicons-category'
				},
				'nav_menu':{
					'image-icon':'appearance',
					'dashicon':'dashicons-admin-appearance'
				},
				'nav_menu_item':{
					'image-icon':'appearance',
					'dashicon':'dashicons-admin-appearance'
				},
				'page':{
					'image-icon':'pages',
					'dashicon':'dashicons-admin-page'
				},
				'post':{
					'image-icon':'posts',
					'dashicon':'dashicons-admin-post'
				},
				'post_tag':{
					'image-icon':'posts',
					'dashicon':'dashicons-tag'
				},
				'post_format':{
					'image-icon':'posts',
					'dashicon':'dashicons-format-standard'
				},
				'term':{
					'image-icon':'posts',
					'dashicon':'dashicons-category'
				}
			}
			for(var icon in iconMap) {
				if (iconMap.hasOwnProperty(icon)) {
					self.icons[icon] = (self.settings.dashicons) ? iconMap[icon] : self.icons[iconMap[icon]['image-icon']];
				}
			}
			
			// Prevent Firefox from using quick search with hotkey
			if (document.addEventListener) {
				document.addEventListener('keydown', function(e) {
					if (e.keyCode === self.settings.hotkey && !util.inputInFocus(e)) {
						e.preventDefault();
						e.stopPropagation();
					}
				}, true); // use true for event capture
			}
			
			// listen for hotkey
			$(document).on('keyup', function() {
  				self.keystroke.apply(self, arguments);				
			});
			
			// resize jarvis window on resize
			$(window).on('resize', function() {
				if (self.opened) {
					self.resize.apply(self, arguments);
				}
			});
			
			// showing spinners
			$(document).ajaxSend(function(event, jqXHR, settings) {
				if (self.opened && util.isJarvisXhr.apply(this, arguments)) {
					self.modal.appendChild(self.loading);
				}
			});
			// hiding spinners
			$(document).ajaxComplete(function(event, jqXHR, settings) {
				if (self.opened && util.isJarvisXhr.apply(this, arguments)) {
					self.loading.parentNode.removeChild(self.loading);
				}
			});
		},
		keystroke:function(e) {
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
				case !this.opened && e.keyCode === this.settings.hotkey: 
					this.open();
					break;
			}			
		},
		go:function(e, data, type) {
			location.href = data.href;
		},
		open:function(e) {
			var self = this;
			if (e && e.preventDefault) e.preventDefault();
			this.opened = true;
			this.modal.appendChild(this.search);
			document.body.appendChild(this.overlay);
			document.body.appendChild(this.modal);
			this.modal.style.marginLeft = Math.max(-1 * this.modal.offsetWidth / 2) + 'px';
						
			$(this.search).typeahead([
				{
					engine: Hogan,
					name: 'local',
					limit: 5,
					local: self.localData,
					template: [
						'<span class="{{prefix}} {{kind}}">',
							'<a href="{{href}}">',
								'<span class="jarvis-icon {{iconclass}}" style="{{image}}" title="{{prefix}}"></span>',
								'<span class="jarvis-title" title="{{{title}}}">{{{title}}}</span>',
							'</a>',
						'</span>'
					].join(''),
					valueKey: 'title'
				}, 
				{
					engine: Hogan,
					name: 'remote',
					limit: 20,
	 				remote: {
						cache: false,
						dataType: 'json',
						filter:function(datums) {
							for(var i=0; i<datums.length; i++) {
	              datums[i].icon = (self.icons[datums[i].type] != undefined ) ? self.icons[datums[i].type] : self.icons['post'];
								datums[i].iconclass = (self.settings.dashicons) ? 'dashicons-before '+ datums[i].icon.dashicon : 'image-icon';
								datums[i].image = datums[i].icon.icon;
							}
							return datums;
						},
						maxParallelRequests: 10,
						url: ajaxurl + '?action=jarvis-search&q=%QUERY'
					},
					template: [
						'<span class="{{kind}}">',
							'<a href="{{href}}">',
								'{{#att_src}}<span class="jarvis-thumbnail"><img src="{{att_src}}"></span>{{/att_src}}',
								'<span class="jarvis-icon {{iconclass}}" style="{{image}}" title="{{type}}"></span>',
								'<span class="jarvis-title" title="{{{title}}}">{{{title}}}</span>',
							'</a>',
						'</span>'
					].join(''),
					valueKey: 'title'
				}
			]).typeahead('setQuery', '').on('typeahead:selected', function() {
				self.go.apply(self, arguments);
			});
			this.search.focus();			
		},
		resize:function() {
			this.modal.style.marginLeft = Math.max(-1 * this.modal.offsetWidth / 2) + 'px';
		}
	}
	
	return jarvis;
})(this, jQuery);
