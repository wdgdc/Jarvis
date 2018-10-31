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
					let scheme;
					if ( this.matchColorScheme() ) {
						scheme = document.querySelector('#color-picker input[type="radio"]:checked').value;
					} else {
						scheme = this.jarvisThemeSelect.value
					}

					this.changeScheme( scheme );
				});
			}

			$('#color-picker').on( 'click.colorpicker', '.color-option', (e) => {
				if ( this.matchColorScheme() ) {
					this.changeScheme( e.currentTarget.querySelector( 'input[type="radio"]' ).value );
				}
			} );
		}

		changeScheme( scheme ) {
			if ( this.jarvisThemeCss ) {
				let themeOption = this.jarvisThemeSelect.querySelector( `option[value="${scheme}"]` );
				if ( themeOption ) {
					this.jarvisThemeCss.href = themeOption.getAttribute('data-uri');
				}
			}
		}

		matchColorScheme() {
			return [ '', 'wp' ].indexOf( this.jarvisThemeSelect.value ) > -1;
		}
	}

})( jQuery );
