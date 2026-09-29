/* Admiralty Brass Co. - customer order confirmation email
   -----------------------------------------------------------
   This is a Cloudflare Worker. Your website already sends order
   confirmations to it once you deploy this and set confirmEndpoint
   in config.js.

   SETUP (about 5 minutes):
   1. Create a free Resend account: https://resend.com (100 emails/day,
      3,000/month free - plenty for this shop). Verify your domain
      admiraltybrassco.com there (or use their onboarding@resend.dev
      test address while you set it up).
   2. Copy your Resend API key.
   3. In your Cloudflare dashboard (same account as your existing
      admiralty-checkout worker): Workers & Pages > Create > Create
      Worker. Name it e.g. "admiralty-confirm". Paste this whole file
      in, replacing the sample code.
   4. In that Worker's Settings > Variables, add a secret named
      RESEND_API_KEY with your Resend API key as the value.
   5. Deploy. Copy the Worker's URL (looks like
      https://admiralty-confirm.hk-haseeb21.workers.dev).
   6. In config.js on your website, add:
        confirmEndpoint: "https://admiralty-confirm.hk-haseeb21.workers.dev"
   That's it - customers will get a confirmation email automatically
   after they send an order request. */

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "https://admiraltybrassco.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    let body;
    try { body = await request.json(); } catch (e) { return new Response("Bad request", { status: 400, headers: cors }); }
    const { to, subject, text } = body || {};
    if (!to || !subject || !text || !/^\S+@\S+\.\S+$/.test(to)) {
      return new Response(JSON.stringify({ ok: false, error: "Missing or invalid fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Admiralty Brass Co. <orders@admiraltybrassco.com>",
          to: [to],
          subject,
          text
        })
      });
      const ok = r.ok;
      return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 502, headers: { ...cors, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: "Send failed" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
  }
};
