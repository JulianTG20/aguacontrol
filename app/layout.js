import "./globals.css";

// 1. Aquí configuramos la PWA (El Manifest)
export const metadata = {
  title: "AguaControl PWA",
  description: "Sistema de gestión de inventario",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 2. Este es el COMPONENTE DE REACT que Next.js estaba pidiendo
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}