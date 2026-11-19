/* CleanFrame Home. Static materials, local preferences and public Tizen app controls. */
(function () {
  'use strict';

  /* ---------- Bundled data ---------- */
  var ASSETS = 'assets/', ICONS = ASSETS + 'icons/', WP = ASSETS + 'wallpapers/';
  var CAP = 9;
  var GRID_ROW = 240, GRID_COL = 344, COLS = 5;
  var ED_ROW = 80, ED_SEP = 56, ED_VIEW = 752;
  /* Home rails: a calm photo header, then one horizontal rail per section. */
  var RAIL_W = 1696, RAIL_GAP = 16, RAIL_SPACE = 52, RAIL_LABEL = 52, RAIL_FIRST = 588, RAIL_ANCHOR = 300, RAIL_FLOOR = 940;
  var HA_COLS = 4, HA_TILE_H = 136, HA_PITCH_X = 416, HA_ROW = 152, HA_HEAD = 72, HA_VIEW = 744;
  var WALL_VISIBLE = 6, WALL_ROW = 92, WALL_DELAY = 200;
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 27: 'back', 8: 'back', 10009: 'back', 461: 'back' };
  var FULL = 'Home holds nine apps. Remove one first.', LAST = 'Home needs one app';

  /* Known brands. The US set is the default Home; the others stay recognised so an existing
     saved Home keeps its apps. Numeric IDs suit older TVs; discovery replaces any ID with the
     one the TV reports. */
  var PRIMARY_APPS = [
    { id: 'netflix', name: 'Netflix', mark: true, appId: '3201907018807' },
    { id: 'youtube', name: 'YouTube', mark: true, appId: '111299001912' },
    { id: 'disneyplus', name: 'Disney+', mark: true, appId: '3201901017640' },
    { id: 'primevideo', name: 'Prime Video', mark: true, appId: '3201910019365' },
    { id: 'hbomax', name: 'HBO Max', mark: true, appId: '3201601007230' },
    { id: 'hulu', name: 'Hulu', mark: true, appId: '3201601007625' },
    { id: 'appletv', name: 'Apple TV', mark: true, appId: '3201807016597' },
    { id: 'plex', name: 'Plex', mark: false, appId: '3201512006963' },
    { id: 'spotify', name: 'Spotify', mark: true, appId: '3201606009684' },
    { id: 'stremio', name: 'Stremio', mark: true, appId: 'IkWsFHtOY9.Stremio' },
    { id: 'abciview', name: 'ABC iview', mark: true, appId: 'mWK87Xghap.ABCiview' },
    { id: 'sbs', name: 'SBS On Demand', mark: true, appId: 'OyE7OuxlUi.SBSOnDemand' },
    { id: 'applemusic', name: 'Apple Music', mark: true, appId: 'org.tizen.apple.apple-music' }
  ];
  var DEFAULT_HOME = ['netflix', 'youtube', 'disneyplus', 'primevideo', 'hbomax', 'hulu', 'appletv', 'plex', 'spotify'];
  var PRIMARY = PRIMARY_APPS.map(function (a) { return a.id; }), APPS = PRIMARY_APPS.slice(), ALPHA = [];
  var WALLS = window.CleanFrameWallpapers || [{ id: 'misty', name: 'Misty coast', tone: 'light', ut: { tr: 'mist', br: 'mist' }, frostVeil: .20 }];
  WALLS.forEach(function (w) { w.ut = w.ut || { tr: 'light', br: 'light' }; w.frostVeil = w.frostVeil || .12; });
  var MODES = [
    { id: 'fixed', name: 'Fixed', min: 0 }, { id: 'open', name: 'Each time Home opens', min: 0 },
    { id: '5', name: 'Every 5 minutes', min: 5 }, { id: '15', name: 'Every 15 minutes', min: 15 },
    { id: '60', name: 'Every hour', min: 60 }
  ];
  var KEY = 'cleanframe.home.v1', storageOk = true, catalog = { loading: false, loaded: false, error: null, request: 0, revision: 0 };
  var QA = window.ShoreQA = { minuteMs: window.ShoreQA && window.ShoreQA.minuteMs || 60000 };
  var FONTS = {
    manrope: { name: 'Manrope', family: 'Manrope', display: 600, ui: 500, clock: 500 },
    montreal: { name: 'Neue Montreal', family: 'Study Montreal', display: 300, ui: 400, clock: 300 },
    mori: { name: 'Mori', family: 'Study Mori', display: 200, ui: 400, clock: 200 },
    pangram: { name: 'Pangram Sans', family: 'Study Pangram', display: 300, ui: 400, clock: 300 },
    geist: { name: 'Geist', family: 'Study Geist', display: 300, ui: 400, clock: 300 },
    newsreader: { name: 'Newsreader', family: 'Study Newsreader', display: 400, ui: 400, clock: 400 }
  };
  var PRIVATE_FONTS = window.CleanFramePrivateFontIDs || [], fontMetrics = {}, unavailableFonts = {}, fontRevision = 0, fontsReady = false;
  var LOOK_VALUES = { bg: ['dark', 'light', 'photo', 'photos'], layout: ['list', 'dock'], apps: ['icons', 'both', 'text'], font: Object.keys(FONTS).filter(function (id) { return id === 'manrope' || PRIVATE_FONTS.indexOf(id) >= 0; }), controls: ['icons', 'both', 'text'], focus: ['type', 'glass'], material: ['soft', 'frost', 'tint'] };
  var LOOK_NAMES = { bg: 'Background', layout: 'Layout', apps: 'Apps', font: 'Font', controls: 'Home controls', focus: 'Focus', material: 'Material' };
  var VALUE_NAMES = { dark: 'Dark', light: 'Light', photo: 'Wallpaper', photos: 'My photos', list: 'List', dock: 'Dock', type: 'Type', glass: 'Glass', soft: 'Soft', frost: 'Frost', tint: 'Clear tint', icons: 'Icons', both: 'Icons and text', text: 'Text' };
  var UTIL = { inputs: ['Inputs', 'tv'], apps: ['All apps', 'apps'], settings: ['Settings', 'settings'] };
  var FEEDS = window.CleanFrameFeeds;
  var MSG = {
    leave: { title: 'Leave Home?', line: 'Open Samsung Home?', note: '', actions: [['stay', 'Stay'], ['samsung', 'Samsung Home']] }
  };
  var SVG = {
    art: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="9.8" r="1.5"/><path d="m4.5 17.5 4.5-4.5 3 3 2.5-2.5 5 5"/>',
    apps: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    arrange: '<path d="M4 8.5h14M15 5.5l3 3-3 3M20 15.5H6M9 12.5l-3 3 3 3"/>',
    settings: '<path d="m9 3-.6 2.4-2 1.2L4 6l-2 3.5L3.8 11v2L2 14.5 4 18l2.4-.6 2 1.2L9 21h6l.6-2.4 2-1.2 2.4.6 2-3.5-1.8-1.5v-2L22 9.5 20 6l-2.4.6-2-1.2L15 3Z"/><circle cx="12" cy="12" r="3.2"/>',
    home: '<path d="M4 11 12 4.5l8 6.5v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z"/>',
    undo: '<path d="M9 6 5 10l4 4"/><path d="M5 10h9.5a4.5 4.5 0 0 1 0 9H11"/>',
    check: '<path d="m5.5 12.5 4 4 9-9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    left: '<path d="m14.5 5-7 7 7 7"/>',
    right: '<path d="m9.5 5 7 7-7 7"/>',
    up: '<path d="m5 15.5 7-7 7 7"/>',
    down: '<path d="m5 8.5 7 7 7-7"/>',
    updown: '<path d="m7.5 9.5 4.5-4.5 4.5 4.5M7.5 14.5l4.5 4.5 4.5-4.5"/>',
    tv: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7"/>',
    warn: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.3v.1"/>'
  };

  /* ---------- State ---------- */
  var REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var S = {
    c: null, stack: null,
    sel: null, selIdx: 0, lastUtil: 0, appsFocus: null, settingsFocus: 'background', appearanceFocus: 'bg', detailFocus: {},
    undo: [], removedAt: {}, note: null, err: null,
    writes: 0, failed: 0, log: [], logN: 0, lastLaunch: null, press: null,
    wallShown: null, wallPending: null, wallError: null,
    shown: null, pending: null, lookError: null, bundleKey: null, previewBundle: null, reflow: false, fontSwitch: false
  };
  function pick(v, list, fallback) {
    v = String(v || '').toLowerCase();
    for (var i = 0; i < list.length; i++) if (list[i].toLowerCase() === v) return list[i];
    return fallback;
  }
  function lookOf(c) { return { bg: c.bg, wall: c.wall, layout: c.layout, apps: c.apps, font: c.font, controls: c.controls, focus: c.focus, material: c.material }; }
  function photoBg(c) { c = c || S.c; return c.bg === 'photo' || c.bg === 'photos'; }

  /* ---------- Helpers ---------- */
  function app(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i]; return null; }
  function wall(id) { for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === id) return WALLS[i]; return null; }
  function wallIndex(id) { for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === id) return i; return 0; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function without(list, id) { return list.filter(function (x) { return x !== id; }); }
  function same(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function onHome(id) { return S.c.home.indexOf(id) >= 0; }
  function top() { return S.stack[S.stack.length - 1]; }
  function push(e) { S.stack.push(e); return e; }
  function pop() { if (S.stack.length > 1) S.stack.pop(); }
  function px(n) { return n.toFixed(2) + 'px'; }
  function icon(name, cls, underlay) {
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">'
      + (underlay ? '<g class="ut-underlay" transform="translate(0 .5)">' + SVG[name] + '</g><g class="ut-ink">' + SVG[name] + '</g>' : SVG[name]) + '</svg>';
  }
  function badge(on) {
    return on
      ? '<svg class="badge is-on" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path class="badge-tick" d="m7.6 12.4 3 3 5.8-6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg class="badge is-off" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  }
  function log(text) { S.log.unshift('#' + (++S.logN) + ' ' + text); if (S.log.length > 10) S.log.pop(); }

  var maskSupport = 'webkitMaskImage' in document.documentElement.style || 'maskImage' in document.documentElement.style, markProbes = {};
  function probeMark(id) {
    if (markProbes[id]) return;
    var im = new Image(); markProbes[id] = 'loading';
    im.onload = function () { markProbes[id] = 'ok'; };
    im.onerror = function () {
      markProbes[id] = 'bad';
      Array.prototype.forEach.call(document.querySelectorAll('[data-mark="' + id + '"]'), function (el) { el.className += ' is-bad'; });
    };
    im.src = ICONS + id + '.svg';
  }
  /* Optical placement is identical for the CSS mask and the image fallback. */
  function markHtml(id, w, h, size) {
    var m = window.FrameIconMetrics && window.FrameIconMetrics[id], st;
    if (m) {
      var weight = clamp(Math.pow(0.45 / m.fill, 0.3), 0.84, 1.25);
      var k = Math.min(w / m.w, h / m.h, size * weight / Math.sqrt(m.w * m.h)), s = m.n * k;
      st = 'width:' + px(s) + ';height:' + px(s) + ';left:' + px(w / 2 - (m.x + m.w / 2) * k) + ';top:' + px(h / 2 - (m.y + m.h / 2) * k);
    } else st = 'width:' + w + 'px;height:' + h + 'px;left:0;top:0;object-fit:contain';
    probeMark(id);
    return '<span class="mark' + (markProbes[id] === 'bad' ? ' is-bad' : '') + '" data-mark="' + id + '" style="width:' + w + 'px;height:' + h + 'px">'
      + (maskSupport ? '<span class="mk" style="' + st + ';-webkit-mask-image:url(' + ICONS + id + '.svg);mask-image:url(' + ICONS + id + '.svg)"></span>' : '<img alt="" src="' + ICONS + id + '.svg" style="' + st + '">') + '</span>';
  }
  function appMark(a, w, h, size) {
    if (a.mark && (maskSupport || S.c.bg !== 'light')) return markHtml(a.brand || a.id, w, h, size);
    var words = a.name.split(/\s+/), letters = words[0].charAt(0) + (words.length > 1 ? words[1].charAt(0) : '');
    return '<span class="mark monogram' + (a.icon ? ' native-icon' : '') + '" style="width:' + w + 'px;height:' + h + 'px;font-size:' + Math.round(size * .65) + 'px"><span>' + esc(letters.toUpperCase()) + '</span>'
      + (a.icon ? '<img alt="" data-native-icon="true" src="' + esc(a.icon) + '">' : '') + '</span>';
  }
  function smallMark(a) { return appMark(a, 56, 44, 36); }
  var measureCanvas = document.createElement('canvas'), measureContext = measureCanvas.getContext('2d'), measureSpan = document.createElement('span');
  measureSpan.setAttribute('aria-hidden', 'true');
  measureSpan.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;white-space:pre;font-synthesis:none;';
  document.body.appendChild(measureSpan);
  function homeFont() { return S.shown && S.shown.font || 'manrope'; }
  function fontRole(id, role, size) {
    var f = FONTS[id], serif = id === 'newsreader';
    return { family: f.family,
      weight: role === 'display' ? f.display : role === 'clock' ? f.clock : serif ? 400 : f.ui,
      opsz: serif ? role === 'display' ? 72 : role === 'clock' ? 48 : role === 'ui' && (!size || size === 28) ? 28 : 36 : 0 };
  }
  function measureFace(id, faces) {
    var result = { roles: {}, digits: [], digitCell: 0 }, roles = { display: [88, 76, 56], clock: [48], primary: [30, 32, 34, 36, 40], ui: [28, 30, 48] };
    var face = id === 'newsreader' ? faces[0][0] : null, original = face ? face.variationSettings : '', r, widths, min, max;
    Object.keys(roles).forEach(function (role) {
      result.roles[role] = {};
      // Canvas has no optical-size property. Set this face's default only while measuring;
      // CSS specifies each rendered role explicitly, and the descriptor is restored below.
      roles[role].forEach(function (size) {
        r = fontRole(id, role, size);
        if (face) face.variationSettings = r.opsz ? '"opsz" ' + r.opsz : original;
        measureContext.font = r.weight + ' ' + size + 'px "' + r.family + '"';
        var m = measureContext.measureText('H'), d = measureContext.measureText('gjpqy');
        result.roles[role][size] = { cap: m.actualBoundingBoxAscent || size * .72, ascent: m.fontBoundingBoxAscent || size * 1.066, descent: m.fontBoundingBoxDescent || size * .3, lower: d.actualBoundingBoxDescent || size * .255 };
      });
    });
    if (face) face.variationSettings = original;
    r = fontRole(id, 'clock');
    measureSpan.style.font = r.weight + ' 48px/64px "' + r.family + '"';
    measureSpan.style.letterSpacing = '0'; measureSpan.style.fontVariantNumeric = 'tabular-nums';
    measureSpan.style.fontVariationSettings = r.opsz ? '"opsz" ' + r.opsz : 'normal';
    widths = '0123456789'.split('').map(function (n) { measureSpan.textContent = n; return measureSpan.getBoundingClientRect().width; });
    min = Math.min.apply(Math, widths); max = Math.max.apply(Math, widths);
    result.digits = widths; result.digitCell = max - min > .02 ? max : 0;
    return result;
  }
  function fontChoices() {
    LOOK_VALUES.font = Object.keys(FONTS).filter(function (id) { return id === 'manrope' || PRIVATE_FONTS.indexOf(id) >= 0 && !unavailableFonts[id]; });
  }
  function retryFontFaces(id) {
    // A rejected CSS FontFace cannot load again. Recreate only that failed family's
    // rules; the displayed family's faces and the rest of the stylesheet stay intact.
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var rules, i, rule, family, css;
      try { rules = sheet.cssRules; } catch (e) { return; }
      if (!rules) return;
      for (i = 0; i < rules.length; i++) {
        rule = rules[i];
        if (rule.type !== 5) continue;
        family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
        if (family !== FONTS[id].family) continue;
        css = rule.cssText; sheet.deleteRule(i); sheet.insertRule(css, i);
      }
    });
  }
  function loadFont(id, done) {
    var f = FONTS[id], weights = [f.display], timer, ended = false;
    if (fontMetrics[id]) { done(true); return; }
    if (!document.fonts || !document.fonts.load) { if (id === 'manrope') { fontMetrics.manrope = measureFace('manrope', []); fontsReady = true; done(true); } else done(false, 'unsupported'); return; }
    if (unavailableFonts[id]) retryFontFaces(id);
    if (id !== 'newsreader' && weights.indexOf(f.ui) < 0) weights.push(f.ui);
    function finish(ok, reason, faces) {
      if (ended) return;
      ended = true; clearTimeout(timer);
      if (ok) {
        fontMetrics[id] = measureFace(id, faces); delete unavailableFonts[id];
        // Cached markup belongs to a particular loaded font.
        fontRevision++;
        if (id === 'manrope') fontsReady = true;
      } else if (reason !== 'timeout') unavailableFonts[id] = true;
      fontChoices(); done(ok, reason);
    }
    timer = setTimeout(function () { finish(false, 'timeout'); }, 3000);
    Promise.all(weights.map(function (weight) { return document.fonts.load(weight + ' 88px "' + f.family + '"'); })).then(function (faces) {
      finish(faces.every(function (list) { return list.length > 0 && list.every(function (face) { return face.status === 'loaded'; }); }), 'load', faces);
    }, function () { finish(false, 'load'); });
  }
  var baselineRecovery = false;
  function ensureFont(id, done) {
    loadFont('manrope', function (ok, reason) {
      if (!ok && id === 'manrope') {
        // The local fallback keeps Home usable if the baseline face is slow or missing.
        fontMetrics.manrope = measureFace('manrope', []); fontMetrics.manrope.fallback = true; fontsReady = true;
        done(true, reason);
        if (!baselineRecovery && document.fonts && document.fonts.ready) {
          baselineRecovery = true;
          document.fonts.ready.then(function () {
            delete fontMetrics.manrope; delete unavailableFonts.manrope;
            loadFont('manrope', function (loaded) {
              if (!loaded) { fontMetrics.manrope = measureFace('manrope', []); fontMetrics.manrope.fallback = true; fontsReady = true; }
              render();
            });
          });
        }
        return;
      }
      if (!ok || id === 'manrope') done(ok, reason); else loadFont(id, done);
    });
  }
  function fontShift(role, size) {
    var id = homeFont(), base = fontMetrics.manrope, metrics = fontMetrics[id], a, b;
    if (id === 'manrope' || !base || !metrics) return 0;
    a = base.roles[role][size]; b = metrics.roles[role][size];
    return (a.ascent - a.descent - a.cap - b.ascent + b.descent + b.cap) / 2;
  }

  /* Keyed children: elements persist by key so transforms animate instead of re-creating.
     Children are absolutely positioned, so DOM order never needs to change. */
  function keyed(parent, items, update) {
    var map = parent._k || (parent._k = {}), seen = {}, i, it, el, isNew, k;
    for (i = 0; i < items.length; i++) {
      it = items[i]; el = map[it.key]; isNew = !el;
      if (isNew) { el = document.createElement('div'); map[it.key] = el; }
      update(el, it, i);
      if (isNew) parent.appendChild(el);
      seen[it.key] = 1;
    }
    for (k in map) if (map.hasOwnProperty(k) && !seen[k]) { if (map[k].parentNode === parent) parent.removeChild(map[k]); delete map[k]; }
  }
  function setContent(el, sig, renderContent) {
    sig += '|' + catalog.revision + '|' + fontRevision;
    if (el._sig === sig) return;
    el.innerHTML = renderContent();
    el._sig = sig;
    Array.prototype.forEach.call(el.querySelectorAll('[data-native-icon]'), function (img) {
      function ready() { img.parentNode.classList.add('has-native-icon'); }
      function failed() { img.style.display = 'none'; img.parentNode.classList.remove('has-native-icon'); }
      img.onload = ready; img.onerror = failed;
      if (img.complete) { if (img.naturalWidth) ready(); else failed(); }
    });
  }
  function setHTML(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }
  function attrs(el, z, i, action) { el.setAttribute('data-z', z); el.setAttribute('data-i', String(i)); el.setAttribute('data-action', action); }

  /* ---------- Saved preferences ---------- */
  function safeId(id) { return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,160}$/.test(id) && ['constructor', 'prototype', '__proto__'].indexOf(id) < 0; }
  function safeIcon(path) { return typeof path === 'string' && path.length < 2048 && /^(?:\/[^\/]|file:\/\/\/|wgt-package:\/\/\/)/.test(path) ? path : ''; }
  function load() {
    var keys = [KEY, 'cleanframe.shore.v1'], raw, saved, i;
    for (i = 0; i < keys.length; i++) {
      try {
        raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        saved = JSON.parse(raw);
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
      } catch (e) { storageOk = false; }
    }
    return null;
  }
  /* A saved store ID for a now-known brand becomes that brand, so it is not listed twice. */
  function canonical(id) {
    var brand = FrameDevice.brandOf ? FrameDevice.brandOf(id, '') : '';
    return brand && PRIMARY.indexOf(brand) >= 0 ? brand : id;
  }
  function clean(saved) {
    var s = saved && typeof saved === 'object' ? saved : {}, modern = s.look && typeof s.look === 'object' ? s.look : s;
    var legacyList = s.theme === 'list', h = [], recent = [], records = Array.isArray(s.appRecords) ? s.appRecords : [];
    records.slice(0, 256).forEach(function (a) {
      if (!a || !safeId(a.id) || !safeId(a.appId) || typeof a.name !== 'string' || !a.name.trim() || app(a.id) || canonical(a.id) !== a.id) return;
      APPS.push({ id: a.id, appId: a.appId, name: a.name.slice(0, 160), brand: ['hbomax', 'spotify', 'tubi'].indexOf(a.brand) >= 0 ? a.brand : '', mark: ['hbomax', 'spotify', 'tubi'].indexOf(a.brand) >= 0, icon: safeIcon(a.icon) });
    });
    (Array.isArray(s.home) ? s.home : Array.isArray(s.dock) ? s.dock : []).forEach(function (id) {
      if (!safeId(id)) return;
      id = canonical(id);
      if (h.indexOf(id) >= 0 || h.length >= CAP) return;
      if (!app(id) && id.indexOf('.') > 0) APPS.push({ id: id, appId: id, name: id.split('.').pop(), mark: false });
      if (app(id)) h.push(id);
    });
    if (!h.length) h = DEFAULT_HOME.slice();
    (Array.isArray(s.recent) ? s.recent : []).forEach(function (id) { if (safeId(id)) id = canonical(id); if (safeId(id) && app(id) && h.indexOf(id) < 0 && recent.indexOf(id) < 0 && recent.length < 5) recent.push(id); });
    return {
      bg: pick(modern.bg, LOOK_VALUES.bg, legacyList ? 'dark' : 'photo'), layout: pick(modern.layout, LOOK_VALUES.layout, legacyList ? 'list' : 'dock'),
      apps: pick(modern.apps, LOOK_VALUES.apps, legacyList ? 'text' : 'both'), controls: pick(modern.controls, LOOK_VALUES.controls, 'both'),
      focus: pick(modern.focus, LOOK_VALUES.focus, legacyList ? 'type' : 'glass'), material: pick(modern.material, LOOK_VALUES.material, 'soft'),
      font: pick(modern.font, LOOK_VALUES.font, 'manrope'), wall: wall(modern.wall || s.wallpaper) ? modern.wall || s.wallpaper : WALLS[0].id,
      home: h, recent: recent, lastApp: h.indexOf(canonical(String(s.lastApp))) >= 0 ? canonical(String(s.lastApp)) : h[0],
      mode: pick(s.mode, MODES.map(function (m) { return m.id; }), 'fixed')
    };
  }
  function serialise(c) {
    var out = {};
    Object.keys(c).forEach(function (key) { out[key] = c[key]; });
    out.version = 2; out.look = lookOf(c); out.dock = c.home.slice(); out.wallpaper = c.wall;
    out.theme = c.layout === 'list' ? 'list' : 'shore';
    out.appRecords = [];
    c.home.concat(c.recent).forEach(function (key) {
      var a = app(key);
      if (a && PRIMARY.indexOf(key) < 0 && !out.appRecords.some(function (r) { return r.id === key; })) out.appRecords.push({ id: a.id, appId: a.appId, name: a.name, brand: a.brand || '', icon: a.icon || '' });
    });
    return out;
  }
  function initialise() {
    var saved = load(), initial; S.c = clean(saved); initial = next(S.c.home.slice(), S.c.recent.slice());
    S.stack = [{ id: 'home', f: { zone: 'rails', u: 0, r: 0, at: {} } }];
    S.sel = S.c.lastApp; S.selIdx = S.c.home.indexOf(S.sel);
    if (saved && initial.mode === 'open') initial.wall = WALLS[(wallIndex(initial.wall) + 1) % WALLS.length].id;
    // Keep the old schema keys alongside the builder values for in-place updates.
    try { localStorage.setItem(KEY, JSON.stringify(serialise(initial))); S.c = initial; storageOk = true; } catch (e) { storageOk = false; }
  }
  function clearSession() { S.undo = []; S.removedAt = {}; S.note = null; S.err = null; }
  function begin() { S.note = null; }
  function next(home, recent) { var c = lookOf(S.c); c.home = home; c.recent = recent; c.lastApp = S.c.lastApp; c.mode = S.c.mode; return c; }
  function snap() { return { home: S.c.home.slice(), recent: S.c.recent.slice() }; }
  function pushRecent(list, id) { return [id].concat(without(list, id)).slice(0, 5); }
  function write(c, label) {
    try { localStorage.setItem(KEY, JSON.stringify(serialise(c))); }
    catch (e) { storageOk = false; S.failed++; S.err = label; log('Not saved: ' + label); return false; }
    if (c.wall !== S.c.wall || c.mode !== S.c.mode) resetRotation();
    storageOk = true; S.c = c; S.writes++; S.err = null; log('Saved: ' + label);
    return true;
  }
  function errText(lifted) {
    return 'Couldn’t save. Nothing changed.';
  }
  function statusHtml(def, lifted) {
    if (S.err) return '<span class="warn error-chip">' + esc(errText(lifted)) + '</span>';
    return esc(S.note || def);
  }

  function ensureSel() {
    var h = S.c.home, i;
    if (!h.length) { S.sel = null; return -1; }
    i = h.indexOf(S.sel);
    if (i < 0) { i = clamp(S.selIdx, 0, h.length - 1); S.sel = h[i]; }
    S.selIdx = i;
    return i;
  }
  function setSel(id) { S.sel = id; S.selIdx = S.c.home.indexOf(id); }

  /* Membership and order operations shared by B and C. A works on slots (below). */
  function homeRemove(id) {
    var a = app(id), i = S.c.home.indexOf(id), before = snap(), h;
    if (i < 0) return false;
    if (S.c.home.length <= 1) { S.note = LAST; return false; }
    h = S.c.home.slice(); h.splice(i, 1);
    if (!write(next(h, pushRecent(S.c.recent, id)), 'Remove ' + a.name + ' from Home')) return false;
    S.removedAt[id] = i;
    S.undo.push({ label: 'Remove ' + a.name, snap: before });
    return true;
  }
  function homeAdd(id) {
    var a = app(id), before = snap(), h = S.c.home.slice(), at;
    if (h.length >= CAP) { S.note = FULL; return false; }
    at = S.removedAt.hasOwnProperty(id) ? Math.min(S.removedAt[id], h.length) : h.length;
    h.splice(at, 0, id);
    if (!write(next(h, without(S.c.recent, id)), 'Add ' + a.name + ' to Home')) return false;
    S.undo.push({ label: 'Add ' + a.name, snap: before });
    return true;
  }
  function homeMove(order, id, before) {
    var a = app(id);
    if (!write(next(order, S.c.recent.slice()), 'Move ' + a.name)) return false;
    S.undo.push({ label: 'Move ' + a.name, snap: before });
    return true;
  }
  function undoLast(arr) {
    var u = S.undo[S.undo.length - 1];
    if (!u) { S.note = 'Nothing to undo'; return false; }
    if (!write(next(u.snap.home.slice(), u.snap.recent.slice()), 'Undo ' + u.label)) return false;
    S.undo.pop();
    S.note = 'Undone: ' + u.label + '.';
    return true;
  }
  function undoLabel() { var u = S.undo[S.undo.length - 1]; return u ? u.label : ''; }
  function undoCaption() { var label = undoLabel(); return label ? 'Undo ' + label.charAt(0).toLowerCase() + label.slice(1) : 'Nothing to undo'; }
  function editStatus(hint, move) {
    if (S.err) return statusHtml('', !!move);
    if (S.note === FULL || S.note === LAST) return '<span class="warn">' + esc(S.note) + '</span>';
    if (hint === FULL || hint === LAST) return '<span class="warn">' + esc(hint) + '</span>';
    return esc(move || hint || S.note || '');
  }

  var busy = false, busyTimer = 0;
  function release() { busy = false; clearTimeout(busyTimer); S.press = null; }
  function message(title, line, note) {
    push({ id: 'message', msg: 'error', content: { title: title, line: line, note: note || '', actions: [['back', 'Back']] }, f: { b: 0 } });
  }
  function perform(title, run) {
    if (busy) return;
    busy = true; busyTimer = setTimeout(release, 10000);
    run(function (err) {
      release();
      if (err) message(title, err.message || 'The TV could not open this screen.', err.detail || '');
      render(); syncRotation();
    });
  }
  function launch(id) {
    var a = app(id), c;
    if (!a || busy) return;
    if (S.c.home.indexOf(id) >= 0) { c = next(S.c.home.slice(), S.c.recent.slice()); c.lastApp = id; write(c, 'Last app'); }
    S.press = id; S.lastLaunch = a.name;
    perform(a.name, function (done) { FrameDevice.launchApp(a.appId, done); });
  }
  function refreshCatalog() {
    var request, oldFocus;
    if (catalog.loading) return;
    request = ++catalog.request; catalog.loading = true; catalog.error = null;
    FrameDevice.apps(function (err, entries) {
      if (request !== catalog.request) return;
      catalog.loading = false;
      if (err) { catalog.error = err.message || 'Could not read installed apps.'; if (!catalog.loaded) ALPHA = []; render(); return; }
      oldFocus = top().id === 'apps' ? ALPHA[top().f.i] : null;
      ALPHA = [];
      entries.forEach(function (entry) {
        var id = PRIMARY.indexOf(entry.brand) >= 0 ? entry.brand : entry.appId, a;
        if (!safeId(id) || !safeId(entry.appId) || ALPHA.indexOf(id) >= 0) return;
        a = app(id);
        if (!a) { a = { id: id }; APPS.push(a); }
        a.appId = entry.appId; a.brand = entry.brand || ''; a.mark = !!entry.brand;
        a.icon = safeIcon(entry.icon);
        a.name = PRIMARY.indexOf(id) >= 0 ? PRIMARY_APPS[PRIMARY.indexOf(id)].name : String(entry.name).slice(0, 160);
        ALPHA.push(id);
      });
      ALPHA.sort(function (a, b) { return app(a).name.toLowerCase().localeCompare(app(b).name.toLowerCase()); });
      catalog.loaded = true; catalog.error = null; catalog.revision++;
      if (top().id === 'apps' && oldFocus && ALPHA.indexOf(oldFocus) >= 0) top().f.i = ALPHA.indexOf(oldFocus);
      norm(); render();
    });
  }

  /* ---------- Navigation targets ---------- */
  function utils() {
    var u = ['apps', 'settings'];
    if (!FrameDevice.supportsInputs || FrameDevice.supportsInputs()) u.unshift('inputs');
    return u;
  }
  function utilAction(u) {
    if (u === 'inputs') openInputs('home');
    else if (u === 'apps') openApps();
    else openSettings();
  }
  function addAppsRoute() { openEditor('home'); }
  function openSettings() { push({ id: 'settings', f: { id: S.settingsFocus } }); }
  function openAppearance(group) {
    var axis = { background: 'bg', layout: 'layout', typography: 'font', focus: 'focus' }[group];
    var action = S.detailFocus[group] || (axis ? 'choice.' + axis + '.' + S.c[axis] : group === 'rotation' ? 'rotation.' + S.c.mode : 'samsung.home');
    push({ id: 'appearance', group: group, f: { action: action } });
  }
  function openMessage(key) { push({ id: 'message', msg: key, f: { b: 0 } }); }
  function openApps() {
    var e = { id: 'apps', mode: 'browse', top: 0, f: { zone: 'grid', i: Math.max(0, ALPHA.indexOf(S.appsFocus)), h: 0 } };
    push(e); refreshCatalog(); return e;
  }
  function openEditor(origin) {
    var i = ensureSel();
    clearSession();
    refreshCatalog();
    push({ id: 'editor', origin: origin, lifted: null, top: 0, otherReturn: { id: otherList()[0] || null, index: 0, top: 0 }, f: { zone: S.c.home.length ? 'home' : 'other', i: Math.max(0, i), part: 'name', h: 1, j: 0 } });
  }
  function openWallpaper() {
    var i = wallIndex(S.c.wall);
    S.err = null; S.wallError = null;
    push({ id: 'wallpaper', i: i, top: clamp(i - 2, 0, Math.max(0, WALLS.length - WALL_VISIBLE)), f: { zone: 'photo' },
      previewTimer: 0, previewDue: null, applyPending: null, failedId: null, failedApply: false, retryBundle: null });
  }
  function isSettingsDetail(t) { return t.id === 'appearance' || t.id === 'wallpaper'; }

  var V = {};

  /* ---------- Home rails ---------- */
  /* Each rail is a section of Home: the saved apps, then each configured integration.
     Focus moves along a rail with Left/Right and between rails with Up/Down. */
  var railNote = { text: '', rail: '', timer: 0 };
  function feed(name) { return FEEDS ? FEEDS.state(name) : { status: 'off' }; }
  function statusTile(name, st, label) {
    return { key: name + '.status', kind: 'status', w: 560, action: name + '.retry',
      text: st.status === 'error' ? st.error : 'Loading ' + label + '…', error: st.status === 'error' };
  }
  function shortHour(iso) { var h = parseInt(iso.slice(11, 13), 10); return (h % 12 || 12) + (h < 12 ? ' am' : ' pm'); }
  function weekday(date) { return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }); }
  function weatherItems(w) {
    var out = [{ key: 'wx.now', kind: 'now', w: 400, action: 'weather.now', data: w }], j;
    for (j = 1; j < 9; j++) if (w.hours[j * 2]) out.push({ key: 'wx.h' + j, kind: 'hour', w: 120, action: 'weather.hour.' + j, data: w.hours[j * 2] });
    w.days.slice(1, 6).forEach(function (d, i) { out.push({ key: 'wx.d' + i, kind: 'day', w: 120, action: 'weather.day.' + i, data: d }); });
    return out;
  }
  /* Plex keeps TV Dashboard's three groups in one row; each group's first poster carries
     its heading and a wider gap sets the groups apart. */
  var PLEX_GROUPS = { 'continue': 'Continue watching', tv: 'New TV', movie: 'New movies' };
  function plexItems(list) {
    var last = null, out = [];
    list.forEach(function (it, i) {
      var first = it.kind !== last;
      out.push({ key: 'plex.' + i + '.' + it.title, kind: 'poster', w: 160, action: 'plex.open.' + i, data: it,
        head: first ? PLEX_GROUPS[it.kind] || '' : '', lead: first && i ? 40 : 0 });
      last = it.kind;
    });
    return out.concat([{ key: 'plex.app', kind: 'more', w: 160, action: 'plex.app', lead: 40 }]);
  }
  function railList() {
    var rails = [], h = S.c.home, st;
    rails.push({ id: 'apps', label: '', h: 168, items: (h.length ? h.map(function (id) { return { key: 'app.' + id, kind: 'app', id: id, w: 176, action: 'home.app.' + id }; })
      : [{ key: 'add', kind: 'add', w: 360, action: 'home.add' }])
      // Moonlight closes the apps rail, with the gaming PC's status, as on TV Dashboard.
      .concat(FEEDS && FEEDS.configured('pc') ? [{ key: 'pc', kind: 'pc', w: 280, action: 'pc.open', data: FEEDS.pc.status() }] : []) });
    if (!FEEDS) return rails;
    st = feed('plex');
    if (st.status !== 'off') rails.push({ id: 'plex', label: 'Plex', h: 376, items: st.status === 'ready' ? plexItems(st.data) : [statusTile('plex', st, 'Plex')] });
    st = feed('home');
    if (st.status !== 'off') rails.push({ id: 'home', label: 'Home', h: 128, items: FEEDS.home.quick().map(function (q) {
      return { key: 'ha.' + q.key, kind: 'ha', w: 256, action: 'ha.run.' + q.key, data: q, stale: st.status === 'error' };
    }).concat([{ key: 'ha.rooms', kind: 'rooms', w: 256, action: 'ha.rooms' }]), note: st.status === 'error' ? st.error : '' });
    st = feed('sports');
    if (st.status !== 'off') rails.push({ id: 'sports', label: 'Sports', h: 136, items: st.status === 'ready'
      ? st.data.map(function (team, i) { return { key: 'team.' + i, kind: 'team', w: 400, action: 'sports.refresh.' + i, data: team }; })
      : [statusTile('sports', st, 'scores')] });
    st = feed('weather');
    if (st.status !== 'off') rails.push({ id: 'weather', label: 'Weather' + (st.data && st.data.place ? ' · ' + st.data.place : ''), h: 176,
      items: st.status === 'ready' ? weatherItems(st.data) : [statusTile('weather', st, 'the forecast')], note: st.status === 'ready' ? 'Weather data: ' + st.data.source : '' });
    return rails;
  }
  function railIndex(f, r) {
    if (r.id === 'apps') return f.atPc && r.items[r.items.length - 1].kind === 'pc' ? r.items.length - 1 : S.c.home.length ? Math.max(0, ensureSel()) : 0;
    return clamp(f.at[r.id] || 0, 0, r.items.length - 1);
  }
  function setRailIndex(f, r, i) {
    if (r.id === 'apps') { f.atPc = r.items[i].kind === 'pc'; if (!f.atPc && S.c.home.length) setSel(S.c.home[i]); }
    else f.at[r.id] = i;
  }
  function say(rail, text) {
    clearTimeout(railNote.timer);
    railNote.text = text; railNote.rail = rail;
    railNote.timer = setTimeout(function () { railNote.text = ''; render(); }, 5000);
  }
  function plexAppId() { var a = app('plex'); return catalog.loaded && a && ALPHA.indexOf('plex') >= 0 ? a.appId : FEEDS.plex.appId(); }
  /* ---------- Plex in-screen player (adapted from TV Dashboard) ----------
     Plays a Plex file in a full-screen <video> over Home and reports progress back to the
     server (resume points and watched state stay in sync with Plex's own apps), because the
     Plex TV app refuses playback started from another device. The panel offers resume and
     episode lists; the player draws its own subtitles from Plex's sidecar text streams.
     Direct play only: whether a given file plays depends on the TV's codecs, confirmed on the
     set, not here. */
  var plexPlayer = (function () {
    var REPORT_EVERY = 10000, WATCHED = 0.9, UP_NEXT = 10;
    var player = null, panel = null, panelEls = [], panelIdx = 0, busy = false;

    function clockText(s) {
      if (!isFinite(s)) return '--:--';
      s = Math.floor(s);
      var h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
      return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    }
    function epName(m) { return 'S' + m.parentIndex + ' · E' + m.index + ' · ' + m.title; }
    function label(m) { return m.type === 'episode' ? m.grandparentTitle + ' · ' + epName(m) : m.title; }
    function active() { return busy || panelOpen() || !!player; }
    function panelOpen() { return !!panel && !panel.hidden; }
    function videoPlaying() { return !!player; }

    /* ---------- resume / episode panel ---------- */
    function showPanel(html) {
      if (!panel) { panel = document.createElement('div'); panel.className = 'plex-panel'; stage.appendChild(panel); }
      panel.innerHTML = html; panel.hidden = false;
      panelEls = Array.prototype.slice.call(panel.querySelectorAll('[data-pa]'));
      setPanelFocus(0);
      return panel;
    }
    function setPanelFocus(i) {
      if (!panelEls.length) return;
      panelIdx = clamp(i, 0, panelEls.length - 1);
      panelEls.forEach(function (el, n) { el.className = el.className.replace(/\s*is-focus/g, '') + (n === panelIdx ? ' is-focus' : ''); });
      var el = panelEls[panelIdx];
      if (el.scrollIntoView) { try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { el.scrollIntoView(); } }
    }
    function closePanel() { if (panel) { panel.hidden = true; panel.innerHTML = ''; } panelEls = []; }
    function choiceHtml(pa, key, offset, text, cls) {
      return '<div class="pp-choice' + (cls ? ' ' + cls : '') + '" data-pa="' + pa + '" data-key="' + esc(String(key)) + '"' + (offset !== undefined ? ' data-offset="' + offset + '"' : '') + '>' + text + '</div>';
    }

    function open(key) {
      busy = true;
      return FEEDS.plex.meta(key).then(function (m) {
        busy = false;
        var off = m.viewOffset || 0, dur = m.duration || Infinity;
        if (off > 60000 && off < dur * 0.95) {
          showPanel('<h2 class="pp-title">' + esc(label(m)) + '</h2><p class="pp-hint-line">Back to close</p><div class="pp-choices">'
            + choiceHtml('start', key, off, '▶ Resume from ' + clockText(off / 1000))
            + choiceHtml('start', key, 0, '↺ Start from the beginning') + '</div>');
          after();
          return;
        }
        play(key, 0, m);
      }, function (e) { busy = false; message('Can’t open this (' + (e && e.message || 'error') + ')'); after(); });
    }
    function nextUp(eps) {
      var last = -1, i;
      eps.forEach(function (e, n) { if (e.viewCount) last = n; });
      for (i = last + 1; i < eps.length; i++) if (eps[i].viewOffset) return eps[i];
      return eps[last + 1] || eps[0];
    }
    function epRow(e, next) {
      var state = e.viewCount ? '<span class="pp-check">✓</span>'
        : e.viewOffset && e.duration ? '<span class="pp-mini"><i style="width:' + Math.round(e.viewOffset / e.duration * 100) + '%"></i></span>' : '';
      return '<div class="pp-ep' + (e.viewCount ? ' is-watched' : '') + (e === next ? ' is-next' : '') + '" data-pa="open" data-key="' + esc(String(e.ratingKey)) + '">'
        + '<span class="pp-num">' + e.index + '</span><span class="pp-ep-title">' + esc(e.title) + '</span>' + state + '</div>';
    }
    function openShow(showKey) {
      busy = true;
      return Promise.all([FEEDS.plex.meta(showKey), FEEDS.plex.episodes(showKey)]).then(function (r) {
        busy = false;
        var show = r[0], eps = r[1];
        if (!eps.length) { message('No episodes found'); after(); return; }
        var next = nextUp(eps), seasons = [], bySeason = {};
        eps.forEach(function (e) { if (!bySeason[e.parentIndex]) { bySeason[e.parentIndex] = []; seasons.push(e.parentIndex); } bySeason[e.parentIndex].push(e); });
        showPanel('<h2 class="pp-title">' + esc(show.title) + '</h2><p class="pp-hint-line">Back to close</p>'
          + '<div class="pp-next" data-pa="open" data-key="' + esc(String(next.ratingKey)) + '"><span class="pp-label">' + (next.viewOffset && !next.viewCount ? 'Continue' : 'Next up') + '</span>' + esc(epName(next)) + '</div>'
          + '<div class="pp-scroll">' + seasons.map(function (sn) {
            return '<div class="pp-season">Season ' + sn + '</div>' + bySeason[sn].map(function (e) { return epRow(e, next); }).join('');
          }).join('') + '</div>');
        after();
      }, function (e) { busy = false; message('Can’t open this show (' + (e && e.message || 'error') + ')'); after(); });
    }

    /* ---------- the video ---------- */
    function report(p, state) {
      var t = p.video.currentTime * 1000, d = p.meta && p.meta.duration || p.video.duration * 1000;
      if (!p.meta || !d) return;
      FEEDS.plex.timeline(p.key, state, t, d);
    }
    function nearEnd(p) { var v = p.video; return v.duration && v.currentTime / v.duration >= WATCHED; }

    function play(key, offset, m) {
      closePanel(); stop(true);
      var el = document.createElement('div');
      el.className = 'plex-player';
      el.innerHTML = '<video></video><div class="pp-sub" hidden></div><div class="pp-osd"><div class="pp-name"></div>'
        + '<div class="pp-bar"><i></i></div><div class="pp-osd-row"><span class="pp-time"></span><span class="pp-keys"></span></div></div><div class="pp-msg" hidden></div>';
      stage.appendChild(el);
      stage.className = stage.className.replace(/\s*has-video/g, '') + ' has-video';
      var p = player = { el: el, video: el.querySelector('video'), key: String(key), meta: null, subs: [], sub: -1, cues: null };
      var v = p.video;
      v.setAttribute('playsinline', ''); v.muted = false;
      say(p, 'Loading…');
      v.addEventListener('playing', function () { say(p, ''); report(p, 'playing'); osd(p); });
      v.addEventListener('pause', function () { if (!p.ended && !p.closed) { report(p, 'paused'); osd(p, true); } });
      v.addEventListener('timeupdate', function () { renderSub(p); if (p.el.querySelector('.pp-osd.is-on')) updateOsd(p); });
      v.addEventListener('ended', function () { finished(p); });
      v.addEventListener('error', function () {
        var codes = { 1: 'stopped', 2: 'network error', 3: 'decode error', 4: 'format not supported' };
        message('Can’t play this file here (' + (v.error && codes[v.error.code] || 'error') + ')', p);
      });
      p.timer = setInterval(function () { if (player === p && !v.paused) report(p, 'playing'); }, REPORT_EVERY);
      videoStarted();
      (m ? Promise.resolve(m) : FEEDS.plex.meta(key)).then(function (m) {
        if (player !== p) return;
        var media = m.Media && m.Media[0], part = media && media.Part && media.Part[0];
        if (!part) throw new Error('no file');
        p.meta = m;
        p.subs = (part.Stream || []).filter(function (s) { return s.streamType === 3 && s.key; });
        p.el.querySelector('.pp-name').textContent = label(m);
        if (offset) v.addEventListener('loadedmetadata', function () { try { v.currentTime = offset / 1000; } catch (e) { /* not seekable yet */ } });
        v.src = FEEDS.plex.streamUrl(part.key);
        var chosen = p.subs.filter(function (s) { return s.selected; })[0];
        if (chosen) setSub(p, p.subs.indexOf(chosen));
        var go = v.play && v.play(); if (go && go.catch) go.catch(function () {});
      }, function (e) { if (player === p) message('Can’t start this (' + (e && e.message || 'error') + ')', p); });
    }

    function stop(handoff) {
      var p = player;
      if (!p) return;
      player = null; p.closed = true;
      clearInterval(p.timer); clearTimeout(p.msgTimer); clearTimeout(p.osdTimer); clearInterval(p.upTimer);
      if (!p.ended) { report(p, 'stopped'); if (nearEnd(p)) FEEDS.plex.scrobble(p.key); }
      p.video.pause(); p.video.removeAttribute('src'); p.video.load();
      if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
      stage.className = stage.className.replace(/\s*has-video/g, '');
      if (handoff !== true) { videoStopped(); if (FEEDS) setTimeout(function () { FEEDS.retry('plex'); }, 2500); after(); }
    }

    function finished(p) {
      if (p.ended || p.closed) return;
      p.ended = true; report(p, 'stopped'); FEEDS.plex.scrobble(p.key);
      if (!p.meta || p.meta.type !== 'episode') { stop(); return; }
      FEEDS.plex.episodes(p.meta.grandparentRatingKey).then(function (eps) {
        if (player !== p) return;
        var i = -1, n;
        eps.forEach(function (e, x) { if (String(e.ratingKey) === p.key) i = x; });
        n = eps[i + 1];
        if (!n) { stop(); return; }
        p.next = n;
        var left = UP_NEXT, tick = function () {
          if (left <= 0) { playNext(p); return; }
          say(p, 'Up next: ' + epName(n) + ' in ' + left + ' s · OK to start · Back to stop');
          left--;
        };
        tick(); p.upTimer = setInterval(tick, 1000);
      }, function () { if (player === p) stop(); });
    }
    function playNext(p) { clearInterval(p.upTimer); var next = p.next; p.next = null; play(String(next.ratingKey), 0, null); }

    /* ---------- messages, OSD ---------- */
    function message(text, p) {
      p = p || player;
      if (p) { say(p, text, 6000); return; }
      // No player yet (open/show failed): a brief toast on a bare overlay.
      var el = document.createElement('div'); el.className = 'plex-player is-toast';
      el.innerHTML = '<div class="pp-msg">' + esc(text) + '</div>'; stage.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
    }
    function say(p, text, closeAfter) {
      var m = p.el.querySelector('.pp-msg'); m.textContent = text; m.hidden = !text;
      clearTimeout(p.msgTimer);
      if (closeAfter) p.msgTimer = setTimeout(function () { if (player === p) stop(); }, closeAfter);
    }
    function osd(p, stay) {
      var o = p.el.querySelector('.pp-osd'); o.className = 'pp-osd is-on'; updateOsd(p);
      clearTimeout(p.osdTimer);
      if (!stay) p.osdTimer = setTimeout(function () { if (player === p && !p.video.paused) o.className = 'pp-osd'; }, 4000);
    }
    function updateOsd(p) {
      var v = p.video, d = v.duration;
      p.el.querySelector('.pp-bar i').style.width = (d ? v.currentTime / d * 100 : 0) + '%';
      p.el.querySelector('.pp-time').textContent = clockText(v.currentTime) + ' / ' + clockText(d);
      p.el.querySelector('.pp-keys').textContent = (v.paused ? 'Paused · ' : '') + 'OK pause · ◀ 10s · ▶ 30s · ▲ subtitles: ' + subName(p) + ' · Back stop';
    }

    /* ---------- subtitles ---------- */
    function subName(p) { if (!p.subs.length) return 'none'; if (p.sub < 0) return 'off'; var s = p.subs[p.sub]; return s.displayTitle || s.language || 'on'; }
    function setSub(p, i) {
      p.sub = i; p.cues = null; renderSub(p);
      if (i < 0) return;
      FEEDS.plex.subText(p.subs[i].key).then(function (text) { if (player === p && p.sub === i) { p.cues = parseSubs(text); renderSub(p); } }, function () { if (player === p) say(p, 'Couldn’t load those subtitles'); });
    }
    function parseSubs(text) {
      var cues = [], re = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/;
      String(text).replace(/\r/g, '').split(/\n\s*\n/).forEach(function (block) {
        var lines = block.split('\n'), at = -1, t, secs;
        lines.forEach(function (l, n) { if (at < 0 && re.test(l)) at = n; });
        if (at < 0) return;
        t = re.exec(lines[at]);
        secs = function (h, m, s, ms) { return +h * 3600 + +m * 60 + +s + +ms / 1000; };
        cues.push({ from: secs(t[1], t[2], t[3], t[4]), to: secs(t[5], t[6], t[7], t[8]), text: lines.slice(at + 1).join('\n').replace(/<[^>]+>|\{[^}]+\}/g, '').trim() });
      });
      return cues;
    }
    function renderSub(p) {
      var box = p.el.querySelector('.pp-sub'), t = p.video.currentTime, text = '', i;
      if (p.cues) for (i = 0; i < p.cues.length; i++) { if (p.cues[i].from > t) break; if (p.cues[i].to >= t) text = p.cues[i].text; }
      box.hidden = !text;
      if (box.textContent !== text) box.textContent = text;
    }

    /* ---------- remote keys ---------- */
    function key(k) {
      if (!active()) return false;
      if (busy) return true;
      if (panelOpen()) {
        if (k === 'up') setPanelFocus(panelIdx - 1);
        else if (k === 'down') setPanelFocus(panelIdx + 1);
        else if (k === 'ok') activateChoice();
        else if (k === 'back') { closePanel(); after(); }
        return true;
      }
      var p = player, v = p.video;
      if (p.next) { if (k === 'ok' || k === 'playpause') playNext(p); else if (k === 'back') stop(); return true; }
      if (k === 'ok' || k === 'playpause') { if (v.paused) { var g = v.play(); if (g && g.catch) g.catch(function () {}); } else v.pause(); }
      else if (k === 'left' || k === 'prev') { try { v.currentTime = Math.max(0, v.currentTime - 10); } catch (e) {} osd(p, v.paused); }
      else if (k === 'right' || k === 'next') { try { v.currentTime = v.currentTime + 30; } catch (e) {} osd(p, v.paused); }
      else if (k === 'up') {
        if (!p.subs.length) { osd(p, v.paused); say(p, 'No subtitle files for this one'); clearTimeout(p.msgTimer); p.msgTimer = setTimeout(function () { if (player === p) say(p, ''); }, 2500); }
        else { setSub(p, p.sub + 1 >= p.subs.length ? -1 : p.sub + 1); osd(p, v.paused); }
      }
      else if (k === 'down') osd(p, v.paused);
      else if (k === 'back') stop();
      return true;
    }
    function activateChoice() {
      var el = panelEls[panelIdx]; if (!el) return;
      var pa = el.getAttribute('data-pa'), key = el.getAttribute('data-key'), off = +el.getAttribute('data-offset') || 0;
      if (pa === 'start') { closePanel(); play(key, off, null); }
      else if (pa === 'open') open(key);
    }
    function hide() { if (player) stop(); else if (panelOpen()) { closePanel(); after(); } }

    return {
      open: open, openShow: openShow, key: key, active: active, panelOpen: panelOpen, videoPlaying: videoPlaying, hide: hide,
      busy: function () { return busy; },
      /* QA read-only getters */
      currentKey: function () { return player && player.key || null; },
      videoSrc: function () { return player && player.video.getAttribute('src') || null; },
      paused: function () { return player ? player.video.paused : null; },
      message: function () { var m = stage.querySelector('.plex-player .pp-msg:not([hidden])'); return m ? m.textContent : ''; },
      subtitleText: function () { var s = stage.querySelector('.pp-sub:not([hidden])'); return s ? s.textContent : ''; },
      subName: function () { return player ? subName(player) : null; },
      upNext: function () { return !!(player && player.next); },
      choices: function () { return panelEls.map(function (el, i) { return { label: el.textContent.replace(/\s+/g, ' ').trim(), focus: i === panelIdx, pa: el.getAttribute('data-pa') }; }); }
    };
  }());

  function railOk(t, r, it) {
    if (!it) return;
    if (it.kind === 'app') launch(it.id);
    else if (it.kind === 'add') addAppsRoute();
    else if (it.kind === 'more') perform('Plex', function (done) { FrameDevice.launchApp(plexAppId(), done); });
    else if (it.kind === 'poster') {
      // Posters play in-screen; a missing key (older cache) falls back to opening the app.
      if (it.data && it.data.key && it.data.play) { if (it.data.play === 'show') plexPlayer.openShow(it.data.key); else plexPlayer.open(it.data.key); }
      else perform('Plex', function (done) { FrameDevice.launchApp(plexAppId(), done); });
    }
    else if (it.kind === 'ha') {
      say('home', it.data.routine ? 'Running ' + it.data.name + '…' : '');
      FEEDS.home.run(it.data.id, function (err) { say('home', err ? err.message : it.data.routine ? it.data.name + ' started.' : ''); render(); });
    } else if (it.kind === 'rooms') openHa();
    else if (it.kind === 'pc') FEEDS.pc.ok(function () { perform('Moonlight', function (done) { FrameDevice.launchApp(FEEDS.pc.appId(), done); }); });
    else if (it.kind === 'status' || it.kind === 'team') FEEDS.retry(r.id);
  }
  V.home = {
    norm: function (t) { var R = railList(); t.f.r = clamp(t.f.r, 0, R.length - 1); },
    key: function (t, k) {
      var f = t.f, R = railList(), U = utils(), r, i;
      f.r = clamp(f.r, 0, R.length - 1);
      if (f.zone === 'util') {
        f.u = clamp(f.u, 0, U.length - 1);
        if (k === 'left' && f.u > 0) f.u--;
        else if (k === 'right' && f.u < U.length - 1) f.u++;
        else if (k === 'down' || k === 'back') f.zone = 'rails';
        else if (k === 'ok') { S.lastUtil = f.u; utilAction(U[f.u]); return; }
        S.lastUtil = f.u;
        return;
      }
      f.zone = 'rails'; r = R[f.r]; i = railIndex(f, r);
      if (k === 'left' && i > 0) setRailIndex(f, r, i - 1);
      else if (k === 'right' && i < r.items.length - 1) setRailIndex(f, r, i + 1);
      else if (k === 'up') { if (f.r > 0) f.r--; else { f.zone = 'util'; f.u = clamp(S.lastUtil, 0, U.length - 1); } }
      else if (k === 'down' && f.r < R.length - 1) f.r++;
      else if (k === 'back') { if (f.r > 0) f.r = 0; else openMessage('leave'); }
      else if (k === 'ok') railOk(t, r, r.items[i]);
    },
    point: function (t, z, i, id) {
      var R = railList(), r;
      if (z === 'util') { t.f.zone = 'util'; t.f.u = i; S.lastUtil = i; }
      else if (z === 'rail') {
        R.some(function (rail, ri) { if (rail.id === id) { r = rail; t.f.r = ri; return true; } return false; });
        if (!r || !r.items[i]) return;
        t.f.zone = 'rails'; setRailIndex(t.f, r, i);
      } else return;
      this.key(t, 'ok');
    }
  };

  /* ---------- Home Assistant rooms ---------- */
  function haLayout() {
    var tiles = [], heads = [], y = 0, row = 0;
    (FEEDS ? FEEDS.home.sections() : []).forEach(function (sec) {
      heads.push({ key: 'h.' + sec.name, name: sec.name, y: y }); y += HA_HEAD;
      sec.items.forEach(function (it, j) {
        var c = j % HA_COLS;
        if (j && !c) { y += HA_ROW; row++; }
        tiles.push({ key: 't.' + tiles.length + '.' + it.id, item: it, x: c * HA_PITCH_X, y: y, row: row, col: c });
      });
      y += HA_ROW + 24; row++;
    });
    return { tiles: tiles, heads: heads, height: y };
  }
  function openHa() { push({ id: 'ha', top: 0, f: { i: 0 } }); FEEDS.home.fast(true); }
  function closeHa() { FEEDS.home.fast(false); pop(); }
  V.ha = {
    sheet: true,
    norm: function (t) { t.f.i = clamp(t.f.i, 0, Math.max(0, haLayout().tiles.length - 1)); },
    key: function (t, k) {
      var L = haLayout().tiles, cur = L[t.f.i], d, best = -1, bestCost = Infinity;
      if (k === 'back') { closeHa(); return; }
      if (!cur) return;
      if (k === 'left' && t.f.i > 0 && L[t.f.i - 1].row === cur.row) t.f.i--;
      else if (k === 'right' && t.f.i < L.length - 1 && L[t.f.i + 1].row === cur.row) t.f.i++;
      else if (k === 'up' || k === 'down') {
        d = k === 'up' ? -1 : 1;
        L.forEach(function (tile, j) {
          var dr = (tile.row - cur.row) * d, cost;
          if (dr <= 0) return;
          cost = dr * 100 + Math.abs(tile.col - cur.col);
          if (cost < bestCost) { bestCost = cost; best = j; }
        });
        if (best >= 0) t.f.i = best;
      } else if (k === 'ok') {
        S.note = cur.item.routine ? 'Running ' + cur.item.name + '…' : '';
        FEEDS.home.run(cur.item.id, function (err) {
          S.note = err ? err.message : cur.item.routine ? cur.item.name + ' started.' : '';
          render();
        });
      }
    },
    point: function (t, z, i) { if (z === 'ha') { t.f.i = i; this.key(t, 'ok'); } }
  };

  /* ---------- Wallpaper child: focus previews, activation applies ---------- */
  function cancelWallpaperTimer(t) {
    clearTimeout(t.previewTimer); t.previewTimer = 0; t.previewDue = null;
  }
  function failWallpaper(t, id, apply, bundle) {
    t.applyPending = null; t.failedId = id; t.failedApply = apply; t.retryBundle = bundle || null;
    restoreLook();
    if (!bundle) S.wallError = id;
  }
  function applyWallpaper(t, prepared) {
    var w = WALLS[t.i], c, bundle = prepared || S.previewBundle;
    if (!prepared && (S.wallPending || t.previewDue || S.wallShown !== w.id || S.wallError)) {
      t.applyPending = w.id;
      if (t.previewDue || S.wallPending !== w.id) { cancelWallpaperTimer(t); loadWallpaperPreview(t); }
      return;
    }
    t.applyPending = null;
    if (w.id === S.c.wall) { S.err = null; t.failedId = null; t.failedApply = false; t.retryBundle = null; return; }
    if (!bundle || bundle.key !== bundleKey({ wall: w.id, material: S.c.material })) { t.applyPending = w.id; loadWallpaperPreview(t); return; }
    c = next(S.c.home.slice(), S.c.recent.slice()); c.wall = w.id;
    if (!write(c, 'Wallpaper ' + w.name)) { failWallpaper(t, w.id, true, bundle); return; }
    installBundle(bundle, c); committedBundle = bundle; S.previewBundle = null;
    t.failedId = null; t.failedApply = false; t.retryBundle = null;
  }
  function loadWallpaperPreview(t) {
    var id = WALLS[t.i].id;
    cancelWallpaperTimer(t);
    showWall(id, function (ok) {
      if (top() !== t || WALLS[t.i].id !== id) return;
      if (!ok) failWallpaper(t, id, t.applyPending === id, null);
      else if (t.applyPending === id) applyWallpaper(t);
      render(); syncRotation();
    });
  }
  function previewWallpaper(t, index, apply, immediate) {
    var id, target;
    cancelWallpaperTimer(t); cancelLook();
    t.i = index; t.f.zone = 'photo'; id = WALLS[index].id;
    t.applyPending = apply ? id : null; t.failedId = null; t.failedApply = false; t.retryBundle = null;
    S.err = null; S.wallError = null;
    if (id === S.c.wall && committedBundle) {
      installBundle(committedBundle, S.c, true); S.previewBundle = null;
      if (apply) applyWallpaper(t);
      return;
    }
    if (S.wallShown === id && S.previewBundle && S.previewBundle.key === bundleKey({ wall: id, material: S.c.material })) {
      if (apply) applyWallpaper(t);
      return;
    }
    if (apply || immediate) { loadWallpaperPreview(t); return; }
    target = lookOf(S.c); target.wall = id;
    S.pending = { patch: { wall: id }, target: target, row: 'bg', preview: true, transient: false, deferred: true };
    t.previewDue = id;
    t.previewTimer = setTimeout(function () { if (top() === t && WALLS[t.i].id === id) loadWallpaperPreview(t); }, WALL_DELAY);
  }
  function retryWallpaper(t) {
    var apply = t.failedApply, bundle = t.retryBundle;
    t.f.zone = 'photo';
    if (bundle && apply) applyWallpaper(t, bundle);
    else previewWallpaper(t, t.i, apply, true);
  }
  function closeWallpaper(t) {
    cancelWallpaperTimer(t); t.applyPending = null; S.err = null; pop(); restoreLook();
    if (top().id === 'appearance' && top().group === 'background') detailFocus(top(), { action: 'background.wallpaper' }, 0);
  }
  V.wallpaper = {
    norm: function (t) {
      t.i = clamp(t.i, 0, WALLS.length - 1);
      if (t.f.zone === 'retry' && !t.failedId) t.f.zone = 'photo';
      if (t.i < t.top) t.top = t.i;
      if (t.i >= t.top + WALL_VISIBLE) t.top = t.i - WALL_VISIBLE + 1;
      t.top = clamp(t.top, 0, Math.max(0, WALLS.length - WALL_VISIBLE));
    },
    key: function (t, k) {
      if (k === 'back') { closeWallpaper(t); return; }
      if (t.f.zone === 'back') {
        if (k === 'ok') closeWallpaper(t);
        else if (k === 'down' || k === 'right') t.f.zone = 'photo';
        return;
      }
      if (t.f.zone === 'retry') {
        if (k === 'ok') retryWallpaper(t);
        else if (k === 'up' || k === 'left') t.f.zone = 'photo';
        return;
      }
      if (k === 'left' || k === 'up' && t.i === 0) { t.f.zone = 'back'; t.applyPending = null; }
      else if (k === 'up' && t.i > 0) previewWallpaper(t, t.i - 1, false);
      else if (k === 'down' && t.i < WALLS.length - 1) previewWallpaper(t, t.i + 1, false);
      else if ((k === 'right' || k === 'down') && t.failedId) t.f.zone = 'retry';
      else if (k === 'ok') { if (t.retryBundle) applyWallpaper(t, t.retryBundle); else applyWallpaper(t); }
    },
    point: function (t, z, i) {
      if (z === 'wall-back') closeWallpaper(t);
      else if (z === 'wall-retry') retryWallpaper(t);
      else if (z === 'wall-choice' && i >= 0 && i < WALLS.length) {
        if (i === t.i) { t.f.zone = 'photo'; this.key(t, 'ok'); }
        else previewWallpaper(t, i, true);
      }
    }
  };

  /* ---------- Installed apps ---------- */
  function appsItems() { return catalog.error ? [] : ALPHA; }
  function appsHead() { return catalog.error ? [['retry', 'Try again', '', '']] : [['editor', 'Apps on Home', '', 'home']]; }
  V.apps = {
    sheet: true,
    norm: function (t) {
      var n = appsItems().length;
      t.f.i = clamp(t.f.i, 0, Math.max(0, n - 1));
      if (!n) t.f.zone = 'head';
    },
    key: function (t, k) {
      var f = t.f, items = appsItems(), n = items.length, col = f.i % COLS, row = Math.floor(f.i / COLS);
      if (k === 'back') { pop(); return; }
      if (f.zone === 'head') {
        if (k === 'down' && n) f.zone = 'grid';
        else if (k === 'ok') { if (catalog.error) refreshCatalog(); else openEditor('apps'); }
        return;
      }
      if (k === 'left' && col > 0) f.i--;
      else if (k === 'right' && col < COLS - 1 && f.i < n - 1) f.i++;
      else if (k === 'down' && row < Math.ceil(n / COLS) - 1) f.i = Math.min(f.i + COLS, n - 1);
      else if (k === 'up') { if (row > 0) f.i -= COLS; else f.zone = 'head'; }
      else if (k === 'ok' && n) launch(items[f.i]);
      S.appsFocus = items[f.i] || null;
    },
    point: function (t, z, i) { if (z === 'grid') { t.f.zone = 'grid'; t.f.i = i; } else if (z === 'head') t.f.zone = 'head'; else return; this.key(t, 'ok'); }
  };

  /* ---------- B: two-zone Home editor ---------- */
  function otherGroups() {
    var rec = S.c.recent.filter(function (id) { return !onHome(id) && app(id); });
    return { recent: rec, rest: ALPHA.filter(function (id) { return !onHome(id) && rec.indexOf(id) < 0; }) };
  }
  function otherList() { var o = otherGroups(); return o.recent.concat(o.rest); }
  function editorCut() { return 5; }
  function editorHomeY(i) { return i * ED_ROW + (i >= editorCut() ? 24 : 0); }
  function editorOtherY(j) {
    var o = otherGroups();
    return j * ED_ROW + (o.recent.length ? ED_SEP : 0) + (o.recent.length && j >= o.recent.length ? ED_SEP : 0);
  }
  function rememberOther(t) {
    var list = otherList();
    t.otherReturn = { id: list[t.f.j] || null, index: t.f.j, top: t.top };
  }
  function returnOther(t) {
    var list = otherList(), memory = t.otherReturn, i = memory ? list.indexOf(memory.id) : -1;
    t.f.zone = 'other';
    t.f.j = i >= 0 ? i : clamp(memory ? memory.index : 0, 0, Math.max(0, list.length - 1));
    if (memory) t.top = memory.top;
  }
  function nearestHome(t, count) {
    var target = editorOtherY(t.f.j) - t.top + 36, best = 0, distance = Infinity, i, d;
    for (i = 0; i < count; i++) {
      d = Math.abs(editorHomeY(i) + 36 - target);
      if (d < distance) { best = i; distance = d; }
    }
    return best;
  }
  V.editor = {
    sheet: true,
    norm: function (t) {
      var f = t.f, nh = (t.lifted ? t.lifted.order : S.c.home).length, no = otherList().length;
      f.i = clamp(f.i, 0, Math.max(0, nh - 1));
      f.j = clamp(f.j, 0, Math.max(0, no - 1));
      if (f.zone === 'home' && !nh) f.zone = no ? 'other' : 'head';
      if (f.zone === 'other' && !no) f.zone = nh ? 'home' : 'head';
    },
    key: function (t, k) {
      var f = t.f, H = t.lifted ? t.lifted.order : S.c.home, O = otherList(), nh = H.length, no = O.length, d, tmp;
      if (t.lifted) {
        d = k === 'up' ? -1 : k === 'down' ? 1 : 0;
        if (d && f.i + d >= 0 && f.i + d < nh) { tmp = H[f.i + d]; H[f.i + d] = H[f.i]; H[f.i] = tmp; f.i += d; S.err = null; }
        else if (k === 'ok') editorPlace(t);
        else if (k === 'back') { f.i = t.lifted.from; t.lifted = null; S.err = null; }
        return;
      }
      if (k === 'back') { closeEditor(t); return; }
      if (f.zone === 'head') {
        if (k === 'left' && f.h > 0) f.h--;
        else if (k === 'right' && f.h < 1) f.h++;
        else if (k === 'down') { if (no) returnOther(t); else if (nh) f.zone = 'home'; }
        else if (k === 'ok') { begin(); if (f.h === 0) undoLast(null); else closeEditor(t); }
      } else if (f.zone === 'home') {
        if (k === 'up') { if (f.i > 0) f.i--; else f.zone = 'head'; }
        else if (k === 'down') { if (f.i < nh - 1) f.i++; }
        else if (k === 'right') { if (f.part === 'name') f.part = 'remove'; else if (no) returnOther(t); }
        else if (k === 'left') { if (f.part === 'remove') f.part = 'name'; }
        else if (k === 'ok') {
          begin();
          if (f.part === 'name') t.lifted = { id: H[f.i], from: f.i, order: H.slice(), snap: snap() };
          else editorRemove(t, H[f.i]);
        }
      } else {
        if (k === 'up') { if (f.j > 0) { f.j--; rememberOther(t); } else f.zone = 'head'; }
        else if (k === 'down') { if (f.j < no - 1) { f.j++; rememberOther(t); } }
        else if (k === 'left') { if (nh) { rememberOther(t); f.i = nearestHome(t, nh); f.zone = 'home'; f.part = 'name'; } }
        else if (k === 'ok') { begin(); editorAdd(t, O[f.j]); }
      }
    },
    point: function (t, z, i) {
      if (t.lifted) { if (z === 'name' && i === t.f.i) this.key(t, 'ok'); return; }
      if (z === 'name' || z === 'remove') { t.f.zone = 'home'; t.f.i = i; t.f.part = z; }
      else if (z === 'other') { t.f.zone = 'other'; t.f.j = i; rememberOther(t); }
      else if (z === 'head') { t.f.zone = 'head'; t.f.h = i; }
      else return;
      this.key(t, 'ok');
    }
  };
  /* Focus follows the app between zones, so a repeated OK toggles the same app. */
  function editorRemove(t, id) {
    if (!homeRemove(id)) return;
    t.f.zone = 'other'; t.f.j = otherList().indexOf(id);
    S.note = app(id).name + ' is in Recently removed. OK puts it back.';
  }
  function editorAdd(t, id) {
    rememberOther(t);
    if (!homeAdd(id)) return;
    var remaining = otherList(), at = clamp(t.otherReturn.index, 0, Math.max(0, remaining.length - 1));
    t.otherReturn.id = remaining[at] || null; t.otherReturn.index = at;
    t.f.zone = 'home'; t.f.i = S.c.home.indexOf(id); t.f.part = 'remove';
    S.note = app(id).name + ' is on Home, position ' + (t.f.i + 1) + '.';
  }
  function editorPlace(t) {
    var L = t.lifted;
    begin();
    if (same(L.order, S.c.home)) { t.lifted = null; return; }
    if (!homeMove(L.order.slice(), L.id, L.snap)) return;
    t.lifted = null;
    S.note = app(L.id).name + ' moved to position ' + (t.f.i + 1) + '.';
  }
  function closeEditor() { clearSession(); pop(); }

  /* ---------- Settings, Layout and messages ---------- */
  function mode() { for (var i = 0; i < MODES.length; i++) if (MODES[i].id === S.c.mode) return MODES[i]; return MODES[0]; }
  function settingsRows() {
    var n = S.c.home.length;
    return [{ id: 'background', label: 'Background', value: S.c.bg === 'photo' ? wall(S.c.wall).name : VALUE_NAMES[S.c.bg] },
      { id: 'typography', label: 'Typography', value: FONTS[S.c.font].name },
      { id: 'editor', label: 'Apps on Home', value: n + (n === 1 ? ' app' : ' apps') },
      { id: 'samsung', label: 'Samsung', value: 'Home and TV settings' }];
  }
  function settingsIds() { return settingsRows().map(function (r) { return r.id; }); }
  V.settings = {
    sheet: true,
    norm: function (t) { var ids = settingsIds(); if (ids.indexOf(t.f.id) < 0) t.f.id = ids[0]; },
    key: function (t, k) {
      var ids = settingsIds(), i = Math.max(0, ids.indexOf(t.f.id));
      if (k === 'up' && i > 0) i--;
      else if (k === 'down' && i < ids.length - 1) i++;
      else if (k === 'back') { pop(); return; }
      t.f.id = ids[i]; S.settingsFocus = ids[i];
      if (k === 'ok') settingsOk(ids[i]);
    },
    point: function (t, z, i, id) { if (z === 'row' && id) { t.f.id = id; this.key(t, 'ok'); } }
  };
  function settingsOk(id) {
    if (id === 'editor') openEditor('settings');
    else openAppearance(id);
  }
  var DETAIL_NAMES = { background: 'Background', typography: 'Typography', rotation: 'Rotation', samsung: 'Samsung', inputs: 'Inputs' };
  function choice(axis, value, disabled) {
    return { action: axis === 'mode' ? 'rotation.' + value : 'choice.' + axis + '.' + value, axis: axis, value: value, disabled: !!disabled,
      label: axis === 'font' ? FONTS[value].name : axis === 'mode' ? MODES.filter(function (m) { return m.id === value; })[0].name : value === 'both' ? 'Both' : VALUE_NAMES[value] };
  }
  function detailSections(t) {
    var flat = S.c.bg !== 'photo', mine = FEEDS && FEEDS.configured('photos');
    function options(axis, values, disabled) { return values.map(function (value) { return choice(axis, value, disabled); }); }
    if (t.group === 'inputs') return [{ id: 'inputs', title: '', items: t.inputs.length ? t.inputs.map(function (input) {
      return { action: 'input.' + input.number, label: input.name, description: input.active ? 'Active' : input.connected ? 'Connected' : 'Disconnected — may be asleep' };
    }) : [{ action: 'inputs.retry', label: t.loading ? 'Loading inputs…' : 'Try again', disabled: t.loading }],
      reason: t.inputError || (!t.loading && !t.inputs.length ? 'No HDMI inputs were reported by this TV.' : '') }];
    if (t.group === 'background') return [
      { id: 'bg', title: 'Background type', items: options('bg', mine || S.c.bg === 'photos' ? ['photo', 'photos', 'light', 'dark'] : ['photo', 'light', 'dark']),
        reason: S.c.bg === 'photos' ? mine ? 'Lays prints from your album on the table, one every ' + FEEDS.photos.every() + ' seconds.' : 'Photos are not set up in this build; the wallpaper is shown.' : '' },
      { id: 'wall', title: 'Wallpaper', items: [{ action: 'background.wallpaper', label: wall(S.c.wall).name, thumbnail: true, disabled: flat }] },
      { id: 'rotation', title: 'Rotation', items: [{ action: 'background.rotation', label: mode().name, disabled: flat }], reason: flat ? 'Choose Wallpaper to pick a photo and rotation.' : '' }
    ];
    if (t.group === 'typography') return [{ id: 'font', title: '', items: options('font', LOOK_VALUES.font) }];
    if (t.group === 'rotation') return [{ id: 'mode', title: '', items: options('mode', MODES.map(function (m) { return m.id; }), flat),
      reason: flat ? 'Choose Wallpaper in Background to use rotation.' : 'Timed changes pause while Settings or another panel is open.' }];
    var samsung = [
      { action: 'samsung.home', label: 'Samsung Home', description: 'Open Samsung’s Home screen' },
      { action: 'samsung.settings', label: 'TV settings', description: 'Picture, sound and network settings' }
    ];
    if (!FrameDevice.supportsInputs || FrameDevice.supportsInputs()) samsung.push({ action: 'samsung.inputs', label: 'Inputs', description: 'Choose an HDMI input' });
    return [{ id: 'samsung', title: '', items: samsung }];
  }
  function backLabel(t) { return t.group === 'rotation' ? 'Background' : t.group === 'inputs' ? t.origin === 'home' ? 'Home' : 'Samsung' : 'Settings'; }
  function detailRows(t) {
    var rows = [[{ action: 'settings.back', label: backLabel(t) }]];
    detailSections(t).forEach(function (section) {
      var enabled = section.items.filter(function (item) { return !item.disabled; });
      if (section.horizontal && enabled.length) rows.push(enabled);
      else enabled.forEach(function (item) { rows.push([item]); });
    });
    if (S.lookError) rows.push([{ action: 'settings.retry', label: 'Try again' }]);
    return rows;
  }
  function detailLocation(t) {
    var rows = detailRows(t), row = 0, column = 0;
    rows.forEach(function (items, r) { items.forEach(function (item, c) { if (item.action === t.f.action) { row = r; column = c; } }); });
    return { rows: rows, row: row, column: column, item: rows[row][column] };
  }
  function detailFocus(t, item, column) {
    t.f.action = item.action;
    if (item.action !== 'settings.back') S.detailFocus[t.group] = item.action;
    if (column !== undefined) t.f.column = column;
    if (item.axis) S.appearanceFocus = item.axis;
  }
  function applyRotation(value) {
    var c;
    if (S.c.bg !== 'photo') return;
    S.err = null; S.lookError = null;
    if (value === S.c.mode) return;
    c = next(S.c.home.slice(), S.c.recent.slice()); c.mode = value;
    if (!write(c, 'Wallpaper rotation')) S.lookError = { type: 'save', patch: { mode: value }, row: 'mode', transient: false };
  }
  function loadInputs(t) {
    t.loading = true; t.inputError = null;
    FrameDevice.sources(function (err, list) {
      if (top() !== t) return;
      t.loading = false; t.inputs = list || []; t.inputError = err ? err.message : null; after();
    });
  }
  function openInputs(origin) {
    openAppearance('inputs'); var t = top(); t.origin = origin || 'samsung'; t.inputs = []; loadInputs(t);
  }
  function detailBack() { cancelLook(); S.err = null; pop(); FrameDevice.cancelSource(); }
  function detailOk(t, item) {
    var patch = {}, error = S.lookError;
    if (item.action === 'settings.back') { detailBack(); return; }
    if (item.disabled || S.pending) return;
    if (item.action === 'settings.retry') {
      if (error && error.patch[error.row] !== undefined) detailFocus(t, choice(error.row, error.patch[error.row]), 0);
      if (error && error.row === 'mode') applyRotation(error.patch.mode);
      else if (error) setLook(error.patch, { row: error.row });
    } else if (item.axis === 'mode') applyRotation(item.value);
    else if (item.axis) { patch[item.axis] = item.value; setLook(patch, { row: item.axis }); }
    else if (item.action === 'background.wallpaper') openWallpaper();
    else if (item.action === 'background.rotation') openAppearance('rotation');
    else if (item.action === 'samsung.home') perform('Samsung Home', FrameDevice.home);
    else if (item.action === 'samsung.settings') perform('TV settings', FrameDevice.settings);
    else if (item.action === 'samsung.inputs') openInputs('samsung');
    else if (item.action === 'inputs.retry') loadInputs(t);
    else if (item.action.indexOf('input.') === 0) perform(item.label, function (done) {
      FrameDevice.setSource(Number(item.action.slice(6)), function (err) {
        t.refreshInputs = true;
        done(top() === t && !document.hidden && !(err && err.cancelled) ? err : null);
      });
    });
  }
  V.appearance = {
    norm: function (t) {
      var rows = detailRows(t), exists = false, applied = null;
      var axis = { background: 'bg', layout: 'layout', typography: 'font', focus: 'focus', rotation: 'mode' }[t.group];
      rows.forEach(function (items) { items.forEach(function (item) {
        if (item.action === t.f.action) exists = true;
        if (item.axis === axis && item.value === S.c[axis]) applied = item;
      }); });
      if (!exists) detailFocus(t, applied || (rows[1] || rows[0])[0], 0);
      if (t.f.column === undefined) t.f.column = detailLocation(t).column;
    },
    key: function (t, k) {
      var at = detailLocation(t), row = at.row, column = at.column;
      if (k === 'back') { detailBack(); return; }
      if (k === 'ok') { detailOk(t, at.item); return; }
      if (k === 'up' || k === 'down') {
        row = clamp(row + (k === 'up' ? -1 : 1), 0, at.rows.length - 1);
        column = Math.min(t.f.column || 0, at.rows[row].length - 1);
        detailFocus(t, at.rows[row][column]);
      } else if (k === 'left' || k === 'right') {
        column = clamp(column + (k === 'left' ? -1 : 1), 0, at.rows[row].length - 1);
        detailFocus(t, at.rows[row][column], column);
      }
    },
    point: function (t, z, i, action) {
      if (z !== 'detail') return;
      detailRows(t).some(function (items) { return items.some(function (item, column) {
        if (item.action !== action) return false;
        detailFocus(t, item, column); detailOk(t, item); return true;
      }); });
    }
  };
  function messageContent(t) { return t.content || MSG[t.msg]; }
  V.message = {
    sheet: true,
    key: function (t, k) {
      var A = messageContent(t).actions, a;
      if (k === 'left') t.f.b = Math.max(0, t.f.b - 1);
      else if (k === 'right') t.f.b = Math.min(A.length - 1, t.f.b + 1);
      else if (k === 'back') pop();
      else if (k === 'ok') { a = A[t.f.b][0]; pop(); if (a === 'samsung') perform('Samsung Home', FrameDevice.home); }
    },
    point: function (t, z, i) { if (z === 'act') { t.f.b = i; this.key(t, 'ok'); } }
  };

  /* ---------- Dispatch ---------- */
  function norm() { var t = top(), v = V[t.id]; if (v.norm) v.norm(t); }
  function press(k) {
    norm();
    var t = top();
    V[t.id].key(t, k);
    norm();
    render();
    syncRotation();
  }

  /* ---------- Rendering ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), homeEl = $('home'), mastheadEl = $('masthead'), utilsEl = $('utils'), alertsEl = $('alerts');
  var railsEl = $('rails'), railsIn = $('railsIn'), tickerEl = $('ticker'), tickerTrack = $('tickerTrack');
  var focusStatus = $('focusStatus'), sceneEl = $('scene'), appearanceEl = $('appearance'), appearanceRows = $('appearanceRows'), appearanceDesc = $('appearanceDesc');
  var appearanceBack = $('appearanceBack'), appearanceTitle = $('appearanceTitle'), appearanceStatus = $('appearanceStatus');
  var sheetEl = $('sheet'), sheetView = $('sheetView');
  var IMG = { photo: $('photo'), bg: $('sheetBg') };
  var sheetKey = '', slotEls = {}, railScroll = {};
  var appliedFont = null, appliedFontMetrics = null;

  function render() {
    var t = top(), sheet = !!V[t.id].sheet, shown = wall(S.shown ? S.shown.wall : S.c.wall);
    stage.className = 'stage bg-' + S.c.bg + ' tone-' + shown.tone + ' at-' + t.id + ' font-' + homeFont() + (homeFont() !== 'manrope' ? ' font-custom' : '')
      + (S.fontSwitch ? ' is-font-switch' : '') + (sheet ? ' is-sheet' : '') + (S.reflow ? ' is-reflow' : '') + (ambient.shown ? ' has-ambient' : '') + (S.stack[0].f.r > 0 && !sheet ? ' is-deep' : '');
    applyHomeFont();
    if (!sheet) renderHome(t);
    renderTicker();
    renderSheet(t, sheet);
    renderAppearance(t);
    renderFocusStatus(t);
    syncAmbient();
  }

  function applyHomeFont() {
    var id = homeFont(), f = FONTS[id], primary = fontRole(id, 'primary'), ui = fontRole(id, 'ui'), metrics = fontMetrics[id];
    if (appliedFont === id && appliedFontMetrics === metrics) return;
    appliedFont = id; appliedFontMetrics = metrics;
    var values = { 'display-family': '"' + f.family + '"', 'ui-family': '"' + ui.family + '"', 'primary-family': '"' + primary.family + '"', 'display-weight': f.display, 'ui-weight': ui.weight, 'primary-weight': primary.weight, 'clock-weight': f.clock,
      // Measured at 48px; expressed in em so they scale with whatever size the clock is drawn at.
      'clock-shift': (fontShift('clock', 48) / 48).toFixed(4) + 'em', 'clock-digit': metrics && metrics.digitCell ? (metrics.digitCell / 48).toFixed(4) + 'em' : 'auto' };
    Object.keys(values).forEach(function (key) { homeEl.style.setProperty('--font-' + key, String(values[key])); });
  }

  function homeFocus(t) { return t.id === 'home' ? t.f : null; }
  function renderHome(t) {
    var f = homeFocus(t), base = S.stack[0].f;
    renderMasthead();
    renderUtils(f);
    renderAlerts();
    renderRails(f, base);
  }

  function clockText() {
    var d = new Date(), h = d.getHours() % 12 || 12, m = d.getMinutes();
    return h + ':' + (m < 10 ? '0' : '') + m;
  }
  function clockHtml() {
    var text = clockText(), metrics = fontMetrics[homeFont()];
    if (!metrics || !metrics.digitCell) return text;
    return text.replace(/[0-9]/g, function (digit) { return '<span class="clock-digit">' + digit + '</span>'; });
  }
  function deg(v) { return v === null || v === undefined ? '–' : Math.round(v) + '°'; }
  function renderMasthead() {
    var w = feed('weather'), d = new Date(), html = '<span class="clock">' + clockHtml() + '</span>'
      + '<span class="mh-date">' + esc(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })) + '</span>', n, today;
    if (w.status === 'ready') {
      n = w.data.now; today = w.data.days[0] || {};
      html += '<span class="mh-weather">' + FEEDS.weatherIcon(n.code, n.isDay, 'mh-wx') + '<span class="mh-temp">' + deg(n.temp) + '</span><span class="mh-desc">'
        + esc(n.label) + (today.hi !== undefined && today.hi !== null ? ' · H ' + deg(today.hi) + ' L ' + deg(today.lo) : '') + '</span></span>';
    }
    setHTML(mastheadEl, html);
  }
  function renderUtils(f) {
    var html = '';
    utils().forEach(function (u, i) {
      var focus = !!f && f.zone === 'util' && f.u === i;
      html += '<button type="button" tabindex="-1" class="u' + (focus ? ' is-focus' : '') + '" data-z="util" data-i="' + i + '" data-action="util.' + u + '" aria-label="' + esc(UTIL[u][0]) + '">'
        + icon(UTIL[u][1]) + '<span class="u-label">' + UTIL[u][0] + '</span></button>';
    });
    utilsEl.className = 'utils' + (f && f.zone === 'util' ? ' is-awake' : '');
    setHTML(utilsEl, html);
  }
  function renderAlerts() {
    var w = feed('weather'), list = w.status === 'ready' ? w.data.alerts : [];
    alertsEl.className = 'alerts' + (list.length ? ' is-on' : '');
    setHTML(alertsEl, list.length ? icon('warn') + '<span>' + esc(list.slice(0, 3).join(' · ')) + '</span>' : '');
  }

  function tileHtml(it) {
    var d = it.data, a, html;
    if (it.kind === 'app') { a = app(it.id); return '<span class="rt-mark">' + appMark(a, 120, 72, 62) + '</span><span class="rt-name">' + esc(a.name) + '</span>'; }
    if (it.kind === 'add') return icon('plus') + '<span class="rt-name">Add apps to Home</span>';
    if (it.kind === 'status') return (it.error ? icon('warn') : '') + '<span class="rt-text">' + esc(it.text) + '</span>' + (it.error ? '<span class="rt-hint">OK tries again</span>' : '');
    if (it.kind === 'poster') {
      return (it.head ? '<span class="pt-group">' + esc(it.head) + '</span>' : '') + '<span class="pt-art' + (d.image ? '' : ' is-missing') + '">' + (d.image ? '<img alt="" src="' + esc(d.image) + '">' : '') + '<span class="pt-fallback">' + esc(d.title) + '</span>'
        + (d.progress ? '<span class="pt-progress"><i style="width:' + Math.round(d.progress * 100) + '%"></i></span>' : '') + '</span>'
        + '<span class="pt-title">' + esc(d.title) + '</span><span class="pt-sub">' + esc(d.sub) + '</span>';
    }
    if (it.kind === 'more') return '<span class="pt-art pt-more">' + FEEDS.icon('plex') + '<span>Open Plex</span></span>';
    if (it.kind === 'ha') return FEEDS.icon(d.icon, 'ha-ico') + '<span class="ha-name">' + esc(d.name) + '</span><span class="ha-state">' + (d.routine ? 'Run' : d.on ? 'On' : 'Off') + '</span>';
    if (it.kind === 'pc') return FEEDS.icon('moon', 'pc-ico') + '<span class="rt-name">Moonlight</span><span class="pc-status k-' + d.kind + '" title="' + esc(FEEDS.pc.name()) + '"><i></i>' + esc(d.text) + '</span>';
    if (it.kind === 'rooms') return FEEDS.icon('rooms', 'ha-ico') + '<span class="ha-name">All rooms</span><span class="ha-state">Open</span>';
    if (it.kind === 'team') {
      html = d.logo ? '<img class="tm-logo" alt="" src="' + esc(d.logo) + '">' : '<span class="tm-logo tm-blank"></span>';
      return html + '<span class="tm-name">' + esc(d.name) + (d.record ? '<small>' + esc(d.record) + '</small>' : '') + '</span>'
        + '<span class="tm-line k-' + d.line.kind + '">' + (d.line.kind === 'live' ? '<b class="tm-live">Live</b>' : '') + esc(d.line.text) + (d.line.detail ? '<span class="tm-detail"> · ' + esc(d.line.detail) + '</span>' : '') + '</span>';
    }
    if (it.kind === 'now') {
      return FEEDS.weatherIcon(d.now.code, d.now.isDay, 'wx-big') + '<span class="wx-temp">' + deg(d.now.temp) + '</span><span class="wx-label">' + esc(d.now.label) + '</span>'
        + '<span class="wx-facts">' + (d.now.pop >= 10 ? 'Rain ' + d.now.pop + '%' : 'Wind ' + esc(d.now.wind)) + (d.uv !== undefined && d.uv !== null ? ' · UV ' + Math.round(d.uv) : '') + '</span>';
    }
    if (it.kind === 'hour') return '<span class="wx-when">' + shortHour(d.time) + '</span>' + FEEDS.weatherIcon(d.code, d.isDay) + '<span class="wx-t">' + deg(d.temp) + '</span><span class="wx-pop">' + (d.pop >= 10 ? d.pop + '%' : '') + '</span>';
    if (it.kind === 'day') return '<span class="wx-when">' + weekday(d.date) + '</span>' + FEEDS.weatherIcon(d.code, 1) + '<span class="wx-t">' + deg(d.hi) + '</span><span class="wx-pop">' + deg(d.lo) + '</span>';
    return '';
  }
  function tileSig(it) {
    var d = it.data;
    if (it.kind === 'app') return it.id + '|' + app(it.id).name + '|' + S.c.bg;
    if (it.kind === 'ha') return [d.name, d.icon, d.on, d.routine].join('|');
    if (it.kind === 'status') return it.text;
    if (it.kind === 'poster') return (it.head || '') + '|' + JSON.stringify(d);
    return it.kind + '|' + JSON.stringify(d || null);
  }
  function railTops(R) {
    var y = 0;
    return R.map(function (r) { var top = y; y += (r.label ? RAIL_LABEL : 0) + r.h + RAIL_SPACE; return top; });
  }
  function bindImages(el) {
    Array.prototype.forEach.call(el.querySelectorAll('img'), function (im) {
      if (im._bound) return;
      im._bound = true;
      im.onerror = function () { this.style.display = 'none'; this.parentNode.className += ' is-missing'; };
      if (im.complete && !im.naturalWidth) im.onerror();
    });
  }
  function renderRails(f, base) {
    var R = railList(), tops = railTops(R), focusRail = clamp(base.r, 0, R.length - 1), offset = (focusRail === 0 ? RAIL_FIRST : RAIL_ANCHOR) - tops[focusRail];
    keyed(railsIn, R.map(function (r, ri) { return { key: r.id, rail: r, ri: ri }; }), function (el, entry) {
      var r = entry.rail, ri = entry.ri, y = tops[ri] + offset, active = !!f && f.zone === 'rails' && f.r === ri, index = railIndex(base, r);
      var xs = [], x = 0, total, sx, view, label, track, note;
      if (!el._built) {
        el.innerHTML = '<div class="rail-label"></div><div class="rail-view"><div class="rail-track"></div></div>';
        el._built = true;
      }
      label = el.firstChild; view = el.lastChild; track = view.firstChild;
      note = railNote.rail === r.id && railNote.text ? railNote.text : r.note || '';
      setHTML(label, r.label ? '<span>' + esc(r.label) + '</span>' + (note ? '<span class="rail-note">' + esc(note) + '</span>' : '') : '');
      el.className = 'rail rail-' + r.id + (active ? ' is-current' : '') + (ri < focusRail || y >= RAIL_FLOOR ? ' is-away' : ri > focusRail ? ' is-next' : '');
      el.style.transform = 'translate3d(0,' + y + 'px,0)';
      view.style.top = ((r.label ? RAIL_LABEL : 0) - 24) + 'px'; view.style.height = (r.h + 48) + 'px';
      r.items.forEach(function (it) { x += it.lead || 0; xs.push(x); x += it.w + RAIL_GAP; });
      total = Math.max(0, x - RAIL_GAP);
      sx = railScroll[r.id] || 0;
      if (xs[index] < sx) sx = xs[index];
      if (xs[index] + r.items[index].w > sx + RAIL_W) sx = xs[index] + r.items[index].w - RAIL_W;
      sx = clamp(sx, 0, Math.max(0, total - RAIL_W)); railScroll[r.id] = sx;
      track.style.transform = 'translate3d(' + (-sx) + 'px,0,0)'; track.style.height = r.h + 'px'; track.style.width = Math.max(total, RAIL_W) + 'px';
      view.className = 'rail-view' + (sx > 0 ? ' more-before' : '') + (total - sx > RAIL_W ? ' more-after' : '');
      keyed(track, r.items, function (tile, it, i) {
        var focus = active && i === index, out = xs[i] + it.w <= sx - 1 || xs[i] >= sx + RAIL_W + 1;
        setContent(tile, tileSig(it), function () { return tileHtml(it); });
        bindImages(tile);
        tile.className = 'rt k-' + it.kind + (focus ? ' is-focus' : '') + (!active && r.id === 'apps' && i === index ? ' is-sel' : '') + (it.data && it.data.on ? ' is-on' : '')
          + (it.stale ? ' is-stale' : '') + (it.data && it.data.line && it.data.line.kind === 'live' ? ' is-live' : '') + (out ? ' is-out' : '');
        tile.style.width = it.w + 'px'; tile.style.height = r.h + 'px';
        tile.style.transform = 'translate3d(' + xs[i] + 'px,0,0)' + (focus ? ' scale(' + (it.kind === 'poster' || it.kind === 'more' ? 1.05 : 1.06) + ')' : '');
        tile.setAttribute('role', 'button');
        tile.setAttribute('aria-label', it.kind === 'app' ? app(it.id).name : tile.textContent.replace(/\s+/g, ' ').trim());
        attrs(tile, 'rail', i, it.action); tile.setAttribute('data-id', r.id);
      });
    });
    railsEl.className = 'rails' + (focusRail > 0 ? ' is-scrolled' : '');
  }

  /* Headlines move as a short conveyor: only enough to fill the screen are on the strip.
     Each step is one Web Animation on transform, as tuned on the owner's 2020 TV. */
  var TICKER_SPEED = 120, ticker = { queue: [], next: 0, anim: null, sig: -1 };
  function headlineEl(h) {
    var el = document.createElement('span');
    el.className = 'headline';
    el.innerHTML = '<span class="hl-tag">' + (h.kind === 'local' ? 'Local' : 'News') + '</span>' + esc(h.title) + (h.src ? '<span class="hl-src">' + esc(h.src) + '</span>' : '');
    return el;
  }
  function fillTicker() {
    if (!tickerTrack.offsetWidth && !tickerTrack.firstChild) { /* Hidden strips measure zero; retried on the next render. */ }
    while (tickerTrack.scrollWidth < 1920 * 2 && ticker.queue.length && tickerTrack.childNodes.length < 24) tickerTrack.appendChild(headlineEl(ticker.queue[ticker.next++ % ticker.queue.length]));
  }
  function stepTicker() {
    var first = tickerTrack.firstChild, dist;
    ticker.anim = null;
    if (!first || REDUCED_MOTION || !tickerTrack.animate) return;
    dist = first.offsetWidth + (parseFloat(window.getComputedStyle(first).marginRight) || 0);
    if (!(dist > 0)) return;
    ticker.anim = tickerTrack.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(' + -dist + 'px,0,0)' }], { duration: dist / TICKER_SPEED * 1000, easing: 'linear' });
    if (!tickerRunning()) ticker.anim.pause();
    ticker.anim.onfinish = function () {
      if (first.parentNode === tickerTrack) tickerTrack.removeChild(first);
      fillTicker(); stepTicker();
    };
  }
  function tickerRunning() { return !document.hidden && top().id === 'home' && !plexPlayer.videoPlaying(); }
  // Playing a video frees the TV's GPU: pause the headline conveyor and the photo table.
  function videoStarted() { renderTicker(); syncAmbient(); }
  function videoStopped() { renderTicker(); syncAmbient(); focusStage(); }
  function renderTicker() {
    var st = feed('news'), on = st.status === 'ready' && st.data.length > 0;
    tickerEl.className = 'ticker' + (on ? ' is-on' : '');
    if (!on) return;
    if (st.updated !== ticker.sig) {
      ticker.sig = st.updated; ticker.queue = st.data; ticker.next = 0;
      if (!ticker.anim) { tickerTrack.innerHTML = ''; fillTicker(); stepTicker(); }
    }
    if (!ticker.anim && tickerRunning() && tickerTrack.firstChild) { fillTicker(); stepTicker(); }
    if (ticker.anim) { if (tickerRunning()) { if (ticker.anim.playState === 'paused') ticker.anim.play(); } else if (ticker.anim.playState === 'running') ticker.anim.pause(); }
  }

  /* "My photos": TV Dashboard's photo table. Every few seconds a print from the Immich album
     drops onto a dark table at a random size, tilt and spot, keeping clear of the clock and the
     controls; once twelve are down the oldest dissolve. Tuned for the 2020 TV as on the
     dashboard: each image is decoded before it is placed, there are no shadows and only
     opacity animates. The wallpaper stays until the first print is ready. */
  var TABLE_MAX = 12, TABLE_FADE = 6000, TABLE_SEED = 6, PRINT_MIN = 360, PRINT_MAX = 460;
  var KEEP_CLEAR = [{ x1: 0, y1: 0, x2: 720, y2: 310 }, { x1: 1180, y1: 0, x2: 1920, y2: 200 }];
  var ambient = { table: $('photoTable'), timer: 0, busy: false, shown: false, error: null, z: 1, recent: [], placed: 0 };
  function rand(a, b) { return a + Math.random() * (b - a); }
  function ambientWanted() { return S.c.bg === 'photos' && !!FEEDS && FEEDS.configured('photos') && !document.hidden && feedsStarted && !plexPlayer.videoPlaying(); }
  function covered(x, y, w, h) {
    var total = 0;
    KEEP_CLEAR.forEach(function (z) {
      var ox = Math.min(x + w, z.x2) - Math.max(x, z.x1), oy = Math.min(y + h, z.y2) - Math.max(y, z.y1);
      if (ox > 0 && oy > 0) total += ox * oy;
    });
    return total;
  }
  // Try a few spots and keep the one farthest from recent drops, so the table fills out
  // instead of piling up. A spot over the clock or controls wins only if every try was one.
  function placeFor(w, h) {
    var best = null, bestScore = -Infinity, i, x, y, cx, cy, score, hidden;
    for (i = 0; i < 12; i++) {
      x = rand(-w * .25, 1920 - w * .75); y = rand(-h * .25, 1080 - h * .75); cx = x + w / 2; cy = y + h / 2; score = 1e9;
      ambient.recent.forEach(function (p) { score = Math.min(score, Math.sqrt((cx - p.x) * (cx - p.x) + (cy - p.y) * (cy - p.y))); });
      hidden = covered(x, y, w, h);
      if (hidden) score = -hidden;
      if (score > bestScore) { bestScore = score; best = { x: x, y: y, cx: cx, cy: cy }; }
    }
    ambient.recent.push({ x: best.cx, y: best.cy });
    if (ambient.recent.length > 8) ambient.recent.shift();
    return best;
  }
  function printEl(ratio) {
    var edge = rand(PRINT_MIN, PRINT_MAX), w = Math.round(ratio >= 1 ? edge : edge * ratio), h = Math.round(ratio >= 1 ? edge / ratio : edge), spot = placeFor(w, h), el = document.createElement('div');
    el.className = 'print';
    el.style.left = spot.x.toFixed(0) + 'px'; el.style.top = spot.y.toFixed(0) + 'px'; el.style.width = w + 'px'; el.style.height = h + 'px';
    el.style.zIndex = String(ambient.z++); el.style.transform = 'rotate(' + rand(-14, 14).toFixed(1) + 'deg)';
    return el;
  }
  function dropPrint(el) {
    if (el.parentNode) el.parentNode.removeChild(el);
    if (el._url) window.URL.revokeObjectURL(el._url);
  }
  function trimTable() {
    var prints = ambient.table.querySelectorAll('.print:not(.leaving)'), i;
    for (i = 0; i < prints.length - TABLE_MAX; i++) (function (el) {
      el.className = 'print leaving';
      setTimeout(function () { dropPrint(el); }, REDUCED_MOTION ? 0 : TABLE_FADE);
    }(prints[i]));
  }
  function clearTable() {
    Array.prototype.slice.call(ambient.table.querySelectorAll('.print')).forEach(dropPrint);
    ambient.recent = []; ambient.placed = 0; ambient.shown = false;
  }
  function syncAmbient() {
    if (!ambientWanted()) {
      clearTimeout(ambient.timer); ambient.timer = 0;
      if (S.c.bg !== 'photos' && ambient.shown) clearTable();
      return;
    }
    if (!ambient.timer && !ambient.busy) nextAmbient();
  }
  function nextAmbient() {
    ambient.busy = true;
    FEEDS.photos.next(function (url, err) {
      var img, ready, seconds = ambient.placed < TABLE_SEED ? 2 : FEEDS.photos.every();
      ambient.busy = false; ambient.error = err ? err.message : null;
      // The first few come quickly so the table is not bare at startup.
      clearTimeout(ambient.timer);
      ambient.timer = setTimeout(function () { ambient.timer = 0; syncAmbient(); }, seconds * QA.minuteMs / 60);
      if (!url) return;
      if (!ambientWanted()) { window.URL.revokeObjectURL(url); return; }
      img = new Image(); img.alt = ''; img.src = url;
      ready = img.decode ? img.decode() : new Promise(function (resolve, reject) { img.onload = resolve; img.onerror = reject; });
      ready.then(function () {
        var el;
        if (!ambientWanted() || !img.naturalWidth) { window.URL.revokeObjectURL(url); return; }
        el = printEl(img.naturalWidth / img.naturalHeight); el._url = url;
        el.appendChild(img); ambient.table.appendChild(el); ambient.placed++;
        trimTable();
        if (!ambient.shown) { ambient.shown = true; render(); }
      }, function () { window.URL.revokeObjectURL(url); });
    });
  }

  function renderSheet(t, sheet) {
    var key;
    sheetEl.hidden = !(sheet || isSettingsDetail(t));
    sheetView.hidden = !sheet;
    if (sheet) sheetView.setAttribute('aria-modal', 'true');
    else sheetView.removeAttribute('aria-modal');
    sceneEl.setAttribute('aria-hidden', sheet || isSettingsDetail(t) ? 'true' : 'false');
    if (!sheet) { sheetView.innerHTML = ''; sheetKey = ''; return; }
    key = t.id + '|' + (t.mode || '') + '|' + (t.msg || '') + '|' + S.c.bg;
    if (key !== sheetKey) {
      sheetView.innerHTML = FRAMES[t.id](t);
      sheetKey = key; slotEls = {};
      Array.prototype.forEach.call(sheetView.querySelectorAll('[data-slot]'), function (el) { slotEls[el.getAttribute('data-slot')] = el; });
    }
    FILLS[t.id](t, slotEls);
  }
  function renderAppearance(t) {
    appearanceEl.hidden = !isSettingsDetail(t);
    if (appearanceEl.hidden) { appearanceEl.removeAttribute('aria-modal'); return; }
    appearanceEl.setAttribute('aria-modal', 'true');
    if (t.id === 'wallpaper') { renderWallpaper(t); return; }
    V.appearance.norm(t);
    appearanceEl.className = 'appearance detail-' + t.group;
    appearanceRows.className = 'appearance-rows';
    appearanceTitle.textContent = DETAIL_NAMES[t.group];
    var at = detailLocation(t), selected = at.item, error = S.lookError, status = '', hint;
    function command(item, inner, cls) {
      var applied = item.axis && S.c[item.axis] === item.value;
      var loading = !!(item.axis && S.pending && S.pending.target[item.axis] === item.value && S.pending.row === item.axis);
      return '<button type="button" tabindex="-1" class="setting-choice' + (cls ? ' ' + cls : '') + (t.f.action === item.action ? ' is-focus' : '') + (item.disabled ? ' is-disabled' : '') + (applied ? ' is-applied' : '') + (loading ? ' is-loading' : '') + '"'
        + (item.axis ? ' role="radio" aria-checked="' + !!applied + '"' : '') + ' aria-label="' + esc(item.axis && item.value === 'both' ? 'Icons and text' : item.label) + '" aria-disabled="' + !!item.disabled + '" aria-busy="' + loading + '"'
        + ' data-z="detail" data-i="0" data-id="' + item.action + '" data-action="' + item.action + '">' + inner
        + (item.axis ? '<span class="setting-tick" aria-hidden="true">' + (applied ? icon('check') : '') + '</span>' : '') + '</button>';
    }
    setHTML(appearanceBack, command({ action: 'settings.back', label: backLabel(t) }, icon('left') + '<span>' + backLabel(t) + '</span>', 'setting-back'));
    setHTML(appearanceRows, detailSections(t).map(function (section) {
      return '<section class="setting-section' + (section.horizontal ? ' is-horizontal' : '') + ' section-' + section.id + '">'
        + (section.title ? '<h3 class="setting-label" id="setting-' + section.id + '">' + section.title + '</h3>' : '')
        + '<div class="setting-options"' + (section.items[0].axis ? ' role="radiogroup" aria-label="' + esc(section.title || LOOK_NAMES[section.id] || DETAIL_NAMES[t.group]) + '"' : '') + '>'
        + section.items.map(function (item) {
          var swatch = item.axis === 'bg', body = '';
          if (swatch || item.thumbnail) body += item.value === 'light' || item.value === 'dark' || item.value === 'photos'
            ? '<span class="setting-swatch swatch-' + item.value + '" aria-hidden="true">' + (item.value === 'photos' ? icon('art') : '') + '</span>'
            : '<img class="setting-swatch" src="' + WP + S.c.wall + '-thumb.jpg" alt="">';
          body += '<span class="setting-copy"><span class="setting-name">' + esc(item.label) + '</span>'
            + (item.description ? '<span class="setting-description">' + esc(item.description) + '</span>' : '') + '</span>';
          if (!item.axis) body += icon('right', 'setting-forward');
          return command(item, body, item.description ? 'has-description' : '');
        }).join('') + '</div>'
        + (section.reason ? '<p class="setting-reason">' + esc(section.reason) + '</p>' : '') + '</section>';
    }).join(''));
    if (S.pending) status = '<p>Loading ' + esc(S.pending.row === 'font' ? FONTS[S.pending.target.font].name : 'your choice') + '…</p><p>Back cancels this change.</p>';
    else if (error) {
      status = '<p class="setting-error">' + (error.type === 'save' ? 'Couldn’t save this change.' : error.type === 'font' ? 'Couldn’t load ' + esc(FONTS[error.font].name) + '.' : 'Couldn’t load this appearance.') + ' Your current choice is kept.</p>'
        + command({ action: 'settings.retry', label: 'Try again' }, '<span>Try again</span>', 'setting-retry');
    }
    setHTML(appearanceStatus, status);
    hint = selected.disabled ? '' : selected.action === 'settings.back' ? 'Return to ' + backLabel(t) : selected.action === 'settings.retry' ? 'Retry this change' : selected.axis ? 'Apply selected setting' : selected.action === 'background.wallpaper' ? 'Choose a wallpaper' : selected.action === 'background.rotation' ? 'Choose a rotation interval' : 'Open on the TV';
    setHTML(appearanceDesc, hint ? '<span class="remote-key">OK</span><span>' + esc(hint) + '</span>' : '');
  }
  function renderWallpaper(t) {
    V.wallpaper.norm(t);
    appearanceEl.className = 'appearance detail-wallpaper';
    appearanceTitle.textContent = 'Wallpaper';
    appearanceRows.className = 'appearance-rows wallpaper-picker';
    setHTML(appearanceBack, '<button type="button" tabindex="-1" class="setting-choice setting-back' + (t.f.zone === 'back' ? ' is-focus' : '') + '" data-z="wall-back" data-action="wallpaper.back">' + icon('left') + '<span>Background</span></button>');
    setHTML(appearanceRows, '<div class="wallpaper-edge wallpaper-before" aria-hidden="true">' + icon('up') + '</div><div class="wallpaper-list" role="radiogroup" aria-label="Wallpaper"><div class="wallpaper-rows"></div></div><div class="wallpaper-edge wallpaper-after" aria-hidden="true">' + icon('down') + '</div>');
    var rows = appearanceRows.querySelector('.wallpaper-rows'), shown = wall(S.wallShown) || wall(S.c.wall), candidate = WALLS[t.i], status, note, hint;
    keyed(rows, WALLS.map(function (w) { return { key: w.id, wall: w }; }), function (row, item, i) {
      var visible = i >= t.top && i < t.top + WALL_VISIBLE, w = item.wall, image;
      setContent(row, w.id + '|' + visible, function () { return '<span class="wallpaper-thumb">' + (visible ? '<img src="' + WP + w.id + '-thumb.jpg" alt="">' : '') + '</span><span class="setting-copy"><span class="setting-name">' + esc(w.name) + '</span></span><span class="setting-tick" aria-hidden="true"></span>'; });
      row.className = 'setting-choice wallpaper-choice' + (t.f.zone === 'photo' && t.i === i ? ' is-focus' : '') + (w.id === S.c.wall ? ' is-applied' : '');
      row.style.transform = 'translate3d(0,' + (i * WALL_ROW) + 'px,0)'; row.style.visibility = visible ? 'visible' : 'hidden';
      row.setAttribute('role', 'radio'); row.setAttribute('tabindex', '-1'); row.setAttribute('aria-label', w.name);
      row.setAttribute('aria-checked', String(w.id === S.c.wall)); row.setAttribute('aria-posinset', String(i + 1)); row.setAttribute('aria-setsize', String(WALLS.length));
      row.setAttribute('aria-busy', String(t.previewDue === w.id || S.wallPending === w.id));
      attrs(row, 'wall-choice', i, 'wallpaper.choose.' + w.id);
      setHTML(row.querySelector('.setting-tick'), w.id === S.c.wall ? icon('check') : '');
      image = row.querySelector('img');
      if (image && !image._wallBound) {
        image._wallBound = true;
        image.onerror = function () { this.parentNode.className = 'wallpaper-thumb is-missing'; };
        if (image.complete && !image.naturalWidth) image.onerror();
      }
    });
    rows.style.transform = 'translate3d(0,' + (-t.top * WALL_ROW) + 'px,0)';
    appearanceRows.querySelector('.wallpaper-before').className = 'wallpaper-edge wallpaper-before' + (t.top > 0 ? ' is-on' : '');
    appearanceRows.querySelector('.wallpaper-after').className = 'wallpaper-edge wallpaper-after' + (t.top + WALL_VISIBLE < WALLS.length ? ' is-on' : '');
    note = t.previewDue ? 'Preparing ' + candidate.name + '…' : S.wallPending ? (t.applyPending ? 'Applying ' : 'Loading ') + candidate.name + '…' : shown.id === S.c.wall ? 'Applied' : 'Preview';
    if (t.failedId) note = S.err ? 'Couldn’t save ' + wall(t.failedId).name + '.' : 'Couldn’t load ' + wall(t.failedId).name + '.';
    status = '<p class="wallpaper-preview-name"><span>' + esc(shown.name) + '</span><span class="wallpaper-count">' + (wallIndex(shown.id) + 1) + ' of ' + WALLS.length + '</span></p><p class="wallpaper-preview-state' + (t.failedId ? ' setting-error' : '') + '">' + esc(note) + '</p>';
    if (t.failedId) status += '<button type="button" tabindex="-1" class="setting-choice setting-retry' + (t.f.zone === 'retry' ? ' is-focus' : '') + '" data-z="wall-retry" data-action="wallpaper.retry">Try again</button>';
    setHTML(appearanceStatus, status);
    hint = t.f.zone === 'back' ? 'Return to Background' : t.f.zone === 'retry' ? 'Retry this photo' : 'Apply selected photo';
    if (t.f.zone === 'photo' && candidate.id === S.c.wall && !S.pending && !t.failedId) hint = '';
    setHTML(appearanceDesc, hint ? '<span class="remote-key">OK</span><span>' + hint + '</span>' : '');
  }
  /* A failed save is reported beside the focused control without moving focus. */
  function renderFocusStatus(t) {
    var root = sheetEl.hidden ? homeEl : sheetEl, active = root.querySelectorAll('.is-focus[data-action]'), target = null, i, r, sr, scale;
    if (isSettingsDetail(t) || !S.err) { focusStatus.className = 'focus-status'; return; }
    for (i = 0; i < active.length; i++) if (renderedAction(active[i])) { target = active[i]; break; }
    if (!target) { focusStatus.className = 'focus-status'; return; }
    r = target.getBoundingClientRect(); sr = stage.getBoundingClientRect(); scale = sr.width / 1920 || 1;
    focusStatus.className = 'focus-status is-on';
    focusStatus.textContent = 'Not saved. OK tries again.';
    focusStatus.style.left = clamp((r.left - sr.left) / scale, 112, 1408) + 'px';
    focusStatus.style.top = clamp((r.bottom - sr.top) / scale + 12, 72, 988) + 'px';
    focusStatus.style.width = '400px';
  }
  function headButtons(list, fi, prefix) {
    return list.map(function (b, i) {
      return '<button type="button" tabindex="-1" class="btn' + (i === fi ? ' is-focus' : '') + (b[2] ? ' ' + b[2] : '') + '" data-z="head" data-i="' + i + '" data-action="' + prefix + '.' + b[0] + '" aria-label="' + esc(b[0] === 'undo' ? undoCaption() : b[1]) + '">' + (b[3] ? icon(b[3]) : '') + '<span>' + b[1] + '</span></button>';
    }).join('');
  }
  var FRAMES = {
    apps: function () {
      return '<h2 class="s-title" data-slot="title"></h2><p class="s-sub" data-slot="sub"></p><div class="s-head" data-slot="head"></div>'
        + '<div class="grid-view" data-slot="view"><div class="grid-in" data-slot="grid"></div></div>'
        + '<div class="row-cue grid-before" data-slot="before" aria-hidden="true">' + icon('up') + '</div><div class="row-cue grid-after" data-slot="after" aria-hidden="true">' + icon('down') + '</div>';
    },
    editor: function () {
      return '<h2 class="s-title">Apps on Home</h2><p class="s-sub" data-slot="sub"></p><div class="s-head" data-slot="head"></div>'
        + '<p class="s-label z-home" data-slot="lh"></p><p class="s-label z-other">Not on Home</p>'
        + '<div class="ed-home" data-slot="home"></div><div class="ed-order-break" data-slot="break">Then scroll</div><div class="ed-other-view" data-slot="ov"><div class="ed-other" data-slot="other"></div></div><div class="ed-origin" data-slot="origin"></div>'
        + '<div class="row-cue editor-before" data-slot="otherBefore" aria-hidden="true">' + icon('up') + '</div><div class="row-cue editor-after" data-slot="otherAfter" aria-hidden="true">' + icon('down') + '</div>';
    },
    ha: function () {
      return '<h2 class="s-title">Home</h2><p class="s-sub" data-slot="sub"></p><div class="ha-view" data-slot="view"><div class="ha-in" data-slot="grid"></div></div>'
        + '<div class="row-cue ha-before" data-slot="before" aria-hidden="true">' + icon('up') + '</div><div class="row-cue ha-after" data-slot="after" aria-hidden="true">' + icon('down') + '</div>';
    },
    settings: function () { return '<h2 class="s-title">Settings</h2><div class="settings-overview" data-slot="list"></div><p class="settings-overview-hint"><span class="remote-key">OK</span><span>Open selected group</span></p>'; },
    message: function (t) {
      var m = messageContent(t);
      return '<h2 class="msg-title">' + esc(m.title) + '</h2><p class="msg-line">' + esc(m.line) + '</p><p class="msg-note">' + esc(m.note) + '</p><div class="msg-acts" data-slot="acts"></div>';
    }
  };
  function gridTileHtml(id) {
    var a = app(id), state = onHome(id) ? badge(true) + '<span>On Home</span>' : '';
    return '<span class="panel-content">' + appMark(a, 120, 72, 58) + '<span class="label">' + esc(a.name) + '</span></span><span class="state">' + state + '</span>';
  }
  var FILLS = {
    ha: function (t, el) {
      var L = haLayout(), cur = L.tiles[t.f.i], st = feed('home'), items;
      setHTML(el.sub, esc(S.note || (st.status === 'error' ? st.error : st.status === 'loading' && !st.data ? 'Connecting to Home Assistant…' : 'OK turns a device on or off, or runs a routine.')));
      if (cur) {
        if (cur.y < t.top + HA_HEAD) t.top = Math.max(0, cur.y - HA_HEAD);
        if (cur.y + HA_TILE_H > t.top + HA_VIEW) t.top = cur.y + HA_TILE_H - HA_VIEW;
      }
      t.top = clamp(t.top, 0, Math.max(0, L.height - HA_VIEW));
      items = L.heads.map(function (h) { return { key: h.key, head: h }; }).concat(L.tiles.map(function (tile, i) { return { key: tile.key, tile: tile, i: i }; }));
      keyed(el.grid, items, function (node, it) {
        var tile = it.tile, d;
        if (it.head) {
          setContent(node, 'h|' + it.head.name, function () { return esc(it.head.name); });
          node.className = 'ha-head'; node.style.transform = 'translate3d(0,' + it.head.y + 'px,0)';
          return;
        }
        d = tile.item;
        setContent(node, [d.id, d.name, d.icon, d.state].join('|'), function () {
          return '<span class="panel-content">' + FEEDS.icon(d.icon, 'ha-ico') + '<span class="ha-name">' + esc(d.name) + '</span><span class="ha-state">' + esc(d.state) + '</span></span>';
        });
        node.className = 'ha-tile' + (it.i === t.f.i ? ' is-focus' : '') + (d.on ? ' is-on' : '') + (d.na ? ' is-na' : '') + (d.routine ? ' is-routine' : '');
        node.style.transform = 'translate3d(' + tile.x + 'px,' + tile.y + 'px,0)';
        node.setAttribute('role', 'button'); node.setAttribute('aria-label', d.name + ', ' + d.state);
        attrs(node, 'ha', it.i, 'ha.entity.' + d.id);
      });
      el.grid.style.transform = 'translate3d(0,' + (-t.top) + 'px,0)';
      el.before.className = 'row-cue ha-before' + (t.top > 0 ? ' is-on' : '');
      el.after.className = 'row-cue ha-after' + (L.height - t.top > HA_VIEW ? ' is-on' : '');
    },
    apps: function (t, el) {
      var f = t.f, items = appsItems(), n = items.length, rows = Math.ceil(n / COLS), vis = 3, row = Math.floor(f.i / COLS);
      setHTML(el.title, 'All apps');
      setHTML(el.sub, esc(catalog.loading ? 'Loading installed apps…' : catalog.error || (!n ? 'No installed apps found.' : '')));
      setHTML(el.head, headButtons(appsHead(), f.zone === 'head' ? 0 : -1, 'apps'));
      el.head.className = 's-head' + (f.zone === 'head' ? ' is-awake' : '');
      if (f.zone === 'grid') { if (row < t.top) t.top = row; if (row > t.top + vis - 1) t.top = row - vis + 1; }
      t.top = clamp(t.top, 0, Math.max(0, rows - vis));
      keyed(el.grid, items.map(function (id) { return { key: id, id: id }; }), function (tile, it, i) {
        var focus = f.zone === 'grid' && i === f.i;
        setContent(tile, [it.id, app(it.id).name, onHome(it.id)].join('|'), function () { return gridTileHtml(it.id); });
        tile.className = 'gt' + (focus ? ' is-focus' : '');
        tile.style.transform = 'translate3d(' + ((i % COLS) * GRID_COL) + 'px,' + (Math.floor(i / COLS) * GRID_ROW) + 'px,0)';
        tile.setAttribute('role', 'button'); tile.setAttribute('aria-label', app(it.id).name);
        attrs(tile, 'grid', i, 'apps.open.' + it.id);
      });
      el.grid.style.transform = 'translate3d(0,' + (-t.top * GRID_ROW) + 'px,0)';
      el.view.className = 'grid-view' + (t.top > 0 ? ' more-before' : '') + (rows - t.top > vis ? ' more-after' : '');
      el.before.className = 'row-cue grid-before' + (t.top > 0 ? ' is-on' : '');
      el.after.className = 'row-cue grid-after' + (rows - t.top > vis ? ' is-on' : '');
    },
    editor: function (t, el) {
      var f = t.f, H = t.lifted ? t.lifted.order : S.c.home, O = otherGroups(), list = O.recent.concat(O.rest), full = S.c.home.length >= CAP;
      var entries = [], ys = [], y = 0, yf, minTop, maxTop = 0, rowEnd, before = false, afterRows = false;
      var hint = catalog.error ? catalog.error : catalog.loading ? 'Loading installed apps…' : f.zone === 'head' && f.h === 0 ? undoCaption() : f.zone === 'home' && f.part === 'remove' ? (H.length <= 1 ? LAST : app(H[f.i]).name + ' stays installed.') : '';
      setHTML(el.sub, editStatus(hint, t.lifted ? 'Moving ' + app(t.lifted.id).name + '. OK places it, Back puts it back.' : ''));
      setHTML(el.head, headButtons([['undo', 'Undo', S.undo.length ? '' : 'is-idle', 'undo'], ['done', 'Done', '', 'check']], f.zone === 'head' ? f.h : -1, 'editor'));
      el.head.className = 's-head' + (f.zone === 'head' ? ' is-awake' : '');
      setHTML(el.lh, 'On Home <span class="s-count">' + S.c.home.length + ' of ' + CAP + '</span>');
      el['break'].className = 'ed-order-break' + (H.length > editorCut() ? ' is-on' : '');
      el['break'].style.top = (264 + editorCut() * ED_ROW) + 'px';

      keyed(el.home, H.map(function (id) { return { key: id, id: id }; }), function (row, it, i) {
        var a = app(it.id), here = f.zone === 'home' && i === f.i, lifted = !!t.lifted && i === f.i;
        setContent(row, it.id, function () { return '<div class="er-name" role="button"><span class="panel-content"><span class="er-num"></span>' + smallMark(a) + '<span class="er-text">' + esc(a.name) + '</span><span class="er-move">' + icon('updown') + '</span></span></div><div class="er-rm" role="button"><span></span></div>'; });
        row.className = 'er' + (here ? ' is-active' : '') + (lifted ? ' is-lifted' : '');
        row.style.transform = 'translate3d(' + (lifted ? 16 : 0) + 'px,' + editorHomeY(i) + 'px,0)';
        row.querySelector('.er-num').textContent = String(i + 1);
        row.firstChild.className = 'er-name' + (here && (f.part === 'name' || lifted) ? ' is-focus' : '');
        row.lastChild.className = 'er-rm' + (here && f.part === 'remove' && !lifted ? ' is-focus' : '') + (H.length <= 1 ? ' is-limit' : '');
        row.lastChild.firstChild.textContent = H.length <= 1 ? LAST : 'Remove from Home';
        attrs(row.firstChild, 'name', i, 'editor.move.' + it.id);
        attrs(row.lastChild, 'remove', i, 'editor.remove.' + it.id);
      });
      el.origin.className = 'ed-origin' + (t.lifted && t.lifted.from !== f.i ? ' is-on' : '');
      if (t.lifted) el.origin.style.transform = 'translate3d(0,' + (264 + editorHomeY(t.lifted.from) + 16) + 'px,0)';

      if (O.recent.length) { entries.push({ key: 'sep-recent', sep: 'Recently removed', y: y }); y += ED_SEP; }
      O.recent.forEach(function (id) { entries.push({ key: id, id: id, y: y }); ys.push(y); y += ED_ROW; });
      if (O.recent.length && O.rest.length) { entries.push({ key: 'sep-rest', sep: 'Other installed apps', y: y }); y += ED_SEP; }
      O.rest.forEach(function (id) { entries.push({ key: id, id: id, y: y }); ys.push(y); y += ED_ROW; });
      if (f.zone === 'other' && ys.length) {
        yf = ys[f.j] - (O.recent.length && (f.j === 0 || f.j === O.recent.length) ? ED_SEP : 0);
        if (yf < t.top) t.top = yf;
        if (ys[f.j] + 72 > t.top + ED_VIEW) {
          minTop = ys[f.j] + 72 - ED_VIEW;
          entries.some(function (it) { if (it.y < minTop) return false; t.top = it.y; return true; });
        }
      }
      entries.some(function (it) { if (it.y < Math.max(0, y - ED_VIEW)) return false; maxTop = it.y; return true; });
      t.top = clamp(t.top, 0, maxTop);
      keyed(el.other, entries, function (row, it) {
        var j, focus, a;
        row.style.transform = 'translate3d(0,' + it.y + 'px,0)';
        rowEnd = it.y + (it.sep ? ED_SEP : 72);
        row.style.visibility = it.y >= t.top && rowEnd <= t.top + ED_VIEW ? 'visible' : 'hidden';
        before = before || it.y < t.top; afterRows = afterRows || rowEnd > t.top + ED_VIEW;
        if (it.sep) { setContent(row, 'sep|' + it.sep, function () { return esc(it.sep); }); row.className = 'eo-sep'; return; }
        j = list.indexOf(it.id); focus = f.zone === 'other' && j === f.j; a = app(it.id);
        setContent(row, it.id, function () { return '<span class="panel-content">' + smallMark(a) + '<span class="eo-text">' + esc(a.name) + '</span><span class="eo-verb"></span></span>'; });
        setHTML(row.querySelector('.eo-verb'), focus ? '<span class="verb' + (full ? ' is-off' : '') + '">' + (full ? 'Home is full' : 'Add to Home') + '</span>' : '');
        row.className = 'eo' + (focus ? ' is-focus' : '');
        row.setAttribute('role', 'button');
        attrs(row, 'other', j, 'editor.add.' + it.id);
      });
      el.other.style.transform = 'translate3d(0,' + (-t.top) + 'px,0)';
      el.ov.className = 'ed-other-view';
      el.otherBefore.className = 'row-cue editor-before' + (before ? ' is-on' : '');
      el.otherAfter.className = 'row-cue editor-after' + (afterRows ? ' is-on' : '');
    },
    settings: function (t, el) {
      var html = '';
      settingsRows().forEach(function (r) {
        html += '<button type="button" tabindex="-1" class="settings-group' + (r.id === t.f.id ? ' is-focus' : '') + '" data-z="row" data-i="0" data-id="' + r.id + '" data-action="settings.' + (r.id === 'editor' ? 'editor' : 'group.' + r.id) + '"><span class="settings-group-copy"><span class="settings-group-name">' + esc(r.label) + '</span><span class="settings-group-value">' + esc(r.value) + '</span></span>' + icon('right') + '</button>';
      });
      setHTML(el.list, html);
    },
    message: function (t, el) {
      setHTML(el.acts, messageContent(t).actions.map(function (a, i) {
        return '<button type="button" tabindex="-1" class="btn' + (i === t.f.b ? ' is-focus' : '') + '" data-z="act" data-i="' + i + '" data-action="message.' + a[0] + '"><span>' + a[1] + '</span></button>';
      }).join(''));
    }
  };

  /* ---------- Atomic appearance bundles ---------- */
  var wallToken = 0, committedBundle = null, reflowToken = 0, fontSwitchToken = 0;
  function makeImg(cls, src) { var im = document.createElement('img'); im.className = cls; im.alt = ''; im._src = src; im.src = src; return im; }
  function whenReady(im, done) {
    var fin = false, timer = setTimeout(function () { finish(!!(im.complete && im.naturalWidth)); }, document.hidden ? 20000 : 8000);
    function finish(ok) { if (fin) return; fin = true; clearTimeout(timer); done(ok); }
    function ready() {
      // Hidden TV prelaunch may suspend decode even after a valid image loads.
      if (document.hidden || !im.decode) { finish(true); return; }
      im.decode().then(function () { finish(true); }, function () { finish(!!(im.complete && im.naturalWidth)); });
    }
    if (im.complete) { if (im.naturalWidth) ready(); else finish(false); }
    else { im.onload = ready; im.onerror = function () { finish(false); }; }
  }
  function swapImg(k, im) { var old = IMG[k]; if (old === im) return; im.style.cssText = old.style.cssText; if (old.id) im.id = old.id; old.parentNode.replaceChild(im, old); IMG[k] = im; }
  function bundleKey(look) { return look.wall + '|' + look.material; }
  function loadBundle(look, token, done) {
    var imgs = { photo: makeImg('photo', WP + look.wall + '.jpg'), bg: makeImg('sheet-bg', WP + look.wall + '-panel.jpg') }, keys, left, allOk = true;
    keys = Object.keys(imgs); left = keys.length;
    keys.forEach(function (k) { whenReady(imgs[k], function (ok) {
      allOk = allOk && ok;
      if (--left || token !== wallToken) return;
      done(allOk ? { key: bundleKey(look), imgs: imgs } : null);
    }); });
  }
  function installBundle(bundle, look, previewOnly) {
    if (bundle) {
      Object.keys(bundle.imgs).forEach(function (k) { if (!previewOnly || k !== 'bg') swapImg(k, bundle.imgs[k]); });
      S.bundleKey = bundle.key;
    }
    S.shown = { bg: look.bg, wall: look.wall, material: look.material, font: look.font };
    S.wallShown = look.wall; S.wallPending = null; S.wallError = null;
  }
  function cleanPatch(patch) {
    var out = {}, k;
    if (!patch || typeof patch !== 'object') throw new Error('look needs an appearance patch');
    for (k in patch) if (patch.hasOwnProperty(k)) {
      if (k === 'wall') { if (!wall(patch[k])) throw new Error('Unknown wallpaper: ' + patch[k]); }
      else if (k === 'font') { if (!FONTS[patch[k]] || patch[k] !== 'manrope' && PRIVATE_FONTS.indexOf(patch[k]) < 0) throw new Error('Unavailable font: ' + patch[k]); }
      else if (!LOOK_VALUES[k] || LOOK_VALUES[k].indexOf(patch[k]) < 0) throw new Error('Invalid appearance value: ' + k);
      out[k] = patch[k];
    }
    return out;
  }
  function cancelLook() { wallToken++; S.pending = null; S.wallPending = null; S.lookError = null; }
  function setLook(patch, options) {
    var opts = options || {}, changes = cleanPatch(patch), target = lookOf(S.c), k, token, needs, needsFont, changed, loadedBundle = null, imageDone, fontDone, failed = false;
    for (k in changes) if (changes.hasOwnProperty(k)) target[k] = changes[k];
    changed = Object.keys(target).some(function (key) { return target[key] !== S.c[key]; });
    cancelLook(); S.err = null; token = wallToken;
    function finish(bundle) {
      var c = next(S.c.home.slice(), S.c.recent.slice()), fontChanged = target.font !== S.c.font, reflow = target.apps !== S.c.apps || target.controls !== S.c.controls || fontChanged, frame, fontFrame;
      Object.keys(target).forEach(function (key) { c[key] = target[key]; });
      S.pending = null; S.wallPending = null;
      if (!opts.transient && changed && !write(c, 'Appearance')) { S.lookError = { type: 'save', patch: changes, row: opts.row || S.appearanceFocus, transient: false }; render(); syncRotation(); return; }
      if (opts.transient) S.c = c;
      if (reflow) { S.reflow = true; frame = ++reflowToken; }
      if (fontChanged) { S.fontSwitch = true; fontFrame = ++fontSwitchToken; }
      installBundle(bundle, target);
      if (bundle) committedBundle = bundle;
      S.lookError = null; S.previewBundle = null;
      render(); syncRotation();
      if (reflow) window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
        if (frame !== reflowToken) return;
        S.reflow = false; stage.className = stage.className.replace(/\s+is-reflow/g, '');
      }); });
      if (fontChanged) setTimeout(function () {
        if (fontFrame !== fontSwitchToken) return;
        S.fontSwitch = false; stage.className = stage.className.replace(/\s+is-font-switch/g, '');
      }, REDUCED_MOTION ? 130 : 170);
    }
    function fail(type, reason) {
      if (token !== wallToken || failed) return;
      failed = true; S.pending = null; S.wallPending = null;
      if (type === 'load') S.wallError = target.wall;
      S.lookError = { type: type, reason: reason || null, patch: changes, row: opts.row || (type === 'font' ? 'font' : S.appearanceFocus), transient: !!opts.transient, wall: target.wall, font: target.font };
      if (type === 'font') log((opts.startup ? 'font fallback: ' : 'Font kept: ') + (opts.startup ? target.font : FONTS[S.c.font].name) + (opts.startup ? '' : ' (' + reason + ')'));
      if (type === 'font' && opts.startup && target.font !== 'manrope') { setLook({ font: 'manrope' }, { transient: true }); return; }
      render(); syncRotation();
    }
    function complete() {
      if (!imageDone || !fontDone || failed || token !== wallToken) return;
      if (document.hidden) { finish(loadedBundle); return; }
      window.requestAnimationFrame(function () { if (!failed && token === wallToken) finish(loadedBundle); });
    }
    needs = photoBg(target) && S.bundleKey !== bundleKey(target) && (!S.shown || !photoBg(S.shown) || target.wall !== S.c.wall);
    needsFont = !fontMetrics[target.font]; imageDone = !needs; fontDone = !needsFont;
    if (!needs && !needsFont) { finish(null); return; }
    S.pending = { patch: changes, target: target, row: opts.row || (needsFont ? 'font' : S.appearanceFocus), transient: !!opts.transient, preview: false };
    if (needs) {
      S.wallPending = target.wall;
      loadBundle(target, token, function (bundle) {
        if (!bundle) { fail('load'); return; }
        loadedBundle = bundle; imageDone = true; complete();
      });
    }
    if (needsFont) ensureFont(target.font, function (ok, reason) {
      if (!ok) { fail('font', reason); return; }
      fontDone = true; complete();
    });
    render();
  }
  function showWall(id, done) {
    var target = lookOf(S.c), token;
    if (target.bg !== 'photos') target.bg = 'photo';
    target.wall = id;
    cancelLook(); token = wallToken; S.wallError = null;
    S.pending = { patch: { wall: id }, target: target, row: 'bg', preview: true, transient: false }; S.wallPending = id;
    loadBundle(target, token, function (bundle) {
      S.pending = null; S.wallPending = null;
      if (!bundle) { S.wallError = id; done(false); return; }
      S.previewBundle = bundle; installBundle(bundle, target, true); done(true);
    });
    render();
  }
  function restoreLook() {
    cancelLook(); S.previewBundle = null;
    if (photoBg() && committedBundle && committedBundle.key === bundleKey(S.c)) installBundle(committedBundle, S.c);
    else if (!photoBg() || S.bundleKey === bundleKey(S.c)) installBundle(null, S.c);
    else setLook({}, { transient: true });
  }

  /* ---------- Lifecycle and remote input ---------- */
  var clockTimer = 0, rotationTimer = 0, activeSince = 0, activeMs = 0, rotationKey = '';
  function rotationActive() { return !document.hidden && top().id === 'home' && S.c.bg === 'photo' && !S.pending && mode().min > 0; }
  function pauseRotation() {
    if (activeSince) { activeMs += Date.now() - activeSince; activeSince = 0; }
    clearTimeout(rotationTimer); rotationTimer = 0;
  }
  function resetRotation() { pauseRotation(); activeMs = 0; rotationKey = ''; }
  function syncRotation() {
    var key = S.c.wall + '|' + S.c.mode;
    pauseRotation();
    if (key !== rotationKey) { activeMs = 0; rotationKey = key; }
    if (!rotationActive()) return;
    activeSince = Date.now();
    rotationTimer = setTimeout(function () {
      pauseRotation(); activeMs = 0;
      if (rotationActive()) setLook({ wall: WALLS[(wallIndex(S.c.wall) + 1) % WALLS.length].id }, { row: 'bg' });
    }, Math.max(10, mode().min * QA.minuteMs - activeMs));
  }
  function updateClock() {
    clearTimeout(clockTimer);
    if (document.hidden) return;
    if (top().id === 'home' || isSettingsDetail(top())) renderMasthead();
    clockTimer = setTimeout(updateClock, 60000 - (Date.now() % 60000) + 30);
  }
  function focusStage() { try { stage.focus({ preventScroll: true }); } catch (e) { stage.focus(); } }
  function after() {
    norm(); var t = top();
    if (t.group === 'inputs' && t.refreshInputs && !t.loading && !document.hidden) { t.refreshInputs = false; loadInputs(t); }
    render(); syncRotation();
  }
  function refreshInputsOnReturn() { var t = top(); if (t.group === 'inputs' && !t.loading) t.refreshInputs = true; }
  function goScene(name) {
    FrameDevice.cancelSource();
    if (top().id === 'wallpaper') cancelWallpaperTimer(top());
    if (top().id === 'ha') FEEDS.home.fast(false);
    S.stack = [S.stack[0]]; S.stack[0].f.zone = 'rails'; clearSession(); restoreLook();
    if (name === 'apps') openApps();
    else if (name === 'settings') openSettings();
    else if (name === 'appearance') { openSettings(); top().f.id = 'background'; S.settingsFocus = 'background'; openAppearance('background'); }
    else if (name === 'editor') { openSettings(); openEditor('settings'); }
    after();
  }
  function fit() {
    var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = 'scale(' + scale + ')';
    stage.style.left = ((window.innerWidth - 1920 * scale) / 2) + 'px';
    stage.style.top = ((window.innerHeight - 1080 * scale) / 2) + 'px';
  }
  function renderedAction(el) {
    return el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  }
  function focusedAction() {
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, els = root.querySelectorAll('.is-focus[data-action]'), i;
    for (i = 0; i < els.length; i++) if (renderedAction(els[i])) return els[i].getAttribute('data-action');
    return null;
  }
  function activate(action) {
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, els = root.querySelectorAll('[data-action]'), i;
    if (action === 'appearance.bg' && top().id === 'appearance' && top().group === 'background') action = 'background.wallpaper';
    if (action === 'settings.appearance' && top().id === 'settings') action = 'settings.group.background';
    for (i = 0; i < els.length; i++) if (renderedAction(els[i]) && els[i].getAttribute('data-action') === action) { pointAt(els[i]); return true; }
    return false;
  }
  function pointAt(el) {
    var t = top(), v = V[t.id];
    norm();
    if (v.point) v.point(t, el.getAttribute('data-z'), +el.getAttribute('data-i'), el.getAttribute('data-id'));
    norm();
    render();
    syncRotation();
  }

  stage.addEventListener('click', function (ev) {
    var el = ev.target;
    while (el && el !== stage && !(el.getAttribute && el.getAttribute('data-z'))) el = el.parentNode;
    focusStage();
    if (!el || el === stage) return;
    pointAt(el);
  });
  var heldKeys = {};
  // Media keys reach the player only; arrows/OK/Back come through KEYS.
  var MEDIA = { 10252: 'playpause', 415: 'playpause', 19: 'playpause', 10233: 'next', 417: 'next', 10232: 'prev', 412: 'prev', 413: 'back' };
  document.addEventListener('keydown', function (ev) {
    var code = ev.keyCode, k = KEYS[code], pk;
    if (code === 9) { ev.preventDefault(); return; }
    if (plexPlayer.active()) {
      pk = k || MEDIA[code];
      if (!pk || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      ev.preventDefault();
      if (pk === 'ok' || pk === 'back' || pk === 'playpause') { if (ev.repeat || heldKeys[code]) return; heldKeys[code] = true; }
      plexPlayer.key(pk);
      return;
    }
    if (!k || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    ev.preventDefault();
    if (k === 'ok' || k === 'back') { if (ev.repeat || heldKeys[code]) return; heldKeys[code] = true; }
    press(k);
  });
  document.addEventListener('keyup', function (ev) { delete heldKeys[ev.keyCode]; });
  window.addEventListener('blur', function () { heldKeys = {}; });
  window.addEventListener('focus', function () { FrameDevice.cancelSource(); release(); refreshInputsOnReturn(); focusStage(); after(); updateClock(); });
  document.addEventListener('visibilitychange', function () {
    heldKeys = {};
    if (document.hidden) { plexPlayer.hide(); FrameDevice.cancelSource(); pauseRotation(); clearTimeout(clockTimer); if (FEEDS) FEEDS.hide(); syncAmbient(); }
    else {
      release();
      if (photoBg() && !S.pending && !S.previewBundle && (!committedBundle || S.bundleKey !== bundleKey(S.c))) setLook({}, { transient: true, startup: true });
      startFeeds();
      refreshInputsOnReturn(); after(); updateClock(); focusStage();
    }
  });
  /* Integrations and installed-app discovery start only once the launcher is visible, never
     during hidden startup. Discovery runs once so older TVs resolve their own app IDs. */
  var feedsStarted = false;
  function startFeeds() {
    if (document.hidden) return;
    if (!feedsStarted) { feedsStarted = true; if (!catalog.loaded && !catalog.loading) refreshCatalog(); }
    if (FEEDS) FEEDS.show();
    syncAmbient();
  }
  if (FEEDS) FEEDS.onChange(function () {
    var t = top();
    if (t.id === 'home' || t.id === 'ha' || isSettingsDetail(t)) { norm(); render(); } else renderTicker();
  });
  window.addEventListener('resize', fit);

  /* Readable browser checks use the real state and actions, without fake outcomes. */
  var NAV = { left: 'left', right: 'right', up: 'up', down: 'down', ok: 'ok', enter: 'ok', back: 'back', escape: 'back' };
  QA.state = function () {
    var out = serialise(S.c), t = top(), item = t.id === 'appearance' ? detailLocation(t).item : null;
    out.committed = S.c; out.shown = S.shown; out.pending = S.pending; out.view = t.id; out.selected = S.sel;
    out.focusAction = focusedAction(); out.writes = S.writes; out.failedWrites = S.failed; out.error = S.err;
    out.catalog = { loading: catalog.loading, loaded: catalog.loaded, error: catalog.error, ids: ALPHA.slice() };
    out.fonts = { available: LOOK_VALUES.font.slice(), loaded: Object.keys(fontMetrics).filter(function (id) { return !fontMetrics[id].fallback; }), baselineFallback: !!(fontMetrics.manrope && fontMetrics.manrope.fallback), error: S.lookError && S.lookError.type === 'font' ? S.lookError : null };
    out.rotation = { activeMs: activeMs + (activeSince ? Date.now() - activeSince : 0), active: !!activeSince };
    out.draft = t.lifted ? { id: t.lifted.id, order: t.lifted.order.slice() } : null;
    out.settingsGroup = t.id === 'wallpaper' ? 'wallpaper' : t.id === 'appearance' ? t.group : null;
    out.focusedChoice = item && item.axis ? { axis: item.axis, value: item.value, action: item.action, disabled: item.disabled } : null;
    out.candidate = out.focusedChoice ? { axis: item.axis, value: item.value, action: item.action, pending: !!S.pending, pendingTarget: S.pending ? S.pending.target : null } : null;
    out.wallpaperPicker = t.id === 'wallpaper' ? { candidate: WALLS[t.i].id, applied: S.c.wall, shown: S.wallShown, pending: t.previewDue || S.wallPending,
      queuedApplying: !!t.applyPending, applyPending: t.applyPending, failed: t.failedId, zone: t.f.zone, top: t.top, visible: WALL_VISIBLE, backdrop: IMG.bg.src } : null;
    out.undo = S.undo.map(function (u) { return u.label; }); out.storageOk = storageOk;
    out.rails = railList().map(function (r) { return { id: r.id, items: r.items.map(function (it) { return it.action; }) }; });
    out.home = { zone: S.stack[0].f.zone, rail: S.stack[0].f.r, util: S.stack[0].f.u };
    out.feeds = FEEDS ? ['weather', 'news', 'sports', 'plex', 'home'].reduce(function (o, n) { var st = FEEDS.state(n); o[n] = { status: st.status, error: st.error }; return o; }, {}) : null;
    out.ambient = { shown: ambient.shown, error: ambient.error, prints: ambient.table.querySelectorAll('.print:not(.leaving)').length, placed: ambient.placed };
    out.player = { active: plexPlayer.active(), panel: plexPlayer.panelOpen(), playing: plexPlayer.videoPlaying(), key: plexPlayer.currentKey(), src: plexPlayer.videoSrc(), paused: plexPlayer.paused(), message: plexPlayer.message(), subtitle: plexPlayer.subtitleText(), subName: plexPlayer.subName(), upNext: plexPlayer.upNext(), choices: plexPlayer.choices() };
    return JSON.parse(JSON.stringify(out));
  };
  QA.where = function () {
    var action = focusedAction(), active = stage.querySelectorAll('.is-focus[data-action]'), count = 0, name = '';
    Array.prototype.forEach.call(active, function (el) { if (renderedAction(el)) { count++; if (el.getAttribute('data-action') === action) name = el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim(); } });
    return { view: top().id, settingsGroup: top().id === 'wallpaper' ? 'wallpaper' : top().id === 'appearance' ? top().group : null, focus: name, focusAction: action, focusCount: count, wallpaper: S.wallShown, zone: top().f.zone || null };
  };
  QA.ready = function () { return fontsReady && !S.pending && !!S.shown && S.shown.bg === S.c.bg && S.shown.wall === S.c.wall && S.shown.font === S.c.font; };
  QA.nav = function () { var keys = arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments); keys.forEach(function (key) { if (!NAV[key]) throw new Error('Unknown key'); press(NAV[key]); }); return QA.state(); };
  QA.look = function (patch) { setLook(patch, {}); return QA.state(); };
  QA.scene = function (name) { if (name === 'ha') { goScene('home'); openHa(); after(); return QA.state(); } if (['home', 'apps', 'settings', 'appearance', 'editor'].indexOf(name) < 0) throw new Error('Unknown view'); goScene(name); return QA.state(); };
  QA.activate = function (action) { return activate(action) ? QA.state() : null; };
  QA.actions = function () { var view = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl; return Array.prototype.filter.call(view.querySelectorAll('[data-action]'), renderedAction).map(function (el) { return el.getAttribute('data-action'); }); };

  /* ---------- Start ---------- */
  initialise();
  FrameDevice.registerMediaKeys();
  setLook({}, { transient: true, startup: true });
  norm(); render(); fit(); focusStage(); updateClock(); syncRotation(); startFeeds();
})();
