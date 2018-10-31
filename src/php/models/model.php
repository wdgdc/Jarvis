<?php

namespace Jarvis\Models;

class Model {

	/**
	 * item id - only unique per type
	 */
	public $id = 0;

	/**
	 * item type - post type, taxonomy, etc
	 */
	public $type;

	/**
	 * Item title - will appear as the suggestion title
	 */
	public $title;

	/**
	 * Item slug
	 */
	public $slug;

	/**
	 * Kind of result - post, term, user, etc
	 */
	public $kind;

	/**
	 * Array of items that appear as info pills on the right of the suggestion
	 */
	public $attributes = [];

	/**
	 * The final edit url
	 */
	public $href;

	/**
	 * The title of
	 */
	public $prefix;

	/**
	 * The section the item is contained in
	 */
	public $section;

	/**
	 * The type of icon - dashicon, image, svg
	 */
	public $iconType = 'dashicon';

	/**
	 * The icon itself - dashicon class, image url, svg markup (defaults to a right arrow in case all icon detection has failed)
	 */
	public $icon = 'dashicons-arrow-right-alt2';

	/**
	 * The icon key that will be used in grabbing the icon from the front end, ususually a post_type or a menu item id
	 */
	public $iconKey = 'dashicons-arrow-right-alt2';

	/**
	 * Allow customization of models - Subclasses should call this at the end of their construct
	 */
	public function __construct() {
		/**
		 * Add an action for all models
		 *
		 * @name jarvis/model
		 * @param Jarvis\Models\Model
		 * @since 1.0.0
		 */
		do_action( 'jarvis/model', $this );

		/**
		 * Add an action for specific model
		 *
		 * @name jarvis/model/name-of-subclass-lowercase
		 * @param mixed subclass of Jarvis\Models\Model
		 * @since 1.0.0
		 */
		do_action( 'jarvis/model/' . strtolower( get_called_class() ), $this );
	}
}