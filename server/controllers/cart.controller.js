const { cartModel } = require("../models/cart.model");
const { accModel } = require("../models/account.model");
const { productVariantModel } = require("../models/product_variant.model");
const mongoose = require("mongoose");

exports.createCartItem = async (req, res) => {
  try {
    const { user_id, variants_id, quantity, price } = req.body;

    if (!user_id || !variants_id) {
      return res.status(400).json({ error: "Missing user_id or variants_id" });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: "Invalid user id" });
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

    const user = await accModel.findOne({ _id: user_id, is_delete: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const variant = await productVariantModel.findOne({
      _id: variants_id,
      is_delete: false,
    });
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const cartItem = new cartModel({
      user_id,
      variants_id,
      quantity,
      price,
    });

    const newCartItem = await cartItem.save();

    return res.status(201).json({
      message: "Create cart item successfully!",
      data: { cart: newCartItem },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCartItems = async (req, res) => {
  try {
    const { user_id } = req.query;
    const filter = {};

    if (typeof user_id !== "undefined" && user_id !== "") {
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ error: "Invalid user id" });
      }
      filter.user_id = user_id;
    }

    const carts = await cartModel.find(filter);
    return res.status(200).json({ data: { carts } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCartItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid cart id" });
    }
    const cart = await cartModel.findOne({ _id: id });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    return res.status(200).json({ data: { cart } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid cart id" });
    }

    const { user_id, variants_id, quantity, price } = req.body;
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

    const cart = await cartModel.findOneAndUpdate({ _id: id }, update, {
      new: true,
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    return res.status(200).json({
      message: "Update cart item successfully!",
      data: { cart },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid cart id" });
    }
    const cart = await cartModel.findOne({ _id: id });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    await cartModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Delete cart item successfully!",
      data: { cart },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
