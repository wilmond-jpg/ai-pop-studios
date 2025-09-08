// src/analytics.js
export function initAnalytics() {
  const GA_ID = import.meta.env.VITE_GA_ID;

  // Only run in production and if an ID is present
  if (!GA_ID || !import.meta.env.PROD) return;

  // 1) Load gtag.js
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  // 2) Init dataLayer + gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_ID, {
    anonymize_ip: true,       // privacy-friendly
    send_page_view: false     // we’ll send page_view manually below
  });

  // 3) SPA-friendly page_view events
  const sendPV = () => {
    gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search
    });
  };

  // On first load
  sendPV();

  // On back/forward
  window.addEventListener("popstate", sendPV);

  // If your app ever changes history via pushState, hook it here:
  const _pushState = history.pushState;
  history.pushState = function(state, title, url) {
    const res = _pushState.apply(this, arguments);
    sendPV();
    return res;
  };
}
