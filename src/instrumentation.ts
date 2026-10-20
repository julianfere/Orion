// Corre una vez al arrancar el servidor: migra la base y prende el programador de avisos.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.DATABASE_URL) {
    console.warn('[orion] sin DATABASE_URL: la app anda, pero los avisos push quedan apagados');
    return;
  }
  const { boot } = await import('./server/boot');
  await boot();
}
