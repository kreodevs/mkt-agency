import { normalizeAppCaptureManifest } from './tutorial-manifest.util';

describe('normalizeAppCaptureManifest', () => {
  const context = {
    fallbackBaseUrl: 'https://app.example.com',
    manifestUrl: 'https://app.example.com/tutorial-manifest.json',
  };

  it('parsea formato OralTrack (modules + flow)', () => {
    const manifest = normalizeAppCaptureManifest(
      {
        app: 'OralTrack',
        baseUrl: 'https://app.oraltrack.com.mx',
        coverageNotes: { microTutorialesActivos: ['agenda', 'pacientes'] },
        modules: [
          {
            navId: 'page-login',
            title: 'Login',
            path: '/login',
            disabled: true,
            flow: [
              { action: 'fill', selector: '[data-testid="login-email-input"]' },
              { action: 'click', selector: '#action-iniciar-sesion' },
            ],
          },
          { navId: 'nav-agenda', title: 'Agenda', path: '/agenda' },
        ],
      },
      context,
    );

    expect(manifest?.appName).toBe('OralTrack');
    expect(manifest?.modules).toHaveLength(2);
    expect(manifest?.loginFlow).toHaveLength(2);
    expect(manifest?.preferredModuleIds).toEqual(['agenda', 'pacientes']);
  });

  it('parsea formato genérico pages + login selectors', () => {
    const manifest = normalizeAppCaptureManifest(
      {
        baseUrl: 'https://saas.example.com',
        preferredScreens: ['home', 'billing'],
        login: {
          path: '/sign-in',
          emailSelector: '#email',
          passwordSelector: '#password',
          submitSelector: 'button[type=submit]',
        },
        pages: [
          { id: 'home', title: 'Inicio', path: '/home', waitSelector: '[data-page=home]' },
          { id: 'billing', title: 'Facturación', url: 'https://saas.example.com/billing' },
          { id: 'login', title: 'Login', path: '/sign-in', skip: true },
        ],
      },
      context,
    );

    expect(manifest?.loginFlow).toHaveLength(3);
    expect(manifest?.loginPath).toBe('/sign-in');
    expect(manifest?.modules.find((m) => m.id === 'home')?.waitSelector).toBe('[data-page=home]');
    expect(manifest?.preferredModuleIds).toEqual(['home', 'billing']);
  });

  it('acepta screens[] con steps como alias de flow', () => {
    const manifest = normalizeAppCaptureManifest(
      {
        appBaseUrl: 'https://other.app',
        screens: [
          {
            name: 'Dashboard',
            route: '/dashboard',
            steps: [{ action: 'wait', selector: '#dashboard-root' }],
          },
        ],
      },
      { fallbackBaseUrl: 'https://other.app', manifestUrl: 'https://other.app/manifest.json' },
    );

    expect(manifest?.baseUrl).toBe('https://other.app');
    expect(manifest?.modules[0]?.waitSelector).toBe('#dashboard-root');
  });
});
