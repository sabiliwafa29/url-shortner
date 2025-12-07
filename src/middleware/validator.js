const Joi = require('joi');

/**
 * Validate URL creation request
 */
exports.validateUrl = (req, res, next) => {
  const schema = Joi.object({
    originalUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required()
      .messages({
        'string.uri': 'Please provide a valid URL with http:// or https://',
        'any.required': 'Original URL is required'
      }),
    
    customAlias: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .optional()
      .messages({
        'string.alphanum': 'Custom alias can only contain letters and numbers',
        'string.min': 'Custom alias must be at least 3 characters',
        'string.max': 'Custom alias cannot exceed 20 characters'
      }),
    
    expiresIn: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .optional()
      .messages({
        'number.min': 'Expiration must be at least 1 day',
        'number.max': 'Expiration cannot exceed 365 days'
      }),
    
    title: Joi.string()
      .max(255)
      .optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * Validate user registration
 */
exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
        'any.required': 'Password is required'
      }),
    
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * Validate user login
 */
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * Validate profile update
 */
exports.validateProfileUpdate = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address'
      })
  }).min(1); // At least one field must be present

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * Validate password change
 */
exports.validatePasswordChange = (req, res, next) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters',
        'string.pattern.base': 'New password must contain uppercase, lowercase, and number',
        'any.required': 'New password is required'
      })
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details[0].message
    });
  }

  req.body = value;
  next();
};
