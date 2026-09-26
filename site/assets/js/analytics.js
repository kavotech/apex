/* Google Analytics uses basic consent mode: no Google script before opt-in. */
(function () {
  'use strict';

  var id = (window.APEX_CONFIG || {}).googleAnalyticsId;
  if (!/^G-[A-Z0-9]+$/.test(id || '')) return;

  var loaded = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window['ga-disable-' + id] = true;
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  function update(consent) {
    var allowed = !!(consent && consent.analytics);
    window['ga-disable-' + id] = !allowed;
    window.gtag('consent', 'update', {
      analytics_storage: allowed ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    if (!allowed || loaded) return;
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function init() {
    // Fail closed if the cookie preference component did not initialize.
    if (!window.PGConsent) return;
    update(window.PGConsent.get());
    window.addEventListener('pg:consent-change', function (event) { update(event.detail); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
