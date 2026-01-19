const { accModel } = require("../models/account.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.doLogin = async (req, res) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await accModel.findByEmailPasswd(email, pass);
    if (!user) {
      return res.status(401).json({ error: "Incorrect login credentials" });
    }

    const token = await accModel.makeAuthToken(user);

    const userResponse = user.toObject();
    delete userResponse.pass;

    return res.status(200).json({
      message: "Login successfully!",
      data: { user: userResponse, token },
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.doReg = async (req, res, next) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existed = await accModel.findOne({ email });
    if (existed) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(pass, salt);

    const user = new accModel({
      ...req.body,
      pass: hashedPass,
      role: req.body.role || "user",
    });

    const newUser = await user.save();

    const token = await accModel.makeAuthToken(newUser);

    const userResponse = newUser.toObject();
    delete userResponse.pass;

    return res.status(201).json({
      message: "Register successfully!",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
