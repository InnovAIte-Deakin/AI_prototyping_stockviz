"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/auth/actions";

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email) {
      setFieldErrors({ email: "Email is required" });
      setError("Please enter your email address");
      return;
    }

    setFieldErrors({});
    setError(null);
    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setIsSuccess(true);
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-10"
          >
            {isSuccess ? (
              /* ── Success State ── */
              <div className="text-center flex flex-col items-center gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-[#5f5e5e]" strokeWidth={1.5} />
                </motion.div>
                <h2 className="text-4xl font-bold tracking-tight text-[#5f5e5e]">Check your email</h2>
                <p className="text-[#5a6060] text-base leading-relaxed max-w-sm">
                  We sent a password reset link to your email. Click the link to set a new password.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#5f5e5e] hover:text-[#2d3433] transition-colors mt-4"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </div>
            ) : (
              /* ── Form State ── */
              <>
                <div className="text-center">
                  <h2 className="text-4xl font-bold tracking-tight text-[#5f5e5e] mb-4">Forgot password?</h2>
                  <p className="text-[#5a6060] text-base leading-relaxed">
                    Enter your email and we&apos;ll send you a reset link.
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
                  <div className="space-y-1.5">
                    <Label
                      className="block text-xs font-bold uppercase tracking-widest text-[#5a6060] mb-2.5"
                      htmlFor="email"
                    >
                      Email Address
                    </Label>
                    <motion.div
                      animate={fieldErrors.email ? { x: [-4, 4, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="relative"
                    >
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb3b2] h-5 w-5" />
                      <Input
                        className={`w-full pl-12 pr-4 h-[52px] bg-white text-[#2d3433] border ${fieldErrors.email ? "border-[#752121]" : "border-[#adb3b2]/20"} focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl text-base transition-colors duration-200 placeholder:text-[#adb3b2]/50 outline-none`}
                        id="email"
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        onChange={() => setFieldErrors({})}
                      />
                    </motion.div>
                  </div>
                  <Button
                    disabled={isPending}
                    className="w-full bg-[#5f5e5e] text-white h-[56px] px-4 rounded-xl font-bold text-base transition-all duration-200 hover:opacity-90 hover:bg-[#5f5e5e] active:scale-[0.99] mt-6 shadow-none disabled:opacity-50"
                    type="submit"
                  >
                    {isPending ? "Sending..." : "Send Reset Link"}
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
              </>
            )}
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
