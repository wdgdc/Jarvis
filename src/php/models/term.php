<?php

namespace Jarvis\Models;

class Term extends Model {

	public function __construct( $term, $taxonomy ) {
		$term = ( is_numeric( $term ) ) ? get_term_by( 'id', $term, $taxonomy ) : $term;

		$this->id       = $term->term_id;
		$this->type     = $term->taxonomy;
		$this->title    = $term->name;
		$this->slug     = $term->slug;
		$this->kind     = 'term';
		$this->iconType = 'dashicon';

		switch( $this->type ) {
			case 'nav_menu':
				$this->href = sprintf( 'nav-menus.php?action=edit&menu=%d', $this->id );
				$this->iconKey = 'dashicons-menu';
			break;
			default:
				$this->href = sprintf( 'edit-tags.php?action=edit&tag_ID=%d&taxonomy=%s', $this->id, $this->type );
				$this->iconKey  = is_taxonomy_hierarchical( $term->taxonomy ) ? 'category' : 'post_tag';
			break;
		}

		parent::__construct();
	}

}