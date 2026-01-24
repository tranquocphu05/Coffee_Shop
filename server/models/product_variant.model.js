const db = require("./db");

const productVariantSchema = new db.mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    product_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "productModel",
    },
    size: { type: String },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    image: { type: String },
    is_delete: { type: Boolean, default: false },
  },
  { collection: "product_variants" }
);

const productVariantModel = db.mongoose.model(
  "productVariantModel",
  productVariantSchema
);
module.exports = { productVariantModel };
