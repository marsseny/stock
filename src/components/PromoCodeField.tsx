import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { clearActivePromo, lookupPromo, saveActivePromo, type PromoInfo } from '../lib/promo';
import { Close, Ticket } from './Icons';

interface Props {
  /** Currently applied promo (or `null`). */
  value: PromoInfo | null;
  onChange: (promo: PromoInfo | null) => void;
  /** Remember the applied code for 15 minutes (default). The 100% test code is never remembered. */
  remember?: boolean;
}

/**
 * Low-key promo code control: a small "Have a promo code?" link that opens the input on click.
 * Nothing is ever pre-filled from the account — the buyer types the code. Works inside other forms
 * (Enter applies the code without submitting the outer form).
 */
export function PromoCodeField({ value, onChange, remember = true }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const apply = () => {
    const raw = input.trim();
    if (!raw) {
      setOpen(false);
      setError('');
      return;
    }
    const found = lookupPromo(raw);
    if (!found) {
      setError('This promo code is not valid.');
      return;
    }
    setError('');
    setOpen(false);
    setInput('');
    if (remember) saveActivePromo(found.code);
    onChange(found);
  };

  const remove = () => {
    clearActivePromo();
    onChange(null);
    setError('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      apply();
    } else if (e.key === 'Escape' && !input) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  if (value) {
    return (
      <div className="promo-chip" role="status">
        <Ticket width={14} height={14} aria-hidden />
        <span>
          <b>{value.code}</b> applied · −{value.percent}%
        </span>
        <button type="button" className="promo-chip__x" onClick={remove} aria-label={`Remove promo code ${value.code}`}>
          <Close width={12} height={12} />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="promo-toggle" onClick={() => setOpen(true)} aria-expanded={false}>
        <Ticket width={14} height={14} aria-hidden /> Have a promo code?
      </button>
    );
  }

  return (
    <div className="promo-open">
      <div className={`promo-field ${error ? 'is-invalid' : ''}`}>
        <Ticket width={16} height={16} aria-hidden />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setError('');
          }}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            // Typed a code and moved on (e.g. straight to "Continue")? Apply it — unless focus went to Apply / close.
            if (e.relatedTarget && e.currentTarget.closest('.promo-open')?.contains(e.relatedTarget)) return;
            if (input.trim()) apply();
          }}
          placeholder="Enter promo code"
          aria-label="Promo code"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          spellCheck={false}
          maxLength={24}
        />
        <button type="button" className="promo-field__btn promo-field__btn--apply" onClick={apply} disabled={!input.trim()}>
          Apply
        </button>
        <button
          type="button"
          className="promo-field__btn"
          onClick={() => {
            setOpen(false);
            setInput('');
            setError('');
          }}
          aria-label="Close promo code field"
        >
          <Close width={14} height={14} />
        </button>
      </div>
      {error && (
        <small className="promo-field__error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
