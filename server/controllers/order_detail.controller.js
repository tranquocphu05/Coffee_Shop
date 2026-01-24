const { orderDetailModel } = require("../models/order_detail.model");
const { orderModel } = require("../models/order.model");
const { productVariantModel } = require("../models/product_variant.model");
const mongoose = require("mongoose");

exports.createOrderDetail = async (req, res) => {
  try {
    const { order_id, variants_id, quantity, price } = req.body;

    if (!order_id || !variants_id) {
      return res
        .status(400)
        .json({ error: "Missing order_id or variants_id" });
    }

    if (!mongoose.Types.ObjectId.isValid(order_id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    if (!mongoose.Types.ObjectId.isValid(variants_id)) {
      return res.status(400).json({ error: "Invalid variants id" });
    }

    if (typeof quantity !== "undefined" && !Number.isFinite(Number(quantity))) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    if (typeof price !== "undefined" && !Number.isFinite(Number(price))) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const order = await orderModel.findOne({ _id: order_id });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const variant = await productVariantModel.findOne({
      _id: variants_id,
      is_delete: false,
    });
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const orderDetail = new orderDetailModel({
      order_id,
      variants_id,
      quantity,
      price,
    });

    const newOrderDetail = await orderDetail.save();

    return res.status(201).json({
      message: "Create order detail successfully!",
      data: { order_detail: newOrderDetail },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { order_id } = req.query;
    const filter = {};

    if (typeof order_id !== "undefined" && order_id !== "") {
      if (!mongoose.Types.ObjectId.isValid(order_id)) {
        return res.status(400).json({ error: "Invalid order id" });
      }
      filter.order_id = order_id;
    }

    const orderDetails = await orderDetailModel.find(filter);
    return res.status(200).json({ data: { order_details: orderDetails } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrderDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order detail id" });
    }
    const orderDetail = await orderDetailModel.findOne({ _id: id });

    if (!orderDetail) {
      return res.status(404).json({ error: "Order detail not found" });
    }

    return res.status(200).json({ data: { order_detail: orderDetail } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order detail id" });
    }

    const { order_id, variants_id, quantity, price } = req.body;
    const update = {};

    if (typeof order_id !== "undefined") {
      if (!mongoose.Types.ObjectId.isValid(order_id)) {
        return res.status(400).json({ error: "Invalid order id" });
      }
      const order = await orderModel.findOne({ _id: order_id });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      update.order_id = order_id;
    }

    if (typeof variants_id !== "undefined") {
      if (!mongoose.Types.ObjectId.isValid(variants_id)) {
        return res.status(400).json({ error: "Invalid variants id" });
      }
      const variant = await productVariantModel.findOne({
        _id: variants_id,
        is_delete: false,
      });
      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
      update.variants_id = variants_id;
    }

    if (typeof quantity !== "undefined") {
      if (!Number.isFinite(Number(quantity))) {
        return res.status(400).json({ error: "Invalid quantity" });
      }
      update.quantity = quantity;
    }

    if (typeof price !== "undefined") {
      if (!Number.isFinite(Number(price))) {
        return res.status(400).json({ error: "Invalid price" });
      }
      update.price = price;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const orderDetail = await orderDetailModel.findOneAndUpdate(
      { _id: id },
      update,
      { new: true }
    );

    if (!orderDetail) {
      return res.status(404).json({ error: "Order detail not found" });
    }

    return res.status(200).json({
      message: "Update order detail successfully!",
      data: { order_detail: orderDetail },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order detail id" });
    }
    const orderDetail = await orderDetailModel.findOne({ _id: id });

    if (!orderDetail) {
      return res.status(404).json({ error: "Order detail not found" });
    }

    await orderDetailModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Delete order detail successfully!",
      data: { order_detail: orderDetail },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
