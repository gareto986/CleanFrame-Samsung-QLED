// Synthetic integration settings and service responses for browser checks.
// Hosts are reserved example names; no request leaves the browser under test.
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url).pathname;

export const CONFIG = {
  weather: { place: 'Example City', latitude: 34.2, longitude: -119.0, timezone: 'America/Los_Angeles', nwsGrid: 'LOX/1,1' },
  news: { feeds: [
    { url: 'https://news.example/local.xml', kind: 'local', max: 4 },
    { url: 'https://news.example/national.xml', label: 'Example Wire', max: 6 }
  ] },
  sports: { teams: [
    { name: 'Comets', sport: 'basketball', league: 'nba', id: 'cmt' },
    { name: 'Harbor', sport: 'football', league: 'nfl', id: 'hbr' },
    { name: 'Summit', sport: 'hockey', league: 'nhl', id: 'smt' }
  ] },
  plex: { url: 'http://plex.example:32400', appId: '3201512006963' },
  homeAssistant: {
    url: 'https://ha.example:8123', token: 'test-token',
    quick: [
      { name: 'Living Room', icon: 'bulb', run: 'light.living', lit: { any: ['light.living'] } },
      { name: 'Ceiling Fan', icon: 'fan', run: 'fan.ceiling', lit: { any: ['fan.ceiling'] } },
      { name: 'Movie Night', icon: 'theatre', run: 'script.movie_night' }
    ],
    routines: [{ id: 'script.movie_night', name: 'Movie Night' }, { id: 'automation.goodnight', name: 'Goodnight', icon: 'moon' }],
    rooms: [
      { name: 'Living Room', items: [['light.living', 'Lamp'], ['fan.ceiling', 'Ceiling Fan'], ['light.accent', 'Accent'], ['switch.tree', 'Tree Lights'], ['light.reading', 'Reading']] },
      { name: 'Kitchen', items: [['light.kitchen', 'Cans']] }
    ]
  },
  pc: { helper: 'http://pc.example:8011', name: 'gamingpc', moonlightAppId: 'MoonLightS.MoonlightWasm' },
  photos: { immich: { url: 'http://photos.example:2283', apiKey: 'test-key', albumId: 'album-1' }, everySeconds: 15 }
};

const iso = (d) => d.toISOString().slice(0, 19);
function hours(now) {
  const out = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    out.push({ startTime: iso(t) + '-08:00', temperature: 68 + Math.round(6 * Math.sin(i / 4)), isDaytime: t.getHours() > 6 && t.getHours() < 18,
      shortForecast: i % 7 === 3 ? 'Chance Rain Showers' : i % 5 === 0 ? 'Partly Cloudy' : 'Sunny',
      probabilityOfPrecipitation: { value: i % 7 === 3 ? 40 : 0 }, relativeHumidity: { value: 52 }, windSpeed: '8 mph', windDirection: 'W' });
  }
  return { properties: { periods: out } };
}
function days(now) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400000), date = d.toISOString().slice(0, 10);
    out.push({ startTime: date + 'T06:00:00-08:00', isDaytime: true, temperature: 72 - i, shortForecast: i === 2 ? 'Rain' : 'Mostly Sunny', probabilityOfPrecipitation: { value: i === 2 ? 70 : 5 } });
    out.push({ startTime: date + 'T18:00:00-08:00', isDaytime: false, temperature: 52 - i, shortForecast: 'Clear', probabilityOfPrecipitation: { value: 0 } });
  }
  return { properties: { periods: out } };
}
function openMeteo(now) {
  const time = [], t = [], pp = [], code = [], day = [];
  for (let i = 0; i < 24; i++) { const d = new Date(now.getTime() + i * 3600000); time.push(iso(d).slice(0, 16)); t.push(70); pp.push(0); code.push(1); day.push(1); }
  const dates = [...Array(7)].map((_, i) => new Date(now.getTime() + i * 86400000).toISOString().slice(0, 10));
  return { current: { time: time[0], temperature_2m: 70, relative_humidity_2m: 50, weather_code: 1, wind_speed_10m: 7, is_day: 1 },
    hourly: { time, temperature_2m: t, precipitation_probability: pp, weather_code: code, is_day: day },
    daily: { time: dates, weather_code: dates.map(() => 1), temperature_2m_max: dates.map(() => 74), temperature_2m_min: dates.map(() => 51),
      precipitation_probability_max: dates.map(() => 0), sunrise: dates.map(d => d + 'T06:40'), sunset: dates.map(d => d + 'T16:50'), uv_index_max: dates.map(() => 4.2) } };
}
const rss = (items) => '<?xml version="1.0"?><rss><channel>' + items.map(t => '<item><title>' + t + '</title></item>').join('') + '</channel></rss>';
function team(abbr, name, live) {
  const now = Date.now(), other = { team: { abbreviation: 'OPP' }, id: '9', homeAway: 'away', score: { displayValue: '98' } };
  const us = { team: { abbreviation: abbr.toUpperCase() }, id: '1', homeAway: 'home', score: { displayValue: '101' } };
  const state = live ? 'in' : 'pre', date = new Date(now + (live ? -3600000 : 2 * 86400000)).toISOString();
  return { team: { displayName: name, logos: [{ href: 'https://logos.example/' + abbr + '.png' }], record: { items: [{ summary: live ? '12-4' : '7-9' }] },
    nextEvent: [{ date, competitions: [{ competitors: [us, other], status: { type: { state, shortDetail: 'Q3 4:12' } }, broadcasts: [{ media: { shortName: 'ESPN' } }] }] }] } };
}
function schedule(win) {
  const date = new Date(Date.now() - 6 * 3600000).toISOString();
  return { events: win === null ? [] : [{ date, competitions: [{ status: { type: { completed: true } }, competitors: [
    { team: { abbreviation: 'HBR' }, id: '1', homeAway: 'away', winner: win, score: '24' }, { team: { abbreviation: 'GUL' }, id: '2', homeAway: 'home', winner: !win, score: '17' }] }] }] };
}
const plexItems = {
  sections: { MediaContainer: { Directory: [{ key: '1', type: 'movie' }, { key: '2', type: 'show' }] } },
  movies: { MediaContainer: { Metadata: [
    { ratingKey: '101', type: 'movie', title: 'The Long Field', thumb: '/t/1', addedAt: Date.now() / 1000 - 3600, year: 2025 },
    { ratingKey: '102', type: 'movie', title: 'Night Ferry', thumb: '/t/2', addedAt: Date.now() / 1000 - 86400 * 3, year: 2024 }] } },
  shows: { MediaContainer: { Metadata: [
    { ratingKey: '51', type: 'episode', grandparentTitle: 'Harbor Lights', grandparentRatingKey: '50', grandparentThumb: '/t/3', parentIndex: 2, index: 4, addedAt: Date.now() / 1000 - 7200 },
    { ratingKey: '52', type: 'episode', grandparentTitle: 'Harbor Lights', grandparentRatingKey: '50', grandparentThumb: '/t/3', parentIndex: 2, index: 5, addedAt: Date.now() / 1000 - 3000 }] } },
  hubs: { MediaContainer: { Hub: [{ Metadata: [
    { ratingKey: '201', type: 'episode', grandparentTitle: 'Coastline', grandparentRatingKey: '300', grandparentThumb: '/t/4', parentIndex: 1, index: 3, viewOffset: 1200000, duration: 3000000 },
    { ratingKey: '202', type: 'movie', title: 'Quiet Valley', thumb: '/t/5', year: 2023, viewOffset: 600000, duration: 6000000 }] }] } }
};
// Playable metadata by ratingKey: a direct file part, and (for 101) a sidecar subtitle stream.
const part = (key, subs) => ({ Media: [{ Part: [{ key, Stream: subs ? [{ streamType: 3, key: subs, displayTitle: 'English', language: 'English' }] : [] }] }] });
const plexMeta = {
  '101': { ratingKey: '101', type: 'movie', title: 'The Long Field', duration: 3600000, viewOffset: 0, ...part('/library/parts/101/file.mp4', '/library/subs/101.srt') },
  '102': { ratingKey: '102', type: 'movie', title: 'Night Ferry', duration: 7200000, viewOffset: 1200000, ...part('/library/parts/102/file.mp4') },
  '201': { ratingKey: '201', type: 'episode', title: 'The Cove', grandparentTitle: 'Coastline', grandparentRatingKey: '300', parentIndex: 1, index: 3, duration: 3000000, viewOffset: 1200000, ...part('/library/parts/201/file.mp4') },
  '203': { ratingKey: '203', type: 'episode', title: 'The Headland', grandparentTitle: 'Coastline', grandparentRatingKey: '300', parentIndex: 1, index: 4, duration: 3000000, viewOffset: 0, ...part('/library/parts/203/file.mp4') },
  '202': { ratingKey: '202', type: 'movie', title: 'Quiet Valley', duration: 6000000, viewOffset: 600000, ...part('/library/parts/202/file.mp4') },
  '50': { ratingKey: '50', type: 'show', title: 'Harbor Lights' },
  '300': { ratingKey: '300', type: 'show', title: 'Coastline' },
  '51': { ratingKey: '51', type: 'episode', title: 'First Light', grandparentTitle: 'Harbor Lights', grandparentRatingKey: '50', parentIndex: 2, index: 4, duration: 2400000, viewOffset: 0, ...part('/library/parts/51/file.mp4') },
  '52': { ratingKey: '52', type: 'episode', title: 'Low Tide', grandparentTitle: 'Harbor Lights', grandparentRatingKey: '50', parentIndex: 2, index: 5, duration: 2400000, viewOffset: 0, ...part('/library/parts/52/file.mp4') }
};
const plexLeaves = {
  '50': ['51', '52'],
  '300': ['201', '203']
};
const clip = readFileSync(root + 'scripts/fixtures/clip.mp4');
const srt = '1\n00:00:01,000 --> 00:00:04,000\nHello from the test clip\n\n2\n00:00:04,000 --> 00:00:06,000\nSecond line\n';
const photo = readFileSync(root + 'app/assets/wallpapers/misty.jpg');
const poster = readFileSync(root + 'app/assets/wallpapers/misty-thumb.jpg');

/** Route a Playwright page: the integration overlay plus every service the fixture names. */
export async function routeIntegrations(page, { failing = [], config = CONFIG, log = [] } = {}) {
  const states = { 'light.living': 'on', 'fan.ceiling': 'off', 'light.accent': 'off', 'switch.tree': 'on', 'light.reading': 'unavailable', 'light.kitchen': 'off', 'script.movie_night': 'off', 'automation.goodnight': 'on' };
  await page.route('**/assets/integrations.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.CleanFrameIntegrations = ' + JSON.stringify(config) + ';' }));
  await page.route(/logos\.example/, r => {
    const abbr = r.request().url().split('/').pop().slice(0, 3).toUpperCase();
    return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><circle cx="28" cy="28" r="27" fill="#e9e4d8"/><text x="28" y="34" font-family="Arial" font-size="16" font-weight="700" text-anchor="middle" fill="#2a2620">' + abbr + '</text></svg>' });
  });
  // Posters load as images straight from the server, as on the TV.
  await page.route(url => url.hostname === 'plex.example' && url.pathname.startsWith('/photo/'), r => r.fulfill({ contentType: 'image/jpeg', body: poster }));
  // The TV (and the mocked TV harness) fetches services directly; the plain browser preview
  // goes through the preview server's /proxy. Both reach these responses.
  const HOSTS = ['api.open-meteo.com', 'api.weather.gov', 'site.api.espn.com', 'news.example', 'ha.example', 'photos.example', 'pc.example'];
  // The PC starts asleep; a wake request brings it up with Sunshine on the next status check.
  const pc = { online: false, sunshine: false, wakes: 0 };
  states.__pc = pc;
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'authorization, content-type, x-api-key, accept' };
  await page.route(url => url.pathname === '/proxy' || HOSTS.includes(url.hostname) || (url.hostname === 'plex.example' && !url.pathname.startsWith('/photo/')), async (route) => {
    const req = route.request(), raw = new URL(req.url()), target = raw.pathname === '/proxy' ? new URL(raw.searchParams.get('url')) : raw, host = target.hostname, path = target.pathname;
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const fulfill = route.fulfill.bind(route);
    route = { fulfill: (o) => fulfill({ ...o, headers: { ...CORS, ...(o.headers || {}) } }) };
    log.push({ host, path, search: target.search, method: req.method(), headers: req.headers(), body: req.postData() });
    const name = host.includes('weather') || host.includes('meteo') ? 'weather' : host.includes('news') ? 'news' : host.includes('espn') ? 'sports' : host.startsWith('plex') ? 'plex' : host.startsWith('ha') ? 'home' : host.startsWith('photos') ? 'photos' : host.startsWith('pc') ? 'pc' : 'other';
    if (failing.includes(name)) return route.fulfill({ status: 503, body: '' });
    const json = (body) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    const now = new Date();
    if (host === 'api.open-meteo.com') return json(openMeteo(now));
    if (path.endsWith('/forecast/hourly')) return json(hours(now));
    if (path.endsWith('/forecast')) return json(days(now));
    if (path.startsWith('/alerts')) return json({ features: [] });
    if (host === 'news.example') return route.fulfill({ contentType: 'application/rss+xml', body: path.includes('local')
      ? rss(['Library opens new reading room', 'Farmers market moves to Saturdays', 'Harbor dredging begins next week'])
      : rss(['Markets close higher after quiet session - Example Wire', 'Storm system expected midweek', 'Science team maps deep-sea vents', 'Rail line adds late trains']) });
    if (host === 'site.api.espn.com') {
      const id = path.split('/')[8];
      if (path.endsWith('/schedule')) return json(schedule(id === 'hbr' ? true : null));
      return json(team(id, id === 'cmt' ? 'Comets' : id === 'hbr' ? 'Harbor' : 'Summit', id === 'cmt'));
    }
    if (host === 'plex.example') {
      if (path === '/library/sections') return json(plexItems.sections);
      if (path === '/library/sections/1/recentlyAdded') return json(plexItems.movies);
      if (path === '/library/sections/2/recentlyAdded') return json(plexItems.shows);
      if (path === '/hubs/continueWatching') return json(plexItems.hubs);
      if (path.startsWith('/:/timeline') || path.startsWith('/:/scrobble')) return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
      if (path.startsWith('/library/parts/')) return route.fulfill({ contentType: 'video/mp4', body: clip });
      if (path.startsWith('/library/subs/')) return route.fulfill({ contentType: 'text/plain', body: srt });
      const leaves = path.match(/^\/library\/metadata\/(\w+)\/allLeaves$/);
      if (leaves) return json({ MediaContainer: { Metadata: (plexLeaves[leaves[1]] || []).map(k => plexMeta[k]) } });
      const one = path.match(/^\/library\/metadata\/(\w+)$/);
      if (one) return plexMeta[one[1]] ? json({ MediaContainer: { Metadata: [plexMeta[one[1]]] } }) : route.fulfill({ status: 404, body: '' });
      if (path.startsWith('/photo/')) return route.fulfill({ contentType: 'image/jpeg', body: poster });
    }
    if (host === 'ha.example') {
      if (req.headers().authorization !== 'Bearer test-token') return route.fulfill({ status: 401, body: '' });
      if (path === '/api/template') {
        const ids = [...JSON.parse(req.postData()).template.matchAll(/"i":"([^"]+)"/g)].map(m => m[1]);
        return route.fulfill({ contentType: 'text/plain', body: JSON.stringify(ids.map(i => ({ i, s: states[i] || 'off', b: states[i] === 'on' ? 191 : 0, p: 0 }))) });
      }
      if (path.startsWith('/api/services/')) {
        const id = JSON.parse(req.postData()).entity_id;
        if (path.endsWith('/toggle')) states[id] = states[id] === 'on' ? 'off' : 'on';
        return json([]);
      }
    }
    if (host === 'pc.example') {
      if (path === '/pc' && req.method() === 'GET') { const body = { name: 'gamingpc', online: pc.online, sunshine: pc.sunshine }; if (pc.wakes) { pc.online = true; pc.sunshine = true; } return json(body); }
      if (path === '/pc/wake' && req.method() === 'POST') { pc.wakes++; return json({ ok: true }); }
    }
    if (host === 'photos.example') {
      if (req.headers()['x-api-key'] !== 'test-key') return route.fulfill({ status: 401, body: '' });
      if (path === '/api/search/random') return json([{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]);
      if (path.includes('/thumbnail')) return route.fulfill({ contentType: 'image/jpeg', body: photo });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  return states;
}
