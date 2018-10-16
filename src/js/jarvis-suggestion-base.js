class JarvisSuggestionBase {
	constructor() {
		this.id          = null;
		this.section     = null;
		this.prefix      = '';
		this.title       = '';
		this.kind        = 'href';
		this.href        = '';
		this.icon = {
			type: 'dashicon',
			style: '',
			classes: [
				'jarvis-icon',
				'dashicons-before'
			],
		};
	}
}