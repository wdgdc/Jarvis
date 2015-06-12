<div class="wrap">
	<?php screen_icon() ?>
	<h2>Jarvis Settings</h2>

	<?php
		settings_fields('jarvis_settings');
		do_settings_fields('jarvis_settings', 'default');
		submit_button();
	?>
</div>
