<?php

namespace Jarvis\Suggestions;

class Menus {

	public function current_user_can() {
		return current_user_can( 'manage_options' );
	}

	public function get() {
		$menus = wp_get_nav_menus();

		if ( empty( $menus ) ) {
			return [];
		}

		return array_map(
			function( $menu ) {
				return new \Jarvis\Models\Menu( $menu->term_id );
			},
			$menus
		);
	}

}