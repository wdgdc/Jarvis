<?php

namespace Jarvis\Suggestions;

class Search extends Action {

	private $model_map = [
		'post' => 'Jarvis\Models\Post',
		'term' => 'Jarvis\Models\Term',
		'user' => 'Jarvis\Models\User',
	];

	/**
	 * Execute a search query and return modeled results
	 *
	 * @param string $query
	 * @return array
	 */
	public function get( $query ) {
		global $wpdb;

		$query_esc_like        = $wpdb->esc_like( $query );
		$query_esc_like_spaces = '%' . str_replace( ' ', '%', $query_esc_like ) . '%';

		/**
		 * filter the post types that are used in the search query
		 *
		 * @name jarvis/include_post_types
		 * @param array - list of post types [ defaults to post types where show_ui == true ]
		 * @return array
		 *
		 * @since 1.0.0
		 */
		$post_types     = apply_filters( 'jarvis/include_post_types', array_values( get_post_types( [ 'show_ui' => true ] ) ) );
		$post_types_sql = "'" . implode( "','", $post_types ) . "'";

		/**
		 * exclude post stati from the search query
		 *
		 * @name jarvis/exclude_post_stati
		 * @param array - list of excluded post stati [ defaults to revision, auto-draft, trash ]
		 * @return array
		 *
		 * @since 1.0.0
		 */
		$post_stati_exclude     = apply_filters( 'jarvis/exclude_post_stati', [ 'revision', 'auto-draft', 'trash' ] );
		$post_stati_exclude_sql = "'" . implode( "','", $post_stati_exclude ) . "'";

		/**
		 * exclude post ids from the search query
		 *
		 * @name jarvis/exclude_post_ids
		 * @param array - list of post ids
		 * @return array
		 *
		 * @since 1.0.0
		 */
		$post_exclude     = apply_filters( 'jarvis/exclude_post_ids', [] );
		$post_exclude_sql = "'" . implode( "','", $post_exclude ) . "'";

		/**
		 * taxonmies whose terms are included in the search query
		 *
		 * @name jarvis/taxonomies
		 * @param array - list of taxonomies [ defaults to where taxonomies show_ui == true ]
		 * @return array
		 *
		 * @since 1.0.3
		 */
		$taxonomies     = apply_filters( 'jarvis/taxonomies', array_values( get_taxonomies( [ 'show_ui' => true ] ) ) );
		$taxonomies_sql = "'" . implode( "','", $taxonomies ) . "'";

		$sql_query = "SELECT
				$wpdb->terms.term_id as 'id',
				$wpdb->terms.`name` as 'title',
				$wpdb->term_taxonomy.taxonomy as 'type',
				'term' as 'kind',
				$wpdb->terms.slug as 'slug',
				$wpdb->terms.term_id = %s as 'exact_id',
				FLOOR( (LENGTH($wpdb->terms.term_id) - LENGTH(REPLACE(LOWER($wpdb->terms.term_id), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_id',
				FLOOR( (LENGTH($wpdb->term_taxonomy.taxonomy) - LENGTH(REPLACE(LOWER($wpdb->term_taxonomy.taxonomy), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_title',
				FLOOR( (LENGTH($wpdb->terms.`name`) - LENGTH(REPLACE(LOWER($wpdb->terms.`name`), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_type',
				FLOOR( LENGTH($wpdb->terms.slug) / LENGTH(REPLACE(LOWER($wpdb->terms.slug), LOWER(%s), '')) ) as 'relv_slug'
			FROM
				$wpdb->terms
			INNER JOIN
				$wpdb->term_taxonomy ON $wpdb->term_taxonomy.term_id = $wpdb->terms.term_id
			WHERE
				$wpdb->term_taxonomy.taxonomy IN ($taxonomies_sql)
				AND	(
					(
						$wpdb->terms.`name` LIKE %s
						OR
						$wpdb->terms.slug LIKE %s
					)
					OR
					$wpdb->terms.term_id = %s
				)
		UNION
			SELECT
				$wpdb->posts.ID as 'id',
				$wpdb->posts.post_title as 'title',
				$wpdb->posts.post_type as 'type',
				'post' as 'kind',
				$wpdb->posts.post_name as 'slug',
				$wpdb->posts.ID = %s as 'exact_id',
				FLOOR( (LENGTH($wpdb->posts.ID) - LENGTH(REPLACE(LOWER($wpdb->posts.ID), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_id',
				FLOOR( (LENGTH($wpdb->posts.post_title) - LENGTH(REPLACE(LOWER($wpdb->posts.post_title), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_title',
				FLOOR( (LENGTH($wpdb->posts.post_type) - LENGTH(REPLACE(LOWER($wpdb->posts.post_type), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_type',
				FLOOR( (LENGTH($wpdb->posts.post_name) / LENGTH(REPLACE(LOWER($wpdb->posts.post_name), LOWER(%s), '')) ) ) as 'relv_slug'
			FROM
				$wpdb->posts
			WHERE
				$wpdb->posts.post_status NOT IN ($post_stati_exclude_sql)
			AND
				$wpdb->posts.post_type IN ($post_types_sql)
			AND (
				(
					$wpdb->posts.post_title LIKE %s
					OR
					$wpdb->posts.post_name LIKE %s
				)
				OR
				$wpdb->posts.ID = %s
			)
			AND $wpdb->posts.ID NOT IN ($post_exclude_sql)
		UNION
			SELECT
				$wpdb->users.ID as 'id',
				$wpdb->users.display_name as 'title',
				'user' as 'type',
				'user' as 'kind',
				$wpdb->users.user_email as 'slug',
				$wpdb->users.ID = %s as 'exact_id',
				FLOOR( (LENGTH($wpdb->users.ID) - LENGTH(REPLACE(LOWER($wpdb->users.ID), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_id',
				FLOOR( (LENGTH($wpdb->users.display_name) - LENGTH(REPLACE(LOWER($wpdb->users.display_name), LOWER(%s), '')) / LENGTH(%s)) ) as 'relv_title',
				0 as 'relv_type',
				FLOOR( (LENGTH($wpdb->users.user_email) / LENGTH(REPLACE(LOWER($wpdb->users.user_email), LOWER(%s), '')) ) ) as 'relv_slug'
			FROM
				$wpdb->users
			WHERE (
				$wpdb->users.display_name LIKE %s
				OR
				$wpdb->users.user_email LIKE %s
				OR
				$wpdb->users.user_login LIKE %s
			)
			OR
			$wpdb->users.ID = %s
		ORDER BY
			exact_id DESC,
			relv_id DESC,
			relv_slug DESC,
			relv_type DESC,
			relv_title DESC,
			kind ASC
		LIMIT 20
		";

		$sql_prepared = array(
			// terms
			$query,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like_spaces,
			$query_esc_like_spaces,
			$query,

			// posts
			$query,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like_spaces,
			$query_esc_like_spaces,
			$query,

			// users
			$query,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like,
			$query_esc_like_spaces,
			$query_esc_like_spaces,
			$query_esc_like_spaces,
			$query,
		);

		$query_results = $wpdb->get_results( $wpdb->prepare( $sql_query, $sql_prepared ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$results       = [];

		if ( ! empty( $query_results ) ) {
			foreach ( $query_results as $result ) {
				switch ( $result->kind ) {
					case 'term':
						array_push( $results, new $this->model_map[ $result->kind ]( $result->id, $result->type ) );
						break;
					default:
						array_push( $results, new $this->model_map[ $result->kind ]( $result->id ) );
						break;
				}
			}
		}

		return apply_filters( 'jarvis/results', $results, $query );
	}

}
