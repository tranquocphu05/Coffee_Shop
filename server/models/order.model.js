const db = require("./db");

const orderSchema = new db.mongoose.Schema(
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
    status: { type: String, required: true },
    total_amount: { type: Number, default: 0 },
  },
  { collection: "order", timestamps: true },
);

const orderModel = db.mongoose.model("orderModel", orderSchema);
module.exports = { orderModel };
