<?php
/*
Plugin Name:    Jarvis
Plugin URI:     http://www.wpjarvis.com
Description:    Jarvis is your administration assistant, putting WordPress at your fingertips.
Version:      0.2
Author:       wdgdc, David Everett, Joan Piedra, Kurtis Shaner
Author URI:     http://www.webdevelopmentgroup.com
License:          GPLv2 or later
Text Domain:    jarvis
*/

class Jarvis {

	private $options = array(
		'hotkey' => 191,
		'loadingimg' => 'img/wpspin.gif'
	);
	private $intPageLen = 4;

	public function __construct() {
		$this->options['loadingimg'] = plugins_url($this->options['loadingimg'], __FILE__);
		add_action('wp_ajax_jarvis-search', array($this, 'get_search_results'), 1);
		add_action('admin_enqueue_scripts', array($this, 'enqueue'));
		//add_action('admin_menu', array($this, 'admin_menu'));
		add_action('admin_footer', array($this, 'init'));
		add_action('admin_bar_menu', array($this, 'menubar_icon'), 100);
		add_action('wp_ajax_jarvis_settings', array($this, 'wp_ajax_jarvis_settings'));
		add_action('admin_init', array($this, 'resigter_jarvis_settings'));
	}

	public function resigter_jarvis_settings() {
		register_setting('jarvis_settings', 'hotkey');
		register_setting('jarvis_settings', 'results_limit');
	}

	public function enqueue() {
		if (is_user_logged_in()) {
			wp_enqueue_style('wp-jarvis', plugins_url('css/jarvis.css', __FILE__));
			wp_enqueue_script('typeahead', plugins_url('js/typeahead.min.js', __FILE__), array('jquery'), '0.9.3');
			wp_enqueue_script('hogan', plugins_url('js/hogan.min.js', __FILE__), null, '2.0.0');
			wp_enqueue_script('wp-jarvis', plugins_url('js/jarvis.js', __FILE__), array('typeahead', 'hogan'), '.1');
		}
	}

	public function init() { ?>
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
		$admin_bar->add_menu(array(
			'id' => 'jarvis_menubar_icon',
			'title' => '<img src="'.plugins_url('img/jarvis-icon-white.png', __FILE__).'">',
			'href' => '#jarvis',
			'meta' => array(
				'title' => 'Invoke Jarvis'
			),
			'parent' => 'top-secondary'
		));
	}

	public function get_search_results() {
	    global $wpdb;

		$arrTypeEditPaths = array(
			'_default_' => 'post.php?post=%s&action=edit',
			'term'      => 'edit-tags.php?action=edit&tag_ID=%s&taxonomy=%s',
			'post' => 'post.php?post=%s&action=edit'
		);

		$_REQUEST['q'] = isset($_REQUEST['q']) ? $_REQUEST['q'] : '';

		$srch_qry = like_escape($_REQUEST['q']);
		$srch_escaped_spaces = str_replace(' ', '%', $srch_qry);

		$strQry = "      SELECT\n".
		"      ". $wpdb->prefix ."terms.term_id as 'id',\n".
		"      ". $wpdb->prefix ."terms.`name` as 'title',\n".
		"      ". $wpdb->prefix ."term_taxonomy.taxonomy as 'type',\n".
		"      'term' as 'kind',        ". $wpdb->prefix ."terms.slug as 'slug', \n".
		"       FLOOR( (LENGTH(". $wpdb->prefix ."terms.term_id) - LENGTH(REPLACE(LOWER(". $wpdb->prefix ."terms.term_id), LOWER('". $srch_qry ."'), '')) / LENGTH('". $srch_qry ."')) ) as 'relv_id', \n".
		"       FLOOR( (LENGTH(". $wpdb->prefix ."term_taxonomy.taxonomy) - LENGTH(REPLACE(LOWER(". $wpdb->prefix ."term_taxonomy.taxonomy), LOWER('". $srch_qry ."'), '')) / LENGTH('". $srch_qry ."')) ) as 'relv_title', \n".
		"       FLOOR( (LENGTH(". $wpdb->prefix ."terms.`name`) - LENGTH(REPLACE(LOWER(". $wpdb->prefix ."terms.`name`), LOWER('". $srch_qry ."'), '')) / LENGTH('". $srch_qry ."')) ) as 'relv_type', \n".
		"       FLOOR( LENGTH(". $wpdb->prefix ."terms.slug) / LENGTH(REPLACE(LOWER(". $wpdb->prefix ."terms.slug), LOWER('". $srch_qry ."'), '')) ) as 'relv_slug'  \n".
		"      FROM\n".
		"      ". $wpdb->prefix ."terms\n".
		"      INNER JOIN ". $wpdb->prefix ."term_taxonomy ON ". $wpdb->prefix ."term_taxonomy.term_id = ". $wpdb->prefix ."terms.term_id\n".
		"      WHERE \n".
		" " . $wpdb->prefix ."terms.`name` LIKE '%". $srch_escaped_spaces ."%' OR\n".
		" " . $wpdb->prefix ."terms.slug LIKE '%". $srch_escaped_spaces ."%'\n".
		"       UNION\n".
		"      SELECT\n".
		"      ". $wpdb->prefix ."posts.ID as 'id',\n".
		"      ". $wpdb->prefix ."posts.post_title as 'title',\n".
		"      ". $wpdb->prefix ."posts.post_type as 'type',\n".
		"      'post' as 'kind',        ". $wpdb->prefix ."posts.post_name as 'slug', \n".
		"      FLOOR( (LENGTH(". $wpdb->prefix ."posts.ID) - LENGTH(REPLACE(LOWER(". $wpdb->prefix ."posts.ID), LOWER('". $srch_qry ."'), '')) / LENGTH('". $srch_qry ."')) ) as 'relv_id', \n".
		"      FLOOR( (LENGTH(". $wpdb->prefix ."posts.post_title) - LENGTH(REPLACE(LOWER(". $wpdb->prefix ."posts.post_title), LOWER('". $srch_qry ."'), '')) / LENGTH('". $srch_qry ."')) ) as 'relv_title', \n".
		"      FLOOR( (LENGTH(". $wpdb->prefix ."posts.post_type) - LENGTH(REPLACE(LOWER(". $wpdb->prefix ."posts.post_type), LOWER('". $srch_qry ."'), '')) / LENGTH('". $srch_qry ."')) ) as 'relv_type', \n".
		"      FLOOR( ( LENGTH(". $wpdb->prefix ."posts.post_name) / LENGTH(REPLACE(LOWER(". $wpdb->prefix ."posts.post_name), LOWER('". $srch_qry ."'), '')) ) ) as 'relv_slug'  \n".
		"      FROM ". $wpdb->prefix ."posts\n".
		"      WHERE\n".
		"      ". $wpdb->prefix ."posts.post_status NOT IN ('revision', 'auto-draft') AND ". $wpdb->prefix ."posts.post_type <> 'revision' AND \n".
		"      (". $wpdb->prefix ."posts.post_title LIKE '%". $srch_escaped_spaces ."%' OR ". $wpdb->prefix ."posts.post_name LIKE '%". $srch_escaped_spaces ."%')\n".
		"      ORDER BY relv_id, relv_slug, relv_type, relv_title DESC\n";
		"      LIMIT 20";

		if( !isset($_REQUEST['debug']) ) {
			$intPageFrom = isset($_REQUEST['p']) ? (((int)$_REQUEST['p'] - 1) * $this->intPageLen) : 0 ;
			$strQry .= " LIMIT ". $intPageFrom .", ". $this->intPageLen ."\n";
		}

		$results = $wpdb->get_results( $strQry, ARRAY_A);
		$strSiteUrl = get_site_url();

		foreach($results as $itmIdx => &$itmRrd) {
			$tmpType = $itmRrd['type'];
			$tmpKind = $itmRrd['kind'];
			$tmpId = $itmRrd['id'];

			if( !isset($arrRtrn['types'][ $tmpType ]) ){
				$arrRtrn['types'][ $tmpType ] = array();
			}

			$arrRtrn['types'][ $tmpType ][ $tmpId ] = $itmIdx;

			$itmRrd['href'] = $strSiteUrl . '/wp-admin/' . sprintf(( isset($arrTypeEditPaths[$tmpKind]) ? $arrTypeEditPaths[$tmpKind] : $arrTypeEditPaths['_default_'] ), $tmpId, $tmpType);

			switch($itmRrd['type']) {
				case 'attachment':
					$itmRrd['att_src'] = wp_get_attachment_image_src($itmRrd['id'], array(28,28));
					$itmRrd['att_src'] = $itmRrd['att_src'][0];
					break;
				case 'post':
					$itmRrd['att_src'] = wp_get_attachment_image_src(get_post_thumbnail_id($itmRrd['id'], array(28,28)));
					$itmRrd['att_src'] = $itmRrd['att_src'][0];
					break;
			}
		}

		header('Content-type: application/json');
		echo json_encode($results);

		// --- WhyTF would this be something that need to be done ?!? --- //
		die(); // this is required to return a proper result
	}
}

if (is_admin()) $wp_jarvis = new Jarvis();
?>