<?php

namespace Jarvis\Suggestions;

class Recent {

	public function get() {
		$posts = [];

		$query = new \WP_Query( apply_filters( 'jarvis/suggestions/recent/query', [
			'post_type'      => get_post_types( ['show_ui' => true ], 'names' ),
			'posts_per_page' => 10,
			'author'         => get_current_user_id(),
			'orderby'        => 'modified',
			'order'          => 'DESC',
			'fields'         => 'ids',
		] ) );

		if ( ! empty( $query->posts ) ) {
			foreach( $query->posts as $post_id ) {
				$post = new \Jarvis\Models\Post( $post_id );
				$post->source = 'Recent';
				array_push( $post->attributes, 'Recent' );

				$post = apply_filters( 'jarvis/model', $post );
				$post = apply_filters( 'jarvis/model/post', $post );

				array_push( $posts, $post );
			}
		}

		return apply_filters( 'jarvis/recent/posts', $posts );
	}

}