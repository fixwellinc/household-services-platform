import { ValidationError } from './error.js';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation schemas
const validationSchemas = {
  register: {
    email: (value) => {
      if (!value) throw new ValidationError('Email is required');
      if (!EMAIL_REGEX.test(value)) throw new ValidationError('Invalid email format');
      return value.toLowerCase().trim();
    },
    password: (value) => {
      if (!value) throw new ValidationError('Password is required');
      if (value.length < 6) throw new ValidationError('Password must be at least 6 characters');
      if (value.length > 128) throw new ValidationError('Password must be less than 128 characters');
      return value;
    },
    name: (value) => {
      if (!value) throw new ValidationError('Name is required');
      if (value.length < 2) throw new ValidationError('Name must be at least 2 characters');
      if (value.length > 100) throw new ValidationError('Name must be less than 100 characters');
      return value.trim();
    },
    role: (value) => {
      if (value && value !== 'CUSTOMER') {
        throw new ValidationError('Only customer registration is allowed');
      }
      return value || 'CUSTOMER';
    }
  },
  
  login: {
    email: (value) => {
      if (!value) throw new ValidationError('Email is required');
      if (!EMAIL_REGEX.test(value)) throw new ValidationError('Invalid email format');
      return value.toLowerCase().trim();
    },
    password: (value) => {
      if (!value) throw new ValidationError('Password is required');
      return value;
    }
  },
  
  service: {
    name: (value) => {
      if (!value) throw new ValidationError('Service name is required');
      if (value.length < 3) throw new ValidationError('Service name must be at least 3 characters');
      if (value.length > 100) throw new ValidationError('Service name must be less than 100 characters');
      return value.trim();
    },
    description: (value) => {
      if (!value) throw new ValidationError('Service description is required');
      if (value.length < 10) throw new ValidationError('Service description must be at least 10 characters');
      if (value.length > 500) throw new ValidationError('Service description must be less than 500 characters');
      return value.trim();
    },
    category: (value) => {
      const validCategories = ['CLEANING', 'MAINTENANCE', 'REPAIR', 'ORGANIZATION', 'SHOPPING', 'OTHER'];
      if (!value) throw new ValidationError('Service category is required');
      if (!validCategories.includes(value)) throw new ValidationError('Invalid service category');
      return value;
    },
    complexity: (value) => {
      const validComplexities = ['SIMPLE', 'MODERATE', 'COMPLEX'];
      if (!value) throw new ValidationError('Service complexity is required');
      if (!validComplexities.includes(value)) throw new ValidationError('Invalid complexity level');
      return value;
    },
    basePrice: (value) => {
      if (!value) throw new ValidationError('Base price is required');
      const price = parseFloat(value);
      if (isNaN(price) || price <= 0) throw new ValidationError('Base price must be a positive number');
      if (price > 10000) throw new ValidationError('Base price cannot exceed $10,000');
      return price;
    }
  },
  
  booking: {
    serviceId: (value) => {
      if (!value) throw new ValidationError('Service ID is required');
      if (typeof value !== 'string' || value.length < 1) {
        throw new ValidationError('Invalid service ID');
      }
      return value;
    },
    scheduledDate: (value) => {
      if (!value) throw new ValidationError('Scheduled date is required');
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new ValidationError('Invalid date format');
      if (date <= new Date()) throw new ValidationError('Scheduled date must be in the future');
      return date;
    },
    notes: (value) => {
      if (value && value.length > 1000) {
        throw new ValidationError('Notes must be less than 1000 characters');
      }
      return value?.trim() || null;
    }
  }
};

// Validation middleware factory
export const validate = (schemaName) => {
  return (req, res, next) => {
    try {
      const schema = validationSchemas[schemaName];
      if (!schema) {
        throw new ValidationError(`Validation schema '${schemaName}' not found`);
      }
      
      const validatedData = {};
      
      // Validate each field in the schema
      Object.keys(schema).forEach(field => {
        const value = req.body[field];
        validatedData[field] = schema[field](value);
      });
      
      // Replace request body with validated data
      req.body = { ...req.body, ...validatedData };
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Sanitize middleware for general input cleaning
export const sanitize = (req, res, next) => {
  // Remove extra whitespace from string fields
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  });
  
  // Remove undefined and null values
  Object.keys(req.body).forEach(key => {
    if (req.body[key] === undefined || req.body[key] === null) {
      delete req.body[key];
    }
  });
  
  next();
}; 