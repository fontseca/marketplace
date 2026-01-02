"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from "@/lib/utils";

const phoneSchema = z.object({
  phone: z.string().refine(validatePhoneNumber, {
    message: "Número de teléfono inválido (mínimo 10 dígitos)",
  }),
});

type FormValues = z.infer<typeof phoneSchema>;

type Props = {
  currentPhone: string | null;
};

export function PhoneUpdate({ currentPhone }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: currentPhone ? formatPhoneNumber(currentPhone) : "",
    },
  });

  const phoneValue = watch("phone");

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const normalizedPhone = normalizePhoneNumber(values.phone);
      const res = await fetch("/api/user/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Error al actualizar el número de teléfono");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error al actualizar el teléfono:", error);
      setError(
        error instanceof Error ? error.message : "Error inesperado al actualizar el teléfono",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Número de teléfono</h3>
      <p className="mt-1 text-sm text-slate-600">
        Actualiza tu número de teléfono para que los compradores puedan contactarte.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div>
          <label htmlFor="phone" className="text-sm font-semibold text-slate-800">
            Número de teléfono
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder="(000) 0000 0000"
            {...register("phone", {
              onChange: (e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setValue("phone", formatted, { shouldValidate: true });
              },
            })}
            value={phoneValue}
            className="mt-1"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          {success && (
            <p className="mt-1 text-xs text-green-600">Número de teléfono actualizado correctamente</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Actualizar teléfono"}
        </Button>
      </form>
    </div>
  );
}

