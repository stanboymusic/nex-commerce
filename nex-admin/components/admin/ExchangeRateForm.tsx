"use client";
import { useState } from "react";
import axios from "axios";

export default function ExchangeRateForm() {
  const [rate, setRate] = useState("");

  const submit = async () => {
    await axios.post("/api/admin/exchange-rate", {
      baseCurrency: "USD",
      targetCurrency: "COP",
      rate: Number(rate),
    });
    alert("Tasa actualizada");
  };

  return (
    <div>
      <h3>Tasa USD → COP</h3>
      <input value={rate} onChange={e => setRate(e.target.value)} />
      <button onClick={submit}>Guardar</button>
    </div>
  );
}