var package      = require('./package.json');
var gulp         = require('gulp');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var header       = require('gulp-header');
var insert       = require('gulp-insert');

var banner = [
  '/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  '',
  ''
].join('\n');

var dist = __dirname + '/dist';

gulp.task('vendor', function() {
    gulp.src('node_modules/hogan.js/dist/*.js').pipe(gulp.dest(dist + '/hogan'));
    gulp.src('node_modules/typeahead.js/dist/*.js').pipe(gulp.dest(dist + '/typeahead'));
});

gulp.task('js', function() {
    gulp.src([
        __dirname + '/src/util.js',
        __dirname + '/src/jarvis.js'
    ])
        .pipe(concat('jarvis.js'))
        .pipe(insert.wrap('(function(window, $, options, Bloodhound, Hogan) {\n\n', '\n\n})(this, window.jQuery, window.jarvisOptions, window.Bloodhound, window.Hogan);'))
        .pipe(header(banner, { pkg : package } ))
        .pipe(gulp.dest(dist));
});

gulp.task('uglify', function() {
    var pipe = gulp.src(dist + '/jarvis.js')
        .pipe(uglify({
            preserveComments: 'license'
        }).on('error', function(err) {
            console.error(err);
        }))
        .pipe(concat('jarvis.min.js'))
        .pipe(gulp.dest(dist));

        return pipe;
});

gulp.task('build', [
    'vendor',
    'js',
    'uglify'
]);

gulp.task('watch', function() {
    gulp.watch(__dirname + '/templates/*.hbs', ['templates']);
    gulp.watch(__dirname + '/src/*.js', ['js']);
    gulp.watch(dist + '/jarvis.js', ['uglify']);
});

gulp.task('default', [
    'build',
    'watch'
]);
