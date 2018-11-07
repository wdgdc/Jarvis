<?php
/*
Plugin Name: Jarvis
Plugin URI: http://www.wpjarvis.com
Description: Jarvis is your administration assistant, putting WordPress at your fingertips.
Version: 1.0.3
Author:	The Web Development Group, David Everett, Joan Piedra, Kurtis Shaner, Doug Axelrod
Author URI: http://www.wdg.co
License: GPLv2 or later
Text Domain: jarvis
*/

namespace Jarvis;

define( 'JARVIS_PATH', __DIR__ );
define( 'JARVIS_URI', plugins_url( '', __FILE__ ) );

spl_autoload_register( function( $class_name ) {
	if ( ! preg_match( '/^' . __NAMESPACE__ . '/', $class_name ) ) {
		return;
	}

	$path = preg_replace( '/^' . __NAMESPACE__. '/', __DIR__ . '/src/php', $class_name );
	$path = strtolower( str_replace( [ '\\', '_' ], [ '/', '-' ], $path ) ) . '.php';

	if ( file_exists( $path ) ) {
		require_once $path;
	}
} );

add_action( 'plugins_loaded', __NAMESPACE__ . '\Plugin::get_instance' );
