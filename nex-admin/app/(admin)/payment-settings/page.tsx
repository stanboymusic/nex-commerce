"use client";

import { useState, useEffect } from "react";
import { Upload, Save, CheckCircle, AlertCircle, Image as ImageIcon, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAdminStore } from "@/store/admin.store";

export default function PaymentSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [currentQr, setCurrentQr] = useState<string | null>(null);
    const [instructions, setInstructions] = useState("");
    const [kontigoActive, setKontigoActive] = useState(true);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [binanceQr, setBinanceQr] = useState<string | null>(null);
    const [binanceInstructions, setBinanceInstructions] = useState("");
    const [binanceActive, setBinanceActive] = useState(true);
    const [binanceQrPreview, setBinanceQrPreview] = useState<string | null>(null);
    const [binanceQrFile, setBinanceQrFile] = useState<File | null>(null);
    const [vipDiscountPercent, setVipDiscountPercent] = useState<number>(0);
    const [vipEnabled, setVipEnabled] = useState(true);
    const token = useAdminStore((s) => s.token);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nex-users.vercel.app/api";
    const allowedMimeTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/svg+xml",
        "image/gif",
        "image/webp"
    ]);
    const mimeByExt: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        svg: "image/svg+xml",
        gif: "image/gif",
        webp: "image/webp"
    };
    const normalizeImageFile = (file: File) => {
        if (allowedMimeTypes.has(file.type)) return file;
        const parts = file.name.split(".");
        const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
        const inferred = mimeByExt[ext];
        if (inferred && allowedMimeTypes.has(inferred)) {
            return new File([file], file.name, { type: inferred });
        }
        return null;
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await apiClient.get("/settings");
                if (data) {
                    setCurrentQr(data.kontigoQR);
                    setInstructions(data.kontigoInstructions);
                    setKontigoActive(data.kontigoActive !== false);
                    setBinanceQr(data.binanceQR);
                    setBinanceInstructions(data.binanceInstructions || "");
                    setBinanceActive(data.binanceActive !== false);
                    setVipDiscountPercent(Number(data.vipDiscountPercent ?? 0));
                    setVipEnabled(data.vipEnabled !== false);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        };
        fetchSettings();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>, method: "KONTIGO" | "BINANCE") {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        const form = new FormData();
        form.set("method", method);

        if (method === "KONTIGO") {
            form.set("kontigoInstructions", instructions);
            form.set("kontigoActive", String(kontigoActive));
            if (qrFile) {
                const normalized = normalizeImageFile(qrFile);
                if (!normalized) {
                    alert("QR inválido. Usa JPG, PNG, SVG, GIF o WebP.");
                    setLoading(false);
                    return;
                }
                form.set("kontigoQr", normalized);
            }
        } else {
            form.set("binanceInstructions", binanceInstructions);
            form.set("binanceActive", String(binanceActive));
            if (binanceQrFile) {
                const normalized = normalizeImageFile(binanceQrFile);
                if (!normalized) {
                    alert("QR inválido. Usa JPG, PNG, SVG, GIF o WebP.");
                    setLoading(false);
                    return;
                }
                form.set("binanceQr", normalized);
            }
        }

        try {
            // This hits src/app/api/admin/payment-settings/route.ts
            const res = await fetch(`${API_URL}/admin/payment-settings`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: form
            });

            if (res.ok) {
                setSuccess(true);
                // Refresh preview
                const { data } = await apiClient.get("/settings");
                if (data) {
                    setCurrentQr(data.kontigoQR);
                    setBinanceQr(data.binanceQR);
                    setKontigoActive(data.kontigoActive !== false);
                    setBinanceActive(data.binanceActive !== false);
                }
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await res.json().catch(() => null);
                alert(data?.error || "Error al guardar la configuración");
            }
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.error || "Error al conectar con el servidor";
            alert(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleVipSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const res = await fetch(`${API_URL}/admin/store-settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    vipDiscountPercent: Number(vipDiscountPercent) || 0,
                    vipEnabled
                })
            });

            if (res.ok) {
                setSuccess(true);
                const { data } = await apiClient.get("/settings");
                if (data) {
                    setVipDiscountPercent(Number(data.vipDiscountPercent ?? 0));
                    setVipEnabled(data.vipEnabled !== false);
                }
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await res.json().catch(() => null);
                alert(data?.error || "Error al guardar el descuento VIP");
            }
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.error || "Error al conectar con el servidor";
            alert(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-4xl font-black text-oxford tracking-tight">Métodos de Pago</h1>
                <p className="text-text-medium font-medium mt-1">Configura el código QR y las instrucciones para Kontigo y Binance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <form onSubmit={(e) => handleSubmit(e, "KONTIGO")} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" /> Código QR de Recaudo
                                    </label>

                                    <div className="flex items-start gap-6">
                                        <div className="relative group">
                                            {qrPreview ? (
                                                <div className="w-48 h-48 border-2 border-dashed border-purple-200 rounded-2xl overflow-hidden flex items-center justify-center bg-purple/5">
                                                    <img src={qrPreview} alt="QR preview" className="w-full h-full object-contain p-2" />
                                                </div>
                                            ) : currentQr ? (
                                                <div className="w-48 h-48 border-2 border-dashed border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                                                    <img src={currentQr} alt="QR" className="w-full h-full object-contain p-2" />
                                                </div>
                                            ) : (
                                                <div className="w-48 h-48 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-400">
                                                    <div className="text-center">
                                                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                        <span className="text-[10px] font-bold uppercase">Sin QR</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <p className="text-xs text-gray-500 leading-relaxed italic">
                                                * Sube una imagen clara de tu QR de Kontigo. El cliente la verá durante el proceso de pago para realizar la transferencia.
                                            </p>
                                            <input
                                                type="file"
                                                name="kontigoQr"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    if (!file) {
                                                        setQrFile(null);
                                                        setQrPreview(null);
                                                        return;
                                                    }
                                                    const normalized = normalizeImageFile(file);
                                                    if (!normalized) {
                                                        alert("QR inválido. Usa JPG, PNG, SVG, GIF o WebP.");
                                                        return;
                                                    }
                                                    setQrFile(normalized);
                                                    setQrPreview(URL.createObjectURL(normalized));
                                                }}
                                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple/10 file:text-purple hover:file:bg-purple/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                                        <input
                                            type="checkbox"
                                            checked={kontigoActive}
                                            onChange={(e) => setKontigoActive(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-purple focus:ring-purple"
                                        />
                                        Kontigo activo
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Instrucciones de Pago</label>
                                    <textarea
                                        name="kontigoInstructions"
                                        value={instructions}
                                        onChange={e => setInstructions(e.target.value)}
                                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-purple/10 focus:border-purple transition-all h-40 text-sm leading-relaxed"
                                        placeholder="Ej: Escanea el QR, realiza el pago y envía el comprobante con tu número de orden..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Configuración de Pasarela Manual</p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-oxford text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-oxford/10"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {loading ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <form onSubmit={(e) => handleSubmit(e, "BINANCE")} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" /> Código QR de Binance Pay
                                    </label>

                                    <div className="flex items-start gap-6">
                                        <div className="relative group">
                                            {binanceQrPreview ? (
                                                <div className="w-48 h-48 border-2 border-dashed border-emerald-200 rounded-2xl overflow-hidden flex items-center justify-center bg-emerald/5">
                                                    <img src={binanceQrPreview} alt="QR preview" className="w-full h-full object-contain p-2" />
                                                </div>
                                            ) : binanceQr ? (
                                                <div className="w-48 h-48 border-2 border-dashed border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                                                    <img src={binanceQr} alt="QR" className="w-full h-full object-contain p-2" />
                                                </div>
                                            ) : (
                                                <div className="w-48 h-48 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-400">
                                                    <div className="text-center">
                                                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                        <span className="text-[10px] font-bold uppercase">Sin QR</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <p className="text-xs text-gray-500 leading-relaxed italic">
                                                * Sube una imagen clara de tu QR de Binance Pay. El cliente la verá durante el pago y reportará el comprobante.
                                            </p>
                                            <input
                                                type="file"
                                                name="binanceQr"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    if (!file) {
                                                        setBinanceQrFile(null);
                                                        setBinanceQrPreview(null);
                                                        return;
                                                    }
                                                    const normalized = normalizeImageFile(file);
                                                    if (!normalized) {
                                                        alert("QR inválido. Usa JPG, PNG, SVG, GIF o WebP.");
                                                        return;
                                                    }
                                                    setBinanceQrFile(normalized);
                                                    setBinanceQrPreview(URL.createObjectURL(normalized));
                                                }}
                                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                                        <input
                                            type="checkbox"
                                            checked={binanceActive}
                                            onChange={(e) => setBinanceActive(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        Binance activo
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Instrucciones de Pago</label>
                                    <textarea
                                        name="binanceInstructions"
                                        value={binanceInstructions}
                                        onChange={e => setBinanceInstructions(e.target.value)}
                                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald transition-all h-40 text-sm leading-relaxed"
                                        placeholder="Ej: Escanea el QR con Binance, paga con USDT y reporta el comprobante..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Configuración de Pasarela Manual</p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-oxford text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-oxford/10"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {loading ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5" />
                            <p className="text-sm font-bold">¡Configuración actualizada con éxito!</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <form onSubmit={handleVipSubmit} className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-oxford tracking-tight">Clientes VIP</h2>
                                <p className="text-text-medium text-sm mt-1">
                                    Define el descuento global que se aplicará automáticamente a todos los clientes marcados como VIP.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                                    <input
                                        type="checkbox"
                                        checked={vipEnabled}
                                        onChange={(e) => setVipEnabled(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-purple focus:ring-purple"
                                    />
                                    Descuento VIP activo
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                                        Porcentaje de descuento
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="90"
                                        value={vipDiscountPercent}
                                        onChange={(e) => setVipDiscountPercent(Number(e.target.value))}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-purple/10 focus:border-purple transition-all text-sm font-bold text-oxford"
                                        placeholder="Ej: 30"
                                    />
                                </div>
                                <div className="text-xs text-gray-500 leading-relaxed">
                                    El descuento se aplica en catálogo, carrito y checkout. Se guarda en la orden para auditoría.
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Configuración VIP</p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-oxford text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-oxford/10"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {loading ? "Guardando..." : "Guardar VIP"}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                        <div className="flex items-center gap-2 text-amber-800 font-bold mb-3 uppercase text-xs tracking-widest">
                            <AlertCircle className="w-4 h-4" />
                            Importante
                        </div>
                        <p className="text-xs text-amber-900/70 leading-relaxed font-semibold">
                            Cualquier cambio en el QR o las instrucciones se aplicará instantáneamente a todos los nuevos procesos de checkout.
                            Asegúrate de que la información sea correcta para evitar retrasos en el procesamiento de pagos.
                        </p>
                    </div>

                    <div className="bg-purple/5 p-6 rounded-3xl border border-purple/10">
                        <h4 className="text-sm font-bold text-oxford mb-2">Ayuda</h4>
                        <ul className="text-[11px] text-gray-500 space-y-2 list-disc pl-4">
                            <li>Usa imágenes cuadradas para el QR (PNG/JPG).</li>
                            <li>Sé claro en las instrucciones (puedes incluir números de cuenta alternativos).</li>
                            <li>La información guardada se usa como respaldo para el método de pago 'Kontigo'.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

