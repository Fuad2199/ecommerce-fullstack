export const userValidationMessages = {
  firstName: {
    min: 'First name must be at least 2 characters',
    max: 'First name must not exceed 50 characters',
  },
  lastName: {
    min: 'Last name must be at least 2 characters',
    max: 'Last name must not exceed 50 characters',
  },
  phone: {
    invalid: 'Invalid phone number format',
  },
  email: {
    valid: 'Valid email is required',
    max: 'Email must not exceed 255 characters',
  },
  username: {
    regex: 'Username can only contain letters, numbers, and underscores',
  },
  password: {
    min: 'Password must be at least 8 characters',
    regex: 'Must contain at least one uppercase letter',
    regex2: 'Must contain at least one lowercase letter',
    regex3: 'Must contain at least one number',
  },
  user: {
    id: 'Valid user ID is required',
  },
};
