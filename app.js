const express = require("express");
require("express-async-errors");
const csrf = require("host-csrf");
const cookieParser = require('cookie-parser');

const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");

const storiesRouter = require("./routes/stories");

const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

require("dotenv").config(); // to load the .env file into the process.env object

app.use(helmet());
app.use(xss());
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
}));

const session = require("express-session");

const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
app.use(cookieParser(process.env.SESSION_SECRET));

let csrf_development_mode = app.get('env') !== 'production';
const csrf_options = {
  development_mode: csrf_development_mode,
  protected_operations: ["POST", "PUT", "PATCH", "DELETE"],
  protected_content_types: ["application/json"],
  cookie: false,
  sessionKey: 'session'
};
app.use(csrf(csrf_options));

app.use((req, res, next) => {
  res.locals._csrf = csrf.token(req, res);
  next();
});

const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(require("connect-flash")());

app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});
const auth = require("./middleware/auth");
app.use("/sessions", require("./routes/sessionRoutes"));
app.use("/stories", auth, storiesRouter);

// secret word handling
const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", auth, secretWordRouter);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();