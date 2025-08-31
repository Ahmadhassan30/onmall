"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    
    // If Better Auth indicates invalid token, show error.
    if (errorParam === "invalid_token" || errorParam === "INVALID_TOKEN") {
      setError("This verification link is invalid or has expired.");
      setLoading(false);
      return;
    }

    // Better Auth only redirects here on success when there's no error.
    // Trust the redirect outcome instead of checking session to avoid timing issues.
    setSuccess(true);
    setError(null);
    setLoading(false);
  }, [searchParams]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const session = await authClient.getSession();
      if (session.data?.user?.email) {
        await authClient.sendVerificationEmail({
          email: session.data.user.email,
          callbackURL: `${window.location.origin}/auth/verify-email`,
        });
        alert("Verification email sent! Please check your inbox.");
      }
    } catch (err) {
      alert("Failed to send verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h2>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your email has been verified. You can now access all features of OnMall.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                Continue to OnMall
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500 mr-2" />
            Email Verification Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              We couldn't verify your email address. This could be because:
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-1">
              <li>• The verification link has expired</li>
              <li>• The link has already been used</li>
              <li>• The link is invalid or corrupted</li>
            </ul>
            
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleResendVerification} 
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send New Verification Email
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push("/auth/sign-in")}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
