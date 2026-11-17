/* Public Tizen application APIs. No Mac server, network address or credentials. */
(function () {
  'use strict';
  /* Known launch targets per brand. Tizen 9 package IDs come from the reference TV; the
     numeric IDs are Samsung's long-standing store IDs used on older TVs such as 2020 models.
     YouTube and Plex numeric IDs were confirmed by the owner's TV Dashboard on a 2020 Q60T;
     the others are unverified. Installed-app discovery replaces them with the IDs the TV
     reports, matching by ID or by app name. */
  var IDS = {
    stremio: ['IkWsFHtOY9.Stremio'], netflix: ['org.tizen.netflix-app', '3201907018807'],
    disneyplus: ['MCmYXNxgcu.DisneyPlus', '3201901017640'], youtube: ['9Ur5IzDKqV.TizenYouTube', '111299001912'],
    appletv: ['com.samsung.tv.aria-video', '3201807016597'], primevideo: ['org.tizen.primevideo', '3201910019365'],
    abciview: ['mWK87Xghap.ABCiview'], sbs: ['OyE7OuxlUi.SBSOnDemand'],
    applemusic: ['org.tizen.apple.apple-music'], hbomax: ['cj37Ni3qXM.HBONow', '3201601007230'],
    hulu: ['LBUAQX1exg.Hulu', '3201601007625'], plex: ['3201512006963'], spotify: ['rJeHak5zRg.Spotify', '3201606009684']
  };
  var NAMES = { netflix: /^netflix$/i, youtube: /^youtube$/i, disneyplus: /^disney\s*\+$|^disney plus$/i, primevideo: /^(amazon )?prime video$/i,
    hbomax: /^(hbo )?max$|^hbo max$/i, hulu: /^hulu$/i, appletv: /^apple tv\+?$/i, plex: /^plex$/i, spotify: /^spotify/i };
  var STREAMING = ['as6cYRgkPy.Binge', '73iTZRTc34.Stan', '5b8c3eb16b.BeamCTVDev',
    'cj37Ni3qXM.HBONow', 'LBUAQX1exg.Hulu', 'gzcc4LRFBF.Peacock', 'rJyOSqC6Up.CBSAllAccess',
    'Rk72oKFsRS.OtterKidsProd', '70fRFUwYlD.OtterGAProd', 'PvWgqxV3Xa.YouTubeTV',
    'XtU8fQk2gN.ESPN', 'ZmmGjO6VKO.slingtv', 'VtuWAiZdHN.STARZPlay', 'ckfgqqzvt0.dplus',
    'kk8MbItQ0H.VUDU', 'Jz7aUrV2Q4.Twitch', 'OK2Rdkjmsi.IMDbTV', 'Ob3XhAVMu6.amcplus',
    'KaLitts8bq.tenplaySamsungTizen', 'eYuOiOLYQX.KayoSports', 'Ne2ZsPWdKl.9NOW',
    '3KA0pm7a7V.TubiTV', 'rJeHak5zRg.Spotify', 'icp4AvUPiA.7plus'];
  var CONSUMER_SYSTEM = ['org.tizen.browser', 'com.microsoft.copilot'];
  var EXTRA_BRANDS = {'5b8c3eb16b.BeamCTVDev': 'hbomax', '3KA0pm7a7V.TubiTV': 'tubi'};
  var INTERNAL = ['adplatform.ADPlayer', 'WykOS4t4F0.cmsWebApp', '25emanual3.emanual',
    'd0m1lV1nt2.emanual', '2022ePop01.SmartTV',
    'ZODRT12q2l.WebAccountExtension', 'ByJlgt0XeD.CastSettingsApp', 'tv6pbVMQFF.PrivacyChoices'];
  var SELF = 'nClrkHome1.FrameHome';
  function api() { return window.tizen && window.tizen.application; }
  function selfId() {
    try { return api().getCurrentApplication().appInfo.id || SELF; }
    catch (err) { return SELF; }
  }
  function unavailable(done) {
    done({ message: 'Open CleanFrame on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to CleanFrame.' };
  }
  function bounded(done, timeout) {
    var finished = false, timer = setTimeout(function () { finish({ message: 'The TV did not respond. Please try again.' }); }, timeout || 8000);
    function finish(err, value) { if (finished) return; finished = true; clearTimeout(timer); done(err, value); }
    return finish;
  }
  var sourceCancel = null;
  function cancelSource() { if (sourceCancel) sourceCancel(); }
  function sources(done) {
    var sys = window.tizen && window.tizen.systeminfo, tvw = window.tizen && window.tizen.tvwindow;
    if (!sys || typeof sys.getPropertyValue !== 'function' || !tvw || typeof tvw.setSource !== 'function') { unavailable(done); return; }
    var finish = bounded(done);
    try {
      sys.getPropertyValue('VIDEOSOURCE', function (video) {
        var list = [], byPort = {}, active = null;
        try { if (typeof tvw.getSource === 'function') active = tvw.getSource(); } catch (err) { /* Status may be unavailable while discovery still works. */ }
        function record(src, connected) {
          if (!src || src.type !== 'HDMI' || typeof src.number !== 'number' || !isFinite(src.number) || src.number < 0 || Math.floor(src.number) !== src.number) return;
          var key = String(src.number), item = byPort[key];
          if (!item) {
            item = { number: src.number, name: 'HDMI ' + src.number, connected: false, active: !!(active && active.type === 'HDMI' && active.number === src.number), source: src };
            byPort[key] = item; list.push(item);
          }
          if (connected) { item.connected = true; item.source = src; }
        }
        if (video && Array.isArray(video.disconnected)) video.disconnected.forEach(function (src) { record(src, false); });
        if (video && Array.isArray(video.connected)) video.connected.forEach(function (src) { record(src, true); });
        list.sort(function (a, b) { return a.number - b.number; });
        finish(null, list);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function setSource(port, done) {
    cancelSource();
    var tvw = window.tizen && window.tizen.tvwindow, app = api(), finished = false;
    if (typeof port !== 'number' || !isFinite(port) || port < 0 || Math.floor(port) !== port) { done({ message: 'This HDMI input is not available.' }); return; }
    if (!tvw || typeof tvw.setSource !== 'function' || !app || typeof app.launch !== 'function') { unavailable(done); return; }
    var timer = setTimeout(function () { finish({ message: 'The TV did not respond. Please try again.' }); }, 8000);
    function finish(err, value) {
      if (finished) return;
      finished = true; clearTimeout(timer);
      if (sourceCancel === cancel) sourceCancel = null;
      done(err, value);
    }
    function cancel() { finish({ message: 'Input change cancelled.', cancelled: true }); }
    sourceCancel = cancel;
    sources(function (err, list) {
      if (finished) return;
      if (err) { finish(err); return; }
      var input = null;
      list.some(function (item) { if (item.number === port) { input = item; return true; } return false; });
      if (!input) { finish({ message: 'This HDMI input is no longer available.' }); return; }
      try {
        tvw.setSource(input.source, function (selected) {
          if (finished) return;
          if (selected && (selected.type !== 'HDMI' || selected.number !== port)) { finish({ message: 'The TV selected a different input. Please try again.' }); return; }
          try {
            app.launch('org.tizen.tv-viewer', function () { finish(null, input); }, function () {
              finish({ message: 'The input was selected, but the TV viewer could not open.', detail: 'Use the remote’s Source control to view the input.' });
            });
          } catch (error) { finish({ message: 'The input was selected, but the TV viewer could not open.' }); }
        }, function (error) { if (!finished) finish(failure(error)); });
      } catch (error) { finish(failure(error)); }
    });
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try { api().launch(id, function () { finish(null); }, function (err) { finish(failure(err)); }); }
    catch (err) { finish(failure(err)); }
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({message: 'This app has no launch target.'}); return; }
    launchApp(IDS[brand][0], done);
  }
  function brandOf(id, name) {
    var found = '';
    Object.keys(IDS).some(function (brand) { if (IDS[brand].indexOf(id) >= 0) { found = brand; return true; } return false; });
    if (!found) Object.keys(NAMES).some(function (brand) { if (NAMES[brand].test(String(name || '').trim())) { found = brand; return true; } return false; });
    return found;
  }
  function art(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      var data = [new tizen.ApplicationControlData('mode', ['fullscreen']), new tizen.ApplicationControlData('requester', ['mobile'])];
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
      api().launchAppControl(control, 'org.tizen.art-app', function () { finish(null); }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function home(done) { launchApp('com.samsung.tv.csfs', done); }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }
  function apps(done) {
    if (!api()) { unavailable(done); return; }
    // Large installed catalogues can take longer than a launch response.
    var finish = bounded(done, 20000);
    try {
      api().getAppsInfo(function (list) {
        var seen = {}, taken = {}, result = [], self = selfId(), order = Object.keys(IDS);
        list.forEach(function (a) {
          var brand = brandOf(a.id, a.name), primary = !!brand && !taken[brand], stream = STREAMING.indexOf(a.id) >= 0;
          // Older Samsung TVs report store apps by numeric ID.
          var consumer = /^[A-Za-z0-9]{10}\.[A-Za-z0-9_-]+$/.test(a.id) || /^[0-9]{9,13}$/.test(a.id) || CONSUMER_SYSTEM.indexOf(a.id) >= 0;
          if (a.id === self || INTERNAL.indexOf(a.id) >= 0 || seen[a.id] || !a.name || (!primary && !stream && (!a.show || !consumer))) return;
          if (!primary && /(?:service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon)/i.test(a.name + ' ' + a.id)) return;
          if (/-dummy$/.test(a.id) || a.id === 'com.samsung.tv.cobalt-yt') return;
          seen[a.id] = true;
          if (primary) taken[brand] = true;
          result.push({ appId: a.id, name: a.name, brand: primary ? brand : EXTRA_BRANDS[a.id] || '', icon: a.iconPath || '', rank: primary ? order.indexOf(brand) : (stream ? 20 : 30) });
        });
        result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
        finish(null, result);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function registerMediaKeys() {
    var dev = window.tizen && window.tizen.tvinputdevice;
    if (!dev || typeof dev.registerKey !== 'function') return;
    ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop', 'MediaTrackNext', 'MediaTrackPrevious', 'MediaRewind', 'MediaFastForward'].forEach(function (name) {
      try { dev.registerKey(name); } catch (err) { /* key unavailable on this TV */ }
    });
  }
  window.FrameDevice = { brandOf: brandOf, registerMediaKeys: registerMediaKeys, launch: launch, launchApp: launchApp, art: art, home: home, settings: settings, apps: apps, sources: sources, setSource: setSource, cancelSource: cancelSource };
}());
