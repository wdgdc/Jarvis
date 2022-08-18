import $ from 'jquery';

export default class UserProfile {
	constructor() {
		this.hotKey = document.getElementById('jarvis_hotkey');

		if (this.hotKey) {
			this.hotKey.addEventListener('keydown', (e) => {
				if (!e.key.match(/^[a-z0-9\;\\\|\=\,\-\.\/\`\[\]]$/)) {
					e.preventDefault();
					return;
				}
			});

			const hotKeySelect = () => {
				this.hotKey.select();
			}

			this.hotKey.addEventListener('focus', hotKeySelect);
			this.hotKey.addEventListener('keyup', hotKeySelect);
		}

		this.jarvisThemeSelect = document.querySelector('select[name="jarvis_theme"]');

		if (this.jarvisThemeSelect) {
			this.jarvisThemeSelect.addEventListener('change', () => {
				let scheme;
				if (this.matchColorScheme()) {
					scheme = document.querySelector('#color-picker input[type="radio"]:checked').value;
				} else {
					scheme = this.jarvisThemeSelect.value
				}

				this.changeScheme(scheme);
			});
		}

		$('#color-picker').on('click.colorpicker', '.color-option', (e) => {
			if (this.matchColorScheme()) {
				this.changeScheme(e.currentTarget.querySelector('input[type="radio"]').value);
			}
		});
	}

	changeScheme(scheme) {
		Array.from(document.body.classList).forEach(className => {
			if (className.match(/^jarvis-theme-/)) {
				document.body.classList.remove(className);
			}
		});

		document.body.classList.add(`jarvis-theme-${scheme}`);
	}

	matchColorScheme() {
		return ['', 'wp'].includes(this.jarvisThemeSelect.value);
	}
}
