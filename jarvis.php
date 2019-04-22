<?php
/*
Plugin Name: Jarvis
Plugin URI: http://www.wpjarvis.com
Description: Jarvis is your administration assistant, putting WordPress at your fingertips.
Version: 1.0.4
Author:	The Web Development Group, David Everett, Joan Piedra, Kurtis Shaner, Doug Axelrod
Author URI: http://www.wdg.co
License: GPLv2 or later
Text Domain: jarvis
*/

namespace Jarvis;

define( 'JARVIS_PATH', __DIR__ );
define( 'JARVIS_URI', plugins_url( '', __FILE__ ) );

require_once 'src/php/plugin.php';

Plugin::get_instance();
