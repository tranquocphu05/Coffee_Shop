var express = require("express");
var router = express.Router();
var accCtrl = require("../controllers/acc.controller");
var productCtrl = require("../controllers/product.controller");
var categoryCtrl = require("../controllers/category.controller");
var jwt = require("jsonwebtoken");
var mdw = require("../middleware/api.auth");

// Acc
router.post("/account/register", accCtrl.doReg);
router.post("/account/login/app", accCtrl.doLoginApp);
router.post("/account/login/web", accCtrl.doLoginWeb);

module.exports = router;
