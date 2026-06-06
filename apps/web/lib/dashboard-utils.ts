export function saludoDesdeEmail(email: string): string {
  const local = email.split('@')[0] ?? 'dueño';
  const nombre = local.split(/[._-]/)[0] ?? local;
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export function saludoHorario(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function formatFechaLarga(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
