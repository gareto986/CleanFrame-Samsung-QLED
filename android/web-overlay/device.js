/* Android TV device adapter. Overlaid onto the web UI in place of the Tizen device.js when
   building the Shield app. Implements the same window.FrameDevice API against the native
   WebBridge (window.AndroidTV). No Tizen APIs are used here. ES5 for parity with the rest. */
(function () {
  'use strict';

  /* Android package ids per brand. Best-effort defaults; installed-app discovery replaces an
     app's id with the one the device reports (matched by package or name), so these mainly seed
     the default Home tiles before discovery runs. Confirm on the device via All apps. */
  var IDS = {
    netflix: ['com.netflix.ninja'],
    youtube: ['com.google.android.youtube.tv', 'com.google.android.youtube.tvkids'],
    disneyplus: ['com.disney.disneyplus'],
    primevideo: ['com.amazon.amazonvideo.livingroom'],
    hbomax: ['com.wbd.stream', 'com.hbo.hbonow'],
    hulu: ['com.hulu.plus'],
    appletv: ['com.apple.atve.androidtv.appletv'],
    plex: ['com.plexapp.android'],
    spotify: ['com.spotify.tv.android'],
    stremio: ['com.stremio.one'],
    applemusic: ['com.apple.android.music'],
    abciview: ['au.net.abc.iview'],
    sbs: ['au.com.sbs.ondemand']
  };
  var NAMES = { netflix: /^netflix$/i, youtube: /^youtube$/i, disneyplus: /^disney\s*\+$|^disney plus$/i,
    primevideo: /^(amazon )?prime video$/i, hbomax: /^(hbo )?max$|^hbo max$/i, hulu: /^hulu$/i,
    appletv: /^apple tv\+?$/i, plex: /^plex$/i, spotify: /^spotify/i, stremio: /^stremio$/i,
    applemusic: /^apple music$/i, abciview: /^abc ?iview$/i, sbs: /^sbs on demand$/i };

  var bridge = window.AndroidTV;

  function brandOf(id, name) {
    var found = '';
    Object.keys(IDS).some(function (brand) { if (IDS[brand].indexOf(id) >= 0) { found = brand; return true; } return false; });
    if (!found) Object.keys(NAMES).some(function (brand) { if (NAMES[brand].test(String(name || '').trim())) { found = brand; return true; } return false; });
    return found;
  }
  function unavailable(done) { done({ message: 'This control isn’t available on this device.' }); }
  function launchApp(id, done) {
    if (!bridge || typeof bridge.launch !== 'function') { unavailable(done); return; }
    var err;
    try { err = bridge.launch(String(id)); } catch (e) { err = e && e.message || 'Could not open the app'; }
    done(err ? { message: err } : null);
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({ message: 'This app has no launch target.' }); return; }
    launchApp(IDS[brand][0], done);
  }
  function apps(done) {
    if (!bridge || typeof bridge.apps !== 'function') { unavailable(done); return; }
    var list;
    try { list = JSON.parse(bridge.apps() || '[]'); } catch (e) { done({ message: 'Could not read installed apps.' }); return; }
    var order = Object.keys(IDS), seen = {}, taken = {}, result = [];
    list.forEach(function (a) {
      if (!a || !a.appId || seen[a.appId]) return;
      var brand = brandOf(a.appId, a.name), primary = !!brand && !taken[brand];
      seen[a.appId] = true;
      if (primary) taken[brand] = true;
      result.push({ appId: a.appId, name: a.name || a.appId, brand: primary ? brand : '', icon: '', rank: primary ? order.indexOf(brand) : 30 });
    });
    result.sort(function (a, b) { return a.rank - b.rank || String(a.name).toLowerCase().localeCompare(String(b.name).toLowerCase()); });
    // Return asynchronously, matching the Tizen adapter's contract.
    setTimeout(function () { done(null, result); }, 0);
  }
  // HDMI inputs and Art Mode are Samsung/Tizen concepts; the Shield has neither.
  function sources(done) { done({ message: 'HDMI inputs aren’t available on this device.' }); }
  function setSource(port, done) { done({ message: 'HDMI inputs aren’t available on this device.' }); }
  function cancelSource() {}
  function art(done) { done({ message: 'Art Mode isn’t available on this device.' }); }
  function home(done) {
    if (!bridge || typeof bridge.openHome !== 'function') { unavailable(done); return; }
    var err; try { err = bridge.openHome(); } catch (e) { err = 'Could not open the system home.'; }
    done(err ? { message: err } : null);
  }
  function settings(done) {
    if (!bridge || typeof bridge.openSettings !== 'function') { unavailable(done); return; }
    var err; try { err = bridge.openSettings(); } catch (e) { err = 'Could not open settings.'; }
    done(err ? { message: err } : null);
  }
  function registerMediaKeys() { /* Android delivers media keys through the Activity already. */ }

  window.FrameDevice = { brandOf: brandOf, registerMediaKeys: registerMediaKeys, launch: launch, launchApp: launchApp,
    art: art, home: home, settings: settings, apps: apps, sources: sources, setSource: setSource, cancelSource: cancelSource };

  /* The Activity forwards remote keys here as web keyboard events the UI already understands. */
  window.CleanFrameAndroidKey = function (code, type) {
    var e, name = type === 'up' ? 'keyup' : 'keydown';
    try { e = new KeyboardEvent(name, { bubbles: true, cancelable: true }); }
    catch (x) { e = document.createEvent('Event'); e.initEvent(name, true, true); }
    try { Object.defineProperty(e, 'keyCode', { value: code }); Object.defineProperty(e, 'which', { value: code }); } catch (x) {}
    document.dispatchEvent(e);
  };
}());
