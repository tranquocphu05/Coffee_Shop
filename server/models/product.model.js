const db = require("./db");

const productSchema = new db.mongoose.Schema(
  {
    category_id: { type: db.mongoose.Schema.Types.ObjectId },
    product_code: { type: String, required: true, unique: true },
    product_name: { type: String, required: true },
    description: { type: String },
    is_delete: { type: Boolean, default: false },
  },
  { collection: "product" }
);

const productModel = db.mongoose.model("productModel", productSchema);
module.exports = { productModel };
