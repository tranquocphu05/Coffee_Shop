var express = require("express");
var router = express.Router();
var path = require("path");

/* GET home page - redirect to login */
router.get("/", function (req, res, next) {
  res.redirect("/login.html");
});

/* GET login page */
router.get("/login.html", function (req, res, next) {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

/* GET admin page */
router.get("/admin.html", function (req, res, next) {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

module.exports = router;
