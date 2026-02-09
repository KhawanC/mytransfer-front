import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/auth-provider"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MePassa - Transferência de Arquivos Rápida e Segura",
  description: "Transfira arquivos grandes entre dispositivos de forma rápida, segura e sem limites. Compartilhe fotos, vídeos e documentos com seus amigos em tempo real.",
  keywords: ["transferência de arquivos", "compartilhar arquivos", "enviar arquivos grandes", "compartilhamento p2p", "transferência segura"],
  authors: [{ name: "MePassa" }],
  openGraph: {
    title: "MePassa - Transferência de Arquivos Rápida e Segura",
    description: "Transfira arquivos grandes entre dispositivos de forma rápida, segura e sem limites.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "MePassa - Transferência de Arquivos",
    description: "Transfira arquivos grandes de forma rápida e segura",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh`}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
