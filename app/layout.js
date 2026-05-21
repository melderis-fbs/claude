import { Open_Sans } from 'next/font/google';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-open-sans',
});

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
      <body className={openSans.variable}>{children}</body>
    </html>
  );
}
