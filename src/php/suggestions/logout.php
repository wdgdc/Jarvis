<?php

namespace Jarvis\Suggestions;

class Logout {

	public function get() {
		$action = new \Jarvis\Models\Action();
		$action->id = 'logout';
		$action->slug = 'logout';
		$action->title = 'Logout';
		$action->iconKey = 'logout';
		$action->iconType = 'dashicon';
		$action->icon = 'dashicons-migrate';

		$action->href = add_query_arg( [
			'action' => 'logout',
			'_wpnonce' => wp_create_nonce( 'log-out' )
		], home_url( 'wp-login.php' ) );

		return $action;
	}

}
