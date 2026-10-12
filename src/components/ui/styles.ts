export const labelCls = "text-sm font-medium text-on-surface block mb-1.5";

export const inputCls =
    "w-full h-10 px-3 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed";

export const textareaCls =
    "w-full px-3 py-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y";

const btnBase =
    "h-10 px-5 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5";

export const btnPrimary = `${btnBase} bg-primary-container text-on-primary hover:bg-primary shadow-sm`;

export const btnSecondary = `${btnBase} bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-low`;

export const btnDanger = `${btnBase} bg-error text-on-error hover:opacity-90 shadow-sm`;

export const alertErrorCls = "bg-error-container text-on-error-container text-sm px-3 py-2 rounded-lg";