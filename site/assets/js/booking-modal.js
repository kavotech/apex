/* Native dialog keeps booking choices accessible by touch, keyboard and screen reader. */
(function () {
  'use strict';
  function init() {
    var dialog = document.querySelector('.apex-booking-modal');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var trigger = null;
    var previousOverflow = '';
    document.querySelectorAll('[data-modal-trigger="quote"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        if (dialog.open) return;
        trigger = link;
        previousOverflow = document.body.style.overflow;
        dialog.showModal();
        dialog.scrollTop = 0;
        document.body.style.overflow = 'hidden';
      });
    });
    dialog.querySelector('[data-booking-close]').addEventListener('click', function () {
      dialog.close();
    });
    dialog.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        // Also dismiss when the enquiry form is an anchor on the current page.
        dialog.close();
      });
    });
    // A backdrop click targets the dialog itself, outside its visible bounds.
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', function () {
      document.body.style.overflow = previousOverflow;
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
