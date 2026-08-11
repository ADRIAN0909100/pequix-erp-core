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

interface Tenant {
  id: string;
  nombre_empresa: string;
  nit: string;
  plan: 'BÁSICO' | 'PRO' | 'ENTERPRISE';
  estado_pago: 'ACTIVO' | 'PENDIENTE' | 'MORA';
  valor_mensual_cop: number;
}

interface Producto {
  referencia: string;
  descripcion: string;
  curva: string;
  precio_L1_base: number;
  mostrar_en_website: boolean;
}

export default function Home() {
  const [pestana, setPestana] = useState<'PORTAL_CENTRAL' | 'INVENTARIO' | 'PEDIDOS'>('PORTAL_CENTRAL');
  const [mensaje, setMensaje] = useState('');

  // Empresas Registradas en Pequix SaaS
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 'EMP-0001', nombre_empresa: 'FJ Kids Confecciones', nit: '900123456-1', plan: 'ENTERPRISE', estado_pago: 'ACTIVO', valor_mensual_cop: 250000 },
    { id: 'EMP-0002', nombre_empresa: 'Aceros Febel E-commerce', nit: '901987654-2', plan: 'PRO', estado_pago: 'ACTIVO', valor_mensual_cop: 150000 }
  ]);

  // Formulario de Registro de Nueva Empresa
  const [nuevoNombreEmpresa, setNuevoNombreEmpresa] = useState('');
  const [nuevoNitEmpresa, setNuevoNitEmpresa] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState<'BÁSICO' | 'PRO' | 'ENTERPRISE'>('PRO');

  // Inventario
  const [productos, setProductos] = useState<Producto[]>([
    { referencia: '745', descripcion: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', precio_L1_base: 59900, mostrar_en_website: true },
    { referencia: '8182', descripcion: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', precio_L1_base: 70900, mostrar_en_website: true },
    { referencia: '2552', descripcion: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', precio_L1_base: 43900, mostrar_en_website: true },
    { referencia: '1989', descripcion: 'OVEROL BEBE', curva: 'MESES', precio_L1_base: 65000, mostrar_en_website: true }
  ]);

  const getValorPlan = (p: 'BÁSICO' | 'PRO' | 'ENTERPRISE') => {
    if (p === 'BÁSICO') return 89000;
    if (p === 'PRO') return 150000;
    return 250000;
  };

  // Registrar Nueva Empresa Clienta en Pequix ERP
  const registrarEmpresa = async () => {
    if (!nuevoNombreEmpresa || !nuevoNitEmpresa) {
      setMensaje('⚠️ Completa el Nombre de la Empresa y el NIT.');
      return;
    }

    const nuevoId = `EMP-000${tenants.length + 1}`;
    const valorCOP = getValorPlan(planSeleccionado);

    const tenantNuevo: Tenant = {
      id: nuevoId,
      nombre_empresa: nuevoNombreEmpresa,
      nit: nuevoNitEmpresa,
      plan: planSeleccionado,
      estado_pago: 'ACTIVO',
      valor_mensual_cop: valorCOP
    };

    setTenants(prev => [...prev, tenantNuevo]);

    // Persistencia en Supabase
    await supabase.from('tenants').insert([{
      id: nuevoId,
      nombre_empresa: nuevoNombreEmpresa,
      nit: nuevoNitEmpresa,
      plan: planSeleccionado,
      estado_pago: 'ACTIVO',
      valor_mensual_cop: valorCOP
    }]);

    // Registro Inmutable en Audit Log
    await supabase.from('audit_logs').insert([{
      tenant_id: 'PEQUIX-SUPERADMIN',
      usuario_id: 'USR-0001',
      usuario_nombre: 'Adrián Peña',
      accion: 'REGISTRAR_NUEVO_TENANT_SAAS',
      entidad_afectada: 'TENANTS',
      entidad_id: nuevoId,
      valor_nuevo: tenantNuevo
    }]);

    setMensaje(`🎉 ¡Empresa ${nuevoNombreEmpresa} (${nuevoId}) registrada exitosamente en Pequix ERP!`);
    setNuevoNombreEmpresa('');
    setNuevoNitEmpresa('');
  };

  // Simulación de Cobro por Wompi / Mercado Pago
  const procesarCobroWompi = (t: Tenant) => {
    setMensaje(`💳 Pasarela Wompi iniciada para ${t.nombre_empresa}: Cobro mensual por $ ${t.valor_mensual_cop.toLocaleString('es-CO')} COP en proceso...`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant FJ Kids */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#fbbf24', color: '#451a03', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              👑 PORTAL CENTRAL PEQUIX · SUPER-ADMIN SAAS
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Gestión de Tenants & Pasarelas de Pago</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Super-Admin: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001)</strong> — Propiedad de Pequix Digital
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setPestana('PORTAL_CENTRAL')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'PORTAL_CENTRAL' ? '#fbbf24' : '#1e293b', color: pestana === 'PORTAL_CENTRAL' ? '#022c22' : '#ffffff' }}>
              🏢 Portal Pequix
            </button>
            <button onClick={() => setPestana('INVENTARIO')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'INVENTARIO' ? '#10b981' : '#1e293b', color: pestana === 'INVENTARIO' ? '#022c22' : '#ffffff' }}>
              👕 Inventario
            </button>
            <button onClick={() => setPestana('PEDIDOS')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'PEDIDOS' ? '#38bdf8' : '#1e293b', color: pestana === 'PEDIDOS' ? '#022c22' : '#ffffff' }}>
              🛒 Pedidos B2B
            </button>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA: PORTAL CENTRAL PEQUIX (SUPER-ADMIN SAAS) */}
        {pestana === 'PORTAL_CENTRAL' && (
          <>
            {/* Formulario de Alta de Nueva Empresa Clienta */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fbbf24', margin: 0 }}>
                ➕ Registrar Nueva Empresa Clienta (Tenant SaaS)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Nombre Comercial de la Empresa:</label>
                  <input
                    type="text"
                    placeholder="Ej: Calzado Infantil Peques S.A.S"
                    value={nuevoNombreEmpresa}
                    onChange={(e) => setNuevoNombreEmpresa(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>NIT Legal:</label>
                  <input
                    type="text"
                    placeholder="Ej: 901555444-8"
                    value={nuevoNitEmpresa}
                    onChange={(e) => setNuevoNitEmpresa(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fbbf24', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Plan SaaS Pequix ($ COP):</label>
                  <select
                    value={planSeleccionado}
                    onChange={(e) => setPlanSeleccionado(e.target.value as any)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#10b981', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  >
                    <option value="BÁSICO">BÁSICO ($89.000 / mes)</option>
                    <option value="PRO">PRO ($150.000 / mes)</option>
                    <option value="ENTERPRISE">ENTERPRISE ($250.000 / mes)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={registrarEmpresa}
                style={{ padding: '12px', backgroundColor: '#fbbf24', color: '#451a03', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}
              >
                🚀 Registrar Tenant & Activar Cuenta
              </button>
            </div>

            {/* Lista de Tenants y Cobros Wompi */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#10b981', margin: '0 0 15px 0' }}>
                🏢 Empresas Registradas & Facturación Recurrente (Wompi)
              </h3>

              <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '10px 8px' }}>TENANT ID</th>
                    <th style={{ padding: '10px 8px' }}>EMPRESA</th>
                    <th style={{ padding: '10px 8px' }}>NIT</th>
                    <th style={{ padding: '10px 8px' }}>PLAN SAAS</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>VALOR MENSUAL</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>PASARELA WOMPI</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '900', color: '#fbbf24' }}>{t.id}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{t.nombre_empresa}</td>
                      <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{t.nit}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px' }}>
                          {t.plan}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>
                        $ {t.valor_mensual_cop.toLocaleString('es-CO')} COP
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => procesarCobroWompi(t)}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: '#0284c7', color: '#ffffff' }}
                        >
                          💳 Cobrar por Wompi
                        </button>
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
