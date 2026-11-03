import { runBrandQaAudit } from './brand-qa.util';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';

describe('brand-qa.util', () => {
  it('detects banned ad terms and sanitizes body', () => {
    const post: Partial<SocialCopyPost> & { body: string } = {
      title: 'Post de prueba',
      body: 'Descubre cómo ganar dinero fácil sin ningún riesgo hoy mismo.',
      platform: 'instagram',
      visualFormat: 'image',
      visualDescription: 'Mockup',
    };

    const result = runBrandQaAudit(post);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
    expect(result.sanitizedBody).not.toContain('dinero fácil');
    expect(result.sanitizedBody).not.toContain('sin ningún riesgo');
  });

  it('eliminates passive greetings to protect scroll-stopping line 1', () => {
    const post: Partial<SocialCopyPost> & { body: string } = {
      title: 'Post de prueba',
      body: '¡Hola a todos!\n\nEl 82% de las empresas pierden clientes por procesos lentos.',
      platform: 'linkedin',
      visualFormat: 'image',
      visualDescription: 'Mockup',
    };

    const result = runBrandQaAudit(post);
    expect(result.warnings.some((w) => w.includes('saludo pasivo'))).toBe(true);
    expect(result.sanitizedBody.startsWith('El 82%')).toBe(true);
  });

  it('cleans hashtags from visual headlines and limits excessive hashtags', () => {
    const post: Partial<SocialCopyPost> & { body: string } = {
      title: 'Post de prueba',
      body: 'Automatiza tu embudo de ventas en minutos.',
      platform: 'twitter',
      visualFormat: 'image',
      visualDescription: 'Mockup',
      visualHeadline: 'Automatiza Ya #SaaS #Viral',
      hashtags: ['#saas', '#b2b', '#growth', '#marketing', '#sales', '#tech', '#viral'],
    };

    const result = runBrandQaAudit(post);
    expect(post.visualHeadline).toBe('Automatiza Ya');
    expect(post.hashtags?.length).toBeLessThanOrEqual(3);
  });
});
