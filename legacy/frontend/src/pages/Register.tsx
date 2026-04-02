import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

export default function Register() {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f8] flex flex-col">
      {/* Header */}
      <header className="w-full h-16 px-8 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="text-xl font-bold tracking-tighter text-[#2d3433]">
          StockViz
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          {['Markets', 'News', 'Analysis'].map((item) => (
            <a key={item} href="#" className="text-sm font-medium text-[#5a6060] hover:text-[#2d3433] transition-colors">
              {item}
            </a>
          ))}
          <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-[#2d3433] ml-4">
            Log In
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] bg-white border border-[#adb3b2]/20 p-8 md:p-12 rounded-2xl shadow-[0_4px_24px_-12px_rgba(45,52,51,0.08)]"
        >
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#f2f4f3] mb-6 rounded-xl text-[#5f5e5e]">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#2d3433] mb-2">
              Create an account
            </h1>
            <p className="text-sm text-[#5a6060] leading-relaxed">
              Join the world's most disciplined stock editorial platform.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="name">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="E.g., Alexander Hamilton"
                className="w-full px-4 h-[44px] bg-white border border-[#adb3b2]/30 focus-visible:border-[#5f5e5e] focus-visible:ring-0 transition-colors text-sm placeholder:text-[#adb3b2]/60 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="email">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="w-full px-4 h-[44px] bg-white border border-[#adb3b2]/30 focus-visible:border-[#5f5e5e] focus-visible:ring-0 transition-colors text-sm placeholder:text-[#adb3b2]/60 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="block text-[10px] font-bold uppercase tracking-widest text-[#5a6060]" htmlFor="password">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 h-[44px] bg-white border border-[#adb3b2]/30 focus-visible:border-[#5f5e5e] focus-visible:ring-0 transition-colors text-sm placeholder:text-[#adb3b2]/60 rounded-xl outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6060] hover:text-[#5f5e5e]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <Checkbox
                id="terms"
                className="mt-1 h-4 w-4 rounded border-[#adb3b2]/30 text-[#5f5e5e] focus-visible:ring-0 cursor-pointer"
              />
              <Label htmlFor="terms" className="text-xs leading-relaxed text-[#5a6060] font-normal normal-case tracking-normal">
                I agree to the <a href="#" className="text-[#5f5e5e] hover:underline underline-offset-4">Terms of Service</a> and <a href="#" className="text-[#5f5e5e] hover:underline underline-offset-4">Privacy Policy</a>.
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-[48px] bg-[#5f5e5e] text-white font-medium tracking-tight text-sm hover:opacity-90 hover:bg-[#5f5e5e] active:scale-[0.99] transition-all duration-200 rounded-xl shadow-none"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-[#5a6060]">
              Already have an account?
              <Link to="/login" className="text-[#2d3433] font-semibold hover:underline underline-offset-4 ml-1">
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
