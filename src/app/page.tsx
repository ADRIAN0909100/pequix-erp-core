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

interface PedidoBodega {
  id: string;
  codigo_pedido: string;
  cliente: string;
  ciudad: string;
  prendas_totales: number;
  curvas_detalle: string;
  estado_bodega: 'PENDIENTE' | 'EN_EMPAQUE' | 'LISTO_DESPACHO';
  numero_guia?: string;
}

export default function Home() {
  const [pestana, setPestana] = useState<'BODEGA' | 'DASHBOARD' | 'TIENDA_WEB' | 'INVENTARIO'>('BODEGA');
  const [mensaje, setMensaje] = useState('');
  const [guiaInput, setGuiaInput] = useState<{ [key: string]: string }>({});

  // Lista de Pedidos en Cola de Bodega (Precios Ocultos)
  const [pedidosBodega, setPedidosBodega] = useState<PedidoBodega[]>([
    {
      id: 'PED-101',
      codigo_pedido: 'PED-9081',
      cliente: 'El Palacio de la Pantaleta #1',
      ciudad: 'Montería',
      prendas_totales: 45,
      curvas_detalle: '20x BEBÉS (REF 745), 25x JUNIOR (REF 2552)',
      estado_bodega: 'PENDIENTE'
    },
    {
      id: 'PED-102',
      codigo_pedido: 'PED-9082',
      cliente: 'La Media Naranja Montería',
      ciudad: 'Montería',
      prendas_totales: 30,
      curvas_detalle: '30x BEBÉS PREMIUM (REF 8182)',
      estado_bodega: 'EN_EMPAQUE'
    },
    {
      id: 'PED-103',
      codigo_pedido: 'PED-9083',
      cliente: 'Distribuidora del Sinú S.A.S',
      ciudad: 'Sincelejo',
      prendas_totales: 60,
      curvas_detalle: '40x MESES (REF 1989), 20x JUNIOR (REF 2552)',
      estado_bodega: 'LISTO_DESPACHO',
      numero_guia: 'ENV-99887766-COP'
    }
  ]);

  // Cambiar Estado de Alistamiento de Bodega
  const cambiarEstadoBodega = async (id: string, nuevoEstado: 'PENDIENTE' | 'EN_EMPAQUE' | 'LISTO_DESPACHO') => {
    const guia = guiaInput[id] || '';

    setPedidosBodega(prev =>
      prev.map(p => (p.id === id ? { ...p, estado_bodega: nuevoEstado, numero_guia: guia || p.numero_guia } : p))
    );

    // Registrar en Audit Log Inmutable a Nombre del Operario
    await supabase.from('audit_logs').insert([{
      tenant_id: 'EMP-0001',
      usuario_id: 'USR-BODEGA-01',
      usuario_nombre: 'Operario Bodega FJ Kids',
      accion: 'CAMBIO_ESTADO_DESPACHO_BODEGA',
      entidad_afectada: 'PEDIDOS_DESPACHO',
      entidad_id: id,
      valor_nuevo: { estado_nuevo: nuevoEstado, numero_guia: guia, fecha: new Date().toISOString() }
    }]);

    setMensaje(`📦 Estado del Pedido ${id} actualizado a: ${nuevoEstado} ${guia ? `(Guía: ${guia})` : ''}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant FJ Kids */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              📦 PEQUIX ERP CORE · MÓDULO DE BODEGA & DESPACHOS
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Alistamiento de Pedidos por Curvas (Sin Precios)</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Perfil: <strong style={{ color: '#fbbf24' }}>Operario de Bodega / Logística</strong> — EMP-0001 (FJ Kids)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setPestana('BODEGA')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'BODEGA' ? '#38bdf8' : '#1e293b', color: pestana === 'BODEGA' ? '#0f172a' : '#ffffff' }}>
              📦 Bodega
            </button>
            <button onClick={() => setPestana('DASHBOARD')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'DASHBOARD' ? '#fbbf24' : '#1e293b', color: pestana === 'DASHBOARD' ? '#451a03' : '#ffffff' }}>
              📊 Dashboard
            </button>
            <button onClick={() => setPestana('INVENTARIO')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'INVENTARIO' ? '#10b981' : '#1e293b', color: pestana === 'INVENTARIO' ? '#022c22' : '#ffffff' }}>
              👕 Inventario
            </button>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA BODEGA & DESPACHOS */}
        {pestana === 'BODEGA' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#38bdf8', margin: 0 }}>
                📋 Cola de Alistamiento & Empaque Logístico
              </h2>
              <span style={{ fontSize: '11px', backgroundColor: '#1e293b', color: '#fbbf24', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                🙈 VISTA PROTEGIDA: Precios $ COP Ocultos
              </span>
            </div>

            {/* Tarjetas de Pedidos a Alistar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
              {pedidosBodega.map((p) => (
                <div key={p.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#fbbf24' }}>{p.codigo_pedido}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '900',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: p.estado_bodega === 'PENDIENTE' ? '#881337' : p.estado_bodega === 'EN_EMPAQUE' ? '#713f12' : '#064e3b',
                        color: p.estado_bodega === 'PENDIENTE' ? '#fda4af' : p.estado_bodega === 'EN_EMPAQUE' ? '#fde047' : '#6ee7b7'
                      }}>
                        {p.estado_bodega === 'PENDIENTE' ? '⏳ PENDIENTE' : p.estado_bodega === 'EN_EMPAQUE' ? '📦 EN EMPAQUE' : '✅ LISTO PARA DESPACHO'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: '900', margin: '0 0 4px 0', color: '#ffffff' }}>
                      {p.cliente}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>
                      📍 Destino: <strong>{p.ciudad}</strong> · Total: <strong style={{ color: '#38bdf8' }}>{p.prendas_totales} prendas</strong>
                    </p>

                    <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', fontSize: '11px', color: '#cbd5e1' }}>
                      <strong>Curvas y Unidades a Alistar:</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#fde047', fontFamily: 'monospace' }}>{p.curvas_detalle}</p>
                    </div>
                  </div>

                  {/* Campo Guía de Transporte */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}>Número de Guía de Transporte:</label>
                    <input
                      type="text"
                      placeholder="Ej: ENV-998877-COP"
                      value={guiaInput[p.id] || p.numero_guia || ''}
                      onChange={(e) => setGuiaInput({ ...guiaInput, [p.id]: e.target.value })}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', outline: 'none', marginBottom: '10px' }}
                    />

                    {/* Botones de Control de Bodega */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => cambiarEstadoBodega(p.id, 'EN_EMPAQUE')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#eab308', color: '#451a03', border: 'none', borderRadius: '6px', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}
                      >
                        📦 En Empaque
                      </button>
                      <button
                        onClick={() => cambiarEstadoBodega(p.id, 'LISTO_DESPACHO')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '6px', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}
                      >
                        🚚 Listo Despacho
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
