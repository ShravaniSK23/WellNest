import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const validatePasswordStrength = (password: string): boolean => {
  // Min 8 chars, at least one letter, at least one digit (REQ-UA-3)
  const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return regex.test(password);
};
