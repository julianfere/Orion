import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AppEffects } from '@/components/AppEffects';
import { BottomNav } from '@/components/ui';
import { PLATFORM_SCRIPT } from '@/lib/platform';
import './globals.css';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Orion',
  description: 'El cielo de esta noche, calculado para donde estés. Funciona sin conexión.',
  applicationName: 'Orion',
  appleWebApp: { capable: true, title: 'Orion', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#070A14',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Android: el teclado achica la ventana en vez de tapar los campos.
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PLATFORM_SCRIPT }} />
      </head>
      <body>
        <div className="app">
          <main>{children}</main>
          <BottomNav />
        </div>
        <AppEffects />
      </body>
    </html>
  );
}
