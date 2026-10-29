'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { LEVELS } from '@/lib/astro/core';
import type { AstroEvent } from '@/lib/astro/events';
import { haptic } from '@/lib/platform';
import { IconBell, IconChevron, IconMap, IconMoon, IconSky } from './icons';

const TABS = [
  { href: '/', label: 'Cielo', icon: <IconSky />, match: (p: string) => p === '/' || p.startsWith('/evento') },
  { href: '/luna', label: 'Luna', icon: <IconMoon />, match: (p: string) => p.startsWith('/luna') },
  { href: '/viajes', label: 'Viajes', icon: <IconMap />, match: (p: string) => p.startsWith('/viajes') },
  { href: '/alertas', label: 'Alertas', icon: <IconBell />, match: (p: string) => p.startsWith('/alertas') },
];

export function BottomNav() {
  const path = usePathname();
  if (path === '/bienvenida') return null;
  const cur = TABS.findIndex((t) => t.match(path));
  return (
    <nav className="nav" aria-label="Principal" style={{ ['--tab' as string]: Math.max(0, cur) } as CSSProperties}>
      {cur >= 0 && <span className="nav-pill" aria-hidden="true" />}
      {TABS.map((t, i) => {
        const on = i === cur;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            transitionTypes={[i > cur ? 'tab-fwd' : 'tab-back']}
            onClick={(e) => {
              haptic();
              // Tocar la pestaña en la que ya estás vuelve arriba.
              if (path === t.href) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            {t.icon}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LevelBadge({ level, big = false }: { level: AstroEvent['level']; big?: boolean }) {
  const l = LEVELS[level];
  return (
    <span className="badge" style={{ color: l.color, background: l.bg, marginTop: big ? 0 : 2, padding: big ? '4px 10px' : undefined }}>
      {l.label}
    </span>
  );
}

export function EventCard({ ev, href, index = 0 }: { ev: AstroEvent; href?: string; index?: number }) {
  return (
    <Link className="ev-card rise" href={href ?? ev.href} transitionTypes={['nav-forward']} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <div className="date-box">
        <span className="m">{ev.dayLabel.month}</span>
        <span className="d">{ev.dayLabel.day}</span>
      </div>
      <div className="col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{ev.title}</span>
        <span className="small muted">{ev.detail}</span>
        <LevelBadge level={ev.level} />
      </div>
      <IconChevron style={{ color: 'var(--ink-mute)', flex: 'none' }} />
    </Link>
  );
}

/** Fila con interruptor accesible (role="switch"). */
export function SwitchRow({ label, hint, on, onToggle }: { label: string; hint?: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="switch-row" role="switch" aria-checked={on} onClick={() => { haptic(); onToggle(); }}>
      <span className="col" style={{ flex: 1, gap: 2 }}>
        <span>{label}</span>
        {hint && <span className="small muted" style={{ fontWeight: 400 }}>{hint}</span>}
      </span>
      <span className="track"><span className="knob" /></span>
    </button>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg-group" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" className="seg" aria-pressed={v === value} onClick={() => { haptic(); onChange(v); }}>{l}</button>
      ))}
    </div>
  );
}

const SHEET_MS = 280;

/**
 * Hoja inferior sobre <dialog>: foco atrapado, Esc para cerrar y fondo inerte gratis.
 * Entra y sale deslizando, y se puede cerrar arrastrándola hacia abajo desde la manija.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  // El contenido sigue montado mientras dura la animación de salida.
  const [mounted, setMounted] = useState(open);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      setMounted(true);
      d.style.transform = '';
      if (!d.open) d.showModal();
      return;
    }
    if (d.open) d.close();
    const t = setTimeout(() => setMounted(false), SHEET_MS);
    return () => clearTimeout(t);
  }, [open]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    ref.current?.classList.add('dragging');
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dy = Math.max(0, e.clientY - drag.current.y);
    drag.current.dy = dy;
    ref.current.style.transform = `translateY(${dy}px)`;
  };
  const onUp = () => {
    const d = ref.current;
    if (!drag.current || !d) return;
    const { dy } = drag.current;
    drag.current = null;
    d.classList.remove('dragging');
    // Pasado el umbral, termina de bajar desde donde quedó el dedo; si no, vuelve a su lugar.
    if (dy > Math.min(120, d.offsetHeight * 0.25)) {
      d.style.transform = 'translateY(100%)';
      haptic();
      onClose();
    } else d.style.transform = '';
  };

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {mounted && (
        <div className="sheet-body">
          <div className="sheet-handle" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <div className="grabber" />
            <h2 className="h2">{title}</h2>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Stat({ label, value, sub, solid = false }: { label: string; value: string; sub?: string; solid?: boolean }) {
  return (
    <div className={`stat${solid ? ' solid' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" title={value}>{value}</span>
      {sub && <span className="stat-label">{sub}</span>}
    </div>
  );
}

/** Tarjetas fantasma mientras se calculan los eventos. */
export function SkeletonCards({ count = 3, label }: { count?: number; label: string }) {
  return (
    <div className="col" style={{ gap: 10 }} role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel-card" style={{ animationDelay: `${i * 120}ms` }} aria-hidden="true">
          <div className="skel" style={{ width: 52, height: 56, borderRadius: 12 }} />
          <div className="col" style={{ flex: 1, gap: 8 }}>
            <div className="skel" style={{ width: '70%', height: 14 }} />
            <div className="skel" style={{ width: '45%', height: 11 }} />
            <div className="skel" style={{ width: 72, height: 18, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
