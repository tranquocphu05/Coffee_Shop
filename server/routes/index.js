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

router.get("/admin.html", (req, res) => {
  res.render("admin");
});

router.get("/product.html", (req, res) => {
  res.render("product");
});

router.get("/product-variant.html", (req, res) => {
  res.render("product-variant");
});

router.get("/category.html", (req, res) => {
  res.render("category");
});

router.get("/order.html", (req, res) => {
  res.render("order");
});

module.exports = router;
