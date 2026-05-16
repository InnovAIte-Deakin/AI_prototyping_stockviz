"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { signup } from '@/app/auth/actions';
import { ThemeToggle } from '@/components/layout/theme-toggle';

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
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      {/* Header */}
      <header className="w-full h-16 px-8 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tighter text-primary">
          StockViz
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          {['Markets', 'News', 'Analysis'].map((item) => (
            <a key={item} href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {item}
            </a>
          ))}
          <Link href="/login" className="text-base font-semibold text-primary ml-4">
            Log In
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] flex flex-col gap-12 my-6"
        >
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-primary">Create an account</h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-xl border border-destructive/30">
                {error}
              </motion.div>
            )}
            <div className="space-y-1.5">
              <Label className="block text-base font-semibold text-muted-foreground mb-1.5" htmlFor="name">
                Full Name
              </Label>
              <motion.div
                animate={fieldErrors.name ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="E.g., Alexander Hamilton"
                  className={`w-full pl-12 pr-4 h-[46px] bg-card text-foreground border ${fieldErrors.name ? 'border-[#752121]' : 'border-border/30'} focus-visible:border-primary focus-visible:ring-0 transition-colors text-base placeholder:text-muted-foreground/60 rounded-lg outline-none`}
                  onChange={() => setFieldErrors(prev => ({ ...prev, name: undefined }))}
                />
              </motion.div>
            </div>

            <div className="space-y-1.5">
              <Label className="block text-base font-semibold text-muted-foreground mb-1.5" htmlFor="email">
                Email Address
              </Label>
              <motion.div
                animate={fieldErrors.email ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  className={`w-full pl-12 pr-4 h-[46px] bg-card text-foreground border ${fieldErrors.email ? 'border-[#752121]' : 'border-border/30'} focus-visible:border-primary focus-visible:ring-0 transition-colors text-base placeholder:text-muted-foreground/60 rounded-lg outline-none`}
                  onChange={() => setFieldErrors(prev => ({ ...prev, email: undefined }))}
                />
              </motion.div>
            </div>

            <div className="space-y-1.5">
              <Label className="block text-base font-semibold text-muted-foreground mb-1.5" htmlFor="password">
                Password
              </Label>
                <motion.div
                  animate={fieldErrors.password ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-12 pr-12 h-[46px] bg-card text-foreground border ${fieldErrors.password ? 'border-destructive' : 'border-border/30'} focus-visible:border-primary focus-visible:ring-0 transition-colors text-base placeholder:text-muted-foreground/60 rounded-lg outline-none pr-10`}
                    onChange={() => setFieldErrors(prev => ({ ...prev, password: undefined }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>
            </div>

            <motion.div
              animate={fieldErrors.terms ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="space-y-2 py-2"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  name="terms"
                  className={`mt-1 h-4 w-4 rounded border ${fieldErrors.terms ? 'border-destructive' : 'border-border/30'} text-primary focus-visible:ring-0 cursor-pointer`}
                  onCheckedChange={() => setFieldErrors(prev => ({ ...prev, terms: undefined }))}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground font-normal normal-case tracking-normal">
                  I agree to the <a href="#" className="text-primary hover:underline underline-offset-4">Terms of Service</a> and <a href="#" className="text-primary hover:underline underline-offset-4">Privacy Policy</a>.
                </Label>
              </div>
            </motion.div>

            <Button
              disabled={isPending}
              type="submit"
              className="w-full h-[48px] bg-primary text-primary-foreground font-bold tracking-tight text-base hover:opacity-90 hover:bg-primary active:scale-[0.99] transition-all duration-200 rounded-lg shadow-none disabled:opacity-50 mt-6"
            >
              {isPending ? 'Processing...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-base text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 ml-1">
                Log in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>


    </div>
  );
}
