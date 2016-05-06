// Include gulp
var gulp = require('gulp');
// Include plugins

var concat = require('gulp-concat');
var htmlreplace = require('gulp-html-replace');
var uglify = require('gulp-uglify');
var closureCompiler = require('gulp-closure-compiler');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');

var targetLocation = "target";
var resourceLocation = 'resources';

var webLocation = 'web';

 // Concatenate JS Files, use closure compiler
gulp.task('minify-js', function() {
    return gulp.src(['node_modules/google-closure-library/closure/goog/**/*.js', resourceLocation + '/deps.js', resourceLocation + '/main.js'])
        .pipe(closureCompiler({
          compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
          fileName: 'build.js',
          compilerFlags: {
            closure_entry_point: 'charpicker.Main',
            compilation_level: 'ADVANCED_OPTIMIZATIONS',
            only_closure_dependencies: true,
            warning_level: 'VERBOSE'
          }
        }))
      .pipe(rename('script.min.js'))
      .pipe(gulp.dest(targetLocation + '/js'));
});
// uglify plugin.js
gulp.task('uglifyplugin', function() {
    return gulp.src(webLocation + '/plugin.js')
        .pipe(uglify())
        .pipe(rename('plugin.js'))
        .pipe(gulp.dest(targetLocation));
});

gulp.task('minify-css', function(){
    return gulp.src([ resourceLocation + '/css/common.css', resourceLocation + '/css/charpicker.css'])
        .pipe(concat('concat.css'))
        .pipe(rename('styles.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))        
        .pipe(gulp.dest(targetLocation + '/css'));
});

gulp.task('minify-plugin-css', function(){
    return gulp.src(resourceLocation + '/css/plugin.css')
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(targetLocation + '/css'));
});

gulp.task('replacehtml', function() {
    gulp.src(resourceLocation + '/charpicker.html')
        .pipe(htmlreplace({
            'css': 'css/styles.min.css',
            'dev': 'js/script.min.js'
        }))
        .pipe(gulp.dest(targetLocation));
});

// dev: make a copy of the google closure library in resources
gulp.task('goog_base_js', function(){
    return gulp.src('node_modules/google-closure-library/**/*')
        .pipe(gulp.dest(resourceLocation + '/closure-library'));
});

gulp.task('minify-all', ['minify-js', 'uglifyplugin', 'minify-css', 'minify-plugin-css', 'replacehtml']);
// Default Task
gulp.task('prepare-package', ['minify-all', 'goog_base_js']);
gulp.task('default', ['prepare-package']);

