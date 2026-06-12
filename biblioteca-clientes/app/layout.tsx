import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Biblioteca de Clientes · Founders BS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;450;500;600&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="top">
          <div className="wrap">
            <div className="eyebrow">Founders BS · Equipo comercial</div>
            <h1>Biblioteca de clientes</h1>
            <p className="sub">
              Buscá por nombre, profesión o a quién ayuda, o abrí un nicho para ver todos sus clientes.
              Cada ficha indica si tiene caso de éxito listo para usar como prueba social.
            </p>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
