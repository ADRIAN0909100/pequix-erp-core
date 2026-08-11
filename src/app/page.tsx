'use client';
import React, { useState, useEffect } from 'react';

// Cliente HTTP Directo a Supabase PostgreSQL
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

interface AuditEntry {
  id?: string;
  created_at?: string;
  usuario_nombre: string;
  accion: string;
  entidad_afectada: string;
  entidad_id: string;
  valor_nuevo: any;
}

interface Producto {
  referencia: string;
  descripcion: string;
  curva: string;
  precio_L1_base: number;
  mostrar_en_website: boolean;
}

export default function Home() {
  const [pestana, setPestana] = useState<'DASHBOARD' | 'TIENDA_WEB' | 'PORTAL_CENTRAL' | 'INVENTARIO'>('DASHBOARD');
  const [esMayorista, setEsMayorista] = useState(false);
  const [nitMayorista, setNitMayorista] = useState('');
  const [carrito, setCarrito] = useState<{ [key: string]: number }>({});
  const [mensaje, setMensaje] = useState('');

  // Estados de Auditoría y Métricas
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    {
      created_at: new Date().toISOString(),
      usuario_nombre: 'Adrián Peña',
      accion: 'ACTUALIZAR_CONFIGURACION_PARAMETRIZABLE',
      entidad_afectada: 'TENANTS',
      entidad_id: 'EMP-0001',
      valor_nuevo: { status: 'Estructura JSONB de parámetros activada con éxito' }
    },
    {
      created_at: new Date(Date.now() - 3600000).toISOString(),
      usuario_nombre: 'Adrián Peña',
      accion: 'CREAR_PRODUCTO_TEXTIL',
      entidad_afectada: 'PRODUCTOS',
      entidad_id: '1989',
      valor_nuevo: { referencia: '1989', descripcion: 'OVEROL BEBE', precio_L1_base: 65000 }
    }
  ]);

  const [productos, setProductos] = useState<Producto[]>([
    { referencia: '745', descripcion: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', precio_L1_base: 59900, mostrar_en_website: true },
    { referencia: '8182', descripcion: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', precio_L1_base: 70900, mostrar_en_website: true },
    { referencia: '2552', descripcion: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', precio_L1_base: 43900, mostrar_en_website: true },
    { referencia: '1989', descripcion: 'OVEROL BEBE', curva: 'MESES', precio_L1_base: 65000, mostrar_en_website: true }
  ]);

  useEffect(() => {
    async function cargar() {
      const { data: dataProds } = await supabase.from('productos').select('*');
      if (dataProds && dataProds.length > 0) setProductos(dataProds);

      const { data: dataLogs } = await supabase.from('audit_logs').select('*');
      if (dataLogs && dataLogs.length > 0) setAuditLogs(dataLogs);
    }
    cargar();
  }, []);

  const getPrecioTienda = (p: Producto) => {
    if (esMayorista) return p.precio_L1_base;
    return Math.round((p.precio_L1_base * 1.7) / 100) * 100 - 100;
  };

  const agregarAlCarrito = (ref: string) => {
    setCarrito(prev => ({ ...prev, [ref]: (prev[ref] || 0) + 1 }));
    setMensaje(`🛒 Referencia ${ref} agregada al carrito de compras.`);
  };

  const totalUnidadesCarrito = Object.values(carrito).reduce((a, b) => a + b, 0);
  const totalPagarCOP = productos.reduce((acc, p) => acc + ((carrito[p.referencia] || 0) * getPrecioTienda(p)), 0);

  // Métricas Simuladas para Dashboard
  const ventasTotalesCOP = 12450000;
  const prendasVendidasTotal = 184;
  const comisionVendedor6 = ventasTotalesCOP * 0.06;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header E-Commerce Pequix */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#fbbf24', color: '#451a03', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              📊 PEQUIX ERP CORE · DASHBOARD GERENCIAL
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Panel de Control & Audit Log Inmutable</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Usuario: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001)</strong> — EMP-0001 (FJ Kids)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setPestana('DASHBOARD')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'DASHBOARD' ? '#fbbf24' : '#1e293b', color: pestana === 'DASHBOARD' ? '#451a03' : '#ffffff' }}>
              📊 Dashboard
            </button>
            <button onClick={() => setPestana('TIENDA_WEB')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'TIENDA_WEB' ? '#10b981' : '#1e293b', color: pestana === 'TIENDA_WEB' ? '#022c22' : '#ffffff' }}>
              🛍️ Tienda Web
            </button>
            <button onClick={() => setPestana('INVENTARIO')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'INVENTARIO' ? '#38bdf8' : '#1e293b', color: pestana === 'INVENTARIO' ? '#022c22' : '#ffffff' }}>
              👕 Inventario
            </button>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA 1: DASHBOARD GERENCIAL & AUDIT LOG */}
        {pestana === 'DASHBOARD' && (
          <>
            {/* Tarjetas KPI Financieras */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Ventas Totales ($ COP)</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981', margin: '8px 0 0 0' }}>
                  $ {ventasTotalesCOP.toLocaleString('es-CO')}
                </h3>
                <p style={{ fontSize: '11px', color: '#34d399', margin: '4px 0 0 0', fontWeight: 'bold' }}>📈 Crecimiento activo en FJ Kids</p>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Prendas Despachadas</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#38bdf8', margin: '8px 0 0 0' }}>
                  {prendasVendidasTotal} Unidades
                </h3>
                <p style={{ fontSize: '11px', color: '#7dd3fc', margin: '4px 0 0 0', fontWeight: 'bold' }}>📦 Curvas de Bebés & Junior</p>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Comisiones Asesor (6.0%)</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fbbf24', margin: '8px 0 0 0' }}>
                  $ {comisionVendedor6.toLocaleString('es-CO')}
                </h3>
                <p style={{ fontSize: '11px', color: '#fde047', margin: '4px 0 0 0', fontWeight: 'bold' }}>👤 Asignadas a Adrián Peña</p>
              </div>
            </div>

            {/* Tabla de Auditoría Inmutable (Audit Log) */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fbbf24', margin: 0 }}>
                  📜 Historial de Auditoría Inmutable (`audit_logs`)
                </h3>
                <span style={{ backgroundColor: '#064e3b', color: '#34d399', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px' }}>
                  🟢 REGISTROS EN TIEMPO REAL
                </span>
              </div>

              <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '10px 8px' }}>FECHA / HORA</th>
                    <th style={{ padding: '10px 8px' }}>USUARIO</th>
                    <th style={{ padding: '10px 8px' }}>ACCIÓN</th>
                    <th style={{ padding: '10px 8px' }}>ENTIDAD</th>
                    <th style={{ padding: '10px 8px' }}>ID ENTIDAD</th>
                    <th style={{ padding: '10px 8px' }}>VALOR / DETALLE JSON</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '11px' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString('es-CO') : 'Reciente'}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#fbbf24' }}>
                        {log.usuario_nombre}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px' }}>
                          {log.accion}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{log.entidad_afectada}</td>
                      <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: 'bold' }}>{log.entidad_id}</td>
                      <td style={{ padding: '12px 8px', fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                        {JSON.stringify(log.valor_nuevo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
