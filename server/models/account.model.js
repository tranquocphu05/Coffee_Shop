const db = require("./db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const token_auto = process.env.TOKEN_SEC_KEY;
const bcrypt = require("bcrypt");

const accSchema = new db.mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    pass: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["superAdmin", "admin", "engineer", "user"],
      default: "user",
    },
    image: { type: String },
    token: { type: String },
    is_active: { type: Boolean, default: true },
    is_delete: { type: Boolean, default: false },
  },
  { collection: "account" },
);

accSchema.statics.makeAuthToken = async (acc) => {
  const token = jwt.sign({ _id: acc._id, email: acc.email }, token_auto);

  acc.token = token;
  await acc.save();
  return token;
};

accSchema.statics.findByEmailPasswd = async (email, passwd) => {
  const user = await accModel.findOne({ email });
  if (!user) {
    throw new Error("User not found!");
  }

  const checkPass = await bcrypt.compare(passwd, user.pass);
  if (!checkPass) {
    throw new Error("Wrong password!");
  }

  return user;
};

let accModel = db.mongoose.model("accModel", accSchema);
module.exports = { accModel };
