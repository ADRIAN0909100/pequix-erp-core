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

interface Producto {
  referencia: string;
  descripcion: string;
  curva: string;
  precio_L1_base: number;
}

interface Cliente {
  id: string;
  nit: string;
  razon_social: string;
  nombre_comercial: string;
  ciudad: string;
  telefono?: string;
}

export default function Home() {
  const [lista, setLista] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L1');
  const [visibilidad, setVisibilidad] = useState<'CON_VALORES' | 'SOLO_UNITARIO' | 'SIN_VALORES'>('CON_VALORES');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [cantidades, setCantidades] = useState<{ [key: string]: number }>({ '745': 25, '8182': 30, '2552': 14 });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [ultimoCodigo, setUltimoCodigo] = useState('PED-3301');

  // Deltas Parametrizables FJ Kids (EMP-0001)
  const deltaL2 = 1000;
  const deltaL4 = -2000;

  const productos: Producto[] = [
    { referencia: '745', descripcion: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', precio_L1_base: 59900 },
    { referencia: '8182', descripcion: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', precio_L1_base: 70900 },
    { referencia: '2552', descripcion: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', precio_L1_base: 43900 }
  ];

  useEffect(() => {
    async function cargarClientes() {
      const { data } = await supabase.from('clientes').select('*');
      if (data && data.length > 0) {
        setClientes(data);
        setClienteSeleccionado(data[0].id);
      } else {
        const respaldo = [
          { id: '1', nit: '901164484-3', razon_social: 'Comercializadora Palacio S.A.S', nombre_comercial: 'El Palacio de la Pantaleta #1 Montería', ciudad: 'Montería', telefono: '573000000000' },
          { id: '2', nit: '900314739-7', razon_social: 'Tendencias Futuristas S.A.S', nombre_comercial: 'La Media Naranja Montería', ciudad: 'Montería', telefono: '573000000000' },
          { id: '3', nit: '900050852-7', razon_social: 'Inversiones La Pantaleta S.A.S', nombre_comercial: 'El Palacio de la Pantaleta #3 Montería', ciudad: 'Montería', telefono: '573000000000' }
        ];
        setClientes(respaldo);
        setClienteSeleccionado('1');
      }
    }
    cargarClientes();
  }, []);

  const actualCliente = clientes.find(c => c.id === clienteSeleccionado);

  const getPrecio = (base: number) => {
    if (lista === 'L2') return base + deltaL2;
    if (lista === 'L4') return base + deltaL4;
    if (lista === 'L3') return Math.round((base * 1.7) / 100) * 100 - 100;
    return base;
  };

  const handleCantidadChange = (ref: string, val: number) => {
    setCantidades(prev => ({ ...prev, [ref]: Math.max(0, val) }));
  };

  const totalPrendas = Object.values(cantidades).reduce((a, b) => a + b, 0);
  const subtotalCOP = productos.reduce((acc, p) => acc + ((cantidades[p.referencia] || 0) * getPrecio(p.precio_L1_base)), 0);
  const comisionCOP = subtotalCOP * 0.06;

  // Guardar Pedido en PostgreSQL & Audit Log
  const guardarPedido = async () => {
    try {
      setGuardando(true);
      setMensaje('');
      const codigoOrder = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
      setUltimoCodigo(codigoOrder);

      await supabase.from('pedidos').insert([
        {
          tenant_id: 'EMP-0001',
          codigo_pedido: codigoOrder,
          cliente_id: clienteSeleccionado,
          vendedor_id: 'USR-0001',
          vendedor_nombre: 'Adrián Peña',
          lista_aplicada: lista,
          total_prendas: totalPrendas,
          subtotal_cop: subtotalCOP,
          comision_cop: comisionCOP,
          estado: 'CONFIRMADO'
        }
      ]);

      await supabase.from('audit_logs').insert([
        {
          tenant_id: 'EMP-0001',
          usuario_id: 'USR-0001',
          usuario_nombre: 'Adrián Peña',
          accion: 'CREAR_PEDIDO_B2B',
          entidad_afectada: 'PEDIDOS',
          entidad_id: codigoOrder,
          valor_nuevo: {
            cliente: actualCliente?.nombre_comercial,
            nit: actualCliente?.nit,
            total_prendas: totalPrendas,
            total_cop: subtotalCOP,
            comision_asesor: comisionCOP,
            lista_aplicada: lista,
            fecha: new Date().toISOString()
          }
        }
      ]);

      setMensaje(`🎉 ¡Pedido ${codigoOrder} Confirmado y Registrado en PostgreSQL & Audit Log!`);
    } catch (err) {
      setMensaje('❌ Error al registrar el pedido en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  // Exportar / Imprimir PDF
  const exportarPDF = () => {
    window.print();
  };

  // Enviar Notificación por WhatsApp
  const enviarWhatsApp = () => {
    const texto = `*PEQUIX ERP · COMPROBANTE DE PEDIDO FORMAL*%0A%0A` +
      `*Orden:* ${ultimoCodigo}%0A` +
      `*Cliente:* ${actualCliente?.nombre_comercial}%0A` +
      `*NIT:* ${actualCliente?.nit}%0A` +
      `*Asesor:* Adrián Peña (FJ Kids)%0A` +
      `*Lista Aplicada:* ${lista}%0A` +
      `*Total Prendas:* ${totalPrendas} unds%0A` +
      `*Total Pedido:* $ ${subtotalCOP.toLocaleString('es-CO')} COP%0A%0A` +
      `_Generado desde Pequix ERP SaaS (EMP-0001 / FJ Kids)_ 🚀`;

    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant FJ Kids */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              🟢 MÓDULO 1: PEDIDOS & EXPORTACIÓN
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Toma de Pedidos & Cierre B2B</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Asesor Comercial: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001 / V2)</strong> — Tenant: EMP-0001 (FJ Kids)
            </p>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '12px 18px', borderRadius: '12px', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Prendas:</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fbbf24' }}>{totalPrendas} unds</span>
          </div>
        </div>

        {/* Notificación de Éxito */}
        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* Selector CRM de Clientes */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px' }}>
          <label style={{ display: 'block', fontWeight: '800', fontSize: '12px', marginBottom: '8px', color: '#cbd5e1' }}>
            👤 Seleccionar Cliente del CRM (Holding Textil Montería):
          </label>
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
            style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fbbf24', fontWeight: 'bold', padding: '12px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_comercial} — NIT: {c.nit}
              </option>
            ))}
          </select>

          {actualCliente && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#1e293b', borderRadius: '10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>Razón Social: <strong style={{ color: '#ffffff' }}>{actualCliente.razon_social}</strong></span>
              <span>Ciudad: <strong style={{ color: '#10b981' }}>{actualCliente.ciudad}</strong></span>
            </div>
          )}
        </div>

        {/* Selector Tarifario Dinámico L1-L5 */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px' }}>
          <label style={{ display: 'block', fontWeight: '800', fontSize: '12px', marginBottom: '12px', color: '#cbd5e1' }}>
            🔄 Lista Tarifaria Aplicada al Pedido:
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
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>CANT. PRENDAS</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>UNITARIO ($ COP)</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>SUBTOTAL ($ COP)</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const u = getPrecio(p.precio_L1_base);
                const cant = cantidades[p.referencia] || 0;
                return (
                  <tr key={p.referencia} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '900', color: '#fbbf24' }}>{p.referencia}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{p.descripcion}</td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{p.curva}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <input
                        type="number"
                        value={cant}
                        onChange={(e) => handleCantidadChange(p.referencia, parseInt(e.target.value) || 0)}
                        style={{ width: '60px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#10b981', fontWeight: '900', textAlign: 'center', padding: '6px', borderRadius: '6px', outline: 'none' }}
                      />
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {visibilidad === 'SIN_VALORES' ? '🔒 Oculto' : `$ ${u.toLocaleString('es-CO')}`}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>
                      {visibilidad === 'CON_VALORES' ? `$ ${(cant * u).toLocaleString('es-CO')}` : '🔒 Oculto'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero & Acciones de Exportación */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>Total Calculado del Pedido:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981' }}>
              {visibilidad === 'CON_VALORES' ? `$ ${subtotalCOP.toLocaleString('es-CO')} COP` : '🔒 TOTAL CONFIDENCIAL'}
            </div>
            <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
              Comisión Asignada a Adrián Peña (6%): $ ${comisionCOP.toLocaleString('es-CO')} COP
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={guardarPedido}
              disabled={guardando}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '900',
                cursor: 'pointer',
                backgroundColor: '#10b981',
                color: '#022c22',
                fontSize: '12px'
              }}
            >
              {guardando ? '⏳ Guardando...' : '💾 Confirmar Pedido'}
            </button>

            <button
              onClick={exportarPDF}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid #38bdf8',
                fontWeight: '900',
                cursor: 'pointer',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '12px'
              }}
            >
              📄 Generar PDF
            </button>

            <button
              onClick={enviarWhatsApp}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '900',
                cursor: 'pointer',
                backgroundColor: '#22c55e',
                color: '#022c22',
                fontSize: '12px'
              }}
            >
              📲 Enviar WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
