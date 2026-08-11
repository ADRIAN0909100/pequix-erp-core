import React from 'react';

export const metadata = {
  title: 'Pequix ERP Core',
  description: 'Sistema ERP SaaS Multi-Tenant para Sector Textil Infantil (EMP-0001 / FJ Kids)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#090d16', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
