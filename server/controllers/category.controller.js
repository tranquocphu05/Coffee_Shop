const { categoryModel } = require("../models/category.model");

exports.createCategory = async (req, res) => {
  try {
    const { category_code, category_name } = req.body;

    if (!category_code || !category_name) {
      return res
        .status(400)
        .json({ error: "Missing category_code or category_name" });
    }

    const category = new categoryModel({
      category_code,
      category_name,
    });

    const newCategory = await category.save();

    return res.status(201).json({
      message: "Create category successfully!",
      data: { category: newCategory },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: "category_code already exists" });
    }
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({ is_delete: false });
    return res.status(200).json({ data: { categories } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findOne({ _id: id, is_delete: false });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({ data: { category } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_code, category_name, is_delete } = req.body;

    const category = await categoryModel.findOneAndUpdate(
      { _id: id, is_delete: false },
      { category_code, category_name, is_delete },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({
      message: "Update category successfully!",
      data: { category },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: "category_code already exists" });
    }
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findOneAndUpdate(
      { _id: id, is_delete: false },
      { is_delete: true },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({
      message: "Delete category successfully!",
      data: { category },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
