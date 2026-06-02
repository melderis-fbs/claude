import './globals.css';

export const metadata = {
  title: 'Founders BS — Comercial',
  description: 'Dashboard comercial Founders BS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
