import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding } from './entities/onboarding.entity';
import { OnboardingTask, TaskStatus } from './entities/onboarding-task.entity';

const DEFAULT_CHECKLIST = [
  { taskKey: 'config_tenant', title: 'Configurar Tenant', description: 'Define el nombre, dominio y logo de la empresa', order: 1 },
  { taskKey: 'add_product', title: 'Agregar Producto/SaaS', description: 'Crea el producto dentro del tenant', order: 2 },
  { taskKey: 'invite_users', title: 'Invitar Usuarios', description: 'Agrega miembros del equipo con sus roles', order: 3 },
  { taskKey: 'configure_pipeline', title: 'Configurar Pipeline CRM', description: 'Selecciona el tipo de pipeline: SaaS, Bienes Raíces o Servicios', order: 4 },
  { taskKey: 'connect_ads', title: 'Conectar Google Ads', description: 'Opcional: vincula la cuenta de Google Ads', order: 5 },
  { taskKey: 'connect_social', title: 'Conectar Redes Sociales', description: 'Configura las credenciales de X/Twitter y otras redes', order: 6 },
  { taskKey: 'define_keywords', title: 'Definir Keywords', description: 'Establece las palabras clave para campañas y SEO', order: 7 },
  { taskKey: 'start_prospecting', title: 'Iniciar Prospección', description: 'Lanza el primer batch de leads automatizado', order: 8 },
];

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Onboarding)
    private readonly onboardingRepo: Repository<Onboarding>,
    @InjectRepository(OnboardingTask)
    private readonly taskRepo: Repository<OnboardingTask>,
  ) {}

  async create(tenantId: string, productId?: string): Promise<Onboarding> {
    const onboarding = this.onboardingRepo.create({
      tenantId,
      productId: productId || undefined,
      status: 'pending',
    });
    const saved = await this.onboardingRepo.save(onboarding) as unknown as Onboarding;

    const tasks = DEFAULT_CHECKLIST.map((item) =>
      this.taskRepo.create({
        onboardingId: saved.id,
        taskKey: item.taskKey,
        title: item.title,
        description: item.description,
        order: item.order,
        status: 'pending',
      }),
    );
    await this.taskRepo.save(tasks);

    return this.onboardingRepo.findOne({ where: { id: saved.id } }) as Promise<Onboarding>;
  }

  async findLatest(tenantId: string): Promise<Onboarding> {
    const onboarding = await this.onboardingRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    if (!onboarding) throw new NotFoundException('Onboarding no encontrado para este tenant');
    return onboarding;
  }

  async findOne(id: string): Promise<Onboarding> {
    const onboarding = await this.onboardingRepo.findOne({ where: { id } });
    if (!onboarding) throw new NotFoundException('Onboarding no encontrado');
    return onboarding;
  }

  async updateTask(id: string, taskKey: string, status: TaskStatus): Promise<OnboardingTask> {
    const task = await this.taskRepo.findOne({ where: { onboardingId: id, taskKey } });
    if (!task) throw new NotFoundException('Tarea de onboarding no encontrada');

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    } else {
      task.completedAt = undefined as unknown as Date;
    }
    await this.taskRepo.save(task);

    // Si la tarea se completó, verificar si todas las tareas están completadas
    if (status === 'completed') {
      const allTasks = await this.taskRepo.find({ where: { onboardingId: id } });
      const allCompleted = allTasks.every((t) => t.status === 'completed');
      if (allCompleted) {
        await this.onboardingRepo.update(id, {
          status: 'completed' as any,
          completedAt: new Date(),
        });
      } else {
        // Marcar onboarding como in_progress al menos una tarea completada
        await this.onboardingRepo.update(id, {
          status: 'in_progress' as any,
          startedAt: new Date(),
        });
      }
    }

    return task;
  }

  getDefaultChecklist() {
    return DEFAULT_CHECKLIST;
  }
}
