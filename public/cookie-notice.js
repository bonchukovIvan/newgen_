(() => {
  if (window.__axogenCookieNoticeStarted) return;
  window.__axogenCookieNoticeStarted = true;
  const initialized = new WeakSet();

  function init() {
    document.querySelectorAll('[data-cookie-notice]').forEach((notice) => {
      if (initialized.has(notice)) return;
      initialized.add(notice);
      const key = 'axogen:cookie-notice:' + notice.getAttribute('data-cookie-notice');
      try {
        if (localStorage.getItem(key) === 'closed') return;
      } catch (_) {
        // The notice still works for this visit when browser storage is disabled.
      }
      notice.hidden = false;
      notice.querySelector('[data-cookie-dismiss]')?.addEventListener('click', () => {
        notice.hidden = true;
        try { localStorage.setItem(key, 'closed'); } catch (_) { /* Storage may be disabled. */ }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
  new MutationObserver(init).observe(document.documentElement, {childList: true, subtree: true});
})();
