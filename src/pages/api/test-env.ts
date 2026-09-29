import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    hasEnv: typeof env !== "undefined",
    keys: env ? Object.keys(env) : [],
    hasDB: Boolean(env?.DB),
    hasEmail: Boolean(env?.EMAIL_SERVICE),
    hasAssets: Boolean(env?.ASSETS_BUCKET)
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
