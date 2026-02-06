/* eslint-disable no-console */
// Creates the billing collections/fields in PocketBase (idempotent).
//
// Usage:
//   node scripts/setup-billing-pocketbase.js
//
// It will try to load credentials from .env.local/.env and/or the current env.
//
// Required env vars (one of each pair):
//   PB_URL | POCKETBASE_URL | NEXT_PUBLIC_POCKETBASE_URL
//   PB_ADMIN_EMAIL | POCKETBASE_ADMIN_EMAIL | POCKETBASE_ADMIN_EMAIL
//   PB_ADMIN_PASSWORD | POCKETBASE_ADMIN_PASSWORD | POCKETBASE_ADMIN_PASSWORD

const fs = require("fs");
const path = require("path");
const PocketBase = require("pocketbase/cjs");

function loadEnvFile(filepath) {
  try {
    const raw = fs.readFileSync(filepath, "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (!key) continue;

      // strip wrapping quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (_) {
    // ignore missing env files
  }
}

function getEnv(key, fallbacks = []) {
  const v = process.env[key];
  if (v) return v;
  for (const k of fallbacks) {
    if (process.env[k]) return process.env[k];
  }
  return "";
}

async function main() {
  const root = path.resolve(__dirname, "..");
  loadEnvFile(path.join(root, ".env.local"));
  loadEnvFile(path.join(root, ".env"));

  const url =
    getEnv("PB_URL", ["POCKETBASE_URL", "NEXT_PUBLIC_POCKETBASE_URL"]) ||
    "http://127.0.0.1:8090";

  const email = getEnv("PB_ADMIN_EMAIL", ["POCKETBASE_ADMIN_EMAIL", "ADMIN_EMAIL"]);
  const password = getEnv("PB_ADMIN_PASSWORD", ["POCKETBASE_ADMIN_PASSWORD", "ADMIN_PASSWORD"]);

  if (!email || !password) {
    throw new Error("Missing PocketBase admin credentials (PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD).");
  }

  console.log("[billing-setup] Connecting to:", url);
  const pb = new PocketBase(url);
  pb.autoCancellation(false);

  console.log("[billing-setup] Authenticating as admin:", email);
  await pb.admins.authWithPassword(email, password);

  // 1) Ensure billing_invoices collection exists
  let billingCollection = null;
  try {
    billingCollection = await pb.collections.getOne("billing_invoices");
  } catch (_) {
    billingCollection = null;
  }

  if (!billingCollection) {
    console.log("[billing-setup] Creating collection: billing_invoices");

    await pb.collections.create({
      name: "billing_invoices",
      type: "base",
      system: false,
      fields: [
        { id: "text_period", name: "period", type: "text", system: false, required: true, presentable: false, unique: false },
        { id: "text_currency", name: "currency", type: "text", system: false, required: true, presentable: false, unique: false },
        { id: "number_sales_usd", name: "salesUSD", type: "number", system: false, required: true, presentable: false, unique: false },
        { id: "number_fx_rate", name: "fxRate", type: "number", system: false, required: true, presentable: false, unique: false },
        { id: "number_gross_sales", name: "grossSales", type: "number", system: false, required: true, presentable: false, unique: false },
        { id: "number_fee_pct", name: "feePercent", type: "number", system: false, required: true, presentable: false, unique: false },
        { id: "number_fee_amount", name: "feeAmount", type: "number", system: false, required: true, presentable: false, unique: false },
        { id: "date_due", name: "dueDate", type: "date", system: false, required: true, presentable: false, unique: false },
        {
          id: "select_status",
          name: "status",
          type: "select",
          system: false,
          required: true,
          presentable: false,
          unique: false,
          maxSelect: 1,
          values: ["UNPAID", "PAID"],
        },
        {
          id: "select_payment_method",
          name: "paymentMethod",
          type: "select",
          system: false,
          required: false,
          presentable: false,
          unique: false,
          maxSelect: 1,
          values: ["KONTIGO", "BINANCE"],
        },
        { id: "text_kontigo_transfer_id", name: "kontigoTransferId", type: "text", system: false, required: false, presentable: false, unique: false },
        { id: "text_payment_reference", name: "paymentReference", type: "text", system: false, required: false, presentable: false, unique: false },
        { id: "text_payment_url", name: "paymentUrl", type: "text", system: false, required: false, presentable: false, unique: false },
        { id: "text_binance_tx", name: "binanceTxHash", type: "text", system: false, required: false, presentable: false, unique: false },
        {
          id: "file_payment_proof",
          name: "paymentProof",
          type: "file",
          system: false,
          required: false,
          presentable: false,
          unique: false,
          maxSelect: 1,
          maxSize: 10000000,
          mimeTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
          thumbs: [],
        },
        { id: "date_paid_at", name: "paidAt", type: "date", system: false, required: false, presentable: false, unique: false },
      ],
      indexes: ["CREATE UNIQUE INDEX `idx_billing_period` ON `billing_invoices` (`period`)"],
      listRule: "@request.auth.role = 'ADMIN'",
      viewRule: "@request.auth.role = 'ADMIN'",
      createRule: "@request.auth.role = 'ADMIN'",
      updateRule: "@request.auth.role = 'ADMIN'",
      deleteRule: "@request.auth.role = 'ADMIN'",
      options: {},
    });
  } else {
    console.log("[billing-setup] Collection already exists: billing_invoices");
  }

  // 2) Ensure orders.paymentVerifiedAt exists (optional but recommended)
  let orders = null;
  try {
    orders = await pb.collections.getOne("orders");
  } catch (_) {
    orders = null;
  }

  if (!orders) {
    console.log("[billing-setup] WARN: orders collection not found; skipped paymentVerifiedAt field setup.");
    return;
  }

  const fields = Array.isArray(orders.fields) ? orders.fields : [];
  const hasPaymentVerifiedAt = fields.some((f) => f?.name === "paymentVerifiedAt");

  if (!hasPaymentVerifiedAt) {
    console.log("[billing-setup] Adding field orders.paymentVerifiedAt");
    const nextFields = [
      ...fields,
      { id: "date_payment_verified_at", name: "paymentVerifiedAt", type: "date", system: false, required: false, presentable: false, unique: false },
    ];

    await pb.collections.update(orders.id, { fields: nextFields });
  } else {
    console.log("[billing-setup] Field already exists: orders.paymentVerifiedAt");
  }

  console.log("[billing-setup] Done.");
}

main().catch((err) => {
  console.error("[billing-setup] FAILED:", err?.message || err);
  process.exitCode = 1;
});

