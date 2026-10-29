'use client';
// Se vuelve a montar en cada navegación: anima la salida de la pantalla vieja y la entrada
// de la nueva con View Transitions. El tipo de navegación elige la dirección:
//   tab-fwd / tab-back  → cambio de pestaña (izquierda/derecha según el orden de la barra)
//   nav-forward         → entrar a un detalle
//   nav-back            → volver a una pantalla nueva (el botón Volver usa goBack)
//   sin tipo (enlaces sueltos) → .nav-auto, fundido suave
import { ViewTransition } from 'react';

const MAP = { 'tab-fwd': 'tab-fwd', 'tab-back': 'tab-back', 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'nav-auto' };

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={MAP} exit={MAP} default="none">
      <div className="screen">{children}</div>
    </ViewTransition>
  );
}
