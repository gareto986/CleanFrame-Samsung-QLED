// Development only. A private preview and a fresh browser profile for each run.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { findPython } from './python.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));

export async function openPreview({ publicFonts = false } = {}) {
  const args = ['scripts/preview.py', '--port', '0'];
  if (publicFonts || process.env.CLEANFRAME_PUBLIC_FONTS === '1') args.push('--public-fonts');
  const python = findPython();
  if (!python) throw Error('Python 3.10 or newer was not found (tried python3, python and py -3).');
  const server = spawn(python[0], [...python[1], ...args], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe']
  });
  let browser;
  let diagnostics = '';
  server.stderr.on('data', chunk => { diagnostics = (diagnostics + chunk).slice(-4000); });
  try {
    const baseURL = await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(Error('Preview startup timed out')), 10000);
      server.once('error', error => { clearTimeout(timeout); reject(error); });
      server.once('exit', code => { clearTimeout(timeout); reject(Error('Preview exited: ' + code + ' ' + diagnostics)); });
      server.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timeout); resolve(match[0]); }
      });
    });
    // CLEANFRAME_CHROMIUM selects an existing Chromium when Playwright's own build is absent.
    browser = await chromium.launch({ headless: true, executablePath: process.env.CLEANFRAME_CHROMIUM || undefined });
    return { browser, baseURL, close: async () => {
      try { await browser.close(); }
      finally { server.kill(); await once(server, 'exit'); }
    } };
  } catch (error) {
    server.kill();
    if (browser) await browser.close();
    throw error;
  }
}
