"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, Suspense } from "react"
import { useApp } from "@/lib/context/AppContext"
import { getPlan } from "@/lib/plans"
import { Check, ArrowLeft } from "lucide-react"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { fetchCredits } = useApp()
  const planId = searchParams.get("plan") || "pro"
  const plan = getPlan(planId)

  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load PayPal SDK
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (!clientId) {
      console.error("PayPal Client ID not configured")
      return
    }

    // Check if already loaded
    if (window.paypal) {
      setSdkLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`
    script.async = true
    script.onload = () => setSdkLoaded(true)
    script.onerror = () => {
      console.error("Failed to load PayPal SDK")
      setStatus("error")
      setMessage("Failed to load payment. Please refresh the page.")
    }
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!sdkLoaded || !window.paypal || !containerRef.current || !plan) return

    // Clear any existing buttons
    containerRef.current.innerHTML = ""

    // Render PayPal buttons
    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "blue",
        shape: "rect",
        label: "paypal",
        height: 50,
      },
      createOrder: async () => {
        setStatus("loading")
        try {
          const response = await fetch("/api/paypal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: plan.id }),
          })
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || "Failed to create order")
          }
          return data.id
        } catch (error) {
          setStatus("error")
          setMessage(error instanceof Error ? error.message : "Failed to create order")
          throw error
        }
      },
      onApprove: async (data: { orderID: string }) => {
        try {
          const response = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          })
          const result = await response.json()
          if (!response.ok) {
            throw new Error(result.error || "Payment failed")
          }
          setStatus("success")
          setMessage(`${result.creditsAdded} credits added to your account!`)
          fetchCredits()
        } catch (error) {
          setStatus("error")
          setMessage(error instanceof Error ? error.message : "Payment failed")
        }
      },
      onError: (err: unknown) => {
        console.error("PayPal error:", err)
        setStatus("error")
        setMessage("Payment error. Please try again.")
      },
      onCancel: () => {
        setStatus("idle")
      },
    }).render(containerRef.current)
  }, [sdkLoaded, plan, fetchCredits])

  // Handle invalid plan
  if (!plan) {
    return (
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Plan</h1>
          <p className="text-muted-foreground mb-6">The selected plan does not exist.</p>
          <button
            onClick={() => router.push("/pricing")}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            Back to Pricing
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/pricing")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pricing
      </button>

      <div className="bg-card border rounded-2xl p-8">
        {/* Plan info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{plan.name} Plan</h1>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-4xl font-bold">${plan.price}</span>
            <span className="text-muted-foreground">USD</span>
          </div>
          <p className="text-muted-foreground">{plan.credits} credits</p>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Status messages */}
        {status === "success" && (
          <div className="text-center py-4 text-green-600 font-medium bg-green-50 rounded-lg mb-4">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg mb-4">
            {message}
          </div>
        )}

        {/* PayPal Button */}
        {status !== "success" && (
          <div className="mt-4">
            {sdkLoaded ? (
              <div ref={containerRef} className={status === "loading" ? "opacity-50 pointer-events-none" : ""} />
            ) : (
              <div className="h-14 flex items-center justify-center text-muted-foreground border rounded-lg">
                Loading payment...
              </div>
            )}
          </div>
        )}

        {/* Success actions */}
        {status === "success" && (
          <button
            onClick={() => router.push("/enhance")}
            className="w-full py-3 rounded-lg font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            Start Enhancing Images
          </button>
        )}
      </div>

      {/* Security note */}
      <p className="text-center text-muted-foreground text-sm mt-6">
        Secure payment powered by PayPal
      </p>
    </main>
  )
}

function CheckoutLoading() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="bg-card border rounded-2xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary rounded w-48 mx-auto mb-4"></div>
          <div className="h-12 bg-secondary rounded w-32 mx-auto mb-2"></div>
          <div className="h-4 bg-secondary rounded w-24 mx-auto mb-8"></div>
          <div className="space-y-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 bg-secondary rounded"></div>
            ))}
          </div>
          <div className="h-14 bg-secondary rounded"></div>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  )
}
