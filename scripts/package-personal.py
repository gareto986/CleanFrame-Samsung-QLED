"""Build an unsigned personal widget for signing and installing with another tool.

For owners without the Tizen SDK signing setup (for example on Windows with Apps2Samsung).
The widget includes .local/integrations.json, so it contains your service tokens: keep it
private. It uses your own app identity, never the source identity, so it installs beside
other apps (such as TV Dashboard) instead of replacing them, and updates in place later.

Identity comes from package_id/app_id in .local/signing.json when present, otherwise from
.local/identity.json, which is created once with a random package ID and then reused.
"""
from pathlib import Path
import json
import secrets
import string
import sys

from font_assets import ROOT, write_widget_archive
from integrations import load_integrations
from local_config import manifest_identity, validate_identity

IDENTITY = Path('.local/identity.json')


def personal_identity(root=ROOT):
    signing = root / '.local/signing.json'
    if signing.exists():
        try:
            config = json.loads(signing.read_text())
        except (OSError, ValueError):
            raise ValueError('Cannot read .local/signing.json as JSON.') from None
        if isinstance(config, dict) and 'package_id' in config:
            identity = {'package_id': config.get('package_id'), 'app_id': config.get('app_id')}
            validate_identity(identity)
            return identity
    path = root / IDENTITY
    if path.exists():
        try:
            identity = json.loads(path.read_text())
        except (OSError, ValueError):
            raise ValueError('Cannot read .local/identity.json as JSON.') from None
        if not isinstance(identity, dict):
            raise ValueError('.local/identity.json must contain package_id and app_id.')
        validate_identity(identity)
        return {'package_id': identity['package_id'], 'app_id': identity['app_id']}
    alphabet = string.ascii_letters + string.digits
    package = ''.join(secrets.choice(alphabet) for _ in range(10))
    identity = {'package_id': package, 'app_id': package + '.CleanFrame'}
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(identity, indent=2) + '\n')
    print('Created your app identity in .local/identity.json. Keep it: updates must reuse it.')
    return identity


def main(root=ROOT):
    identity = personal_identity(root)
    source = manifest_identity((root / 'app/config.xml').read_bytes())
    if identity == source:
        raise ValueError('Use your own app identity, not the source identity.')
    settings = load_integrations(root)
    output = root / 'dist/CleanFrame-personal-unsigned.wgt'
    output.parent.mkdir(exist_ok=True)
    write_widget_archive(output, root=root, include_private=True, identity=identity)
    print('Created ' + str(output.relative_to(root)))
    print('App ID: ' + identity['app_id'])
    print('Integrations: ' + (', '.join(sorted(settings)) if settings else 'none (.local/integrations.json not found)'))
    print('Unsigned. It contains your integration tokens: sign and install it yourself; never share it.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError) as error:
        sys.exit(str(error) if isinstance(error, ValueError) else 'Cannot build the personal widget: ' + str(error))
