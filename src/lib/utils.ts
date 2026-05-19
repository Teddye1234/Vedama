import { PlotSize } from '../types';

const PLOT_MULTIPLIERS: Record<PlotSize, number> = {
  '50x100': 1,
  '100x100': 2,
  'quarter_acre': 2,
  'half_acre': 4,
  'full_acre': 8,
  'multi_acre': 8,
};

const PLOT_LABELS: Record<PlotSize, string> = {
  '50x100': '50×100 Plot',
  '100x100': '100×100 Plot',
  'quarter_acre': 'Quarter Acre (2 plots)',
  'half_acre': 'Half Acre (4 plots)',
  'full_acre': 'Full Acre (8 plots)',
  'multi_acre': 'Multi-Acre',
};

export function calculatePrice(basePrice: number, size: PlotSize, customPlots = 1): number {
  if (size === 'multi_acre') return basePrice * 8 * customPlots;
  return basePrice * PLOT_MULTIPLIERS[size];
}

export function getPlotLabel(size: PlotSize): string {
  return PLOT_LABELS[size];
}

export function generateReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900) + 100;
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `VDM-${year}-${seq}${rand}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-KE').format(n);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function getCompletionPct(sold: number, total: number): number {
  return Math.round((sold / total) * 100);
}

export function calculateCommission(amount: number, rate = 0.20): { landlordShare: number; commission: number } {
  const commission = amount * rate;
  return { landlordShare: amount - commission, commission };
}
