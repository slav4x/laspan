import 'dotenv/config';
import { src, dest, watch, series, parallel } from 'gulp';
import browserSyncLib from 'browser-sync';
import { nunjucksCompile } from 'gulp-nunjucks';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cleanCSS from 'gulp-clean-css';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import { rm, mkdir } from 'fs/promises';
import replace from 'gulp-replace';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import gulpIf from 'gulp-if';
import listing from 'is-pagelist';
import typograf from 'gulp-typograf';
import babel from 'gulp-babel';
import vinylFTP from 'vinyl-ftp';
import log from 'fancy-log';

const browserSync = browserSyncLib.create();
const sass = gulpSass(dartSass);

const isProd = process.env.NODE_ENV === 'production';

const ftpConfig = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS,
  parallel: 5,
  log,
};

export async function clean() {
  await rm('app', { recursive: true, force: true });
}

export function html() {
  return src(['src/**/*.html', '!src/components/**/*.html'])
    .pipe(nunjucksCompile({ path: ['src/'] }))
    .pipe(replace('?cb', `?cb=${Date.now()}`))
    .pipe(typograf({ locale: ['ru', 'en-US'], htmlEntity: { type: 'digit' } }))
    .pipe(gulpIf(isProd, replace('libs.css', 'libs.min.css')))
    .pipe(gulpIf(isProd, replace('main.css', 'main.min.css')))
    .pipe(gulpIf(isProd, replace('libs.js', 'libs.min.js')))
    .pipe(gulpIf(isProd, replace('main.js', 'main.min.js')))
    .pipe(dest('app'))
    .pipe(browserSync.stream());
}

export function style() {
  return src(['src/sass/**/*.sass', '!src/sass/libs.sass'])
    .pipe(plumber({ errorHandler: notify.onError({ title: 'SASS', message: '<%= error.message %>' }) }))
    .pipe(sass())
    .pipe(gulpIf(isProd, cleanCSS({ level: 2 })))
    .pipe(postcss([autoprefixer()]))
    .pipe(concat(isProd ? 'main.min.css' : 'main.css'))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream());
}

export function libsStyle() {
  return src('src/sass/libs.sass')
    .pipe(sass())
    .pipe(gulpIf(isProd, cleanCSS({ level: 2 })))
    .pipe(concat(isProd ? 'libs.min.css' : 'libs.css'))
    .pipe(dest('app/css'));
}

export function js() {
  return src('src/js/main.js')
    .pipe(plumber({ errorHandler: notify.onError({ title: 'JS', message: '<%= error.message %>' }) }))
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(gulpIf(isProd, terser()))
    .pipe(concat(isProd ? 'main.min.js' : 'main.js'))
    .pipe(dest('app/js'))
    .pipe(browserSync.stream());
}

export function libsJs() {
  return src([
    'src/js/vendor/fancybox.umd.js',
    'src/js/vendor/splide.min.js',
    'src/js/vendor/imask.min.js',
    'src/js/vendor/masonry.pkgd.min.js',
  ])
    .pipe(gulpIf(isProd, terser()))
    .pipe(concat(isProd ? 'libs.min.js' : 'libs.js'))
    .pipe(dest('app/js'));
}

export function img() {
  return src('src/img/**/*', { encoding: false }).pipe(dest('app/img'));
}

export function resources() {
  return src('src/resources/**', { encoding: false }).pipe(dest('app'));
}

export function pageList() {
  return src('app/*.html').pipe(listing('page-list.html')).pipe(dest('app/'));
}

export function serve() {
  browserSync.init({
    server: { baseDir: 'app' },
    online: true,
  });

  watch(['src/**/*.html', 'src/components/**/*.html'], html);
  watch('src/sass/**/*.sass', style);
  watch('src/sass/libs.sass', libsStyle);
  watch('src/js/**/*.js', js);
  watch('src/js/vendor/**/*.js', libsJs);
  watch('src/img/**/*', img);
  watch('src/resources/**/*', resources);
}

export function deploy() {
  const conn = vinylFTP.create(ftpConfig);
  return src('app/**/*', { base: 'app', buffer: false })
    .pipe(conn.dest(`/domains/${process.env.SUBDOMAIN}.${process.env.DOMAIN}`))
    .on('end', () => {
      log(`🚀 Деплой завершен: https://${process.env.SUBDOMAIN}.${process.env.DOMAIN}`);
    });
}

export const build = series(clean, parallel(libsJs, js, libsStyle, style, html, img, resources), pageList);

export async function development() {
  await clean();
  await Promise.all([libsJs(), js(), libsStyle(), style(), html(), img(), resources()]);
  serve();
}

export { development as default };
