const { productModel } = require("../models/product.model");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const removeProductImage = (fileName) => {
  if (!fileName) return;
  const imagePath = path.join(
    __dirname,
    "../public/images/products",
    fileName
  );
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { category_id, product_code, product_name, description } = req.body;

    if (!product_code || !product_name) {
      return res
        .status(400)
        .json({ error: "Missing product_code or product_name" });
    }

    const product = new productModel({
      category_id,
      product_code,
      product_name,
      description,
    });

    const newProduct = await product.save();

    return res.status(201).json({
      message: "Create product successfully!",
      data: { product: newProduct },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: "product_code already exists" });
    }
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await productModel.find({ is_delete: false });
    return res.status(200).json({ data: { products } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }
    const product = await productModel.findOne({ _id: id, is_delete: false });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({ data: { product } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const { category_id, product_code, product_name, description } = req.body;
    const update = {};

    if (typeof category_id !== "undefined") {
      update.category_id = category_id;
    }

    if (typeof product_code !== "undefined") {
      if (!product_code) {
        return res.status(400).json({ error: "product_code is required" });
      }
      update.product_code = product_code;
    }

    if (typeof product_name !== "undefined") {
      if (!product_name) {
        return res.status(400).json({ error: "product_name is required" });
      }
      update.product_name = product_name;
    }

    if (typeof description !== "undefined") {
      update.description = description;
    }

    if (Object.keys(update).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields to update" });
    }

    const product = await productModel.findOneAndUpdate(
      { _id: id, is_delete: false },
      update,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({
      message: "Update product successfully!",
      data: { product },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: "product_code already exists" });
    }
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }
    const product = await productModel.findOne({ _id: id, is_delete: false });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    removeProductImage(product.image);
    await productModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Delete product successfully!",
      data: { product },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

