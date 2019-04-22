# Jarvis

Jarvis is your admin assistant, putting WordPress at your fingertips via a quicksearch interface.

See more: http://wpjarvis.com

## Description

Let's say you've just logged in and you're on the dashboard. You want to get to a child page of your about page called "mission", but you can't remember if it's on page 2 or 5. With Jarvis it's simple. Open Jarvis and start typing "mission" and your page will show up immediately.

Once Jarvis is installed all you have to do to start using it is hit the quick key "/", type in your search (eg, "settings") and select the page you're looking for. It's the fastest way to get from the dashboard to editing your anything on the admin side.

* Access the settings for permalinks: `/` + `Permalinks` + enter and you're there.
* Edit your contact page: `/` + `Contact` + enter and you're there.
* Access your post about caving in Nigeria from last year: `/` + `Nigeria Caving` + enter and you're there.
* Flush the site rewrite rules: `/` + `Flush Rewrite Rules` + enter

The idea is to make it easier for anyone using the admin side of WordPress to get to the pages they're looking for.

## Installation

1. Upload the plugin folder to the /wp-content/plugins/ directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Type `/` anywhere in the admin section of WordPress or click the Jarvis button in the toolbar.

or

Install using the Plugin Installer.

## Frequently Asked Questions

### How do I access Jarvis

Hit the `/` key in the admin section or click the Jarvis button in the admin toolbar.

### It's still not working...

You may be on a page that's focusing on a text area or input box. If this is the case just click somewhere on the page outside of these boxes and the hit /. You can also click the search icon next to the avatar in the top admin menu bar.

## Extend

Jarvis is extendable to include your custom plugin data though filters.  See https://github.com/WDGDC/Jarvis/wiki/Extending-Jarvis

## Changelog

1. 0.1
  * Internal testing at WDG.
2. 0.2
  * Official initial release.
3. 0.3
  * Updated to work with dashicons of WP 3.8+
  * Use search icon instead of J as a more intuitive icon
4. 0.31
  * Quick bug fix for icon issue that lead to database results not being shown
5. 0.40
  * Code maintenance
  * Ability to search by post_id
  * add user setting for invoking jarvis
6. 0.50.0
  * Refactored to use the latest Twitter Typeahead
7. 0.51.0
  * Add post type check to search query to only query post types shown in wp-admin
8. 1.0.0
  * Rewrite most of Jarvis
  * User search
  * Mobile compatibility
  * Add Instant Actions that can be selected that are not in the admin menu
  * Nonce security for searches
  * Theme support!
  * Improved icon detection methods such as dashicons with custom fonts
  * Hi-DPI loading icon
  * Drop support for IE < 11
  * New gulp build pipeline
  * Remove Hogan in favor of underscore templates
9. 1.0.1
  * Fix an installation issue some users were reporting
10. 1.0.2
  * Send attachment suggestions to the 'Edit more details' page instead of the grid view as wp.media-grid throws an error if the item is not already loaded in the grid
11. 1.0.3
  * exclude hidden taxonomies from the search results and implement a new jarvis/taxonomies filter the list of taxonomies to be included in the search
12. 1.0.4
  * fix the autoloader to support web roots with underscore characters
  * update npm packages and add core-js as a dev dependency

## Develop

The plugin now uses a gulp based build pipeline that can be executed through npm scripts.

* requires `node` 8 and `npm` 5 or higher, should work with `node` 6 but haven't tested
* Public dependencies should be installed with npm using `npm i package-name --save`, while dev depenedencies like gulp should be installed with `npm i package-name --save-dev`

### Commands

* `npm run build:js` will compile javascript files using babel into the dist directory
* `npm run build:scss` will compile scss files using sass & autoprefixer into the dist directory
* `npm run vendor` will copy front end dependencies from node_modules to dist/vendor
* `npm run build` will run the build:js, build:scss, and vendor tasks simultaneously
* `npm run watch` will start watching for changes in js and scss files
* `npm start` will run the build and vendor tasks simultaneously followed by the watch task - this is the default task
* `npm run release` will create a zip the current build of the plugin to be included in a github release`

## Authors

* David Everett
* Joan Piedra
* Kurtis Shaner
* Doug Axelrod

Learn more about [The Web Development Group](http://www.webdevelopmentgroup.com), our [services](https://www.webdevelopmentgroup.com/services/) and [WordPress work](http://www.webdevelopmentgroup.com/work/).
