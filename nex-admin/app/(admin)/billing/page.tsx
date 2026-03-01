"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";

type BillingOverview = {
  config?: {
    enabled?: boolean;
    feePercent?: number;
    graceDays?: number;
    currency?: string;
  };
  blocked?: boolean;
  current?: {
    period?: string;
    grossSales?: number;
    feeAmount?: number;
    currency?: string;
  };
  previous?: {
    period?: string;
    dueDate?: string;
    invoice?: any | null;
  };
  paymentMethods?: {
    kontigo?: { enabled?: boolean };
    binance?: { enabled?: boolean; address?: string; qrUrl?: string; instructions?: string };
  };
  meta?: {
    usedDateField?: {
      current?: string;
      previous?: string;
    };
    warnings?: string[];
  };
};

function formatMoney(amount: number, currency: string) {
  const code = String(currency || "").toUpperCase() || "USD";
  const decimals = code === "COP" || code === "CLP" || code === "ARS" || code === "VES" ? 0 : 2;
  const safe = Number(amount || 0);
  const formatted = safe.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ${code}`;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kontigoLoading, setKontigoLoading] = useState(false);
  const [binanceLoading, setBinanceLoading] = useState(false);
  const [binanceTxHash, setBinanceTxHash] = useState("");
  const [binanceProof, setBinanceProof] = useState<File | null>(null);

  const invoice = data?.previous?.invoice;
  const invoiceCurrency = String(invoice?.currency || data?.config?.currency || "USD").toUpperCase();
  const invoiceAmount = Number(invoice?.feeAmount || 0);

  const dueDateLabel = useMemo(() => {
    const raw = data?.previous?.dueDate || invoice?.dueDate;
    if (!raw) return "N/A";
    try {
      return new Date(raw).toLocaleDateString();
    } catch {
      return "N/A";
    }
  }, [data?.previous?.dueDate, invoice?.dueDate]);

  const fetchBilling = async () => {
    try {
      const res = await apiClient.get("/admin/billing");
      setData(res.data);
    } catch (err) {
      console.error("Error loading billing", err);
      setData(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchBilling();
      setLoading(false);
    })();
  }, []);

  const canPay = !!invoice && invoiceAmount > 0 && String(invoice?.status || "").toUpperCase() !== "PAID";

  const kontigoEnabled = data?.paymentMethods?.kontigo?.enabled !== false;
  const binanceEnabled = data?.paymentMethods?.binance?.enabled !== false;

  const handleKontigo = async () => {
    if (!invoice?.id) return;
    setKontigoLoading(true);
    try {
      const res = await apiClient.post(`/admin/billing/invoices/${invoice.id}/kontigo`);
      const url = res.data?.paymentUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        alert("No se pudo generar el enlace de pago.");
      }
      await fetchBilling();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Error al crear el pago Kontigo");
    } finally {
      setKontigoLoading(false);
    }
  };

  const handleBinance = async () => {
    if (!invoice?.id) return;
    const hash = binanceTxHash.trim();
    if (!hash) return alert("Ingresa el hash de la transacción.");

    setBinanceLoading(true);
    try {
      const form = new FormData();
      form.append("binanceTxHash", hash);
      if (binanceProof) form.append("paymentProof", binanceProof);

      await apiClient.post(`/admin/billing/invoices/${invoice.id}/binance`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBinanceTxHash("");
      setBinanceProof(null);
      await fetchBilling();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Error al reportar pago Binance");
    } finally {
      setBinanceLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-oxford tracking-tight">Suscripción NexCommerce</h1>
          <p className="text-text-medium font-medium mt-1">
            Comisión automática del <span className="font-black text-oxford">{data?.config?.feePercent ?? 0.4}%</span> sobre ventas verificadas del mes (sin envío).
          </p>
        </div>

        <button
          onClick={async () => {
            setRefreshing(true);
            await fetchBilling();
            setRefreshing(false);
          }}
          className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          disabled={loading || refreshing}
          aria-label="Recargar"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {data?.blocked ? (
        <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="font-black text-red-900">Cuenta bloqueada</p>
            <p className="text-sm text-red-800 font-medium">
              Debes pagar la comisión del período <span className="font-black">{data?.previous?.period}</span> para continuar vendiendo.
            </p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="py-28 flex flex-col items-center justify-center text-gray-400 gap-4">
          <Loader2 className="w-12 h-12 animate-spin opacity-20" />
          <p className="font-bold uppercase tracking-widest text-xs">Cargando suscripción...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Month */}
          <div className="bg-white border border-gray-100 rounded-[35px] shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mes en curso</p>
                <p className="text-xl font-black text-oxford">{data?.current?.period || "N/A"}</p>
              </div>
              <div className="w-12 h-12 bg-purple/10 rounded-2xl flex items-center justify-center text-purple">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Ventas verificadas</span>
                <span className="text-sm font-black text-oxford">
                  {formatMoney(Number(data?.current?.grossSales || 0), String(data?.current?.currency || data?.config?.currency || "USD"))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Comisión estimada</span>
                <span className="text-sm font-black text-purple">
                  {formatMoney(Number(data?.current?.feeAmount || 0), String(data?.current?.currency || data?.config?.currency || "USD"))}
                </span>
              </div>
            </div>

            {data?.meta?.usedDateField?.current ? (
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Cálculo por: {data.meta.usedDateField.current}
              </p>
            ) : null}
          </div>

          {/* Previous Invoice */}
          <div className="bg-white border border-gray-100 rounded-[35px] shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Factura del mes anterior</p>
                <p className="text-xl font-black text-oxford">{data?.previous?.period || "N/A"}</p>
              </div>

              {String(invoice?.status || "").toUpperCase() === "PAID" ? (
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 rounded-2xl text-xs font-black">
                  <CheckCircle className="w-4 h-4" /> Pagado
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-100 px-4 py-2 rounded-2xl text-xs font-black">
                  <AlertCircle className="w-4 h-4" /> Pendiente
                </div>
              )}
            </div>

            {!invoice ? (
              <p className="text-sm text-gray-500 font-medium">
                No hay ventas verificadas en el período anterior (o la colección de facturación aún no está configurada).
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">Monto</span>
                  <span className="text-sm font-black text-oxford">{formatMoney(invoiceAmount, invoiceCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">Vence</span>
                  <span className="text-sm font-black text-oxford">{dueDateLabel}</span>
                </div>

                {data?.meta?.usedDateField?.previous ? (
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Cálculo por: {data.meta.usedDateField.previous}
                  </p>
                ) : null}
              </div>
            )}

            {canPay ? (
              <div className="pt-4 border-t border-gray-50 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pagar ahora</p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleKontigo}
                    disabled={!kontigoEnabled || kontigoLoading}
                    className="bg-purple text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-purple/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {kontigoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    Pagar con Kontigo
                  </button>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Binance</p>
                    {data?.paymentMethods?.binance?.qrUrl ? (
                      <img
                        src={data.paymentMethods.binance.qrUrl}
                        alt="QR Binance"
                        className="w-full max-w-[240px] rounded-2xl border border-gray-100 bg-white"
                      />
                    ) : null}

                    {data?.paymentMethods?.binance?.address ? (
                      <p className="text-xs text-gray-600 font-bold break-all">
                        Dirección: <span className="text-oxford">{data.paymentMethods.binance.address}</span>
                      </p>
                    ) : null}

                    {data?.paymentMethods?.binance?.instructions ? (
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        {data.paymentMethods.binance.instructions}
                      </p>
                    ) : null}

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={binanceTxHash}
                        onChange={(e) => setBinanceTxHash(e.target.value)}
                        placeholder="Hash / TxID"
                        className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-oxford outline-none focus:ring-2 focus:ring-purple/20"
                        disabled={!binanceEnabled || binanceLoading}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBinanceProof(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-500"
                        disabled={!binanceEnabled || binanceLoading}
                      />
                    </div>

                    <button
                      onClick={handleBinance}
                      disabled={!binanceEnabled || binanceLoading}
                      className="w-full bg-oxford text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-navy transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {binanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Registrar pago Binance
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="bg-purple/5 p-6 rounded-[30px] border border-purple/10 space-y-2">
        <p className="text-xs font-black text-oxford uppercase tracking-widest">Reglas</p>
        <p className="text-sm text-gray-600 font-medium leading-relaxed">
          Se toman en cuenta ventas efectivas: órdenes con <span className="font-black text-oxford">paymentStatus = VERIFIED</span> o ya{" "}
          <span className="font-black text-oxford">ENTREGADAS</span> (excepto rechazadas/canceladas). El envío no se incluye en el cálculo.
          Si la factura del mes anterior no se paga luego de{" "}
          <span className="font-black text-oxford">{data?.config?.graceDays ?? 10}</span> días de gracia, se bloquea la creación de nuevas órdenes.
        </p>
      </div>
    </div>
  );
}
