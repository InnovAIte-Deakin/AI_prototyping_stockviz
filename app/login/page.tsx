"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { login } from '@/app/auth/actions';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const newFieldErrors: { email?: string; password?: string } = {};
    if (!email) newFieldErrors.email = "Email is required";
    if (!password) newFieldErrors.password = "Password is required";

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Please fill out all required fields");
      return;
    }

    setFieldErrors({});
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };
  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#2d3433] flex flex-col selection:bg-[#e4e2e1] selection:text-[#525251]">
      <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12">
        {/* Brand Header */}
        <header className="mb-8 text-center shrink-0">
          <Link href="/" className="text-xl font-bold tracking-tighter text-[#2d3433]">
            StockViz
          </Link>
        </header>

        <div className="w-full max-w-[440px] flex flex-col gap-8 py-4">
        {/* Auth Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 border border-[#adb3b2]/10 rounded-2xl shadow-[0_4px_24px_-12px_rgba(45,52,51,0.08)]"
        >
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#2d3433] mb-2">Welcome back</h2>
            <p className="text-[#5a6060] text-sm">Enter your credentials to access your terminal.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 text-sm font-medium text-[#752121] bg-[#fe8983]/20 rounded-xl border border-[#fe8983]/30">
                {error}
              </motion.div>
            )}
            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060] mb-2" htmlFor="email">
                Email Address
              </Label>
              <Input
                className={`w-full px-4 h-[44px] bg-white border ${fieldErrors.email ? 'border-[#752121]' : 'border-[#adb3b2]/20'} focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-sm transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none`}
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
                onChange={() => setFieldErrors(prev => ({ ...prev, email: undefined }))}
              />
              {fieldErrors.email && (
                <p className="text-[10px] text-[#752121] mt-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center mb-2">
                <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="password">
                  Password
                </Label>
                <a className="text-[10px] font-bold text-[#5f5e5e] hover:text-[#2d3433] transition-colors" href="#">
                  Forgot password?
                </a>
              </div>
              <Input
                className={`w-full px-4 h-[44px] bg-white border ${fieldErrors.password ? 'border-[#752121]' : 'border-[#adb3b2]/20'} focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-sm transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none`}
                id="password"
                name="password"
                placeholder="••••••••"
                type="password"
                onChange={() => setFieldErrors(prev => ({ ...prev, password: undefined }))}
              />
              {fieldErrors.password && (
                <p className="text-[10px] text-[#752121] mt-1 font-medium">{fieldErrors.password}</p>
              )}
            </div>
            <Button
              disabled={isPending}
              className="w-full bg-[#5f5e5e] text-white h-[48px] px-4 rounded-xl font-medium text-sm transition-all duration-200 hover:opacity-90 hover:bg-[#5f5e5e] active:scale-[0.99] mt-2 shadow-none disabled:opacity-50"
              type="submit"
            >
              {isPending ? 'Processing...' : 'Sign In'}
            </Button>
          </form>
        </motion.div>

        {/* Footer Links */}
        <p className="text-center text-sm text-[#5a6060]">
          Don't have an account?{' '}
          <Link className="font-semibold text-[#5f5e5e] hover:text-[#2d3433] transition-colors" href="/register">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>

    {/* Global Footer */}
    <footer className="mt-auto w-full border-t border-[#adb3b2]/20 bg-[#f9f9f8]">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center py-10 px-8 gap-4 text-[10px] tracking-widest uppercase text-[#5a6060]">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <span>© 2024 StockViz Editorial. All rights reserved.</span>
        </div>
        <nav className="flex gap-8">
          <a className="hover:text-[#5f5e5e] transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-[#5f5e5e] transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-[#5f5e5e] transition-colors" href="#">Legal Disclosures</a>
        </nav>
      </div>
    </footer>
  </div>
);
}
