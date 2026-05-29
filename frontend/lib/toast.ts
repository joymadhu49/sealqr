"use client";

export type ToastKind = "success" | "error" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  desc?: string;
}

let toasts: Toast[] = [];
let seq = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const toastStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  get(): Toast[] {
    return toasts;
  },
  push(kind: ToastKind, title: string, desc?: string) {
    const id = seq++;
    toasts = [...toasts, { id, kind, title, desc }];
    emit();
    setTimeout(() => toastStore.dismiss(id), 4200);
    return id;
  },
  dismiss(id: number) {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
};

export const toast = {
  success: (t: string, d?: string) => toastStore.push("success", t, d),
  error: (t: string, d?: string) => toastStore.push("error", t, d),
  info: (t: string, d?: string) => toastStore.push("info", t, d),
};
