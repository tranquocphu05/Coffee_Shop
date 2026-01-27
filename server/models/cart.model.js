const db = require("./db");

const cartSchema = new db.mongoose.Schema(
  {
    user_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "accModel",
      required: true,
    },
    product_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "productModel",
      required: false,
    },
    variants_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "productVariantModel",
      required: true,
    },
    quantity: { type: Number, default: 1, min: 0 },
    price: { type: Number, default: 0, min: 0 },
  },
  { collection: "cart" },
);

const cartModel = db.mongoose.model("cartModel", cartSchema);
module.exports = { cartModel };
