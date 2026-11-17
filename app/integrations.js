/* Home integrations: weather, headlines, sports, Plex, Home Assistant and photos.
   Adapted from the owner's TV Dashboard. Configuration comes from the private build overlay
   (assets/integrations.js, generated from .local/integrations.json). Public builds ship it empty,
   so every section stays hidden and no request is made. Nothing here runs during hidden
   startup: Home calls start() once the launcher is first visible. */
(function () {
  'use strict';

  var C = window.CleanFrameIntegrations && typeof window.CleanFrameIntegrations === 'object' ? window.CleanFrameIntegrations : {};
  var TIMEOUT = 15000, MINUTE = 60000;
  // The browser preview cannot reach most services directly (no CORS). The preview server
  // offers a host-restricted passthrough; the TV fetches directly under <access origin="*">.
  var PROXY = !window.tizen && /^\/home\//.test(window.location.pathname);
  var listeners = [], started = false, visible = false, timers = {};
  var S = {};

  function has(v) { return v !== null && v !== undefined && v !== ''; }
  function str(v) { return typeof v === 'string' ? v : ''; }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }
  function list(v) { return Object.prototype.toString.call(v) === '[object Array]' ? v : []; }
  function base(url) { return str(url).replace(/\/+$/, ''); }

  var CFG = {
    weather: C.weather && num(C.weather.latitude) !== null && num(C.weather.longitude) !== null ? C.weather : null,
    news: C.news && list(C.news.feeds).length ? C.news : null,
    sports: C.sports && list(C.sports.teams).length ? C.sports : null,
    plex: C.plex && /^https?:\/\//.test(str(C.plex.url)) ? C.plex : null,
    home: C.homeAssistant && /^https?:\/\//.test(str(C.homeAssistant.url)) && str(C.homeAssistant.token) ? C.homeAssistant : null,
    photos: C.photos && C.photos.immich && /^https?:\/\//.test(str(C.photos.immich.url)) && str(C.photos.immich.apiKey) ? C.photos : null
  };
  var NAMES = ['weather', 'news', 'sports', 'plex', 'home'];
  NAMES.forEach(function (n) { S[n] = { status: CFG[n] ? 'idle' : 'off', data: null, error: null, updated: 0 }; });

  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) { /* A render problem must not stop updates. */ } }); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- Requests ---------- */
  function timed(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timed out')); }, ms || TIMEOUT);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  function request(url, opts) {
    var target = PROXY ? '/proxy?url=' + encodeURIComponent(url) : url;
    if (!window.fetch) return Promise.reject(new Error('This TV cannot make web requests'));
    opts = opts || {};
    if (!opts.cache) opts.cache = 'no-store';
    return timed(window.fetch(target, opts)).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r;
    });
  }
  function json(url, opts) { return request(url, opts).then(function (r) { return r.json(); }); }
  function text(url, opts) { return request(url, opts).then(function (r) { return r.text(); }); }

  function schedule(name, minutes, run) {
    clearTimeout(timers[name]);
    timers[name] = setTimeout(function () {
      // Hidden: pause until the launcher returns; show() refreshes anything stale.
      if (!visible) { timers[name] = 0; return; }
      run();
    }, minutes * MINUTE);
  }
  function settle(name, promise, minutes, run) {
    var s = S[name];
    if (s.status !== 'ready') s.status = 'loading';
    emit();
    schedule(name, minutes, run); // a request that never answers cannot stop refreshes
    return promise.then(function (data) {
      s.status = 'ready'; s.data = data; s.error = null; s.updated = Date.now();
    }, function (e) {
      s.error = e && e.message || 'Unavailable';
      if (!s.data) s.status = 'error';
    }).then(function () { schedule(name, s.fast || minutes, run); emit(); });
  }

  /* ---------- Weather (National Weather Service, Open-Meteo fallback) ---------- */
  // NWS forecasters correct for coastal marine layers that raw models miss; Open-Meteo
  // still supplies UV and sun times, and stands in when NWS is unavailable or non-US.
  var LABELS = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow',
    73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers',
    95: 'Thunderstorms', 96: 'Thunderstorms', 99: 'Thunderstorms' };
  function nwsCode(t) {
    t = (t || '').toLowerCase();
    if (/thunder/.test(t)) return 95;
    if (/snow|flurr|sleet/.test(t)) return 73;
    if (/drizzle/.test(t)) return 53;
    if (/rain|shower/.test(t)) return 61;
    if (/fog|haze|smoke/.test(t)) return 45;
    if (/partly/.test(t)) return 2;
    if (/mostly (sunny|clear)/.test(t)) return 1;
    if (/cloudy|overcast/.test(t)) return 3;
    return 0;
  }
  function pop(p) { return p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value || 0; }
  function fromNws(hourly, daily, om) {
    var hours = hourly.properties.periods.map(function (p) {
      return { time: p.startTime, temp: p.temperature, code: nwsCode(p.shortForecast), isDay: p.isDaytime, pop: pop(p), label: p.shortForecast,
        humidity: p.relativeHumidity ? p.relativeHumidity.value : null, wind: p.windSpeed + ' ' + p.windDirection };
    });
    var byDate = {}, order = [], today, days, h0;
    daily.properties.periods.forEach(function (p) {
      var date = p.startTime.slice(0, 10), d;
      if (!byDate[date]) { byDate[date] = { date: date, pop: 0, hi: null, lo: null, code: null }; order.push(date); }
      d = byDate[date];
      if (p.isDaytime) { d.hi = p.temperature; d.code = nwsCode(p.shortForecast); }
      else { d.lo = p.temperature; if (d.code === null) d.code = nwsCode(p.shortForecast); }
      d.pop = Math.max(d.pop, pop(p));
    });
    // In the evening NWS only lists "Tonight"; Open-Meteo supplies today's full-day high.
    today = byDate[order[0]];
    if (today && today.hi === null && om && om.daily.time[0] === today.date) today.hi = om.daily.temperature_2m_max[0];
    days = order.filter(function (k) { return byDate[k].hi !== null; }).slice(0, 7).map(function (k) { return byDate[k]; });
    h0 = hours[0];
    return { now: { temp: h0.temp, code: h0.code, isDay: h0.isDay, label: h0.label, humidity: h0.humidity, wind: h0.wind, pop: h0.pop }, hours: hours, days: days };
  }
  function fromOpenMeteo(w, speed) {
    var h = w.hourly, d = w.daily, c = w.current, key = c.time.slice(0, 13), start = 0, i, hours = [];
    for (i = 0; i < h.time.length; i++) if (h.time[i].slice(0, 13) === key) { start = i; break; }
    for (i = start; i < h.time.length; i++) hours.push({ time: h.time[i], temp: h.temperature_2m[i], code: h.weather_code[i], isDay: h.is_day[i], pop: h.precipitation_probability[i] });
    return {
      now: { temp: c.temperature_2m, code: c.weather_code, isDay: c.is_day, label: LABELS[c.weather_code] || '', humidity: c.relative_humidity_2m,
        wind: Math.round(c.wind_speed_10m) + ' ' + speed, pop: hours[0] ? hours[0].pop : 0 },
      hours: hours,
      days: d.time.map(function (t, j) { return { date: t, hi: d.temperature_2m_max[j], lo: d.temperature_2m_min[j], code: d.weather_code[j], pop: d.precipitation_probability_max[j] }; })
    };
  }
  function loadWeather() {
    var w = CFG.weather, metric = w.units === 'metric', tz = str(w.timezone) || 'auto', grid = str(w.nwsGrid), quiet = function () { return null; };
    var om = 'https://api.open-meteo.com/v1/forecast?latitude=' + w.latitude + '&longitude=' + w.longitude
      + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,precipitation_probability,weather_code,is_day'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max'
      + (metric ? '' : '&temperature_unit=fahrenheit&wind_speed_unit=mph') + '&timezone=' + encodeURIComponent(tz) + '&forecast_days=7';
    var nws = 'https://api.weather.gov/gridpoints/' + grid;
    var alerts = w.alerts === false ? Promise.resolve(null) : json('https://api.weather.gov/alerts/active?point=' + w.latitude + ',' + w.longitude).catch(quiet);
    return settle('weather', Promise.all([
      json(om).catch(quiet),
      grid && !metric ? json(nws + '/forecast/hourly').catch(quiet) : null,
      grid && !metric ? json(nws + '/forecast').catch(quiet) : null,
      alerts
    ]).then(function (r) {
      var m = null;
      if (r[1] && r[2]) { try { m = fromNws(r[1], r[2], r[0]); } catch (e) { m = null; } }
      // Open-Meteo's free service requires attribution; NWS data is public domain.
      if (m) m.source = r[0] ? 'NWS, Open-Meteo.com' : 'NWS';
      if (!m && r[0]) { m = fromOpenMeteo(r[0], metric ? 'km/h' : 'mph'); m.source = 'Open-Meteo.com'; }
      if (!m) throw new Error('Weather is unavailable');
      if (r[0]) { m.uv = r[0].daily.uv_index_max[0]; m.sunrise = r[0].daily.sunrise[0]; m.sunset = r[0].daily.sunset[0]; }
      m.alerts = r[3] && r[3].features ? r[3].features.filter(function (f) { return f.properties && f.properties.event; }).map(function (f) { return f.properties.event; }) : [];
      m.place = str(w.place);
      return m;
    }), 15, loadWeather);
  }

  /* ---------- Headlines (RSS) ---------- */
  function parseFeed(xml, feed) {
    var doc = new window.DOMParser().parseFromString(xml, 'text/xml'), items = Array.prototype.slice.call(doc.querySelectorAll('item'), 0, num(feed.max) || 8);
    return items.map(function (it) {
      var title = (it.querySelector('title') || {}).textContent || '', src = str(feed.label) || (it.querySelector('source') || {}).textContent || '';
      // Google News appends " - Source" to titles.
      if (src && title.slice(-(src.length + 3)) === ' - ' + src) title = title.slice(0, -(src.length + 3));
      return { kind: feed.kind === 'local' ? 'local' : 'national', title: title.replace(/\s+/g, ' ').trim(), src: src.trim() };
    }).filter(function (h) { return h.title; });
  }
  function loadNews() {
    return settle('news', Promise.all(list(CFG.news.feeds).map(function (f) {
      return /^https?:\/\//.test(str(f.url)) ? text(f.url).then(function (x) { return parseFeed(x, f); }).catch(function () { return []; }) : [];
    })).then(function (lists) {
      var local = [], national = [], out = [];
      lists.forEach(function (l) { l.forEach(function (h) { (h.kind === 'local' ? local : national).push(h); }); });
      // One local headline, then two national ones.
      while (local.length || national.length) {
        if (local.length) out.push(local.shift());
        if (national.length) out.push(national.shift());
        if (national.length) out.push(national.shift());
      }
      if (!out.length) throw new Error('Headlines are unavailable');
      return out.slice(0, 40);
    }), 15, loadNews);
  }

  /* ---------- Sports (ESPN's public scores feed) ---------- */
  var ESPN = 'https://site.api.espn.com/apis/site/v2/sports/', DAY = 86400000;
  function score(c) { var s = c.score; return s === null || s === undefined ? '' : typeof s === 'object' ? s.displayValue : s; }
  function sides(comp, id) {
    var us = null, them = null;
    comp.competitors.forEach(function (c) { if (c.team.abbreviation.toLowerCase() === id || c.id === id) us = c; else them = c; });
    if (!us) { us = comp.competitors[0]; them = comp.competitors[1]; }
    return { us: us, them: them, vs: us.homeAway === 'home' ? 'vs ' : '@ ' };
  }
  function when(date) {
    var d = new Date(date), now = new Date(), time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return 'Today ' + time;
    if (d - now < 6 * DAY) return d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + time;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function teamLine(team, info, schedule) {
    var t = info.team, next = t.nextEvent && t.nextEvent[0], comp = next && next.competitions[0], state = comp && comp.status.type.state, s, done, last, tv;
    if (state === 'in') {
      s = sides(comp, team.id);
      return { kind: 'live', text: s.us.team.abbreviation + ' ' + score(s.us) + ' – ' + s.them.team.abbreviation + ' ' + score(s.them), detail: comp.status.type.shortDetail };
    }
    done = list(schedule.events).filter(function (e) { return e.competitions[0].status.type.completed; });
    last = done[done.length - 1];
    if (last && Date.now() - new Date(last.date) < 1.5 * DAY) {
      s = sides(last.competitions[0], team.id);
      return { kind: s.us.winner ? 'win' : 'loss', text: (s.us.winner ? 'W ' : 'L ') + score(s.us) + '–' + score(s.them), detail: s.vs + s.them.team.abbreviation };
    }
    if (next && new Date(next.date) - Date.now() < 7 * DAY) {
      s = sides(comp, team.id);
      tv = list(comp.broadcasts).map(function (b) { return b.media && b.media.shortName; }).filter(Boolean)[0];
      return { kind: 'next', text: when(next.date), detail: s.vs + s.them.team.abbreviation + (tv ? ' · ' + tv : '') };
    }
    if (next) return { kind: 'off', text: 'Off-season', detail: (next.seasonType && next.seasonType.type === 1 ? 'Preseason ' : 'Next game ') + when(next.date) };
    return { kind: 'off', text: 'Off-season', detail: '' };
  }
  function loadTeam(team) {
    var url = ESPN + str(team.sport) + '/' + str(team.league) + '/teams/' + str(team.id);
    return Promise.all([json(url), json(url + '/schedule').catch(function () { return {}; })]).then(function (r) {
      var t = r[0].team, rec = t.record && t.record.items && t.record.items[0];
      return { name: str(team.name) || t.displayName, logo: t.logos && t.logos[0] ? t.logos[0].href : '', record: rec ? rec.summary : '', line: teamLine(team, r[0], r[1]) };
    }).catch(function () { return { name: str(team.name), logo: '', record: '', line: { kind: 'error', text: 'Scores unavailable', detail: '' } }; });
  }
  function loadSports() {
    var promise = Promise.all(list(CFG.sports.teams).slice(0, 8).map(loadTeam)).then(function (rows) {
      if (rows.every(function (r) { return r.line.kind === 'error'; })) throw new Error('Scores are unavailable');
      // Every minute during a game.
      S.sports.fast = rows.some(function (r) { return r.line.kind === 'live'; }) ? 1 : 0;
      return rows;
    });
    return settle('sports', promise, 15, loadSports);
  }

  /* ---------- Plex (Continue watching and recently added) ---------- */
  function plexUrl(path) {
    var p = CFG.plex, sep = path.indexOf('?') < 0 ? '?' : '&';
    return base(p.url) + path + (str(p.token) ? sep + 'X-Plex-Token=' + encodeURIComponent(p.token) : '');
  }
  function plexJSON(path) { return json(plexUrl(path), { headers: { Accept: 'application/json' }, cache: 'no-store' }); }
  function poster(thumb) { return thumb ? plexUrl('/photo/:/transcode?width=240&height=360&minSize=1&upscale=1&url=' + encodeURIComponent(thumb)) : ''; }
  function ago(addedAt) {
    var added = new Date(addedAt * 1000), now = new Date();
    var days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(added.getFullYear(), added.getMonth(), added.getDate())) / DAY);
    return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? days + ' days ago' : added.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // Episodes of one show collapse into a single poster ("3 new episodes").
  function group(items) {
    var out = [], shows = {};
    items.forEach(function (m) {
      var ep = m.type === 'episode', key, entry;
      if (ep || m.type === 'season') {
        key = ep ? m.grandparentRatingKey : m.parentRatingKey;
        if (shows[key]) { shows[key].count += m.type === 'season' ? m.leafCount || 1 : 1; shows[key].addedAt = Math.max(shows[key].addedAt, m.addedAt); return; }
        entry = shows[key] = { title: ep ? m.grandparentTitle : m.parentTitle, thumb: ep ? m.grandparentThumb || m.parentThumb : m.parentThumb || m.thumb,
          addedAt: m.addedAt, count: m.type === 'season' ? m.leafCount || 1 : 1, ep: ep ? 'S' + m.parentIndex + ' · E' + m.index : m.title };
        out.push(entry);
      } else out.push({ title: m.title, thumb: m.thumb, addedAt: m.addedAt, year: m.year, count: 0 });
    });
    return out;
  }
  function loadPlex() {
    // Three groups, as on TV Dashboard: Continue watching, then the newest shows and movies.
    var p = CFG.plex, continuing = num(p.continueCount) || 4, showCount = num(p.showCount) || 6, movieCount = num(p.movieCount) || 6;
    var promise = plexJSON('/library/sections').then(function (j) {
      var sections = j.MediaContainer && j.MediaContainer.Directory || [];
      return Promise.all(sections.filter(function (s) { return s.type === 'movie' || s.type === 'show'; }).map(function (s) {
        return plexJSON('/library/sections/' + s.key + '/recentlyAdded?X-Plex-Container-Start=0&X-Plex-Container-Size=' + (s.type === 'show' ? 40 : 12))
          .then(function (r) { return { type: s.type, items: r.MediaContainer && r.MediaContainer.Metadata || [] }; }, function () { return { type: s.type, items: [] }; });
      }));
    }).then(function (libs) {
      var shows = [], movies = [], newest = function (a, b) { return b.addedAt - a.addedAt; };
      // Each library is read on its own, so a run of new movies cannot push shows out.
      libs.forEach(function (l) { if (l.type === 'show') shows = shows.concat(group(l.items)); else movies = movies.concat(group(l.items)); });
      shows.sort(newest); movies.sort(newest);
      // A problem with this one list should not take the recently added posters with it.
      return plexJSON('/hubs/continueWatching').catch(function () { return {}; }).then(function (j) {
        var mc = j.MediaContainer || {}, items = mc.Hub && mc.Hub[0] && mc.Hub[0].Metadata || mc.Metadata || [], out = [];
        items.slice(0, continuing).forEach(function (m) {
          var ep = m.type === 'episode';
          out.push({ kind: 'continue', title: ep ? m.grandparentTitle : m.title, sub: ep ? 'S' + m.parentIndex + ' · E' + m.index : String(m.year || ''),
            image: poster(ep ? m.grandparentThumb || m.thumb : m.thumb), progress: m.viewOffset && m.duration ? Math.min(1, m.viewOffset / m.duration) : 0 });
        });
        shows.slice(0, showCount).forEach(function (a) {
          out.push({ kind: 'tv', title: a.title, sub: (a.count > 1 ? a.count + ' new episodes' : a.ep) + ' · ' + ago(a.addedAt), image: poster(a.thumb), progress: 0 });
        });
        movies.slice(0, movieCount).forEach(function (a) {
          out.push({ kind: 'movie', title: a.title, sub: (a.year ? a.year + ' · ' : '') + ago(a.addedAt), image: poster(a.thumb), progress: 0 });
        });
        if (!out.length) throw new Error('Nothing in progress or recently added');
        return out;
      });
    }).catch(function (e) {
      throw new Error(/401/.test(e.message) ? 'Plex needs a token, or this TV allowed without authentication' : e.message === 'Nothing in progress or recently added' ? e.message : 'Can’t reach Plex');
    });
    return settle('plex', promise, 15, loadPlex);
  }

  /* ---------- Home Assistant ---------- */
  var states = {}, haIds = [];
  function haDomain(id) { return id.split('.')[0]; }
  function haCall(path, body) {
    var h = CFG.home;
    return request(base(h.url) + path, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + h.token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined });
  }
  function haSafe(id) { return /^[a-z_]+\.[A-Za-z0-9_]+$/.test(str(id)); }
  function collectIds() {
    var h = CFG.home, seen = {};
    function add(id) { if (haSafe(id) && !seen[id]) { seen[id] = 1; haIds.push(id); } }
    list(h.quick).forEach(function (q) {
      var lit = q.lit || {};
      add(q.run); if (q.night) add(q.night.run);
      list(lit.any).concat(list(lit.allOff), list(lit.anyOn)).forEach(add);
    });
    list(h.routines).forEach(function (r) { add(r.id); });
    list(h.rooms).forEach(function (room) { list(room.items).forEach(function (it) { add(it[0]); }); });
  }
  // One template request returns only the states shown, rather than every entity.
  function loadHome() {
    var tpl = '[' + haIds.map(function (id) {
      return '{"i":"' + id + '","s":"{{ states(\'' + id + '\') }}","b":{{ state_attr(\'' + id + '\', \'brightness\') | int(0) }},"p":{{ state_attr(\'' + id + '\', \'percentage\') | int(0) }}}';
    }).join(',') + ']';
    var promise = haCall('/api/template', { template: tpl }).then(function (r) { return r.text(); }).then(function (t) {
      JSON.parse(t).forEach(function (e) { states[e.i] = e; });
      return true;
    }).catch(function (e) { throw new Error(/401/.test(e.message) ? 'Home Assistant rejected the access token' : 'Can’t reach Home Assistant'); });
    return settle('home', promise, S.home.fast ? S.home.fast : .25, loadHome);
  }
  function isOn(id) { var s = states[id]; return !!s && (s.s === 'on' || s.s === 'open'); }
  function isNight() { var n = list(CFG.home.nightHours), h = new Date().getHours(); return n.length === 2 && (h >= n[0] || h < n[1]); }
  function quickItems() {
    return list(CFG.home.quick).map(function (q, i) {
      var v = q.night && isNight() ? q.night : q, l = q.lit || {};
      var lit = l.any ? list(l.any).some(isOn) : l.allOff ? list(l.allOff).every(function (id) { return !isOn(id); }) && list(l.anyOn).some(isOn) : false;
      return { key: 'q' + i, id: str(v.run), name: str(v.name), icon: str(v.icon) || 'play', on: lit, routine: /^(automation|script|scene)\./.test(str(v.run)) };
    }).filter(function (q) { return haSafe(q.id) && q.name; });
  }
  function stateText(id) {
    var s = states[id], d = haDomain(id);
    if (!s) return '…';
    if (s.s === 'unavailable' || s.s === 'unknown') return 'Unavailable';
    if (d === 'automation' || d === 'scene') return 'Run';
    if (d === 'script') return s.s === 'on' ? 'Running…' : 'Run';
    if (!isOn(id)) return 'Off';
    if (s.b) return 'On · ' + Math.round(s.b / 2.55) + '%';
    if (s.p) return 'On · ' + s.p + '%';
    return 'On';
  }
  function iconFor(id, icon) {
    if (icon) return icon;
    var d = haDomain(id);
    return d === 'fan' ? 'fan' : d === 'light' ? 'bulb' : d === 'switch' ? 'plug' : 'play';
  }
  function panelSections() {
    var h = CFG.home, out = [];
    if (list(h.routines).length) out.push({ name: 'Routines', items: list(h.routines).filter(function (r) { return haSafe(r.id); }).map(function (r) { return entity(r.id, r.name, true, r.icon); }) });
    list(h.rooms).forEach(function (room) {
      out.push({ name: str(room.name), items: list(room.items).filter(function (it) { return haSafe(it[0]); }).map(function (it) { return entity(it[0], it[1], false); }) });
    });
    return out.filter(function (s) { return s.items.length; });
  }
  function entity(id, name, routine, icon) {
    var s = states[id];
    return { id: id, name: str(name) || id, routine: !!routine, icon: iconFor(id, icon), on: !routine && isOn(id), na: !!s && (s.s === 'unavailable' || s.s === 'unknown'), state: stateText(id) };
  }
  function runHome(id, done) {
    var s = states[id], d = haDomain(id), svc;
    if (!CFG.home || !haSafe(id)) { done({ message: 'Home Assistant is not set up.' }); return; }
    if (s && s.s === 'unavailable') { done({ message: 'This device is unavailable.' }); return; }
    svc = d === 'automation' ? ['automation', 'trigger'] : d === 'script' ? ['script', 'turn_on'] : d === 'scene' ? ['scene', 'turn_on'] : [d, 'toggle'];
    // Show a toggle at once; the next refresh confirms it.
    if (s && ['light', 'fan', 'switch'].indexOf(d) >= 0) { s.s = isOn(id) ? 'off' : 'on'; emit(); }
    haCall('/api/services/' + svc[0] + '/' + svc[1], { entity_id: id }).then(function () { done(null); }, function () {
      done({ message: 'Couldn’t reach Home Assistant.' });
    }).then(function () { schedule('home', .015, loadHome); });
  }
  function homeFast(on) {
    if (!CFG.home) return;
    S.home.fast = on ? .05 : 0;
    if (on && started) loadHome();
  }

  /* ---------- Photos (Immich) ---------- */
  var photoQueue = [];
  function immich(path, opts) {
    var p = CFG.photos.immich;
    opts = opts || {};
    opts.headers = opts.headers || {}; opts.headers['x-api-key'] = p.apiKey;
    return request(base(p.url) + path, opts);
  }
  function refillPhotos() {
    var p = CFG.photos.immich, body = { size: 50, type: 'IMAGE' };
    if (str(p.albumId)) body.albumIds = [p.albumId];
    return immich('/api/search/random', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); }).then(function (items) { photoQueue = list(items).map(function (a) { return a.id; }).filter(Boolean); });
  }
  // Only Immich's ready-made previews: decoding camera originals starves the TV.
  function nextPhoto(done, tries) {
    if (!CFG.photos) { done(null); return; }
    tries = tries || 5;
    (photoQueue.length ? Promise.resolve() : refillPhotos()).then(function () {
      var id = photoQueue.shift();
      if (!id) throw new Error('The photo album is empty');
      return immich('/api/assets/' + encodeURIComponent(id) + '/thumbnail?size=preview');
    }).then(function (r) { return r.blob(); }).then(function (b) { done(window.URL.createObjectURL(b)); }, function (e) {
      if (tries > 1 && /^404$/.test(e && e.message)) nextPhoto(done, tries - 1); else done(null, e);
    });
  }

  /* ---------- Icons in the CleanFrame line style ---------- */
  var SVG = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z"/>',
    cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 18.5Z"/>',
    partly: '<path d="M8.5 3.5v1.2M3.5 8.5h1.2M5 5l.9.9M12 5l-.9.9"/><path d="M5.6 11.2a3.4 3.4 0 0 1 6-3.4"/><path d="M9 20h8.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.4A2.8 2.8 0 0 0 9 20Z"/>',
    partlyNight: '<path d="M11.2 6.4A4.3 4.3 0 0 1 5.6 12 4.6 4.6 0 0 0 11.2 6.4Z"/><path d="M9 20h8.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.4A2.8 2.8 0 0 0 9 20Z"/>',
    rain: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="M8.5 17.5l-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5"/>',
    snow: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="M8 18.5h.01M12 20h.01M16 18.5h.01"/>',
    storm: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="m12.5 15.5-2 3.5h3l-2 3"/>',
    fog: '<path d="M4 9h16M3 13h14M7 17h14"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/>',
    fan: '<circle cx="12" cy="12" r="1.8"/><path d="M12 10.2c-.6-3.6.6-6.7 3.1-6.7 1.9 0 2.2 2.4.5 3.9-1.1 1-2.2 1.8-3.6 2.8ZM13.8 12c3.6-.6 6.7.6 6.7 3.1 0 1.9-2.4 2.2-3.9.5-1-1.1-1.8-2.2-2.8-3.6ZM12 13.8c.6 3.6-.6 6.7-3.1 6.7-1.9 0-2.2-2.4-.5-3.9 1.1-1 2.2-1.8 3.6-2.8ZM10.2 12c-3.6.6-6.7-.6-6.7-3.1 0-1.9 2.4-2.2 3.9-.5 1 1.1 1.8 2.2 2.8 3.6Z"/>',
    theatre: '<path d="M4 5h16v6a8 8 0 0 1-16 0Z"/><path d="M9 9.5h.01M15 9.5h.01M9 13.5a4 4 0 0 0 6 0"/>',
    plug: '<path d="M9 3v4M15 3v4M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0ZM12 16v5"/>',
    play: '<circle cx="12" cy="12" r="8.5"/><path d="m10.2 8.6 5 3.4-5 3.4Z"/>',
    rooms: '<path d="M4 11 12 4.5l8 6.5v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z"/>',
    plex: '<path d="m8.5 4.5 7 7.5-7 7.5"/>'
  };
  function svg(name, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (SVG[name] || SVG.play) + '</svg>'; }
  function weatherIcon(code, isDay, cls) {
    var day = isDay !== 0 && isDay !== false, n;
    if (code === 0 || code === 1) n = day ? 'sun' : 'moon';
    else if (code === 2) n = day ? 'partly' : 'partlyNight';
    else if (code === 45 || code === 48) n = 'fog';
    else if (code >= 95) n = 'storm';
    else if (code >= 71 && code <= 77 || code === 85 || code === 86) n = 'snow';
    else if (code >= 51) n = 'rain';
    else n = 'cloud';
    return svg(n, cls);
  }

  /* ---------- Lifecycle ---------- */
  var LOADERS = { weather: loadWeather, news: loadNews, sports: loadSports, plex: loadPlex, home: loadHome };
  var STALE = { weather: 15, news: 15, sports: 5, plex: 5, home: .25 };
  function start() {
    visible = true;
    if (started) return;
    started = true;
    if (CFG.home) collectIds();
    NAMES.forEach(function (n) { if (CFG[n]) LOADERS[n](); });
  }
  // Back only hides the launcher; refresh stale sections when it returns.
  function show() {
    if (!started) { start(); return; }
    visible = true;
    NAMES.forEach(function (n) {
      var s = S[n];
      if (CFG[n] && s.status !== 'loading' && (!timers[n] || Date.now() - s.updated > STALE[n] * MINUTE)) LOADERS[n]();
    });
  }
  function hide() { visible = false; }
  function retry(name) { if (CFG[name] && started) LOADERS[name](); }

  window.CleanFrameFeeds = {
    configured: function (name) { return !!CFG[name]; },
    state: function (name) { return S[name]; },
    start: start, show: show, hide: hide, retry: retry,
    onChange: function (fn) { listeners.push(fn); },
    home: { quick: quickItems, sections: panelSections, run: runHome, fast: homeFast },
    plex: { appId: function () { return CFG.plex && str(CFG.plex.appId) || '3201512006963'; } },
    photos: { next: nextPhoto, every: function () { return Math.max(1, CFG.photos && num(CFG.photos.everyMinutes) || 2); } },
    labels: LABELS, icon: svg, weatherIcon: weatherIcon, esc: esc, has: has
  };
}());
