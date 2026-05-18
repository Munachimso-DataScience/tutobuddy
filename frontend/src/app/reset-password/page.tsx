'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Lock, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { account } from '@/lib/appwrite';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    // Check if we have the required parameters
    if (!userId || !secret) {
      toast.error('Invalid reset link. Please request a new password reset.');
      router.push('/forgot-password');
      return;
    }
    setIsValidToken(true);
  }, [userId, secret, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use Appwrite's updateRecovery to reset the password
      await account.updateRecovery(userId, secret, password);

      toast.success('Password reset successfully! Please log in with your new password.');
      router.push('/login');
    } catch (err: any) {
      console.error('Password reset error:', err);
      toast.error(err?.message || 'Failed to reset password. The link may have expired.');
      // If the token is invalid, redirect to forgot password
      if (err?.code === 401 || err?.type === 'user_recovery_token_invalid') {
        router.push('/forgot-password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl"
      >
        <div className="text-center">
          <div className="mx-auto h-20 w-20 mb-6 bg-white dark:bg-gray-700 rounded-3xl p-3 shadow-xl flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Reset Password</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Enter your new password below.</p>
        </div>

        <form className="space-y-6" onSubmit={handleReset}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <button
            onClick={() => router.push('/login')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading password reset form...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}