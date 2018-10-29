Jarvis.UserProfile = ( function( $ ) {

	return class {
		constructor( options ) {

			this.options = {
				version: '',
				jarvisUri: '/wp-content/themes/jarvis',
			};

			for( let opt in options ) {
				if ( options.hasOwnProperty( opt ) ) {
					this.options[ opt ] = options[ opt ];
				}
			}

			this.hotKey  = document.getElementById('jarvis_hotkey');

			if ( this.hotKey ) {
				this.hotKey.addEventListener( 'keydown', (e) => {
					if ( ! e.key.match(/^[a-z0-9\;\\\|\=\,\-\.\/\`\[\]]$/) ) {
						e.preventDefault();
						return;
					}
				} );

				const hotKeySelect = () => {
					this.hotKey.select();
				}

				this.hotKey.addEventListener('focus', hotKeySelect);
				this.hotKey.addEventListener('keyup', hotKeySelect);
			}

			this.jarvisThemeCss = document.getElementById('wp-jarvis-theme-css');
			if ( this.jarvisThemeCss ) {
				this.jarvisThemeCss.setAttribute('data-href', this.jarvisThemeCss.href);
			}

			this.jarvisThemeSelect = document.querySelector('select[name="jarvis_theme"]');

			if ( this.jarvisThemeSelect ) {
				this.jarvisThemeSelect.addEventListener( 'change', () => {
					this.changeScheme( this.jarvisThemeSelect.value );
				});
			}

			$('#color-picker').on( 'click.colorpicker', '.color-option', (e) => {
				if ( this.jarvisThemeSelect.value === '' ) {
					this.changeScheme( $(e.currentTarget).find( 'input[type="radio"]' ).val() );
				}
			} );
		}

		changeScheme( scheme ) {
			if ( this.jarvisThemeCss ) {
				this.jarvisThemeCss.href = `${this.options.jarvisUri}/dist/themes/${scheme}.css?ver=${this.options.version}`;
			}
		}
	}

})( jQuery );
