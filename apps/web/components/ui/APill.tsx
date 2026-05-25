type Tone = 'neutral' | 'ok' | 'warn' | 'err' | 'accent';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-paper-deep text-ink-soft',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  err: 'bg-err-soft text-err',
  accent: 'bg-accent-soft text-accent-deep',
};

interface APillProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export function APill({ tone = 'neutral', children, className = '' }: APillProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-[2px]',
        'font-sans text-xs font-medium',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
