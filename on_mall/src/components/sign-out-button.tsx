"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      className={className}
      variant="outline"
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => router.push("/auth/sign-in"),
          },
        })
      }
    >
      Sign out
    </Button>
  );
}
