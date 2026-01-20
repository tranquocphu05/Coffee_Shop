var express = require("express");
var router = express.Router();
var path = require("path");

/* GET home page. */
router.get("/login", (req, res, next) => {
  res.render("login");
});

router.get("/admin/dashboard", (req, res, next) => {
  res.render("admin_dashboard.ejs");
});

module.exports = router;
