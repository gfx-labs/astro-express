import type { SSRManifest } from "astro";
import type { ServerArgs } from "./types";
/**
 *
 * @param {import('astro').SSRManifest} manifest
 * @param {ServerArgs} options
 */
export declare function start(manifest: SSRManifest, options: ServerArgs): void;
export declare function createExports(manifest: any, options: any): {
    start(): void;
};
