/*!
 * SRU Brand Kit — shared header & footer for all ICTD / ITOC forms
 * حزمة الهوية — الترويسة والتذييل الموحّدان لجميع نماذج الإدارة
 * Version: 1.0  ·  Owner: IT Operations Center (ITOC), ICTD — Sulaiman Al Rajhi University
 *
 * USAGE (one line, before </body> or in <head> with defer):
 *   <script src="https://ictsru.github.io/ITOC/brand/sru-brand.js"
 *           data-form-title="اسم النموذج" data-form-version="v1.0" defer></script>
 *
 * Optional attributes on the <script> tag:
 *   data-form-title    Form name shown in the footer
 *   data-form-version  Form version shown in the footer (e.g. v1.8)
 *   data-header="off"  Do not render the logo header
 *   data-footer="off"  Do not render the footer
 *   data-print="show"  Keep header/footer when printing (default: hidden in print)
 *   data-assets="URL"  Override the logos folder (default: ../assets/ relative to this file)
 *
 * Placement: renders into <div data-sru-header></div> / <div data-sru-footer></div> if present,
 * otherwise the header is inserted at the top of <body> and the footer at the end.
 * Exposes window.SRUBrand { version, logos, hub, render() } and fires "sru-brand:ready" on document.
 */
(function () {
  'use strict';
  var VERSION = '1.0';
  var HUB = 'https://ictsru.github.io/ITOC/#forms';
  var script = document.currentScript || (function () {
    var s = document.querySelectorAll('script[src*="sru-brand"]'); return s[s.length - 1];
  })();
  var opt = function (k, d) { var v = script && script.getAttribute('data-' + k); return v == null || v === '' ? d : v; };
  var base;
  try { base = opt('assets', new URL('../assets/', script.src).href); } catch (e) { base = 'https://ictsru.github.io/ITOC/assets/'; }
  if (base.slice(-1) !== '/') base += '/';
  var LOGOS = { sru: base + 'sru-logo.png', ictd: base + 'ictd-logo.png', itoc: base + 'itoc-logo.png' };

  var CSS = [
    '.sru-bk-header{background:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 24px;border-bottom:1px solid rgba(80,30,140,.12);direction:rtl;font-family:Cairo,Tahoma,Arial,sans-serif}',
    '.sru-bk-header img{display:block;object-fit:contain}',
    '.sru-bk-header .sru-bk-sru{height:46px;max-width:290px}',
    '.sru-bk-header .sru-bk-ictd{height:64px;max-width:180px}',
    '.sru-bk-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 24px 18px;border-top:1px solid rgba(80,30,140,.12);background:#fff;direction:rtl;font-family:Cairo,Tahoma,Arial,sans-serif;color:#6b5a80;font-size:12px;line-height:1.7}',
    '.sru-bk-footer b{color:#3a1464}',
    '.sru-bk-footer .sru-bk-itoc{display:inline-flex;align-items:center;margin-inline-start:auto}',
    '.sru-bk-footer .sru-bk-itoc img{height:44px;display:block}',
    '.sru-bk-fb{display:none;font-weight:700;color:#501e8c;font-size:12px;line-height:1.4;border:1px solid rgba(80,30,140,.2);border-radius:4px;padding:6px 10px;text-align:center}',
    '@media (max-width:640px){.sru-bk-header{padding:8px 16px}.sru-bk-header .sru-bk-sru{height:32px}.sru-bk-header .sru-bk-ictd{height:44px}.sru-bk-footer{padding:10px 16px 16px}.sru-bk-footer .sru-bk-itoc img{height:36px}}'
  ].join('\n');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(src, cls, alt, fallback) {
    return '<span><img class="' + cls + '" src="' + src + '" alt="' + esc(alt) + '" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
      '<span class="sru-bk-fb">' + fallback + '</span></span>';
  }

  function render() {
    if (!document.getElementById('sru-brand-css')) {
      var st = document.createElement('style'); st.id = 'sru-brand-css';
      st.textContent = CSS + (opt('print', 'hide') === 'show' ? '' : '\n@media print{.sru-bk-header,.sru-bk-footer{display:none!important}}');
      document.head.appendChild(st);
    }
    // Header: university logo on the right, ICTD logo on the left (RTL order)
    if (opt('header', 'on') !== 'off' && !document.querySelector('.sru-bk-header')) {
      var h = document.createElement('header');
      h.className = 'sru-bk-header no-print'; h.setAttribute('role', 'banner');
      h.innerHTML =
        img(LOGOS.sru, 'sru-bk-sru', 'جامعة سليمان الراجحي · Sulaiman Al Rajhi University', 'جامعة سليمان الراجحي<br>Sulaiman Al Rajhi University') +
        img(LOGOS.ictd, 'sru-bk-ictd', 'الإدارة التنفيذية للاتصالات وتقنية المعلومات · ICTD', 'الإدارة التنفيذية للاتصالات<br>وتقنية المعلومات · ICTD');
      var hs = document.querySelector('[data-sru-header]');
      if (hs) hs.appendChild(h); else document.body.insertBefore(h, document.body.firstChild);
    }
    // Footer: form name + version (right), ITOC logo linked to the forms hub (bottom-left)
    if (opt('footer', 'on') !== 'off' && !document.querySelector('.sru-bk-footer')) {
      var title = opt('form-title', document.title || ''), ver = opt('form-version', '');
      var f = document.createElement('footer');
      f.className = 'sru-bk-footer no-print'; f.setAttribute('role', 'contentinfo');
      f.setAttribute('data-brand-kit', VERSION);
      f.innerHTML =
        '<span>' + (title ? '<b>' + esc(title) + '</b>' : '') + (ver ? ' — الإصدار <b>' + esc(ver) + '</b>' : '') +
        '<br>الإدارة التنفيذية للاتصالات وتقنية المعلومات · جامعة سليمان الراجحي © ' + new Date().getFullYear() + '</span>' +
        '<a class="sru-bk-itoc" href="' + HUB + '" target="_blank" rel="noopener" title="ITOC · IT Operations Center — مركز النماذج">' +
        img(LOGOS.itoc, 'sru-bk-itoc-img', 'ITOC · IT Operations Center', 'ITOC · IT Operations Center') + '</a>';
      var fs = document.querySelector('[data-sru-footer]');
      if (fs) fs.appendChild(f); else document.body.appendChild(f);
    }
    try { document.dispatchEvent(new CustomEvent('sru-brand:ready', { detail: window.SRUBrand })); } catch (e) {}
  }

  window.SRUBrand = { version: VERSION, logos: LOGOS, hub: HUB, render: render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
