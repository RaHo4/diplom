const checkRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован',
        });
      }
  
      const hasRole = roles.includes(req.user.role);
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'У вас нет прав для выполнения этого действия',
        });
      }
  
      next();
    };
  };
  
  module.exports = { checkRole };