var express = require("express");
var router = express.Router();
var accCtrl = require("../controllers/acc.controller");
var productCtrl = require("../controllers/product.controller");
var categoryCtrl = require("../controllers/category.controller");

// Acc
router.post("/account/register", accCtrl.doReg);
router.post("/account/login/app", accCtrl.doLoginApp);
router.post("/account/login/web", accCtrl.doLoginWeb);
router.get("/account/verify", accCtrl.verifyToken);

// Category
router.get("/category", categoryCtrl.getCategories);
router.get("/category/:id", categoryCtrl.getCategoryById);
router.post("/category", categoryCtrl.createCategory);
router.put("/category/:id", categoryCtrl.updateCategory);
router.delete("/category/:id", categoryCtrl.deleteCategory);

// Product
router.get("/product", productCtrl.getProducts);
router.get("/product/:id", productCtrl.getProductById);
router.post("/product", productCtrl.createProduct);
router.put("/product/:id", productCtrl.updateProduct);
router.delete("/product/:id", productCtrl.deleteProduct);

module.exports = router;
