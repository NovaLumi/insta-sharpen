import { betterAuth } from "better-auth"
import { supabaseAdapter } from "better-auth/adapters/supabase"

export const auth = betterAuth({
  database: supabaseAdapter({
    url: process.env.DATABASE_URL!,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
