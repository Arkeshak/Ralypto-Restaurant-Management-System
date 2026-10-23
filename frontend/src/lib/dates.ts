export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatElapsedMinutes(minutes: number): string {
  const m = Math.floor(minutes);
  const s = Math.floor((minutes - m) * 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
