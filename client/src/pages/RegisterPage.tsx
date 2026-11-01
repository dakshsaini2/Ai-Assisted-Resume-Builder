import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { ApiResponse, AuthResponse } from '../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters long';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data.success && res.data.data) {
        const { token, user } = res.data.data;
        login(token, user);
        toast.success(`Welcome to ResumAI, ${user.firstName}!`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Registration failed. Please check your details and try again.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-charcoal">
          <span className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </span>
          <span>
            Resum<span className="text-primary">AI</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-charcoal">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-charcoal-light">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200/80 rounded-2xl sm:px-10">
          {serverError && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Last name"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={errors.lastName}
                required
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              helperText="Must be 6 or more characters"
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="md"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-charcoal-light">
            <span>By creating an account, you agree to build great resumes.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

