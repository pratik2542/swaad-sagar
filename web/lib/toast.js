export function toast(message, type = 'info') {
  if (typeof window === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = message;
  el.style.position = 'fixed';
  el.style.right = '20px';
  el.style.bottom = '20px';
  el.style.padding = '10px 14px';
  el.style.background = type === 'error' ? '#ef4444' : '#111827';
  el.style.color = '#fff';
  el.style.borderRadius = '6px';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.addEventListener('transitionend', () => el.remove()); }, 2500);
}
