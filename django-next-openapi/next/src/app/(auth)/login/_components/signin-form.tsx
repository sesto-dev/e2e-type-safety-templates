"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import Icons from "~/components/shared/icons";
import { toast } from "sonner";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const baseUrl = process.env.NEXT_PUBLIC_API_BASEURL ?? "";

  async function submitLogin(data: LoginFormData) {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Invalid credentials");
      }

      toast.success("Signed in successfully");
      router.push("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err?.message ?? "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitRegister(data: RegisterFormData) {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
      }

      toast.success("Account created — you are now signed in");
      router.push("/admin");
    } catch (err: any) {
      console.error("Register error:", err);
      toast.error(err?.message ?? "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card className="py-2">
        <CardContent className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded-md ${
                  mode === "login" ? "bg-primary text-white" : "bg-transparent"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  mode === "register" ? "bg-primary text-white" : "bg-transparent"
                }`}
                onClick={() => setMode("register")}
                type="button"
              >
                Register
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              {mode === "login" ? "Use your email & password" : "Create a new account"}
            </div>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit(submitLogin)} className="flex flex-col gap-3">
              <div>
                <Label className="sr-only" htmlFor="email">
                  Email
                </Label>
                <Input id="email" placeholder="name@example.com" {...loginRegister("email")} />
                {loginErrors?.email && (
                  <p className="mt-2 text-xs text-destructive">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <Label className="sr-only" htmlFor="password">
                  Password
                </Label>
                <Input id="password" type="password" placeholder="Password" {...loginRegister("password")} />
                {loginErrors?.password && (
                  <p className="mt-2 text-xs text-destructive">{loginErrors.password.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Icons.spinner className="mr-2 size-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit(submitRegister)} className="flex flex-col gap-3">
              <div>
                <Label className="sr-only" htmlFor="email">
                  Email
                </Label>
                <Input id="email" placeholder="name@example.com" {...registerRegister("email")} />
                {registerErrors?.email && (
                  <p className="mt-2 text-xs text-destructive">{registerErrors.email.message}</p>
                )}
              </div>

              <div>
                <Label className="sr-only" htmlFor="name">
                  Name (optional)
                </Label>
                <Input id="name" placeholder="Full name (optional)" {...registerRegister("name")} />
                {registerErrors?.name && (
                  <p className="mt-2 text-xs text-destructive">{registerErrors.name.message}</p>
                )}
              </div>

              <div>
                <Label className="sr-only" htmlFor="password">
                  Password
                </Label>
                <Input id="password" type="password" placeholder="Password (min 8 chars)" {...registerRegister("password")} />
                {registerErrors?.password && (
                  <p className="mt-2 text-xs text-destructive">{registerErrors.password.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Icons.spinner className="mr-2 size-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
