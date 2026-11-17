# Home button, power-on and quick access

CleanFrame installs and runs as an ordinary TV app. Samsung Tizen does not provide a
supported setting that makes a third-party app the system Home screen, the target of the
physical **Home** button, or the target of the remote's branded app buttons (Netflix, Prime
Video, Samsung TV Plus and similar). This page records what is and is not reachable, and the
safe ways to get close.

## Supported, reversible options

- **Autorun Last App** (Settings → General → System Manager, wording varies). The TV powers
  on into whatever app was open at power-off, so it lands on CleanFrame when CleanFrame was
  the last app open. It does not change the Home button, and it can be switched off anytime.
- **Pin CleanFrame on the Samsung Home bar.** Focus the CleanFrame tile, open its tile
  options, and move it to the far left, so it is Home → Enter.
- **Number-button shortcut.** On remotes that have number keys, some models pin an app when
  you press and hold a number with the app highlighted. The slim Samsung One Remote has no
  number keys, so this does not apply to it.

None of these is the Home button itself, but together they cut it to about one extra press.

## What is not reachable without the unsupported native route

Reassigning the physical **Home** button, or the branded app buttons, is not an app setting.
The branded buttons send fixed key codes that the TV firmware maps to specific apps; there is
no menu to remap them. The only known way to intercept them is the same undocumented,
higher-risk native route used for the Home-button experiment (a signed key-filter rule plus
system-setting writes), described in the [staged setup guide](agent-tv-setup-guide.md). That
route is unsupported, unverified for these buttons on any TV, and firmware-specific.

## The hard prerequisite: a recovery baseline

Any native change must capture the TV's **exact original values first**, with a tested
restore, before anything is written. See the setup guide and the
[2020 LS03T profile](../scripts/native-home/frame-2020/README.md).

On a TV where the developer shell execution route is closed, that baseline cannot be
captured, so **no native write may be attempted** — reading the current Home or key-rule
settings is impossible, and a change could not be verified or cleanly reversed. Signs of a
closed route:

- `sdb capability` reports `intershell_support:disabled`.
- `sdb shell echo hello` returns nothing (or `closed`).

The 2020 Q60T (QN82Q6DTAFXZA, firmware T-NKLAKUC-2743.0) is a recorded example: the app and
its integrations run, but the shell route is closed and its firmware is outside the reference
and LS03T guards, so the Home button, startup and branded buttons are left as the TV sets
them. See [compatibility evidence](compatibility.md). This is a safety limit, not a defect to
work around: do not loosen a helper's firmware or model guard to force a write.
