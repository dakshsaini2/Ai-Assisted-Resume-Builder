import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

const SALT_ROUNDS = 10;

// Safe user select — never return the password hash
const safeUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
};

export const registerUser = async (data: RegisterInput) => {
  const email = data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: safeUserSelect,
  });

  const token = signToken({ userId: user.id, email: user.email });

  return { user, token };
};

export const loginUser = async (data: LoginInput) => {
  const email = data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  return user;
};

