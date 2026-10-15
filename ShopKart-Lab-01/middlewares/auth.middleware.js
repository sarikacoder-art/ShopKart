const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

async function protect(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.customerId);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: customer not found",
      });
    }

    // The next controller can access the logged-in customer as req.user.
    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  }
}

module.exports = protect;
