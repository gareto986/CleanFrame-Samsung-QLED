# CleanFrame for Android TV (NVIDIA Shield)

A thin Android TV app that runs the **same** CleanFrame web UI as the Samsung/Tizen build,
hosted in a full-screen WebView, with a small native bridge replacing the Tizen device layer.
It can be installed as an ordinary app or set as the Shield's **Home launcher**.

> **Status: scaffold.** This has not been built or tested on a device from this repository. It
> builds on GitHub Actions or Android Studio, and needs a Shield to install and verify. The app-id map and the remote
> behaviour below are best-effort and must be confirmed on the device.

## How it reuses the web UI

There is one source of truth for the interface and all integrations: the web code in `../app`.
At build time Gradle copies `../app` into the APK's `assets/web` (the `syncWeb` task) and
overlays two Android-specific files:

- `web-overlay/device.js` → replaces the Tizen `device.js`. It implements the same
  `window.FrameDevice` API against the native bridge (`window.AndroidTV`): launching apps by
  Android package, listing installed TV apps, opening Android settings / the system launcher.
- `web-overlay/integrations.js` (optional, git-ignored) → your private integration config.

So a change to the rails Home, the Plex player, weather, Home Assistant, etc. is made once in
`../app` and both platforms get it.

## Build with GitHub Actions (no Android Studio)

GitHub builds the APK for you. The workflow at `.github/workflows/android.yml` runs on every
push to the `claude/shield-android` branch (and can be run by hand from the repo's **Actions**
tab → *Android APK (Shield)* → **Run workflow**). When it finishes, open the run and download
the **cleanframe-shield-apk** artifact, unzip it, and sideload `app-debug.apk` to the Shield:

```sh
adb connect <shield-ip>:5555     # Shield: Settings → Device Preferences → Developer options → Network debugging
adb install -r app-debug.apk
```

The debug APK is signed with Android's debug key, which is fine for personal sideloading.

**To include your integrations** (Plex, Home Assistant, weather, Immich, Moonlight), add a repo
secret **`CLEANFRAME_INTEGRATIONS_JSON`** (Settings → Secrets and variables → Actions) whose
value is the contents of your `.local/integrations.json`. The workflow bakes it into the APK.
The APK then holds your tokens, so keep that build private; leave the secret unset for a
config-less APK (apps only). Actions must be enabled for the repo (Actions tab).

## Build locally with Android Studio

Prerequisites: **Android Studio** (Giraffe or newer), **Android SDK 34**, **JDK 17**.

1. Open the `android/` folder in Android Studio and let it sync (it creates the Gradle wrapper
   and downloads dependencies).
2. Add your integration config (optional, see below).
3. Run on the Shield over adb, or **Build → Build APK(s)**, and sideload the result.

Command line (after Android Studio has created the wrapper, or run `gradle wrapper` once):

```sh
cd android
./gradlew assembleRelease     # app/build/outputs/apk/release/app-release.apk
adb connect <shield-ip>:5555  # enable Developer options → Network debugging on the Shield
adb install -r app/build/outputs/apk/release/app-release.apk
```

The release build is signed with the debug key for personal sideloading. Replace it with your
own signing key before distributing.

## Your integrations (Plex, Home Assistant, weather, Immich, Moonlight)

Create `android/web-overlay/integrations.js` with the same object the TV build uses. The easiest
way is to generate it from your existing `.local/integrations.json`:

```sh
printf 'window.CleanFrameIntegrations = %s;\n' "$(cat ../.local/integrations.json)" > web-overlay/integrations.js
```

This file is git-ignored and is baked into the APK, so **treat the APK as private** — it holds
your Home Assistant token and Immich key, exactly like the TV widget.

With no config, the app shows only the apps rail and makes no network requests, same as a public
TV build.

## Set it as the Home screen

Install the app, then press the Shield's **Home** button: Android offers a launcher chooser —
pick **CleanFrame** and **Always**. (Wording varies by Android TV version; some builds set the
default under Settings.) It's reversible: clear defaults for CleanFrame, or pick the Google TV
launcher, to go back. Unlike the Samsung TV, replacing the launcher here is a supported path.

## What differs from the Samsung/Tizen build

- **Launching apps** uses Android **package ids**, not Tizen ids. The defaults in
  `web-overlay/device.js` are best-effort; installed-app discovery replaces each app's id with
  the one the device reports, matched by package or name. Confirm your apps via **All apps**.
- **HDMI inputs** and **Art Mode** don't exist on the Shield, so those controls report that
  they're unavailable. The **Samsung Home** control opens the system launcher instead. (Trimming
  these controls from the Android UI is a follow-up; it would touch the shared `app/main.js`.)
- **The remote** is handled natively: the Activity maps D-pad, OK, Back and the media keys to the
  key codes the web UI already understands, so navigation and the Plex player controls work
  without relying on WebView key behaviour.
- **Plex playback** is direct play through the WebView's `<video>`; the Shield's codec support is
  strong, so it should play more files than the TV. Confirm on the device.
- **File-origin network access**: the WebView is configured to let the bundled page reach your
  own services directly, the Android equivalent of the Tizen widget's `<access origin="*">`.
  Cleartext (http) is allowed for LAN services like Plex and the NAS.

## Not yet verified

Everything here needs a build on Android Studio and a run on the Shield: that it compiles, that
apps launch, that discovery and brand icons resolve, that the remote and the Plex player behave,
and that it can be set as the Home launcher. Report what happens and it can be adjusted.
