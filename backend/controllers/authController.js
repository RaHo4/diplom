const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');

// @desc    Регистрация пользователя
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, email, password, firstName, lastName, phone, role } = req.body;

  try {
    // Проверка существования пользователя
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Пользователь с таким email или именем пользователя уже существует' 
      });
    }

    // Создание нового пользователя
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      // Администраторы не требуют подтверждения, остальные - требуют
      isApproved: role === 'admin' ? true : false,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: role === 'admin' 
          ? 'Аккаунт администратора создан' 
          : 'Регистрация прошла успешно. Ожидайте подтверждения аккаунта администратором',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при регистрации пользователя',
      error: error.message
    });
  }
};

// @desc    Авторизация пользователя и получение токена
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Поиск пользователя
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверное имя пользователя или пароль' 
      });
    }

    // Проверка пароля
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверное имя пользователя или пароль' 
      });
    }

    // Проверка активности и подтверждения аккаунта
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Аккаунт деактивирован' 
      });
    }

    if (!user.isApproved) {
      return res.status(401).json({ 
        success: false, 
        message: 'Аккаунт ожидает подтверждения администратором' 
      });
    }

    // Успешная авторизация
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при авторизации',
      error: error.message
    });
  }
};

// @desc    Получение данных текущего пользователя
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json({
        success: true,
        user
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении данных пользователя',
      error: error.message
    });
  }
};

module.exports = { register, login, getUserProfile };