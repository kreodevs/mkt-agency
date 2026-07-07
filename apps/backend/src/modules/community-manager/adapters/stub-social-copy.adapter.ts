import { Injectable } from '@nestjs/common';
import {
  SocialCopyAdapterPort,
  SocialCopyBatch,
  SocialCopyContext,
} from './social-copy.adapter.port';

@Injectable()
export class StubSocialCopyAdapter implements SocialCopyAdapterPort {
  async generate(context: SocialCopyContext): Promise<SocialCopyBatch> {
    const posts = [];
    const platformLabels: Record<string, string> = {
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      twitter: 'X',
      facebook: 'Facebook',
      tiktok: 'TikTok',
    };

    for (let i = 0; i < context.count; i++) {
      const platform = context.platforms[i % context.platforms.length];
      posts.push({
        id: `post-${i + 1}`,
        platform: platform as SocialCopyBatch['posts'][0]['platform'],
        title: `Tips de marketing digital para ${platformLabels[platform] ?? platform}`,
        body:
          `¿Sabías que el contenido educativo genera 3x más engagement en ${platformLabels[platform] ?? platform}? 📊\n\n` +
          `Compartimos 3 tips clave para tu estrategia de contenido:\n\n` +
          `1️⃣ Conoce a tu audiencia: usa los insights de la plataforma para entender qué funciona\n` +
          `2️⃣ Sé consistente: publica al menos 4-5 veces por semana\n` +
          `3️⃣ Mide y ajusta: revisa métricas semanalmente y adapta tu contenido\n\n` +
          `¿Cuál de estos tips aplicas ya en tu estrategia? Cuéntanos en los comentarios 👇\n\n` +
          `#MarketingDigital #Tips #Estrategia`,
        hashtags: ['MarketingDigital', 'Tips', 'Estrategia', 'RedesSociales'],
        visualDescription: `Infografía con 3 tips de marketing digital en colores corporativos para ${platformLabels[platform] ?? platform}`,
        visualFormat: 'image',
        bestTime: '10:00 AM - 12:00 PM hora local',
        targetAudience: 'Dueños de negocio y profesionales de marketing',
        callToAction: 'Comparte tu experiencia en los comentarios',
        tone: 'Educativo y cercano',
      });
    }

    return {
      summary: `Tanda de ${context.count} publicaciones para ${context.platforms.join(', ')}. Contenido educativo enfocado en tips de marketing digital.`,
      posts,
      publishingGuide:
        'Estrategia: Publicaciones educativas para posicionar a la marca como autoridad. ' +
        'Alternar entre contenido educativo (60%), promocional (20%) y de interacción (20%). ' +
        'Responder a todos los comentarios dentro de las primeras 2 horas. ' +
        'Usar hashtags relevantes pero no más de 5 por post. ' +
        'Programar en horas de mayor actividad de la audiencia objetivo.',
      generatedAt: new Date().toISOString(),
    };
  }
}