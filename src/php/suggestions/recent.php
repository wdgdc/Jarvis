<?php

namespace Jarvis\Suggestions;

/**
 * Provide recently edited items as instant search results
 *
 * @since 1.0.0
 */
class Recent {

	public function current_user_can() {
		return current_user_can( 'edit_posts' );
	}

	public function get() {
		$posts = [];

		/**
		 * Filter the query args for recently edited items per user
		 *
		 * @name jarvis/suggestions/recent/query
		 * @param array WP_Query arguments
		 * @return array
		 *
		 * @since 1.0.0
		 */
		$query_args = apply_filters(
			'jarvis/suggestions/recent/query',
			[
				'post_type'      => get_post_types( ['show_ui' => true ], 'names' ),
				'posts_per_page' => 10,
				'author'         => get_current_user_id(),
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'fields'         => 'ids',
			]
		);

		$query = new \WP_Query( $query_args );

		if ( ! empty( $query->posts ) ) {
			foreach( $query->posts as $post_id ) {
				$post = new \Jarvis\Models\Post( $post_id );
				array_push( $post->attributes, 'Recent' );
				array_push( $posts, $post );
			}
		}

		/**
		 * Filter the results of any
		 *
		 * @param array $posts
		 * @return array
		 *
		 * @since 1.0.0
		 */
		return apply_filters( 'jarvis/recent/posts', $posts );
	}

}