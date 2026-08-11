import React from 'react';

export const metadata = {
  title: 'Pequix ERP Core',
  description: 'Sistema ERP SaaS Multi-Tenant para Sector Textil Infantil (FJ Kids)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#090d16' }}>
        {children}
      </body>
    </html>
  );
}
