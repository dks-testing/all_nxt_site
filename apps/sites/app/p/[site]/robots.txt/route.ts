export const dynamic = "force-dynamic";
export const GET = () => new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
