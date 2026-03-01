import type PocketBase from "pocketbase";

export type BillingConfig = {
  enabled: boolean;
  feePercent: number; // Example: 0.4 => 0.4%
  graceDays: number; // days after period end
  currency: string; // ISO code, eg: USD, COP, EUR, ARS, CLP, CAD
};

export type BillingInvoiceStatus = "UNPAID" | "PAID";

const DEFAULT_BILLING_CONFIG: BillingConfig = {
  enabled: true,
  feePercent: 0.4,
  graceDays: 10,
  currency: "USD",
};

export function getBillingConfigFromEnv(): BillingConfig {
  const enabledRaw = (process.env.BILLING_ENABLED ?? "true").toLowerCase();
  const enabled = enabledRaw !== "false" && enabledRaw !== "0";

  const feePercentRaw = Number(process.env.BILLING_FEE_PERCENT ?? DEFAULT_BILLING_CONFIG.feePercent);
  const feePercent = Number.isFinite(feePercentRaw) ? feePercentRaw : DEFAULT_BILLING_CONFIG.feePercent;

  const graceDaysRaw = Number(process.env.BILLING_GRACE_DAYS ?? DEFAULT_BILLING_CONFIG.graceDays);
  const graceDays = Number.isFinite(graceDaysRaw) ? graceDaysRaw : DEFAULT_BILLING_CONFIG.graceDays;

  const currency = String(process.env.BILLING_CURRENCY ?? DEFAULT_BILLING_CONFIG.currency).toUpperCase().trim();

  return {
    enabled,
    feePercent: Math.max(0, feePercent),
    graceDays: Math.max(0, Math.floor(graceDays)),
    currency: currency || DEFAULT_BILLING_CONFIG.currency,
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatPeriodUTC(date: Date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function getPeriodRangeUTC(period: string) {
  const [yRaw, mRaw] = String(period).split("-");
  const year = Number(yRaw);
  const month = Number(mRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error(`Invalid billing period: ${period}`);
  }
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return {
    start,
    end,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

export function addDaysUTC(date: Date, days: number) {
  const ms = Math.max(0, Math.floor(days)) * 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + ms);
}

export function getInvoiceDueDateUTC(period: string, graceDays: number) {
  const { end } = getPeriodRangeUTC(period);
  return addDaysUTC(end, graceDays);
}

function getCurrencyDecimals(currency: string) {
  // For most currencies we keep 2 decimals.
  // Some "peso-like" currencies are commonly represented without cents in practice.
  const code = String(currency || "").toUpperCase();
  if (code === "COP" || code === "CLP" || code === "ARS" || code === "VES") return 0;
  return 2;
}

export function roundMoney(amount: number, currency: string) {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  return Math.round((Number(amount) || 0) * factor) / factor;
}

export async function getActiveUsdFxRate(pb: PocketBase, targetCurrency: string) {
  const code = String(targetCurrency || "").toUpperCase();
  if (!code || code === "USD") return 1;

  // Preferred: explicit USD -> targetCurrency active pair.
  try {
    const r = await pb
      .collection("exchange_rates")
      .getFirstListItem(`baseCurrency="USD" && targetCurrency="${code}" && active=true`);
    const rate = Number((r as any)?.rate ?? 0);
    if (Number.isFinite(rate) && rate > 0) return rate;
  } catch (_) {
    // ignore and fallback
  }

  // Fallback: legacy deployments sometimes only store targetCurrency + active.
  const legacy = await pb
    .collection("exchange_rates")
    .getFirstListItem(`targetCurrency="${code}" && active=true`)
    .catch(() => null);
  const legacyRate = Number((legacy as any)?.rate ?? 0);
  if (Number.isFinite(legacyRate) && legacyRate > 0) return legacyRate;

  // Fallback: older schema uses from/to without an active flag.
  const pair = await pb
    .collection("exchange_rates")
    .getFirstListItem(`from="USD" && to="${code}"`)
    .catch(() => null);
  const pairRate = Number((pair as any)?.rate ?? 0);
  if (Number.isFinite(pairRate) && pairRate > 0) return pairRate;

  const legacyToOnly = await pb
    .collection("exchange_rates")
    .getFirstListItem(`to="${code}"`)
    .catch(() => null);
  const legacyToRate = Number((legacyToOnly as any)?.rate ?? 0);
  if (Number.isFinite(legacyToRate) && legacyToRate > 0) return legacyToRate;

  throw new Error(`Missing active exchange rate USD -> ${code}`);
}

export async function computeVerifiedSalesUSDForPeriod(pb: PocketBase, period: string) {
  const { startISO, endISO } = getPeriodRangeUTC(period);
  // Billing is based on verified sales. We also exclude cancelled orders to avoid charging for refunds/cancellations.
  const baseFilter = `paymentStatus="VERIFIED" && status != "CANCELLED"`;

  // Best effort: use paymentVerifiedAt if present (we set it when payment is approved).
  try {
    const orders = await pb.collection("orders").getFullList({
      filter: `${baseFilter} && paymentVerifiedAt >= "${startISO}" && paymentVerifiedAt < "${endISO}"`,
      fields: "id,totalUSD",
    });
    const total = orders.reduce((sum: number, o: any) => sum + Number(o?.totalUSD || 0), 0);
    return { totalUSD: total, used: "paymentVerifiedAt" as const };
  } catch (_) {
    // Fallback: group by created date if the field doesn't exist yet.
    const orders = await pb.collection("orders").getFullList({
      filter: `${baseFilter} && created >= "${startISO}" && created < "${endISO}"`,
      fields: "id,totalUSD",
    });
    const total = orders.reduce((sum: number, o: any) => sum + Number(o?.totalUSD || 0), 0);
    return { totalUSD: total, used: "created" as const };
  }
}

export async function computeBillingAmountsForPeriod(pb: PocketBase, period: string, config: BillingConfig) {
  const { totalUSD, used } = await computeVerifiedSalesUSDForPeriod(pb, period);
  const fxRate = await getActiveUsdFxRate(pb, config.currency);
  const grossSalesRaw = (Number(totalUSD) || 0) * fxRate;
  const feeRaw = grossSalesRaw * (Math.max(0, config.feePercent) / 100);

  return {
    period,
    usedDateField: used,
    salesUSD: Number(totalUSD) || 0,
    currency: config.currency,
    fxRate,
    grossSales: roundMoney(grossSalesRaw, config.currency),
    feePercent: config.feePercent,
    feeAmount: roundMoney(feeRaw, config.currency),
  };
}

export async function upsertMonthlyInvoice(pb: PocketBase, period: string, config: BillingConfig) {
  // If collection doesn't exist, don't break the store.
  try {
    await pb.collection("billing_invoices").getList(1, 1);
  } catch (_) {
    return { invoice: null as any, warning: "missing_collection" as const, fxWarning: null as string | null };
  }

  let amounts: Awaited<ReturnType<typeof computeBillingAmountsForPeriod>>;
  let fxWarning: string | null = null;
  try {
    amounts = await computeBillingAmountsForPeriod(pb, period, config);
  } catch (err: any) {
    const msg = String(err?.message || "");
    const requested = String(config.currency || "").toUpperCase();
    const isFxIssue = msg.toLowerCase().includes("missing active exchange rate");

    if (!isFxIssue || requested === "USD") {
      throw err;
    }

    // Fallback: if the store didn't configure FX for the requested currency yet,
    // bill in USD so we don't break sales/billing.
    fxWarning = `missing_fx_rate_usd_to_${requested}`;
    amounts = await computeBillingAmountsForPeriod(pb, period, { ...config, currency: "USD" });
  }

  // No sales => no invoice needed.
  if (!Number.isFinite(amounts.salesUSD) || amounts.salesUSD <= 0 || amounts.feeAmount <= 0) {
    return { invoice: null as any, warning: "no_sales" as const, amounts, fxWarning };
  }

  let existing: any = null;
  try {
    existing = await pb.collection("billing_invoices").getFirstListItem(`period="${period}"`);
  } catch (_) {
    existing = null;
  }

  const dueDate = getInvoiceDueDateUTC(period, config.graceDays).toISOString();

  const payload: any = {
    period,
    currency: amounts.currency,
    salesUSD: amounts.salesUSD,
    fxRate: amounts.fxRate,
    grossSales: amounts.grossSales,
    feePercent: amounts.feePercent,
    feeAmount: amounts.feeAmount,
    dueDate,
    status: (existing?.status as BillingInvoiceStatus) || ("UNPAID" as BillingInvoiceStatus),
  };

  if (!existing) {
    const created = await pb.collection("billing_invoices").create(payload);
    return { invoice: created, warning: null as any, amounts, fxWarning };
  }

  // If it's already paid, don't mutate historical values.
  if (String(existing.status).toUpperCase() === "PAID") {
    return { invoice: existing, warning: null as any, amounts, fxWarning };
  }

  const updated = await pb.collection("billing_invoices").update(existing.id, payload);
  return { invoice: updated, warning: null as any, amounts, fxWarning };
}

export async function getBillingOverview(pb: PocketBase, config: BillingConfig, now = new Date()) {
  const currentPeriod = formatPeriodUTC(now);

  // previous period (UTC)
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
  const previousPeriod = formatPeriodUTC(prevMonthStart);

  let current: Awaited<ReturnType<typeof computeBillingAmountsForPeriod>>;
  let currentFxWarning: string | null = null;
  try {
    current = await computeBillingAmountsForPeriod(pb, currentPeriod, config);
  } catch (err: any) {
    const msg = String(err?.message || "");
    const requested = String(config.currency || "").toUpperCase();
    const isFxIssue = msg.toLowerCase().includes("missing active exchange rate");

    if (!isFxIssue || requested === "USD") {
      throw err;
    }

    currentFxWarning = `missing_fx_rate_usd_to_${requested}`;
    current = await computeBillingAmountsForPeriod(pb, currentPeriod, { ...config, currency: "USD" });
  }

  // Only upsert the previous invoice once the grace window could matter.
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const graceEndsAt = addDaysUTC(currentMonthStart, config.graceDays);

  const prevInvoiceResult = await upsertMonthlyInvoice(pb, previousPeriod, config);
  const previousInvoice = prevInvoiceResult.invoice;

  const dueDate = previousInvoice?.dueDate
    ? new Date(previousInvoice.dueDate)
    : getInvoiceDueDateUTC(previousPeriod, config.graceDays);

  const isPaid = previousInvoice && String(previousInvoice.status).toUpperCase() === "PAID";
  const isOverdue = !isPaid && now.getTime() >= dueDate.getTime() && now.getTime() >= graceEndsAt.getTime();

  return {
    config,
    now: now.toISOString(),
    current,
    previous: {
      period: previousPeriod,
      invoice: previousInvoice || null,
      dueDate: dueDate.toISOString(),
    },
    blocked: !!(config.enabled && isOverdue && previousInvoice && Number(previousInvoice.feeAmount || 0) > 0),
    meta: {
      usedDateField: {
        current: current.usedDateField,
        previous: prevInvoiceResult.amounts?.usedDateField,
      },
      warnings: [prevInvoiceResult.warning, prevInvoiceResult.fxWarning, currentFxWarning].filter(Boolean),
    },
  };
}
