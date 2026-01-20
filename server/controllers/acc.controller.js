const { accModel } = require("../models/account.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { uploadFile } = require("../helpers/upload.helper");

// Verify token endpoint
exports.verifyToken = async (req, res) => {
  try {
    // Lấy token từ header hoặc query string
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Tìm user theo token
    const user = await accModel.findOne({ token, is_delete: false });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userResponse = user.toObject();
    delete userResponse.pass;

    return res.status(200).json({
      message: "Token valid",
      data: { user: userResponse },
    });
  } catch (err) {
    console.log('Verify token error:', err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

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

    // Kiểm tra role admin nếu cần (có thể bỏ qua nếu muốn cho tất cả user đăng nhập)
    // if (user.role !== 'admin') {
    //   return res.status(403).json({ error: "Admin access required" });
    // }

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

// Login cho web admin (chỉ admin và engineer)
exports.doLoginWeb = async (req, res, next) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // Dùng cùng model account như app mobile
    const user = await accModel.findByEmailPasswd(email, pass);
    if (!user) {
      return res.status(401).json({ error: "Incorrect login credentials" });
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ error: "Account is locked. Please contact admin" });
    }

    // Chỉ cho phép admin và engineer đăng nhập vào web admin
    if (!user.role || user.role === "user") {
      return res.status(403).json({
        error: "Bạn không có quyền đăng nhập vào hệ thống quản trị",
      });
    }

    const token = await accModel.makeAuthToken(user);

    const userResponse = user.toObject();
    delete userResponse.pass;

    return res.status(200).json({
      message: "Login successful",
      data: { user: userResponse, token },
    });
  } catch (error) {
    console.log(error.message);
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

exports.UploadAvatar = async (req, res, next) => {
  let dataRes = { msg: "OK" };
  try {
    const { _id } = req.params;
    if (!req.file) throw new Error("No file uploaded");

    const user = await accModel.findById(_id);
    if (!user) throw new Error("User not found");

    const fileName = await uploadFile(req.file, "avatars");
    user.image = fileName;
    await user.save();

    dataRes.msg = "Profile picture updated successfully";
    dataRes.data = user;
  } catch (error) {
    dataRes.msg = error.message;
    dataRes.data = null;
  }
  res.json(dataRes);
};

exports.GetAllAccount = async (req, res, next) => {
  let dataRes = { msg: "OK" };
  try {
    let list = await accModel.find();
    dataRes.data = list;
  } catch (error) {
    dataRes.data = null;
    dataRes.msg = error.message;
  }
  res.json(dataRes);
};
