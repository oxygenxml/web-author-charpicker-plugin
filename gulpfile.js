// Include gulp
var gulp = require('gulp');
// Include plugins

var concat = require('gulp-concat');
var htmlreplace = require('gulp-html-replace');
var uglify = require('gulp-uglify');
var closureCompiler = require('gulp-closure-compiler');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
const zip = require('gulp-zip');
var del = require('del');
var jshint = require('gulp-jshint');

var targetLocation = "target";
var resourceLocation = 'resources';

var webLocation = 'web';
var archiveName = 'webapp-charpicker-plugin-18.0';
var archiveLocation = 'target/archive/' + archiveName + '/';

gulp.task('lint', function() {
    return gulp.src([webLocation + '/plugin.js', resourceLocation + '/**/*.js', '!'+resourceLocation + '/closure-library/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
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
    return gulp.src([ resourceLocation + '/common.css', resourceLocation + '/charpicker.css'])
        .pipe(concat('concat.css'))
        .pipe(rename('styles.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))        
        .pipe(gulp.dest(targetLocation + '/css'));
});

gulp.task('minify-plugin-css', function(){
    return gulp.src(resourceLocation + '/plugin.css')
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(targetLocation));
});

gulp.task('replacehtml', function() {
    gulp.src(resourceLocation + '/charpicker.html')
        .pipe(htmlreplace({
            'css': 'css/styles.min.css',
            'dev': 'js/script.min.js',
            'robotolight': '<style>@font-face {font-family: "robotolight"; src: url("../../app/fonts/RobotoTTF/Roboto-Light.ttf") format("truetype");}</style>'
        }))
        .pipe(gulp.dest(targetLocation));
});

gulp.task('resource_css', ['minify-all'], function(){
    return gulp.src(targetLocation + '/css/styles.min.css')
        .pipe(gulp.dest(archiveLocation + '/resources/css'));
});

gulp.task('resource_js', ['minify-all'], function(){
    return gulp.src(targetLocation + '/js/script.min.js')
        .pipe(gulp.dest(archiveLocation + '/resources/js'));
});

gulp.task('resource_base', ['minify-plugin-css', 'replacehtml'], function(){
    return gulp.src(
        [
            targetLocation + '/plugin.css',
            targetLocation + '/charpicker.html',
            resourceLocation + '/InsertFromCharactersMap24.png',
            resourceLocation + '/InsertFromCharactersMap24@2x.png',
            resourceLocation + '/BackwardDelete.svg',
        ])
        .pipe(gulp.dest(archiveLocation + '/resources'));
});
gulp.task('web_js', ['minify-all'], function(){
    return gulp.src(targetLocation + '/plugin.js')
        .pipe(gulp.dest(archiveLocation + '/web'));
});

gulp.task('base_rest', function(){
    return gulp.src(
        [
            'plugin.xml',
            'README.md'
        ])
        .pipe(gulp.dest(archiveLocation));
});

gulp.task('archive', ['resource_css', 'resource_js', 'resource_base', 'web_js', 'base_rest'], function(){
    return gulp.src(targetLocation + '/archive/**/*')
        .pipe(zip(archiveName + '.zip'))
        .pipe(gulp.dest(targetLocation));
});

gulp.task('cleanup',['archive'], function(){
    return del(targetLocation + '/archive/**', {force: true});
});

// dev: make a copy of the google closure library in resources
gulp.task('goog_base_js', function(){
    return gulp.src('node_modules/google-closure-library/**/*')
        .pipe(gulp.dest(resourceLocation + '/closure-library'));
});

gulp.task('minify-all', ['minify-js', 'uglifyplugin', 'minify-css', 'minify-plugin-css', 'replacehtml']);
// Default Task
gulp.task('prepare-package', ['minify-all', 'resource_base', 'resource_js', 'resource_css', 'web_js', 'base_rest', 'archive', 'cleanup', 'goog_base_js']);
gulp.task('default', ['prepare-package']);

