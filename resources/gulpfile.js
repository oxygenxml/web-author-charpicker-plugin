// Include gulp
var gulp = require('gulp');
// Include plugins

var debug = require('gulp-debug');
var concat = require('gulp-concat');
var closureCompiler = require('gulp-closure-compiler');

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

var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');

gulp.task('minify-css', function(){
    return gulp.src('*.css')
        .pipe(concat('concat.css'))
        .pipe(rename('styles.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))        
        .pipe(gulp.dest(targetLocation + '/css'));
});

 // Default Task
gulp.task('prepare-package', ['scripts', 'minify-css', 'replacehtml']);
