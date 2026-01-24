const db = require("./db");

const orderDetailSchema = new db.mongoose.Schema(
  {
    order_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "orderModel",
      required: true,
    },
    variants_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "productVariantModel",
      required: true,
    },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
  },
  { collection: "order_detail" }
);

const orderDetailModel = db.mongoose.model(
  "orderDetailModel",
  orderDetailSchema
);
module.exports = { orderDetailModel };
