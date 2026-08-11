import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente_nombre, total_prendas, subtotal_cop, origen_sistema } = body;

    const codigoPedido = `API-${Math.floor(10000 + Math.random() * 90000)}`;

    // 1. Guardar Pedido en Supabase
    await fetch(`${supabaseUrl}/rest/v1/pedidos`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify([{
        tenant_id: 'EMP-0001',
        codigo_pedido: codigoPedido,
        vendedor_nombre: origen_sistema || 'Sincronización API (Siigo/Tiendanube)',
        total_prendas: total_prendas || 1,
        subtotal_cop: subtotal_cop || 0,
        estado: 'RECIBIDO_API_REST'
      }])
    });

    // 2. Insertar Traza Inmutable en Audit Log
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        tenant_id: 'EMP-0001',
        usuario_id: 'USR-API-REST',
        usuario_nombre: 'Conector API (Siigo / Tiendanube)',
        accion: 'SINCRONIZAR_PEDIDO_EXTERNO',
        entidad_afectada: 'PEDIDOS',
        entidad_id: codigoPedido,
        valor_nuevo: { cliente: cliente_nombre, total_cop: subtotal_cop, origen: origen_sistema }
      }])
    });

    return NextResponse.json({
      success: true,
      mensaje: '✨ Pedido sincronizado con éxito en Pequix ERP Core',
      codigo_pedido: codigoPedido,
      subtotal_cop: subtotal_cop
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error procesando sincronización de pedido' }, { status: 500 });
  }
}
