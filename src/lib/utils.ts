import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | bigint, locale?: string) {
  const value = typeof amount === "bigint" ? Number(amount) : Number(amount ?? 0);
  // Use en-US locale for USD to ensure periods are used for decimals (not commas)
  // This follows the standard USD formatting convention
  const formatLocale = locale || "en-US";
  return new Intl.NumberFormat(formatLocale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getAppUrl() {
  // On the client side, use the actual browser URL
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // On the server side, use environment variable or Vercel URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getCdnUrl(key?: string | null) {
  if (!key) return null;
  const base = process.env.AWS_CDN_URL ?? "";
  return `${base}/${key}`;
}

export function getWeekLabel(date = new Date()) {
  const first = new Date(date);
  const currentDay = first.getDay();
  const diff = first.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday
  const weekStart = new Date(first.setDate(diff));
  const year = weekStart.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const number = Math.ceil(((weekStart.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(number).padStart(2, "0")}`;
}

export function getWhatsappLink(phone: string, text: string) {
  const url = new URL("https://wa.me/" + phone.replace(/\D/g, ""));
  url.searchParams.set("text", text);
  return url.toString();
}

export function buildShareUrl(path: string) {
  // Always prefer client-side origin when available (for client components)
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
  }
  // Fallback to getAppUrl for server-side rendering
  const base = getAppUrl();
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Formats a phone number as (000) 0000 0000
 * @param phone - Phone number string (digits only or with formatting)
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
}

/**
 * Normalizes a phone number to digits only
 * @param phone - Phone number string (with or without formatting)
 * @returns Phone number with only digits
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Validates a phone number (must be at least 10 digits)
 * @param phone - Phone number string
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  const digits = normalizePhoneNumber(phone);
  return digits.length >= 10;
}

