const { check } = require('express-validator');

const userValidator = {
  create: [
    check('username', 'Имя пользователя обязательно').not().isEmpty(),
    check('email', 'Введите корректный email').isEmail(),
    check('password', 'Пароль должен быть не менее 6 символов').isLength({ min: 6 }),
    check('firstName', 'Имя обязательно').not().isEmpty(),
    check('lastName', 'Фамилия обязательна').not().isEmpty(),
    check('role', 'Роль должна быть одной из: duty, dispatcher, firefighter, admin')
      .isIn(['duty', 'dispatcher', 'firefighter', 'admin']),
  ],
  update: [
    check('email', 'Введите корректный email').optional().isEmail(),
    check('password', 'Пароль должен быть не менее 6 символов').optional().isLength({ min: 6 }),
    check('role', 'Роль должна быть одной из: duty, dispatcher, firefighter, admin')
      .optional()
      .isIn(['duty', 'dispatcher', 'firefighter', 'admin']),
  ],
};

const buildingValidator = {
  create: [
    check('name', 'Название здания обязательно').not().isEmpty(),
    check('address', 'Адрес здания обязателен').not().isEmpty(),
    check('floors', 'Количество этажей должно быть положительным числом').isInt({ min: 1 }),
  ],
  update: [
    check('floors', 'Количество этажей должно быть положительным числом').optional().isInt({ min: 1 }),
    check('status', 'Статус должен быть одним из: normal, fire, maintenance')
      .optional()
      .isIn(['normal', 'fire', 'maintenance']),
  ],
};

const alarmValidator = {
  create: [
    check('buildingId', 'ID здания обязателен').not().isEmpty(),
    check('floorId', 'ID этажа обязателен').not().isEmpty(),
    check('name', 'Название извещателя обязательно').not().isEmpty(),
    check('type', 'Тип извещателя обязателен').not().isEmpty(),
    check('coordinates.x', 'X-координата должна быть числом').isNumeric(),
    check('coordinates.y', 'Y-координата должна быть числом').isNumeric(),
  ],
  updateStatus: [
    check('status', 'Статус должен быть одним из: normal, alarm, fault, disabled')
      .isIn(['normal', 'alarm', 'fault', 'disabled']),
  ],
};

const brigadeValidator = {
  create: [
    check('name', 'Название бригады обязательно').not().isEmpty(),
    check('members', 'Члены бригады должны быть массивом').optional().isArray(),
  ],
  assign: [
    check('buildingId', 'ID здания обязателен').not().isEmpty(),
  ],
  updateStatus: [
    check('status', 'Статус должен быть одним из: en-route, on-site, returning, available')
      .isIn(['en-route', 'on-site', 'returning', 'available']),
  ],
};

module.exports = {
  userValidator,
  buildingValidator,
  alarmValidator,
  brigadeValidator,
};