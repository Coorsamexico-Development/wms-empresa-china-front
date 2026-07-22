import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WMS COORSA Logistics • Plataforma Web de Almacenes",
  description: "Sistema de Gestión de Almacenes para recepción, paletizado LPN, inventarios, salidas y administración de usuarios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col md:flex-row items-start bg-slate-950 text-slate-100" suppressHydrationWarning>
        {/* Mobile Top Navigation */}
        <header className="md:hidden w-full bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
              WMS
            </div>
            <span className="font-extrabold text-xs text-white">COORSA WMS</span>
          </div>
          <nav className="flex gap-2 text-xs font-bold text-slate-300 overflow-x-auto">
            <Link href="/" className="px-2 py-1 bg-slate-800 rounded shrink-0">📊 KPIs</Link>
            <Link href="/unidades" className="px-2 py-1 bg-slate-800 rounded shrink-0">🚚 Entradas</Link>
            <Link href="/salidas" className="px-2 py-1 bg-slate-800 rounded shrink-0">🚛 Salidas</Link>
            <Link href="/materiales" className="px-2 py-1 bg-slate-800 rounded shrink-0">📦 SKUs</Link>
            <Link href="/trazabilidad" className="px-2 py-1 bg-slate-800 rounded shrink-0">📋 Bitácora</Link>
            <Link href="/admin/usuarios" className="px-2 py-1 bg-slate-800 rounded shrink-0">👥 Usuarios</Link>
            <Link href="/login" className="px-2 py-1 bg-rose-900/60 text-rose-300 rounded shrink-0">🚪 Salir</Link>
          </nav>
        </header>

        {/* Desktop Sidebar (Fijo e independiente) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 w-full min-h-screen overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
