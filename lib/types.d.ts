import type { Router } from 'express';
export type ServerArgs = {
    clientRelative: string;
    assetsPrefix: string;
    port: number | undefined;
    verbose?: boolean;
};
export type DefineExpressRoutes = (express: Router) => void;
export type IntegrationOptions = {
    /**
     * The entrypoint to where your express routes are defined
     */
    entry: string | URL;
    /**
     * The port to use in __production__. In development mode express runs
     * on the Vite server.
     *
     * By default @gfxlabs/astro-express uses process.env.PORT which most hosts will
     * define, and you don't need to set this. If you do set this option it will override
     * any host variables.
     */
    port?: number;
    verbose?: boolean;
};
