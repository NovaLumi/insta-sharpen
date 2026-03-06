import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AppProvider } from "@/lib/context/AppContext"
import Header from "@/components/Header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "InstaSharpen - AI Image Enhancement",
  description: "Enhance your images with Topaz AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <Header />
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
