
"use client";

import { useState, useEffect } from "react";
import { getAdminPocketBase } from "@/lib/admin"; // Warning: This might be server-only. 
// We should use client-side fetch or server actions. 
// The prompt example used `fetch("/api/admin/payment-settings", ...)` which implies client-side form.

export default function PaymentSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // We can load initial data via an API or just rely on the user overwriting/seeing it elsewhere.
    // Ideally we should show the current settings.
    // I'll add a fetch here.

    const [currentQr, setCurrentQr] = useState<string | null>(null);
    const [instructions, setInstructions] = useState("");

    useEffect(() => {
        fetch("/api/payment-settings") // Use public one or admin one? Public one is fine for reading.
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setCurrentQr(data.kontigoQr);
                    setInstructions(data.kontigoInstructions);
                }
            });
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        const form = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/admin/payment-settings", {
                method: "POST",
                body: form
            });

            if (res.ok) {
                setSuccess(true);
                // Refresh preview
                const data = await fetch("/api/payment-settings").then(r => r.json());
                if (data) {
                    setCurrentQr(data.kontigoQr);
                    // setInstructions(data.kontigoInstructions); // Input already updated
                }
            } else {
                alert("Error saving settings");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving settings");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-oxford">Configuración de Pagos (Kontigo)</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2 block">Código QR Actual</h3>
                    {currentQr ? (
                        <img src={currentQr} alt="QR Actual" className="w-48 rounded-lg border mb-4" />
                    ) : (
                        <p className="text-gray-400 text-sm mb-4">No hay QR configurado</p>
                    )}

                    <label className="block text-sm font-medium text-gray-700 mb-2">Subir Nuevo QR</label>
                    <input
                        type="file"
                        name="kontigoQr"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple/10 file:text-purple hover:file:bg-purple/20 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instrucciones de Pago</label>
                    <textarea
                        name="kontigoInstructions"
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                        className="w-full p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple/20 outline-none h-32"
                        placeholder="Ej: Escanea el QR y envía el comprobante..."
                    />
                </div>

                <button
                    disabled={loading}
                    className="px-6 py-2 bg-purple text-white rounded-lg font-medium hover:bg-purple-dark transition-colors disabled:opacity-50"
                >
                    {loading ? "Guardando..." : "Guardar Configuración"}
                </button>

                {success && <p className="text-green-600 font-medium">¡Configuración guardada correctamente!</p>}
            </form>
        </div>
    );
}
