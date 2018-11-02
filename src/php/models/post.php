<?php

namespace Jarvis\Models;

class Post extends Model {

	public function __construct( $post ) {
		$post = ( is_numeric( $post ) ) ? get_post( $post ) : $post;

		$this->id      = $post->ID;
		$this->type    = $post->post_type;
		$this->title   = apply_filters( 'the_title', $post->post_title, $post );
		$this->slug    = $post->post_name;
		$this->kind    = 'post';
		$this->iconKey = $post->post_type;
		$this->href    = admin_url( sprintf( 'post.php?post=%d&action=edit', $this->id ) );

		if ( 'attachment' === $this->type ) {

			$this->iconType = 'image';
			$this->icon     = wp_get_attachment_image_src( $this->id, 'thumbnail' )[0];

		} else {

			if ( has_post_thumbnail( $this->id ) ) {
				$this->iconType = 'image';
				$this->icon     = wp_get_attachment_image_src( get_post_thumbnail_id( $this->id, 'thumbnail' ) )[0];
			}

		}

		parent::__construct();
	}
}
