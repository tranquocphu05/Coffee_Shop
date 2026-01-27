const db = require("./db");

const addressSchema = new db.mongoose.Schema(
  {
    account_id: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: "accModel",
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  { collection: "address" },
);

let addressModel = db.mongoose.model("addressModel", addressSchema);
module.exports = { addressModel };
