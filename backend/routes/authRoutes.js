const express = require('express');
const { register, login, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { check } = require('express-validator');
const { approval } = require('../middlewares/approvalMiddleware');

const router = express.Router();

// Валидация для регистрации
const registerValidation = [
  check('username', 'Имя пользователя обязательно').not().isEmpty(),
  check('email', 'Введите корректный email').isEmail(),
  check('password', 'Пароль должен быть не менее 6 символов').isLength({ min: 6 }),
  check('firstName', 'Имя обязательно').not().isEmpty(),
  check('lastName', 'Фамилия обязательна').not().isEmpty(),
  check('role', 'Роль должна быть одной из: duty, dispatcher, firefighter, admin')
    .isIn(['duty', 'dispatcher', 'firefighter', 'admin']),
];

router.post('/register', registerValidation, register);
router.post('/login', login);
router.get('/me', protect, approval, getUserProfile);

module.exports = router;