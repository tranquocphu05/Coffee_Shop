const { productModel } = require("../models/product.model");

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
    const { category_id, product_code, product_name, description, is_delete } =
      req.body;

    const product = await productModel.findOneAndUpdate(
      { _id: id, is_delete: false },
      { category_id, product_code, product_name, description, is_delete },
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
    const product = await productModel.findOneAndUpdate(
      { _id: id, is_delete: false },
      { is_delete: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({
      message: "Delete product successfully!",
      data: { product },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
