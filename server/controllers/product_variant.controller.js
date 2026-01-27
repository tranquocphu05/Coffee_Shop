const { productVariantModel } = require("../models/product_variant.model");
const { productModel } = require("../models/product.model");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { uploadFile } = require("../helpers/upload.helper");

const removeVariantImage = (fileName) => {
  if (!fileName) return;
  const imagePath = path.join(
    __dirname,
    "../public/images/product_variants",
    fileName
  );
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

exports.createProductVariant = async (req, res) => {
  try {
    const { sku, product_id, size, quantity, price, image } = req.body;

    if (!sku || !product_id) {
      return res.status(400).json({ error: "Missing sku or product_id" });
    }

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (typeof quantity === "undefined" || !Number.isFinite(Number(quantity))) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    if (typeof price === "undefined" || !Number.isFinite(Number(price))) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const product = await productModel.findOne({
      _id: product_id,
      is_delete: false,
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variant = new productVariantModel({
      sku,
      product_id,
      size,
      quantity,
      price,
      image,
    });

    const newVariant = await variant.save();

    return res.status(201).json({
      message: "Create product variant successfully!",
      data: { variant: newVariant },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: "sku already exists" });
    }
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProductVariants = async (req, res) => {
  try {
    const { product_id } = req.query;
    const filter = { is_delete: false };

    if (typeof product_id !== "undefined" && product_id !== "") {
      if (!mongoose.Types.ObjectId.isValid(product_id)) {
        return res.status(400).json({ error: "Invalid product id" });
      }
      filter.product_id = product_id;
    }

    const variants = await productVariantModel
      .find(filter)
      .populate("product_id", "product_name description product_code category_id");
    return res.status(200).json({ data: { variants } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProductVariantById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product variant id" });
    }
    const variant = await productVariantModel.findOne({
      _id: id,
      is_delete: false,
    });

    if (!variant) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    return res.status(200).json({ data: { variant } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product variant id" });
    }

    const { sku, product_id, size, quantity, price, image } = req.body;
    const update = {};

    if (typeof sku !== "undefined") {
      if (!sku) {
        return res.status(400).json({ error: "sku is required" });
      }
      update.sku = sku;
    }

    if (typeof product_id !== "undefined") {
      if (!mongoose.Types.ObjectId.isValid(product_id)) {
        return res.status(400).json({ error: "Invalid product id" });
      }
      const product = await productModel.findOne({
        _id: product_id,
        is_delete: false,
      });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      update.product_id = product_id;
    }

    if (typeof size !== "undefined") {
      update.size = size;
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

    if (typeof image !== "undefined") {
      update.image = image;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const variant = await productVariantModel.findOneAndUpdate(
      { _id: id, is_delete: false },
      update,
      { new: true }
    );

    if (!variant) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    return res.status(200).json({
      message: "Update product variant successfully!",
      data: { variant },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: "sku already exists" });
    }
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product variant id" });
    }

    const variant = await productVariantModel.findOne({
      _id: id,
      is_delete: false,
    });

    if (!variant) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    removeVariantImage(variant.image);
    await productVariantModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Delete product variant successfully!",
      data: { variant },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.uploadProductVariantImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product variant id" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const variant = await productVariantModel.findOne({
      _id: id,
      is_delete: false,
    });
    if (!variant) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    const fileName = await uploadFile(req.file, "product_variants");
    const oldImage = variant.image;
    variant.image = fileName;
    await variant.save();
    if (oldImage && oldImage !== fileName) {
      removeVariantImage(oldImage);
    }

    return res.status(200).json({
      message: "Upload product variant image successfully!",
      data: { variant },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
