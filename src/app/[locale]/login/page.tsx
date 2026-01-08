"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BookOpen } from "lucide-react";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { isAuthenticated, setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 已登录则跳转
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const result = await login({ email, password });
        setAuth(result.access_token, result.refresh_token, result.user);
        router.push(redirect);
      } catch (err) {
        if (err instanceof Error) {
          // 解析错误信息
          const apiError = err as { data?: { detail?: string } };
          setError(apiError.data?.detail || err.message || "登录失败，请重试");
        } else {
          setError("登录失败，请重试");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, setAuth, router, redirect]
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Astra Codex</CardTitle>
        <CardDescription>登录以继续使用</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              "登录"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoginLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
