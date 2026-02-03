"use client";

import { useState, useEffect } from "react";
import { Upload, Save, CheckCircle, AlertCircle, Image as ImageIcon, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function PaymentSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [currentQr, setCurrentQr] = useState<string | null>(null);
    const [instructions, setInstructions] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await apiClient.get("/settings");
                if (data) {
                    setCurrentQr(data.kontigoQR);
                    setInstructions(data.kontigoInstructions);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        };
        fetchSettings();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        const form = new FormData(e.currentTarget);

        try {
            // This hits src/app/api/admin/payment-settings/route.ts
            const res = await apiClient.post("/admin/payment-settings", form, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.status >= 200 && res.status < 300) {
                setSuccess(true);
                // Refresh preview
                const { data } = await apiClient.get("/settings");
                if (data) {
                    setCurrentQr(data.kontigoQR);
                }
                setTimeout(() => setSuccess(false), 3000);
            } else {
                alert("Error al guardar la configuración");
            }
        } catch (err) {
            console.error(err);
            alert("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-4xl font-black text-oxford tracking-tight">Métodos de Pago</h1>
                <p className="text-text-medium font-medium mt-1">Configura el código QR y las instrucciones para el método Kontigo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" /> Código QR de Recaudo
                                    </label>

                                    <div className="flex items-start gap-6">
                                        <div className="relative group">
                                            {currentQr ? (
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
                                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple/10 file:text-purple hover:file:bg-purple/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>
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

                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5" />
                            <p className="text-sm font-bold">¡Configuración actualizada con éxito!</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
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

