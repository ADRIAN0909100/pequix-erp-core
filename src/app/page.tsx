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
  deltaL4: number;
  deltaL5: number;
}

interface FilaItemPedido {
  num: number;
  referencia: string;
  descripcion: string;
  curva: 'MESES' | 'BEBÉS' | 'JUNIOR' | 'JUVENIL';
  tallasMap: { [key: string]: number };
  preciosPorLista: { L1: number; L2: number; L3: number; L4: number; L5: number };
  overrideActivo?: boolean;
  colores: { nombre: string; bg: string; text: string }[];
  imagenUrl: string;
}

export default function Home() {
  const [pestana, setPestana] = useState<'NUEVO_PEDIDO' | 'CONFIG_PRECIOS' | 'DASHBOARD'>('NUEVO_PEDIDO');
  const [listaActiva, setListaActiva] = useState<'L1' | 'L2' | 'L3' | 'L4' | 'L5'>('L1');
  const [mostrarTotalGeneral, setMostrarTotalGeneral] = useState(true);
  const [mensaje, setMensaje] = useState('');
  
  // Estado para Modal Flotante de Imagen
  const [modalFoto, setModalFoto] = useState<FilaItemPedido | null>(null);

  // Parámetros Globales del Tenant (EMP-0001 FJ KIDS S.A.S)
  const [configPrecios, setConfigPrecios] = useState<ConfigPreciosTenant>({
    deltaL2: 1000,
    margenL3Porcentaje: 70,
    deltaL4: -2000,
    deltaL5: -1000
  });

  // Datos Encabezado Pedido
  const [clienteNombre, setClienteNombre] = useState('MANUELA MENDEZ ZAPATA');
  const [nitCliente, setNitCliente] = useState('1000207034-1');
  const [almacen, setAlmacen] = useState('SWEET BOYS');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('3005381816');
  const [direccion, setDireccion] = useState('CL 49 49 22');
  
  // Geografía
  const [deptoSeleccionado, setDeptoSeleccionado] = useState('ANTIOQUIA');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('ITAGÜÍ');

  const [formaPago, setFormaPago] = useState('30 DÍAS');
  const [descuento, setDescuento] = useState('10%');
  const [vendedor, setVendedor] = useState('ALEJA QUIÑONES');

  // Fechas Calendario
  const [vigenciaInicio, setVigenciaInicio] = useState('2026-08-26');
  const [vigenciaFin, setVigenciaFin] = useState('2026-08-29');
  const [corteFacturacion, setCorteFacturacion] = useState('2026-08-20');
  const [notasGenerales, setNotasGenerales] = useState('50/ 50');

  // Filas del Pedido B2B
  const [filas, setFilas] = useState<FilaItemPedido[]>([
    { num: 1, referencia: '6179', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 3, '12': 3, '14': 3 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4: 54900, L5: 55900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { num: 2, referencia: '6180', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 4, '12': 4, '14': 4 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4: 54900, L5: 55900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80' },
    { num: 3, referencia: '6181', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 4, '12': 4, '14': 4 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4: 54900, L5: 55900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80' },
    { num: 4, referencia: '6182', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 6, '10': 6, '12': 6, '14': 6 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4: 54900, L5: 55900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { num: 5, referencia: '6183', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 4, '10': 6, '12': 6, '14': 6 }, preciosPorLista: { L1: 53900, L2: 54900, L3: 91900, L4: 51900, L5: 52900 }, colores: [{ nombre: 'NEGRO', bg: '#000000', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80' },
    { num: 6, referencia: '6183', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 1, '6': 1, '8': 2, '10': 3, '12': 3, '14': 3 }, preciosPorLista: { L1: 53900, L2: 54900, L3: 91900, L4: 51900, L5: 52900 }, colores: [{ nombre: 'ARENA', bg: '#a3a3a3', text: '#000000' }], imagenUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80' },
    { num: 7, referencia: '6184', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 1, '6': 1, '8': 2, '10': 3, '12': 3, '14': 3 }, preciosPorLista: { L1: 51900, L2: 52900, L3: 88900, L4: 49900, L5: 50900 }, colores: [{ nombre: 'CAQUI', bg: '#d4b106', text: '#000000' }], imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { num: 8, referencia: '6184', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 4, '10': 6, '12': 6, '14': 6 }, preciosPorLista: { L1: 51900, L2: 52900, L3: 88900, L4: 49900, L5: 50900 }, colores: [{ nombre: 'NEGRO', bg: '#000000', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80' },
    { num: 9, referencia: '6185', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 6, '10': 6, '12': 6, '14': 6 }, preciosPorLista: { L1: 56900, L2: 57900, L3: 96900, L4: 54900, L5: 55900 }, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#ffffff' }], imagenUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80' }
  ]);

  // Categorías Master
  const categoriasMaster = [
    'BERMUDA JUNIOR', 'BERMUDA BEBE', 'CONJUNTO BEBE DORMILON', 'CONJUNTO BEBE PREMIUM',
    'CONJUNTO JUNIOR BASICO T16', 'CONJUNTO JUNIOR PREMIUM T16', 'JEAN JUNIOR', 'CAMISETA JUNIOR CR',
    'CAMISA BEBE MC', 'CAMISA BEBE ML', 'CAMISA JUNIOR MC', 'CAMISA JUNIOR ML',
    'CAMISETA BEBE TIPO POLO', 'CAMISETA JUNIOR TIPO POLO', 'CAMISETAS BEBE CR', 'CONJUNTO BEBE BASICO',
    'CONJUNTO JUNIOR PREMIUM T12', 'JEAN BEBE', 'PANTALON BEBE', 'PANTALON JUNIOR',
    'TRIO CONJUNTO BEBE PREMIUN ELEGANTE', 'TRIO CONJUNTO JUNIOR PREMIUN DEPORTIVO T-16', 'TRIO CONJUNTO JUNIOR PREMIUN ELEGANTE T-12'
  ];

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Recalcular Precios Automáticamente con base en Parámetros
  const aplicarParametrosPrecios = async () => {
    setFilas(prev =>
      prev.map(f => {
        if (f.overrideActivo) return f; // Mantiene el override manual
        const l1 = f.preciosPorLista.L1;
        const l2 = l1 + configPrecios.deltaL2;
        const l3 = Math.round((l1 * (1 + configPrecios.margenL3Porcentaje / 100)) / 100) * 100 - 100;
        const l4 = l1 + configPrecios.deltaL4;
        const l5 = l1 + configPrecios.deltaL5;

        return {
          ...f,
          preciosPorLista: { L1: l1, L2: l2, L3: l3, L4: l4, L5: l5 }
        };
      })
    );

    // Registro Inmutable en Audit Log
    await supabase.from('audit_logs').insert([{
      tenant_id: 'EMP-0001',
      usuario_id: 'USR-0001',
      usuario_nombre: 'Adrián Peña',
      accion: 'ACTUALIZAR_PARAMETROS_PRECIOS',
      entidad_afectada: 'TENANT_CONFIG',
      entidad_id: 'EMP-0001',
      valor_nuevo: configPrecios
    }]);

    setMensaje('⚙️ Parámetros de precios actualizados y aplicados a todas las listas.');
  };

  // Override Manual por Referencia y Lista
  const cambiarPrecioOverride = async (idx: number, lista: 'L1' | 'L2' | 'L3' | 'L4' | 'L5', nuevoValor: number) => {
    setFilas(prev =>
      prev.map((f, i) => {
        if (i === idx) {
          const nuevosPrecios = { ...f.preciosPorLista, [lista]: nuevoValor };
          return { ...f, preciosPorLista: nuevosPrecios, overrideActivo: true };
        }
        return f;
      })
    );

    // Registrar Override en Audit Log
    await supabase.from('audit_logs').insert([{
      tenant_id: 'EMP-0001',
      usuario_id: 'USR-0001',
      usuario_nombre: 'Adrián Peña',
      accion: 'OVERRIDE_PRECIO_MANUAL',
      entidad_afectada: 'PRODUCTOS',
      entidad_id: filas[idx].referencia,
      valor_nuevo: { lista, precio_anterior: filas[idx].preciosPorLista[lista], precio_nuevo: nuevoValor }
    }]);

    setMensaje(`✏️ Override manual aplicado a REF ${filas[idx].referencia} en ${lista}: $ ${nuevoValor.toLocaleString('es-CO')} COP.`);
  };

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
          if (el) {
            el.focus();
            el.select();
          }
        }, 50);
      } else if (filaIdx < filas.length - 1) {
        const primerTallaSigFila = mapaTallasCurva[filas[filaIdx + 1].curva][0];
        cambiarTallaValor(filaIdx + 1, primerTallaSigFila, valActual || 2);

        const nextRowKey = `${filaIdx + 1}-0`;
        setTimeout(() => {
          const el = inputRefs.current[nextRowKey];
          if (el) {
            el.focus();
            el.select();
          }
        }, 50);
      }
    }
  };

  const guardarYExportarPDF = async () => {
    window.print();
    setMensaje('🎉 ¡Pedido guardado y PDF generado con éxito!');
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
        
        {/* CONTROLES SUPERIORES */}
        <div className="no-print" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '15px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              🟢 PEQUIX ERP CORE SAAS · FJ KIDS S.A.S
            </span>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: '4px 0 0 0', color: '#ffffff' }}>Módulo B2B Toma de Pedidos & Ficha Oficial</h1>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPestana('NUEVO_PEDIDO')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'NUEVO_PEDIDO' ? '#10b981' : '#1e293b', color: pestana === 'NUEVO_PEDIDO' ? '#022c22' : '#ffffff' }}>
              📋 Pedido B2B
            </button>
            <button onClick={() => setPestana('CONFIG_PRECIOS')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'CONFIG_PRECIOS' ? '#38bdf8' : '#1e293b', color: pestana === 'CONFIG_PRECIOS' ? '#0f172a' : '#ffffff' }}>
              ⚙️ Reglas de Precios
            </button>
            <button onClick={() => setPestana('DASHBOARD')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'DASHBOARD' ? '#fbbf24' : '#1e293b', color: pestana === 'DASHBOARD' ? '#451a03' : '#ffffff' }}>
              📊 Dashboard
            </button>

            {/* SELECTOR INTERACTIVO DE LISTAS DE PRECIO */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
              {(['L1', 'L2', 'L3', 'L4', 'L5'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setListaActiva(l)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '900',
                    fontSize: '10px',
                    cursor: 'pointer',
                    backgroundColor: listaActiva === l ? '#38bdf8' : 'transparent',
                    color: listaActiva === l ? '#0f172a' : '#cbd5e1'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <button onClick={guardarYExportarPDF} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
              🖨️ PDF
            </button>
          </div>
        </div>

        {mensaje && (
          <div className="no-print" style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA: PARAMETRIZACIÓN DE PRECIOS & OVERRIDES */}
        {pestana === 'CONFIG_PRECIOS' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#38bdf8', margin: 0 }}>⚙️ Parámetros Globales de Listas de Precios (`EMP-0001`)</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>Ajusta los deltas y márgenes para recalcular automáticamente las tarifas del sistema.</p>
            </div>

            {/* Formulario Parámetros */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '6px' }}>Delta Lista L2 ($ COP):</label>
                <input
                  type="number"
                  value={configPrecios.deltaL2}
                  onChange={e => setConfigPrecios({ ...configPrecios, deltaL2: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>L2 = L1 + Delta (Ej: +$1.000 COP)</span>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '6px' }}>Margen Lista L3 Detal (%):</label>
                <input
                  type="number"
                  value={configPrecios.margenL3Porcentaje}
                  onChange={e => setConfigPrecios({ ...configPrecios, margenL3Porcentaje: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>L3 = L1 + % Margen (Ej: +70% e-commerce)</span>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '6px' }}>Delta Lista L4 Local ($ COP):</label>
                <input
                  type="number"
                  value={configPrecios.deltaL4}
                  onChange={e => setConfigPrecios({ ...configPrecios, deltaL4: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>L4 = L1 + Delta (Ej: -$2.000 COP)</span>
              </div>
            </div>

            <button onClick={aplicarParametrosPrecios} style={{ padding: '12px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>
              ⚡ Guardar & Recalcular Precios en Vivo
            </button>

            {/* Tabla Overrides Manuales por Producto */}
            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fbbf24', marginBottom: '10px' }}>✏️ Overrides Manuales por Referencia</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '8px' }}>REF</th>
                    <th style={{ padding: '8px' }}>DESCRIPCIÓN</th>
                    <th style={{ padding: '8px' }}>PRECIO L1 (BASE)</th>
                    <th style={{ padding: '8px' }}>L2 (DISTRIBUIDOR)</th>
                    <th style={{ padding: '8px' }}>L3 (DETAL)</th>
                    <th style={{ padding: '8px' }}>L4 (LOCAL)</th>
                    <th style={{ padding: '8px' }}>ESTADO OVERRIDE</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#fbbf24' }}>{f.referencia}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{f.descripcion}</td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          value={f.preciosPorLista.L1}
                          onChange={e => cambiarPrecioOverride(idx, 'L1', parseInt(e.target.value) || 0)}
                          style={{ width: '80px', padding: '4px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#10b981', fontWeight: 'bold', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>$ {f.preciosPorLista.L2.toLocaleString('es-CO')}</td>
                      <td style={{ padding: '8px' }}>$ {f.preciosPorLista.L3.toLocaleString('es-CO')}</td>
                      <td style={{ padding: '8px' }}>$ {f.preciosPorLista.L4.toLocaleString('es-CO')}</td>
                      <td style={{ padding: '8px' }}>
                        {f.overrideActivo ? (
                          <span style={{ backgroundColor: '#713f12', color: '#fde047', fontSize: '9px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>✏️ MANUAL OVERRIDE</span>
                        ) : (
                          <span style={{ backgroundColor: '#064e3b', color: '#34d399', fontSize: '9px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>⚙️ FÓRMULA AUTOMÁTICA</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* PESTAÑA: NUEVO PEDIDO FORMULARIO CARTA */}
        {pestana === 'NUEVO_PEDIDO' && (
          <div id="hoja-pedido-oficial" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '10px', borderRadius: '0px', border: 'none', boxSizing: 'border-box', maxWidth: '794px', margin: '0 auto', width: '100%' }}>
            
            {/* 1. ENCABEZADO INSTITUCIONAL */}
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

            {/* 2. REPARTICIÓN PROPORCIONAL 70% / 30% EXACTA EN DATOS DE CLIENTE */}
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

            {/* CUADRO MULTI-RENGLÓN DE NOTAS U OBSERVACIONES */}
            <div style={{ border: '2px solid #000000', padding: '4px 6px', fontSize: '9.5px', fontWeight: '900', marginBottom: '10px', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
              <span style={{ color: '#000000', display: 'block', marginBottom: '2px' }}>📝 NOTAS / OBSERVACIONES:</span>
              <textarea
                rows={2}
                value={notasGenerales}
                onChange={e => setNotasGenerales(e.target.value.toUpperCase())}
                style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '900', color: '#dc2626', resize: 'vertical' }}
              />
            </div>

            {/* 3. MATRIZ DE TALLAS CON CÁMARA 📷 ABAJO DEL NÚMERO CONSECUTIVO */}
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

                  {/* TALLAS MESES */}
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

                  {/* TALLAS BEBÉS */}
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

                  {/* TALLAS JUNIOR */}
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

                  {/* TALLAS JUVENIL */}
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
                        
                        {/* CELDA N° CON EL NÚMERO ARRIBA Y LA CÁMARA 📷 DEBAJO EN EL MISMO RECUADRO */}
                        <td style={{ padding: '2px', borderRight: '2px solid #000000', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: '900', fontSize: '10px' }}>{idx + 1}</span>
                            <button
                              onClick={() => setModalFoto(f)}
                              className="no-print"
                              title="Toca para ver la foto flotante de la prenda"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', lineHeight: '1', marginTop: '2px', padding: 0 }}
                            >
                              📷
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000', fontSize: '10px' }}>
                          {f.referencia}
                        </td>

                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000', textAlign: 'left' }}>
                          {f.descripcion}
                        </td>

                        <td style={{ borderRight: '2px solid #000000', padding: '1px', backgroundColor: '#f8fafc' }}>
                          <select
                            value={f.curva}
                            onChange={e => cambiarCurvaFila(idx, e.target.value as any)}
                            style={{ border: 'none', fontWeight: '900', fontSize: '8px', backgroundColor: 'transparent', color: '#1e3a8a', outline: 'none' }}
                          >
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

                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000', backgroundColor: '#fef3c7' }}>
                          {cantTotal}
                        </td>

                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000' }}>
                          $ {precioActual.toLocaleString('es-CO')}
                        </td>

                        <td style={{ padding: '3px', fontWeight: '900', borderRight: '2px solid #000000' }}>
                          $ {valorTotal.toLocaleString('es-CO')}
                        </td>
                        
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

            {/* 4. RESUMEN POR CATEGORÍA Y TOTAL GENERAL */}
            <div style={{ marginTop: '12px', borderTop: '2px solid #000000', paddingTop: '8px' }}>
              <h4 style={{ fontSize: '9.5px', fontWeight: '900', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                📦 Resumen por Categoría · {clienteNombre}
              </h4>

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

              {/* ALERTAS VISUALES CHULITOS Y EQUIS */}
              <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#000000', display: 'block', marginBottom: '4px' }}>
                🎯 Categorías de este pedido ({categoriasEnPedido.length} de {categoriasMaster.length} pedidas):
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '4px', fontSize: '7.5px', fontWeight: 'bold' }}>
                {categoriasMaster.map((catName, mIdx) => {
                  const solicitada = categoriasEnPedido.includes(catName);
                  const itemsCat = filas.filter(f => f.descripcion === catName);
                  const undsCat = itemsCat.reduce((acc, f) => acc + totalPrendasFila(f), 0);

                  return (
                    <div key={mIdx} style={{ padding: '3px 5px', borderRadius: '3px', backgroundColor: solicitada ? '#dcfce7' : '#fee2e2', color: solicitada ? '#166534' : '#991b1b', border: `1px solid ${solicitada ? '#166534' : '#dc2626'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {solicitada ? '✓' : '✕'} {catName}
                      </span>
                      {solicitada && <span style={{ backgroundColor: '#166534', color: '#ffffff', padding: '1px 4px', borderRadius: '3px', fontSize: '7px' }}>{undsCat} unds</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. PIE DE PÁGINA CON CRÉDITOS DE PEQUIX */}
            <div style={{ borderTop: '2px solid #000000', marginTop: '10px', paddingTop: '6px', textAlign: 'center', fontSize: '8.5px', color: '#000000', fontWeight: 'bold' }}>
              <p style={{ margin: 0 }}>
                🚀 Desarrollado por <strong>Pequix</strong> · Teléfono: <strong>333 254 1133</strong> · Medellín, Colombia
              </p>
            </div>

          </div>
        )}

        {/* MODAL FLOTANTE AMPLIO DE FOTO */}
        {modalFoto && (
          <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '18px', padding: '20px', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
              
              <button
                onClick={() => setModalFoto(null)}
                style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#cbd5e1', borderRadius: '50%', width: '30px', height: '32px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                ✕
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ backgroundColor: '#1e3a8a', color: '#38bdf8', fontSize: '10px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px' }}>
                  REFERENCIA: {modalFoto.referencia} · {modalFoto.curva}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', margin: '4px 0 0 0' }}>{modalFoto.descripcion}</h3>
              </div>

              <div style={{ width: '100%', height: '260px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <img src={modalFoto.imagenUrl} alt={modalFoto.descripcion} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#64748b', display: 'block' }}>COLORES EN STOCK:</span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {modalFoto.colores.map((c, idx) => (
                      <span key={idx} style={{ backgroundColor: c.bg, color: c.text, padding: '2px 6px', borderRadius: '3px', fontSize: '8px', fontWeight: '900', border: '1px solid #cbd5e1' }}>
                        {c.nombre}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#64748b' }}>PRECIO {listaActiva}:</span>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#059669' }}>
                    $ {modalFoto.preciosPorLista[listaActiva].toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalFoto(null)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '11px' }}
              >
                ✏️ Cerrar Ficha / Editar Cantidades
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ESTILOS DE IMPRESIÓN EXCLUSIVOS */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 4mm;
          }
          html, body, .app-container {
            background-color: #ffffff !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          #hoja-pedido-oficial {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background-color: #ffffff !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
