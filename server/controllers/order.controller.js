const { orderModel } = require("../models/order.model");
const { accModel } = require("../models/account.model");
const { addressModel } = require("../models/address.model");
const mongoose = require("mongoose");

exports.createOrder = async (req, res) => {
  try {
    const { user_id, address_id, status, total_amount, payment_method } =
      req.body;
    const paymentMethod =
      typeof payment_method === "string" && payment_method.trim()
        ? payment_method.trim()
        : undefined;

    if (!user_id || !address_id || !status) {
      return res
        .status(400)
        .json({ error: "Missing user_id, address_id or status" });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (!mongoose.Types.ObjectId.isValid(address_id)) {
      return res.status(400).json({ error: "Invalid address id" });
    }

    if (
      typeof total_amount !== "undefined" &&
      !Number.isFinite(Number(total_amount))
    ) {
      return res.status(400).json({ error: "Invalid total_amount" });
    }

    const user = await accModel.findOne({ _id: user_id, is_delete: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const address = await addressModel.findOne({ _id: address_id });
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    const order = new orderModel({
      user_id,
      address_id,
      status,
      total_amount,
      paymentMethod,
    });

    const newOrder = await order.save();

    return res.status(201).json({
      message: "Create order successfully!",
      data: { order: newOrder },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { user_id } = req.query;
    const filter = {};

    if (typeof user_id !== "undefined" && user_id !== "") {
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ error: "Invalid user id" });
      }
      filter.user_id = user_id;
    }

    const includeDetail = req.query.include === "detail";

    if (includeDetail) {
      const orders = await orderModel.aggregate([
        { $match: filter },
        { $sort: { _id: -1 } },
        {
          $lookup: {
            from: "account",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "Address",
            localField: "address_id",
            foreignField: "_id",
            as: "address",
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] },
            address: { $arrayElemAt: ["$address", 0] },
          },
        },
        {
          $project: {
            user_id: 1,
            address_id: 1,
            status: 1,
            total_amount: 1,
            paymentMethod: 1,
            paymentStatus: 1,
            user: { name: 1 },
            address: { name: 1, phone: 1, address: 1 },
          },
        },
      ]);
      return res.status(200).json({ data: { orders } });
    }

    const orders = await orderModel.find(filter).sort({ _id: -1 });
    return res.status(200).json({ data: { orders } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }
    const order = await orderModel.findOne({ _id: id });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ data: { order } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const { user_id, address_id, status, total_amount } = req.body;
    const update = {};

    if (typeof user_id !== "undefined") {
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ error: "Invalid user id" });
      }
      const user = await accModel.findOne({ _id: user_id, is_delete: false });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      update.user_id = user_id;
    }

    if (typeof address_id !== "undefined") {
      if (!mongoose.Types.ObjectId.isValid(address_id)) {
        return res.status(400).json({ error: "Invalid address id" });
      }
      const address = await addressModel.findOne({ _id: address_id });
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      update.address_id = address_id;
    }

    if (typeof status !== "undefined") {
      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }
      update.status = status;
    }

    if (typeof total_amount !== "undefined") {
      if (!Number.isFinite(Number(total_amount))) {
        return res.status(400).json({ error: "Invalid total_amount" });
      }
      update.total_amount = total_amount;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const order = await orderModel.findOneAndUpdate({ _id: id }, update, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({
      message: "Update order successfully!",
      data: { order },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }
    const order = await orderModel.findOne({ _id: id });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const status = String(order.status || "").toLowerCase();
    if (status === "processing" || status === "shipping") {
      return res.status(403).json({
        error: "Cannot delete order while processing or shipping",
      });
    }

    await orderModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Delete order successfully!",
      data: { order },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
