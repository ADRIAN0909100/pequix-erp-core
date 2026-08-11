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
  mostrar_en_website: boolean;
  override_L2?: number | null;
  override_L4?: number | null;
}

interface Cliente {
  id: string;
  nit: string;
  razon_social: string;
  nombre_comercial: string;
  ciudad: string;
}

interface ConfigTenant {
  deltaL2: number;
  deltaL4: number;
  comisionPorcentaje: number;
  bodegaVerUnitario: boolean;
  bodegaVerSubtotal: boolean;
  bodegaVerTotal: boolean;
}

export default function Home() {
  const [pestana, setPestana] = useState<'PEDIDOS' | 'INVENTARIO' | 'CONFIGURACION'>('INVENTARIO');
  const [rolActivo, setRolActivo] = useState<'ADMIN' | 'BODEGA'>('ADMIN');
  const [lista, setLista] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L1');

  // Parámetros Autogestionables del Tenant
  const [config, setConfig] = useState<ConfigTenant>({
    deltaL2: 1000,
    deltaL4: -2000,
    comisionPorcentaje: 6.0,
    bodegaVerUnitario: true,
    bodegaVerSubtotal: false,
    bodegaVerTotal: false,
  });

  const [productos, setProductos] = useState<Producto[]>([
    { referencia: '745', descripcion: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', precio_L1_base: 59900, mostrar_en_website: true },
    { referencia: '8182', descripcion: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', precio_L1_base: 70900, mostrar_en_website: true },
    { referencia: '2552', descripcion: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', precio_L1_base: 43900, mostrar_en_website: true }
  ]);

  // Formulario de Nueva Referencia
  const [nuevaRef, setNuevaRef] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaCurva, setNuevaCurva] = useState('BEBÉS');
  const [nuevoPrecio, setNuevoPrecio] = useState(50000);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [cantidades, setCantidades] = useState<{ [key: string]: number }>({ '745': 25, '8182': 30, '2552': 14 });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    async function cargarDatos() {
      const { data: dataProds } = await supabase.from('productos').select('*');
      if (dataProds && dataProds.length > 0) setProductos(dataProds);

      const { data: dataClientes } = await supabase.from('clientes').select('*');
      if (dataClientes && dataClientes.length > 0) {
        setClientes(dataClientes);
        setClienteSeleccionado(dataClientes[0].id);
      } else {
        const respaldo = [
          { id: '1', nit: '901164484-3', razon_social: 'Comercializadora Palacio S.A.S', nombre_comercial: 'El Palacio de la Pantaleta #1 Montería', ciudad: 'Montería' },
          { id: '2', nit: '900314739-7', razon_social: 'Tendencias Futuristas S.A.S', nombre_comercial: 'La Media Naranja Montería', ciudad: 'Montería' }
        ];
        setClientes(respaldo);
        setClienteSeleccionado('1');
      }
    }
    cargarDatos();
  }, []);

  const actualCliente = clientes.find(c => c.id === clienteSeleccionado);

  const getPrecio = (p: Producto) => {
    if (lista === 'L2') return p.override_L2 ?? (p.precio_L1_base + config.deltaL2);
    if (lista === 'L4') return p.override_L4 ?? (p.precio_L1_base + config.deltaL4);
    if (lista === 'L3') return Math.round((p.precio_L1_base * 1.7) / 100) * 100 - 100;
    return p.precio_L1_base;
  };

  // Crear Nueva Referencia Textil
  const agregarProducto = async () => {
    if (!nuevaRef || !nuevaDesc) {
      setMensaje('⚠️ Por favor completa la Referencia y la Descripción.');
      return;
    }

    const prodNuevo: Producto = {
      referencia: nuevaRef,
      descripcion: nuevaDesc.toUpperCase(),
      curva: nuevaCurva,
      precio_L1_base: nuevoPrecio,
      mostrar_en_website: true
    };

    setProductos(prev => [...prev, prodNuevo]);

    // Persistir en Supabase
    await supabase.from('productos').insert([{
      tenant_id: 'EMP-0001',
      referencia: nuevaRef,
      descripcion: nuevaDesc.toUpperCase(),
      curva: nuevaCurva,
      precio_L1_base: nuevoPrecio,
      mostrar_en_website: true
    }]);

    // Registrar en Audit Log
    await supabase.from('audit_logs').insert([{
      tenant_id: 'EMP-0001',
      usuario_id: 'USR-0001',
      usuario_nombre: 'Adrián Peña',
      accion: 'CREAR_PRODUCTO_TEXTIL',
      entidad_afectada: 'PRODUCTOS',
      entidad_id: nuevaRef,
      valor_nuevo: prodNuevo
    }]);

    setMensaje(`✨ ¡Referencia ${nuevaRef} (${nuevaDesc.toUpperCase()}) creada exitosamente!`);
    setNuevaRef('');
    setNuevaDesc('');
  };

  // Toggle Switch Website B2B/B2C
  const toggleWebsite = async (ref: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    setProductos(prev => prev.map(p => p.referencia === ref ? { ...p, mostrar_en_website: nuevoEstado } : p));

    await supabase.from('audit_logs').insert([{
      tenant_id: 'EMP-0001',
      usuario_id: 'USR-0001',
      usuario_nombre: 'Adrián Peña',
      accion: 'TOGGLE_VISIBILIDAD_WEB',
      entidad_afectada: 'PRODUCTOS',
      entidad_id: ref,
      valor_nuevo: { referencia: ref, visible_web: nuevoEstado, fecha: new Date().toISOString() }
    }]);

    setMensaje(`🌐 Visibilidad Web de REF ${ref} actualizada a: ${nuevoEstado ? 'Visible' : 'Oculto'}`);
  };

  const totalPrendas = Object.values(cantidades).reduce((a, b) => a + b, 0);
  const subtotalCOP = productos.reduce((acc, p) => acc + ((cantidades[p.referencia] || 0) * getPrecio(p)), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant FJ Kids */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              🟢 PEQUIX ERP CORE · INVENTARIO MATRIZ
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Inventario Textil Infantil & Curvas</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Usuario: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001 / Admin)</strong> — EMP-0001 (FJ Kids)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setPestana('INVENTARIO')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'INVENTARIO' ? '#10b981' : '#1e293b', color: pestana === 'INVENTARIO' ? '#022c22' : '#ffffff' }}>
              👕 Inventario
            </button>
            <button onClick={() => setPestana('PEDIDOS')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'PEDIDOS' ? '#38bdf8' : '#1e293b', color: pestana === 'PEDIDOS' ? '#022c22' : '#ffffff' }}>
              🛒 Pedidos B2B
            </button>
            <button onClick={() => setPestana('CONFIGURACION')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: pestana === 'CONFIGURACION' ? '#fbbf24' : '#1e293b', color: pestana === 'CONFIGURACION' ? '#022c22' : '#ffffff' }}>
              ⚙️ Config
            </button>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA: INVENTARIO TEXTIL AVANZADO */}
        {pestana === 'INVENTARIO' && (
          <>
            {/* Formulario de Creación de Prendas */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981', margin: 0 }}>
                ➕ Crear Nueva Referencia Textil Infantil
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Referencia (REF):</label>
                  <input
                    type="text"
                    placeholder="Ej: 9021"
                    value={nuevaRef}
                    onChange={(e) => setNuevaRef(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fbbf24', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Descripción de la Prenda:</label>
                  <input
                    type="text"
                    placeholder="Ej: OVEROL JEAN INFANTIL"
                    value={nuevaDesc}
                    onChange={(e) => setNuevaDesc(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Curva de Tallas:</label>
                  <select
                    value={nuevaCurva}
                    onChange={(e) => setNuevaCurva(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  >
                    <option value="BEBÉS">BEBÉS (0-24M)</option>
                    <option value="MESES">MESES (2-6T)</option>
                    <option value="JUNIOR">JUNIOR (8-16)</option>
                    <option value="INFANTIL">INFANTIL GLOBAL</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Precio L1 Mayorista Base ($ COP):</label>
                  <input
                    type="number"
                    step="1000"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#10b981', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>
              </div>

              <button
                onClick={agregarProducto}
                style={{ padding: '12px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}
              >
                💾 Guardar Referencia en PostgreSQL
              </button>
            </div>

            {/* Tabla Matriz de Inventario */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fbbf24', margin: '0 0 15px 0' }}>
                📦 Catálogo Matriz Activo ({productos.length} Referencias)
              </h3>

              <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '10px 8px' }}>REF</th>
                    <th style={{ padding: '10px 8px' }}>DESCRIPCIÓN</th>
                    <th style={{ padding: '10px 8px' }}>CURVA</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>MOSTRAR EN WEBSITE</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>L1 MAYORISTA ($ COP)</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
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
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>
                        $ {p.precio_L1_base.toLocaleString('es-CO')}
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
