<?php

namespace Jarvis;

class Plugin {

	/**
	 * Le version of le plugin
	 */
	const VERSION = '1.0.6';

	/**
	 * Holds our plugin instance
	 *
	 * @access private
	 */
	private static $_instance;

	/**
	 * Get the instance of the plugin through the singleton pattern
	 *
	 * @access public
	 */
	public static function get_instance() {
		if ( empty( self::$_instance ) ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}

	/**
	 * List of available user themes, any empty user setting (default) will attempt to match the WordPress color scheme
	 *
	 * @access private
	 */
	private $themes = [
		'wp'              => 'Match WordPress Theme',
		'fresh'           => 'Fresh',
		'light'           => 'Light',
		'blue'            => 'Blue',
		'coffee'          => 'Coffee',
		'ectoplasm'       => 'Ectoplasm',
		'midnight'        => 'Midnight',
		'ocean'           => 'Ocean',
		'sunrise'         => 'Sunrise',
		'one-dark'        => 'One Dark',
		'solarized-dark'  => 'Solarized Dark',
		'solarized-light' => 'Solarized Light',
	];

	/**
	 * User options that get fed into the javascript constructor
	 *
	 * @access private
	 */
	private $options = [
		'hotkey'    => '/',
		'nonce'     => null,
		'searchurl' => '/wp-json/jarvis/v1/search',
		'theme'     => 'wp',
	];

	/**
	 * Additional autocomplete entires
	 *
	 * @see $this->get_suggestions to add additional suggestions via the jarvis/suggestions filter
	 */
	private $suggestions = [];

	/**
	 * List of instant result classes that will be available
	 *
	 * @access private
	 */
	private $_instants = [
		'Jarvis\Suggestions\Recent',
		'Jarvis\Suggestions\Menus',
		'Jarvis\Suggestions\Logout',
		'Jarvis\Suggestions\Flush_Rewrite_Rules',
	];

	/**
	 * Holds instances of instants by key
	 *
	 * @see admin_init
	 */
	private $instants = [];

	/**
	 * This is the auto loader for all classes in the current namespace
	 * All file names must be kebab-cased and class names Snake_Cased
	 *
	 * @param string $class_name
	 * @return void
	 * @access public
	 */
	public static function autoload( $class_name ) {
		if ( ! preg_match( '/^' . preg_quote( __NAMESPACE__, '/' ) . '/', $class_name ) ) {
			return;
		}

		// remove namespace from classname
		$path = preg_replace( '/^' . preg_quote( __NAMESPACE__, '/' ) . '/', '', $class_name );
		// replace \ with / and  _ with -
		$path = str_replace( [ '\\', '_' ], [ '/', '-' ], $path );
		// convert to lowercase
		$path = strtolower( $path );
		// add php extension
		$path = $path . '.php';

		// prepend current dir
		$path = __DIR__ . $path;

		if ( file_exists( $path ) ) {
			require_once $path;
		}
	}

	/**
	 * Add our wordpress hooks
	 *
	 * @access private
	 */
	private function __construct() {
		spl_autoload_register( [ __CLASS__, 'autoload' ] );
		add_action( 'admin_bar_menu', [ $this, 'admin_bar_menu' ] , 100 );
		add_action( 'admin_enqueue_scripts', [ $this, 'admin_enqueue_scripts' ] );
		add_action( 'admin_init', [ $this, 'admin_init' ], 20 );
		add_action( 'edit_user_profile_update', [ $this, 'edit_user_profile_update' ] );
		add_action( 'edit_user_profile', [ $this, 'show_user_profile' ] );
		add_action( 'personal_options_update', [ $this, 'edit_user_profile_update' ] );
		add_action( 'rest_api_init', [ $this, 'rest_api_init' ], 20 );
		add_action( 'show_user_profile', [ $this, 'show_user_profile' ] );
	}

	/**
	 * Initialize all our instant suggestions classes
	 *
	 * @action admin_init
	 * @access public
	 * @priority 20
	 */
	public function admin_init() {
		$this->get_instants();

		/**
		 * filter the list of themes to add custom themes or remove themes
		 *
		 * @name jarvis/themes
		 * @param array - list of built in themes
		 * @return array
		 *
		 * @since 1.0.0
		 */
		$this->themes = apply_filters( 'jarvis/themes', $this->themes );
	}

	/**
	 * Add any rest routes from our instants & search endpoints
	 *
	 * @action rest_api_init
	 * @access public
	 * @priority 20
	 */
	public function rest_api_init() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$this->get_instants();

		register_rest_route(
			Suggestions\Action::REST_PREFIX, '/search/', [
				'methods' => 'GET',
				'callback' => function( $request ) {
					return ( new Suggestions\Search() )->get( $request->get_param( 'q' ) );
				},
				'permission_callback' => 'is_user_logged_in',
			]
		);

		if ( ! empty( $this->instants ) ) {
			foreach( $this->instants as $instant ) {
				if ( is_callable( [ $instant, 'register_rest_route' ] ) ) {
					$suggestions = $instant->register_rest_route();
				}
			}
		}
	}

	/**
	 * Instantiate our instant classes along with a filter for 3rd parties
	 *
	 * @return array
	 * @access private
	 */
	private function get_instants() {
		if ( empty( $this->instants ) ) {

			/**
			 * filter the list of instant classes that provide instant suggestions through their `get` method
			 *
			 * @name jarvis/instants
			 * @param array $this->_instants - list of class name strings
			 * @return array
			 *
			 * @since 1.0.0
			 */
			 $this->_instants = apply_filters( 'jarvis/instants', $this->_instants );

			foreach( $this->_instants as $instant_class ) {
				$instant = new $instant_class();

				if ( $instant->current_user_can() ) {
					$this->instants[ $instant_class ] = $instant;
				}
			}
		}

		return $this->instants;
	}

	/**
	 * Get the current theme
	 *
	 * @param bool - whether to apply the admin color or only get the user theme
	 * @return string
	 */
	private function get_theme( $admin_color = true ) {

		/**
		 * Filter the default theme
		 *
		 * @name jarvis/theme_default
		 * @param string default theme of 'wp' which matches the wordpress color scheme
		 * @return string
		 *
		 * @since 1.0.0
		 */
		$default = apply_filters( 'jarvis/theme_default', 'wp' );
		$theme   = get_user_meta( get_current_user_id(), 'jarvis_theme', true );

		if ( empty( $theme ) ) {
			$theme = $default;
		}

		if ( true === $admin_color && 'wp' === $theme ) {
			$theme = get_user_option( 'admin_color' );
		}

		return $theme;
	}

	/**
	 * Get the full uri for a theme stylesheet
	 *
	 * @param string $theme
	 * @return string
	 *
	 * @access private
	 */
	private function get_theme_uri( $theme ) {

		/**
		 * Filter the css uri for a custom theme with a theme specific filter name
		 *
		 * @name jarvis/theme/theme-name from $this->themes
		 * @param string $theme_css_uri - the full url to the css file for the custom theme
		 * @return string
		 *
		 * @since 1.0.0
		 */
		$theme_css_uri = apply_filters( 'jarvis/theme/' . $theme, JARVIS_URI . '/dist/themes/'. $theme .'.css' );

		if ( empty( $theme_css_uri ) || ! preg_match( '/\.css$/', strval( $theme_css_uri ) ) ) {
			$theme_css_uri = JARVIS_URI . '/dist/themes/fresh.css';
		}

		return $theme_css_uri;
	}

	/**
	 * Build our options to pass into the javascript constructor
	 *
	 * @return array
	 * @access private
	 */
	private function get_options() {
		// if we already have a nonce, we've already been built so just return it
		if ( null !== $this->options['nonce'] ) {
			return $this->options;
		}

		$this->options = array_merge( $this->options, [
			'nonce'     => wp_create_nonce( 'wp_rest' ),  // use wp_rest since we're using the rest api and relying on their nonces
			'searchurl' => rest_url( Suggestions\Search::REST_PREFIX . '/search' ),
			'theme'     => $this->get_theme(),
		] );

		// user hotkey preference
		if ( $user_hotkey = get_user_meta( get_current_user_id(), 'jarvis_hotkey', true ) ) {
			$this->options['hotkey'] = $user_hotkey;
		}

		return $this->options;
	}

	/**
	 * Get suggestions from each of the instants to pass into the javascript constructor
	 *
	 * @return array
	 * @access private
	 */
	private function get_suggestions() {
		foreach( $this->instants as $instant ) {
			$instant_suggestions = $instant->get();

			if ( empty( $instant_suggestions ) ) {
				continue;
			}

			if ( ! is_array( $instant_suggestions ) ) {
				$instant_suggestions = [ $instant_suggestions ];
			}

			$this->suggestions = array_merge( $this->suggestions, $instant_suggestions );
		}

		/**
		 * filter the instant suggestions list
		 *
		 * @name jarvis/suggestions
		 * @param array $this->suggestions - modeled suggestions - all suggestions should extend Jarvis/models/model
		 * @return array
		 *
		 * @since 1.0.0
		 */
		$this->suggestions = apply_filters( 'jarvis/suggestions', $this->suggestions );

		if ( empty( $this->suggestions ) || ! is_array( $this->suggestions ) ) {
			return [];
		}

		return $this->suggestions;
	}

	/**
	 * Add the field and script to customize the Jarvis hotkey and theme
	 *
	 * @param WP_User
	 * @access public
	 * @action show_user_profile, edit_user_profile
	 */
	public function show_user_profile( $user ) {
		$user_theme = $this->get_theme( false );
		?>
		<h3>Jarvis</h3>

		<table class="form-table">
			<tr>
				<th><label for="jarvis-hotkey">Hotkey</label></th>
				<td>
					<p><input type="text" name="jarvis_hotkey" id="jarvis_hotkey" maxlength="1" value="<?php echo $this->options['hotkey']; ?>" class="regular-text" autocomplete="off" /></p>
					<p><span class="description">Enter the hot key you would like to invoke Jarvis with. Supports lowercase a-z, 0-9, and any of these special characters: <code>; = , - . / \ ` [ ] |</code>.</span></p>
				</td>
			</tr>
			<tr>
				<th><label for="jarvis-theme">Theme</label></th>
				<td>
					<p>
						<select name="jarvis_theme" class="regular-text">
							<?php foreach( $this->themes as $theme => $label ) : ?>
							<option data-uri="<?php echo esc_attr( $this->get_theme_uri( $theme ) ); ?>" value="<?php echo esc_attr( $theme ); ?>"<?php if ( $theme === $user_theme ) echo ' selected'; ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</p>
				</td>
			</tr>
		</table>
	<?php }

	/**
	 * Save the user profile fields
	 *
	 * @param int $user_id
	 * @access public
	 * @action personal_options_update, edit_user_profile_update
	 */
	public function edit_user_profile_update( $user_id ) {
		if ( current_user_can( 'edit_user', $user_id ) ) {
			update_user_meta( $user_id, 'jarvis_hotkey', sanitize_text_field( $_POST['jarvis_hotkey'] ) );
			update_user_meta( $user_id, 'jarvis_theme', sanitize_text_field( $_POST['jarvis_theme'] ) );
		}
	}

	/**
	 * Enqueue jarvis style and scripts
	 *
	 * @access public
	 * @action admin_enqueue_scripts
	 */
	public function admin_enqueue_scripts() {
		$this->get_options();

		wp_register_script( 'typeahead', JARVIS_URI . '/dist/vendor/typeahead.js/dist/typeahead.bundle.min.js', array( 'jquery' ), self::VERSION, true );
		wp_enqueue_script( 'wp-jarvis', JARVIS_URI . '/dist/jarvis.js', array( 'jquery', 'underscore', 'backbone', 'typeahead' ), self::VERSION, true );

		wp_add_inline_script( 'wp-jarvis', 'window.jarvis = new Jarvis('. wp_json_encode( $this->options, ( WP_DEBUG ? JSON_PRETTY_PRINT : null ) ) .', ' . wp_json_encode( $this->get_suggestions(), ( WP_DEBUG ? JSON_PRETTY_PRINT : null ) ) . ');', 'after' );

		wp_enqueue_style( 'wp-jarvis', JARVIS_URI . '/dist/jarvis.css', [], self::VERSION, 'screen' );
		wp_enqueue_style( 'wp-jarvis-theme', $this->get_theme_uri( $this->options['theme'] ), [], self::VERSION, 'screen' );

		if ( 'profile' === get_current_screen()->id ) {
			wp_enqueue_script( 'wp-jarvis-user-profile', JARVIS_URI . '/dist/jarvis-user-profile.js', array( 'jquery', 'wp-jarvis' ), self::VERSION, true );
			wp_add_inline_script( 'wp-jarvis-user-profile', 'window.jarvis.userProfile = new Jarvis.UserProfile('. json_encode( [ 'version' => self::VERSION, 'jarvisUri' => JARVIS_URI ] ).');', 'after' );
		}
	}

	/**
	 * Add Jarvis to the menu bar as a search icon
	 *
	 * @param \WP_Admin_Bar $admin_bar
	 * @access public
	 * @action admin_bar_menu
	 */
	public function admin_bar_menu( $admin_bar ) {

		// we'll remove this condition when we support front end searches
		if ( ! is_admin() ) {
			return;
		}

		$admin_bar->add_menu( [
			'id' => 'jarvis_menubar_icon',
			'title' => '<span>Jarvis Search</span>',
			'href' => '#jarvis',
			'meta' => array(
				'title' => 'Invoke Jarvis',
				'class' => 'dashicon menupop'
			),
			'parent' => 'top-secondary'
		] );

	}
}
