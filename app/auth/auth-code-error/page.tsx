import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-lg">
      <div className="bg-card border rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign-in failed</h1>
        <p className="text-muted-foreground mb-6">
          We could not complete your authentication request. Please try signing in again.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
