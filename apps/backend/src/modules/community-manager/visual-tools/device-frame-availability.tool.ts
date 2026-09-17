import { Injectable, Logger } from '@nestjs/common';
import type { AgentTool, ToolContext, ToolDefinition, ToolExecutionResult } from '../../../shared/ai/tools/tool.interface';
import { ProductMediaKitService } from '../../product/product-media-kit.service';
import { kitHasComposeImageRoles } from '../../product/domain/product-media-kit.constants';

export interface DeviceFrameResult {
  available: boolean;
  device: 'pc' | 'ipad' | 'ios' | null;
  screenshotCount: number;
  hasComposeRoles: boolean;
}

@Injectable()
export class DeviceFrameAvailabilityTool implements AgentTool {
  private readonly logger = new Logger(DeviceFrameAvailabilityTool.name);

  readonly definition: ToolDefinition = {
    name: 'check_device_frame_availability',
    description: 'Verifica si hay screenshots reales del producto en el media kit disponibles para componer mockups con marco de dispositivo. Útil para saber si el post puede mostrar la UI real del producto.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'ID del producto. Si se omite, usa el producto activo del tenant.',
        },
        platform: {
          type: 'string',
          description: 'Plataforma destino para sugerir el tipo de dispositivo adecuado',
        },
      },
    },
  };

  constructor(
    private readonly mediaKitService: ProductMediaKitService,
  ) {}

  async execute(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolExecutionResult> {
    try {
      const productId = (input.productId as string) ?? ctx.productId;
      if (!productId) {
        return { success: false, result: null, error: 'No productId provided' };
      }

      const kit = await this.mediaKitService.listEntitiesForProduct(ctx.tenantId, productId);
      const hasComposeRoles = kitHasComposeImageRoles(kit);

      const contextItems = await this.mediaKitService.buildMediaKitContextForLlm(ctx.tenantId, kit);

      const screenshots = contextItems.filter((item) => item.role === 'product-screenshot');
      const devices = new Set(screenshots.map((s) => s.device).filter(Boolean));

      const platform = (input.platform as string) ?? 'instagram';
      let preferredDevice: 'pc' | 'ipad' | 'ios' | null = null;
      if (platform === 'linkedin' || platform === 'twitter') {
        preferredDevice = devices.has('pc' as never) ? 'pc' : null;
      } else if (platform === 'tiktok' || platform === 'instagram') {
        preferredDevice = devices.has('ios' as never) ? 'ios' : devices.has('ipad' as never) ? 'ipad' : null;
      } else {
        preferredDevice = devices.size > 0 ? (Array.from(devices)[0] as 'pc' | 'ipad' | 'ios') : null;
      }

      return {
        success: true,
        result: {
          available: screenshots.length > 0,
          device: preferredDevice,
          screenshotCount: screenshots.length,
          hasComposeRoles,
        } as DeviceFrameResult,
      };
    } catch (error) {
      this.logger.warn(`device-frame-availability error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
