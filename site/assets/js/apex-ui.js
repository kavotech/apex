/* apexautocaremcr — UI layer: glass mobile drawer, cookie consent, scroll animations.
   Independent of the template's Webflow/GSAP scripts (it does not modify them). */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function ready(fn) {
    if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
  }

  /* =================================================================================
     1. Mobile drawer
     ================================================================================= */
  function initDrawer() {
    var btn = document.querySelector('.navbar_menu-button');
    if (!btn) return;
    var mq = window.matchMedia('(max-width: 991px)');
    var navLinks = [].slice.call(document.querySelectorAll('.navbar_menu .navbar_link'));
    var logo = document.querySelector('.navbar_logo-link .navbar_logo .apex-logo');

    var overlay = el('div', 'pg-drawer-overlay');
    overlay.setAttribute('aria-hidden', 'true');

    var items = navLinks.map(function (a, i) {
      var active = a.classList.contains('w--current') || a.getAttribute('aria-current') === 'page';
      return '<li style="--i:' + i + '"><a class="pg-drawer_link' + (active ? ' is-active' : '') + '" href="' + a.getAttribute('href') + '"' + (active ? ' aria-current="page"' : '') + '>' + a.textContent.trim() + '</a></li>';
    }).join('');

    var drawer = el('aside', 'pg-drawer',
      '<div class="pg-drawer_top">' +
        '<a class="pg-drawer_logo" href="/" aria-label="apexautocaremcr home">' + (logo ? logo.outerHTML : 'apexautocaremcr') + '</a>' +
        '<button type="button" class="pg-drawer_close" aria-label="Close menu">' +
          '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg>' +
        '</button>' +
      '</div>' +
      '<nav class="pg-drawer_nav" aria-label="Mobile"><ul class="pg-drawer_list">' + items + '</ul></nav>' +
      '<div class="pg-drawer_foot" style="--i:' + navLinks.length + '">' +
        '<a class="pg-drawer_cta" href="/contact#quote">BOOK NOW</a>' +
        '<div class="pg-drawer_meta"><a href="tel:+447414505029">+44 7414 505029</a><br><a href="https://wa.me/447414505029" target="_blank" rel="noopener">WhatsApp us</a></div>' +
      '</div>');
    drawer.id = 'pg-drawer';
    drawer.setAttribute('aria-label', 'Site menu');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-controls', 'pg-drawer');
    btn.setAttribute('aria-expanded', 'false');

    var closeBtn = drawer.querySelector('.pg-drawer_close');
    var lastFocus = null;
    var isOpen = false;
    var hideTimer = null;

    function focusables() {
      return [].slice.call(drawer.querySelectorAll('a[href], button:not([disabled])'));
    }
    function open() {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      clearTimeout(hideTimer);
      drawer.classList.remove('is-hidden'); overlay.classList.remove('is-hidden');
      drawer.removeAttribute('inert');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.classList.add('is-open');
      drawer.classList.add('is-open');
      root.classList.add('pg-lock');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
      void drawer.offsetWidth; // let the visibility flip apply before moving focus
      closeBtn.focus({ preventScroll: true });
    }
    function close(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('is-open');
      drawer.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      drawer.setAttribute('aria-hidden', 'true');
      root.classList.remove('pg-lock');
      hideTimer = setTimeout(function () { if (!isOpen) { drawer.classList.add('is-hidden'); overlay.classList.add('is-hidden'); } }, 420);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      if (returnFocus !== false) {
        var target = (lastFocus && lastFocus !== document.body && lastFocus.focus) ? lastFocus : btn;
        target.focus({ preventScroll: true });
      }
    }

    // Capture phase: take over the template's menu button before Webflow's own nav handler sees it.
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.navbar_menu-button');
      if (!b || !mq.matches) return;
      e.preventDefault(); e.stopImmediatePropagation();
      isOpen ? close() : open();
    }, true);
    document.addEventListener('keydown', function (e) {
      if (!mq.matches) return;
      var onBtn = e.target === btn;
      if (onBtn && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopImmediatePropagation(); isOpen ? close() : open(); return; }
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') { // keep focus inside the open drawer
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!drawer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    }, true);

    closeBtn.addEventListener('click', function () { close(); });
    overlay.addEventListener('click', function () { close(); });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a[href]')) close(false); // navigating away — no need to restore focus
    });

    function onChange(e) { if (!e.matches && isOpen) close(false); if (!e.matches) root.classList.remove('pg-lock'); }
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
    // belt and braces: some browsers/embedded views skip the media-query event on resize or rotation
    window.addEventListener('resize', function () {
      if (!mq.matches) { if (isOpen) close(false); root.classList.remove('pg-lock'); }
    });
    window.addEventListener('pageshow', function () { close(false); }); // bfcache: never come back with the drawer open
  }

  /* =================================================================================
     2. Cookie consent
     ================================================================================= */
  var CONSENT_KEY = 'pg_consent';
  var CONSENT_VERSION = 1;
  var CONSENT_DAYS = 180;

  var Consent = (function () {
    var listeners = [];

    function readRaw() {
      var m = document.cookie.match(new RegExp('(?:^|; )' + CONSENT_KEY + '=([^;]*)'));
      if (m) { try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { /* fall through */ } }
      try { var ls = localStorage.getItem(CONSENT_KEY); if (ls) return JSON.parse(ls); } catch (e) { /* storage blocked */ }
      return null;
    }
    function valid(c) {
      return c && c.v === CONSENT_VERSION && typeof c.t === 'number' && (Date.now() - c.t) < CONSENT_DAYS * 864e5;
    }
    function get() { var c = readRaw(); return valid(c) ? c : null; }
    function write(c) {
      var s = JSON.stringify(c);
      var secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = CONSENT_KEY + '=' + encodeURIComponent(s) + '; Max-Age=' + (CONSENT_DAYS * 86400) + '; Path=/; SameSite=Lax' + secure;
      try { localStorage.setItem(CONSENT_KEY, s); } catch (e) { /* ignore */ }
    }
    function has(cat) { var c = get(); return !!(c && c[cat]); }
    function activate() {
      // Optional scripts are written as <script type="text/plain" data-consent="analytics">…</script>
      // and only become live once that category has been allowed.
      [].slice.call(document.querySelectorAll('script[type="text/plain"][data-consent]')).forEach(function (s) {
        if (s.getAttribute('data-pg-done') || !has(s.getAttribute('data-consent'))) return;
        s.setAttribute('data-pg-done', '1');
        var n = document.createElement('script');
        [].slice.call(s.attributes).forEach(function (a) { if (a.name !== 'type' && a.name !== 'data-consent' && a.name !== 'data-pg-done') n.setAttribute(a.name, a.value); });
        n.text = s.text;
        s.parentNode.insertBefore(n, s.nextSibling);
      });
    }
    function save(analytics, marketing) {
      var c = { v: CONSENT_VERSION, t: Date.now(), essential: true, analytics: !!analytics, marketing: !!marketing };
      write(c);
      activate();
      listeners.forEach(function (fn) { try { fn(c); } catch (e) { /* ignore */ } });
      try { window.dispatchEvent(new CustomEvent('pg:consent-change', { detail: c })); } catch (e) { /* old browsers */ }
      return c;
    }
    return { get: get, has: has, save: save, activate: activate, onChange: function (fn) { listeners.push(fn); } };
  })();

  function initCookies() {
    var chevron = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.2l4 4 4-4"/></svg>';
    var box = el('div', 'pg-cookie',
      '<h2 class="pg-cookie_title" id="pg-cookie-title" tabindex="-1">Cookies &amp; your privacy</h2>' +
      '<p class="pg-cookie_text" id="pg-cookie-desc">We use one small cookie to remember your choice. With your permission we may also use analytics and marketing cookies to understand how the site is used and to improve our service. You can change your mind at any time using <strong>Cookie Settings</strong> in the footer. See our <a href="/privacy">Privacy Policy</a>.</p>' +
      '<div class="pg-cookie_actions">' +
        '<button type="button" class="pg-cookie_btn is-primary" data-act="accept">Accept all</button>' +
        '<button type="button" class="pg-cookie_btn" data-act="reject">Reject non-essential</button>' +
      '</div>' +
      '<button type="button" class="pg-cookie_link" data-act="customise" aria-expanded="false" aria-controls="pg-cookie-panel">Customise ' + chevron + '</button>' +
      '<div class="pg-cookie_panel" id="pg-cookie-panel"><div>' +
        '<div class="pg-cookie_cats">' +
          '<div class="pg-cookie_cat"><div><strong>Essential</strong><span>Remembers your cookie choice and keeps the site working. Always on; it does not track you.</span></div><label class="pg-switch"><input type="checkbox" checked disabled aria-label="Essential cookies (always on)"></label></div>' +
          '<div class="pg-cookie_cat"><div><strong>Analytics</strong><span>Helps us see which pages are used so we can improve the site.</span></div><label class="pg-switch"><input type="checkbox" data-cat="analytics" aria-label="Analytics cookies"></label></div>' +
          '<div class="pg-cookie_cat"><div><strong>Marketing</strong><span>Measures adverts and helps show relevant ones on other sites.</span></div><label class="pg-switch"><input type="checkbox" data-cat="marketing" aria-label="Marketing cookies"></label></div>' +
        '</div>' +
        '<p class="pg-cookie_note">We do not currently load any analytics or marketing tools. Your choices are stored now and will apply if we add them.</p>' +
        '<div class="pg-cookie_actions"><button type="button" class="pg-cookie_btn is-primary" data-act="save">Save preferences</button></div>' +
      '</div></div>');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'false');
    box.setAttribute('aria-labelledby', 'pg-cookie-title');
    box.setAttribute('aria-describedby', 'pg-cookie-desc');
    box.setAttribute('aria-hidden', 'true');
    box.setAttribute('inert', '');
    document.body.appendChild(box);

    var panel = box.querySelector('.pg-cookie_panel');
    var customise = box.querySelector('[data-act="customise"]');
    var cats = {
      analytics: box.querySelector('[data-cat="analytics"]'),
      marketing: box.querySelector('[data-cat="marketing"]')
    };
    var opener = null;

    function setPanel(openIt) {
      panel.classList.toggle('is-open', openIt);
      customise.setAttribute('aria-expanded', String(openIt));
    }
    function syncToggles() {
      var c = Consent.get();
      cats.analytics.checked = !!(c && c.analytics);
      cats.marketing.checked = !!(c && c.marketing);
    }
    function show(opts) {
      opts = opts || {};
      syncToggles();
      setPanel(!!opts.expanded);
      box.removeAttribute('inert');
      box.setAttribute('aria-hidden', 'false');
      void box.offsetWidth;
      box.classList.add('is-open');
      if (opts.focus) box.querySelector('#pg-cookie-title').focus({ preventScroll: true });
    }
    function hide() {
      box.classList.remove('is-open');
      box.setAttribute('inert', '');
      box.setAttribute('aria-hidden', 'true');
      if (opener && opener.focus) { opener.focus({ preventScroll: true }); opener = null; }
    }

    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'accept') { Consent.save(true, true); hide(); }
      else if (act === 'reject') { Consent.save(false, false); hide(); }
      else if (act === 'save') { Consent.save(cats.analytics.checked, cats.marketing.checked); hide(); }
      else if (act === 'customise') { setPanel(!panel.classList.contains('is-open')); }
    });
    box.addEventListener('keydown', function (e) {
      // Escape only closes the reopened settings view; a first-time visitor still has to choose.
      if (e.key === 'Escape' && Consent.get()) { e.preventDefault(); hide(); }
    });

    // "Cookie Settings" links (footer) reopen the panel
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (!a) return;
      e.preventDefault();
      opener = a;
      show({ expanded: true, focus: true });
    });

    Consent.activate();
    if (!Consent.get()) setTimeout(function () { show(); }, reduceMotion ? 0 : 900);

    window.PGConsent = {
      get: Consent.get, has: Consent.has, onChange: Consent.onChange,
      open: function () { show({ expanded: true, focus: true }); }
    };
  }

  /* =================================================================================
     3. Animations
     ================================================================================= */
  function initReveal() {
    if (!root.classList.contains('pg-anim') || !('IntersectionObserver' in window)) return;
    var mobileMotion = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;

    // [selector, variant, stagger (ms between siblings)]
    var specs = [
      ['main .text-size-s.text-style-muted', 'pg-up', 0],
      ['main .divider-white.text-style-muted, main .divider-black.text-style-muted', 'pg-line', 0],
      ['main h2, main .pg-ba-caption h3', 'pg-up', 0],
      ['.image-right_component > *:not(.text-size-s), .image-left_component > *:not(.text-size-s)', 'pg-up', 90],
      ['.intro_content-right', 'pg-up', 0],
      ['main .button-group', 'pg-up', 0],
      ['.pg-stat, .stats42_item, .gallery-details_item, .pg-areas > *', 'pg-up', 110],
      ['.recentwork_card', 'pg-zoom', 110],
      ['.pg-tile', 'pg-zoom', 90],
      ['.process_link-block', 'pg-left', 0],
      ['.timeline10_item', 'pg-up', 0],
      ['.image-right_image-wrapper, .image-left_image-wrapper, .stats42_image-wrapper', 'pg-clip', 0],
      ['.pg-ba-caption, .pg-filters', 'pg-up', 0],
      ['.form_form > *', 'pg-up', 80],
      ['.footer_left-wrapper > *, .footer_right-wrapper > *, .footer_bottom-wrapper', 'pg-up', 70]
    ];
    if (mobileMotion) {
      specs.push(
        ['.section_intro .intro_content-left, .section_logo .logo_component, .section_cta .cta_component', 'pg-up', 100],
        ['main .service_item', 'pg-up', 100]
      );
    }
    // things the template already animates (or that must stay put)
    var skip = '.section_hero, .section_header, .cta_top, .cta_bottom, [data="scroll-text"], .service_item, .hero_logo, .navbar_component, .modal_wrapper, .pg-drawer, .pg-cookie, .pg-lightbox, .header108_component, .map_content';
    if (mobileMotion) skip = skip.replace(', .service_item', '');

    var seen = new Set();
    var targets = [];
    specs.forEach(function (s) {
      var lastParent = null, idx = 0;
      [].slice.call(document.querySelectorAll(s[0])).forEach(function (n) {
        if (seen.has(n) || n.closest(skip)) return;
        seen.add(n);
        if (n.parentNode !== lastParent) { lastParent = n.parentNode; idx = 0; }
        var delay = s[2] ? Math.min(idx, 5) * s[2] : (s[1] === 'pg-line' ? 140 : 0);
        idx++;
        targets.push({ n: n, cls: s[1], d: delay });
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target;
        io.unobserve(n);
        n.classList.add('is-in');
        var wait = 1500 + (parseInt(n.style.getPropertyValue('--pg-d'), 10) || 0);
        setTimeout(function () { // hand the element back to its normal hover/press styles
          n.classList.remove('pg-reveal', 'pg-up', 'pg-left', 'pg-zoom', 'pg-line', 'pg-clip', 'is-in');
          n.style.removeProperty('--pg-d');
        }, wait);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (t) {
      t.n.style.setProperty('--pg-d', t.d + 'ms');
      t.n.classList.add('pg-reveal', t.cls);
      io.observe(t.n);
    });
  }

  function initCountUp() {
    if (!('IntersectionObserver' in window)) return;
    var nodes = [].slice.call(document.querySelectorAll('.pg-stat_number, .stats42_number'));
    if (!nodes.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        run(en.target);
      });
    }, { threshold: 0.6 });

    function run(n) {
      var final = n.getAttribute('data-final');
      var m = final.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!m || reduceMotion) { n.textContent = final; return; }
      var target = parseFloat(m[1]), suffix = m[2], dec = (m[1].split('.')[1] || '').length;
      var dur = 1500, t0 = null;
      function tick(ts) {
        if (t0 == null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        n.textContent = (target * e).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(tick); else n.textContent = final;
      }
      requestAnimationFrame(tick);
    }
    nodes.forEach(function (n) {
      var final = n.textContent.trim();
      n.setAttribute('data-final', final);
      n.setAttribute('aria-label', final);
      if (!reduceMotion) { var m = final.match(/^(\d+(?:\.\d+)?)(.*)$/); if (m) n.textContent = (0).toFixed((m[1].split('.')[1] || '').length) + m[2]; }
      io.observe(n);
    });
  }

  function initScrollFx() {
    if (reduceMotion) return;
    var bar = el('div', 'pg-progress');
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var mqSmall = window.matchMedia('(max-width: 991px)');
    var bgs = [].slice.call(document.querySelectorAll('.hero_background-image, .header_background-image'));
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop;
      var max = root.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      if (mqSmall.matches && y < window.innerHeight * 1.3) {
        var v = Math.round(y * 0.14) + 'px';
        bgs.forEach(function (b) { b.style.setProperty('--pg-py', v); });
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  ready(function () {
    initDrawer();
    initCookies();
    initReveal();
    initCountUp();
    initScrollFx();
  });
})();
