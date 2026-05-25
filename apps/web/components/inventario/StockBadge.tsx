import { APill } from '@/components/ui';

interface StockBadgeProps {
  stockActual: number;
  stockMinimo: number;
}

export function StockBadge({ stockActual, stockMinimo }: StockBadgeProps) {
  if (stockActual === 0) return <APill tone="err">Sin stock</APill>;
  if (stockActual <= stockMinimo) return <APill tone="warn">Stock bajo</APill>;
  return <APill tone="ok">OK</APill>;
}
