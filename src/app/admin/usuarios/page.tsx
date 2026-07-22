'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/apiFetch';

interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos?: string;
  usuarios?: any[];
}

interface Usuario {
  id: number;
  nombreCompleto: string;
  email: string;
  rolId: number;
  rol?: Rol;
  fechaCreacion?: string;
}

export default function AdminUsuariosPage() {
  const [pestaña, setPestaña] = useState<'usuarios' | 'roles'>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // MODAL CREAR USUARIO
  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [rolIdSeleccionado, setRolIdSeleccionado] = useState<number | ''>('');

  // MODAL CREAR ROL
  const [mostrarModalRol, setMostrarModalRol] = useState(false);
  const [nombreRol, setNombreRol] = useState('');
  const [descripcionRol, setDescripcionRol] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([
    'RECEPTIONS_READ',
    'PALLETIZING_WRITE',
  ]);

  const catalogoPermisos = [
    { id: 'RECEPTIONS_READ', label: 'Consultar Recepciones de Transporte' },
    { id: 'RECEPTIONS_WRITE', label: 'Registrar Nuevas Recepciones' },
    { id: 'PALLETIZING_WRITE', label: 'Armar, Editar y Cerrar Pallets LPN' },
    { id: 'DISPATCH_WRITE', label: 'Despachar y Confirmar Salidas' },
    { id: 'AUDIT_VIEW', label: 'Ver Bitácora de Auditoría' },
    { id: 'ADMIN_ALL', label: 'Administración Total de Usuarios y Roles' },
  ];

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const resUsers = await apiFetch('/api/usuarios');
      if (resUsers.ok) setUsuarios(await resUsers.json());

      const resRoles = await apiFetch('/api/usuarios/roles');
      if (resRoles.ok) {
        const rolesData: Rol[] = await resRoles.json();
        setRoles(rolesData);
        if (rolesData.length > 0 && !rolIdSeleccionado) {
          setRolIdSeleccionado(rolesData[0].id);
        }
      }
    } catch (err) {
      console.log('Error cargando usuarios/roles:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Crear Usuario y Enviar Credenciales
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolIdSeleccionado) {
      alert('⚠️ Seleccione un rol para el usuario.');
      return;
    }

    setCargando(true);
    try {
      const res = await apiFetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto,
          email,
          rolId: Number(rolIdSeleccionado),
        }),
      });

      if (res.ok) {
        const resJson = await res.json();
        setMensaje(
          `🎉 Usuario "${nombreCompleto}" creado exitosamente.\n` +
            `📧 Credenciales de acceso enviadas a: ${email}\n` +
            `🔑 Contraseña Temporal asignada: ${resJson.passwordTemporal}`,
        );
        setMostrarModalUsuario(false);
        setNombreCompleto('');
        setEmail('');
        await cargarDatos();
      } else {
        const errJson = await res.json();
        alert(`❌ Error: ${errJson.message || 'No se pudo crear el usuario'}`);
      }
    } catch (err: any) {
      alert(`❌ Error al conectar con el servidor: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Crear Nuevo Rol y Permisos
  const handleCrearRol = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await apiFetch('/api/usuarios/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreRol,
          descripcion: descripcionRol,
          permisos: permisosSeleccionados.join(','),
        }),
      });

      if (res.ok) {
        setMensaje(`✅ Rol "${nombreRol}" creado exitosamente.`);
        setMostrarModalRol(false);
        setNombreRol('');
        setDescripcionRol('');
        await cargarDatos();
      } else {
        const errJson = await res.json();
        alert(`❌ Error al crear rol: ${errJson.message}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const togglePermiso = (permisoId: string) => {
    if (permisosSeleccionados.includes(permisoId)) {
      setPermisosSeleccionados(permisosSeleccionados.filter((p) => p !== permisoId));
    } else {
      setPermisosSeleccionados([...permisosSeleccionados, permisoId]);
    }
  };

  return (
    <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Administración del Sistema</span>
          <h1 className="text-2xl font-black text-white mt-1">Usuarios, Roles & Permisos</h1>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de accesos, creación de operadores y envío automático de credenciales por correo.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setMostrarModalUsuario(true)}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-sky-900/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>👤</span> + CREAR NUEVO USUARIO
          </button>

          <button
            onClick={() => setMostrarModalRol(true)}
            className="bg-slate-800 hover:bg-slate-750 text-indigo-300 font-extrabold text-xs px-4 py-3 rounded-xl border border-slate-700 transition-all shadow flex items-center gap-2"
          >
            <span>🔐</span> + NUEVO ROL
          </button>
        </div>
      </header>

      {mensaje && (
        <div className="bg-sky-500/10 border border-sky-500/30 text-sky-300 p-5 rounded-2xl text-xs font-semibold whitespace-pre-line flex items-center justify-between shadow-md">
          <div>{mensaje}</div>
          <button onClick={() => setMensaje(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Pestañas de Navegación: Usuarios vs Roles */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setPestaña('usuarios')}
          className={`pb-3 transition-colors ${
            pestaña === 'usuarios'
              ? 'text-sky-400 border-b-2 border-sky-400 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          👥 Usuarios Registrados ({usuarios.length})
        </button>

        <button
          onClick={() => setPestaña('roles')}
          className={`pb-3 transition-colors ${
            pestaña === 'roles'
              ? 'text-sky-400 border-b-2 border-sky-400 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔐 Roles & Permisos ({roles.length})
        </button>
      </div>

      {/* PESTAÑA 1: TABLA DE USUARIOS */}
      {pestaña === 'usuarios' && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="p-3">ID</th>
                <th className="p-3">Nombre Completo</th>
                <th className="p-3">Correo Electrónico (Email)</th>
                <th className="p-3">Rol Asignado</th>
                <th className="p-3 text-right">Fecha de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    {cargando ? 'Cargando usuarios...' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-extrabold text-sky-400">#{u.id}</td>
                    <td className="p-3 text-white font-bold">{u.nombreCompleto}</td>
                    <td className="p-3 text-slate-300 font-mono">{u.email}</td>
                    <td className="p-3">
                      <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold text-[10px] uppercase">
                        {u.rol?.nombre || `Rol #${u.rolId}`}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-400 font-mono">
                      {u.fechaCreacion ? new Date(u.fechaCreacion).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* PESTAÑA 2: TABLA DE ROLES Y PERMISOS */}
      {pestaña === 'roles' && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="p-3">Nombre del Rol</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Permisos Asignados</th>
                <th className="p-3 text-right">Usuarios con este Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">
                    {cargando ? 'Cargando roles...' : 'No hay roles registrados.'}
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-sky-300">{r.nombre}</td>
                    <td className="p-3 text-slate-300">{r.descripcion || 'Sin descripción'}</td>
                    <td className="p-3 text-slate-400 font-mono">
                      {r.permisos?.split(',').map((p, i) => (
                        <span key={i} className="inline-block bg-slate-800 text-slate-200 text-[10px] px-2 py-0.5 rounded mr-1 mb-1">
                          {p.trim()}
                        </span>
                      ))}
                    </td>
                    <td className="p-3 text-right font-extrabold text-white">
                      {r.usuarios?.length || 0} Usuarios
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* MODAL 1: CREAR USUARIO Y ENVIAR CREDENCIALES POR CORREO */}
      {mostrarModalUsuario && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Alta de Usuario Operativo</h3>
                <p className="text-xs text-slate-400">Se le enviarán sus credenciales por correo electrónico.</p>
              </div>
              <button onClick={() => setMostrarModalUsuario(false)} className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María González"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Correo Electrónico (Email) *</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Rol Asignado *</label>
                <select
                  value={rolIdSeleccionado}
                  onChange={(e) => setRolIdSeleccionado(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.descripcion || 'Sin desc.'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl text-[11px] text-sky-300">
                ℹ️ Al guardar, el sistema generará automáticamente una contraseña temporal segura y la enviará por correo electrónico al usuario.
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {cargando ? 'Creando y enviando correo...' : 'CREAR USUARIO Y ENVIAR CREDENCIALES'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR ROL Y ASIGNAR PERMISOS */}
      {mostrarModalRol && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Crear Nuevo Rol & Permisos</h3>
                <p className="text-xs text-slate-400">Defina el nivel de acceso para los operadores.</p>
              </div>
              <button onClick={() => setMostrarModalRol(false)} className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearRol} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nombre del Rol *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Montacarguista / Operador Despacho"
                  value={nombreRol}
                  onChange={(e) => setNombreRol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Descripción del Rol</label>
                <input
                  type="text"
                  placeholder="Ej. Responsable de carga y despacho de unidades de salida"
                  value={descripcionRol}
                  onChange={(e) => setDescripcionRol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="font-bold text-indigo-400 block">Permisos del Sistema</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {catalogoPermisos.map((p) => {
                    const checked = permisosSeleccionados.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePermiso(p.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          checked ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-semibold text-[11px]">{p.label}</span>
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold border ${
                          checked ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700 text-transparent'
                        }`}>
                          ✓
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all active:scale-95"
              >
                GUARDAR ROL Y PERMISOS
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
