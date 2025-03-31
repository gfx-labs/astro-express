import type { SSRManifest} from "astro"
import type { DefineExpressRoutes, ServerArgs } from "./types";
import { NodeApp } from "astro/app/node";
import express, { RequestHandler} from "express";

import { polyfill } from "@astrojs/webapi";
import { fileURLToPath } from "url";
import { responseIterator } from "./response-interator";
import { ServerResponse } from "http";

polyfill(globalThis, {
  exclude: "window document",
});

const expressRoutes: DefineExpressRoutes=
  // @ts-ignore
  typeof _astroExpressRoutes != "undefined" ? _astroExpressRoutes : undefined;



/**
 *
 * @param {import('astro').SSRManifest} manifest
 * @param {ServerArgs} options
 */
export function start(manifest: SSRManifest, options: ServerArgs) {

  if(options.verbose !== false) {
    console.log("Starting server with router", expressRoutes);
  }
  const nodeApp = new NodeApp(manifest);

  const app = express();

  const clientRoot = new URL(options.clientRelative, import.meta.url);
  const clientAssetsRoot = new URL(
    "." + options.assetsPrefix,
    clientRoot + "/",
  );
  const rootHandler: RequestHandler = async (request , reply) => {
    const routeData = nodeApp.match(request);
    if (routeData) {
      const response = await nodeApp.render(request, { routeData });

      await writeWebResponse(nodeApp, reply, response);
    } else {
      reply.status(404).type("text/plain").send("Not found");
    }
  };

  const staticHandler = express.static(fileURLToPath(clientAssetsRoot), {
    fallthrough: true,
  })

  app.use(
    options.assetsPrefix,
    (req, res, next) => {
      // dont cache .html files
      if(!req.url.includes(".html") || options.cacheHtml) {
        res.setHeader("Cache-Control", "max-age=31536000,immutable");
      }
      next();
    },
    staticHandler,
  );
  app.use(staticHandler)

  app.use(async (req, res) => {
    const response = await nodeApp.render(req, { locals: (req as any).locals || {} });
    await writeWebResponse(nodeApp, res, response);
  });

  expressRoutes(app)
  // this is the fallback
  app.use(rootHandler);

  const port = process.env.PORT ?? Number(options.port ?? (process.env.PORT || 8080));
  const host = options.host ?? (process.env.HOST || "0.0.0.0");
  app.listen(
    {
      port,
      host,
    },
    function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      // Server is now listening on ${address}
      if(options.verbose !== false) {
        console.log(`Server is listening on http://0.0.0.0:${port}`);
      }
    },
  );
}

async function writeWebResponse(nodeApp: NodeApp, res: ServerResponse, webResponse: Response) {
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

export function createExports(manifest:any, options:any) {
  return {
    start() {
      return start(manifest, options);
    },
  };
}
