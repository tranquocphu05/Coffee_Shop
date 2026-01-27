const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
require("dotenv").config();
const vnp_tmncode = process.env.VNP_TMNCODE;
const secureSecret = process.env.VNP_HASH_SECRET;
const vnp_host = process.env.VNP_HOST;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

exports.createPaymentUrl = async (req, res, next) => {
  const vnpay = new VNPay({
    tmnCode: vnp_tmncode,
    secureSecret: secureSecret,
    vnpayHost: vnp_host,
    testMode: true,
    hashAlgorithm: "SHA512",
    loggerFn: ignoreLogger,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const vnpayResponse = await vnpay.buildPaymentUrl({
    vnp_Amount: 10000,
    vnp_IpAddr: "127.0.0.1",
    vnp_TxnRef: "123456", // _id
    vnp_OrderInfo: "1654321",
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: vnp_ReturnUrl,
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(tomorrow),
  });

  return res.status(200).json(vnpayResponse);
};
