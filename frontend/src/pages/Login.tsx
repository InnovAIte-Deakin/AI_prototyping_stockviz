import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export default function Login() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f8] text-[#2d3433] flex flex-col items-center justify-center p-6 selection:bg-[#e4e2e1] selection:text-[#525251]">
      {/* Brand Header */}
      <header className="mb-12 text-center">
        <Link to="/" className="text-xl font-bold tracking-tighter text-[#2d3433]">
          StockViz
        </Link>
      </header>

      <main className="w-full max-w-[440px] flex flex-col gap-10">
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
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060] mb-2" htmlFor="email">
                Email Address
              </Label>
              <Input
                className="w-full px-4 h-[44px] bg-white border border-[#adb3b2]/20 focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-sm transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none"
                id="email"
                name="email"
                placeholder="name@example.com"
                required
                type="email"
              />
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
                className="w-full px-4 h-[44px] bg-white border border-[#adb3b2]/20 focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-sm transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />
            </div>
            <Button
              className="w-full bg-[#5f5e5e] text-white h-[48px] px-4 rounded-xl font-medium text-sm transition-all duration-200 hover:opacity-90 hover:bg-[#5f5e5e] active:scale-[0.99] mt-2 shadow-none"
              type="submit"
            >
              Sign In
            </Button>
          </form>
        </motion.div>

        {/* Footer Links */}
        <p className="text-center text-sm text-[#5a6060]">
          Don't have an account?{' '}
          <Link className="font-semibold text-[#5f5e5e] hover:text-[#2d3433] transition-colors" to="/register">
            Sign up for free
          </Link>
        </p>
      </main>

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
