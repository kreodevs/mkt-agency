import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Trial, TrialStatus, TrialPhase } from './entities/trial.entity';

const PHASE_SCHEDULE = [
  { phase: 'activation' as TrialPhase, days: [1, 3, 7] },
  { phase: 'engagement' as TrialPhase, days: [15, 30, 45] },
  { phase: 'profundizacion' as TrialPhase, days: [60, 70] },
  { phase: 'cierre' as TrialPhase, days: [76, 83, 88] },
];

const NURTURING_MESSAGES: Record<string, Record<number, string>> = {
  activation: {
    1: 'Bienvenido a OralTrack. ¿Le ayudo a configurar su agenda?',
    3: '¿Ya configuró su consultorio? Si necesita ayuda, aquí estoy.',
    7: '¿Cómo va su primera semana? ¿Ha usado el panel financiero?',
  },
  engagement: {
    15: '¿Sabía que puede personalizar sus recordatorios de citas?',
    30: 'Mitad del trial. ¿Ha explorado los odontogramas digitales?',
    45: '¿Ya vinculó su WhatsApp para recordatorios automáticos?',
  },
  profundizacion: {
    60: '¿Ha usado el módulo de evidencia fotográfica? Sus pacientes valoran el antes/después.',
    70: '¿Sabe que puede generar reportes financieros? El tablero ejecutivo le muestra rentabilidad.',
  },
  cierre: {
    76: 'Quedan 2 semanas de prueba. ¿OralTrack le ha sido útil? Planes desde $350/mes.',
    83: '7 días. ¿Quiere renovar? El plan anual le ahorra 2 meses ($3,500/año).',
    88: 'Últimos 2 días. ¿Renueva? Solo responda SÍ y lo activamos.',
  },
};

@Injectable()
export class TrialsService {
  constructor(
    @InjectRepository(Trial)
    private readonly trialRepo: Repository<Trial>,
  ) {}

  async create(data: {
    tenantId: string; leadId?: string; email: string;
    name?: string; clinic?: string; phone?: string;
  }): Promise<Trial> {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 90);

    const trial = this.trialRepo.create({
      tenantId: data.tenantId,
      leadId: data.leadId,
      email: data.email,
      name: data.name,
      clinic: data.clinic,
      phone: data.phone,
      startDate: now,
      endDate: end,
      phase: 'activation',
      nurturingHistory: [],
    });
    return this.trialRepo.save(trial) as any;
  }

  async findAll(tenantId: string): Promise<Trial[]> {
    return this.trialRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Trial> {
    const trial = await this.trialRepo.findOne({ where: { id } });
    if (!trial) throw new NotFoundException('Trial no encontrado');
    return trial;
  }

  async handleEvent(data: {
    type: string; email: string; name?: string; clinic?: string;
    phone?: string; plan?: string;
  }): Promise<Trial | null> {
    let trial = await this.trialRepo.findOne({ where: { email: data.email } });

    switch (data.type) {
      case 'trial.started':
        if (!trial) {
          trial = await this.create({
            tenantId: 'oraltrack',
            email: data.email, name: data.name,
            clinic: data.clinic, phone: data.phone,
          });
        }
        break;

      case 'trial.active':
        if (trial) {
          trial.lastLogin = new Date();
          trial.loginCount += 1;
          trial.status = 'active';
          await this.trialRepo.save(trial);
        }
        break;

      case 'trial.dormant':
        if (trial) {
          trial.status = 'dormant';
          await this.trialRepo.save(trial);
        }
        break;

      case 'trial.converted':
        if (trial) {
          trial.status = 'converted';
          trial.convertedAt = new Date();
          trial.convertedPlan = data.plan || '';
          await this.trialRepo.save(trial);
        }
        break;

      case 'trial.cancelled':
        if (trial) {
          trial.status = 'cancelled';
          await this.trialRepo.save(trial);
        }
        break;
    }

    return trial;
  }

  async getPendingNurturing(): Promise<Trial[]> {
    const now = new Date();
    const trials = await this.trialRepo.find({
      where: [
        { status: 'active' },
        { status: 'dormant' },
      ],
    });

    return trials.filter(t => {
      const day = Math.floor((now.getTime() - t.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return PHASE_SCHEDULE.some(p =>
        p.days.includes(day) &&
        !t.nurturingHistory?.some(h => h.day === day)
      );
    });
  }

  async getMessagesForDay(day: number): Promise<string[]> {
    for (const phase of PHASE_SCHEDULE) {
      if (phase.days.includes(day) && NURTURING_MESSAGES[phase.phase]?.[day]) {
        return [NURTURING_MESSAGES[phase.phase][day]];
      }
    }
    return [];
  }

  async getStats(tenantId: string) {
    const trials = await this.findAll(tenantId);
    return {
      total: trials.length,
      active: trials.filter(t => t.status === 'active').length,
      dormant: trials.filter(t => t.status === 'dormant').length,
      converted: trials.filter(t => t.status === 'converted').length,
      cancelled: trials.filter(t => t.status === 'cancelled').length,
      expired: trials.filter(t => t.status === 'expired').length,
      conversionRate: trials.length > 0
        ? Math.round((trials.filter(t => t.status === 'converted').length / trials.length) * 100)
        : 0,
    };
  }
}