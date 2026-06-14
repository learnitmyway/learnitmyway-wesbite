// Stripe webhook -> Brevo transactional email scaffold.
//
// Flow: a buyer completes a Stripe Checkout / Payment Link purchase. Stripe
// sends a `checkout.session.completed` event to this function. We verify the
// Stripe signature, then send the buyer a transactional email (via Brevo)
// containing the private link to Part 2.
//
// Required environment variables (set these in the Netlify UI):
//   STRIPE_SECRET_KEY     - Stripe secret key (sk_live_... / sk_test_...)
//   STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret (whsec_...)
//   BREVO_API_KEY         - Brevo (Sendinblue) API key
//   BREVO_SENDER_EMAIL    - verified sender address for the email
//   PART2_URL             - full URL of the hidden Part 2 article
//
// Webhook endpoint (configure in the Stripe dashboard):
//   https://learnitmyway.com/stripe-webhook
import type { Config, Context } from "@netlify/functions";
import Stripe from "stripe";

export const sendPart2Email = async (email: string | null | undefined): Promise<void> => {
  if (!email) {
    throw new Error("No customer email on the Stripe session");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL! },
      to: [{ email }],
      subject: "Your link to Part 2",
      htmlContent: `<p>Thanks for your purchase! Here is your private link to Part 2:</p>
<p><a href="${process.env.PART2_URL}">${process.env.PART2_URL}</a></p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo request failed: ${response.status}`);
  }
};

export default async (req: Request, _context: Context): Promise<Response> => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig ?? "",
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await sendPart2Email(session.customer_details?.email);
  }

  return new Response("ok", { status: 200 });
};

export const config: Config = { path: "/stripe-webhook" };
