<?php

namespace Jarvis\Models;

class Menu extends Model {

	public function __construct( $menu_id ) {
		$menu = wp_get_nav_menu_object( $menu_id );

		$this->id       = $menu->term_id;
		$this->type     = 'Nav Menu';
		$this->href     = sprintf( 'nav-menus.php?action=edit&menu=%d', $this->id );
		$this->title    = $menu->name;
		$this->slug     = $menu->slug;
		$this->icon     = 'dashicons-menu';
		$this->iconType = 'dashicon';
		$this->iconKey  = 'nav_menu';
		$this->kind     = 'menu';
	}
}