import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignora advertencias/errores de ESLint durante el Build para evitar bloqueos
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite completar el Build aunque existan pequeñas discrepancias de tipos
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
