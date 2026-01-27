const { cartModel } = require("../models/cart.model");
const { accModel } = require("../models/account.model");
const { productVariantModel } = require("../models/product_variant.model");
const { productModel } = require("../models/product.model");
const mongoose = require("mongoose");

exports.createCartItem = async (req, res) => {
  try {
    // Lấy user_id từ token (đã được xác thực bởi middleware)
    const user_id = req.user._id;
    const { variants_id, quantity, price, product_id } = req.body;

    if (!variants_id) {
      return res.status(400).json({ error: "Missing variants_id" });
    }

    if (!mongoose.Types.ObjectId.isValid(variants_id)) {
      return res.status(400).json({ error: "Invalid variants id" });
    }

    const finalQuantity = typeof quantity !== "undefined" ? Number(quantity) : 1;
    if (!Number.isFinite(finalQuantity) || finalQuantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const variant = await productVariantModel.findOne({
      _id: variants_id,
      is_delete: false,
    });
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    // Sử dụng price từ variant nếu không được cung cấp
    const finalPrice = typeof price !== "undefined" && Number.isFinite(Number(price)) 
      ? Number(price) 
      : variant.price;

    let productId = null;

    if (typeof product_id !== "undefined" && product_id !== "") {
      if (!mongoose.Types.ObjectId.isValid(product_id)) {
        return res.status(400).json({ error: "Invalid product id" });
      }
      productId = product_id;
    }

    if (!productId) {
      productId =
        typeof variant.product_id === "string"
          ? variant.product_id
          : variant.product_id?._id
            ? variant.product_id._id.toString()
            : variant.product_id?.toString();
    }

    if (!productId) {
      return res.status(400).json({ error: "Missing product_id" });
    }

    // Kiểm tra xem item đã tồn tại trong cart chưa
    const existingCartItem = await cartModel.findOne({
      user_id,
      variants_id,
    });

    if (existingCartItem) {
      // Nếu đã tồn tại, cập nhật quantity
      existingCartItem.quantity += finalQuantity;
      if (!existingCartItem.product_id) {
        existingCartItem.product_id = productId;
      }
      const updatedCartItem = await existingCartItem.save();
      
      // Populate để trả về đầy đủ thông tin
      await updatedCartItem.populate({
        path: "variants_id",
        populate: { path: "product_id" },
      });

      return res.status(200).json({
        message: "Cart item updated successfully!",
        data: { cart: updatedCartItem },
      });
    }

    const cartItem = new cartModel({
      user_id,
      product_id: productId,
      variants_id,
      quantity: finalQuantity,
      price: finalPrice,
    });

    const newCartItem = await cartItem.save();
    
    // Populate để trả về đầy đủ thông tin
    await newCartItem.populate({
      path: "variants_id",
      populate: { path: "product_id" },
    });

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
    // Lấy user_id từ token (đã được xác thực bởi middleware)
    const user_id = req.user._id;

    // Chỉ lấy cart items của user hiện tại
    const carts = await cartModel
      .find({ user_id })
      .populate({
        path: "variants_id",
        select: "sku size price image product_id",
        populate: {
          path: "product_id",
          select: "product_name description product_code",
        },
      })
      .sort({ _id: -1 }); // Sắp xếp mới nhất trước

    return res.status(200).json({ data: { carts } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCartItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid cart id" });
    }

    const cart = await cartModel
      .findOne({ _id: id, user_id })
      .populate({
        path: "variants_id",
        populate: { path: "product_id" },
      });

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
    const user_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid cart id" });
    }

    // Kiểm tra cart item có thuộc về user hiện tại không
    const existingCart = await cartModel.findOne({ _id: id, user_id });
    if (!existingCart) {
      return res.status(404).json({ error: "Cart not found or access denied" });
    }

    const { variants_id, quantity, price } = req.body;
    const update = {};

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
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }
      if (qty === 0) {
        // Nếu quantity = 0, xóa item
        await cartModel.deleteOne({ _id: id });
        return res.status(200).json({
          message: "Cart item deleted successfully!",
          data: { cart: existingCart },
        });
      }
      update.quantity = qty;
    }

    if (typeof price !== "undefined") {
      if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ error: "Invalid price" });
      }
      update.price = price;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const cart = await cartModel
      .findOneAndUpdate({ _id: id, user_id }, update, {
        new: true,
      })
      .populate({
        path: "variants_id",
        populate: { path: "product_id" },
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
    const user_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid cart id" });
    }

    // Kiểm tra cart item có thuộc về user hiện tại không
    const cart = await cartModel.findOne({ _id: id, user_id });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found or access denied" });
    }

    await cartModel.deleteOne({ _id: id, user_id });

    return res.status(200).json({
      message: "Delete cart item successfully!",
      data: { cart },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
