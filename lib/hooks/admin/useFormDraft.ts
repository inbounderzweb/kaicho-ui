"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

const STORAGE_PREFIX = "kaicho:admin-draft:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 500;

interface StoredDraft<V, X> {
  values: V;
  extra?: X;
  savedAt: number;
}

function readDraft<V, X>(key: string): StoredDraft<V, X> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft<V, X>;
    if (!parsed || typeof parsed.savedAt !== "number" || !parsed.values) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: unknown) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(draft));
  } catch {
    // Storage full / blocked (private mode) — drafts are best-effort.
  }
}

function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

/**
 * Keeps an unsaved admin form in localStorage so a refresh, a closed tab or an
 * accidental navigation doesn't lose what was typed.
 *
 * - While the form has unsaved changes, values (plus `extra` — non-form state
 *   such as picked image previews) are saved after a short debounce.
 * - When the form becomes `ready` (create: immediately; edit: once the record
 *   has loaded and the form was reset to it), a stored draft is restored on top.
 * - The caller must call `clearDraft()` after a successful save.
 *
 * `key` identifies the form instance, e.g. "category:new" or "category:<id>".
 */
export function useFormDraft<V extends FieldValues, X = undefined>({
  key,
  form,
  ready,
  extra,
  onRestoreExtra,
}: {
  key: string;
  form: UseFormReturn<V, unknown, FieldValues>;
  ready: boolean;
  extra?: X;
  onRestoreExtra?: (extra: X) => void;
}) {
  const [restoredAt, setRestoredAt] = useState<number | null>(null);

  const { isDirty } = form.formState;
  const isDirtyRef = useRef(isDirty);
  const extraRef = useRef(extra);
  const onRestoreExtraRef = useRef(onRestoreExtra);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredForKeyRef = useRef<string | null>(null);

  useEffect(() => {
    isDirtyRef.current = isDirty;
    extraRef.current = extra;
    onRestoreExtraRef.current = onRestoreExtra;
  });

  // Restore once per key, after the host has finished its own reset-to-record.
  // (Declared after the host's reset effect, so it runs after it in the same commit.)
  useEffect(() => {
    if (!ready || restoredForKeyRef.current === key) return;
    restoredForKeyRef.current = key;
    const draft = readDraft<V, X>(key);
    if (!draft) return;
    // Deferred (never cleared): some hosts reset to the loaded record inside a
    // setTimeout(…, 0), and timers fire in order, so this always lands after it.
    setTimeout(() => {
      // keepDefaultValues: the form stays dirty relative to the saved record.
      form.reset(draft.values, { keepDefaultValues: true });
      if (draft.extra !== undefined) onRestoreExtraRef.current?.(draft.extra);
      setRestoredAt(draft.savedAt);
    }, 0);
  }, [ready, key, form]);

  // Debounced autosave while the form has unsaved changes.
  useEffect(() => {
    if (!ready) return;

    const save = () => {
      timerRef.current = null;
      if (!isDirtyRef.current) return;
      writeDraft(key, { values: form.getValues(), extra: extraRef.current, savedAt: Date.now() });
    };

    const subscription = form.watch(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(save, SAVE_DELAY_MS);
    });

    return () => {
      subscription.unsubscribe();
      // Flush a pending save so navigating away right after typing keeps it.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        save();
      }
    };
  }, [ready, key, form]);

  // Explicit "Save draft": store right now, no validation, regardless of the debounce.
  const saveDraftNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const savedAt = Date.now();
    writeDraft(key, { values: form.getValues(), extra: extraRef.current, savedAt });
    return savedAt;
  }, [key, form]);

  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    removeDraft(key);
    setRestoredAt(null);
  }, [key]);

  // Dropping the draft and reloading is the one reset path that is correct for
  // every form: it re-fetches the record (edit) or blanks the form (create)
  // along with any non-form state (image previews, slug-touched flags).
  const discardDraft = useCallback(() => {
    clearDraft();
    window.location.reload();
  }, [clearDraft]);

  return { restoredAt, saveDraftNow, clearDraft, discardDraft };
}
