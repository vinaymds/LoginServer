const express = require("express");

const app = express();

const session = require("express-session");

const ws = require("ws");

const server = new ws.Server({ port: 8080 });

var token;
// server.listen(8080);

app.set("view engine", "ejs");

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);

app.get("/", function (req, res) {
  res.render("pages/auth");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("App listening on port " + port));

const passport = require("passport");

var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

// app.get("/getToken", function (req, res) {
//   res.json(token);
// } );

var wsInstance;
server.on("connection", (ws) => {
  console.log("Client connected");
  wsInstance = ws;

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// app.get("/success", (req, res) => res.send(userProfile));
app.get("/success", function (req, res) {
  wsInstance.send(token);
  token = null;

  res.render("pages/success", { user: userProfile });
});
app.get("/error", (req, res) => res.send("error logging in"));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const GOOGLE_CLIENT_ID =
  "472016308217-p63fit17lhnrrnfdoma8dcg93ubt666r.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      //if (profile._json.hd == "metadesignsolutions.co.uk") {
      token = accessToken;
      userProfile = profile;
      return done(null, userProfile);
      // } else {
      // return done(new Error("Invalid host domain"));
      //}
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    hd: "metadesignsolutions.co.uk",
    prompt: "select_account",
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/error" }),
  function (req, res) {
    // Successful authentication, redirect success.

    res.redirect("/success");
  }
);

app.get("/logout", function (req, res, next) {
  // req.session.destroy(function (err) {
  //   res.redirect("/"); //Inside a callback… bulletproof!
  // });

  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    req.session.destroy((err) => {
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});
