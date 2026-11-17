# Home integrations

CleanFrame 0.8 replaces the List and Dock layouts with one rails Home. A photo header holds the clock, date and current weather, and each section sits on its own horizontal rail below:

1. **Apps**: the saved Home apps, as before.
2. **Plex**: Continue watching, then recently added movies and shows, then Open Plex.
3. **Home**: Home Assistant quick buttons, then All rooms.
4. **Sports**: one card per followed team, with a live score, a recent result or the next game.
5. **Weather**: now, the next sixteen hours in two-hour steps, and five days.

Headlines from RSS feeds run along the bottom. Background → **My photos** shows a full-screen photo from an Immich album, cross-faded every few minutes.

The data logic comes from the owner's earlier TV Dashboard project, restyled to match CleanFrame. That means CleanFrame's plates, focus and type, with line-style weather and device icons. A section appears only when it is configured. A public build configures none, shows only the apps rail and makes no requests.

## Configure

Copy `integrations.example.json` to `.local/integrations.json` and fill in your own values. Remove any section you don't want. `.local/` is ignored by Git.

| Section | Needs | Requests |
| --- | --- | --- |
| `weather` | Latitude, longitude, time zone; optional NWS grid (`OFFICE/X,Y`, US only) | Open-Meteo forecast; NWS forecast and active alerts when US units are used |
| `news` | RSS/Atom feed URLs; `kind: "local"` interleaves local stories | Each feed every 15 minutes |
| `sports` | ESPN sport, league and team abbreviation | ESPN's public site API: team and schedule, every 15 minutes (every minute during a live game) |
| `plex` | Server URL; a token, or the TV's address in Plex's "allowed without authentication" list | Sections, recently added and Continue watching, every 15 minutes; poster images |
| `homeAssistant` | URL, long-lived access token, quick buttons, routines and rooms | One template request for the listed entities every 15 seconds (3 seconds while All rooms is open); a service call per press |
| `photos.immich` | URL, API key (album.read, asset.read, asset.view), album ID | Random album search; one preview-size image per change |

Entity IDs must look like `domain.object_id`; anything else is ignored. Quick buttons light when their `lit` entities are on (`any`, or `allOff` plus `anyOn`). During `nightHours` a quick button with a `night` variant shows that variant instead. Icons: `bulb`, `fan`, `theatre`, `plug`, `play`, `moon`.

`npm run dev` serves your settings to the browser preview. A host-restricted `/proxy` passes requests to the configured hosts plus Open-Meteo, NWS and ESPN, because those services do not allow cross-origin browser requests. The TV fetches directly under the manifest's `<access origin="*">`. `npm run dev:public` and public exports ignore the file.

## Privacy

A personal widget built with `npm run package` contains `.local/integrations.json` as `assets/integrations.js`, including the Home Assistant token and Immich key. That matches TV Dashboard's own package. Treat the signed widget as private: never publish it, attach it to an issue or share it. `npm run export:public` always uses the empty default, and its checks fail if the file differs.

Use a dedicated Home Assistant user or token you can revoke. All rooms only lists the entities you name; leave out anything a stray remote press could harm.

## Behaviour

- Nothing loads during hidden startup. The first visible launch starts every section and one installed-app discovery, so older TVs resolve their own app IDs. Sections refresh on a timer only while the launcher is visible; returning to it refreshes anything stale.
- Up and Down move between rails; Left and Right move within one. Up from the apps reaches Inputs, All apps and Settings. Back from a lower rail returns to the apps; Back from the apps offers Samsung Home.
- OK on a Plex poster opens the Plex app. The Plex TV app does not accept playback started from another device, as recorded in TV Dashboard. TV Dashboard's built-in player has not been ported.
- OK on a quick button toggles a light, fan or switch, or runs an automation, script or scene. The tile changes at once and the next refresh confirms it. A failure is reported beside the rail label.
- OK on a failed section's status tile retries it. Other sections keep working.
- Headlines pause while a panel is open or the launcher is hidden. With reduced motion they stay still.
- Spotify playback from TV Dashboard relies on its NAS receiver and is not part of CleanFrame.

## Verification

These sections have browser checks against synthetic responses (`scripts/fixtures/integrations.mjs`) and a CPU-throttled performance comparison. They have **not** been run on a TV. On the owner's 2020 Q60T, TV Dashboard has shown that direct requests, Plex, Home Assistant over HTTPS, Immich previews and the headline conveyor work on Tizen 5.5. CleanFrame's own build still needs that physical check, as does the Plex app ID and the default streaming app IDs. See [TV status](tv-status.md) before making compatibility claims.

Data sources: [National Weather Service](https://www.weather.gov/documentation/services-web-api) (public domain), [Open-Meteo](https://open-meteo.com/) (CC BY 4.0, credited on the weather rail), ESPN's unofficial public site API (undocumented, may change), and the feeds, Plex, Home Assistant and Immich servers you configure.
