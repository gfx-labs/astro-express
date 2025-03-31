import { NodeApp } from "astro/app/node";
import express from "express";
import { polyfill } from "@astrojs/webapi";
import { fileURLToPath } from "url";
import { responseIterator } from "./response-interator";
polyfill(globalThis, {
    exclude: "window document",
});
const expressRoutes = 
// @ts-ignore
typeof _astroExpressRoutes != "undefined" ? _astroExpressRoutes : undefined;
/**
 *
 * @param {import('astro').SSRManifest} manifest
 * @param {ServerArgs} options
 */
export function start(manifest, options) {
    console.log("Starting server with router", expressRoutes);
    const nodeApp = new NodeApp(manifest);
    const app = express();
    const clientRoot = new URL(options.clientRelative, import.meta.url);
    const clientAssetsRoot = new URL("." + options.assetsPrefix, clientRoot + "/");
    const rootHandler = async (request, reply) => {
        const routeData = nodeApp.match(request);
        if (routeData) {
            const response = await nodeApp.render(request, { routeData });
            await writeWebResponse(nodeApp, reply, response);
        }
        else {
            reply.status(404).type("text/plain").send("Not found");
        }
    };
    const staticHandler = express.static(fileURLToPath(clientAssetsRoot), {
        //  cacheControl: true,
        //  maxAge: "31536000",
        //  immutable: true,
        fallthrough: true,
    });
    app.use(staticHandler);
    expressRoutes(app);
    // this is the fallback
    app.use(rootHandler);
    const port = Number(options.port ?? (process.env.PORT || 8080));
    app.listen({
        port,
        host: "0.0.0.0",
    }, function (err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        // Server is now listening on ${address}
    });
}
async function writeWebResponse(nodeApp, res, webResponse) {
    const { status, headers, body } = webResponse;
    // Support the Astro.cookies API.
    if (nodeApp.setCookieHeaders) {
        const setCookieHeaders = Array.from(nodeApp.setCookieHeaders(webResponse));
        if (setCookieHeaders.length) {
            res.setHeader("Set-Cookie", setCookieHeaders);
        }
    }
    headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    res.writeHead(status);
    if (body) {
        for await (const chunk of /** @type {any} */ responseIterator(body)) {
            res.write(chunk);
        }
    }
    res.end();
}
export function createExports(manifest, options) {
    return {
        start() {
            return start(manifest, options);
        },
    };
}
