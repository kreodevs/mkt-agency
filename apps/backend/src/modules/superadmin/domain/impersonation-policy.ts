import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';

export class ImpersonationPolicy {
  /**
   * Durante impersonación de plataforma se permiten acciones destructivas.
   * Restricciones pendientes para operación en modo venta (sin superadmin).
   */
  static assertDestructiveAllowed(
    _user: AuthenticatedUser,
    _action: string,
  ): void {
    // no-op
  }
}
