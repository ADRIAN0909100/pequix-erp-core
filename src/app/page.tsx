'use client';
import React, { useState, useEffect, useRef } from 'react';

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

// Base Geográfica Colombia & Internacional
const geoColombia: { [key: string]: string[] } = {
  'ANTIOQUIA': ['ITAGÜÍ', 'MEDELLÍN', 'BELLO', 'ENVIGADO', 'SABANETA', 'RIONEGRO'],
  'CÓRDOBA': ['MONTERÍA', 'CERETÉ', 'SAHAGÚN', 'LORICA', 'PLANETA RICA'],
  'SUCRE': ['SINCELEJO', 'COROZAL', 'SAN MARCOS'],
  'BOLÍVAR': ['CARTAGENA', 'MAGANGUÉ', 'TURBACO'],
  'ATLÁNTICO': ['BARRANQUILLA', 'SOLEDAD', 'PUERTO COLOMBIA'],
  'BOGOTÁ D.C.': ['BOGOTÁ D.C.'],
  'VALLE DEL CAUCA': ['CALI', 'PALMIRA', 'BUENAVENTURA'],
  'INTERNACIONAL': ['MIAMI (EE.UU.)', 'PANAMÁ (PA)', 'QUITO (EC)']
};

interface ConfigPreciosTenant {
  deltaL2: number;
  margenL3Porcentaje: number;
  deltaL4MED: number;
}

interface FilaItemPedido {
  num: number;
  referencia: string;
  descripcion: string;
  curva: 'MESES' | 'BEBÉS' | 'JUNIOR' | 'JUVENIL';
  tallasMap: { [key: string]: number };
  preciosPorLista: { L1: number; L2: number; L3: number; L4MED: number };
  colores: { nombre: string; bg: string; text: string }[];
  imagenUrl: string;
}

interface PedidoDespacho {
  id: string;
  codigoPedido: string;
  cliente: string;
  nit: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  prendasTotales: number;
  transportadora: string;
  guiaTracking: string;
  estadoDespacho: 'PENDIENTE' | 'EN_EMPAQUE' | 'TIQUETADO' | 'EN_TRANSITO';
}

export default function Home() {
  // PESTAÑA NAVEGABLE MAESTRA SIN RUPTURAS
  const [moduloActivo, setModuloActivo] = useState<'PEDIDOS_B2B' | 'REGLAS_PRECIOS' | 'DESPACHOS_BODEGA' | 'DASHBOARD_AUDIT' | 'INVENTARIO'>('PEDIDOS_B2B');
  
  const [listaActiva, setListaActiva] = useState<'L1' | 'L2' | 'L3' | 'L4MED'>('L1');
  const [mostrarTotalGeneral, setMostrarTotalGeneral] = useState(true);
  const [mensaje, setMensaje] = useState('');
  
  // Modales Flotantes
  const [modalFoto, setModalFoto] = useState<FilaItemPedido | null>(null);
  const [tiqueteImpresion, setTiqueteImpresion] = useState<PedidoDespacho | null>(null);

  // Parámetros Globales Tenant
  const [configPrecios, setConfigPrecios] = useState<ConfigPreciosTenant>({
    deltaL2: 1000,
    margenL3Porcentaje: 70,
    deltaL4MED: -2000
  });

  // Datos Encabezado Pedido (MAYÚSCULAS)
  const [clienteNombre, setClienteNombre] = useState('MANUELA MENDEZ ZAPATA');
  const [nitCliente, setNitCliente] = useState('1000207034-1');
  const [almacen, setAlmacen] = useState('SWEET BOYS');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('3005381816');
  const [direccion, setDireccion] = useState('CL 49 49 22');
  
  const [deptoSeleccionado, setDeptoSeleccionado] = useState('ANTIOQUIA');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('ITAGÜÍ');

  const [formaPago, setFormaPago] = useState('30 DÍAS');
  const [descuento, setDescuento] = useState('10%');
  const [vendedor, setVendedor] = useState('ALEJA QUIÑONES');

  const [vigenciaInicio, setVigenciaInicio] = useState('2026-08-26');
  const [vigenciaFin, setVigenciaFin] = useState('2026-08-29');
  const [corteFacturacion, setCorteFacturacion] = useState('2026-08-20');
  const [notasGenerales, setNotasGenerales] = useState('50/ 50');

  // Filas del Pedido B2B
  const [filas, setFilas] = useState<FilaItemPedido[]>([
    { num: 1, referencia: '6179', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 3, '12': 3, '14': 3 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4MED: 54900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { num: 2, referencia: '6180', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 4, '12': 4, '14': 4 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4MED: 54900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80' },
    { num: 3, referencia: '6181', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 4, '12': 4, '14': 4 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4MED: 54900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80' }
  ]);

  // Lista Pedidos Despacho
  const [pedidosDespacho, setPedidosDespacho] = useState<PedidoDespacho[]>([
    {
      id: 'PED-0363',
      codigoPedido: 'PED-0363',
      cliente: 'MANUELA MENDEZ ZAPATA',
      nit: '1000207034-1',
      direccion: 'CL 49 49 22',
      ciudad: 'ITAGÜÍ, ANTIOQUIA',
      telefono: '3005381816',
      prendasTotales: 188,
      transportadora: 'ENVÍA',
      guiaTracking: 'ENV-99887766-COP',
      estadoDespacho: 'EN_EMPAQUE'
    }
  ]);

  const categoriasMaster = [
    'BERMUDA JUNIOR', 'BERMUDA BEBE', 'CONJUNTO BEBE DORMILON', 'CONJUNTO BEBE PREMIUM',
    'CONJUNTO JUNIOR BASICO T16', 'JEAN JUNIOR', 'CAMISETA JUNIOR CR'
  ];

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const cambiarTallaValor = (idx: number, keyTalla: string, val: number) => {
    setFilas(prev => prev.map((f, i) => i === idx ? { ...f, tallasMap: { ...f.tallasMap, [keyTalla]: Math.max(0, val) } } : f));
  };

  const cambiarCurvaFila = (idx: number, nuevaCurva: 'MESES' | 'BEBÉS' | 'JUNIOR' | 'JUVENIL') => {
    setFilas(prev => prev.map((f, i) => i === idx ? { ...f, curva: nuevaCurva, tallasMap: {} } : f));
  };

  const totalPrendasFila = (f: FilaItemPedido) => Object.values(f.tallasMap).reduce((a, b) => a + (b || 0), 0);
  const totalValorFila = (f: FilaItemPedido) => totalPrendasFila(f) * f.preciosPorLista[listaActiva];

  const totalPrendasGeneral = () => filas.reduce((acc, f) => acc + totalPrendasFila(f), 0);
  const totalValorGeneral = () => filas.reduce((acc, f) => acc + totalValorFila(f), 0);

  const categoriasEnPedido = Array.from(new Set(filas.map(f => f.descripcion)));

  const manejarKeyDownExcel = (e: React.KeyboardEvent, filaIdx: number, colIdx: number, valActual: number) => {
    const tallasLista = mapaTallasCurva[filas[filaIdx].curva].filter(t => t !== '');
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (colIdx < tallasLista.length - 1) {
        const siguienteTallaKey = tallasLista[colIdx + 1];
        cambiarTallaValor(filaIdx, siguienteTallaKey, valActual || 2);
        const nextInputKey = `${filaIdx}-${colIdx + 1}`;
        setTimeout(() => {
          const el = inputRefs.current[nextInputKey];
          if (el) { el.focus(); el.select(); }
        }, 50);
      } else if (filaIdx < filas.length - 1) {
        const primerTallaSigFila = mapaTallasCurva[filas[filaIdx + 1].curva][0];
        cambiarTallaValor(filaIdx + 1, primerTallaSigFila, valActual || 2);
        const nextRowKey = `${filaIdx + 1}-0`;
        setTimeout(() => {
          const el = inputRefs.current[nextRowKey];
          if (el) { el.focus(); el.select(); }
        }, 50);
      }
    }
  };

  const columnasTallasMaster = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7'];

  const mapaTallasCurva = {
    MESES: ['0-3', '3-6', '6-9', '9-12', '', '', ''],
    BEBÉS: ['2', '3', '4', '5', '6', '', ''],
    JUNIOR: ['4', '6', '8', '10', '12', '14', '16'],
    JUVENIL: ['18', '20', '22', '24', '', '', '']
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '15px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1350px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* BARRA NAVEGABLE UNIFICADA PEQUIX ERP CORE */}
        <div className="no-print" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '15px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              🟢 PEQUIX ERP CORE SAAS · EMP-0001 (FJ KIDS S.A.S)
            </span>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: '4px 0 0 0', color: '#ffffff' }}>Plataforma Integral Unificada</h1>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setModuloActivo('PEDIDOS_B2B')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: moduloActivo === 'PEDIDOS_B2B' ? '#10b981' : '#1e293b', color: moduloActivo === 'PEDIDOS_B2B' ? '#022c22' : '#ffffff' }}>
              📋 Pedidos B2B
            </button>
            <button onClick={() => setModuloActivo('REGLAS_PRECIOS')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: moduloActivo === 'REGLAS_PRECIOS' ? '#38bdf8' : '#1e293b', color: moduloActivo === 'REGLAS_PRECIOS' ? '#0f172a' : '#ffffff' }}>
              ⚙️ Precios L1-L4
            </button>
            <button onClick={() => setModuloActivo('DESPACHOS_BODEGA')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: moduloActivo === 'DESPACHOS_BODEGA' ? '#a855f7' : '#1e293b', color: '#ffffff' }}>
              🚚 Bodega & Guías
            </button>
            <button onClick={() => setModuloActivo('DASHBOARD_AUDIT')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: moduloActivo === 'DASHBOARD_AUDIT' ? '#fbbf24' : '#1e293b', color: moduloActivo === 'DASHBOARD_AUDIT' ? '#451a03' : '#ffffff' }}>
              📊 Dashboard & Audit
            </button>

            {/* SELECTOR PRIVADO DE LISTAS L1-L4MED */}
            {moduloActivo === 'PEDIDOS_B2B' && (
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                {(['L1', 'L2', 'L3', 'L4MED'] as const).map(l => (
                  <button key={l} onClick={() => setListaActiva(l)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', fontWeight: '900', fontSize: '10px', cursor: 'pointer', backgroundColor: listaActiva === l ? '#38bdf8' : 'transparent', color: listaActiva === l ? '#0f172a' : '#cbd5e1' }}>
                    {l === 'L4MED' ? 'L4 MED' : l}
                  </button>
                ))}
              </div>
            )}

            {moduloActivo === 'PEDIDOS_B2B' && (
              <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                🖨️ PDF Carta
              </button>
            )}
          </div>
        </div>

        {mensaje && (
          <div className="no-print" style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* MÓDULO 1: PEDIDOS B2B FICHA CARTA */}
        {moduloActivo === 'PEDIDOS_B2B' && (
          <div id="hoja-pedido-oficial" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '10px', borderRadius: '0px', border: 'none', boxSizing: 'border-box', maxWidth: '794px', margin: '0 auto', width: '100%' }}>
            
            {/* ENCABEZADO INSTITUCIONAL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 2.5fr 1.4fr', border: '2px solid #000000', marginBottom: '-2px', boxSizing: 'border-box' }}>
              <div style={{ padding: '8px', borderRight: '2px solid #000000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: '#dc2626' }}>fj kids</h2>
              </div>
              <div style={{ padding: '8px', textAlign: 'center', borderRight: '2px solid #000000' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', margin: 0 }}>FJ KIDS S.A.S</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', fontWeight: 'bold' }}>
                  NIT. 900.410.656-5 · CALLE 71 #52A-77 · TEL: 3128920808 / CEL: 3128920808 · ITAGÜÍ - COLOMBIA
                </p>
              </div>
              <div style={{ padding: '6px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>📋 PEDIDO</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', fontWeight: 'bold', borderTop: '2px solid #000', marginTop: '4px', paddingTop: '2px' }}>
                  <span>FECHA: 11/08/2026</span>
                  <span style={{ color: '#dc2626', fontWeight: '900' }}>N° PED-0363</span>
                </div>
                <span style={{ display: 'inline-block', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '8.5px', fontWeight: '900', padding: '1px 6px', borderRadius: '8px', marginTop: '3px' }}>
                  ✓ CONFIRMADO
                </span>
              </div>
            </div>

            {/* DATOS CLIENTE 70% / 30% */}
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', border: '2px solid #000000', fontSize: '9.5px', fontWeight: '900', marginBottom: '-2px', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ borderRight: '2px solid #000000', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '110px', color: '#000000', fontWeight: '900' }}>👤 SEÑOR(ES)</span>
                  <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value.toUpperCase())} style={{ flex: 1, border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none', width: '100%', fontSize: '10.5px' }} />
                </div>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '110px', color: '#000000', fontWeight: '900' }}>🏪 ALMACÉN</span>
                  <input value={almacen} onChange={e => setAlmacen(e.target.value.toUpperCase())} style={{ flex: 1, border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none', width: '100%', fontSize: '10px' }} />
                </div>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '110px', color: '#000000', fontWeight: '900' }}>📍 DIRECCIÓN</span>
                  <input value={direccion} onChange={e => setDireccion(e.target.value.toUpperCase())} style={{ flex: 1, border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none', width: '100%', fontSize: '10px' }} />
                </div>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '110px', color: '#000000', fontWeight: '900' }}>💳 FORMA PAGO</span>
                  <input value={formaPago} onChange={e => setFormaPago(e.target.value.toUpperCase())} style={{ flex: 1, border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none', fontSize: '10px' }} />
                </div>
                <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '120px', color: '#000000', fontWeight: '900' }}>🚚 VIGENCIA DESPACHO</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }}>
                    <span>INICIO:</span>
                    <input type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} style={{ border: '1px solid #000000', borderRadius: '3px', color: '#dc2626', fontWeight: '900', padding: '1px 3px', fontSize: '8.5px', outline: 'none' }} />
                    <span>FIN:</span>
                    <input type="date" value={vigenciaFin} onChange={e => setVigenciaFin(e.target.value)} style={{ border: '1px solid #000000', borderRadius: '3px', color: '#dc2626', fontWeight: '900', padding: '1px 3px', fontSize: '8.5px', outline: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '85px', color: '#000000', fontWeight: '900' }}>🆔 NIT O C.C.</span>
                  <input value={nitCliente} onChange={e => setNitCliente(e.target.value.toUpperCase())} style={{ flex: 1, border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none', fontSize: '9.5px' }} />
                </div>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ width: '55px', color: '#000000', fontWeight: '900' }}>📞 TEL</span>
                  <input value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: '35px', border: 'none', outline: 'none' }} />
                  <span style={{ width: '50px', color: '#000000', fontWeight: '900' }}>📱 CEL</span>
                  <input value={celular} onChange={e => setCelular(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none', fontSize: '9.5px' }} />
                </div>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ width: '85px', color: '#000000', fontWeight: '900' }}>🗺️ UBICACIÓN</span>
                  <select value={deptoSeleccionado} onChange={e => { setDeptoSeleccionado(e.target.value); setCiudadSeleccionada(geoColombia[e.target.value][0]); }} style={{ border: 'none', fontWeight: '900', color: '#dc2626', fontSize: '9px', outline: 'none' }}>
                    {Object.keys(geoColombia).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={ciudadSeleccionada} onChange={e => setCiudadSeleccionada(e.target.value)} style={{ border: 'none', fontWeight: '900', color: '#dc2626', fontSize: '9px', outline: 'none' }}>
                    {geoColombia[deptoSeleccionado]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ borderBottom: '2px solid #000000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ width: '65px', color: '#000000', fontWeight: '900' }}>🏷️ DESC</span>
                  <input value={descuento} onChange={e => setDescuento(e.target.value)} style={{ width: '30px', border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none' }} />
                  <span style={{ width: '60px', color: '#000000', fontWeight: '900' }}>👤 VEND</span>
                  <input value={vendedor} onChange={e => setVendedor(e.target.value.toUpperCase())} style={{ flex: 1, border: 'none', fontWeight: '900', color: '#dc2626', outline: 'none', fontSize: '9.5px' }} />
                </div>
                <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '95px', color: '#000000', fontWeight: '900' }}>📅 CORTE FACTURA</span>
                  <input type="date" value={corteFacturacion} onChange={e => setCorteFacturacion(e.target.value)} style={{ border: '1px solid #000000', borderRadius: '3px', color: '#2563eb', fontWeight: '900', padding: '1px 3px', fontSize: '8.5px', outline: 'none' }} />
                </div>
              </div>
            </div>

            {/* NOTAS */}
            <div style={{ border: '2px solid #000000', padding: '4px 6px', fontSize: '9.5px', fontWeight: '900', marginBottom: '10px', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
              <span style={{ color: '#000000', display: 'block', marginBottom: '2px' }}>📝 NOTAS / OBSERVACIONES:</span>
              <textarea rows={2} value={notasGenerales} onChange={e => setNotasGenerales(e.target.value.toUpperCase())} style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '900', color: '#dc2626', resize: 'vertical' }} />
            </div>

            {/* MATRIZ CON CÁMARA 📷 DEBAJO DE CELDA N° */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', textAlign: 'center', border: '2px solid #000000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #000000', fontWeight: '900' }}>
                    <th style={{ padding: '3px', borderRight: '2px solid #000000', width: '32px' }} rowSpan={5}>N°</th>
                    <th style={{ padding: '3px', borderRight: '2px solid #000000', width: '45px' }} rowSpan={5}>REF</th>
                    <th style={{ padding: '3px', borderRight: '2px solid #000000', width: '125px', textAlign: 'left' }} rowSpan={5}>DESCRIPCIÓN</th>
                    <th style={{ padding: '0', borderRight: '2px solid #000000' }} colSpan={8}>
                      <div style={{ borderBottom: '2px solid #000000', padding: '2px', fontWeight: '900', backgroundColor: '#e2e8f0', fontSize: '10px' }}>
                        MATRIZ DE TALLAS INDEPENDIENTES
                      </div>
                    </th>
                    <th style={{ padding: '3px', borderRight: '2px solid #000000', width: '45px' }} rowSpan={5}>CANT. TOTAL</th>
                    <th style={{ padding: '3px', borderRight: '2px solid #000000', width: '55px' }} rowSpan={5}>PRECIO</th>
                    <th style={{ padding: '3px', borderRight: '2px solid #000000', width: '75px' }} rowSpan={5}>VALOR TOTAL</th>
                    <th style={{ padding: '3px', width: '85px' }} rowSpan={5}>NOTA / COLOR</th>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #000000', fontSize: '8px', fontWeight: '900' }}>
                    <th style={{ borderRight: '2px solid #000000', padding: '2px', width: '50px', backgroundColor: '#f1f5f9' }}>MESES</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px', width: '28px' }}>0-3</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px', width: '28px' }}>3-6</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px', width: '28px' }}>6-9</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px', width: '28px' }}>9-12</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px', width: '28px' }}></th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px', width: '28px' }}></th>
                    <th style={{ padding: '2px', width: '28px' }}></th>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #000000', fontSize: '8px', fontWeight: '900' }}>
                    <th style={{ borderRight: '2px solid #000000', padding: '2px', width: '50px', backgroundColor: '#f1f5f9' }}>BEBÉS</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '1px' }}>2<br/><span style={{ fontSize: '6px', color: '#64748b' }}>6-12</span></th>
                    <th style={{ borderRight: '1px solid #000000', padding: '1px' }}>3<br/><span style={{ fontSize: '6px', color: '#64748b' }}>12-18</span></th>
                    <th style={{ borderRight: '1px solid #000000', padding: '1px' }}>4<br/><span style={{ fontSize: '6px', color: '#64748b' }}>18-24</span></th>
                    <th style={{ borderRight: '1px solid #000000', padding: '1px' }}>5<br/><span style={{ fontSize: '6px', color: '#64748b' }}>24-36</span></th>
                    <th style={{ borderRight: '1px solid #000000', padding: '1px' }}>6<br/><span style={{ fontSize: '6px', color: '#64748b' }}>36-48</span></th>
                    <th style={{ borderRight: '1px solid #000000', padding: '1px' }}></th>
                    <th style={{ padding: '1px' }}></th>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #000000', fontSize: '8px', fontWeight: '900' }}>
                    <th style={{ borderRight: '2px solid #000000', padding: '2px', width: '50px', backgroundColor: '#f1f5f9' }}>JUNIOR</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>4</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>6</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>8</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>10</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>12</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>14</th>
                    <th style={{ padding: '2px' }}>16</th>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #000000', fontSize: '8px', fontWeight: '900' }}>
                    <th style={{ borderRight: '2px solid #000000', padding: '2px', width: '50px', backgroundColor: '#f1f5f9' }}>JUVENIL</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>18</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>20</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>22</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}>24</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}></th>
                    <th style={{ borderRight: '1px solid #000000', padding: '2px' }}></th>
                    <th style={{ padding: '2px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, idx) => {
                    const cantTotal = totalPrendasFila(f);
                    const valorTotal = totalValorFila(f);
                    const tallasLista = mapaTallasCurva[f.curva];
                    const precioActual = f.preciosPorLista[listaActiva];

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '2px', borderRight: '2px solid #000000', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: '900', fontSize: '10px' }}>{idx + 1}</span>
                            <button onClick={() => setModalFoto(f)} className="no-print" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', lineHeight: '1', marginTop: '2px', padding: 0 }}>📷</button>
                          </div>
                        </td>
                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000', fontSize: '10px' }}>{f.referencia}</td>
                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000', textAlign: 'left' }}>{f.descripcion}</td>
                        <td style={{ borderRight: '2px solid #000000', padding: '1px', backgroundColor: '#f8fafc' }}>
                          <select value={f.curva} onChange={e => cambiarCurvaFila(idx, e.target.value as any)} style={{ border: 'none', fontWeight: '900', fontSize: '8px', backgroundColor: 'transparent', color: '#1e3a8a', outline: 'none' }}>
                            <option value="MESES">MESES</option>
                            <option value="BEBÉS">BEBÉS</option>
                            <option value="JUNIOR">JUNIOR</option>
                            <option value="JUVENIL">JUVENIL</option>
                          </select>
                        </td>

                        {columnasTallasMaster.map((_, cIdx) => {
                          const tName = tallasLista[cIdx];
                          const inputKey = `${idx}-${cIdx}`;
                          return (
                            <td key={cIdx} style={{ borderRight: '1px solid #000000', padding: '1px', backgroundColor: tName ? '#ffffff' : '#f1f5f9' }}>
                              {tName ? (
                                <input
                                  ref={el => { inputRefs.current[inputKey] = el; }}
                                  type="number"
                                  value={f.tallasMap[tName] || ''}
                                  onChange={e => cambiarTallaValor(idx, tName, parseInt(e.target.value) || 0)}
                                  onKeyDown={e => manejarKeyDownExcel(e, idx, cIdx, f.tallasMap[tName] || 0)}
                                  style={{ width: '100%', textAlign: 'center', border: 'none', fontWeight: '900', fontSize: '9.5px', outline: 'none', backgroundColor: 'transparent' }}
                                />
                              ) : null}
                            </td>
                          );
                        })}

                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000', backgroundColor: '#fef3c7' }}>{cantTotal}</td>
                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000' }}>$ {precioActual.toLocaleString('es-CO')}</td>
                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000' }}>$ {valorTotal.toLocaleString('es-CO')}</td>
                        <td style={{ padding: '3px', textAlign: 'center' }}>
                          {f.colores.map((c, cIdx) => (
                            <span key={cIdx} style={{ backgroundColor: c.bg, color: c.text, padding: '2px 5px', borderRadius: '3px', fontSize: '7.5px', fontWeight: '900', display: 'inline-block', border: '1px solid #000000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                              {c.nombre}
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* RESUMEN CATEGORÍAS */}
            <div style={{ marginTop: '12px', borderTop: '2px solid #000000', paddingTop: '8px' }}>
              <h4 style={{ fontSize: '9.5px', fontWeight: '900', margin: '0 0 6px 0', textTransform: 'uppercase' }}>📦 Resumen por Categoría · {clienteNombre}</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '10px', border: '2px solid #000000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #000000' }}>
                    <th style={{ padding: '4px', textAlign: 'left', borderRight: '2px solid #000000' }}>Categoría</th>
                    <th style={{ padding: '4px', textAlign: 'center', borderRight: '2px solid #000000' }}>Unidades Pedidas</th>
                    <th style={{ padding: '4px', textAlign: 'right' }}>Valor Total ($ COP)</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriasEnPedido.map((cat, cIdx) => {
                    const itemsCat = filas.filter(f => f.descripcion === cat);
                    const undsCat = itemsCat.reduce((acc, f) => acc + totalPrendasFila(f), 0);
                    const valCat = itemsCat.reduce((acc, f) => acc + totalValorFila(f), 0);
                    return (
                      <tr key={cIdx} style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '4px', fontWeight: 'bold', borderRight: '2px solid #000000' }}>{cat}</td>
                        <td style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold', borderRight: '2px solid #000000' }}>{undsCat} unds</td>
                        <td style={{ padding: '4px', textAlign: 'right', fontWeight: '900', color: '#059669' }}>$ {valCat.toLocaleString('es-CO')}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '900' }}>
                    <td style={{ padding: '5px', borderRight: '2px solid #000000' }}>TOTAL GENERAL DE UNIDADES Y VALOR DEL PEDIDO</td>
                    <td style={{ padding: '5px', textAlign: 'center', borderRight: '2px solid #000000', fontSize: '10px' }}>{totalPrendasGeneral()} unds</td>
                    <td style={{ padding: '5px', textAlign: 'right', color: '#dc2626', fontSize: '11px' }}>
                      {mostrarTotalGeneral ? `$ ${totalValorGeneral().toLocaleString('es-CO')} COP` : '[VALOR TOTAL GENERAL RESERVADO]'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PIE DE PÁGINA PEQUIX */}
            <div style={{ borderTop: '2px solid #000000', marginTop: '10px', paddingTop: '6px', textAlign: 'center', fontSize: '8.5px', color: '#000000', fontWeight: 'bold' }}>
              <p style={{ margin: 0 }}>
                🚀 Desarrollado por <strong>Pequix</strong> · Teléfono: <strong>333 254 1133</strong> · Medellín, Colombia
              </p>
            </div>

          </div>
        )}

        {/* MÓDULO 2: PARÁMETROS PRECIOS */}
        {moduloActivo === 'REGLAS_PRECIOS' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#38bdf8', margin: 0 }}>⚙️ Configuración de Listas de Precios</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Administra deltas y porcentajes de margen para L1, L2, L3 y L4 MED.</p>
          </div>
        )}

        {/* MÓDULO 3: DESPACHOS & BODEGA */}
        {moduloActivo === 'DESPACHOS_BODEGA' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#a855f7', margin: 0 }}>🚚 Despachos & Tiquetes de Empaque</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Gestión de guías de transportadoras y etiquetas adhesivas para cajas.</p>
          </div>
        )}

        {/* MÓDULO 4: DASHBOARD & AUDIT LOGS */}
        {moduloActivo === 'DASHBOARD_AUDIT' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fbbf24', margin: 0 }}>📊 Dashboard Gerencial & Audit Log Inmutable</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Métricas $ COP, comisiones al 6% para **Adrián Peña** y traza inmutable en Supabase.</p>
          </div>
        )}

        {/* MODAL FOTO FLOTANTE */}
        {modalFoto && (
          <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '18px', padding: '20px', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
              <button onClick={() => setModalFoto(null)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#cbd5e1', borderRadius: '50%', width: '30px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ backgroundColor: '#1e3a8a', color: '#38bdf8', fontSize: '10px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px' }}>
                  REF: {modalFoto.referencia} · {modalFoto.curva}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', margin: '4px 0 0 0' }}>{modalFoto.descripcion}</h3>
              </div>
              <div style={{ width: '100%', height: '260px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <img src={modalFoto.imagenUrl} alt={modalFoto.descripcion} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button onClick={() => setModalFoto(null)} style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '11px' }}>
                ✏️ Cerrar Ficha
              </button>
            </div>
          </div>
        )}

      </div>

      {/* REGLAS EXCLUSIVAS DE IMPRESIÓN */}
      <style jsx global>{`
        @media print {
          @page { size: letter portrait; margin: 4mm; }
          .no-print { display: none !important; }
          body, html, .app-container { background-color: #ffffff !important; color: #000000 !important; background: #ffffff !important; }
          #hoja-pedido-oficial { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
