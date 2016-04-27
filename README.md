# Jarvis

Jarvis is your admin assistant, putting WordPress at your fingertips via a quicksearch interface.

See more: http://wpjarvis.com

## Description

Let's say you've just logged in and you're on the dashboard. You want to get to a child page of your about page called "mission", but you can't remember if it's on page 2 or 5. With Jarvis it's simple. Open Jarvis and start typing "mission" and your page will show up immediately.

Once Jarvis is installed all you have to do to start using it is hit the quick key "/", type in your search (eg, "settings") and select the page you're looking for. It's the fastest way to get from the dashboard to editing your anything on the admin side.

* Access the settings for permalinks: `/` + `Permalinks` + enter and you're there.
* Edit your contact page: `/` + `Contact` + enter and you're there.
* Access your post about caving in Nigeria from last year: `/` + `Nigeria Caving` + enter and you're there.

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

You may be on a page that's focusing on a text area or input box. If this is the case just click somewhere on the page outside of these boxes and the hit /.

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


## Authors

* David Everett
* Joan Piedra
* Kurtis Shaner

Learn more about [The Web Development Group](http://www.webdevelopmentgroup.com), our [services](www.webdevelopmentgroup.com/services/) and [WordPress work](http://www.webdevelopmentgroup.com/work/).
