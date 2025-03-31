// @ts-check
import { defineConfig } from 'astro/config';

import astroExpress from '@gfxlabs/astro-express';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: astroExpress({
    entry: new URL('./server/index.ts', import.meta.url),
  }),

  integrations: [react()]
});