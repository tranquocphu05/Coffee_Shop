var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var multer = require("multer");
var accCtrl = require("../controllers/acc.controller");
var productCtrl = require("../controllers/product.controller");
var categoryCtrl = require("../controllers/category.controller");

var tempDir = path.join(__dirname, "../tmp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
var maxFileSize = 2 * 1024 * 1024; // 2MB
var allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
var allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

var upload = multer({
  dest: tempDir,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    var ext = path.extname(file.originalname || "").toLowerCase();
    var isValidExt = allowedExtensions.includes(ext);
    var isValidMime = allowedMimeTypes.includes(file.mimetype);
    if (!isValidExt || !isValidMime) {
      return cb(new Error("Chỉ cho phép ảnh .jpg, .jpeg, .png, .webp, .gif"));
    }
    return cb(null, true);
  },
});

var uploadProductImage = (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return next();
  });
};

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
router.post("/product/:id/image", uploadProductImage, productCtrl.uploadProductImage);

module.exports = router;
