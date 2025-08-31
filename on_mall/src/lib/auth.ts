import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendEmail, createVerificationEmail, createPasswordResetEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({user, url, token}, request) => {
      try {
        const emailTemplate = createPasswordResetEmail(url, user.name);
        await sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      } catch (e) {
        console.error("sendResetPassword email failed:", e);
        // Don’t throw; allow endpoint to respond without crashing
      }
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Password for user ${user.email} has been reset.`);
      // You can add additional logic here like logging, notifications, etc.
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const emailTemplate = createVerificationEmail(url, user.name);
        await sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      } catch (e) {
        console.error("sendVerificationEmail failed:", e);
        // Don’t throw; Better Auth will still return 403 for unverified without 500
      }
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
    },
  },
  plugins: [nextCookies()], // make sure this is the last plugin in the array
});
