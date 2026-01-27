const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
require("dotenv").config();
const { vnpayConfig } = require("../config/vnpay.config");
const vnpay = new VNPay(vnpayConfig);

// Helper function để lấy IP
const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    "127.0.0.1"
  );
};

// Logger đơn giản
const logger = {
  info: (message, data) => console.log(`[VNPAY] ${message}`, data),
  error: (message, error) => console.error(`[VNPAY] ${message}`, error),
};

exports.createPaymentUrl = async (req, res) => {
  logger.info("Create payment URL request", {
    body: req.body,
    ip: getClientIp(req),
  });

  try {
    const { amount, orderId, orderDescription } = req.body;

    // Validation
    if (!amount || !orderId) {
      return res.status(400).json({
        code: "MISSING_PARAMETERS",
        msg: "Missing required parameters (amount, orderId)",
        data: null,
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        code: "INVALID_AMOUNT",
        msg: "Amount must be a positive number",
        data: null,
      });
    }

    if (typeof orderId !== "string" || orderId.trim().length === 0) {
      return res.status(400).json({
        code: "INVALID_ORDER_ID",
        msg: "Order ID is invalid",
        data: null,
      });
    }

    // Khởi tạo VNPay
    const vnpay = new VNPay({
      tmnCode: process.env.VNP_TMNCODE,
      secureSecret: process.env.VNP_HASH_SECRET,
      vnpayHost: process.env.VNP_HOST,
      testMode: process.env.NODE_ENV !== "production",
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    // Thiết lập thời gian hết hạn (15 phút)
    const createDate = new Date();
    const expiredDate = new Date(createDate.getTime() + 15 * 60000);

    // Xây dựng payment URL
    const paymentUrl = await vnpay.buildPaymentUrl({
      vnp_Amount: numericAmount * 100, // Chuyển sang VND (VNPay yêu cầu)
      vnp_IpAddr: getClientIp(req),
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderDescription || `Thanh toán đơn hàng ${orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(createDate),
      vnp_ExpireDate: dateFormat(expiredDate),
      // Có thể thêm các tham số khác nếu cần
      // vnp_BankCode: req.body.bankCode,
    });

    logger.info("Payment URL created successfully", {
      orderId,
      amount: numericAmount,
      createDate,
      expiredDate,
    });

    // Trả về response
    return res.json({
      code: "SUCCESS",
      msg: "Tạo URL thanh toán VNPay thành công",
      data: {
        paymentUrl,
        orderId,
        amount: numericAmount,
        expiredDate: expiredDate.toISOString(),
      },
    });
  } catch (err) {
    logger.error("Failed to create payment URL", err);

    return res.status(500).json({
      code: "INTERNAL_ERROR",
      msg:
        process.env.NODE_ENV === "production"
          ? "Có lỗi xảy ra khi tạo URL thanh toán"
          : err.message,
      data: null,
    });
  }
};
