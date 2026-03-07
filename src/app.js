const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
require("./config/database");

const env = require("./config/env");
const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const { loadCurrentUser, verifyCsrf } = require("./middleware/auth");
const { attachContext } = require("./middleware/context");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(env.appSecret));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(loadCurrentUser);
app.use(attachContext);
app.use(verifyCsrf);

app.use(publicRoutes);
app.use(authRoutes);
app.use(dashboardRoutes);

app.use((req, res) => {
  res.status(404).render("public/error", {
    pageTitle: "Not found",
    statusCode: 404,
    message: "The page you requested could not be found.",
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render("public/error", {
    pageTitle: "Server error",
    statusCode: 500,
    message: "An unexpected error occurred. Please try again.",
  });
});

module.exports = app;
