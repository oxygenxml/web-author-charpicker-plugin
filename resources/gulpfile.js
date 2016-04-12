// Include gulp
var gulp = require('gulp');
// Include plugins

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var closureCompiler = require('gulp-closure-compiler');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
const zip = require('gulp-zip');

var targetLocation = "../target";
 // Concatenate JS Files
gulp.task('scripts', function() {
    return gulp.src(['node_modules/google-closure-library/closure/goog/**/*.js', 'deps.js', 'main.js'])
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

var htmlreplace = require('gulp-html-replace');

gulp.task('replacehtml', function() {
  gulp.src('charpicker.html')
    .pipe(htmlreplace({
        'css': 'css/styles.min.css',
        'dev': 'js/script.min.js'
    }))
    .pipe(gulp.dest(targetLocation));
});

gulp.task('uglifyplugin', function() {
    return gulp.src('../web/plugin.js')
        .pipe(uglify())
        .pipe(rename('plugin.js'))
        .pipe(gulp.dest('../web/uglified'));
});

gulp.task('minify-css', function(){
    return gulp.src(['common.css', 'charpicker.css'])
        .pipe(concat('concat.css'))
        .pipe(rename('styles.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))        
        .pipe(gulp.dest(targetLocation + '/css'));
});

gulp.task('minify-plugin-css', function(){
    return gulp.src('plugin.css')
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(targetLocation));
});

gulp.task('package', function(){
    return gulp.src('../**')
        .pipe(zip('charpickaplugin.zip'))
        .pipe(gulp.dest(targetLocation));
});

 // Default Task
gulp.task('prepare-package', ['scripts', 'uglifyplugin', 'minify-css', 'minify-plugin-css', 'replacehtml']);
