<?php

namespace Jarvis\Suggestions;

class Flush_Rewrite_Rules extends Action {

	protected $rest_route = 'flush_rewrite_rules';
	protected $rest_args = [];
	protected $rest_methods = [ 'GET' ];

	public function current_user_can() {
		return current_user_can( 'manage_options' );
	}

	public function get() {
		$action = new \Jarvis\Models\Action();

		$action->title = 'Flush Rewrite Rules';
		$action->href  = rest_url( self::REST_PREFIX . '/' . $this->rest_route );
		$action->type  = 'ajax';
		$action->icon  = 'dashicons-update';

		return $action;
	}

	public function rest_route() {
		update_option( 'rewrite_rules', '' );
		flush_rewrite_rules();

		$rules = get_option( 'rewrite_rules' );

		return $rules;
	}
}
