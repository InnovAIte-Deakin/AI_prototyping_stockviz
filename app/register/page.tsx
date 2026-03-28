"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { signup } from '@/app/auth/actions';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; terms?: string }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const terms = formData.get("terms") === "on";

    const newFieldErrors: { name?: string; email?: string; password?: string; terms?: string } = {};
    if (!name) newFieldErrors.name = "Full name is required";
    if (!email) newFieldErrors.email = "Email is required";
    if (!password) newFieldErrors.password = "Password is required";
    if (!terms) newFieldErrors.terms = "You must agree to the terms";

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Please fill out all required fields");
      return;
    }

    setFieldErrors({});
    setError(null);
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f9f9f8] flex flex-col">
      {/* Header */}
      <header className="w-full h-16 px-8 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tighter text-[#2d3433]">
          StockViz
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          {['Markets', 'News', 'Analysis'].map((item) => (
            <a key={item} href="#" className="text-sm font-medium text-[#5a6060] hover:text-[#2d3433] transition-colors">
              {item}
            </a>
          ))}
          <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-[#2d3433] ml-4">
            Log In
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] bg-white border border-[#adb3b2]/20 p-8 md:p-10 rounded-2xl shadow-[0_4px_24px_-12px_rgba(45,52,51,0.08)] my-4"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#f2f4f3] mb-6 rounded-xl text-[#5f5e5e]">
              <LayoutDashboard size={24} />
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 text-sm font-medium text-[#752121] bg-[#fe8983]/20 rounded-xl border border-[#fe8983]/30">
                {error}
              </motion.div>
            )}
            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="name">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="E.g., Alexander Hamilton"
                className={`w-full px-4 h-[44px] bg-white border ${fieldErrors.name ? 'border-[#752121]' : 'border-[#adb3b2]/30'} focus-visible:border-[#5f5e5e] focus-visible:ring-0 transition-colors text-sm placeholder:text-[#adb3b2]/60 rounded-xl outline-none`}
                onChange={() => setFieldErrors(prev => ({ ...prev, name: undefined }))}
              />
              {fieldErrors.name && (
                <p className="text-[10px] text-[#752121] mt-1 font-medium">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="email">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                className={`w-full px-4 h-[44px] bg-white border ${fieldErrors.email ? 'border-[#752121]' : 'border-[#adb3b2]/30'} focus-visible:border-[#5f5e5e] focus-visible:ring-0 transition-colors text-sm placeholder:text-[#adb3b2]/60 rounded-xl outline-none`}
                onChange={() => setFieldErrors(prev => ({ ...prev, email: undefined }))}
              />
              {fieldErrors.email && (
                <p className="text-[10px] text-[#752121] mt-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="password">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className={`w-full px-4 h-[44px] bg-white border ${fieldErrors.password ? 'border-[#752121]' : 'border-[#adb3b2]/30'} focus-visible:border-[#5f5e5e] focus-visible:ring-0 transition-colors text-sm placeholder:text-[#adb3b2]/60 rounded-xl outline-none pr-10`}
                  onChange={() => setFieldErrors(prev => ({ ...prev, password: undefined }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6060] hover:text-[#5f5e5e]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[10px] text-[#752121] mt-1 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2 py-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  name="terms"
                  className={`mt-1 h-4 w-4 rounded border ${fieldErrors.terms ? 'border-[#752121]' : 'border-[#adb3b2]/30'} text-[#5f5e5e] focus-visible:ring-0 cursor-pointer`}
                  onCheckedChange={() => setFieldErrors(prev => ({ ...prev, terms: undefined }))}
                />
                <Label htmlFor="terms" className="text-xs leading-relaxed text-[#5a6060] font-normal normal-case tracking-normal">
                  I agree to the <a href="#" className="text-[#5f5e5e] hover:underline underline-offset-4">Terms of Service</a> and <a href="#" className="text-[#5f5e5e] hover:underline underline-offset-4">Privacy Policy</a>.
                </Label>
              </div>
              {fieldErrors.terms && (
                <p className="text-[10px] text-[#752121] font-medium">{fieldErrors.terms}</p>
              )}
            </div>

            <Button
              disabled={isPending}
              type="submit"
              className="w-full h-[48px] bg-[#5f5e5e] text-white font-medium tracking-tight text-sm hover:opacity-90 hover:bg-[#5f5e5e] active:scale-[0.99] transition-all duration-200 rounded-xl shadow-none disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-[#5a6060]">
              Already have an account?
              <Link href="/login" className="text-[#2d3433] font-semibold hover:underline underline-offset-4 ml-1">
                Log in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#adb3b2]/20 bg-[#f9f9f8] py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] font-medium tracking-widest uppercase text-[#5a6060]">
            © 2024 STOCKVIZ EDITORIAL. ALL RIGHTS RESERVED.
          </span>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service', 'Legal Disclosures'].map((link) => (
              <a key={link} href="#" className="text-[10px] font-medium tracking-widest uppercase text-[#5a6060] hover:text-[#5f5e5e] transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
