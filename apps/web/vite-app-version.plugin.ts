import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';

export function resolveAppVersion(): string {
  const fromEnv = process.env.VITE_APP_VERSION?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return `build-${Date.now().toString(36)}`;
  }
}

function versionPayload(version: string): string {
  // Campo "build", no "version": el poller inline legacy (ya eliminado) comparaba v.version.
  return `${JSON.stringify({ build: version, builtAt: new Date().toISOString() }, null, 2)}\n`;
}

export function appVersionPlugin(version: string): Plugin {
  return {
    name: 'mkt-agency-app-version',
    transformIndexHtml(html) {
      return html.replace('%BUILD_ID%', version);
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ build: 'dev', builtAt: new Date().toISOString() }));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionPayload(version),
      });
    },
  };
}
