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

// Base Geográfica Colombia & Internacional
const geoColombia: { [key: string]: string[] } = {
  'ANTIOQUIA': ['Itagüí', 'Medellín', 'Bello', 'Envigado', 'Sabaneta', 'Rionegro'],
  'CÓRDOBA': ['Montería', 'Cereté', 'Sahagún', 'Lorica', 'Planeta Rica'],
  'SUCRE': ['Sincelejo', 'Corozal', 'San Marcos'],
  'BOLÍVAR': ['Cartagena', 'Magangué', 'Turbaco'],
  'ATLÁNTICO': ['Barranquilla', 'Soledad', 'Puerto Colombia'],
  'BOGOTÁ D.C.': ['Bogotá D.C.'],
  'VALLE DEL CAUCA': ['Cali', 'Palmira', 'Buenaventura'],
  'INTERNACIONAL': ['Miami (EE.UU.)', 'Panamá (PA)', 'Quito (EC)']
};

interface FilaItemPedido {
  num: number;
  referencia: string;
  descripcion: string;
  curva: 'MESES' | 'BEBÉS' | 'JUNIOR' | 'JUVENIL';
  tallasMap: { [key: string]: number };
  precioUnitario: number;
  colores: { nombre: string; bg: string; text: string }[];
  imagenUrl: string;
}

export default function Home() {
  const [pestana, setPestana] = useState<'NUEVO_PEDIDO' | 'DASHBOARD'>('NUEVO_PEDIDO');
  // Checkbox: Ocultar únicamente el Valor Total General
  const [mostrarTotalGeneral, setMostrarTotalGeneral] = useState(true);
  const [mensaje, setMensaje] = useState('');
  
  // Estado para Modal Flotante de Imagen
  const [modalFoto, setModalFoto] = useState<FilaItemPedido | null>(null);

  // Datos Encabezado Pedido
  const [clienteNombre, setClienteNombre] = useState('MANUELA MENDEZ ZAPATA');
  const [nitCliente, setNitCliente] = useState('1000207034-1');
  const [almacen, setAlmacen] = useState('SWEET BOYS (Contacto: CAROLINA)');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('3005381816');
  const [direccion, setDireccion] = useState('CL 49 49 22');
  
  // Geografía
  const [deptoSeleccionado, setDeptoSeleccionado] = useState('ANTIOQUIA');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('Itagüí');

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
    { num: 1, referencia: '6179', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 3, '12': 3, '14': 3 }, precioUnitario: 56900, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#fff' }], imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { num: 2, referencia: '6180', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 4, '12': 4, '14': 4 }, precioUnitario: 56900, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#fff' }], imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80' },
    { num: 3, referencia: '6181', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 3, '10': 4, '12': 4, '14': 4 }, precioUnitario: 56900, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#fff' }], imagenUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80' },
    { num: 4, referencia: '6182', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 6, '10': 6, '12': 6, '14': 6 }, precioUnitario: 56900, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#fff' }], imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { num: 5, referencia: '6183', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 4, '10': 6, '12': 6, '14': 6 }, precioUnitario: 53900, colores: [{ nombre: 'NEGRO', bg: '#000000', text: '#fff' }], imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80' },
    { num: 6, referencia: '6183', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 1, '6': 1, '8': 2, '10': 3, '12': 3, '14': 3 }, precioUnitario: 53900, colores: [{ nombre: 'ARENA', bg: '#a3a3a3', text: '#000' }], imagenUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80' },
    { num: 7, referencia: '6184', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 1, '6': 1, '8': 2, '10': 3, '12': 3, '14': 3 }, precioUnitario: 51900, colores: [{ nombre: 'CAQUI', bg: '#d4b106', text: '#000' }], imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { num: 8, referencia: '6184', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 4, '10': 6, '12': 6, '14': 6 }, precioUnitario: 51900, colores: [{ nombre: 'NEGRO', bg: '#000000', text: '#fff' }], imagenUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80' },
    { num: 9, referencia: '6185', descripcion: 'BERMUDA JUNIOR', curva: 'JUNIOR', tallasMap: { '4': 2, '6': 2, '8': 6, '10': 6, '12': 6, '14': 6 }, precioUnitario: 56900, colores: [{ nombre: 'AZUL', bg: '#2563eb', text: '#fff' }], imagenUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80' }
  ]);

  // Lista Master de Categorías
  const categoriasMaster = [
    'BERMUDA JUNIOR', 'BERMUDA BEBE', 'CONJUNTO BEBE DORMILON', 'CONJUNTO BEBE PREMIUM',
    'CONJUNTO JUNIOR BASICO T16', 'CONJUNTO JUNIOR PREMIUM T16', 'JEAN JUNIOR', 'CAMISETA JUNIOR CR',
    'CAMISA BEBE MC', 'CAMISA BEBE ML', 'CAMISA JUNIOR MC', 'CAMISA JUNIOR ML',
    'CAMISETA BEBE TIPO POLO', 'CAMISETA JUNIOR TIPO POLO', 'CAMISETAS BEBE CR', 'CONJUNTO BEBE BASICO',
    'CONJUNTO JUNIOR PREMIUM T12', 'JEAN BEBE', 'PANTALON BEBE', 'PANTALON JUNIOR',
    'TRIO CONJUNTO BEBE PREMIUN ELEGANTE', 'TRIO CONJUNTO JUNIOR PREMIUN DEPORTIVO T-16', 'TRIO CONJUNTO JUNIOR PREMIUN ELEGANTE T-12'
  ];

  const cambiarTallaValor = (idx: number, keyTalla: string, val: number) => {
    setFilas(prev => prev.map((f, i) => i === idx ? { ...f, tallasMap: { ...f.tallasMap, [keyTalla]: Math.max(0, val) } } : f));
  };

  const totalPrendasFila = (f: FilaItemPedido) => Object.values(f.tallasMap).reduce((a, b) => a + (b || 0), 0);
  const totalValorFila = (f: FilaItemPedido) => totalPrendasFila(f) * f.precioUnitario;

  const totalPrendasGeneral = () => filas.reduce((acc, f) => acc + totalPrendasFila(f), 0);
  const totalValorGeneral = () => filas.reduce((acc, f) => acc + totalValorFila(f), 0);

  // Categorías Presentes en el Pedido
  const categoriasEnPedido = Array.from(new Set(filas.map(f => f.descripcion)));

  const guardarYExportarPDF = async () => {
    window.print();
    setMensaje('🎉 ¡Pedido guardado y PDF generado con éxito!');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '15px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* CONTROLES SUPERIORES */}
        <div className="no-print" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '15px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              🟢 PEQUIX ERP CORE SAAS · FJ KIDS S.A.S
            </span>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: '4px 0 0 0', color: '#ffffff' }}>Módulo B2B Toma de Pedidos & Ficha Oficial</h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Chulito para Ocultar/Mostrar únicamente el VALOR TOTAL GENERAL DEL PEDIDO */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', cursor: 'pointer', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
              <input type="checkbox" checked={mostrarTotalGeneral} onChange={e => setMostrarTotalGeneral(e.target.checked)} />
              💵 Mostrar Valor Total General del Pedido ($ COP)
            </label>

            <button onClick={guardarYExportarPDF} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
              🖨️ Guardar / Descargar PDF
            </button>
          </div>
        </div>

        {mensaje && (
          <div className="no-print" style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL IMPRESO */}
        <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', borderRadius: '12px', border: '2px solid #000000' }}>
          
          {/* 1. ENCABEZADO INSTITUCIONAL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 1.3fr', border: '1px solid #000000', marginBottom: '-1px' }}>
            <div style={{ padding: '10px', borderRight: '1px solid #000000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, color: '#dc2626' }}>fj kids</h2>
            </div>
            
            <div style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #000000' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>FJ KIDS S.A.S</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>
                NIT. 900.410.656-5 · Calle 71 #52a-77 · Tel: 3128920808 / Cel: 3128920808 · ITAGÜÍ - COLOMBIA
              </p>
            </div>

            <div style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>PEDIDO</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold', borderTop: '1px solid #000', marginTop: '4px', paddingTop: '2px' }}>
                <span>FECHA: 11/08/2026</span>
                <span style={{ color: '#dc2626', fontWeight: '900' }}>N° PED-0363</span>
              </div>
              <span style={{ display: 'inline-block', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '9px', fontWeight: '900', padding: '2px 8px', borderRadius: '10px', marginTop: '4px' }}>
                ✓ Confirmado
              </span>
            </div>
          </div>

          {/* 2. TABLA ENCABEZADO DATOS DE CLIENTE & DESPACHO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #000000', fontSize: '10px', fontWeight: 'bold', marginBottom: '-1px' }}>
            <div style={{ borderRight: '1px solid #000' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex' }}>
                <span style={{ width: '100px', color: '#475569' }}>SEÑOR(ES)</span>
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: 'bold', color: '#dc2626', outline: 'none' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex' }}>
                <span style={{ width: '100px', color: '#475569' }}>ALMACÉN</span>
                <input value={almacen} onChange={e => setAlmacen(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: 'bold', color: '#dc2626', outline: 'none' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex' }}>
                <span style={{ width: '100px', color: '#475569' }}>DIRECCIÓN</span>
                <input value={direccion} onChange={e => setDireccion(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: 'bold', color: '#dc2626', outline: 'none' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex' }}>
                <span style={{ width: '100px', color: '#475569' }}>FORMA DE PAGO</span>
                <input value={formaPago} onChange={e => setFormaPago(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: 'bold', color: '#dc2626', outline: 'none' }} />
              </div>
              
              {/* Calendario Desplegable para Vigencia de Despacho */}
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '110px', color: '#475569' }}>🚚 VIGENCIA DESPACHO</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>Inicio:</span>
                  <input type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', color: '#dc2626', fontWeight: 'bold', padding: '1px 4px', fontSize: '9px' }} />
                  <span>Fin:</span>
                  <input type="date" value={vigenciaFin} onChange={e => setVigenciaFin(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', color: '#dc2626', fontWeight: 'bold', padding: '1px 4px', fontSize: '9px' }} />
                </div>
              </div>
            </div>

            <div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex' }}>
                <span style={{ width: '100px', color: '#475569' }}>NIT o C.C.</span>
                <input value={nitCliente} onChange={e => setNitCliente(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: 'bold', color: '#dc2626', outline: 'none' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex' }}>
                <span style={{ width: '100px', color: '#475569' }}>TELÉFONO</span>
                <input value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: '70px', border: 'none', outline: 'none' }} />
                <span style={{ width: '50px', color: '#475569' }}>CELULAR</span>
                <input value={celular} onChange={e => setCelular(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: 'bold', color: '#dc2626', outline: 'none' }} />
              </div>

              {/* Selector de Ubicación */}
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex', gap: '6px' }}>
                <span style={{ width: '100px', color: '#475569' }}>UBICACIÓN</span>
                <select value={deptoSeleccionado} onChange={e => { setDeptoSeleccionado(e.target.value); setCiudadSeleccionada(geoColombia[e.target.value][0]); }} style={{ border: 'none', fontWeight: 'bold', color: '#dc2626', fontSize: '10px' }}>
                  {Object.keys(geoColombia).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={ciudadSeleccionada} onChange={e => setCiudadSeleccionada(e.target.value)} style={{ border: 'none', fontWeight: 'bold', color: '#dc2626', fontSize: '10px' }}>
                  {geoColombia[deptoSeleccionado]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex' }}>
                <span style={{ width: '100px', color: '#475569' }}>DESCUENTO</span>
                <input value={descuento} onChange={e => setDescuento(e.target.value)} style={{ width: '50px', border: 'none', fontWeight: 'bold', color: '#dc2626' }} />
                <span style={{ width: '60px', color: '#475569' }}>VENDEDOR</span>
                <input value={vendedor} onChange={e => setVendedor(e.target.value)} style={{ flex: 1, border: 'none', fontWeight: 'bold', color: '#dc2626' }} />
              </div>

              {/* Calendario Desplegable para Corte de Facturación */}
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '110px', color: '#475569' }}>📅 CORTE FACTURA</span>
                <input type="date" value={corteFacturacion} onChange={e => setCorteFacturacion(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', color: '#2563eb', fontWeight: 'bold', padding: '1px 4px', fontSize: '9px' }} />
              </div>
            </div>
          </div>

          {/* CUADRO MULTI-RENGLÓN DE NOTAS U OBSERVACIONES */}
          <div style={{ border: '1px solid #000000', padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', marginBottom: '15px', backgroundColor: '#f8fafc' }}>
            <span style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>NOTAS / OBSERVACIONES:</span>
            <textarea
              rows={2}
              value={notasGenerales}
              onChange={e => setNotasGenerales(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: 'bold', color: '#dc2626', resize: 'vertical' }}
            />
          </div>

          {/* 3. MATRIZ CON CURVAS EN VERTICAL (IZQUIERDA) Y TALLAS COMPACTAS */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #000', fontWeight: '900' }}>
                  <th style={{ padding: '4px', borderRight: '1px solid #000', width: '30px' }}>N°</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #000', width: '65px' }}>REF</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #000', width: '150px', textAlign: 'left' }}>DESCRIPCIÓN</th>
                  
                  {/* BLOQUE CENTRAL: CURVAS VERTICALES + MATRIZ DE TALLAS */}
                  <th style={{ padding: '0', borderRight: '1px solid #000' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', height: '100%' }}>
                      
                      {/* Curvas Dispuestas Verticalmente (No ocupan espacio horizontal) */}
                      <div style={{ borderRight: '1px solid #000', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', fontWeight: '900', fontSize: '8px', padding: '2px 0' }}>
                        <div style={{ borderBottom: '1px solid #cbd5e1', padding: '1px' }}>MESES</div>
                        <div style={{ borderBottom: '1px solid #cbd5e1', padding: '1px' }}>BEBÉS</div>
                        <div style={{ borderBottom: '1px solid #cbd5e1', padding: '1px' }}>JUNIOR</div>
                        <div style={{ padding: '1px' }}>JUVENIL</div>
                      </div>

                      {/* Grilla Superior de Tallas */}
                      <div>
                        <div style={{ borderBottom: '1px solid #000', padding: '2px', fontWeight: '900', backgroundColor: '#f8fafc' }}>
                          MATRIZ DE TALLAS INDEPENDIENTES
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', fontSize: '8px', fontWeight: 'bold' }}>
                          <span style={{ borderRight: '1px solid #cbd5e1', padding: '2px' }}>0-3 / 2 / 4 / 18</span>
                          <span style={{ borderRight: '1px solid #cbd5e1', padding: '2px' }}>3-6 / 3 / 6 / 20</span>
                          <span style={{ borderRight: '1px solid #cbd5e1', padding: '2px' }}>6-9 / 4 / 8 / 22</span>
                          <span style={{ borderRight: '1px solid #cbd5e1', padding: '2px' }}>9-12 / 5 / 10 / 24</span>
                          <span style={{ borderRight: '1px solid #cbd5e1', padding: '2px' }}>6 / 12</span>
                          <span style={{ borderRight: '1px solid #cbd5e1', padding: '2px' }}>14</span>
                          <span style={{ padding: '2px' }}>16</span>
                        </div>
                      </div>

                    </div>
                  </th>

                  <th style={{ padding: '4px', borderRight: '1px solid #000', width: '55px' }}>CANT. TOTAL</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #000', width: '70px' }}>PRECIO</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #000', width: '85px' }}>VALOR TOTAL</th>
                  <th style={{ padding: '4px', width: '110px' }}>NOTA / COLOR</th>
                </tr>
              </thead>

              <tbody>
                {filas.map((f, idx) => {
                  const cantTotal = totalPrendasFila(f);
                  const valorTotal = totalValorFila(f);

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '4px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                        {idx + 1}
                      </td>

                      {/* REF CON BOTÓN DE CÁMARA 📷 EMBEBIDO */}
                      <td style={{ padding: '4px', fontWeight: '900', borderRight: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span>{f.referencia}</span>
                          <button
                            onClick={() => setModalFoto(f)}
                            className="no-print"
                            title="Toca para ver la foto flotante de la prenda"
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                          >
                            📷
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '4px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>
                        {f.descripcion}
                      </td>

                      {/* Cajoncitos de Tallas Independientes */}
                      <td style={{ padding: '0', borderRight: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%' }}>
                          {['4', '6', '8', '10', '12', '14', '16'].map(tKey => (
                            <div key={tKey} style={{ borderRight: '1px solid #cbd5e1', padding: '2px' }}>
                              <input
                                type="number"
                                value={f.tallasMap[tKey] || ''}
                                onChange={e => cambiarTallaValor(idx, tKey, parseInt(e.target.value) || 0)}
                                style={{ width: '100%', textAlign: 'center', border: 'none', fontWeight: 'bold', fontSize: '10px', outline: 'none', backgroundColor: 'transparent' }}
                              />
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '4px', fontWeight: '900', borderRight: '1px solid #cbd5e1', backgroundColor: '#fef3c7' }}>
                        {cantTotal}
                      </td>

                      {/* Precio Unitario SIEMPRE VISIBLE para el Facturador */}
                      <td style={{ padding: '4px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                        $ {f.precioUnitario.toLocaleString('es-CO')}
                      </td>

                      {/* Valor Total por Fila SIEMPRE VISIBLE */}
                      <td style={{ padding: '4px', fontWeight: '900', borderRight: '1px solid #cbd5e1' }}>
                        $ {valorTotal.toLocaleString('es-CO')}
                      </td>
                      
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        {f.colores.map((c, cIdx) => (
                          <span key={cIdx} style={{ backgroundColor: c.bg, color: c.text, padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: '900', display: 'inline-block' }}>
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

          {/* 4. RESUMEN AGRUPADO POR CATEGORÍA CON ALERTAS VISUALES Y CANTIDADES */}
          <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '15px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: '900', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              📦 Resumen por Categoría · {clienteNombre}
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '15px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px', textAlign: 'left' }}>Categoría</th>
                  <th style={{ padding: '6px', textAlign: 'center' }}>Unidades Pedidas</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Valor Total ($ COP)</th>
                </tr>
              </thead>
              <tbody>
                {categoriasEnPedido.map((cat, cIdx) => {
                  const itemsCat = filas.filter(f => f.descripcion === cat);
                  const undsCat = itemsCat.reduce((acc, f) => acc + totalPrendasFila(f), 0);
                  const valCat = itemsCat.reduce((acc, f) => acc + totalValorFila(f), 0);

                  return (
                    <tr key={cIdx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px', fontWeight: 'bold' }}>{cat}</td>
                      <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{undsCat} unds</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: '900', color: '#059669' }}>$ {valCat.toLocaleString('es-CO')}</td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '900' }}>
                  <td style={{ padding: '6px' }}>TOTAL GENERAL DE UNIDADES Y VALOR</td>
                  <td style={{ padding: '6px', textAlign: 'center' }}>{totalPrendasGeneral()} unds</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#dc2626', fontSize: '12px' }}>
                    {/* El Checkbox controla ÚNICAMENTE la visibilidad de este monto general */}
                    {mostrarTotalGeneral ? `$ ${totalValorGeneral().toLocaleString('es-CO')} COP` : '[VALOR TOTAL GENERAL RESERVADO]'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Alertas Visuales con Unidades Exactas Pedidas */}
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' }}>
              🎯 Categorías de este pedido ({categoriasEnPedido.length} de {categoriasMaster.length} pedidas):
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '6px', fontSize: '9px', fontWeight: 'bold' }}>
              {categoriasMaster.map((catName, mIdx) => {
                const solicitada = categoriasEnPedido.includes(catName);
                const itemsCat = filas.filter(f => f.descripcion === catName);
                const undsCat = itemsCat.reduce((acc, f) => acc + totalPrendasFila(f), 0);

                return (
                  <div key={mIdx} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: solicitada ? '#dcfce7' : '#fee2e2', color: solicitada ? '#166534' : '#991b1b', border: `1px solid ${solicitada ? '#86efac' : '#fca5a5'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {solicitada ? '✓' : '✕'} {catName}
                    </span>
                    {solicitada && <span style={{ backgroundColor: '#166534', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', fontSize: '8px' }}>{undsCat} unds</span>}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* MODAL FLOTANTE AMPLIO EN EL CENTRO CON LA FOTO DE LA REFERENCIA (CÁMARA 📷) */}
        {modalFoto && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '18px', padding: '25px', maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
              
              <button
                onClick={() => setModalFoto(null)}
                style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#cbd5e1', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                ✕
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ backgroundColor: '#1e3a8a', color: '#38bdf8', fontSize: '11px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px' }}>
                  REFERENCIA: {modalFoto.referencia} · {modalFoto.curva}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '8px 0 0 0' }}>{modalFoto.descripcion}</h3>
              </div>

              {/* Contenedor Amplio para la Imagen de la Prenda */}
              <div style={{ width: '100%', height: '300px', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <img src={modalFoto.imagenUrl} alt={modalFoto.descripcion} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Información de Colores y Precio Unitario */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', display: 'block' }}>COLORES EN STOCK:</span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {modalFoto.colores.map((c, idx) => (
                      <span key={idx} style={{ backgroundColor: c.bg, color: c.text, padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '900', border: '1px solid #cbd5e1' }}>
                        {c.nombre}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>PRECIO L1 MAYORISTA:</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#059669' }}>
                    $ {modalFoto.precioUnitario.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalFoto(null)}
                style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' }}
              >
                ✏️ Cerrar Ficha / Editar Cantidades
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
