<?php
/*
Plugin Name:	Jarvis
Plugin URI:		http://www.wpjarvis.com
Description:	Jarvis is your administration assistant, putting WordPress at your fingertips.
Version:		0.51.0
Author:			wdgdc, David Everett, Joan Piedra, Kurtis Shaner
Author URI:		http://www.webdevelopmentgroup.com
License:		GPLv2 or later
Text Domain:	jarvis
*/

class Jarvis {

	private static $_instance;
	public static function get_instance() {
		if (empty(self::$_instance)) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	private $options = array(
		'hotkey' => '/',
		'keyCode' => 191,
		'loadingimg' => 'img/wpspin.gif',
		'dashicons' => false
	);

	private function __construct() {
		global $wp_version;
		$this->options['loadingimg'] = plugins_url($this->options['loadingimg'], __FILE__);
		$this->options['dashicons'] = (version_compare($wp_version, '3.8', '>=')) ? true : false;

		add_action('admin_bar_menu', array($this, 'menubar_icon'), 100);
		add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
		add_action('admin_init', array($this, 'admin_init'));
		add_action('edit_user_profile', array($this, 'show_user_profile'));
		add_action('edit_user_profile_update', array($this, 'edit_user_profile_update'));
		add_action('personal_options_update', array($this, 'edit_user_profile_update'));
		add_action('show_user_profile', array($this, 'show_user_profile'));
		add_action('wp_ajax_jarvis-search', array($this, 'get_search_results'), 1);

	}

	/**
	 * Grab the users keycode setting
	 *
	 * @access public
	 * @action admin_init
	 */
	public function admin_init() {
		if ($user_keycode = get_user_meta(get_current_user_id(), 'jarvis_keycode', true)) {
			$this->options['keyCode'] = (int) $user_keycode;
		}
		if ($user_hotkey = get_user_meta(get_current_user_id(), 'jarvis_hotkey', true)) {
			$this->options['hotkey'] = $user_hotkey;
		}
	}

	/**
	 * Add the field and script to customize the Jarvis keyCode
	 *
	 * @access public
	 * @action show_user_profile, edit_user_profile
	 */
	public function show_user_profile( $user ) { ?>
		<h3>Jarvis</h3>

		<table class="form-table">
			<tr>
				<th><label for="jarvis-hotkey">Hotkey</label></th>
				<td>
					<p><input type="text" name="jarvis_hotkey" id="jarvis_hotkey" value="<?php echo $this->options['hotkey']; ?>" class="regular-text" autocomplete="off" style="width:25px;text-align:center;" /></p>
					<p><span class="description">Enter the key you would like to invoke jarvis with. Supports lowercase a-z, 0-9, and any of these special characters: ; = , - . / ` [ \ ] ' only.</span></p>
					<input type="hidden" id="jarvis_keycode" name="jarvis_keycode" value="<?php echo $this->options['keyCode']; ?>">
				</td>
			</tr>
		</table>

		<script>
			(function() {
				var hotKey  = document.getElementById('jarvis_hotkey');
				var keyCode = document.getElementById('jarvis_keycode');
				var keys = {
					"0":48,"1":49,"2":50,"3":51,"4":52,"5":53,"6":54,"7":55,"8":56,"9":57,"a":65,"b":66,"c":67,"d":68,"e":69,"f":70,
					"g":71,"h":72,"i":73,"j":74,"k":75,"l":76,"m":77,"n":78,"o":79,"p":80,"q":81,"r":82,"s":83,"t":84,"u":85,"v":86,
					"w":87,"x":88,"y":89,"z":90,";":186,"=":187,",":188,"-":189,".":190,"/":191,"`":192,"[":219,"\\":220,"]":221,"'":222
				};
				var keyCodes = [];
				for(var key in keys) {
					if (keys.hasOwnProperty(key)) {
						keyCodes.push(keys[key]);
					}
				}

				var keyUp = function(e) {
					if (keyCodes.indexOf(e.which) > -1) {
						this.value = this.value.charAt(0).toLowerCase();
						keyCode.value = keys[this.value];
					} else {
						this.value = '';
						keyCode.value = '';
					}
				}
				jQuery(hotKey).on('keyup', keyUp);
			})();
		</script>
	<?php }

	/**
	 * Save user fields
	 *
	 * @access public
	 * @action personal_options_update, edit_user_profile_update
	 */
	public function edit_user_profile_update( $user_id ) {
		if ( current_user_can( 'edit_user', $user_id ) ) {
			update_user_meta( $user_id, 'jarvis_hotkey', $_POST['jarvis_hotkey'] );
			update_user_meta( $user_id, 'jarvis_keycode', $_POST['jarvis_keycode'] );
		}
	}

	/**
	 * Enqueue jarvis style and scripts
	 *
	 * @access public
	 * @action admin_enqueue_scripts
	 */
	public function admin_enqueue_scripts() {
		if (is_user_logged_in()) {
			wp_enqueue_style('wp-jarvis', plugins_url('css/jarvis.css', __FILE__));
			wp_register_script('typeahead', plugins_url('dist/typeahead/typeahead.bundle.min.js', __FILE__), array('jquery'));
			wp_register_script('hogan', plugins_url('dist/hogan/hogan-3.0.2.min.js', __FILE__), null, '3.0.2');
			wp_enqueue_script('wp-jarvis', plugins_url('dist/jarvis.min.js', __FILE__), array('jquery', 'typeahead', 'hogan'), '0.50.0');
			wp_localize_script('wp-jarvis', 'jarvisOptions', $this->options);
		}
	}

	/**
	 * Add Jarvis to the menu bar as a search icon
	 *
	 * @access public
	 * @action admin_footer
	 */
	public function menubar_icon($admin_bar) {
		$className = ($this->options['dashicons'] === true) ? 'dashicon' : 'image';

		$admin_bar->add_menu(array(
			'id' => 'jarvis_menubar_icon',
			'title' => '<span>Jarvis Search</span>',
			'href' => '#jarvis',
			'meta' => array(
				'title' => 'Invoke Jarvis',
				'class' => $className
			),
			'parent' => 'top-secondary'
		));
	}

	/**
	 * Prepend post_id search to main search query
	 *
	 * @access private
	 */
	private function search_post_id($id = null) {
		if (!empty($id)) {
			$post = get_post($id);

			if (!empty($post)) {

				$post_result = (object) array(
					'id'    => $post->ID,
					'title' => apply_filters('the_title', $post->post_title) . " - (ID $id)",
					'type'  => $post->post_type,
					'kind'  => $post->post_type,
					'isId'  => true
				);

				array_unshift($this->results, $post_result);
			}
		}
	}

	/**
	 * Grab the item edit url's and thumbnails
	 *
	 * @access private
	 */
	private function normalize($result) {
		$typeEditPaths = array(
			'_default_' => 'post.php?post=%s&action=edit',
			'term'      => 'edit-tags.php?action=edit&tag_ID=%s&taxonomy=%s',
			'post'      => 'post.php?post=%s&action=edit'
		);
		$editUrl = (isset($typeEditPaths[$result->kind])) ? $typeEditPaths[$result->kind] : $typeEditPaths['_default_'];

		$result->href = admin_url(sprintf($editUrl, $result->id, $result->type));

		switch($result->type) {
			case 'attachment':
				$result->att_src = wp_get_attachment_image_src($result->id, array(28,28));
				$result->att_src = $result->att_src[0];
				break;
			case 'post':
				$result->att_src = wp_get_attachment_image_src(get_post_thumbnail_id($result->id, array(28,28)));
				$result->att_src = $result->att_src[0];
				break;
		}

		return $result;
	}

	/**
	 * Grab the item edit url's and thumbnails
	 *
	 * @access public
	 * @action wp_ajax_jarvis-search
	 */

	public function get_search_results() {
	    global $wpdb;

		// Don't break the json if debug is off
		if (!defined('WP_DEBUG') || !WP_DEBUG) {
			error_reporting(0);
		}

		$_REQUEST['q'] = isset($_REQUEST['q']) ? $_REQUEST['q'] : '';

		$srch_qry = $wpdb->esc_like($_REQUEST['q']);
		$srch_escaped_spaces = '%'.str_replace(' ', '%', $srch_qry).'%';

		$post_types = "'".implode("','", array_values(get_post_types(array('show_ui' => true))))."'";

		$strQry = "SELECT
				$wpdb->terms.term_id as 'id',
				$wpdb->terms.`name` as 'title',
				$wpdb->term_taxonomy.taxonomy as 'type',
				'term' as 'kind',
				$wpdb->terms.slug as 'slug',
				FLOOR( (LENGTH($wpdb->terms.term_id) - LENGTH(REPLACE(LOWER($wpdb->terms.term_id), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_id',
				FLOOR( (LENGTH($wpdb->term_taxonomy.taxonomy) - LENGTH(REPLACE(LOWER($wpdb->term_taxonomy.taxonomy), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_title',
				FLOOR( (LENGTH($wpdb->terms.`name`) - LENGTH(REPLACE(LOWER($wpdb->terms.`name`), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_type',
				FLOOR( LENGTH($wpdb->terms.slug) / LENGTH(REPLACE(LOWER($wpdb->terms.slug), LOWER(%s), '')) ) as 'relv_slug'
			FROM
				$wpdb->terms
			INNER JOIN
				$wpdb->term_taxonomy ON $wpdb->term_taxonomy.term_id = $wpdb->terms.term_id
			WHERE
				$wpdb->terms.`name` LIKE %s
			OR
				$wpdb->terms.slug LIKE %s
		UNION
			SELECT
				$wpdb->posts.ID as 'id',
				$wpdb->posts.post_title as 'title',
				$wpdb->posts.post_type as 'type',
				'post' as 'kind',
				$wpdb->posts.post_name as 'slug',
				FLOOR( (LENGTH($wpdb->posts.ID) - LENGTH(REPLACE(LOWER($wpdb->posts.ID), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_id',
				FLOOR( (LENGTH($wpdb->posts.post_title) - LENGTH(REPLACE(LOWER($wpdb->posts.post_title), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_title',
				FLOOR( (LENGTH($wpdb->posts.post_type) - LENGTH(REPLACE(LOWER($wpdb->posts.post_type), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_type',
				FLOOR( (LENGTH($wpdb->posts.post_name) / LENGTH(REPLACE(LOWER($wpdb->posts.post_name), LOWER(%s), '')) ) ) as 'relv_slug'
			FROM
				$wpdb->posts
			WHERE
				$wpdb->posts.post_status NOT IN ('revision', 'auto-draft') AND $wpdb->posts.post_type <> 'revision'
			AND
				$wpdb->posts.post_type IN ($post_types)
			AND (
				$wpdb->posts.post_title LIKE %s
				OR
				$wpdb->posts.post_name LIKE %s
			)
		ORDER BY relv_id, relv_slug, relv_type, relv_title DESC
		LIMIT 20
		";

		$sql_prepared = array(
			$srch_qry, $srch_qry, $srch_qry, $srch_qry, $srch_qry, $srch_qry, $srch_qry,
			$srch_escaped_spaces, $srch_escaped_spaces,
			$srch_qry, $srch_qry, $srch_qry, $srch_qry, $srch_qry, $srch_qry, $srch_qry,
			$srch_escaped_spaces, $srch_escaped_spaces
		);

		$this->results = $wpdb->get_results( $wpdb->prepare($strQry, $sql_prepared) );

		$this->search_post_id($_REQUEST['q']);
		$this->results = array_map(array($this, 'normalize'), $this->results);

		wp_send_json_success($this->results);
	}
}

if (is_admin()) {
	Jarvis::get_instance();
}
?>
