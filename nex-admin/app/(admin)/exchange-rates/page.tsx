'use client'

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/apiClient';
import { RefreshCw, Save, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

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
            const response = await apiClient.get('/exchange-rates');
            setRates(response.data || []);
        } catch (err: any) {
            console.error("Error fetching rates:", err);
            setError("No se pudieron cargar las tasas de cambio. Verifique que el endpoint existe.");
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
            await apiClient.patch(`/exchange-rates/${rate.id}`, {
                rate: rate.rate
            });
            // Update last updated locally or refetch
            setRates(prev => prev.map(r => r.id === rate.id ? { ...r, updated: new Date().toISOString() } : r));
        } catch (err: any) {
            console.error("Error saving rate:", err);
            alert("Error al guardar la tasa de cambio");
        } finally {
            setSaving(null);
        }
    };

    const handleCreateDefault = async () => {
        setLoading(true);
        try {
            // Logic to create USD to COP and USD to VES if they don't exist
            await apiClient.post('/exchange-rates', { from: 'USD', to: 'COP', rate: 4000 });
            await apiClient.post('/exchange-rates', { from: 'USD', to: 'VES', rate: 40 });
            fetchRates();
        } catch (err) {
            console.error("Error creating defaults:", err);
            alert("Error al crear tasas predeterminadas");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-oxford tracking-tight">Tasas de Cambio</h1>
                    <p className="text-text-medium font-medium mt-1">Configura las conversiones de moneda para los pagos locales.</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchRates} 
                    disabled={loading}
                    leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
                >
                    Actualizar
                </Button>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-error/5 border border-error/20 rounded-2xl flex items-center gap-4 text-error">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-bold">{error}</p>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={handleCreateDefault}>
                        Inicializar Tasas
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading && rates.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-light">
                        <Loader2 className="h-10 w-10 animate-spin mb-4 text-purple" />
                        <p className="font-medium">Cargando tasas de cambio...</p>
                    </div>
                ) : rates.length === 0 ? (
                    <div className="col-span-full py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center px-6">
                        <TrendingUp className="h-12 w-12 text-text-light mb-4" />
                        <h3 className="text-xl font-bold text-oxford">Sin Tasas Configuradas</h3>
                        <p className="text-text-medium max-w-xs mt-2 mb-6">No hay tasas de cambio registradas. Crea las conversiones básicas para USD, COP y VES.</p>
                        <Button onClick={handleCreateDefault}>Configuración Inicial (USD/COP/VES)</Button>
                    </div>
                ) : (
                    rates.map((rate) => (
                        <Card key={rate.id} className="hover:shadow-lg transition-all border border-border">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2">
                                    <Badge variant="neutral" className="text-lg font-black px-3 py-1">{rate.from}</Badge>
                                    <span className="text-text-light font-bold">→</span>
                                    <Badge variant="info" className="text-lg font-black px-3 py-1">{rate.to}</Badge>
                                </div>
                                <Badge variant="success">ACTIVO</Badge>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-text-medium uppercase tracking-widest mb-2 block">
                                        Tasa de Cambio (1 {rate.from} = X {rate.to})
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light font-bold">$</div>
                                        <Input 
                                            type="number" 
                                            value={rate.rate} 
                                            onChange={(e) => handleRateChange(rate.id, e.target.value)}
                                            className="pl-8 text-xl font-black text-oxford"
                                            placeholder="0.00"
                                            step="any"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <p className="text-[10px] text-text-light font-medium uppercase">
                                        Última actualización: {new Date(rate.updated).toLocaleString()}
                                    </p>
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleSave(rate)}
                                        isLoading={saving === rate.id}
                                        leftIcon={<Save className="h-4 w-4" />}
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
            
            <div className="mt-12 p-6 bg-purple/5 border border-purple/10 rounded-3xl">
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center text-purple flex-shrink-0">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-oxford">Nota de Monedas</h4>
                        <p className="text-sm text-text-medium mt-1">
                            El sistema utiliza estas tasas para calcular los montos totales en la moneda seleccionada por el cliente durante el checkout. 
                            Asegúrate de mantenerlas actualizadas para evitar discrepancias en los cobros.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
