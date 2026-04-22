// ═══════════════════════════════════════════
// Toast Notifications
// ═══════════════════════════════════════════

export function show(message, duration = 2500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  // role="status" makes the toast announced by screen readers as it's added
  // to the aria-live="polite" container in index.html.
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 220);
  }, duration);
}
