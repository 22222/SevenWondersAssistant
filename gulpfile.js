'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    del = require('del'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    minifycss = require('gulp-minify-css'),
    //autoprefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    gutil = require('gulp-util');

gulp.task('copy-bower-js', function() {
  return gulp.src([
        'bower_components/jquery/jquery.min.js',
        'bower_components/knockout/dist/knockout.js'
    ])
    .pipe(gulp.dest('www/js'))
});
gulp.task('copy-bower-css', function() {
  return gulp.src([
    ])
    .pipe(gulp.dest('www/css'))
});
gulp.task('copy-bower-fonts', function() {
  return gulp.src([
    ])
    .pipe(gulp.dest('www/fonts'))
});
gulp.task('copy-bower', ['copy-bower-js', 'copy-bower-css', 'copy-bower-fonts']);

gulp.task('copy', ['copy-bower']);

gulp.task('build-html', function() {
  return gulp.src('src/*.html')
    .pipe(gulp.dest('www'))
});
gulp.task('build-scripts', function() {
  return gulp.src('src/js/**/*.js')
    //.pipe(concat('site.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify().on('error', gutil.log))
    .pipe(gulp.dest('www/js'));
});
gulp.task('build-styles', function() {
  return gulp.src('src/css/**/*.css')
    .pipe(concat('site.css'))
    //.pipe(autoprefixer('last 2 version'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('www/css'))
});
gulp.task('build-images', function() {
  return gulp.src('src/images/**/*')
    .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
    .pipe(gulp.dest('www/images'));
});
gulp.task('build', ['build-html', 'build-scripts', 'build-styles', 'build-images']);

gulp.task('copy-build', ['copy'], function() {
    return gulp.start('build');
});

gulp.task('package-cordova', function() {
    return gulp.src('www/**/*')
        .pipe(gulp.dest('cordova/www'));
});

gulp.task('clean', function(cb) {
    return del(['www', 'cordova/www'], cb)
});

gulp.task('watch', ['build'], function() {
  gulp.watch('src/**/*.html', ['build-html']);
  gulp.watch('src/**/*.js', ['build-scripts']);
  gulp.watch('src/**/*.css', ['build-styles']);
});

gulp.task('default', ['clean'], function() {
    return gulp.start('copy-build');
});