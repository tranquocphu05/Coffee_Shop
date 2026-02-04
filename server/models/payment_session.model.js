const db = require("./db");

const paymentSessionSchema = new db.mongoose.Schema(
  {
    user_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "accModel",
      required: true,
    },
    address_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "addressModel",
      required: true,
    },
    items: [
      {
        variants_id: {
          type: db.mongoose.Schema.Types.ObjectId,
          ref: "productVariantModel",
          required: true,
        },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
      },
    ],
    total_amount: { type: Number, default: 0 },
    status: { type: String, default: "PENDING" },
    orderInfo: { type: String, default: null },
    order_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "orderModel",
      default: null,
    },
    vnpTransactionNo: { type: String, default: null },
    paidAt: { type: Date, default: null },
  },
  { collection: "payment_session", timestamps: true }
);

const paymentSessionModel = db.mongoose.model(
  "paymentSessionModel",
  paymentSessionSchema
);

module.exports = { paymentSessionModel };
