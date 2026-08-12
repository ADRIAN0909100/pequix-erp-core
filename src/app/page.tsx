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

interface ItemPedidoPDF {
  referencia: string;
  descripcion: string;
  curva: string;
  cantidad: number;
  precioUnitarioL1: number;
}

export default function Home() {
  const [pestana, setPestana] = useState<'EXPORTAR_PDF' | 'DASHBOARD' | 'BODEGA' | 'INVENTARIO'>('EXPORTAR_PDF');
  const [mensaje, setMensaje] = useState('');

  // Datos del Pedido B2B Modelo
  const codigoPedido = 'PED-2026-9081';
  const clienteNombre = 'El Palacio de la Pantaleta #1';
  const nitCliente = '900.123.456-7';
  const ciudadDestino = 'Montería, Córdoba';
  const vendedorNombre = 'Adrián Peña (USR-0001)';
  const fechaEmision = '11/08/2026';

  const [itemsPedido] = useState<ItemPedidoPDF[]>([
    { referencia: '745', descripcion: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', cantidad: 20, precioUnitarioL1: 59900 },
    { referencia: '8182', descripcion: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', cantidad: 15, precioUnitarioL1: 70900 },
    { referencia: '2552', descripcion: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', cantidad: 25, precioUnitarioL1: 43900 },
    { referencia: '1989', descripcion: 'OVEROL BEBE ESPECIAL', curva: 'MESES', cantidad: 10, precioUnitarioL1: 65000 }
  ]);

  // Cálculos Financieros $ COP
  const totalPrendas = itemsPedido.reduce((acc, item) => acc + item.cantidad, 0);
  const subtotalCOP = itemsPedido.reduce((acc, item) => acc + (item.cantidad * item.precioUnitarioL1), 0);
  const comisionAsesor6 = subtotalCOP * 0.06;

  // Función para Imprimir / Exportar a PDF
  const generarPDFImpresion = async () => {
    window.print();

    // Auditoría Inmutable en Supabase
    await supabase.from('audit_logs').insert([{
      tenant_id: 'EMP-0001',
      usuario_id: 'USR-0001',
      usuario_nombre: 'Adrián Peña',
      accion: 'EXPORTAR_PDF_PEDIDO',
      entidad_afectada: 'PEDIDOS_PDF',
      entidad_id: codigoPedido,
      valor_nuevo: { cliente: clienteNombre, total_cop: subtotalCOP, prendas: totalPrendas }
    }]);

    setMensaje(`📄 Documento PDF ${codigoPedido}_${clienteNombre.replace(/\s+/g, '_')}.pdf exportado y registrado en Audit Log.`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tenant FJ Kids (No Imprimible) */}
        <div className="no-print" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: '#a855f7', color: '#ffffff', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              📄 PEQUIX ERP CORE · GENERADOR DE DOCUMENTOS B2B
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Plantilla de Impresión & Exportador PDF</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Usuario: <strong style={{ color: '#fbbf24' }}>Adrián Peña (USR-0001)</strong> — EMP-0001 (FJ Kids)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setPestana('EXPORTAR_PDF')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'EXPORTAR_PDF' ? '#a855f7' : '#1e293b', color: '#ffffff' }}>
              📄 Vista PDF
            </button>
            <button onClick={() => setPestana('DASHBOARD')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'DASHBOARD' ? '#fbbf24' : '#1e293b', color: pestana === 'DASHBOARD' ? '#451a03' : '#ffffff' }}>
              📊 Dashboard
            </button>
            <button onClick={() => setPestana('BODEGA')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', backgroundColor: pestana === 'BODEGA' ? '#38bdf8' : '#1e293b', color: pestana === 'BODEGA' ? '#0f172a' : '#ffffff' }}>
              📦 Bodega
            </button>
          </div>
        </div>

        {mensaje && (
          <div className="no-print" style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* PESTAÑA: VISTA DOCUMENTO PDF PROFESIONAL */}
        {pestana === 'EXPORTAR_PDF' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* Botón Acción Descargar PDF (No Imprimible) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={generarPDFImpresion}
                style={{ padding: '12px 24px', backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                🖨️ Imprimir / Guardar como PDF (`{codigoPedido}_Palacio.pdf`)
              </button>
            </div>

            {/* HOJA DE DOCUMENTO OFICIAL B2B (FORMATO DE IMPRESIÓN) */}
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '35px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
              
              {/* Encabezado de la Factura / Pedido */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: '#0f172a' }}>FJ KIDS CONFECCIONES</h1>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
                    Confección Infantil & Comercialización Mayorista B2B<br />
                    Medellín, Antioquia — Colombia · NIT: 900.887.654-3
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontWeight: '900', fontSize: '12px' }}>
                    ORDEN B2B: {codigoPedido}
                  </span>
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#475569' }}>
                    Fecha Emisión: <strong>{fechaEmision}</strong><br />
                    Asesor Comercial: <strong>{vendedorNombre}</strong>
                  </p>
                </div>
              </div>

              {/* Datos del Cliente Mayorista */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Cliente Mayorista / Empresa:</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: '900', fontSize: '14px', color: '#0f172a' }}>{clienteNombre}</p>
                  <p style={{ margin: '2px 0 0 0', color: '#475569' }}>NIT / Cédula: {nitCliente}</p>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Destino de Despacho:</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 'bold', color: '#0f172a' }}>{ciudadDestino}</p>
                  <p style={{ margin: '2px 0 0 0', color: '#475569' }}>Lista Aplicada: <strong style={{ color: '#059669' }}>L1 (Precio Mayorista Base)</strong></p>
                </div>
              </div>

              {/* Tabla de Productos por Curva */}
              <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '10px' }}>REF</th>
                    <th style={{ padding: '10px' }}>DESCRIPCIÓN DE LA PRENDA</th>
                    <th style={{ padding: '10px' }}>CURVA</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>CANTIDAD</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>VALOR UNIT (L1)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>SUBTOTAL ($ COP)</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsPedido.map((item, index) => {
                    const subtotalItem = item.cantidad * item.precioUnitarioL1;
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>{item.referencia}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.descripcion}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ backgroundColor: '#e2e8f0', color: '#1e293b', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                            {item.curva}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{item.cantidad}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>$ {item.precioUnitarioL1.toLocaleString('es-CO')}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '900', color: '#059669' }}>$ {subtotalItem.toLocaleString('es-CO')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Resumen Financiero de Cierre */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #0f172a', paddingTop: '15px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '350px' }}>
                  <p style={{ margin: 0 }}><strong>Notas de Despacho:</strong> Mercancía empacada y verificada por el Módulo de Bodega de Pequix ERP. Pago acordado mediante transferencia bancaria $ COP.</p>
                </div>
                
                <div style={{ width: '280px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Total Unidades:</span>
                    <strong>{totalPrendas} prendas</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Comisión Asesor (6%):</span>
                    <strong>$ {comisionAsesor6.toLocaleString('es-CO')} COP</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                    <span>TOTAL A PAGAR:</span>
                    <span style={{ color: '#059669' }}>$ {subtotalCOP.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Estilos CSS para Ocultar Menús durante la Impresión PDF */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
        }
      `}</style>
    </div>
  );
}
