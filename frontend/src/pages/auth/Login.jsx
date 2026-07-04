import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters long'),
});

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await login(data.email, data.password);
      toast.success('Successfully logged in!');
      navigate('/');
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06040b] flex items-center justify-center relative overflow-hidden px-4">
      {/* Dynamic Glowing Accent Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-brand-light/10 blur-[130px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#4D0E80]/15 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-md glass-card rounded-4xl p-8 md:p-10 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-light to-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans text-center">
            RK Event System
          </h2>
          <p className="text-slate-400 text-sm mt-2 text-center">
            Please sign in to manage your invoices
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@rkevent.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-white text-sm outline-none placeholder:text-slate-500"
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl glass-input text-white text-sm outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-brand-light to-brand hover:from-brand hover:to-brand-dark text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-brand/20 transition-all duration-200 text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
