/**
 * @deprecated Usa `HeroModern` directamente — HeroSection era un componente paralelo
 * con las mismas capacidades pero sin animaciones Reveal ni parallax.
 * Toda su API ha sido absorbida por HeroModern.
 *
 * Migration:
 * ```diff
 * - import { HeroSection } from '@/components'
 * + import { HeroModern } from '@/components'
 *
 * - <HeroSection
 * -   primaryButtonText="Comenzar"
 * -   onPrimaryClick={fn}
 * -   secondaryButtonText="Ver más"
 * - />
 * + <HeroModern
 * +   primaryAction={{ label: 'Comenzar', onClick: fn }}
 * +   secondaryAction={{ label: 'Ver más' }}
 * + />
 * ```
 */
export { HeroModern as HeroSection } from './HeroModern';
export type { HeroModernProps as HeroSectionProps } from './HeroModern';
