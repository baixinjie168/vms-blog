import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async () => {
  const isProd = process.env.NODE_ENV === "production";
  return new Response(JSON.stringify({ success: true, message: "已安全登出" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `vms_session=; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=0`
    }
  });
};
