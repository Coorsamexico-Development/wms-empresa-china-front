'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const usuarioActual = user || {
    nombreCompleto: 'Usuario WMS',
    email: 'usuario@coorsa.com',
    rol: 'Operador',
  };

  const handleCerrarSesion = () => {
    logout();
  };

  // No mostrar el Sidebar en la página de login
  if (pathname === '/login') return null;

  const menuItems = [
    { label: 'Dashboard & KPIs', href: '/', icon: '📊' },
    { label: 'Unidades & Paletizado', href: '/unidades', icon: '🚚' },
    { label: 'Salidas & Despacho', href: '/salidas', icon: '🚛' },
    { label: 'Maestro Materiales', href: '/materiales', icon: '📦' },
    { label: 'Bitácora Auditoría', href: '/trazabilidad', icon: '📋' },
    { label: 'Usuarios & Roles', href: '/admin/usuarios', icon: '👥' },
  ];

  return (
    <aside className="w-52 h-screen sticky top-0 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col justify-between p-3.5 shrink-0 hidden md:flex z-30 overflow-y-auto">
      <div className="space-y-4">
        {/* Header Marca Ultra-Moderno */}
        <div className="flex items-center gap-3 px-2 py-2 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-lg shadow-cyan-500/25 shrink-0 ring-1 ring-white/20">
            WMS
          </div>
          <div className="overflow-hidden">
            <h1 className="font-black text-xs text-white tracking-tight truncate flex items-center gap-1">
              COORSA <span className="text-cyan-400 text-[10px]">LOGISTICS</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">Almacén Central</p>
            </div>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-black ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 hover:border-slate-800'
                }`}
              >
                <span className="text-sm shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Perfil & Cerrar Sesión */}
      <div className="space-y-2 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-900/80 border border-slate-800/90 px-2.5 py-2 rounded-xl flex items-center gap-2.5 shadow-md">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-[10px] text-white shrink-0 shadow ring-1 ring-white/10">
            {usuarioActual.nombreCompleto.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-extrabold text-white truncate">{usuarioActual.nombreCompleto}</p>
            <p className="text-[9px] text-cyan-400 font-semibold truncate">{usuarioActual.rol}</p>
          </div>
        </div>

        {/* Botón Cerrar Sesión Compacto */}
        <button
          onClick={handleCerrarSesion}
          className="w-full bg-slate-900/60 hover:bg-rose-600/20 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-slate-400 font-bold text-[10px] py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
        >
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
