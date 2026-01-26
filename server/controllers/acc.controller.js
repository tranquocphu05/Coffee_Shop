const { accModel } = require("../models/account.model");
const { addressModel } = require("../models/address.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { uploadFile } = require("../helpers/upload.helper");

// Verify token endpoint
exports.verifyToken = async (req, res) => {
  try {
    // Lấy token từ header hoặc query string
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
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
    console.log("Verify token error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.doLoginApp = async (req, res) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await accModel.findByEmailPasswd(email, pass);
    if (!user) {
      return res.status(401).json({ error: "Incorrect login credentials" });
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ error: "Account is locked. Please contact admin" });
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
    const { email, pass, phone, address } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existed = await accModel.findOne({ email });
    if (existed) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(pass, salt);

    // Tạo account (không lưu phone và address vào account)
    const { phone: _, address: __, ...accountData } = req.body;
    const user = new accModel({
      ...accountData,
      pass: hashedPass,
      role: req.body.role || "user",
    });

    const newUser = await user.save();

    // Tạo address nếu có phone hoặc address
    if (phone || address) {
      const newAddress = new addressModel({
        account_id: newUser._id,
        name: newUser.name || "",
        phone: phone || "",
        address: address || "",
      });
      await newAddress.save();
    }

    const token = await accModel.makeAuthToken(newUser);

    const userResponse = newUser.toObject();
    delete userResponse.pass;

    // Thêm phone và address vào response nếu có
    if (phone || address) {
      const userAddress = await addressModel.findOne({ account_id: newUser._id });
      if (userAddress) {
        userResponse.phone = userAddress.phone;
        userResponse.address = userAddress.address;
      }
    }

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
    let list = await accModel.find({ is_delete: false });
    // Lấy address cho mỗi account và thêm phone, address vào response
    list = await Promise.all(
      list.map(async (acc) => {
        const accObj = acc.toObject();
        delete accObj.pass;
        
        // Lấy address đầu tiên của account (nếu có)
        const address = await addressModel.findOne({ account_id: acc._id });
        if (address) {
          accObj.phone = address.phone;
          accObj.address = address.address;
        } else {
          accObj.phone = null;
          accObj.address = null;
        }
        
        return accObj;
      })
    );
    dataRes.data = list;
  } catch (error) {
    dataRes.data = null;
    dataRes.msg = error.message;
  }
  res.json(dataRes);
};

// Get account by ID
exports.getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await accModel.findOne({ _id: id, is_delete: false });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    const accountObj = account.toObject();
    delete accountObj.pass;
    
    // Lấy tất cả addresses của account
    const addresses = await addressModel.find({ account_id: id });
    
    // Thêm addresses vào response
    accountObj.addresses = addresses || [];
    
    // Giữ lại phone và address từ address đầu tiên để tương thích với code cũ
    if (addresses && addresses.length > 0) {
      accountObj.phone = addresses[0].phone;
      accountObj.address = addresses[0].address;
    } else {
      accountObj.phone = null;
      accountObj.address = null;
    }
    
    return res.status(200).json({
      message: "OK",
      data: { customer: accountObj },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update account không có address
exports.updateAccountWithoutAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await accModel.findOne({ _id: id, is_delete: false });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Không cho phép sửa account admin
    if (account.role === "admin") {
      return res.status(403).json({ error: "Cannot edit admin account" });
    }

    const { name, email, role, is_active } = req.body;

    // Cập nhật thông tin account
    if (name) account.name = name;
    if (email) account.email = email;
    if (role) account.role = role;
    if (is_active !== undefined) account.is_active = is_active === "true" || is_active === true;

    // Xử lý password nếu có
    if (req.body.pass && req.body.pass.trim()) {
      const salt = await bcrypt.genSalt(10);
      account.pass = await bcrypt.hash(req.body.pass, salt);
    }

    // Xử lý upload avatar nếu có
    if (req.file) {
      const fileName = await uploadFile(req.file, "avatars");
      account.image = fileName;
    }

    await account.save();

    const accountObj = account.toObject();
    delete accountObj.pass;
    accountObj.phone = null;
    accountObj.address = null;

    return res.status(200).json({
      message: "Update account successfully!",
      data: { account: accountObj },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update account có address
exports.updateAccountWithAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await accModel.findOne({ _id: id, is_delete: false });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Không cho phép sửa account admin
    if (account.role === "admin") {
      return res.status(403).json({ error: "Cannot edit admin account" });
    }

    const { name, email, phone, address, role, is_active } = req.body;

    // Cập nhật thông tin account
    if (name) account.name = name;
    if (email) account.email = email;
    if (role) account.role = role;
    if (is_active !== undefined) account.is_active = is_active === "true" || is_active === true;

    // Xử lý password nếu có
    if (req.body.pass && req.body.pass.trim()) {
      const salt = await bcrypt.genSalt(10);
      account.pass = await bcrypt.hash(req.body.pass, salt);
    }

    // Xử lý upload avatar nếu có
    if (req.file) {
      const fileName = await uploadFile(req.file, "avatars");
      account.image = fileName;
    }

    await account.save();

    // Xử lý nhiều addresses từ form (address_name_0, address_phone_0, address_address_0, address_id_0, ...)
    const addressesToUpdate = [];
    let index = 0;
    
    // Parse các addresses từ form data
    while (req.body[`address_id_${index}`] !== undefined || 
           req.body[`address_name_${index}`] !== undefined || 
           req.body[`address_phone_${index}`] !== undefined || 
           req.body[`address_address_${index}`] !== undefined) {
      
      const addressId = req.body[`address_id_${index}`];
      const addressName = req.body[`address_name_${index}`] || "";
      const addressPhone = req.body[`address_phone_${index}`] || "";
      const addressAddress = req.body[`address_address_${index}`] || "";
      
      // Chỉ xử lý nếu có ít nhất một trong các trường
      if (addressName || addressPhone || addressAddress) {
        addressesToUpdate.push({
          id: addressId,
          name: addressName,
          phone: addressPhone,
          address: addressAddress,
        });
      }
      
      index++;
    }
    
    // Nếu không có addresses từ form với index, thử xử lý phone và address đơn lẻ (tương thích với code cũ)
    if (addressesToUpdate.length === 0 && (phone !== undefined || address !== undefined)) {
      const existingAddress = await addressModel.findOne({ account_id: id });
      
      if (existingAddress) {
        // Cập nhật address hiện có
        if (phone !== undefined) existingAddress.phone = phone || "";
        if (address !== undefined) existingAddress.address = address || "";
        if (name) existingAddress.name = name;
        // Đảm bảo các trường required không bị rỗng
        if (!existingAddress.name) existingAddress.name = account.name || "";
        if (!existingAddress.phone) existingAddress.phone = "";
        if (!existingAddress.address) existingAddress.address = "";
        await existingAddress.save();
      } else {
        // Chỉ tạo address mới nếu có ít nhất phone hoặc address
        if (phone || address) {
          const newAddress = new addressModel({
            account_id: id,
            name: name || account.name || "Chưa có tên",
            phone: phone || "",
            address: address || "",
          });
          await newAddress.save();
        }
      }
    } else if (addressesToUpdate.length > 0) {
      // Xử lý nhiều addresses
      for (const addrData of addressesToUpdate) {
        if (addrData.id) {
          // Cập nhật address hiện có
          const existingAddr = await addressModel.findOne({ 
            _id: addrData.id, 
            account_id: id 
          });
          
          if (existingAddr) {
            existingAddr.name = addrData.name || account.name || "";
            existingAddr.phone = addrData.phone || "";
            existingAddr.address = addrData.address || "";
            await existingAddr.save();
          }
        } else {
          // Tạo address mới
          const newAddress = new addressModel({
            account_id: id,
            name: addrData.name || account.name || "Chưa có tên",
            phone: addrData.phone || "",
            address: addrData.address || "",
          });
          await newAddress.save();
        }
      }
    }

    const accountObj = account.toObject();
    delete accountObj.pass;

    // Lấy tất cả addresses để trả về
    const allAddresses = await addressModel.find({ account_id: id });
    
    if (allAddresses && allAddresses.length > 0) {
      accountObj.phone = allAddresses[0].phone;
      accountObj.address = allAddresses[0].address;
    } else {
      accountObj.phone = null;
      accountObj.address = null;
    }

    return res.status(200).json({
      message: "Update account successfully!",
      data: { account: accountObj },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete account (soft delete)
exports.deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await accModel.findOne({ _id: id, is_delete: false });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Không cho phép xóa account admin
    if (account.role === "admin") {
      return res.status(403).json({ error: "Cannot delete admin account" });
    }

    account.is_delete = true;
    await account.save();

    return res.status(200).json({
      message: "Delete account successfully!",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
