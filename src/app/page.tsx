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
}

export default function Home() {
  const [pestana, setPestana] = useState<'TIENDA_WEB' | 'PORTAL_CENTRAL' | 'INVENTARIO' | 'PEDIDOS'>('TIENDA_WEB');
  const [esMayorista, setEsMayorista] = useState(false);
  const [nitMayorista, setNitMayorista] = useState('');
  const [carrito, setCarrito] = useState<{ [key: string]: number }>({});
  const [mensaje, setMensaje] = useState('');

  // Llave Pública Productiva Real de Wompi Colombia (Dinero Real $ COP)
  const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_prod_nNuIXKqeLhROFF29YF7UIVBMItu6ryaN'; 

  const [productos, setProductos] = useState<Producto[]>([
    { referencia: '745', descripcion: 'CONJUNTO BEBE DORMILON', curva: 'BEBÉS', precio_L1_base: 59900, mostrar_en_website: true },
    { referencia: '8182', descripcion: 'CONJUNTO BEBE PREMIUM', curva: 'BEBÉS', precio_L1_base: 70900, mostrar_en_website: true },
    { referencia: '2552', descripcion: 'CONJUNTO JUNIOR BASICO', curva: 'JUNIOR', precio_L1_base: 43900, mostrar_en_website: true },
    { referencia: '1989', descripcion: 'OVEROL BEBE', curva: 'MESES', precio_L1_base: 65000, mostrar_en_website: true }
  ]);

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('productos').select('*');
      if (data && data.length > 0) setProductos(data);
    }
    cargar();

    // Inyectar Script Oficial de Wompi Widget
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const getPrecioTienda = (p: Producto) => {
    if (esMayorista) return p.precio_L1_base;
    return Math.round((p.precio_L1_base * 1.7) / 100) * 100 - 100;
  };

  const agregarAlCarrito = (ref: string) => {
    setCarrito(prev => ({ ...prev, [ref]: (prev[ref] || 0) + 1 }));
    setMensaje(`🛒 Referencia ${ref} agregada al carrito de compras.`);
  };

  const totalUnidadesCarrito = Object.values(carrito).reduce((a, b) => a + b, 0);
  const totalPagarCOP = productos.reduce((acc, p) => acc + ((carrito[p.referencia] || 0) * getPrecioTienda(p)), 0);

  const loginMayorista = () => {
    if (!nitMayorista) {
      setMensaje('⚠️ Ingresa un NIT válido.');
      return;
    }
    setEsMayorista(true);
    setMensaje(`🎉 Tarifa L1 Mayorista activada para NIT: ${nitMayorista}`);
  };

  // Abrir Modal Oficial de Wompi en Modo Producción
  const abrirWompiProduccion = () => {
    if (totalPagarCOP === 0) {
      setMensaje('⚠️ El carrito está vacío.');
      return;
    }

    const referenciaWompi = `PED-${Date.now()}`;
    const valorEnCentavos = totalPagarCOP * 100;

    // @ts-ignore
    if (typeof WidgetCheckout !== 'undefined') {
      // @ts-ignore
      const checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: valorEnCentavos,
        reference: referenciaWompi,
        publicKey: wompiPublicKey,
        redirectUrl: 'https://pequix-erp-core.vercel.app'
      });

      checkout.open(async (result: any) => {
        const transaction = result.transaction;
        if (transaction && transaction.status === 'APPROVED') {
          await supabase.from('pedidos').insert([{
            tenant_id: 'EMP-0001',
            codigo_pedido: referenciaWompi,
            vendedor_nombre: esMayorista ? `Mayorista (${nitMayorista})` : 'Cliente Web B2C',
            lista_aplicada: esMayorista ? 'L1_MAYORISTA' : 'L3_DETAL',
            total_prendas: totalUnidadesCarrito,
            subtotal_cop: totalPagarCOP,
            estado: 'PAGADO_PRODUCCION_WOMPI'
          }]);

          setMensaje(`✅ ¡Pago REAL APROBADO con Wompi por $ ${totalPagarCOP.toLocaleString('es-CO')} COP! Orden: ${referenciaWompi}`);
          setCarrito({});
        }
      });
    } else {
      setMensaje('⏳ Cargando pasarela Wompi... Intenta de nuevo en un segundo.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header E-Commerce Pequix */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ backgroundColor: esMayorista ? '#10b981' : '#38bdf8', color: '#022c22', fontWeight: '900', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              {esMayorista ? '🌐 PORTAL B2B MAYORISTA AUTORIZADO' : '🛍️ TIENDA VIRTUAL B2C (FJ KIDS)'}
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '8px 0 0 0', color: '#ffffff' }}>Colección Infantil Confección Colombiana</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Pasarela en <strong style={{ color: '#10b981' }}>Producción Oficial Wompi Colombia ($ COP)</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPestana('TIENDA_WEB')} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: '#10b981', color: '#022c22' }}>
              🛍️ Tienda Web
            </button>
          </div>
        </div>

        {mensaje && (
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        {/* Login Mayorista */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '15px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {!esMayorista ? (
            <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1' }}>🔑 ¿Eres Mayorista?</span>
              <input
                type="text"
                placeholder="Ingresa tu NIT..."
                value={nitMayorista}
                onChange={(e) => setNitMayorista(e.target.value)}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fbbf24', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', outline: 'none' }}
              />
              <button onClick={loginMayorista} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#022c22', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                Acceder a Tarifa L1
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>✅ Tarifa Mayorista Activa (L1) para NIT: {nitMayorista}</span>
              <button onClick={() => setEsMayorista(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#334155', color: '#ffffff', fontSize: '11px', cursor: 'pointer' }}>
                Cerrar Sesión B2B
              </button>
            </div>
          )}
        </div>

        {/* Catálogo de Productos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
          {productos.filter(p => p.mostrar_en_website).map((p) => {
            const precio = getPrecioTienda(p);
            return (
              <div key={p.referencia} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '10px', backgroundColor: '#1e293b', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                    REF: {p.referencia} · {p.curva}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '900', margin: '10px 0 4px 0', color: '#ffffff' }}>
                    {p.descripcion}
                  </h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981' }}>
                    $ {precio.toLocaleString('es-CO')}
                  </span>
                  <button
                    onClick={() => agregarAlCarrito(p.referencia)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ➕ Agregar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen Financiero & Wompi Producción */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>Total a Pagar por Pasarela Wompi:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981' }}>
              $ {totalPagarCOP.toLocaleString('es-CO')} COP ({totalUnidadesCarrito} prendas)
            </div>
          </div>

          <button
            onClick={abrirWompiProduccion}
            disabled={totalUnidadesCarrito === 0}
            style={{
              padding: '14px 28px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '900',
              cursor: totalUnidadesCarrito > 0 ? 'pointer' : 'not-allowed',
              backgroundColor: totalUnidadesCarrito > 0 ? '#10b981' : '#334155',
              color: totalUnidadesCarrito > 0 ? '#022c22' : '#94a3b8',
              fontSize: '13px'
            }}
          >
            💳 Pagar con Wompi (Producción $ COP)
          </button>
        </div>

      </div>
    </div>
  );
}
