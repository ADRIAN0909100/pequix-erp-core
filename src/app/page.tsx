'use client';
import React, { useState, useEffect } from 'react';

// Cliente HTTP Directo a Supabase (Sin dependencias externas)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = {
  from: (table: string) => ({
    select: async (query = '*') => {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${query}`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          cache: 'no-store'
        });
        const data = await res.json();
        return { data: Array.isArray(data) ? data : [], error: null };
      } catch (err) {
        return { data: [], error: err };
      }
    },
    insert: async (records: any[]) => {
      try {
        await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(records)
        });
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    }
  })
};

interface Producto {
  referencia: string;
  descripcion: string;
  curva: string;
  precio_L1_base: number;
  mostrar_en_website: boolean;
}

export default function Home() {
  const [lista, setLista] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L1');
  const [visibilidad, setVisibilidad] = useState<'CON_VALORES' | 'SOLO_UNITARIO' | 'SIN_VALORES'>('CON_VALORES');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState('');

  // Deltas Parametrizables FJ Kids (EMP-0001)
  const deltaL2 = 1000;
  const deltaL4 = -2000;

  const cargarDatos = async () => {
    try {
      const { data: dataProds } = await supabase.from('productos').select('*');
      const { data: dataLogs } = await supabase.from('audit_logs').select('*');

      if (dataProds && dataProds.length > 0) {
        setProductos(dataProds);
      } else {
        setProductos([
          { referencia: '745', descripcion: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', precio_L1_base: 59900, mostrar_en_website: true },
          { referencia: '8182', descripcion: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', precio_L1_base: 70900, mostrar_en_website: true },
          { referencia: '2552', descripcion: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', precio_L1_base: 43900, mostrar_en_website: true }
        ]);
      }

      if (dataLogs && Array.isArray(dataLogs)) setLogs(dataLogs.slice(-5).reverse());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getPrecio = (base: number) => {
    if (lista === 'L2') return base + deltaL2;
    if (lista === 'L4') return base + deltaL4;
    if (lista === 'L3') return Math.round((base * 1.7) / 100) * 100 - 100;
    return base;
  };

  // Switch de Visibilidad B2B/B2C con Registro de Auditoría Inmutable
  const toggleWebsite = async (ref: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    setProductos(prev => prev.map(p => p.referencia === ref ? { ...p, mostrar_en_website: nuevoEstado } : p));

    await supabase.from('audit_logs').insert([
      {
        tenant_id: 'EMP-0001',
        usuario_id: 'USR-0001',
        usuario_nombre: 'Adrián Peña',
        accion: 'TOGGLE_VISIBILIDAD_WEB',
        entidad_afectada: 'PRODUCTOS',
        entidad_id: ref,
        valor_nuevo: { referencia: ref, visible_web: nuevoEstado, fecha: new Date().toISOString() }
      }
    ]);

    setMensaje(`✨ Visibilidad Web actualizada para REF ${ref}: ${nuevoEstado ? 'Visible 🌐' : 'Oculto 🔒'}`);
    cargarDatos();
  };

  const totalPrendas = productos.length * 20;
  const subtotalCOP = productos.reduce((acc, p) => acc + (20 * getPrecio(p.precio_L1_base)), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant FJ Kids */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              🟢 PEQUIX ERP CORE · INVENTARIO & AUDITORÍA
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Matriz Textil Infantil & Audit Log Live</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Administrador: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001 / V2)</strong> — Tenant: EMP-0001 (FJ Kids)
            </p>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '12px 18px', borderRadius: '12px', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Estimado:</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fbbf24' }}>{totalPrendas} unds</span>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* Selector Tarifario L1-L5 */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px' }}>
          <label style={{ display: 'block', fontWeight: '800', fontSize: '12px', marginBottom: '12px', color: '#cbd5e1' }}>
            🔄 Selector de Listas Dinámicas (Motor L1-L5):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            {(['L1', 'L2', 'L4', 'L3'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLista(l)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '900',
                  fontSize: '11px',
                  cursor: 'pointer',
                  border: '1px solid #10b981',
                  backgroundColor: lista === l ? '#10b981' : '#1e293b',
                  color: lista === l ? '#022c22' : '#f8fafc'
                }}
              >
                {l === 'L1' && 'L1 · MAYORISTA BASE'}
                {l === 'L2' && 'L2 · DISTRIBUIDOR (+1K)'}
                {l === 'L4' && 'L4 · LOCAL MEDELLÍN (-2K)'}
                {l === 'L3' && 'L3 · DETAL / B2C (~70%)'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Matriz con Switch Web */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                <th style={{ padding: '10px 8px' }}>REF</th>
                <th style={{ padding: '10px 8px' }}>DESCRIPCIÓN</th>
                <th style={{ padding: '10px 8px' }}>CURVA</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>MOSTRAR EN WEBSITE</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>UNITARIO ($ COP)</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>SUBTOTAL ($ COP)</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const u = getPrecio(p.precio_L1_base);
                return (
                  <tr key={p.referencia} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '900', color: '#fbbf24' }}>{p.referencia}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{p.descripcion}</td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{p.curva}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleWebsite(p.referencia, p.mostrar_en_website)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          cursor: 'pointer',
                          backgroundColor: p.mostrar_en_website ? '#064e3b' : '#881337',
                          color: p.mostrar_en_website ? '#34d399' : '#f43f5e'
                        }}
                      >
                        {p.mostrar_en_website ? '🌐 Sí (Visible B2B/B2C)' : '🔒 No (Oculto)'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {visibilidad === 'SIN_VALORES' ? '🔒 Oculto' : `$ ${u.toLocaleString('es-CO')}`}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>
                      {visibilidad === 'CON_VALORES' ? `$ ${(20 * u).toLocaleString('es-CO')}` : '🔒 Oculto'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visor de Auditoría Inmutable (Audit Log) */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#fbbf24', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
            📜 Últimos Registros en Audit Log (PostgreSQL Inmutable)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.length === 0 ? (
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>No hay registros de auditoría aún.</span>
            ) : (
              logs.map((l, i) => (
                <div key={i} style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span><strong>{l.usuario_nombre || 'Adrián Peña'}</strong> ejecutó <strong style={{ color: '#10b981' }}>{l.accion}</strong> en {l.entidad_afectada} ({l.entidad_id})</span>
                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>{l.fecha_hora ? new Date(l.fecha_hora).toLocaleTimeString() : 'En vivo'}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
