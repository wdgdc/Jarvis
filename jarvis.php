<?php
/*
Plugin Name:	Jarvis
Plugin URI:		http://www.wpjarvis.com
Description:	Jarvis is your administration assistant, putting WordPress at your fingertips.
Version:		0.4
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
		'hotkey' => 191,
		'loadingimg' => 'img/wpspin.gif',
		'dashicons' => false
	);
	private $intPageLen = 4;

	private function __construct() {
		global $wp_version;
		$this->options['loadingimg'] = plugins_url($this->options['loadingimg'], __FILE__);
		$this->options['dashicons'] = (version_compare($wp_version, '3.8', '>=')) ? true : false;

		add_action('wp_ajax_jarvis-search', array($this, 'get_search_results'), 1);
		add_action('admin_enqueue_scripts', array($this, 'enqueue'));
		//add_action('admin_menu', array($this, 'admin_menu'));
		add_action('admin_footer', array($this, 'init'));
		add_action('admin_bar_menu', array($this, 'menubar_icon'), 100);
		add_action('wp_ajax_jarvis_settings', array($this, 'wp_ajax_jarvis_settings'));
		add_action('admin_init', array($this, 'resigter_jarvis_settings'));

		$this->site_url = get_site_url();
	}

	public function resigter_jarvis_settings() {
		register_setting('jarvis_settings', 'hotkey');
		register_setting('jarvis_settings', 'results_limit');
	}

	public function enqueue() {
		if (is_user_logged_in()) {
			wp_enqueue_style('wp-jarvis', plugins_url('css/jarvis.css', __FILE__));
			wp_register_script('typeahead', plugins_url('js/typeahead.min.js', __FILE__), array('jquery'), '0.9.3');
			wp_register_script('hogan', plugins_url('js/hogan.min.js', __FILE__), null, '2.0.0');
			wp_enqueue_script('wp-jarvis', plugins_url('js/jarvis.js', __FILE__), array('typeahead', 'hogan'), '.1');
		}
	}

	public function init() {
		global $wp_version;
		?>
		<script>
			var wp = wp || {};
			wp.jarvis = new Jarvis(<?php echo json_encode($this->options); ?>);
			jQuery("#wp-admin-bar-jarvis_menubar_icon a").on("click", function(e) {
				wp.jarvis.open(e);
			});
		</script>
	<?php }

	public function admin_menu() {
		add_options_page('Jarvis Options', 'Jarvis', 'administrator', 'jarvis_settings', array($this, 'wp_ajax_jarvis_settings'));
	}

	public function wp_ajax_jarvis_settings() {
		include_once('settings.php');
	}

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

	private function search_post_id($id = null) {
		if (!empty((int) $id)) {
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

	private function normalize($result) {
		$editUrl = (isset($this->arrTypeEditPaths[$result->kind])) ? $this->arrTypeEditPaths[$result->kind] : $this->arrTypeEditPaths['_default_'];
		$result->href = $this->site_url . '/wp-admin/' . sprintf($editUrl, $result->id, $result->type);

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

	private $arrTypeEditPaths = array(
		'_default_' => 'post.php?post=%s&action=edit',
		'term'      => 'edit-tags.php?action=edit&tag_ID=%s&taxonomy=%s',
		'post'      => 'post.php?post=%s&action=edit'
	);

	public function get_search_results() {
	    global $wpdb;

		// Don't break the json if debug is off
		if (!defined('WP_DEBUG') || !WP_DEBUG) {
			error_reporting(0);
		}

		$_REQUEST['q'] = isset($_REQUEST['q']) ? $_REQUEST['q'] : '';

		$srch_qry = $wpdb->esc_like($_REQUEST['q']);
		$srch_escaped_spaces = str_replace(' ', '%', $srch_qry);

		$strQry = "SELECT
				$wpdb->terms.term_id as 'id',
				$wpdb->terms.`name` as 'title',
				$wpdb->term_taxonomy.taxonomy as 'type',
				'term' as 'kind',
				$wpdb->terms.slug as 'slug',
				FLOOR( (LENGTH($wpdb->terms.term_id) - LENGTH(REPLACE(LOWER($wpdb->terms.term_id), LOWER('$srch_qry'), '')) / LENGTH('$srch_qry')) ) as 'relv_id',
				FLOOR( (LENGTH($wpdb->term_taxonomy.taxonomy) - LENGTH(REPLACE(LOWER($wpdb->term_taxonomy.taxonomy), LOWER('$srch_qry'), '')) / LENGTH('$srch_qry')) ) as 'relv_title',
				FLOOR( (LENGTH($wpdb->terms.`name`) - LENGTH(REPLACE(LOWER($wpdb->terms.`name`), LOWER('$srch_qry'), '')) / LENGTH('$srch_qry')) ) as 'relv_type',
				FLOOR( LENGTH($wpdb->terms.slug) / LENGTH(REPLACE(LOWER($wpdb->terms.slug), LOWER('$srch_qry'), '')) ) as 'relv_slug'
			FROM
				$wpdb->terms
			INNER JOIN
				$wpdb->term_taxonomy ON $wpdb->term_taxonomy.term_id = $wpdb->terms.term_id
			WHERE
				$wpdb->terms.`name` LIKE '%$srch_escaped_spaces%'
			OR
				$wpdb->terms.slug LIKE '%$srch_escaped_spaces%'
		UNION
			SELECT
				$wpdb->posts.ID as 'id',
				$wpdb->posts.post_title as 'title',
				$wpdb->posts.post_type as 'type',
				'post' as 'kind',
				$wpdb->posts.post_name as 'slug',
				FLOOR( (LENGTH($wpdb->posts.ID) - LENGTH(REPLACE(LOWER($wpdb->posts.ID), LOWER('$srch_qry'), '')) / LENGTH('$srch_qry')) ) as 'relv_id',
				FLOOR( (LENGTH($wpdb->posts.post_title) - LENGTH(REPLACE(LOWER($wpdb->posts.post_title), LOWER('$srch_qry'), '')) / LENGTH('$srch_qry')) ) as 'relv_title',
				FLOOR( (LENGTH($wpdb->posts.post_type) - LENGTH(REPLACE(LOWER($wpdb->posts.post_type), LOWER('$srch_qry'), '')) / LENGTH('$srch_qry')) ) as 'relv_type',
				FLOOR( (LENGTH($wpdb->posts.post_name) / LENGTH(REPLACE(LOWER($wpdb->posts.post_name), LOWER('$srch_qry'), '')) ) ) as 'relv_slug'
			FROM
				$wpdb->posts
			WHERE
				$wpdb->posts.post_status NOT IN ('revision', 'auto-draft') AND $wpdb->posts.post_type <> 'revision'
			AND (
				$wpdb->posts.post_title LIKE '%$srch_escaped_spaces%'
				OR
				$wpdb->posts.post_name LIKE '%$srch_escaped_spaces%'
			)
			ORDER BY relv_id, relv_slug, relv_type, relv_title DESC
			LIMIT 20
		";

		$this->results = $wpdb->get_results( $strQry );

		$this->search_post_id($_REQUEST['q']);
		$this->results = array_map(array($this, 'normalize'), $this->results);

		wp_send_json_success($this->results);
	}
}

if (is_admin()) {
	Jarvis::get_instance();
}
?>
