"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { login } from "@/app/auth/actions";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isPending, startTransition] = useTransition();
  const currentYear = new Date().getFullYear();
  const passwordToggleLabel = showPassword ? "Hide password" : "Show password";

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
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-muted selection:text-foreground">
      <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12">
        <header className="mb-8 text-center shrink-0">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            StockViz
          </Link>
        </header>

        <div className="w-full max-w-[480px] flex flex-col gap-10 py-6">
          <div className="w-full flex flex-col gap-10">
            <div className="text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight">
                Welcome back
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Enter your credentials to access your terminal.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-1.5">
                <Label
                  className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  htmlFor="email"
                >
                  Email Address
                </Label>
                <motion.div
                  animate={fieldErrors.email ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className={`h-[52px] w-full rounded-xl border bg-card pl-12 pr-4 text-base text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-0 ${fieldErrors.email ? "border-destructive" : "border-border"}`}
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    onChange={() =>
                      setFieldErrors((prev) => ({ ...prev, email: undefined }))
                    }
                  />
                </motion.div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-2.5">
                  <Label
                    className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    htmlFor="password"
                  >
                    Password
                  </Label>
                  <Link
                    className="text-xs font-bold text-foreground transition-colors hover:text-muted-foreground"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                <motion.div
                  animate={fieldErrors.password ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className={`h-[52px] w-full rounded-xl border bg-card pl-12 pr-12 text-base text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-0 ${fieldErrors.password ? "border-destructive" : "border-border"}`}
                    id="password"
                    name="password"
                    placeholder="********"
                    type={showPassword ? "text" : "password"}
                    onChange={() =>
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }))
                    }
                  />
                  <button
                    type="button"
                    aria-label={passwordToggleLabel}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>
              </div>
              <Button
                disabled={isPending}
                className="mt-6 h-[56px] w-full rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground shadow-none transition-all duration-200 hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50"
                type="submit"
              >
                {isPending ? "Processing..." : "Sign In"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              className="font-bold text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
              href="/register"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      <footer className="mt-auto w-full border-t border-border bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-8 py-10 text-[10px] uppercase tracking-widest text-muted-foreground md:flex-row">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <span>
              &copy; {currentYear} StockViz Editorial. All rights reserved.
            </span>
          </div>
          <nav className="flex gap-8" aria-label="Legal information">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Legal Disclosures</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
