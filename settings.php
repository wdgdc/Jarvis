<div class="wrap">
	<? screen_icon() ?>
	<h2>Jarvis Settings</h2>

	<form method="post" action="options.php" id="jarvis-settings">

		<? 
		settings_fields('jarvis_settings');
        do_settings_sections( 'jarvis_settings' );
		//do_settings_fields('jarvis_settings');
		?>
		<!--
		<p><label for="jarvis_hotkey">HotKey</label> <input type="text" id="jarvis_hotkey" name="jarvis_hotkey" maxlength="1" size="1" style="text-align:center"></p>
		<input type="hidden" id="jarvis_keycode" name="jarvis_keycode">
		-->
		<? submit_button(); ?>

	</form>
</div>

<script>
(function($) {
	var hotkey = document.getElementById('jarvis_hotkey'), keycode = document.getElementById('jarvis_keycode'), form = document.getElementById('jarvis_settings');
	$(hotkey).on('keypress', function(e) {
		if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
			alert('Please do not use a the Shift, Control, Option or Command Keys when selecting a HotKey');
			return false;
		}
		keycode.value = e.which;
	});
	
	/*
	$(form).on('submit', function(e) {
		e.preventDefault();
		$.post(
			ajaxurl + '?action=jarvis_settings',
			$(this).serialize(),
			function(data, status, xhr) {
				console.log(arguments);
				alert(data);
			}
		);
	})
	*/
})(jQuery);
</script>
