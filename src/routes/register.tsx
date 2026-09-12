import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { NexusLockup } from "@/components/nexus/NexusLogo";
import { Button, Field, GlassCard, TextInput } from "@/components/nexus/primitives";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create Account — NEXUS" },
      { name: "description", content: "Join NEXUS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { state, error, register } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state === "authenticated") {
      window.location.href = "/";
    }
  }, [state]);

  const handleRegister = useCallback(async () => {
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    const success = await register(username, displayName, email, password);
    setIsLoading(false);

    if (success) {
      window.location.href = "/";
    }
  }, [username, displayName, email, password, confirmPassword, register]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && username && displayName && email && password && confirmPassword && !isLoading) {
        void handleRegister();
      }
    },
    [username, displayName, email, password, confirmPassword, isLoading, handleRegister]
  );

  const isFormValid = username && displayName && email && password && confirmPassword && !passwordError;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      <BackgroundFX />

      <GlassCard className="animate-scale-in relative z-10 w-full max-w-md p-8">
        <NexusLockup className="justify-center mb-8" />

        <div className="text-center mb-8">
          <h1 className="font-display text-xl font-bold tracking-[0.12em] uppercase mb-2">
            Create Account
          </h1>
          <p className="text-sm text-muted-foreground">Join NEXUS and start connecting</p>
        </div>

        <div className="space-y-4">
          <Field label="Username" htmlFor="username">
            <TextInput
              id="username"
              placeholder="@your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              minLength={3}
            />
          </Field>

          <Field label="Display Name" htmlFor="displayName">
            <TextInput
              id="displayName"
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <TextInput
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <div className="relative">
              <TextInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password" htmlFor="confirmPassword">
            <div className="relative">
              <TextInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                minLength={8}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {(error || passwordError) && (
            <div className="text-sm text-red-500 rounded bg-red-500/10 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error || passwordError}</span>
            </div>
          )}

          <Button
            onClick={() => void handleRegister()}
            disabled={!isFormValid || isLoading}
            className="w-full mt-6"
          >
            {isLoading ? "Creating account..." : "Create Account"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">Or</span>
            </div>
          </div>

          <Link to="/login">
            <Button variant="outline" className="w-full">
              Already have an account?
            </Button>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to home
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
