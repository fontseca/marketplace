"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from "@/lib/utils";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and formatting characters
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      // Format as user types
      const formatted = formatPhoneNumber(digits);
      setPhone(formatted);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalized = normalizePhoneNumber(phone);
    if (!validatePhoneNumber(normalized)) {
      setError("Por favor ingresa un número de teléfono válido (mínimo 10 dígitos)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar el número de teléfono");
      }

      // Redirect to dashboard after successful submission
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al guardar el número de teléfono");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Completa tu perfil</h1>
        <p className="mt-2 text-sm text-slate-600">
          Necesitamos tu número de teléfono para contactarte cuando compres productos.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
              Número de teléfono
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(000) 0000 0000"
              maxLength={17} // (000) 0000 0000 = 17 chars
              className="mt-1"
              required
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

