/* global util, options, Bloodhound, Hogan */

class Jarvis {
    constructor(options) {
        this.settings = {
            keyCode: 191,
            separator: '»',
            loadingimg: '/wp-content/plugins/wp-jarvis/img/wpspin.gif'
        };

        $.extend(this.settings, options); // defaults and extend options

        this.settings.keyCode = parseInt(this.settings.keyCode, 10);

        this.opened = false;
        this.localData = []; // array for storing wordpress links as datums for autocomplete

        this.modal = util.createElement('div', {
            id: 'jarvis-modal'
        }); // modal reference

        this.search = util.createElement('input', {
            type: 'text',
            id: 'jarvis-search'
        }); // search input reference

        this.overlay = util.createElement('div', {
            id: 'jarvis-overlay'
        }); // background reference

        this.overlay.addEventListener('click', () => this.close(), true);
        this.term = '';

        this.loading = util.createElement('img', {
            src: this.settings.loadingimg,
            id: 'jarvis-loading'
        });

        this.templates = {};
        this.templates.suggestion = Hogan.compile([
            '<span class="{{prefix}} {{kind}}">',
            '<a href="{{href}}">',
            '<span class="jarvis-icon {{iconclass}}" style="{{image}}" title="{{prefix}}"></span>',
            '<span class="jarvis-title" title="{{{title}}}">{{{title}}}</span>',
            '</a>',
            '</span>'
        ].join('\n'));

        this.icons = {};
        this.iconMap = {
            'attachment': {
                'image-icon': 'media',
                'dashicon': 'dashicons-admin-media'
            },
            'category': {
                'image-icon': 'posts',
                'dashicon': 'dashicons-category'
            },
            'nav_menu': {
                'image-icon': 'appearance',
                'dashicon': 'dashicons-admin-appearance'
            },
            'nav_menu_item': {
                'image-icon': 'appearance',
                'dashicon': 'dashicons-admin-appearance'
            },
            'page': {
                'image-icon': 'pages',
                'dashicon': 'dashicons-admin-page'
            },
            'post': {
                'image-icon': 'posts',
                'dashicon': 'dashicons-admin-post'
            },
            'post_tag': {
                'image-icon': 'posts',
                'dashicon': 'dashicons-tag'
            },
            'post_format': {
                'image-icon': 'posts',
                'dashicon': 'dashicons-format-standard'
            },
            'term': {
                'image-icon': 'posts',
                'dashicon': 'dashicons-category'
            }
        };

        // test if constructor was called after the page is loaded, or on DOMContentLoaded
        if (/complete|loaded/.test(document.readyState)) {
            this.init();
        } else {
            document.addEventListener('DOMContentLoaded', _ => this.init());
        }
    }

    close(e) {
        this.opened = false;
        this.overlay.parentNode.removeChild(this.overlay);
        this.modal.parentNode.removeChild(this.modal);
        $(this.search).typeahead('destroy');
    }

    init() {
            let entry;
            let { dashicons, keyCode, separator } = this.settings;

            $('#wp-admin-bar-jarvis_menubar_icon a').on('click', e => this.open(e));

            // scrape wordpress menu for sidebar links
            $('#adminmenu a').each((i, elem) => {
                let prefix, section, title, slug, sanitize, icon;

                // remove child span element counts from section name
                sanitize = (elem) => $(elem).clone().find('span').remove().end().text();
                section = $(this).closest('.menu-top');
                prefix = sanitize(section.find('a > .wp-menu-name'));
                title = sanitize(this);

                // Get section icon by calculating live background image and position
                icon = (() => {
                    let [bg] = section.find('.wp-menu-image');
                    let [img] = section.find('.wp-menu-image img');
                    let styles, classes;

                    if (bg && bg.className.indexOf('dashicons-before') > -1) {
                        classes = bg.className.split(' ');
                        classes.splice($.inArray('wp-menu-image', classes), 1);
                        classes.splice($.inArray('dashicons-before', classes), 1);
                        let [icon] = classes;

                        return {
                            type: 'dashicon',
                            icon
                        };
                    } else if (img) {
                        // icon is image (plugin based)
                        return {
                            type: 'image',
                            icon: `background-image:url(${img.src});background-position:center`
                        };
                    } else if (bg) {
                        // icon is background image, possibly sprite (thus the background-position calculation);
                        styles = util.getComputedStyle(bg);
                        if (typeof styles.backgroundPosition === 'string') { //
                            return {
                                type: 'image',
                                icon: `background-image:${styles.backgroundImage};background-position:${styles.backgroundPosition}`
                            };
                        } else {
                            return {
                                type: 'image',
                                icon: `background-image:${styles.backgroundImage};background-position-x:${styles.backgroundPositionX};background-position-y:${styles.backgroundPositionY}`
                            };
                        }
                    } else {
                        return null;
                    }
                })();

                // store reference in icons object to match later with types from server
                this.icons[prefix.toLowerCase()] = icon;

                switch (true) {
                    // if prefix is empty or same as title just use the title
                    case prefix === '':
                    case prefix === title:
                        slug = title;
                        break;
                        // use the section name and the title for default
                    default:
                        slug = prefix + ' ' + separator + ' ' + title;
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

                    switch (icon.type) {
                        case 'dashicon':
                            entry.iconclass = `dashicons-before ${icon.icon}'`;
                            entry.image = '';
                            break;
                        case 'image':
                            entry.iconclass = 'image-icon';
                            entry.image = icon.icon;
                            break;
                    }
                }

                this.localData.push(entry);
            });

            for (let icon in this.iconMap) {
                if (this.iconMap.hasOwnProperty(icon)) {
                    this.icons[icon] = (dashicons) ? this.iconMap[icon] : this.icons[this.iconMap[icon]['image-icon']];
                }
            }

            // Prevent Firefox from using quick search with keyCode
            if (document.addEventListener) {
                document.addEventListener('keydown', e => {
                    if (e.keyCode === keyCode && !util.inputInFocus(e)) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }, true); // use true for event capture
            }

            // listen for keyCode
            $(document).on('keyup', e => this.keystroke(e));

            // resize jarvis window on resize
            $(window).on('resize', () => {
                if (this.opened) {
                    this.resize(...args);
                }
            });

            // showing spinners
            $(document).ajaxSend((event, jqXHR, settings) => {
                if (this.opened && util.isJarvisXhr(..args)) {
                    this.modal.appendChild(this.loading);
                }
            });

            // hiding spinners
            $(document).ajaxComplete((event, jqXHR, settings) => {
                if (this.opened && util.isJarvisXhr(..args)) {
                    this.loading.parentNode.removeChild(this.loading);
                }
            });
        },

        keystroke(e) {
            e.preventDefault();
            e.stopPropagation();

            switch (true) {
                // handle esc key
                case this.opened && e.keyCode === 27:
                    this.close();
                    break;
                    // return if editable field is focused
                case util.inputInFocus(e):
                    return;
                    // open jarvis
                case !this.opened && e.keyCode === keyCode:
                    this.open();
                    break;
            }
        }

    go(e, data, type) {
        location.href = data.href;
    }

    open(e) {

        if (e && e.preventDefault) {
            e.preventDefault();
        }

        let { dashicons, nonce } = this.settings;
        this.opened = true;
        this.modal.appendChild(this.search);
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.modal);
        this.modal.style.marginLeft = Math.ceil(-1 * this.modal.offsetWidth / 2) + 'px';

        $(this.search).typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'results',
                limit: 10,
                display: 'title',
                source: new Bloodhound({
                    local: this.localData,
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    remote: {
                        url: `${window.ajaxurl}?action=jarvis-search&q=%s&nonce=${nonce}`,
                        wildcard: '%s',
                        transform: response => {
                            return response.data.map(data => {
                                data.icon = (this.icons[data.type] !== undefined) ? this.icons[data.type] : this.icons.post;
                                data.iconclass = (dashicons) ? 'dashicons-before ' + data.icon.dashicon : 'image-icon';
                                data.image = data.icon.icon;
                                return data;
                            });
                        }
                    }
                }),
                templates: {
                    suggestion: data => this.templates.suggestion.render(data)
                }
            })
            .on('typeahead:selected', () => this.go(..args))
            .on('keyup', () => this.term = this.value)
            .typeahead('val', this.term).focus();
    }

    resize() {
        this.modal.style.marginLeft = `${Math.max(-1 * this.modal.offsetWidth / 2)}px`;
    }

}

window.Jarvis = Jarvis;