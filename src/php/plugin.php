<?php

namespace Jarvis;

class Plugin {

	/**
	 * Le version of le plugin
	 */
	const VERSION = '1.0.0';

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
		''                => 'Match WordPress Theme',
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
		'theme'     => 'fresh',
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
	 * Add our wordpress hooks
	 *
	 * @access private
	 */
	private function __construct() {
		add_action( 'admin_bar_menu', [ $this, 'admin_bar_menu' ] , 100 );
		add_action( 'admin_enqueue_scripts', [ $this, 'admin_enqueue_scripts' ] );
		add_action( 'admin_init', [ $this, 'admin_init' ], 20 );
		add_action( 'edit_user_profile_update', [ $this, 'edit_user_profile_update' ] );
		add_action( 'edit_user_profile', [ $this, 'show_user_profile' ] );
		add_action( 'personal_options_update', [ $this, 'edit_user_profile_update' ] );
		add_action( 'rest_api_init', [ $this, 'rest_api_init' ], 20 );
		add_action( 'show_user_profile', [ $this, 'show_user_profile' ] );
		add_action( 'wp_ajax_jarvis-search', [ $this, 'get_search_results' ] , 1 );
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

		register_rest_route( Suggestions\Action::REST_PREFIX, '/search/', [
			'methods' => 'GET',
			'callback' => function( $request ) {
				return ( new Suggestions\Search() )->get( $request->get_param( 'q' ) );
			}
		] );

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
			$this->_instants = apply_filters( 'jarvis/instants', $this->_instants );

			foreach( $this->_instants as $instant ) {
				$this->instants[ $instant ] = new $instant;
			}
		}

		return $this->instants;
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
			'nonce'   => wp_create_nonce( 'wp_rest' ), // use wp_rest since we're using the rest api and relying on their nonces
			'searchurl' => rest_url( Suggestions\Search::REST_PREFIX . '/search' )
		] );

		// filter the list of themes to add custom themes or remove themes
		$this->themes = apply_filters( 'jarvis/themes', $this->themes );

		// user theme preference or current admin color
		if ( ! $theme = get_user_meta( get_current_user_id(), 'jarvis_theme', true ) ) {
			$theme = get_user_option( 'admin_color' );
		}

		// if it's a supported theme, add it to the options
		if ( ! empty( $theme ) && in_array( $theme, array_keys( $this->themes ), true ) ) {
			$this->options['theme'] = $theme;
		}

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
		$user_theme = get_user_meta( $user->ID, 'jarvis_theme', true );
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
							<option value="<?php echo esc_attr( $theme ); ?>"<?php if ( $theme === $user_theme ) echo ' selected'; ?>><?php echo esc_html( $label ); ?></option>
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
		wp_enqueue_style( 'wp-jarvis-theme', JARVIS_URI . '/dist/themes/'. $this->options['theme'] .'.css', [], self::VERSION, 'screen' );

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