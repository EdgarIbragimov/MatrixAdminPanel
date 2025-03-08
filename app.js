import express from "express";
import bodyParser from "body-parser";
import createError from "http-errors";
import path from "path";
import cookieParser from "cookie-parser";
import adminRouter from "./routes/admin.router.js";
import helmet from "helmet";

const __dirname = "/Users/hidoku/WebstormProjects/LAB_3";
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Раскомментируйте только ОДНУ из следующих строк в зависимости от того,
// какую версию вы хотите использовать:

// Для разработки без сборок (исходные файлы из public):
app.use(express.static(path.join(__dirname, "public")));

// Для использования сборки Gulp:
//app.use(express.static(path.join(__dirname, "dist-gulp")));

// Для использования сборки Webpack:
// app.use(express.static(path.join(__dirname, "dist-webpack")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(helmet());
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  })
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://code.jquery.com",
          "'unsafe-inline'",
        ],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
      },
    },
  })
);

app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).render("error404");
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

export default app;
