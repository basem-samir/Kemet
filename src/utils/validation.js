export const regexPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^.{6,}$/,
  name: /^[a-zA-Z\s\-']{2,50}$/,
  phone: /^\+?[0-9]{10,15}$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  slug: /^[a-z0-9-]+$/,
  number: /^[1-9][0-9]*$/,
};

export const validationMessages = {
  email: 'Please enter a valid email address.',
  password: 'Password must be at least 6 characters long.',
  name: 'Name must be between 2 and 50 characters, containing only letters, spaces, hyphens, or apostrophes.',
  phone: 'Phone number must be between 10 and 15 digits. It may start with a + sign.',
  url: 'Please enter a valid URL (e.g., https://example.com).',
  slug: 'Slug must contain only lowercase letters, numbers, and hyphens without spaces.',
  number: 'Please enter a valid positive number.',
};

export const validateField = (type, value) => {
  if (!value) return ''; // Empty fields are handled by 'required' attribute, not regex
  const pattern = regexPatterns[type];
  if (!pattern) return '';
  return pattern.test(value) ? '' : validationMessages[type];
};
