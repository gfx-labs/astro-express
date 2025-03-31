import type { IntegrationOptions } from './types';
import { AstroIntegration } from 'astro';
export type { IntegrationOptions, DefineExpressRoutes } from './types';
/**
* @param {IntegrationOptions} options
* @returns {import('astro').AstroIntegration}
*/
export default function (options: IntegrationOptions): AstroIntegration;
