import { redirect } from "next/navigation"
import DebugDashboard from "@/app/debug/DebugDashboard"
import { getAuthorizedDebugUser, isValidDebugSlug } from "@/lib/debug-auth"

interface OpsDebugPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function OpsDebugPage({ params }: OpsDebugPageProps) {
  const { slug } = await params
  if (!isValidDebugSlug(slug)) {
    redirect("/")
  }

  const user = await getAuthorizedDebugUser()
  if (!user) {
    redirect(`/login?redirect=/ops/${slug}`)
  }

  return <DebugDashboard userId={user.id} />
}
