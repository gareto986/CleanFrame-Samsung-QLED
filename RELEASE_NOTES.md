# CleanFrame 0.8.0

- Home is now a single rails layout, replacing List and Dock. A photo header holds the clock, date and current weather, and Home controls are Inputs, All apps and Settings. Earlier layout, focus and material values stay saved but no longer change Home.
- Optional integrations, adapted from the owner's TV Dashboard and restyled for CleanFrame: Plex (Continue watching and recently added), Home Assistant (quick buttons and an All rooms panel), sports scores, a weather forecast with alerts, RSS headlines and a My photos background from Immich, and Moonlight with Wake-on-LAN through the NAS helper. They are configured in ignored `.local/integrations.json`; public exports contain none. See [Home integrations](docs/integrations.md).
- Plex shows Continue watching, New TV and New movies as headed groups. My photos lays Immich prints on a photo table. A Moonlight tile shows the gaming PC's state through TV Dashboard's NAS helper, wakes it, and opens Moonlight once Sunshine is ready.
- A fresh Home starts with nine US streaming apps. Saved Australian defaults still load. Older TVs' numeric store IDs are recognised, and installed apps are matched by ID or name on the first visible launch.
- The manifest adds the internet privilege and `<access origin="*">` for owner-configured hosts. The unused glass materials are no longer packaged, which shrinks the widget by about 4.7 MB.
- Browser checks cover the rails, every integration against synthetic responses, failure and retry, and hidden startup. No TV was contacted. The integrations, default app IDs and new layout still need physical checks on a TV.

# CleanFrame 0.7.0

CleanFrame remains a starting point to fork and adapt for your own Samsung TV.

- The web launcher's installation minimum is now Tizen 5.0. Contributor results are recorded by model, firmware and tested flow; the minimum does not establish native Home support or complete verification on every TV.
- Settings → Samsung → Inputs lists the HDMI ports reported by the TV, including disconnected inputs that may contain sleeping devices. Selection errors stay visible, and cancelled or timed-out requests cannot start later switching or viewer handoff. Source routing does not guarantee CEC wake.
- Public packaging excludes Tizen SDK build output. Shared widget and Git validation reject generated build paths, preventing copied private overlays or nested signing output from entering a public download.
- Compatibility reports now include AU8000, S85F, LS03N, LS03F, QN85D and the 2020 Frame, with transport, startup and recovery limits recorded separately.
- The 2020 Frame native profile is optional experimental source for one exact firmware. It does not change the reference helper. Its configurable templates have not been redeployed; packaging, signing, model preflight and recovery verification remain owner tasks.

The release widget is **unsigned and uses public fonts only**. It is a reference export using the source identity. For an independent installation, build from this tag with your own SDK-generated package/application identity and certificates in ignored `.local/signing.json`; follow [the setup guide](docs/for-agents.md). Preserve your own identity and author certificate for updates. Never install another owner's signed widget or reuse their native Home target.

Third-party assets retain the terms in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). No maintainer TV was connected, installed, launched or changed for this release. Browser, adapter and host policy checks are repository evidence, not physical TV verification.

Thanks to Scott Heinrich (#14), Taha Tourougou (#15), Renzo Damian (#18), Christian Puryear (#19/#20), Tomi Äijö (#22), and everyone who supplied the device reports in #16, #17, #21 and #24.
