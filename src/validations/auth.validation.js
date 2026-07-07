const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    name: Joi.string().required().messages({
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('admin', 'staff').default('admin'),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

const updateProfile = {
  body: Joi.object().keys({
    name: Joi.string().trim().required().messages({
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required().messages({
      'any.required': 'Old password is required',
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required',
    }),
  }),
};

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
};
