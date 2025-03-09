import gulp from "gulp";
import sass from "gulp-sass";
import dartSass from "sass";
import babel from "gulp-babel";
import uglify from "gulp-uglify";
import cleanCSS from "gulp-clean-css";
import rename from "gulp-rename";
import pug from "gulp-pug";
import sourcemaps from "gulp-sourcemaps";
import gulpif from "gulp-if";
import { deleteAsync } from "del";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Настройка sass использовать dart-sass
const sassCompiler = sass(dartSass);

// Пути
const paths = {
  styles: {
    src: "public/stylesheets/**/*.scss",
    dest: "dist-gulp/stylesheets/",
  },
  scripts: {
    src: "public/javascripts/**/*.js",
    dest: "dist-gulp/javascripts/",
  },
  templates: {
    src: "views/**/*.pug",
    dest: "dist-gulp/views/",
  },
  images: {
    src: "public/images/**/*",
    dest: "dist-gulp/images/",
  },
};

// Режим разработки по умолчанию
const isDevelopment = process.env.NODE_ENV !== "production";

// Очистка директории сборки
export async function clean() {
  return await deleteAsync(["dist-gulp"]);
}

// Компиляция SCSS в CSS
export function styles() {
  return gulp
    .src(paths.styles.src)
    .pipe(gulpif(isDevelopment, sourcemaps.init()))
    .pipe(sassCompiler().on("error", sassCompiler.logError))
    .pipe(gulpif(!isDevelopment, cleanCSS()))
    .pipe(
      rename(function (path) {
        // Сохраняем оригинальное имя без суффикса .min
        if (path.basename === "style") {
          path.suffix = "";
        } else {
          path.suffix = ".min";
        }
      })
    )
    .pipe(gulpif(isDevelopment, sourcemaps.write(".")))
    .pipe(gulp.dest(paths.styles.dest));
}

// Компиляция JavaScript с Babel и минификацией
export function scripts() {
  return gulp
    .src(paths.scripts.src)
    .pipe(gulpif(isDevelopment, sourcemaps.init()))
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(gulpif(!isDevelopment, uglify()))
    .pipe(
      rename(function (path) {
        // Сохраняем оригинальное имя без суффикса .min для основных файлов
        if (path.basename === "admin") {
          path.suffix = "";
        } else {
          path.suffix = ".min";
        }
      })
    )
    .pipe(gulpif(isDevelopment, sourcemaps.write(".")))
    .pipe(gulp.dest(paths.scripts.dest));
}

// Компиляция Pug шаблонов в HTML
export function templates() {
  // Игнорируем файлы, начинающиеся с подчеркивания (_), т.к. это миксины или части шаблонов
  return gulp
    .src([paths.templates.src, "!views/mixins/_*.pug", "!views/**/_*.pug"], {
      base: "views",
    })
    .pipe(
      pug({
        pretty: isDevelopment,
        basedir: "./views",
        // Добавляем фиктивные данные для шаблонов
        data: {
          user: {
            fullname: "User Name",
            email: "user@example.com",
            avatar: "/images/default.png",
          },
          posts: [
            {
              id: "1",
              userName: "User Name",
              userPhoto: "/images/default.png",
              content: "Post content example",
              date: new Date().toISOString(),
              isDeleted: false,
              isBlocked: false,
              likesCount: 5,
              commentsCount: 2,
              likes: [1, 2, 3, 4, 5],
              comments: [
                { id: 1, content: "Comment 1", author: "User 1" },
                { id: 2, content: "Comment 2", author: "User 2" },
              ],
            },
          ],
          currentUserId: "123456",
        },
      })
    )
    .pipe(gulp.dest(paths.templates.dest));
}

// Копирование изображений - обновленная функция
export function images() {
  // Копируем изображения в основную директорию images
  return gulp.src(paths.images.src).pipe(gulp.dest(paths.images.dest));
}

// Создаем правильную структуру для путей с начальным слешем
export function publicUrls() {
  // Задача 1: Копируем изображения для абсолютных путей
  const task1 = gulp
    .src(paths.images.src)
    .pipe(gulp.dest("dist-gulp/public/images"));

  // Задача 2: Копируем стили для абсолютных путей
  const task2 = gulp
    .src("dist-gulp/stylesheets/**/*")
    .pipe(gulp.dest("dist-gulp/public/stylesheets"));

  // Задача 3: Копируем скрипты для абсолютных путей
  const task3 = gulp
    .src("dist-gulp/javascripts/**/*")
    .pipe(gulp.dest("dist-gulp/public/javascripts"));

  // Возвращаем последнюю задачу, чтобы gulp дождался её выполнения
  return task3;
}

// Наблюдение за изменениями файлов
export function watch() {
  gulp.watch(paths.styles.src, gulp.series(styles, publicUrls));
  gulp.watch(paths.scripts.src, gulp.series(scripts, publicUrls));
  gulp.watch(paths.templates.src, templates);
  gulp.watch(paths.images.src, gulp.series(images, publicUrls));
}

// Задачи по умолчанию
export const build = gulp.series(
  clean,
  gulp.parallel(styles, scripts, templates, images),
  publicUrls // Добавляем задачу после основной сборки
);

export default gulp.series(build, watch);
