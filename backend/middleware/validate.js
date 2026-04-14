const { body } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be between 2 and 100 characters.'),

  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be between 2 and 100 characters.'),

  body('birth_date')
    .trim()
    .notEmpty().withMessage('Birth date is required.')
    .isDate().withMessage('Please provide a valid birth date (YYYY-MM-DD).'),

  body('birth_country')
    .trim()
    .notEmpty().withMessage('Birth country is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Birth country must be between 2 and 100 characters.'),

  body('birth_city')
    .trim()
    .notEmpty().withMessage('Birth city is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Birth city must be between 2 and 100 characters.'),

  body('gender')
    .trim()
    .notEmpty().withMessage('Gender is required.')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Please select a valid gender option.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d\s()-]{7,20}$/).withMessage('Please provide a valid phone number.'),

  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be less than 500 characters.'),
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
];

/**
 * Validation rules for profile update
 */
const updateProfileValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters.'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters.'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s()-]{7,20}$/)
    .withMessage('Please provide a valid phone number.')
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail()
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required.'),
  
  body('password')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  
  body('confirm_password')
    .notEmpty()
    .withMessage('Password confirmation is required.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    })
];

/**
 * Validation rules for creating a book
 */
const bookValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Book title is required.')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters.'),
  
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author name is required.')
    .isLength({ min: 1, max: 200 })
    .withMessage('Author must be between 1 and 200 characters.'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters.'),
  
  body('isbn')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ISBN must be less than 20 characters.'),
  
  body('publication_date')
    .optional()
    .trim(),
  
  body('pages')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pages must be a positive number.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters.'),
  
  body('available_copies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative number.'),
  
  body('total_copies')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total copies must be at least 1.')
];

/**
 * Validation rules for updating a book
 */
const bookUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters.'),
  
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Author must be between 1 and 200 characters.'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters.'),
  
  body('isbn')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ISBN must be less than 20 characters.'),
  
  body('publication_date')
    .optional()
    .trim(),
  
  body('pages')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pages must be a positive number.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters.'),
  
  body('available_copies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative number.'),
  
  body('total_copies')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total copies must be at least 1.')
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  bookValidation,
  bookUpdateValidation
};
