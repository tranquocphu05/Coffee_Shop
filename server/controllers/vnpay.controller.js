const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
require("dotenv").config();
const mongoose = require("mongoose");
const { orderModel } = require("../models/order.model");
const { orderDetailModel } = require("../models/order_detail.model");
const { cartModel } = require("../models/cart.model");
const { paymentSessionModel } = require("../models/payment_session.model");

const vnp_tmncode = process.env.VNP_TMNCODE;
const secureSecret = process.env.VNP_HASH_SECRET;
const vnp_host = process.env.VNP_HOST;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

const resolveClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" && forwarded.split(",")[0]) ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "127.0.0.1";
  return ip.replace("::ffff:", "");
};

const resolveOrderTotal = (order) => {
  if (!order) return null;
  const total =
    typeof order.total_amount === "number"
      ? order.total_amount
      : typeof order.total === "number"
      ? order.total
      : null;
  return Number.isFinite(total) ? total : null;
};

const resolveItemsTotal = (items) => {
  if (!Array.isArray(items)) return null;
  const total = items.reduce((sum, item) => {
    const qty = Number(item?.quantity);
    const price = Number(item?.price);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
    return sum + qty * price;
  }, 0);
  return Number.isFinite(total) ? total : null;
};

const confirmVnpayPayment = async ({
  txnRef,
  amount,
  responseCode,
  transactionStatus,
  transactionNo,
}) => {
  const normalizedStatus = transactionStatus || responseCode;
  const session = await paymentSessionModel.findById(txnRef);
  const order = session ? null : await orderModel.findById(txnRef);
  if (!session && !order) {
    return { RspCode: "01", Message: "Order not found" };
  }

  const total = session ? session.total_amount : resolveOrderTotal(order);
  if (!Number.isFinite(total) || total <= 0) {
    return { RspCode: "04", Message: "Invalid amount" };
  }
  const normalizedAmount = Number(amount) / 100;
  if (!Number.isFinite(normalizedAmount) || Math.round(total) !== Math.round(normalizedAmount)) {
    return { RspCode: "04", Message: "Invalid amount" };
  }

  if (order && order.paymentStatus === "PAID") {
    return { RspCode: "02", Message: "Order already confirmed" };
  }
  if (session && session.status === "PAID") {
    return { RspCode: "02", Message: "Order already confirmed" };
  }

  if (responseCode === "00" && normalizedStatus === "00") {
    if (session) {
      const newOrder = new orderModel({
        user_id: session.user_id,
        address_id: session.address_id,
        status: "pending",
        total_amount: session.total_amount,
        paymentMethod: "vnpay",
        paymentStatus: "PAID",
        vnpTransactionNo: transactionNo,
        paidAt: new Date(),
      });
      const savedOrder = await newOrder.save();

      await Promise.all(
        (session.items || []).map((item) =>
          orderDetailModel.create({
            order_id: savedOrder._id,
            variants_id: item.variants_id,
            quantity: item.quantity,
            price: item.price,
          })
        )
      );

      await cartModel.deleteMany({ user_id: session.user_id });

      session.status = "PAID";
      session.order_id = savedOrder._id;
      session.vnpTransactionNo = transactionNo;
      session.paidAt = new Date();
      await session.save();
    } else if (order) {
      order.paymentStatus = "PAID";
      order.vnpTransactionNo = transactionNo;
      order.paidAt = new Date();
      await order.save();
    }

    return { RspCode: "00", Message: "Confirm Success" };
  }

  if (session) {
    session.status = "FAILED";
    await session.save();
  } else if (order) {
    order.paymentStatus = "FAILED";
    await order.save();
  }

  return { RspCode: "00", Message: "Payment failed recorded" };
};

exports.createPaymentUrl = async (req, res) => {
  try {
    if (!vnp_tmncode || !secureSecret || !vnp_host || !vnp_ReturnUrl) {
      return res.status(500).json({
        msg: "Thiếu cấu hình VNPAY (env)",
        data: null,
      });
    }

    const vnpay = new VNPay({
      tmnCode: vnp_tmncode,
      secureSecret,
      vnpayHost: vnp_host,
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    const {
      orderId,
      vnp_TxnRef,
      orderInfo,
      locale,
      user_id,
      address_id,
      items,
      total_amount,
    } = req.body || {};
    const targetOrderId = orderId || vnp_TxnRef;
    const resolvedUserId = req.user?._id || user_id;

    let total = null;
    let txnRef = null;
    let info = orderInfo;

    if (targetOrderId) {
      const order = await orderModel.findById(targetOrderId);
      if (!order) {
        return res.status(404).json({ msg: "Không tìm thấy đơn hàng", data: null });
      }
      total = resolveOrderTotal(order);
      txnRef = order._id.toString();
      info = orderInfo || `Thanh toan don hang ${txnRef}`;
    } else {
      if (!resolvedUserId || !address_id) {
        return res.status(400).json({ msg: "Thiếu user_id hoặc address_id", data: null });
      }
      if (!mongoose.Types.ObjectId.isValid(resolvedUserId)) {
        return res.status(400).json({ msg: "user_id không hợp lệ", data: null });
      }
      if (!mongoose.Types.ObjectId.isValid(address_id)) {
        return res.status(400).json({ msg: "address_id không hợp lệ", data: null });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ msg: "Giỏ hàng rỗng", data: null });
      }
      const normalizedItems = items
        .map((item) => ({
          variants_id: item?.variants_id,
          quantity: Number(item?.quantity),
          price: Number(item?.price),
        }))
        .filter((item) => item.variants_id);
      if (normalizedItems.length === 0) {
        return res.status(400).json({ msg: "Giỏ hàng rỗng", data: null });
      }
      const invalidVariant = normalizedItems.find(
        (item) => !mongoose.Types.ObjectId.isValid(item.variants_id)
      );
      if (invalidVariant) {
        return res.status(400).json({ msg: "Sản phẩm không hợp lệ", data: null });
      }

      const computedTotal = resolveItemsTotal(normalizedItems);
      const providedTotal = Number(total_amount);
      total = Number.isFinite(providedTotal) ? providedTotal : computedTotal;
      if (!Number.isFinite(total) || total <= 0) {
        return res.status(400).json({ msg: "Số tiền không hợp lệ", data: null });
      }

      const session = new paymentSessionModel({
        user_id: resolvedUserId,
        address_id,
        items: normalizedItems.map((item) => ({
          variants_id: item.variants_id,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: total,
        orderInfo: orderInfo || null,
      });
      const savedSession = await session.save();
      txnRef = savedSession._id.toString();
      info = orderInfo || `Thanh toan don hang ${txnRef}`;
    }

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ msg: "Số tiền không hợp lệ", data: null });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const amount = Math.round(total);
    console.log("[VNPAY] total_amount:", total, "amount_sent:", amount);
    const ipAddr = resolveClientIp(req);
    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: info,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_Locale: locale === "EN" ? VnpLocale.EN : VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(200).json(vnpayResponse);
  } catch (error) {
    console.error("VNPAY CREATE URL ERROR:", error);
    return res.status(500).json({ msg: "Lỗi tạo URL thanh toán", data: null });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    const vnpParams = req.query;
    const vnpay = new VNPay({
      secureSecret: process.env.VNP_HASH_SECRET,
      hashAlgorithm: "SHA512",
    });

    const isValid = vnpay.verifyReturnUrl(vnpParams);
    if (!isValid) {
      return res.status(400).json({
        msg: "Sai chữ ký",
        data: null,
      });
    }

    const confirmResult = await confirmVnpayPayment({
      txnRef: vnpParams.vnp_TxnRef,
      amount: vnpParams.vnp_Amount,
      responseCode: vnpParams.vnp_ResponseCode,
      transactionStatus: vnpParams.vnp_TransactionStatus,
      transactionNo: vnpParams.vnp_TransactionNo,
    });

    return res.status(200).json({
      msg: "Nhận kết quả thanh toán",
      data: {
        vnp_Amount: vnpParams.vnp_Amount,
        vnp_BankCode: vnpParams.vnp_BankCode,
        vnp_CardType: vnpParams.vnp_CardType,
        vnp_OrderInfo: vnpParams.vnp_OrderInfo,
        vnp_PayDate: vnpParams.vnp_PayDate,
        vnp_ResponseCode: vnpParams.vnp_ResponseCode,
        vnp_TransactionNo: vnpParams.vnp_TransactionNo,
        vnp_TxnRef: vnpParams.vnp_TxnRef,
        success: vnpParams.vnp_ResponseCode === "00",
        confirm: confirmResult,
      },
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Lỗi hệ thống",
      data: null,
    });
  }
};

exports.vnpayIPN = async (req, res) => {
  try {
    const vnpParams = req.query;
    const vnpay = new VNPay({
      secureSecret: process.env.VNP_HASH_SECRET,
      hashAlgorithm: "SHA512",
    });

    if (!vnpay.verifyIpnCall(vnpParams)) {
      return res.status(200).json({
        RspCode: "97",
        Message: "Invalid checksum",
      });
    }

    const {
      vnp_TxnRef,
      vnp_ResponseCode,
      vnp_TransactionStatus,
      vnp_Amount,
      vnp_TransactionNo,
    } = vnpParams;

    const result = await confirmVnpayPayment({
      txnRef: vnp_TxnRef,
      amount: vnp_Amount,
      responseCode: vnp_ResponseCode,
      transactionStatus: vnp_TransactionStatus,
      transactionNo: vnp_TransactionNo,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("VNPAY IPN ERROR:", error);
    return res.status(200).json({
      RspCode: "99",
      Message: error.message,
    });
  }
};
