import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EMAIL_SENDER, EmailSenderPort } from '../../../shared/email/email.port';
import { UserEntity } from '../../../shared/infrastructure/typeorm/user.entity';

export interface OwnerEmailContext {
  tenantId: string;
  subject: string;
  body: string;
  ctaPath?: string;
  ctaLabel?: string;
}

@Injectable()
export class OwnerNotificationService {
  private readonly logger = new Logger(OwnerNotificationService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @Inject(EMAIL_SENDER)
    private readonly email: EmailSenderPort,
    private readonly config: ConfigService,
  ) {}

  async notifyOwners(context: OwnerEmailContext): Promise<number> {
    const recipients = await this.resolveOwnerEmails(context.tenantId);
    if (recipients.length === 0) {
      return 0;
    }

    const appUrl = this.resolveAppUrl();
    const ctaUrl =
      context.ctaPath && appUrl ? `${appUrl.replace(/\/$/, '')}${context.ctaPath}` : null;
    const ctaBlock = ctaUrl
      ? `\n\n${context.ctaLabel ?? 'Abrir en la plataforma'}: ${ctaUrl}`
      : '';
    const text = `${context.body}${ctaBlock}\n\n— Mkt Agency OS`;

    const htmlCta = ctaUrl
      ? `<p><a href="${ctaUrl}">${context.ctaLabel ?? 'Abrir en la plataforma'}</a></p>`
      : '';

    try {
      await this.email.send({
        to: recipients,
        subject: context.subject,
        text,
        html: `<p>${context.body.replace(/\n/g, '<br/>')}</p>${htmlCta}<p>— Mkt Agency OS</p>`,
      });
      return recipients.length;
    } catch (error) {
      this.logger.warn(`Owner email failed for tenant ${context.tenantId}`, error);
      return 0;
    }
  }

  async notifyApprovalReminder(tenantId: string, pendingCount: number): Promise<number> {
    return this.notifyOwners({
      tenantId,
      subject: 'Tienes publicaciones pendientes de aprobar',
      body: `${pendingCount} pieza(s) programada(s) en las próximas 48 h esperan tu revisión y firma.`,
      ctaPath: '/publication-inbox',
      ctaLabel: 'Revisar bandeja',
    });
  }

  async notifyPublishReminder(tenantId: string, readyCount: number): Promise<number> {
    return this.notifyOwners({
      tenantId,
      subject: 'Hoy toca publicar',
      body: `Tienes ${readyCount} publicación(es) aprobada(s) lista(s) para copiar y pegar en tus redes hoy.`,
      ctaPath: '/publication-inbox',
      ctaLabel: 'Ver qué publicar hoy',
    });
  }

  async notifyExecutiveReport(
    tenantId: string,
    report: {
      headline: string;
      executiveSummary: string;
      suggestions: Array<{ action: string }>;
    },
  ): Promise<number> {
    const preview = report.suggestions
      .slice(0, 2)
      .map((item, index) => `${index + 1}. ${item.action}`)
      .join('\n');

    return this.notifyOwners({
      tenantId,
      subject: `Resumen ejecutivo: ${report.headline}`,
      body: `${report.executiveSummary}\n\nSugerencias para tu revisión:\n${preview || '—'}`,
      ctaPath: '/agency/activity',
      ctaLabel: 'Ver reporte completo',
    });
  }

  async notifyWeekReady(tenantId: string, postsGenerated: number, productName?: string): Promise<number> {
    const productLine = productName ? ` para «${productName}»` : '';
    return this.notifyOwners({
      tenantId,
      subject: 'Tu semana está lista para revisar',
      body: `Tu copiloto generó ${postsGenerated} publicación(es)${productLine}. Revísalas y aprueba cuando quieras.`,
      ctaPath: '/publication-inbox',
      ctaLabel: 'Revisar mi semana',
    });
  }

  private async resolveOwnerEmails(tenantId: string): Promise<string[]> {
    const rows = await this.users.find({
      where: {
        tenantId,
        status: 'active',
        role: In(['owner', 'admin']),
        isSuperadmin: false,
      },
      select: ['email'],
    });

    return [...new Set(rows.map((row) => row.email.trim().toLowerCase()).filter(Boolean))];
  }

  private resolveAppUrl(): string | null {
    const explicit = this.config.get<string>('FRONTEND_PUBLIC_URL', '').trim();
    if (explicit) {
      return explicit;
    }

    const cors = this.config.get<string>('CORS_ORIGIN', '').trim();
    if (cors && cors !== '*') {
      const first = cors.split(',')[0]?.trim();
      if (first) {
        return first;
      }
    }

    return null;
  }
}
