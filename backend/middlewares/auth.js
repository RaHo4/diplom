const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  console.log(req.rawHeaders);
  console.log(req.headers.authorisation);

  if (
    req.headers.authorisation &&
    req.headers.authorisation.startsWith("Bearer")
  ) {
    try {
      // Получить токен из заголовка
      token = req.headers.authorisation.split(" ")[1];
      // Верификация токена
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Получить пользователя из токена и добавить в req
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Не авторизован, токен недействителен",
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Не авторизован, нет токена",
    });
  }
};

module.exports = { protect };
