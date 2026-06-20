// ─── Icons ────────────────────────────────────────────────────────────────────
export const Ic = ({ size = 16, d, children, ...p }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

export const IcCopy = (p) => (
  <Ic {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Ic>
);
export const IcCheck = (p) => <Ic {...p} d="M20 6 9 17l-5-5" />;
export const IcRefresh = (p) => (
  <Ic {...p}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </Ic>
);
export const IcAlert = (p) => (
  <Ic {...p}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
  </Ic>
);
export const IcChevron = (p) => <Ic {...p} d="m6 9 6 6 6-6" />;
export const IcShield = (p) => <Ic {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />;
export const IcExternal = (p) => (
  <Ic {...p}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </Ic>
);
export const IcRuler = (p) => <Ic {...p} d="M3 17l4-4 2 2 4-4 2 2 4-4" />;
