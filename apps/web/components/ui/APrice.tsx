/**
 * Tratamiento canónico de montos en ARS.
 * $ chico muted + entero serif grande + decimales mono chicos.
 * Formato: miles con punto, decimales con coma (1.234,56).
 * Negativo: entero en color-err.
 */
interface APriceProps {
  /** Monto como string NUMERIC de la base, ej. "1234.56" */
  value: string | number;
  className?: string;
}

function formatARS(raw: string | number): { integer: string; cents: string } {
  const num = typeof raw === 'string' ? parseFloat(raw) : raw;
  const abs = Math.abs(num);
  const [intPart, decPart = '00'] = abs.toFixed(2).split('.');
  const integer = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return { integer, cents: decPart };
}

export function APrice({ value, className = '' }: APriceProps) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const negative = num < 0;
  const { integer, cents } = formatARS(value);

  return (
    <span className={['inline-flex items-baseline gap-0.5', className].join(' ')}>
      <span className="font-sans text-[0.7em] text-muted leading-none">$</span>
      <span
        className={[
          'font-serif font-normal leading-none',
          negative ? 'text-err' : 'text-ink',
        ].join(' ')}
      >
        {negative ? '-' : ''}{integer}
      </span>
      <span className="font-mono text-[0.42em] text-muted leading-none">,{cents}</span>
    </span>
  );
}
