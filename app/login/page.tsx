"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { login } from '@/app/auth/actions';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
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
          <Link href="/" className="text-xl font-bold tracking-tighter text-[#5f5e5e]">
            StockViz
          </Link>
        </header>

        <div className="w-full max-w-[480px] flex flex-col gap-10 py-6">
          {/* Auth Card Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-10"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold tracking-tight text-[#5f5e5e] mb-4">Welcome back</h2>
              <p className="text-[#5a6060] text-base leading-relaxed">
                Enter your credentials to access your terminal.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 text-sm font-medium text-[#752121] bg-[#fe8983]/20 rounded-xl border border-[#fe8983]/30"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-1.5">
                <Label className="block text-xs font-bold uppercase tracking-widest text-[#5a6060] mb-2.5" htmlFor="email">
                  Email Address
                </Label>
                <motion.div
                  animate={fieldErrors.email ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb3b2] h-5 w-5" />
                  <Input
                    className={`w-full pl-12 pr-4 h-[52px] bg-white border ${fieldErrors.email ? 'border-[#752121]' : 'border-[#adb3b2]/20'} focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-base transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none`}
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    onChange={() => setFieldErrors(prev => ({ ...prev, email: undefined }))}
                  />
                </motion.div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-2.5">
                  <Label className="block text-xs font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="password">
                    Password
                  </Label>
                  <a className="text-xs font-bold text-[#5f5e5e] hover:text-[#2d3433] transition-colors" href="#">
                    Forgot password?
                  </a>
                </div>
                <motion.div
                  animate={fieldErrors.password ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb3b2] h-5 w-5" />
                  <Input
                    className={`w-full pl-12 pr-12 h-[52px] bg-white border ${fieldErrors.password ? 'border-[#752121]' : 'border-[#adb3b2]/20'} focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-base transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none`}
                    id="password"
                    name="password"
                    placeholder="********"
                    type={showPassword ? "text" : "password"}
                    onChange={() => setFieldErrors(prev => ({ ...prev, password: undefined }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb3b2] hover:text-[#5f5e5e] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>
              </div>
              <Button
                disabled={isPending}
                className="w-full bg-[#5f5e5e] text-white h-[56px] px-4 rounded-xl font-bold text-base transition-all duration-200 hover:opacity-90 hover:bg-[#5f5e5e] active:scale-[0.99] mt-6 shadow-none disabled:opacity-50"
                type="submit"
              >
                {isPending ? 'Processing...' : 'Sign In'}
              </Button>
            </form>
          </motion.div>

          {/* Footer Links */}
          <p className="text-center text-sm text-[#5a6060]">
            Don&apos;t have an account?{' '}
            <Link className="font-bold text-[#5f5e5e] hover:text-[#525251] transition-colors underline underline-offset-4" href="/register">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="mt-auto w-full border-t border-[#adb3b2]/20 bg-[#f9f9f8]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center py-10 px-8 gap-4 text-[10px] tracking-widest uppercase text-[#5a6060]">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <span>&copy; 2024 StockViz Editorial. All rights reserved.</span>
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
