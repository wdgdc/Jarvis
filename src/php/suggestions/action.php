<?php

namespace Jarvis\Suggestions;

abstract class Action {

	const REST_PREFIX = 'jarvis/v1';

	protected $rest_route;
	protected $rest_methods = [];
	protected $rest_args = [];
	protected $rest_permission_callback = 'is_user_logged_in';

	public function current_user_can() {
		return current_user_can( 'read' );
	}

	public function register_rest_route() {
		if ( ! empty( $this->rest_route ) ) {
			register_rest_route(
				self::REST_PREFIX,
				'/' . $this->rest_route . '/',
				[
					'args'                => $this->rest_args,
					'callback'            => [ $this, 'rest_route' ],
					'methods'             => $this->rest_methods,
					'permission_callback' => [ $this, 'current_user_can' ],
				]
			);
		}
	}

	public function rest_route() {
		return new \WP_Error( 'This route must be overriden' );
	}

}
