# Auth module

Login, refresh, logout y JWKS (`/api/v1/auth/*`).

- Access token: JWT RS256, 15 min
- Refresh token: opaco, hash SHA-256 en `sessions`, rotación en cada refresh
- Bloqueo: 5 intentos fallidos → 15 min

## Servicios

- `JwtTokenService` (`shared/auth/jwt-token.service.ts`) — firma RS256 y JWKS
- Alias de tarea: `services/jwt.service.ts`
