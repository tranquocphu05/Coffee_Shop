const { ignoreLogger } = require("vnpay");

const vnpayConfig = {
  tmnCode: process.env.VNP_TMNCODE,
  secureSecret: process.env.VNP_HASH_SECRET,
  vnpayHost: process.env.VNP_HOST,
  testMode: process.env.NODE_ENV !== "production",
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
};

module.exports = { vnpayConfig };
