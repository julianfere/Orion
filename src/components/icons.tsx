// Íconos de trazo, copiados del canvas.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20, sw = 2) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const IconSky = ({ size = 22, ...p }: P) => <svg {...base(size, 1.8)} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>;
export const IconMoon = ({ size = 22, ...p }: P) => <svg {...base(size, 1.8)} {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>;
export const IconMap = ({ size = 22, ...p }: P) => <svg {...base(size, 1.8)} {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>;
export const IconBell = ({ size = 22, ...p }: P) => <svg {...base(size, 1.8)} {...p}><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
export const IconPin = ({ size = 16, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z" /><circle cx="12" cy="10" r="2" /></svg>;
export const IconEye = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
export const IconBack = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M15 6l-6 6 6 6" /></svg>;
export const IconChevron = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M9 6l6 6-6 6" /></svg>;
export const IconShare = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 15V3M8 7l4-4 4 4" /><path d="M5 12v7h14v-7" /></svg>;
export const IconCheck = ({ size = 18, ...p }: P) => <svg {...base(size, 2.4)} {...p}><path d="M5 12l5 5 9-10" /></svg>;
export const IconRise = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 15V5M8 9l4-4 4 4" /><path d="M3 19h18" /></svg>;
export const IconSet = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 5v10M8 11l4 4 4-4" /><path d="M3 19h18" /></svg>;
export const IconCloud = ({ size = 36, ...p }: P) => <svg {...base(size, 1.6)} {...p}><path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5 4.25 4.25 0 0 0 7 18z" /></svg>;
export const IconCloudOk = ({ size = 16, ...p }: P) => <svg {...base(size)} {...p}><path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5 4.25 4.25 0 0 0 7 18z" /><path d="M9.5 13.5l2 2 3.5-3.5" /></svg>;
export const IconAltitude = ({ size = 36, ...p }: P) => <svg {...base(size, 1.6)} {...p}><path d="M3 20h18" /><path d="M5 20a7 7 0 0 1 14 0" /><path d="M12 13V8" /><circle cx="12" cy="6" r="1.5" /></svg>;
export const IconScope = ({ size = 22, ...p }: P) => <svg {...base(size, 1.8)} {...p}><path d="M3 21l4-4M7 17l2 2 10-10-2-2zM15 7l2-4 4 4-4 2" /></svg>;
export const IconFilter = ({ size = 22, ...p }: P) => <svg {...base(size, 1.8)} {...p}><circle cx="12" cy="12" r="5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
export const IconClose = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconTrash = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
export const IconLocate = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
