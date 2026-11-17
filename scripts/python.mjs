// Run a repository Python script with whichever Python 3 this computer provides.
// macOS/Linux usually have python3; Windows installs python and the py launcher.
import { spawnSync } from 'node:child_process';

const CANDIDATES = [['python3'], ['python'], ['py', '-3']];

export function findPython() {
  for (const [command, ...prefix] of CANDIDATES) {
    const probe = spawnSync(command, [...prefix, '-c', 'import sys; print(sys.version_info >= (3, 10))'], { encoding: 'utf8' });
    if (probe.status === 0 && probe.stdout.trim() === 'True') return [command, prefix];
  }
  return null;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href || process.argv[1]?.endsWith('python.mjs')) {
  const found = findPython();
  if (!found) {
    console.error('Python 3.10 or newer was not found (tried python3, python and py -3). Install it, then open a new terminal.');
    process.exit(1);
  }
  const [command, prefix] = found;
  const result = spawnSync(command, [...prefix, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
