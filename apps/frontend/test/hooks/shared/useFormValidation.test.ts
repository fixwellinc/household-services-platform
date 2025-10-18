import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useFormValidation, validators, combineValidators, validationSchemas } from '@/hooks/shared/useFormValidation'

describe('useFormValidation', () => {
  describe('validators', () => {
    it('validates required fields', () => {
      const validator = validators.required()
      
      expect(validator('')).toBe('This field is required')
      expect(validator(null)).toBe('This field is required')
      expect(validator(undefined)).toBe('This field is required')
      expect(validator('  ')).toBe('This field is required')
      expect(validator('value')).toBe(null)
    })

    it('validates email format', () => {
      const validator = validators.email()
      
      expect(validator('')).toBe(null) // Empty is valid (use required for mandatory)
      expect(validator('invalid-email')).toBe('Please enter a valid email address')
      expect(validator('test@example.com')).toBe(null)
      expect(validator('user+tag@domain.co.uk')).toBe(null)
    })

    it('validates minimum length', () => {
      const validator = validators.minLength(5)
      
      expect(validator('')).toBe(null) // Empty is valid
      expect(validator('abc')).toBe('Must be at least 5 characters')
      expect(validator('abcdef')).toBe(null)
    })

    it('validates maximum length', () => {
      const validator = validators.maxLength(10)
      
      expect(validator('')).toBe(null)
      expect(validator('short')).toBe(null)
      expect(validator('this is too long')).toBe('Must be no more than 10 characters')
    })

    it('validates phone numbers', () => {
      const validator = validators.phone()
      
      expect(validator('')).toBe(null)
      expect(validator('123')).toBe('Please enter a valid phone number')
      expect(validator('1234567890')).toBe(null)
      expect(validator('+1 (555) 123-4567')).toBe(null)
    })

    it('validates passwords', () => {
      const validator = validators.password()
      
      expect(validator('')).toBe(null)
      expect(validator('123')).toBe('Password must be at least 6 characters')
      expect(validator('password123')).toBe(null)
    })

    it('validates password confirmation', () => {
      const validator = validators.confirmPassword('password')
      
      expect(validator('', {})).toBe(null)
      expect(validator('abc', { password: 'def' })).toBe('Passwords do not match')
      expect(validator('abc', { password: 'abc' })).toBe(null)
    })

    it('validates URLs', () => {
      const validator = validators.url()
      
      expect(validator('')).toBe(null)
      expect(validator('not-a-url')).toBe('Please enter a valid URL')
      expect(validator('https://example.com')).toBe(null)
      expect(validator('http://localhost:3000')).toBe(null)
    })

    it('validates numbers', () => {
      const validator = validators.number()
      
      expect(validator('')).toBe(null)
      expect(validator('abc')).toBe('Please enter a valid number')
      expect(validator('123')).toBe(null)
      expect(validator('123.45')).toBe(null)
    })

    it('validates minimum values', () => {
      const validator = validators.min(10)
      
      expect(validator('')).toBe(null)
      expect(validator('5')).toBe('Must be at least 10')
      expect(validator('15')).toBe(null)
      expect(validator(15)).toBe(null)
    })

    it('validates maximum values', () => {
      const validator = validators.max(100)
      
      expect(validator('')).toBe(null)
      expect(validator('150')).toBe('Must be no more than 100')
      expect(validator('50')).toBe(null)
      expect(validator(50)).toBe(null)
    })

    it('validates custom patterns', () => {
      const validator = validators.pattern(/^[A-Z]+$/, 'Must be uppercase letters only')
      
      expect(validator('')).toBe(null)
      expect(validator('abc')).toBe('Must be uppercase letters only')
      expect(validator('ABC')).toBe(null)
    })

    it('validates custom functions', () => {
      const validator = validators.custom(
        (value) => value === 'special',
        'Must be "special"'
      )
      
      expect(validator('normal')).toBe('Must be "special"')
      expect(validator('special')).toBe(null)
    })
  })

  describe('combineValidators', () => {
    it('combines multiple validators', () => {
      const validator = combineValidators(
        validators.required(),
        validators.minLength(5),
        validators.email()
      )
      
      expect(validator('')).toBe('This field is required')
      expect(validator('abc')).toBe('Must be at least 5 characters')
      expect(validator('abcdef')).toBe('Please enter a valid email address')
      expect(validator('test@example.com')).toBe(null)
    })

    it('returns first error encountered', () => {
      const validator = combineValidators(
        validators.required('Field required'),
        validators.email('Invalid email')
      )
      
      expect(validator('')).toBe('Field required') // First error
    })
  })

  describe('validationSchemas', () => {
    it('provides auth validation schema', () => {
      const { auth } = validationSchemas
      
      expect(auth.email('')).toBe('Email is required')
      expect(auth.email('invalid')).toBe('Please enter a valid email address')
      expect(auth.email('test@example.com')).toBe(null)
      
      expect(auth.password('')).toBe('Password is required')
      expect(auth.password('123')).toBe('Password must be at least 6 characters')
      expect(auth.password('password123')).toBe(null)
    })

    it('provides profile validation schema', () => {
      const { profile } = validationSchemas
      
      expect(profile.name('')).toBe('Name is required')
      expect(profile.name('A')).toBe('Name must be at least 2 characters')
      expect(profile.name('John Doe')).toBe(null)
    })

    it('provides booking validation schema', () => {
      const { booking } = validationSchemas
      
      expect(booking.customerName('')).toBe('Name is required')
      expect(booking.customerEmail('invalid')).toBe('Please enter a valid email address')
      expect(booking.propertyAddress('')).toBe('Property address is required')
    })
  })

  describe('hook functions', () => {
    it('validates single field', () => {
      const { result } = renderHook(() => useFormValidation())
      
      const error = result.current.validateField(
        'test@example.com',
        validators.email()
      )
      
      expect(error).toBe(null)
    })

    it('validates multiple fields', () => {
      const { result } = renderHook(() => useFormValidation())
      
      const values = {
        email: 'invalid-email',
        password: '123'
      }
      
      const errors = result.current.validateFields(values, validationSchemas.auth)
      
      expect(errors.email).toBe('Please enter a valid email address')
      expect(errors.password).toBe('Password must be at least 6 characters')
    })

    it('returns empty errors object for valid fields', () => {
      const { result } = renderHook(() => useFormValidation())
      
      const values = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        confirmPassword: 'password123'
      }
      
      const errors = result.current.validateFields(values, validationSchemas.auth)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })
  })
})