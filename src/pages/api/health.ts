import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    status: "ok",
    app: "VMS Digital Garden",
    domain: "250258.xyz",
    deployed_via: "GitHub CI/CD Test",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
