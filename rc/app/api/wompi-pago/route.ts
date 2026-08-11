import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalCOP, referencia } = body;

    const wompiPublicKey = 'pub_prod_nNuIXKqeLhROFF29YF7UIVBMItu6ryaN';
    const wompiIntegritySecret = 'prod_integrity_QxT16dnySpZOAlp7ME2kgPzA7Yz1GX9I';

    const valorEnCentavos = totalCOP * 100;
    const moneda = 'COP';

    // Construcción de la cadena de integridad exigida por Wompi
    const cadenaFirma = `${referencia}${valorEnCentavos}${moneda}${wompiIntegritySecret}`;
    
    // Hash SHA-256 de Servidor Seguro
    const firmaSHA256 = crypto
      .createHash('sha256')
      .update(cadenaFirma, 'utf8')
      .digest('hex');

    const redirectUrl = encodeURIComponent('https://pequix-erp-core.vercel.app');
    const urlCheckout = `https://checkout.wompi.co/p/?public-key=${wompiPublicKey}&currency=${moneda}&amount-in-cents=${valorEnCentavos}&reference=${referencia}&signature-integrity=${firmaSHA256}&redirect-url=${redirectUrl}`;

    return NextResponse.json({ success: true, checkoutUrl: urlCheckout, firma: firmaSHA256 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al generar la transacción de pago' }, { status: 500 });
  }
}
