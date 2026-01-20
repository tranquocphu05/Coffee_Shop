const jwt = require("jsonwebtoken");
const { accModel } = require("../models/account.model");
require("dotenv").config();
const token_auto = process.env.TOKEN_SEC_KEY;

// Middleware để verify token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token || req.query.token;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, token_auto);
    const user = await accModel.findById(decoded._id);
    
    if (!user || user.token !== token) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware để kiểm tra role admin
exports.requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

