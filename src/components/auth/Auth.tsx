"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ShieldCheck,
} from "lucide-react";

type AuthProps = {
  mode: "login" | "signup";
};

const accent = "#e7a46f";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "15px 45px 15px 16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 8,
  color: "#ffffff",
  fontSize: 15,
  outlineColor: accent,
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 9,
  fontSize: 13,
  fontWeight: 600,
  color: "#d5dce3",
};

const inputIcon: CSSProperties = {
  position: "absolute",
  right: 15,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#88939d",
  pointerEvents: "none",
};

export default function Auth({ mode }: AuthProps) {
  const isSignup = mode === "signup";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (isSignup && username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // TODO: Connect Supabase Authentication here.
    // Do not store passwords in localStorage or log them.

    setMessage(
      isSignup
        ? "Signup form validated! Account creation will be enabled when Supabase is connected."
        : "Login form validated! Authentication will be enabled when Supabase is connected.",
    );
  }

  return (
    <main
      style={{
        minHeight: "100svh",
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(8,12,18,0.93),
            rgba(8,12,18,0.65)
          ),
          url('/hollow-city.png')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* NAVIGATION */}
      <header
        style={{
          padding: "24px 6%",
          background: "rgba(10,16,23,0.7)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(15px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: 900,
            textDecoration: "none",
            letterSpacing: -1,
          }}
        >
          DAYLIGHT <span style={{ color: accent }}>/</span>
        </Link>

        <Link
          href="/"
          style={{
            color: "#d5dce3",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </header>

      {/* AUTH FORM */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "50px 20px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          style={{
            width: "100%",
            maxWidth: 440,
            padding: "clamp(24px, 5vw, 42px)",
            background: "rgba(15,21,29,0.94)",
            backdropFilter: "blur(22px)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 16,
            boxShadow: "0 25px 90px rgba(0,0,0,0.6)",
            boxSizing: "border-box",
          }}
        >
          {/* FORM HEADER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              color: accent,
              marginBottom: 20,
            }}
          >
            <ShieldCheck size={18} />
            <span
              style={{
                fontSize: 11,
                letterSpacing: 2.5,
                fontWeight: 700,
              }}
            >
              DAYLIGHT / ACCESS TERMINAL
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 38px)",
              margin: "0 0 12px",
              letterSpacing: -1.5,
              fontWeight: 850,
            }}
          >
            {isSignup ? "Join the Hollow." : "Welcome back."}
          </h1>

          <p
            style={{
              color: "#aeb8c2",
              lineHeight: 1.7,
              fontSize: 14,
              marginBottom: 32,
            }}
          >
            {isSignup
              ? "Create your account and become part of the DAYLIGHT survival network."
              : "Enter your credentials to access the DAYLIGHT network."}
          </p>

          {/* INPUT FORM */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* USERNAME - SIGNUP ONLY */}
            {isSignup && (
              <div>
                <label htmlFor="username" style={labelStyle}>
                  Username
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={3}
                    maxLength={30}
                    required
                    style={inputStyle}
                  />

                  <User size={18} style={inputIcon} />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label htmlFor="email" style={labelStyle}>
                Email address
              </label>

              <div style={{ position: "relative" }}>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />

                <Mail size={18} style={inputIcon} />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" style={labelStyle}>
                Password
              </label>

              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#aeb8c2",
                    cursor: "pointer",
                    padding: 3,
                  }}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD - SIGNUP ONLY */}
            {isSignup && (
              <div>
                <label htmlFor="confirmPassword" style={labelStyle}>
                  Confirm password
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                    style={inputStyle}
                  />

                  <Lock size={18} style={inputIcon} />
                </div>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <p
                role="alert"
                style={{
                  color: "#ff9292",
                  background: "rgba(255,70,70,0.1)",
                  border: "1px solid rgba(255,70,70,0.3)",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            {/* SUCCESS / DEMO MESSAGE */}
            {message && (
              <p
                role="status"
                style={{
                  color: "#bde9b0",
                  background: "rgba(120,200,100,0.1)",
                  border: "1px solid rgba(120,200,100,0.3)",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {message}
              </p>
            )}

            {/* SUBMIT BUTTON */}
            <motion.button
              type="submit"
              whileHover={{
                scale: 1.02,
                backgroundColor: "#ffc08c",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              style={{
                background: accent,
                color: "#10151a",
                border: "none",
                borderRadius: 8,
                padding: 16,
                marginTop: 8,
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              {isSignup ? "Create account" : "Log in"}
              <ArrowRight size={18} />
            </motion.button>
          </form>

          {/* SWITCH BETWEEN LOGIN AND SIGNUP */}
          <p
            style={{
              marginTop: 30,
              textAlign: "center",
              color: "#aeb8c2",
              fontSize: 14,
            }}
          >
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              href={isSignup ? "/auth/login" : "/auth/signup"}
              style={{
                color: accent,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {isSignup ? "Log in" : "Sign up"}
            </Link>
          </p>

          {/* FOOTER */}
          <div
            style={{
              borderTop: "1px solid #ffffff20",
              paddingTop: 22,
              marginTop: 30,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#89939d",
                letterSpacing: 1.5,
                margin: 0,
              }}
            >
              THE HOLLOW / EST. 2087
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
