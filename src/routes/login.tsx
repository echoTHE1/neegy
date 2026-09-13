import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { NexusLockup } from "@/components/nexus/NexusLogo";
import { Button, Field, GlassCard, TextInput } from "@/components/nexus/primitives";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Log In — NEEGY" },
      { name: "description", content: "Access your NEEGY account" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { state, error, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state === "authenticated") {
      window.location.href = "/";
    }
  }, [state]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      window.location.href = "/";
    }
  }, [email, password, login]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && email && password && !isLoading) {
        void handleLogin();
      }
    },
    [email, password, isLoading, handleLogin]
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      <BackgroundFX />

      <GlassCard className="animate-scale-in relative z-10 w-full max-w-md p-8">
        <NexusLockup className="justify-center mb-8" />

        <div className="text-center mb-8">
          <h1 className="font-display text-xl font-bold tracking-[0.12em] uppercase mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to access NEEGY</p>
        </div>

        <div className="space-y-4">
          <Field label="Email" htmlFor="email">
            <TextInput
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              onKeyPress={handleKeyPress}
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
                onKeyPress={handleKeyPress}
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

          {error && <div className="text-sm text-red-500 rounded bg-red-500/10 p-3">{error}</div>}

          <Button
            onClick={() => void handleLogin()}
            disabled={!email || !password || isLoading}
            className="w-full mt-6"
          >
            {isLoading ? "Logging in..." : "Log In"}
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

          <Link to="/register">
            <Button variant="outline" className="w-full">
              Create Account
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
