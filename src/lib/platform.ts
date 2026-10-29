// Detección de plataforma. El script de abajo corre en <head> antes de pintar y marca <html>
// con data-platform="ios|android|other" y data-standalone="1|0", así el CSS puede ajustar
// márgenes (isla dinámica, barra de gestos, teclado) sin parpadeos.

export type Platform = 'ios' | 'android' | 'other';

export const PLATFORM_SCRIPT = `(function(){try{var d=document.documentElement,n=navigator,u=n.userAgent;var ios=/iphone|ipad|ipod/i.test(u)||(n.platform==='MacIntel'&&n.maxTouchPoints>1);var and=/android/i.test(u);d.dataset.platform=ios?'ios':and?'android':'other';d.dataset.standalone=(matchMedia('(display-mode: standalone)').matches||n.standalone===true)?'1':'0'}catch(e){}})()`;

export function platform(): Platform {
  if (typeof document === 'undefined') return 'other';
  const p = document.documentElement.dataset.platform;
  return p === 'ios' || p === 'android' ? p : 'other';
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** Vibración corta al tocar controles. Solo Android la admite; en iPhone no hace nada. */
export function haptic(ms = 8) {
  if (platform() !== 'android') return;
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

type Router = { back(): void; push(href: string, o?: { transitionTypes?: string[] }): void };

/**
 * Volver con animación. React aplica el "atrás" del historial de forma sincrónica y no anima,
 * así que la foto de la pantalla actual se toma antes de volver y el CSS la desliza a la
 * derecha (html[data-nav-dir='back-root']). El atrás del sistema sigue sin animación.
 */
export function goBack(router: Router, fallback = '/') {
  if (window.history.length <= 1) return router.push(fallback, { transitionTypes: ['nav-back'] });
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };
  if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return router.back();
  const html = document.documentElement;
  html.dataset.navDir = 'back-root';
  const t = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        // Después del popstate React pinta la pantalla anterior en el mismo ciclo; se espera un cuadro.
        window.addEventListener('popstate', () => requestAnimationFrame(() => resolve()), { once: true });
        setTimeout(resolve, 600);
        router.back();
      }),
  );
  t.finished.finally(() => {
    if (html.dataset.navDir === 'back-root') delete html.dataset.navDir;
  });
}
