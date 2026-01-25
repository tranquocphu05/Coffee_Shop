const jwt = require("jsonwebtoken");
var { accModel } = require("../models/account.model");
require("dotenv").config();
const chuoi_bi_mat = process.env.TOKEN_SEC_KEY;

// hàm kiểm tra đăng nhập
const api_auth = async (req, res, next) => {
  // lấy token trong header
  let header_token = req.header("Authorization");
  console.log("[API Auth] Authorization header:", header_token ? "Present" : "Missing");
  
  if (typeof header_token == "undefined" || header_token == null) {
    return res.status(403).json({ error: "Không xác định token" });
  }
  // nếu có token thì bóc tách lấy chuỗi mã hóa trong token
  let token = header_token.replace("Bearer ", "");
  console.log("[API Auth] Extracted token:", token ? token.substring(0, 20) + "..." : "Empty");
  
  // chú ý: có 1 dấu cách ở sau chữ Bearer
  // kiểm tra token hợp lệ hay không
  try {
    let data = jwt.verify(token, chuoi_bi_mat);
    console.log("[API Auth] Token verified, user ID:", data._id);
    
    // kiểm tra tồn tại user trong csdl
    let user = await accModel.findOne({ _id: data._id, token: token });
    console.log("[API Auth] User found:", user ? "Yes" : "No");
    
    if (user) {
      console.log("[API Auth] User token in DB:", user.token ? user.token.substring(0, 20) + "..." : "Empty");
      console.log("[API Auth] Token match:", user.token === token);
    }
    
    // có thể lấy theo ID sau đó so sánh token bằng code
    if (!user) {
      // Thử tìm user chỉ theo ID để debug
      const userById = await accModel.findOne({ _id: data._id });
      if (userById) {
        console.log("[API Auth] User exists but token mismatch");
        console.log("[API Auth] DB token:", userById.token ? userById.token.substring(0, 20) + "..." : "Empty");
      } else {
        console.log("[API Auth] User not found by ID");
      }
      throw new Error("Không xác định người dùng");
    }
    // ok tồn tại thông tin trong csdl
    req.user = user;
    req.token = token;

    next(); // xác thực ok, cho phép làm tiếp các công việc tiếp theo
  } catch (error) {
    console.error("[API Auth] Error:", error.message);
    res.status(401).send({ error: error.message });
  }
};

const checkRole = (roles = []) => {
  // roles: mảng quyền được phép, ví dụ ['admin'] hoặc ['admin', 'super_admin']
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
    }
    next();
  };
};

module.exports = { api_auth, checkRole };
