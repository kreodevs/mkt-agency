import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
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

export function appVersionPlugin(version: string): Plugin {
  let outDir = 'dist';

  return {
    name: 'mkt-agency-app-version',
    transformIndexHtml(html) {
      return html.replace('%BUILD_ID%', version);
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(
          JSON.stringify({ version: 'dev', builtAt: new Date().toISOString() }),
        );
      });
    },
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      writeFileSync(
        path.join(outDir, 'version.json'),
        `${JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2)}\n`,
      );
    },
  };
}
