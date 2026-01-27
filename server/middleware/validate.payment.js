exports.validatePaymentRequest = (req, res, next) => {
  const { amount, orderId } = req.body;

  const errors = [];

  if (!amount) errors.push("amount is required");
  if (!orderId) errors.push("orderId is required");

  if (amount && (isNaN(amount) || amount <= 0)) {
    errors.push("amount must be a positive number");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      msg: "Validation failed",
      errors,
    });
  }

  next();
};
