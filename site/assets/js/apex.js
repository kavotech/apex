/* apexautocaremcr — gallery filter + lightbox, contact form, and small helpers.
   Sits alongside the template's Webflow / GSAP / Swiper scripts and does not change them. */
(function () {
  'use strict';

  var WA = 'https://wa.me/447414505029';

  /* ---------- Gallery: category filter ---------- */
  function initFilters() {
    var buttons = document.querySelectorAll('[data-filter]');
    var tiles = document.querySelectorAll('.pg-tile');
    var empty = document.querySelector('.pg-empty');
    if (!buttons.length || !tiles.length) return;

    function apply(cat) {
      var shown = 0;
      tiles.forEach(function (tile) {
        var match = cat === 'all' || tile.getAttribute('data-cat') === cat;
        if (match) {
          shown++;
          tile.hidden = false;
          requestAnimationFrame(function () { tile.classList.remove('is-hiding'); });
        } else {
          tile.classList.add('is-hiding');
          setTimeout(function () { if (tile.classList.contains('is-hiding')) tile.hidden = true; }, 350);
        }
      });
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        apply(btn.getAttribute('data-filter'));
      });
    });
  }

  /* ---------- Gallery: lightbox ---------- */
  function initLightbox() {
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.pg-tile'));
    if (!tiles.length) return;

    var box = document.createElement('div');
    box.className = 'pg-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Project photo');
    box.innerHTML =
      '<button class="pg-lightbox_btn pg-lightbox_close" type="button" aria-label="Close">&times;</button>' +
      '<button class="pg-lightbox_btn pg-lightbox_prev" type="button" aria-label="Previous photo">&larr;</button>' +
      '<img class="pg-lightbox_img" alt="">' +
      '<button class="pg-lightbox_btn pg-lightbox_next" type="button" aria-label="Next photo">&rarr;</button>';
    document.body.appendChild(box);

    var img = box.querySelector('.pg-lightbox_img');
    var idx = 0;
    var lastFocus = null;

    function visible() { return tiles.filter(function (t) { return !t.hidden; }); }

    function show(list, i) {
      var t = list[i];
      if (!t) return;
      idx = i;
      img.src = t.getAttribute('href');
      img.alt = t.getAttribute('data-alt') || '';
    }

    function open(tile) {
      var list = visible();
      lastFocus = document.activeElement;
      show(list, list.indexOf(tile));
      box.classList.add('is-open');
      requestAnimationFrame(function () { box.classList.add('is-visible'); });
      document.body.style.overflow = 'hidden';
      box.querySelector('.pg-lightbox_close').focus();
    }

    function close() {
      box.classList.remove('is-visible');
      setTimeout(function () { box.classList.remove('is-open'); img.removeAttribute('src'); }, 300);
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function step(d) {
      var list = visible();
      if (!list.length) return;
      show(list, (idx + d + list.length) % list.length);
    }

    tiles.forEach(function (tile) {
      tile.addEventListener('click', function (e) { e.preventDefault(); open(tile); });
    });
    box.querySelector('.pg-lightbox_close').addEventListener('click', close);
    box.querySelector('.pg-lightbox_prev').addEventListener('click', function () { step(-1); });
    box.querySelector('.pg-lightbox_next').addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Tab') {
        var buttons = box.querySelectorAll('button');
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = document.getElementById('quote-form');
    if (!form) return;
    var ok = document.getElementById('quote-success');
    var fail = document.getElementById('quote-fail');
    var btn = form.querySelector('[type="submit"]');

    function whatsappLink(d) {
      var lines = [
        'Hi apexautocaremcr, I would like to book a detail.',
        d.service ? 'Service: ' + d.service : '',
        d.postcode ? 'Postcode: ' + d.postcode : '',
        d.message ? d.message : '',
        d.name ? '— ' + d.name : ''
      ].filter(Boolean);
      return WA + '?text=' + encodeURIComponent(lines.join('\n'));
    }

    // Capture phase + stopImmediatePropagation so Webflow's generic form handler never takes this over.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      ok.classList.remove('is-visible');
      fail.classList.remove('is-visible');

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (data.company) return; // honeypot

      if (!form.checkValidity()) { form.reportValidity(); return; }

      btn.disabled = true;
      var original = btn.value || btn.textContent;
      if (btn.tagName === 'INPUT') btn.value = 'Sending…'; else btn.textContent = 'Sending…';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        form.reset();
        ok.classList.add('is-visible');
      }).catch(function () {
        var wa = fail.querySelector('[data-wa]');
        if (wa) wa.href = whatsappLink(data);
        fail.classList.add('is-visible');
      }).then(function () {
        btn.disabled = false;
        if (btn.tagName === 'INPUT') btn.value = original; else btn.textContent = original;
      });
    }, true);
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () { initFilters(); initLightbox(); initForm(); });
})();
