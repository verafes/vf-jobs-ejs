const cookieParser = require("cookie-parser");
const express = require("express");
const csrf = require("host-csrf");

const app = express();

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: false }));
let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1);
}
const csrf_options = {
  protected_operations: ["PATCH"],
  protected_content_types: ["application/json"],
  development_mode: csrf_development_mode
};
app.use(csrf(csrf_options));

module.exports = app;