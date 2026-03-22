import { createClient } from "@/lib/supabase/server"

function getAdminEmails() {
  return (process.env.DEBUG_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getDebugPath() {
  return (process.env.DEBUG_ADMIN_PATH || "").trim()
}

export async function getAuthorizedDebugUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return null
  }

  const adminEmails = getAdminEmails()
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return null
  }

  return user
}

export function isValidDebugSlug(slug: string) {
  const debugPath = getDebugPath()
  return Boolean(debugPath) && slug === debugPath
}
