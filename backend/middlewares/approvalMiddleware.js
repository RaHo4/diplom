// const User = require("../models/User");

const approval = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "Пользователь не существует",
    });
  }
  if (!req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: "Аккаунт не подтверждён администратором",
    });
  }
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Аккаунт деактивирован",
    });
  }
  next();
};

module.exports = { approval };
