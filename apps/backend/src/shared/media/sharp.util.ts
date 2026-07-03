import type sharp from 'sharp';

/**
 * Sharp exports a CJS function. `import sharp from 'sharp'` compiles to
 * `sharp_1.default`, which is undefined without esModuleInterop in production.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharpModule = require('sharp') as typeof sharp;

export { sharpModule as sharp };
export default sharpModule;
