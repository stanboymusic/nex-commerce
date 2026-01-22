'use client'

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { RefreshCw, Save, TrendingUp, AlertCircle, Loader2, Plus, ArrowRight } from "lucide-react";

interface ExchangeRate {
    id: string;
    from: string;
    to: string;
    rate: number;
    updated: string;
}


export default function ExchangeRatesPage() {
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRates = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/admin/exchange-rates');
            setRates(response.data || []);
        } catch (err: any) {
            console.error("Error fetching rates:", err);
            setError("No se pudieron cargar las tasas de cambio.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const handleRateChange = (id: string, newRate: string) => {
        const rateValue = parseFloat(newRate);
        setRates(prev => prev.map(r => r.id === id ? { ...r, rate: isNaN(rateValue) ? 0 : rateValue } : r));
    };

    const handleSave = async (rate: ExchangeRate) => {
        setSaving(rate.id);
        try {
            // Updated to match backend PATCH /exchange-rates/[id]
            await apiClient.patch(`/exchange-rates/${rate.id}`, {
                rate: rate.rate
            });
            setRates(prev => prev.map(r => r.id === rate.id ? { ...r, updated: new Date().toISOString() } : r));
        } catch (err: any) {
            console.error("Error saving rate:", err);
            alert("Error al guardar la tasa");
        } finally {
            setSaving(null);
        }
    };

    const handleCreateDefault = async () => {
        setLoading(true);
        try {
            await apiClient.post('/admin/exchange-rates', { from: 'USD', to: 'COP', rate: 4000 });
            fetchRates();
        } catch (err) {
            console.error(err);
            alert("Error al inicializar");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl space-y-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-oxford tracking-tight">Tasas de Cambio</h1>
                    <p className="text-text-medium font-medium mt-1">Controla la conversión de divisas aplicada a las órdenes globales.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchRates}
                        disabled={loading}
                        className="p-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-gray-500 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {rates.length === 0 && (
                        <button
                            onClick={handleCreateDefault}
                            className="flex items-center gap-2 bg-purple text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-purple-dark transition-all shadow-lg shadow-purple/10"
                        >
                            <Plus className="w-4 h-4" />
                            Inicializar COP
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-700 font-bold text-sm">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading && rates.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">Sincronizando divisas...</p>
                    </div>
                ) : rates.length === 0 ? (
                    <div className="col-span-full py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-6">
                        <TrendingUp className="h-16 w-16 text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-oxford">Sin Tasas Activas</h3>
                        <p className="text-gray-500 max-w-xs mt-2 mb-8 text-sm font-medium">No se han configurado conversiones. El checkout usará una tasa base de 4,000 COP por defecto.</p>
                        <button
                            onClick={handleCreateDefault}
                            className="bg-oxford text-white px-10 py-4 rounded-3xl font-black hover:bg-navy transition-all shadow-2xl shadow-oxford/20"
                        >
                            Configurar Tasa COP
                        </button>
                    </div>
                ) : (
                    rates.map((rate) => (
                        <div key={rate.id} className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 group hover:border-purple/20 transition-all hover:shadow-xl hover:shadow-purple/5">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-50 px-4 py-2 rounded-xl font-black text-oxford text-sm border border-gray-100">
                                        {rate.from}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple transition-colors" />
                                    <div className="bg-purple/10 px-4 py-2 rounded-xl font-black text-purple text-sm border border-purple/5">
                                        {rate.to}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activo</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                        Tasa de Mercado (1 {rate.from} = X {rate.to})
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xl">$</div>
                                        <input
                                            type="number"
                                            value={rate.rate}
                                            onChange={(e) => handleRateChange(rate.id, e.target.value)}
                                            className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-purple/5 focus:border-purple transition-all text-2xl font-black text-oxford"
                                            placeholder="0.00"
                                            step="any"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-300 uppercase underline decoration-purple/20">Última Actualización</span>
                                        <span className="text-[11px] font-bold text-gray-500">{new Date(rate.updated).toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => handleSave(rate)}
                                        disabled={saving === rate.id}
                                        className="bg-oxford text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-navy transition-all active:scale-95 shadow-lg shadow-oxford/10 disabled:opacity-50"
                                    >
                                        {saving === rate.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Actualizar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-purple/5 p-8 rounded-[40px] border border-purple/10 flex gap-6 items-center">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-purple shadow-sm border border-purple/5 shrink-0">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="font-black text-oxford text-lg leading-tight mb-1">Impacto Global</h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">
                        Estas tasas determinan el precio final que ven tus clientes. Un cambio aquí afecta a todas las órdenes nuevas
                        y cálculos de conversión en tiempo real. Los pedidos ya creados mantienen la tasa del momento de la compra.
                    </p>
                </div>
            </div>
        </div>
    );
}

