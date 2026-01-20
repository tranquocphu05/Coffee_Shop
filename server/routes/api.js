var express = require("express");
var router = express.Router();
var accCtrl = require("../controllers/acc.controller");

// Acc
router.post("/account/register", accCtrl.doReg);
router.post("/account/login", accCtrl.doLogin);
router.get("/account/verify", accCtrl.verifyToken);

module.exports = router;
