/**
 * Cloudflare Worker as a proxy for Stripe.
 *
 * It uses a hardcoded Stripe API key from the environment variables.
 * It also validates a security header to protect the endpoint.
 *
 * Required bindings in wrangler.toml:
 * [vars]
 * STRIPE_API_KEY = "sk_..."
 * SECURITY_HEADER_NAME = "X-Custom-Auth"
 * SECURITY_HEADER_VALUE = "your-secret-value"
 */
export interface Env {
	STRIPE_API_KEY: string;
	SECURITY_HEADER_NAME: string;
	SECURITY_HEADER_VALUE: string;
}

const STRIPE_BASE = "https://api.stripe.com";

function buildUpstreamRequest(req: Request, url: string, auth: string): Request {
	const headers = new Headers(req.headers);
	headers.set("Authorization", auth);
	headers.delete("host");
	headers.delete("content-length");
	return new Request(url, {
		method: req.method,
		headers,
		body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
		redirect: "follow",
	});
}

function cors(res: Response): Response {
	const h = new Headers(res.headers);
	h.set("access-control-allow-origin", "*");
	h.set("access-control-expose-headers", "*");
	return new Response(res.body, { ...res, headers: h });
}

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		// CORS preflight
		if (req.method === "OPTIONS") {
			const allowedHeaders = ["Content-Type", "Authorization", "Stripe-Version"];
			const requestedHeaders = req.headers.get("access-control-request-headers")?.toLowerCase() || "";

			if (env.SECURITY_HEADER_NAME && requestedHeaders.includes(env.SECURITY_HEADER_NAME.toLowerCase())) {
				allowedHeaders.push(env.SECURITY_HEADER_NAME);
			}

			return new Response(null, {
				status: 200,
				headers: {
					"access-control-allow-origin": "*",
					"access-control-allow-headers": allowedHeaders.join(", "),
					"access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
				},
			});
		}

		if (!env.STRIPE_API_KEY) {
			return cors(new Response("STRIPE_API_KEY not configured", { status: 500 }));
		}

		if (!env.STRIPE_API_KEY.startsWith("rk_")) {
			return cors(new Response("STRIPE_API_KEY must be a restricted key.", { status: 500 }));
		}

		if (env.SECURITY_HEADER_NAME && env.SECURITY_HEADER_VALUE) {
			const headerName = env.SECURITY_HEADER_NAME.toLowerCase();
			const headerValue = req.headers.get(headerName);
			if (headerValue !== env.SECURITY_HEADER_VALUE) {
				return cors(new Response("Unauthorized", { status: 401 }));
			}
		}

		const url = new URL(req.url);
		const targetUrl = `${STRIPE_BASE}${url.pathname}${url.search}`;
		const upstreamReq = buildUpstreamRequest(req, targetUrl, `Bearer ${env.STRIPE_API_KEY}`);
		const upstreamRes = await fetch(upstreamReq);
		return cors(new Response(upstreamRes.body, upstreamRes));
	},
};
