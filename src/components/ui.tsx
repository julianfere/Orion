'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { LEVELS } from '@/lib/astro/core';
import type { AstroEvent } from '@/lib/astro/events';
import { IconBell, IconChevron, IconMap, IconMoon, IconSky } from './icons';

export function BottomNav() {
  const path = usePathname();
  if (path === '/bienvenida') return null;
  const items = [
    { href: '/', label: 'Cielo', icon: <IconSky />, on: path === '/' || path.startsWith('/evento') },
    { href: '/luna', label: 'Luna', icon: <IconMoon />, on: path.startsWith('/luna') },
    { href: '/viajes', label: 'Viajes', icon: <IconMap />, on: path.startsWith('/viajes') },
    { href: '/alertas', label: 'Alertas', icon: <IconBell />, on: path.startsWith('/alertas') },
  ];
  return (
    <nav className="nav" aria-label="Principal">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.on ? 'page' : undefined}>
          {i.icon}
          {i.label}
        </Link>
      ))}
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

export function EventCard({ ev, href }: { ev: AstroEvent; href?: string }) {
  return (
    <Link className="ev-card rise" href={href ?? ev.href}>
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
    <button type="button" className="switch-row" role="switch" aria-checked={on} onClick={onToggle}>
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
        <button key={v} type="button" className="seg" aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

/** Hoja inferior sobre <dialog>: foco atrapado, Esc para cerrar y fondo inerte gratis. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <div className="sheet-body">
          <div className="grabber" />
          <h2 className="h2">{title}</h2>
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
