const { addressModel } = require("../models/address.model");
const mongoose = require("mongoose");

const toApiAddress = (address) => ({
  _id: address._id,
  user_id: address.account_id,
  fullName: address.name,
  phone: address.phone,
  address: address.address,
  is_delete: address.is_delete,
});

const getAccountId = (body) => body.user_id || body.account_id;

exports.createAddress = async (req, res) => {
  try {
    const { fullName, name, phone } = req.body;
    const accountId = getAccountId(req.body);

    if (!accountId || (!fullName && !name) || !phone) {
      return res
        .status(400)
        .json({ error: "Missing user_id/account_id, fullName/name or phone" });
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const address = new addressModel({
      account_id: accountId,
      name: fullName || name,
      phone,
      address: req.body.address || "",
    });

    const newAddress = await address.save();

    return res.status(201).json({
      message: "Create address successfully!",
      data: { address: toApiAddress(newAddress) },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const { user_id } = req.query;
    const filter = { is_delete: false };

    if (typeof user_id !== "undefined" && user_id !== "") {
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ error: "Invalid user id" });
      }
      filter.account_id = user_id;
    }

    const addresses = await addressModel.find(filter);
    return res
      .status(200)
      .json({ data: { addresses: addresses.map(toApiAddress) } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid address id" });
    }
    const address = await addressModel.findOne({ _id: id, is_delete: false });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    return res.status(200).json({ data: { address: toApiAddress(address) } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid address id" });
    }

    const { fullName, name, phone, address, is_delete, user_id, account_id } =
      req.body;
    const update = {};

    const accountId = user_id || account_id;
    if (typeof accountId !== "undefined") {
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(400).json({ error: "Invalid user id" });
      }
      update.account_id = accountId;
    }

    if (typeof fullName !== "undefined") update.name = fullName;
    if (typeof name !== "undefined") update.name = name;
    if (typeof phone !== "undefined") update.phone = phone;
    if (typeof address !== "undefined") update.address = address;
    if (typeof is_delete !== "undefined") update.is_delete = is_delete;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await addressModel.findOneAndUpdate(
      { _id: id, is_delete: false },
      update,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Address not found" });
    }

    return res.status(200).json({
      message: "Update address successfully!",
      data: { address: toApiAddress(updated) },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid address id" });
    }
    const address = await addressModel.findOne({ _id: id, is_delete: false });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    address.is_delete = true;
    await address.save();

    return res.status(200).json({
      message: "Delete address successfully!",
      data: { address: toApiAddress(address) },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
