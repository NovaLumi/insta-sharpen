"use client"

import { ArrowRight, Zap, Image, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-20">
      {/* Hero Section */}
      <section className="text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Enhance Your Images with{" "}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Topaz AI
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upscale your images up to 8x resolution using professional-grade AI.
            Fast, secure, and beautiful results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/enhance"
              className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Start Enhancing
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-lg border border-border font-semibold hover:bg-secondary transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Process images in seconds with our optimized AI pipeline
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">8K Resolution</h3>
            <p className="text-muted-foreground">
              Upscale up to 8x with professional Topaz AI quality
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your images are processed securely and never stored
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">See the Difference</h2>
          <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary/20">
            <div className="aspect-video flex items-center justify-center text-muted-foreground">
              <p>Before/After comparison slider demo</p>
            </div>
          </div>
          <Link
            href="/enhance"
            className="inline-flex items-center gap-2 mt-8 text-primary font-semibold hover:underline"
          >
            Try it yourself
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to enhance your images?</h2>
          <p className="text-muted-foreground mb-6">
            Start with 3 free credits. No credit card required.
          </p>
          <Link
            href="/enhance"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} InstaSharpen. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
