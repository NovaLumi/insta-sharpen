import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { generateAccessToken, getPayPalApiBase } from "@/lib/paypal"

interface CreditRow {
  amount: number
  updated_at: string
}

interface TransactionRow {
  id: string
  amount: number
  type: string
  description: string | null
  paypal_order_id: string | null
  created_at: string
}

interface TaskRow {
  id: string
  task_id: string | null
  status: string | null
  upscale_factor: string
  credits_used: number
  original_url: string | null
  result_url: string | null
  created_at: string
  completed_at: string | null
}

interface PayPalHealth {
  ok: boolean
  environment: string
  apiBase?: string
  tokenReceived?: boolean
  error?: string
  likelyCause?: string
}

function formatDate(value: string | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function TableShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

export default async function DebugDashboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  const [{ data: creditsData }, { data: transactions }, { data: tasks }] = await Promise.all([
    supabase
      .from("credits")
      .select("amount, updated_at")
      .eq("user_id", userId)
      .maybeSingle<CreditRow>(),
    supabase
      .from("credit_transactions")
      .select("id, amount, type, description, paypal_order_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<TransactionRow[]>(),
    supabase
      .from("upscale_tasks")
      .select("id, task_id, status, upscale_factor, credits_used, original_url, result_url, created_at, completed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<TaskRow[]>(),
  ])

  let paypalHealth: PayPalHealth
  try {
    const accessToken = await generateAccessToken()
    paypalHealth = {
      ok: true,
      environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
      apiBase: getPayPalApiBase(),
      tokenReceived: Boolean(accessToken),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check PayPal health"
    paypalHealth = {
      ok: false,
      environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
      apiBase: getPayPalApiBase(),
      tokenReceived: false,
      error: message,
      likelyCause: message.includes("client credentials")
        ? "Sandbox/live credentials may not match the current PayPal environment."
        : undefined,
    }
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Inspect your current credits, recent payments, and recent image tasks.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            Buy Credits
          </Link>
          <Link
            href="/enhance"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Enhance Image
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Current Credits</p>
          <p className="text-4xl font-bold mt-3">{creditsData?.amount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {formatDate(creditsData?.updated_at ?? null)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Recent Transactions</p>
          <p className="text-4xl font-bold mt-3">{transactions?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Latest 20 rows from <code>credit_transactions</code>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Recent Tasks</p>
          <p className="text-4xl font-bold mt-3">{tasks?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Latest 10 rows from <code>upscale_tasks</code>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">PayPal Server Health</p>
            <p className="text-2xl font-bold mt-2">
              {paypalHealth.ok ? "Connected" : "Failed"}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${paypalHealth.ok ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
            {paypalHealth.environment}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-4 space-y-1">
          <p>API Base: {paypalHealth.apiBase || "-"}</p>
          <p>Access Token: {paypalHealth.tokenReceived ? "Received" : "Not received"}</p>
          {!paypalHealth.ok && paypalHealth.error && <p>Error: {paypalHealth.error}</p>}
          {!paypalHealth.ok && paypalHealth.likelyCause && <p>Likely cause: {paypalHealth.likelyCause}</p>}
        </div>
      </section>

      <TableShell
        title="Credit Transactions"
        description="Use this to verify PayPal orders only added credits once."
      >
        <table className="min-w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-6 py-3 font-medium">Created</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="px-6 py-3 font-medium">PayPal Order</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.length ? (
              transactions.map((row) => (
                <tr key={row.id} className="border-b border-border/60 align-top">
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(row.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.type}</td>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${row.amount >= 0 ? "text-green-500" : "text-red-400"}`}>
                    {row.amount >= 0 ? `+${row.amount}` : row.amount}
                  </td>
                  <td className="px-6 py-4 min-w-72">{row.description || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{row.paypal_order_id || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <TableShell
        title="Upscale Tasks"
        description="Review recent jobs, status transitions, and resulting image URLs."
      >
        <table className="min-w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-6 py-3 font-medium">Created</th>
              <th className="px-6 py-3 font-medium">Task ID</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Factor</th>
              <th className="px-6 py-3 font-medium">Credits</th>
              <th className="px-6 py-3 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {tasks?.length ? (
              tasks.map((row) => (
                <tr key={row.id} className="border-b border-border/60 align-top">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{formatDate(row.created_at)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Completed: {formatDate(row.completed_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{row.task_id || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.status || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.upscale_factor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.credits_used}</td>
                  <td className="px-6 py-4 min-w-72">
                    {row.result_url ? (
                      <a
                        href={row.result_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        Open result
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>
    </main>
  )
}
