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

export default function Home() {
  const [pestana, setPestana] = useState<'DASHBOARD' | 'API_REST' | 'INVENTARIO'>('API_REST');
  const [mensaje, setMensaje] = useState('');

  // Probar Endpoint de la API REST
  const probarApiProductos = async () => {
    try {
      const res = await fetch('/api/v1/productos');
      const data = await res.json();
      setMensaje(`🔌 API Respuesta: ${data.total_referencias} Referencias sincronizadas correctamente vía REST.`);
    } catch (err) {
      setMensaje('❌ Ocurrió un error al consultar la API REST.');
    }
  };

  // Simular Sincronización desde Siigo / Tiendanube
  const simularSyncPedidoExterno = async (origen: string) => {
    try {
      const res = await fetch('/api/v1/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: 'Distribuidora del Sinu S.A.S',
          total_prendas: 45,
          subtotal_cop: 2850000,
          origen_sistema: origen
        })
      });
      const data = await res.json();
      setMensaje(`✨ Sincronización Exitosa desde ${origen}: Pedido ${data.codigo_pedido} por $ ${data.subtotal_cop.toLocaleString('es-CO')} COP ingresado al ERP.`);
    } catch (err) {
      setMensaje('❌ Ocurrió un error al sincronizar con el sistema externo.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header E-Commerce Pequix */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              🔌 PEQUIX ERP CORE · INTEGRACIONES Y API REST
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Conectores Siigo, Tiendanube & Cuenti</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Usuario: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001)</strong> — EMP-0001 (FJ Kids)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setPestana('API_REST')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'API_REST' ? '#38bdf8' : '#1e293b', color: pestana === 'API_REST' ? '#0f172a' : '#ffffff' }}>
              🔌 API REST
            </button>
            <button onClick={() => setPestana('DASHBOARD')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'DASHBOARD' ? '#fbbf24' : '#1e293b', color: pestana === 'DASHBOARD' ? '#451a03' : '#ffffff' }}>
              📊 Dashboard
            </button>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA: API REST & INTEGRACIONES */}
        {pestana === 'API_REST' && (
          <>
            {/* Panel de Estado de Endpoints */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#38bdf8', margin: 0 }}>
                🌐 Endpoints REST Activos en Producción
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ backgroundColor: '#064e3b', color: '#34d399', fontSize: '10px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px' }}>GET</span>
                  <code style={{ display: 'block', color: '#fbbf24', fontSize: '12px', fontWeight: 'bold', margin: '8px 0' }}>/api/v1/productos</code>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>Sincronización de catálogo, curvas y precios L1-L5 con e-commerce.</p>
                  <button onClick={probarApiProductos} style={{ width: '100%', padding: '8px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                    ⚡ Probar Endpoint GET
                  </button>
                </div>

                <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ backgroundColor: '#1e3a8a', color: '#93c5fd', fontSize: '10px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px' }}>POST</span>
                  <code style={{ display: 'block', color: '#fbbf24', fontSize: '12px', fontWeight: 'bold', margin: '8px 0' }}>/api/v1/pedidos</code>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>Inyección automática de pedidos desde Siigo, Cuenti o Tiendanube.</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => simularSyncPedidoExterno('Tiendanube')} style={{ width: '50%', padding: '8px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                      🛒 Sync Tiendanube
                    </button>
                    <button onClick={() => simularSyncPedidoExterno('Siigo POS')} style={{ width: '50%', padding: '8px', backgroundColor: '#fbbf24', color: '#451a03', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                      🧾 Sync Siigo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Credenciales de Autenticación API */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fbbf24', margin: '0 0 10px 0' }}>
                🔑 Token de Autenticación para Desarrolladores
              </h3>
              <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Bearer pk_live_pequix_998877665544332211_emp0001</span>
                <span style={{ backgroundColor: '#064e3b', color: '#34d399', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ACTIVO</span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
