import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Wrap async save actions with a minimum spinner duration and consistent toasts.
 * - Shows spinner for at least minDurationMs (default 3000ms)
 * - Fires success toast on resolve and error toast on reject (product-page style)
 */
export function useSavingAction({
  successMessage = 'Saved successfully!',
  errorLabel = 'saving',
  minDurationMs = 3000,
} = {}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const runWithSaving = useCallback(async (action) => {
    const startedAt = Date.now();
    setSaving(true);
    try {
      const result = await action();
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minDurationMs - elapsed);
      setTimeout(() => {
        setSaving(false);
        toast.success(successMessage);
      }, remaining);
      return result;
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minDurationMs - elapsed);
      setTimeout(() => {
        setSaving(false);
        const errMsg = err?.message || `Error ${errorLabel}`;
        toast.error(`Error ${errorLabel}: ${errMsg}\n\nPlease check contact 0786023858 for assistance.`);
      }, remaining);
      throw err;
    }
  }, [toast, successMessage, errorLabel, minDurationMs]);

  return { saving, runWithSaving };
}

export default useSavingAction;
