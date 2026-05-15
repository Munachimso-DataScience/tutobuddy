'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Loader2, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { account } from '@/lib/appwrite';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Appwrite supports a password reset email via createRecovery.
      // NOTE: Ensure your Appwrite email templates / password recovery are enabled.
      // Appwrite SDK signature may vary by version; pass only the required email.
      // Appwrite SDK signature: createRecovery({ email, url })
      // `url` is the redirect page after recovery; set to our reset password page.
      await account.createRecovery({
        email: email.trim(),
        url: `${window.location.origin}/reset-password`,
      });

      setEmailSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl"
        >
          <div className="text-center">
            <div className="mx-auto h-20 w-20 mb-6 bg-green-100 dark:bg-green-900 rounded-3xl p-3 shadow-xl flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Next steps:</strong><br />
                1. Check your email inbox (and spam folder)<br />
                2. Click the reset link in the email<br />
                3. Follow the instructions to set a new password
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </button>

            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Try Different Email
            </button>
          </div>
        </motion.div>
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Enter your email to receive a reset link.</p>
        </div>

        <form className="space-y-6" onSubmit={handleReset}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send reset link'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Remembered your password? </span>
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

