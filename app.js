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
app.use(express.static(path.join(__dirname, "public")));
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

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

export default app;
