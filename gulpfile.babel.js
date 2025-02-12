// gulpfile.js
import { src, dest, watch, series, parallel } from "gulp";
import plumber from "gulp-plumber";
import less from "gulp-less";
import cleanCSS from "gulp-clean-css";
import rename from "gulp-rename";
import pug from "gulp-pug";
import htmlMin from "gulp-htmlmin";
// import del from 'del';

// Очистка dist
// function clean() {
//     return del(['dist/**', '!dist']);
// }

// Компиляция LESS

const data = {
  userslist: [
    {
      id: 1,
      fullname: "John Doe",
      email: "john@example.com",
      birthdate: "1990-01-01",
      role: "admin",
      status: "active",
      photo: "avatar1.jpg",
    },
    {
      id: 2,
      fullname: "Jane Doe",
      email: "jane@example.com",
      birthdate: "1995-05-15",
      role: "user",
      status: "inactive",
      photo: "avatar2.jpg",
    },
  ],
  error: { status: 404, message: "Page not found" },
};

function styles() {
  return src("public/stylesheets/style.less")
    .pipe(less())
    .pipe(cleanCSS())
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest("dist/gulp/css"));
}

function views() {
  return (
    src("views/**/*.pug")
      .pipe(plumber()) // Обработка ошибок
      //.pipe(pug()) // Компиляция Pug
      .pipe(
        pug({
          locals: data, // Передаем данные
          pretty: true,
        })
      )
      .pipe(htmlMin({ collapseWhitespace: true })) // Минификация HTML
      .pipe(dest("dist/gulp/views/"))
  ); // Папка назначения
}

export default series(parallel(styles, views), () => {
  watch("public/stylesheets/*.less", styles);
  //gulp.watch('public/js/**/*.js', scripts);
  watch(["views/**/*.pug"], views);
});
