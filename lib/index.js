import { relative } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
const isWindows = process.platform === 'win32';
const serverFile = fileURLToPath(new URL("./server.js", import.meta.url));
// @ts-ignore
const serverPath = isWindows ? serverFile.replaceAll("\\", "//") : serverFile;
function entryToPath(entry) {
    if (typeof entry !== 'string') {
        return fileURLToPath(entry);
    }
    return entry;
}
function vitePlugin(options) {
    return {
        name: '@gfxlabs/astro-express:vite',
        async configureServer(server) {
            const app = express();
            if (options?.entry) {
                const entry = entryToPath(options.entry);
                const entryModule = await server.ssrLoadModule(entry);
                const setupRoutes = entryModule.default;
                if (typeof setupRoutes !== 'function') {
                    throw new Error(`@gfxlabs/astro-express: ${entry} should export a default function.`);
                }
                console.log(`@gfxlabs/astro-express: setup routes from ${entry}`);
                setupRoutes(app);
            }
            server.middlewares.use(app);
        },
        transform(code, id) {
            if (options?.entry &&
                (id.includes('@gfxlabs/astro-express/lib/server.js') ||
                    id.includes('gfx-labs/astro-express/lib/server.js'))) {
                let entry = entryToPath(options.entry);
                let outCode = `import _astroExpressRoutes from "${entry}";\n${code}`;
                return outCode;
            }
            return;
        }
    };
}
export default function (options) {
    let args = /** @type {any} */ ({});
    args.port = options.port;
    let config;
    return {
        name: '@gfxlabs/astro-express',
        hooks: {
            'astro:config:setup'({ updateConfig }) {
                const config = {
                    build: {
                        assets: 'assets'
                    },
                    vite: {
                        plugins: [vitePlugin(options)]
                    }
                };
                updateConfig(config);
            },
            'astro:config:done'({ config: _config, setAdapter }) {
                config = _config;
                console.log("setting adapter", serverPath);
                setAdapter({
                    name: '@gfxlabs/astro-express:adapter',
                    serverEntrypoint: serverPath,
                    exports: ['start'],
                    args: args,
                    supportedAstroFeatures: {
                        serverOutput: 'stable',
                        i18nDomains: 'experimental',
                        sharpImageService: "stable",
                        staticOutput: 'stable',
                        hybridOutput: 'stable',
                    }
                });
            },
            'astro:build:setup'({ vite, target }) {
                args.assetsPrefix = '/assets/';
                if (target === 'client') {
                    const outputOptions = vite?.build?.rollupOptions?.output;
                    if (outputOptions && !Array.isArray(outputOptions)) {
                        Object.assign(outputOptions, {
                            entryFileNames: 'assets/[name].[hash].js',
                            chunkFileNames: 'assets/chunks/[name].[hash].js'
                        });
                    }
                }
            },
            'astro:build:start'(
            // ...buildStartArgs
            ) {
                let bc;
                bc = config?.build;
                if (bc) {
                    args.clientRelative = relative(fileURLToPath(bc.server), fileURLToPath(bc.client));
                }
            }
        }
    };
}
