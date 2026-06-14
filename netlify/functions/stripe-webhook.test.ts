import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@netlify/functions";

const constructEventAsync = vi.fn();

vi.mock("stripe", () => ({
  default: class Stripe {
    webhooks = { constructEventAsync };
  },
}));

import handler, { sendPart2Email } from "./stripe-webhook.mts";

const makeRequest = (body = "{}") =>
  new Request("https://example.com/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": "sig" },
    body,
  });

const context = {} as Context;

beforeEach(() => {
  vi.restoreAllMocks();
  constructEventAsync.mockReset();
  process.env.STRIPE_SECRET_KEY = "sk_test";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.BREVO_API_KEY = "brevo_key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
  process.env.PART2_URL = "https://learnitmyway.com/example-series-part-2-7f3a9c1e8b4d2a";
});

describe("stripe-webhook handler", () => {
  it("returns 400 and does not email on an invalid signature", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    constructEventAsync.mockRejectedValue(new Error("bad signature"));

    const res = await handler(makeRequest(), context);

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("emails the buyer and returns 200 on checkout.session.completed", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }));
    constructEventAsync.mockResolvedValue({
      type: "checkout.session.completed",
      data: { object: { customer_details: { email: "buyer@example.com" } } },
    });

    const res = await handler(makeRequest(), context);

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((init?.headers as Record<string, string>)["api-key"]).toBe("brevo_key");
    const payload = JSON.parse(init?.body as string);
    expect(payload.to[0].email).toBe("buyer@example.com");
    expect(payload.htmlContent).toContain(process.env.PART2_URL);
  });

  it("returns 200 without emailing for unrelated event types", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    constructEventAsync.mockResolvedValue({
      type: "payment_intent.created",
      data: { object: {} },
    });

    const res = await handler(makeRequest(), context);

    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("sendPart2Email", () => {
  it("throws when there is no customer email", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(sendPart2Email(null)).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
