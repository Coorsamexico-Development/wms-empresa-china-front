'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@coorsa.com');
  const [password, setPassword] = useState('Coorsa#2026!');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('wms_user', JSON.stringify(data.usuario));
        localStorage.setItem('wms_token', data.token);
        router.push('/');
      } else {
        const errJson = await res.json();
        setError(errJson.message || 'Credenciales inválidas. Intente nuevamente.');
      }
    } catch (err: any) {
      setError(`Error de conexión con el servidor: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo con resplandores degradados */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-900/90 border border-slate-800 p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Header Marca */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-sky-500/20 mx-auto">
            WMS
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">COORSA LOGISTICS</h1>
          <p className="text-xs text-slate-400 font-medium">Plataforma Web de Gestión de Almacenes</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1.5">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="ejemplo@coorsa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-sky-900/30 transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {cargando ? 'Iniciando Sesión...' : 'INICIAR SESIÓN EN WMS'}
          </button>
        </form>

        {/* Credenciales de Prueba */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1.5 text-[11px]">
          <span className="font-bold text-sky-400 block uppercase">🔑 Credenciales Administrador General:</span>
          <div className="flex justify-between text-slate-300">
            <span>Email:</span>
            <span className="font-mono text-white font-bold">admin@coorsa.com</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Contraseña:</span>
            <span className="font-mono text-white font-bold">Coorsa#2026!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
