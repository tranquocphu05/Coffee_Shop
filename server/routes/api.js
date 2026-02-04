var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var multer = require("multer");
var accCtrl = require("../controllers/acc.controller");
var productCtrl = require("../controllers/product.controller");
var productVariantCtrl = require("../controllers/product_variant.controller");
var categoryCtrl = require("../controllers/category.controller");
var orderCtrl = require("../controllers/order.controller");
var vnpayCtrl = require("../controllers/vnpay.controller");
var cartCtrl = require("../controllers/cart.controller");
var orderDetailCtrl = require("../controllers/order_detail.controller");
var addressCtrl = require("../controllers/address.controller");
var jwt = require("jsonwebtoken");
var mdw = require("../middleware/api.auth");

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

var uploadProductVariantImage = (req, res, next) => {
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
router.get("/account/list", mdw.api_auth, accCtrl.GetAllAccount);
router.get("/account/:id", mdw.api_auth, accCtrl.getAccountById);
router.put("/account/:id/without-address", mdw.api_auth, upload.single("image"), accCtrl.updateAccountWithoutAddress);
router.put("/account/:id/with-address", mdw.api_auth, upload.single("image"), accCtrl.updateAccountWithAddress);
router.post("/account/:id/avatar", mdw.api_auth, upload.single("image"), accCtrl.UploadAvatar);
router.delete("/account/:id", mdw.api_auth, accCtrl.deleteAccount);

// Category
router.get("/category", categoryCtrl.getCategories);
router.get("/category/:id", categoryCtrl.getCategoryById);
router.post("/category", categoryCtrl.createCategory);
router.put("/category/:id", categoryCtrl.updateCategory);
router.delete("/category/:id", categoryCtrl.deleteCategory);

// Product
router.get("/product", productCtrl.getProducts);
router.get("/product/:id", productCtrl.getProductById);
router.post("/product", mdw.api_auth, productCtrl.createProduct);
router.put("/product/:id", mdw.api_auth, productCtrl.updateProduct);
router.delete("/product/:id", mdw.api_auth, productCtrl.deleteProduct);

// Product Variant
router.get("/product-variant", productVariantCtrl.getProductVariants);
router.get("/product-variant/:id", productVariantCtrl.getProductVariantById);
router.post(
  "/product-variant",
  mdw.api_auth,
  productVariantCtrl.createProductVariant
);
router.put(
  "/product-variant/:id",
  mdw.api_auth,
  productVariantCtrl.updateProductVariant
);
router.delete(
  "/product-variant/:id",
  mdw.api_auth,
  productVariantCtrl.deleteProductVariant
);
router.post(
  "/product-variant/:id/image",
  uploadProductVariantImage,
  productVariantCtrl.uploadProductVariantImage
);

// Order
router.get("/order", orderCtrl.getOrders);
router.get("/order/:id", orderCtrl.getOrderById);
router.post("/order", orderCtrl.createOrder);
router.put("/order/:id", orderCtrl.updateOrder);
router.delete("/order/:id", orderCtrl.deleteOrder);

// VNPay
router.post("/vnpay/create-payment-url", mdw.api_auth, vnpayCtrl.createPaymentUrl);
router.get("/vnpay/return", vnpayCtrl.vnpayReturn);
router.get("/vnpay/ipn", vnpayCtrl.vnpayIPN);

// Cart - Tất cả routes đều cần xác thực token
router.get("/cart", mdw.api_auth, cartCtrl.getCartItems);
router.get("/cart/:id", mdw.api_auth, cartCtrl.getCartItemById);
router.post("/cart", mdw.api_auth, cartCtrl.createCartItem);
router.put("/cart/:id", mdw.api_auth, cartCtrl.updateCartItem);
router.delete("/cart/:id", mdw.api_auth, cartCtrl.deleteCartItem);

// Address - Tất cả routes đều cần xác thực token
router.get("/address", mdw.api_auth, addressCtrl.getAddresses);
router.get("/address/:id", mdw.api_auth, addressCtrl.getAddressById);
router.post("/address", mdw.api_auth, addressCtrl.createAddress);
router.put("/address/:id", mdw.api_auth, addressCtrl.updateAddress);
router.delete("/address/:id", mdw.api_auth, addressCtrl.deleteAddress);

// Order Detail
router.get("/order-detail", orderDetailCtrl.getOrderDetails);
router.get("/order-detail/:id", orderDetailCtrl.getOrderDetailById);
router.post("/order-detail", orderDetailCtrl.createOrderDetail);
router.put("/order-detail/:id", orderDetailCtrl.updateOrderDetail);
router.delete("/order-detail/:id", orderDetailCtrl.deleteOrderDetail);

module.exports = router;
