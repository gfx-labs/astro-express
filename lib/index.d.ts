import type { IntegrationOptions } from './types';
import { AstroIntegration } from 'astro';
export type { IntegrationOptions, DefineExpressRoutes } from './types';
export default function (options: IntegrationOptions): AstroIntegration;
