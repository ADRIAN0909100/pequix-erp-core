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
}

export default function Home() {
  const [rolActivo, setRolActivo] = useState<'ADMIN' | 'BODEGA'>('ADMIN');
  const [lista, setLista] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L1');
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
          { id: '1', nit: '901164484-3', razon_social: 'Comercializadora Palacio S.A.S', nombre_comercial: 'El Palacio de la Pantaleta #1 Montería', ciudad: 'Montería' },
          { id: '2', nit: '900314739-7', razon_social: 'Tendencias Futuristas S.A.S', nombre_comercial: 'La Media Naranja Montería', ciudad: 'Montería' },
          { id: '3', nit: '900050852-7', razon_social: 'Inversiones La Pantaleta S.A.S', nombre_comercial: 'El Palacio de la Pantaleta #3 Montería', ciudad: 'Montería' }
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

  // Cambiar Rol con Registro de Auditoría
  const cambiarRol = async (nuevoRol: 'ADMIN' | 'BODEGA') => {
    setRolActivo(nuevoRol);
    await supabase.from('audit_logs').insert([
      {
        tenant_id: 'EMP-0001',
        usuario_id: nuevoRol === 'ADMIN' ? 'USR-0001' : 'USR-0002',
        usuario_nombre: nuevoRol === 'ADMIN' ? 'Adrián Peña' : 'Luz Deisy (Bodega)',
        accion: 'CAMBIO_ROL_VISTA',
        entidad_afectada: 'PERMISOS',
        entidad_id: nuevoRol,
        valor_nuevo: { rol: nuevoRol, fecha: new Date().toISOString() }
      }
    ]);
  };

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
          vendedor_id: rolActivo === 'ADMIN' ? 'USR-0001' : 'USR-0002',
          vendedor_nombre: rolActivo === 'ADMIN' ? 'Adrián Peña' : 'Luz Deisy (Bodega)',
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
          usuario_id: rolActivo === 'ADMIN' ? 'USR-0001' : 'USR-0002',
          usuario_nombre: rolActivo === 'ADMIN' ? 'Adrián Peña' : 'Luz Deisy (Bodega)',
          accion: 'CREAR_PEDIDO_B2B',
          entidad_afectada: 'PEDIDOS',
          entidad_id: codigoOrder,
          valor_nuevo: {
            cliente: actualCliente?.nombre_comercial,
            nit: actualCliente?.nit,
            total_prendas: totalPrendas,
            total_cop: rolActivo === 'ADMIN' ? subtotalCOP : 'OCULTO_BODEGA',
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

  // Generador PDF Nombrado Dinámicamente
  const descargarPDFReal = () => {
    const nombreClienteLimpio = (actualCliente?.nombre_comercial || 'Cliente')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_');
    
    const nombreArchivoPDF = `${ultimoCodigo}_${nombreClienteLimpio}`;

    const ventana = window.open('', '_blank');
    if (!ventana) return;

    const filasHtml = productos.map(p => {
      const u = getPrecio(p.precio_L1_base);
      const cant = cantidades[p.referencia] || 0;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${p.referencia}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.descripcion}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.curva}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${cant} unds</td>
          ${rolActivo === 'ADMIN' ? `
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$ ${u.toLocaleString('es-CO')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #10b981;">$ ${(cant * u).toLocaleString('es-CO')}</td>
          ` : `
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #94a3b8;">🔒 Oculto</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #94a3b8;">🔒 Oculto</td>
          `}
        </tr>
      `;
    }).join('');

    const htmlCompleto = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${nombreArchivoPDF}</title>
        <style>
          @page { size: auto; margin: 15mm; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 12px; color: #64748b; }
          .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
          th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 10px 8px; }
          .total-box { text-align: right; font-size: 18px; font-weight: bold; color: #10b981; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">PEQUIX ERP · COMPROBANTE DE PEDIDO FORMAL</div>
            <div class="subtitle">Tenant: EMP-0001 (FJ Kids) — Usuario: ${rolActivo === 'ADMIN' ? 'Adrián Peña' : 'Bodega Despacho'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: bold; color: #d97706;">${ultimoCodigo}</div>
            <div class="subtitle">${new Date().toLocaleDateString('es-CO')}</div>
          </div>
        </div>

        <div class="info-box">
          <strong>Sucursal / Cliente:</strong> ${actualCliente?.nombre_comercial}<br/>
          <strong>Razón Social:</strong> ${actualCliente?.razon_social}<br/>
          <strong>NIT:</strong> ${actualCliente?.nit}<br/>
          <strong>Lista Aplicada:</strong> ${lista}
        </div>

        <table>
          <thead>
            <tr>
              <th>REF</th>
              <th>DESCRIPCIÓN</th>
              <th>CURVA</th>
              <th style="text-align: center;">CANTIDAD</th>
              <th style="text-align: right;">UNITARIO ($ COP)</th>
              <th style="text-align: right;">SUBTOTAL ($ COP)</th>
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
          </tbody>
        </table>

        <div class="total-box">
          TOTAL PRENDAS: ${totalPrendas} unds<br/>
          ${rolActivo === 'ADMIN' ? `TOTAL PEDIDO: $ ${subtotalCOP.toLocaleString('es-CO')} COP` : 'TOTAL PEDIDO: 🔒 CONFIDENCIAL BODEGA'}
        </div>

        <div class="footer">
          Generado automáticamente por Pequix ERP SaaS · Medellín, Colombia
        </div>

        <script>
          document.title = "${nombreArchivoPDF}";
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    ventana.document.write(htmlCompleto);
    ventana.document.close();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant & Selector de Perfil/Rol */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
                🟢 PEQUIX ERP CORE · MÓDULO ROLES & PERMISOS
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '4px 0 0 0', color: '#ffffff' }}>Control de Accesos & Despacho Ciego</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Usuario Activo: <strong style={{ color: '#fbbf24' }}>{rolActivo === 'ADMIN' ? 'Adrián Peña (USR-0001 / Admin)' : 'Luz Deisy (USR-0002 / Bodega)'}</strong> — EMP-0001 (FJ Kids)
            </p>
          </div>

          {/* Switch de Rol en Vivo */}
          <div style={{ backgroundColor: '#1e293b', padding: '8px', borderRadius: '12px', display: 'flex', gap: '6px' }}>
            <button
              onClick={() => cambiarRol('ADMIN')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '900',
                fontSize: '11px',
                cursor: 'pointer',
                backgroundColor: rolActivo === 'ADMIN' ? '#10b981' : 'transparent',
                color: rolActivo === 'ADMIN' ? '#022c22' : '#94a3b8'
              }}
            >
              👑 Admin / Vendedor
            </button>
            <button
              onClick={() => cambiarRol('BODEGA')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '900',
                fontSize: '11px',
                cursor: 'pointer',
                backgroundColor: rolActivo === 'BODEGA' ? '#f59e0b' : 'transparent',
                color: rolActivo === 'BODEGA' ? '#451a03' : '#94a3b8'
              }}
            >
              📦 Bodega (Vista Ciega)
            </button>
          </div>
        </div>

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

        {/* Tabla Matriz de Productos con Permisos Granulares */}
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
                      {rolActivo === 'ADMIN' ? `$ ${u.toLocaleString('es-CO')}` : '🔒 Oculto (Bodega)'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', color: rolActivo === 'ADMIN' ? '#10b981' : '#94a3b8' }}>
                      {rolActivo === 'ADMIN' ? `$ ${(cant * u).toLocaleString('es-CO')}` : '🔒 Oculto (Bodega)'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero Dinámico según el Rol */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>Total Calculado del Pedido:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: rolActivo === 'ADMIN' ? '#10b981' : '#f59e0b' }}>
              {rolActivo === 'ADMIN' ? `$ ${subtotalCOP.toLocaleString('es-CO')} COP` : '🔒 VISTA CIEGA DE BODEGA'}
            </div>
            {rolActivo === 'ADMIN' ? (
              <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                Comisión Asignada a Adrián Peña (6%): $ ${comisionCOP.toLocaleString('es-CO')} COP
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                Modo Alistamiento de Despacho: {totalPrendas} prendas por empacar.
              </span>
            )}
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
              onClick={descargarPDFReal}
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
              📄 Generar PDF Nombrado
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
