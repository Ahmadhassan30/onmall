"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email";
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const resend = async () => {
    setSending(true);
    try {
      if (email && email.includes("@")) {
        await authClient.sendVerificationEmail({
          email,
          callbackURL: `${window.location.origin}/auth/verify-email`,
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mr-2" />
            Verify your email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700">
            We sent a verification link to <strong>{email}</strong>.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/auth/sign-in")} className="w-full">
              Continue to Sign In
            </Button>
            <Button variant="outline" onClick={resend} disabled={sending} className="w-full">
              <Mail className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Resend Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
