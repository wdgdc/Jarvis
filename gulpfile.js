const package      = require('./package.json');
const nodePath     = require('path');

const autoprefixer = require('gulp-autoprefixer');
const babel        = require('gulp-babel');
const concat       = require('gulp-concat');
const gulp         = require('gulp');
const header       = require('gulp-header');
const sass         = require('gulp-sass');
const sassGlob     = require('gulp-sass-glob');
const sourcemaps   = require('gulp-sourcemaps');
const uglify       = require('gulp-uglify');
const zip          = require('gulp-zip');

const project = {
	root: nodePath.posix.normalize(__dirname)
};

project.node    = nodePath.posix.normalize(`${project.root}/node_modules`);
project.src     = nodePath.posix.normalize(`${project.root}/src`);
project.js      = nodePath.posix.normalize(`${project.src}/js`);
project.scss    = nodePath.posix.normalize(`${project.src}/scss`);
project.dist    = nodePath.posix.normalize(`${project.root}/dist`);
project.vendor  = nodePath.posix.normalize(`${project.dist}/vendor`);
project.release = nodePath.posix.normalize(`${project.dist}/release`);

const banner = `/**
 * <%= package.name %> - <%= package.description %>
 * @version v<%= package.version %>
 * @link <%= package.homepage %>
 * @license <%= package.license %>
 */

`;

const js = () => {
	return gulp.src( `${project.js}` + '/**/*.js' )
		.pipe( sourcemaps.init() )
		.pipe( babel( {
			presets: [
				[
					'@babel/preset-env',
					{
						'useBuiltIns': 'entry',
						'corejs': '3.0.0'
					}
				]
			]
		} ) )
		.pipe( uglify() )
		.pipe( header( banner, { package: package } ) )
		.pipe( sourcemaps.write('.') )
		.pipe( gulp.dest( project.dist ) );
}

const scss = () => {
	return gulp.src( [`${project.scss}/**/*.scss`, `!_*.scss`] )
		.pipe( sourcemaps.init() )
		.pipe( sassGlob() )
		.pipe( sass( {
			outputStyle: 'expanded'
		} ).on( 'error', sass.logError ) )
		.pipe( autoprefixer() )
		.pipe( header( banner, { package: package } ) )
		.pipe( sourcemaps.write('.') )
		.pipe( gulp.dest( project.dist ) );
}

const vendor = () => {
	const npmFiles = Object.keys(package.dependencies).map((name) => `${project.node}/${name}/**/*`);

	return gulp.src(npmFiles, { base: project.node })
		.pipe(gulp.dest(project.vendor));
}

const watch = () => {
	gulp.watch( `${project.js}/**/*.js`, js );
	gulp.watch( `${project.scss}/**/*.scss`, scss );
}

const release = () => {
	// exlude folders from being included like svn / git / node_modules
	return gulp.src( [
		`./**/*`,
		`./**/.*`,
		`!.git`,
		`!.git/**/*`,
		`!.svn`,
		`!.svn/**/*`,
		`!branches`,
		`!branches/**/*`,
		`!node_modules`,
		`!node_modules/**/*`,
		`!tags`,
		`!tags/**/*`,
		`!trunk`,
		`!trunk/**/*`,
		`!jarvis-release.zip`,
	])
	.pipe( zip( 'jarvis.zip' ) )
	.pipe( gulp.dest( project.root ) );
}

const build = gulp.parallel( vendor, js, scss );

gulp.task( 'build', build );
gulp.task( 'build:js', js );
gulp.task( 'build:scss`', scss );
gulp.task( 'vendor', vendor );
gulp.task( 'watch', watch );
gulp.task( 'release', release );
gulp.task( 'default', gulp.series( build, watch ) );
