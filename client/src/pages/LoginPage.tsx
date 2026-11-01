import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { ApiResponse, AuthResponse } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
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
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data.success && res.data.data) {
        const { token, user } = res.data.data;
        login(token, user);
        toast.success(`Welcome back, ${user.firstName}!`);

        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Invalid email or password. Please try again.';
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-charcoal-light">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary-dark transition-colors"
          >
            create a free account
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
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="md"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-charcoal-light">
            <span>Don&apos;t have an account yet? </span>
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

