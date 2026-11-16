import { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/promo';
import { Check, Copy } from './Icons';

/** Small glass button that copies `value` and shows "Copied!" for a moment. */
export function CopyButton({ value, label, className = '' }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    if (!(await copyText(value))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button type="button" className={`btn btn--glass btn--sm copy-btn ${copied ? 'is-done' : ''} ${className}`} onClick={onCopy}>
      {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}
