# GCash payment integration guide

The current checkout experience simulates a GCash collection flow entirely on the client so you can demonstrate the cart UX without storing real payment credentials in the repository. To collect live payments you need to connect the app to the official GCash Pay API (or an aggregator such as PayMongo/Xendit) through a secure server component.

## Prerequisites

1. **GCash developer onboarding** – Register a merchant account with GCash or an approved payment gateway partner. Once approved you will receive a production `public_key`, `secret_key`, webhook signing secret, and access to a sandbox environment for testing.
2. **Server-side runtime** – Provision a serverless function (Vercel, Netlify, Supabase Edge Functions, etc.) or a traditional server where you can safely store the GCash secret key and call the Pay API. Never expose the secret key to the browser.
3. **Domain + HTTPS** – Configure your deployment URL so you can register allowed callback URLs inside the GCash console.

## Suggested environment variables

Copy `.env.example` to `.env.local` (or set the values in your hosting provider) and populate the following variables once you have your credentials:

```
# Frontend uses this endpoint to start a payment session
VITE_GCASH_CHECKOUT_ENDPOINT="/api/gcash/create-payment"

# Used only by the backend function
GCASH_PUBLIC_KEY="gcash_pk_live_xxx"
GCASH_SECRET_KEY="gcash_sk_live_xxx"
GCASH_WEBHOOK_SECRET="whsec_xxx"
GCASH_RETURN_URL="https://yourdomain.com/checkout/complete"
```

The `VITE_GCASH_CHECKOUT_ENDPOINT` remains public because it only points to your server route; the sensitive keys must stay on the server.

## Backend flow

1. **Create a payment source** – When the cart modal submits, send the cart total, customer email, and return URL to your serverless function.
2. **Call the Pay API** – Inside the function, authenticate with the `GCASH_SECRET_KEY` and create a GCash source (or payment intent) for the PHP amount.
3. **Return the next action** – Send the payment URL or checkout reference back to the client. Update the modal to redirect the shopper to the GCash approval page or show the QR code data returned by the API.
4. **Handle webhooks** – Configure a webhook endpoint that receives `paid`/`failed` events from GCash. Verify the signature with `GCASH_WEBHOOK_SECRET` and fulfil the order (e.g., email download links, mark the order as paid in Supabase).

Below is a minimal Vercel Edge Function outline:

```ts
// api/gcash/create-payment.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { amount, email, reference } = req.body || {};
  if (!amount || !email) return res.status(400).json({ error: "Missing checkout fields" });

  const payload = {
    data: {
      attributes: {
        amount: Math.round(amount * 100),
        currency: "PHP",
        type: "gcash",
        redirect: {
          success: process.env.GCASH_RETURN_URL,
          failed: process.env.GCASH_RETURN_URL,
        },
        billing: {
          email,
        },
        reference_number: reference,
      },
    },
  };

  const response = await fetch("https://api.paymongo.com/v1/sources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(process.env.GCASH_SECRET_KEY + ":").toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return res.status(400).json({ error: error.errors?.[0]?.detail || "Unable to create payment" });
  }

  const json = await response.json();
  return res.status(200).json({
    checkoutUrl: json.data?.attributes?.redirect?.checkout_url,
    sourceId: json.data?.id,
  });
}
```

## Frontend updates

1. Replace the simulated `setTimeout` in `src/App.jsx` with a `fetch` call to `VITE_GCASH_CHECKOUT_ENDPOINT`.
2. If the endpoint returns a `checkoutUrl`, redirect the browser or open it in a new tab so the buyer can authorise the GCash payment.
3. Show status messaging based on the API response (e.g., display validation errors, handle network failures).
4. Optionally poll your backend (or Supabase) to confirm when the payment succeeds before unlocking the downloads.

## What to provide to the developer

* Access to your GCash developer console or payment gateway dashboard so the API keys/webhook secret can be generated.
* The domain(s) where the app will run so redirect URLs can be whitelisted.
* A preferred fulfilment method (automated email, Supabase record update, manual review) so the webhook handler can implement the correct logic.

Once these pieces are in place the checkout modal can initiate real GCash payments while keeping sensitive credentials on the server.
