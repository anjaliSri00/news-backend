//Express-Validator
const { body, param, query } = require('express-validator');

//Sign-Up validation
const signUp = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name should be a string')
    .matches(/^[A-Za-z]+$/)
    .withMessage('First name should contain only alphabets'),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name should be a string'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address.')
    .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .withMessage('Please enter a valid email address with a proper domain (e.g., gmail.com).')
    .custom((email) => {
      const domainParts = email.split('@')[1]?.split('.') || [];
      if (domainParts.length < 2 || domainParts[0].length < 2 || domainParts[1].length < 2) {
        throw new Error('Email domain should be valid and contain at least two characters.');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password should be a string'),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .isMobilePhone('en-IN') // Validates as per Indian phone number format
    .withMessage('Invalid Indian mobile phone number'),
  body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .isString()
    .withMessage('Confirm password should be a string')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('profession')
    .optional()
    .isString()
    .withMessage('Profession should be a string'),
  body('session_id')
    .optional()
    .isString()
    .withMessage('Session ID should be a string')
    .matches(/^session_[0-9]+_[a-f0-9]+$/)
    .withMessage('Invalid session ID format'),
  body('otp')
    .optional()
    .isNumeric()
    .withMessage('OTP should be a string')
];

//Login Validation
const login = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email is required')
    .withMessage('Invalid email address.'),
  body('password')
    .optional()
    .isString()
    .withMessage('Password is required')
    .withMessage('Password should be a string'),
  body('mobile')
    .optional()
    .isNumeric()
    .withMessage('Mobile number is required')
    .withMessage('Mobile number is required'),
  body('otp')
    .optional()
    .isNumeric()
    .withMessage('OTP is required')
    .withMessage('OTP is required'),
  body('action')
    .optional()
    .isString()
    .withMessage('Action is required')
    .withMessage('Action must be a string')
    .isIn(['verify', 'generate'])
    .withMessage('Action should be either "verify" or "generate"'),
  body('session_id')
    .optional()
    .isString()
    .withMessage('Session id is required')
    .withMessage('Session id should be a string'),
];

//update user details validation
const updateUserDetails = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name should be a string'),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name should be a string'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password should be a string'),
  body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .isString()
    .withMessage('Confirm password should be a string'),
  body('profession')
    .optional()
    .isString()
    .withMessage('Profession should be a string'),
  body('bio')
    .optional()
    .isString()
    .withMessage('Bio is required')
    .withMessage('Bio should be a string'),
];

//Save changes in profile setting
const saveChangesInProfile = [
  body("first_name")
    .optional()
    .isString()
    .withMessage("First name should be a string"),

  body("last_name")
    .optional()
    .isString()
    .withMessage("Last name should be a string"),

  body("email").optional().isEmail().withMessage("Invalid email address"),
  body("password")
    .optional()
    .isString()
    .withMessage("Password should be a string"),

  body("confirm_password")
    .optional()
    .isString()
    .withMessage("Confirm password should be a string"),

  body("profession")
    .optional()
    .isString()
    .withMessage("Profession should be a string"),

  body("bio").optional().isString().withMessage("Bio should be a string"),
];

//Save address validation
const saveAddress = [
  body('address_name')
    .optional()
    .isString()
    .withMessage('Address name is required')
    .withMessage('Address name should be a string'),
  body('address_category')
    .notEmpty()
    .withMessage('Address category is required')
    .isString()
    .withMessage('Address category should be a string'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isString()
    .withMessage('Address should be a string'),
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .withMessage('City should be a string'),
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isString()
    .withMessage('State should be a string'),
  body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .isLength({ min: 6,
      max: 6 })
    .withMessage('Pincode must be exactly 6 digits.')
    .isNumeric()
    .withMessage('Pincode must contain only numeric digits.'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat()
    .withMessage('Latitude should be valid'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat()
    .withMessage('Latitude should be valid'),
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('Is default is required')
    .withMessage('Is default value either true or false'),
];

//forgot password validation
const forgotPassword = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('new_password')
    .optional()
    .isString()
    .withMessage('New password is required')
    .withMessage('New password should be a valid string'),
  body('confirm_password')
    .optional()
    .isString()
    .withMessage('Confirm password is required')
    .withMessage('Confirm password should be valid string'),
  param('session_id')
    .optional()
    .isString()
    .withMessage('Session id is required')
    .withMessage('Session id should be a string'),
  param('otp')
    .optional()
    .isString()
    .withMessage('Otp is required')
    .withMessage('OTP should be a valid string'),
];

//reset password validation
const resetPassword = [
  query('session_id')
    .notEmpty()
    .withMessage('Session id is required')
    .isString()
    .withMessage('Session is should be a valid string'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isString()
    .withMessage('New password should be a valid string'),
  body('confirm_password')
    .notEmpty()
    .withMessage('Confiorm password is required')
    .isString('Confirm password shoulf be a valid string'),
];

//change password validation
const changePassword = [
  body('old_password')
    .notEmpty()
    .withMessage('Old password is required')
    .isString()
    .withMessage('Old password should be a valid string'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isString()
    .withMessage('New password should be a valid string'),
  body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .isString()
    .withMessage('Confirm password should be a valid string'),
];

const emailValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
];

module.exports = {
  signUp,
  login,
  updateUserDetails,
  saveChangesInProfile,
  saveAddress,
  forgotPassword,
  resetPassword,
  changePassword,
  emailValidator,
};
