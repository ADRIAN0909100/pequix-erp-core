import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  try {
    // Consulta a Supabase PostgreSQL
    const res = await fetch(`${supabaseUrl}/rest/v1/productos?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      cache: 'no-store'
    });

    const productos = await res.json();

    return NextResponse.json({
      success: true,
      tenant_id: 'EMP-0001',
      total_referencias: Array.isArray(productos) ? productos.length : 0,
      moneda: 'COP',
      data: productos
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al consultar productos' }, { status: 500 });
  }
}
