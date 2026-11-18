import { useId } from 'react';
import { Info } from './Icons';

/**
 * Compact "+ tax" chip next to a price. Hover / focus / tap shows a tooltip explaining that the
 * buyer's local VAT / sales tax is added at checkout. Keyboard and screen-reader friendly.
 */
export function TaxHint({ align = 'end' }: { align?: 'start' | 'end' }) {
  const id = useId();
  return (
    <span className={`tax-hint tax-hint--${align}`}>
      <button type="button" className="tax-hint__btn" aria-describedby={id} onClick={(e) => e.currentTarget.focus()}>
        + tax <Info width={12} height={12} aria-hidden />
      </button>
      <span role="tooltip" id={id} className="tax-hint__tip">
        Your country’s VAT / sales tax is added at checkout, based on your billing address.
      </span>
    </span>
  );
}
