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

interface FilaPedido {
  id: number;
  referencia: string;
  descripcion: string;
  curva: 'MESES' | 'BEBÉS' | 'JUNIOR' | 'JUVENIL';
  tallas: { [key: string]: number };
  precioUnitario: number;
  colores: { nombre: string; bg: string; text: string }[];
  imagenUrl?: string;
}

export default function Home() {
  const [pestana, setPestana] = useState<'NUEVO_PEDIDO' | 'DASHBOARD' | 'PDF'>('NUEVO_PEDIDO');
  const [listaSeleccionada, setListaSeleccionada] = useState<'L1' | 'L2' | 'L3' | 'L4' | 'L5'>('L1');
  const [mensaje, setMensaje] = useState('');
  const [modalFoto, setModalFoto] = useState<FilaPedido | null>(null);

  // Formulario Pedido
  const [clienteNombre, setClienteNombre] = useState('');
  const [nitCliente, setNitCliente] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [vendedor, setVendedor] = useState('Adrián Peña (USR-0001)');

  // Filas del Pedido B2B
  const [filas, setFilas] = useState<FilaPedido[]>([
    {
      id: 1,
      referencia: '2553',
      descripcion: 'CONJUNTO JUNIOR BASICO T16',
      curva: 'JUNIOR',
      tallas: { '4': 2, '6': 3, '8': 4, '10': 2, '12': 1, '14': 0, '16': 0 },
      precioUnitario: 43900,
      colores: [
        { nombre: 'ROJO', bg: '#dc2626', text: '#ffffff' },
        { nombre: 'AZUL CLARO', bg: '#38bdf8', text: '#0f172a' },
        { nombre: 'GRIS JASPEADO', bg: '#e2e8f0', text: '#0f172a' }
      ],
      imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80'
    },
    {
      id: 2,
      referencia: '745',
      descripcion: 'CONJUNTO BEBE DORMILON',
      curva: 'BEBÉS',
      tallas: { '2': 4, '3': 5, '4': 6, '5': 3, '6': 2 },
      precioUnitario: 59900,
      colores: [
        { nombre: 'AMARILLO', bg: '#facc15', text: '#451a03' },
        { nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }
      ],
      imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&q=80'
    }
  ]);

  const cambiarTalla = (filaId: number, tallaKey: string, valor: number) => {
    setFilas(prev =>
      prev.map(f => {
        if (f.id === filaId) {
          return {
            ...f,
            tallas: { ...f.tallas, [tallaKey]: Math.max(0, valor) }
          };
        }
        return f;
      })
    );
  };

  const calcularTotalPrendasFila = (f: FilaPedido) => {
    return Object.values(f.tallas).reduce((a, b) => a + (b || 0), 0);
  };

  const calcularTotalFilas = () => {
    return filas.reduce((acc, f) => acc + (calcularTotalPrendasFila(f) * f.precioUnitario), 0);
  };

  const calcularTotalPrendasGeneral = () => {
    return filas.reduce((acc, f) => acc + calcularTotalPrendasFila(f), 0);
  };

  // Guardar Pedido en PostgreSQL
  const guardarPedido = async () => {
    const totalCOP = calcularTotalFilas();
    const prendas = calcularTotalPrendasGeneral();
    const codigo = `PED-${Date.now()}`;

    await supabase.from('pedidos').insert([{
      tenant_id: 'EMP-0001',
      codigo_pedido: codigo,
      vendedor_nombre: vendedor,
      lista_aplicada: listaSeleccionada,
      total_prendas: prendas,
      subtotal_cop: totalCOP,
      estado: 'GUARDADO_B2B'
    }]);

    // Registrar en Audit Log
    await supabase.from('audit_logs').insert([{
      tenant_id: 'EMP-0001',
      usuario_id: 'USR-0001',
      usuario_nombre: 'Adrián Peña',
      accion: 'CREAR_PEDIDO_B2B_MATRIZ',
      entidad_afectada: 'PEDIDOS',
      entidad_id: codigo,
      valor_nuevo: { cliente: clienteNombre, total_cop: totalCOP, prendas: prendas }
    }]);

    setMensaje(`🎉 ¡Pedido ${codigo} guardado exitosamente por $ ${totalCOP.toLocaleString('es-CO')} COP (${prendas} prendas)!`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '15px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Header Superior con Navegación de Pestañas */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '15px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              🟢 PEQUIX ERP CORE SAAS · FJ KIDS S.A.S
            </span>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: '4px 0 0 0', color: '#ffffff' }}>Módulo B2B Toma de Pedidos por Matriz de Tallas</h1>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPestana('NUEVO_PEDIDO')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'NUEVO_PEDIDO' ? '#10b981' : '#1e293b', color: pestana === 'NUEVO_PEDIDO' ? '#022c22' : '#ffffff' }}>
              📋 Nuevo Pedido
            </button>
            <button onClick={() => setPestana('DASHBOARD')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'DASHBOARD' ? '#fbbf24' : '#1e293b', color: pestana === 'DASHBOARD' ? '#451a03' : '#ffffff' }}>
              📊 Dashboard
            </button>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA PRINCIPAL: NUEVO PEDIDO MATRIZ */}
        {pestana === 'NUEVO_PEDIDO' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* 1. Botones de Listas de Precios y Guardado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <button onClick={() => setListaSeleccionada('L1')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: listaSeleccionada === 'L1' ? '#1e3a8a' : '#0f172a', color: '#38bdf8', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                L1 · MAYORISTA
              </button>
              <button onClick={() => setListaSeleccionada('L2')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: listaSeleccionada === 'L2' ? '#1e3a8a' : '#0f172a', color: '#cbd5e1', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                L2 · DISTRIBUIDOR
              </button>
              <button onClick={() => setListaSeleccionada('L3')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: listaSeleccionada === 'L3' ? '#1e3a8a' : '#0f172a', color: '#cbd5e1', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                L3 · CLIENTE
              </button>
              <button onClick={() => setListaSeleccionada('L4')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: listaSeleccionada === 'L4' ? '#1e3a8a' : '#0f172a', color: '#cbd5e1', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                L4 · CLIENTE FINAL
              </button>
              <button onClick={guardarPedido} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                💾 GUARDAR PEDIDO
              </button>
            </div>

            {/* 2. Ficha Encabezado Institucional FJ KIDS S.A.S */}
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '2px solid #0f172a', borderRadius: '12px', padding: '15px', display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '15px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', paddingRight: '10px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, color: '#0f172a' }}>FJ KIDS S.A.S</h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#475569', fontWeight: 'bold' }}>
                  NIT. 900.410.656-5<br />
                  Calle 71 #52a-77 · Barrio Santa María<br />
                  Tel: 3226930798 / 3128920808<br />
                  ITAGÜÍ - COLOMBIA
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>SEÑOR(ES):</label>
                  <input placeholder="Buscar cliente..." value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>NIT o C.C.:</label>
                  <input placeholder="NIT o Cédula..." value={nitCliente} onChange={e => setNitCliente(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>CIUDAD / MUNICIPIO:</label>
                  <input placeholder="Ej. Montería" value={ciudad} onChange={e => setCiudad(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>FORMA DE PAGO:</label>
                  <select style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                    <option>CONTADO / TRANSFERENCIA</option>
                    <option>CREDITO 30 DIAS</option>
                  </select>
                </div>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>PEDIDO N°</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: '4px 0 0 0', color: '#dc2626' }}>PED-2026-8890</h3>
                <span style={{ fontSize: '9px', color: '#059669', fontWeight: 'bold' }}>09:05:36 p. m. (Bogotá)</span>
              </div>
            </div>

            {/* 3. Barra de Búsqueda y Escáner */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '10px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>🔦</span>
              <input
                placeholder="Toca aquí y escanea o escribe la referencia..."
                style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
              />
            </div>

            {/* 4. Matriz de Pedidos por Curvas y Tallas */}
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '2px solid #0f172a', borderRadius: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                <thead>
                  {/* Fila Encabezados Curvas */}
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontWeight: '900' }}>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>N°</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>REF</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>DESCRIPCIÓN</th>
                    
                    {/* Columnas Tallas Dinámicas */}
                    <th style={{ padding: '4px', borderRight: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}>0-3 / 2</th>
                    <th style={{ padding: '4px', borderRight: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}>3-6 / 3</th>
                    <th style={{ padding: '4px', borderRight: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}>6-9 / 4</th>
                    <th style={{ padding: '4px', borderRight: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}>9-12 / 5</th>
                    <th style={{ padding: '4px', borderRight: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}>6 / 10</th>
                    <th style={{ padding: '4px', borderRight: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}>12</th>
                    <th style={{ padding: '4px', borderRight: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}>14 / 16</th>

                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1', backgroundColor: '#fef3c7' }}>CANT. TOTAL</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>PRECIO</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>VALOR TOTAL</th>
                    <th style={{ padding: '8px' }}>COLORES / NOTA</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, idx) => {
                    const cantFila = calcularTotalPrendasFila(f);
                    const totalValorFila = cantFila * f.precioUnitario;

                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                          N°{idx + 1}<br />
                          {/* Botón Cámara 📷 Flotante */}
                          <button
                            onClick={() => setModalFoto(f)}
                            title="Ver Foto de la Referencia"
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', marginTop: '2px' }}
                          >
                            📷
                          </button>
                        </td>
                        <td style={{ padding: '8px', fontWeight: '900', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>
                          {f.referencia}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>
                          {f.descripcion}
                          <span style={{ display: 'block', fontSize: '9px', color: '#059669' }}>CURVA: {f.curva}</span>
                        </td>

                        {/* Entradas de Cantidad por Talla */}
                        {['4', '6', '8', '10', '12', '14', '16'].map(tallaKey => (
                          <td key={tallaKey} style={{ borderRight: '1px solid #e2e8f0', padding: '2px' }}>
                            <input
                              type="number"
                              value={f.tallas[tallaKey] || 0}
                              onChange={e => cambiarTalla(f.id, tallaKey, parseInt(e.target.value) || 0)}
                              style={{ width: '32px', textAlign: 'center', padding: '4px 2px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}
                            />
                          </td>
                        ))}

                        {/* Cantidad Total de la Fila */}
                        <td style={{ padding: '8px', fontWeight: '900', borderRight: '1px solid #cbd5e1', backgroundColor: '#fef3c7', fontSize: '12px' }}>
                          {cantFila}
                        </td>

                        {/* Precio Unitario L1 */}
                        <td style={{ padding: '8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                          $ {f.precioUnitario.toLocaleString('es-CO')}
                        </td>

                        {/* Valor Total Fila */}
                        <td style={{ padding: '8px', fontWeight: '900', borderRight: '1px solid #cbd5e1', color: '#059669', fontSize: '12px' }}>
                          $ {totalValorFila.toLocaleString('es-CO')}
                        </td>

                        {/* Colores Ilustrativos */}
                        <td style={{ padding: '8px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {f.colores.map((c, cIdx) => (
                              <span key={cIdx} style={{ backgroundColor: c.bg, color: c.text, padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: '900', border: '1px solid #cbd5e1' }}>
                                {c.nombre}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen Financiero Pie de Página */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Prendas a Despachar:</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8', margin: '2px 0 0 0' }}>
                  {calcularTotalPrendasGeneral()} Unidades
                </h3>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor Total del Pedido ($ COP):</span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', margin: '2px 0 0 0' }}>
                  $ {calcularTotalFilas().toLocaleString('es-CO')} COP
                </h2>
              </div>
            </div>

          </div>
        )}

        {/* MODAL FLOTANTE DE FOTO DE LA REFERENCIA (BOTÓN CÁMARA 📷) */}
        {modalFoto && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '15px' }}>
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '16px', padding: '20px', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              
              <button
                onClick={() => setModalFoto(null)}
                style={{ position: 'absolute', top: '12px', right: '12px', border: 'none', background: '#cbd5e1', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ backgroundColor: '#1e3a8a', color: '#38bdf8', fontSize: '10px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px' }}>
                  REF: {modalFoto.referencia}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', margin: '6px 0 0 0' }}>{modalFoto.descripcion}</h3>
              </div>

              {/* Imagen Ilustrativa de la Prenda */}
              <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                <img src={modalFoto.imagenUrl} alt={modalFoto.descripcion} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Colores Disponibles */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>COLORES DISPONIBLES EN BODEGA:</span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {modalFoto.colores.map((c, idx) => (
                    <span key={idx} style={{ backgroundColor: c.bg, color: c.text, padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '900', border: '1px solid #cbd5e1' }}>
                      {c.nombre}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setModalFoto(null)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' }}
              >
                ✏️ Ver / Editar Ficha Completa
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
