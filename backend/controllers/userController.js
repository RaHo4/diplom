const User = require('../models/User');

// @desc    Получение всех пользователей
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении пользователей',
      error: error.message
    });
  }
};

// @desc    Получение пользователя по ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении пользователя',
      error: error.message
    });
  }
};

// @desc    Обновление пользователя
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.phone = req.body.phone || user.phone;
      user.role = req.body.role || user.role;
      user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
      user.isApproved = req.body.isApproved !== undefined ? req.body.isApproved : user.isApproved;
      
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      const updatedUser = await user.save();
      
      res.json({ 
        success: true, 
        message: 'Пользователь обновлен', 
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          isApproved: updatedUser.isApproved,
        } 
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
      message: 'Ошибка при обновлении пользователя',
      error: error.message
    });
  }
};

// @desc    Удаление пользователя
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (user) {
      res.json({ 
        success: true, 
        message: 'Пользователь удален' 
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
      message: 'Ошибка при удалении пользователя',
      error: error.message
    });
  }
};

// @desc    Получение пользователей, ожидающих подтверждения
// @route   GET /api/users/pending
// @access  Private/Admin
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false }).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении пользователей',
      error: error.message
    });
  }
};

// @desc    Подтверждение пользователя
// @route   PUT /api/users/approve/:id
// @access  Private/Admin
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.isApproved = true;
      const updatedUser = await user.save();
      
      res.json({ 
        success: true, 
        message: 'Пользователь подтвержден', 
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isApproved: updatedUser.isApproved,
        } 
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
      message: 'Ошибка при подтверждении пользователя',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPendingUsers,
  approveUser,
};