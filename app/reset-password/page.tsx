"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/app/auth/actions";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const newFieldErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newFieldErrors.password = "Password is required";
    } else if (password.length < 8) {
      newFieldErrors.password = "Must be at least 8 characters";
    }

    if (!confirmPassword) {
      newFieldErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Please fix the errors below");
      return;
    }

    setFieldErrors({});
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) {
        setError(result.error);
      }
      // On success, the server action redirects to /login
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-10"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold tracking-tight text-[#5f5e5e] mb-4">Set new password</h2>
              <p className="text-[#5a6060] text-base leading-relaxed">
                Enter your new password below.
              </p>
            </div>

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

              {/* New Password */}
              <div className="space-y-1.5">
                <Label
                  className="block text-xs font-bold uppercase tracking-widest text-[#5a6060] mb-2.5"
                  htmlFor="password"
                >
                  New Password
                </Label>
                <motion.div
                  animate={fieldErrors.password ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb3b2] h-5 w-5" />
                  <Input
                    className={`w-full pl-12 pr-12 h-[52px] bg-white text-[#2d3433] border ${fieldErrors.password ? "border-[#752121]" : "border-[#adb3b2]/20"} focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-base transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none`}
                    id="password"
                    name="password"
                    placeholder="Min. 8 characters"
                    type={showPassword ? "text" : "password"}
                    onChange={() =>
                      setFieldErrors((prev) => ({ ...prev, password: undefined }))
                    }
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label
                  className="block text-xs font-bold uppercase tracking-widest text-[#5a6060] mb-2.5"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </Label>
                <motion.div
                  animate={fieldErrors.confirmPassword ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb3b2] h-5 w-5" />
                  <Input
                    className={`w-full pl-12 pr-12 h-[52px] bg-white text-[#2d3433] border ${fieldErrors.confirmPassword ? "border-[#752121]" : "border-[#adb3b2]/20"} focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-base transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none`}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    type={showConfirm ? "text" : "password"}
                    onChange={() =>
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb3b2] hover:text-[#5f5e5e] transition-colors"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>
              </div>

              <Button
                disabled={isPending}
                className="w-full bg-[#5f5e5e] text-white h-[56px] px-4 rounded-xl font-bold text-base transition-all duration-200 hover:opacity-90 hover:bg-[#5f5e5e] active:scale-[0.99] mt-6 shadow-none disabled:opacity-50"
                type="submit"
              >
                {isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>

            <p className="text-center text-sm text-[#5a6060]">
              Remember your password?{" "}
              <Link
                className="font-bold text-[#5f5e5e] hover:text-[#525251] transition-colors underline underline-offset-4"
                href="/login"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
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
