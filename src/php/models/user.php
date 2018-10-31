<?php

namespace Jarvis\Models;

class User extends Model {

	public function __construct( $user ) {
		$user = ( is_numeric( $user ) ) ? get_user_by( 'id', $user ) : $user;

		$this->id    = $user->ID;
		$this->type  = 'user';
		$this->title = $user->display_name;
		$this->slug  = $user->user_login;
		$this->kind  = 'user';
		$this->href  = admin_url( sprintf( 'user-edit.php?user_id=%d', $user->ID ) );

		array_push( $this->attributes, $this->slug );

		$avatar = get_avatar_data( $this->id, [
			'size' => [ 28, 28 ],
		] );

		if ( ! empty( $avatar['found_avatar'] ) ) {
			$this->iconType = 'image';
			$this->icon = $avatar['url'];
		} else {
			$this->icon = 'dashicons-users';
		}

		parent::__construct();
	}
}