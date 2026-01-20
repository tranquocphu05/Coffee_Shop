const db = require("./db");

const categorySchema = new db.mongoose.Schema(
  {
    category_code: { type: String, required: true, unique: true },
    category_name: { type: String, required: true },
    is_delete: { type: Boolean, default: false },
  },
  { collection: "category" }
);

const categoryModel = db.mongoose.model("categoryModel", categorySchema);
module.exports = { categoryModel };
