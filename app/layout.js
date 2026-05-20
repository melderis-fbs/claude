import './globals.css';

export const metadata = {
  title: 'Dashboard Comercial',
  description: 'Panel de control de operaciones de ventas',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
