"""Private Home integration settings for the preview and personal widget.

.local/integrations.json holds the owner's addresses, tokens and choices (Plex, Home
Assistant, Immich, weather location, teams and feeds). It is turned into
assets/integrations.js only inside a personal build or the local preview. Public exports
always use the empty default in app/assets/integrations.js.
"""
from pathlib import Path
import json
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CONFIG = Path('.local/integrations.json')
SECTIONS = {'weather', 'news', 'sports', 'plex', 'homeAssistant', 'photos'}
# Keyless public services used by the integrations, in addition to configured hosts.
PUBLIC_HOSTS = {'api.open-meteo.com', 'api.weather.gov', 'site.api.espn.com'}


def load_integrations(root=ROOT):
    """Return the validated private settings, or None when no file exists."""
    path = root / CONFIG
    if not path.exists():
        return None
    if path.is_symlink() or not path.is_file():
        raise ValueError('.local/integrations.json must be a regular file.')
    try:
        data = json.loads(path.read_text())
    except (OSError, ValueError):
        raise ValueError('.local/integrations.json is not valid JSON.') from None
    if not isinstance(data, dict):
        raise ValueError('.local/integrations.json must contain an object.')
    unknown = set(data) - SECTIONS - {'$comment'}
    if unknown:
        raise ValueError('Unknown integration section: ' + sorted(unknown)[0])
    for name in SECTIONS & set(data):
        if not isinstance(data[name], dict):
            raise ValueError('Integration section must be an object: ' + name)
    for url in configured_urls(data):
        parts = urlsplit(url)
        if parts.scheme not in ('http', 'https') or not parts.hostname:
            raise ValueError('Integration addresses must be http(s) URLs.')
    data.pop('$comment', None)
    return data


def configured_urls(data):
    urls = []
    if isinstance(data.get('plex'), dict):
        urls.append(data['plex'].get('url'))
    if isinstance(data.get('homeAssistant'), dict):
        urls.append(data['homeAssistant'].get('url'))
    photos = data.get('photos')
    if isinstance(photos, dict) and isinstance(photos.get('immich'), dict):
        urls.append(photos['immich'].get('url'))
    news = data.get('news')
    if isinstance(news, dict) and isinstance(news.get('feeds'), list):
        urls.extend(feed.get('url') for feed in news['feeds'] if isinstance(feed, dict))
    return [url for url in urls if url]


def allowed_hosts(data):
    """Hosts the preview passthrough may contact for this configuration."""
    if not data:
        return set()
    return PUBLIC_HOSTS | {urlsplit(url).hostname for url in configured_urls(data)}


def integration_overlay(root=ROOT, include_private=True):
    data = load_integrations(root) if include_private else None
    if data is None:
        return {}
    script = ('/* Generated from .local/integrations.json for a personal build. Do not publish. */\n'
              'window.CleanFrameIntegrations = ' + json.dumps(data, ensure_ascii=True, separators=(',', ':')) + ';\n')
    return {'assets/integrations.js': script.encode()}
