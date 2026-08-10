'use client';
import React, { useState } from 'react';

export default function Home() {
  const [lista, setLista] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L1');
  const [visibilidad, setVisibilidad] = useState<'CON_VALORES' | 'SOLO_UNITARIO' | 'SIN_VALORES'>('CON_VALORES');

  const deltaL2 = 1000;
  const deltaL4 = -2000;

  const productos = [
    { ref: '745', desc: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', prendas: 25, precioL1: 59900 },
    { ref: '8182', desc: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', prendas: 30, precioL1: 70900 },
    { ref: '2552', desc: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', prendas: 14, precioL1: 43900 }
  ];

  const getPrecio = (base: number) => {
    if (lista === 'L2') return base + deltaL2;
    if (lista === 'L4') return base + deltaL4;
    if (lista === 'L3') return Math.round((base * 1.7) / 100) * 100 - 100;
    return base;
  };

  const totalPrendas = productos.reduce((acc, p) => acc + p.prendas, 0);
  const subtotalCOP = productos.reduce((acc, p) => acc + (p.prendas * getPrecio(p.precioL1)), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant FJ Kids */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              🟢 PEQUIX ERP CORE
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Toma de Pedidos B2B & Motor Tarifario L1-L5</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Asesor Comercial: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001 / V2)</strong> — Tenant: EMP-0001 (FJ Kids)
            </p>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '12px 18px', borderRadius: '12px', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Prendas:</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fbbf24' }}>{totalPrendas} unds</span>
          </div>
        </div>

        {/* Selector de Listas Dinámicas */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px' }}>
          <label style={{ display: 'block', fontWeight: '800', fontSize: '12px', marginBottom: '12px', color: '#cbd5e1' }}>
            🔄 Seleccionar Lista de Precios Dinámica en Vivo:
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

        {/* Tabla Matriz de Productos */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                <th style={{ padding: '10px 8px' }}>REF</th>
                <th style={{ padding: '10px 8px' }}>DESCRIPCIÓN</th>
                <th style={{ padding: '10px 8px' }}>CURVA</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>PRENDAS</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>UNITARIO ($ COP)</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>SUBTOTAL ($ COP)</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const u = getPrecio(p.precioL1);
                return (
                  <tr key={p.ref} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '900', color: '#fbbf24' }}>{p.ref}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{p.desc}</td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{p.curva}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '900', color: '#10b981' }}>{p.prendas}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {visibilidad === 'SIN_VALORES' ? '🔒 Oculto' : `$ ${u.toLocaleString('es-CO')}`}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>
                      {visibilidad === 'CON_VALORES' ? `$ ${(p.prendas * u).toLocaleString('es-CO')}` : '🔒 Oculto'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total & Permisos Granulares */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>Total Pedido Calculado:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981' }}>
              {visibilidad === 'CON_VALORES' ? `$ ${subtotalCOP.toLocaleString('es-CO')} COP` : '🔒 TOTAL CONFIDENCIAL'}
            </div>
            <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
              Comisión Asignada a Adrián Peña (6%): $ ${(subtotalCOP * 0.06).toLocaleString('es-CO')} COP
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setVisibilidad('CON_VALORES')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: visibilidad === 'CON_VALORES' ? '#10b981' : '#1e293b', color: visibilidad === 'CON_VALORES' ? '#022c22' : '#94a3b8' }}>
              Full Valores
            </button>
            <button onClick={() => setVisibilidad('SOLO_UNITARIO')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: visibilidad === 'SOLO_UNITARIO' ? '#10b981' : '#1e293b', color: visibilidad === 'SOLO_UNITARIO' ? '#022c22' : '#94a3b8' }}>
              Solo Unitarios
            </button>
            <button onClick={() => setVisibilidad('SIN_VALORES')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: visibilidad === 'SIN_VALORES' ? '#10b981' : '#1e293b', color: visibilidad === 'SIN_VALORES' ? '#022c22' : '#94a3b8' }}>
              Sin Valores (Luz Deisy / Bodega)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
