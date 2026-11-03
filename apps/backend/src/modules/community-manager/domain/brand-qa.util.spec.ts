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

  it('detects and flags boring corporate clichés', () => {
    const post: Partial<SocialCopyPost> & { body: string } = {
      title: 'Post aburrido',
      body: 'Con Oraltrack, olvídate de las agendas perdidas. Tus citas al alcance de un clic.',
      platform: 'twitter',
      visualFormat: 'image',
    };

    const result = runBrandQaAudit(post);
    expect(result.warnings.some((w) => w.includes('Con X, olvídate de'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('al alcance de un clic'))).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it('audits talking-head script to remove emojis, spoken hashtags and fits duration', () => {
    const post: Partial<SocialCopyPost> & { body: string } = {
      title: 'Reel CM',
      body: 'Mira, te voy a ser honesta: llevar un consultorio dental no es fácil. Entre citas, pacientes y papeleo, todo se vuelve un caos. 😩 Pero, ¿y si te dijera que existe una forma más sencilla? Oraltrack centraliza todo: tus citas, tus expedientes y hasta tus cobros. Todo en un solo lugar, sin complicaciones. Yo también pensé que iba a ser difícil de usar, pero es tan intuitivo que en una tarde ya lo dominaba. Y lo mejor: mis pacientes notan la diferencia. Se sienten más atendidos y yo me siento más tranquila. Si tú también quieres dar el salto a la organización digital, dale like a este video y cuéntame en los comentarios: ¿qué es lo que más se te complica de tu consultorio? #OralTrack 👇',
      platform: 'tiktok',
      visualFormat: 'talking-head',
    };

    const result = runBrandQaAudit(post);
    expect(result.sanitizedBody).not.toContain('😩');
    expect(result.sanitizedBody).not.toContain('👇');
    expect(result.sanitizedBody).not.toContain('#OralTrack');
    expect(result.warnings.some((w) => w.includes('emojis'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('extenso'))).toBe(true);
    const words = result.sanitizedBody.split(/\s+/).filter(Boolean);
    expect(words.length).toBeLessThanOrEqual(65);
  });
});
