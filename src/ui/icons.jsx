// 인라인 SVG 아이콘 (D-3). 24×24 격자, 선 두께 1.75, currentColor 사용.
// 장식용이면 aria-hidden, 의미가 있으면 title을 넘긴다.

function Svg({ size = 20, title, children, strokeWidth = 1.75, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export const IconClapperboard = (p) => (
  <Svg {...p}>
    <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    <path d="M4 10 3.4 6.6a1 1 0 0 1 .8-1.2l13.8-2.4a1 1 0 0 1 1.2.8L19.7 7 4 10z" />
    <path d="m8.5 4.6 2.3 3.6M13.6 3.7l2.3 3.6" />
  </Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </Svg>
);

export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.25" />
    <path d="M3 19.5a6 6 0 0 1 12 0" />
    <path d="M15.5 5.5a3.25 3.25 0 0 1 0 6.2M17.5 14a6 6 0 0 1 3.5 5.5" />
  </Svg>
);

export const IconChevronDown = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconChevronLeft = (p) => (
  <Svg {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const IconArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const IconMenu = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M10 16l-4-4 4-4M6 12h10" />
  </Svg>
);

export const IconHeart = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Svg>
);

export const IconBookmark = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />
  </Svg>
);

export const IconStar = ({ filled = true, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
  </Svg>
);

export const IconMessage = (p) => (
  <Svg {...p}>
    <path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 3.5V6a1 1 0 0 1 1-1z" />
  </Svg>
);

export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.9 6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.4 7.6A16.5 16.5 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 4.3-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M12 4 2.8 19.5a.6.6 0 0 0 .5.9h17.4a.6.6 0 0 0 .5-.9z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </Svg>
);

export const IconInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.01" />
  </Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconCheckCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.2 12.3 2.6 2.6 5-5.4" />
  </Svg>
);

export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" />
  </Svg>
);

export const IconSliders = (p) => (
  <Svg {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);

export const IconGrid = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
  </Svg>
);

export const IconFlag = (p) => (
  <Svg {...p}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </Svg>
);

export const IconFileText = (p) => (
  <Svg {...p}>
    <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
);

export const IconDatabase = (p) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </Svg>
);

export const IconSparkles = (p) => (
  <Svg {...p}>
    <path d="M10 4.5 11.6 9l4.4 1.5-4.4 1.6L10 16.5l-1.6-4.4L4 10.5 8.4 9z" />
    <path d="M17.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
  </Svg>
);

export const IconRefresh = (p) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 0 1-13.2 4.9M4.5 12A7.5 7.5 0 0 1 17.7 7.1" />
    <path d="M18 3.5v3.8h-3.8M6 20.5v-3.8h3.8" />
  </Svg>
);

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4.5 7h15M10 4h4M6.5 7l.8 12.1a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9L17.5 7" />
  </Svg>
);

export const IconShare = (p) => (
  <Svg {...p}>
    <circle cx="17" cy="5.5" r="2.5" />
    <circle cx="6.5" cy="12" r="2.5" />
    <circle cx="17" cy="18.5" r="2.5" />
    <path d="m8.7 10.7 6.1-3.9M8.7 13.3l6.1 3.9" />
  </Svg>
);

export const IconPlay = (p) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </Svg>
);

export const IconLock = (p) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconExternal = (p) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);

export const IconFilm = (p) => (
  <Svg {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
    <path d="M8 3.5v17M16 3.5v17M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4" />
  </Svg>
);

export const IconImageOff = (p) => (
  <Svg {...p}>
    <path d="M4 4l16 16" />
    <path d="M20 16V6a1 1 0 0 0-1-1H9M4 7.5V18a1 1 0 0 0 1 1h12.5" />
    <path d="m4 15 4-4 3 3M14.5 11.5 16 10l4 4" />
  </Svg>
);

export const IconCoffee = (p) => (
  <Svg {...p}>
    <path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M12 3.5v2.5" />
  </Svg>
);

export const IconHourglass = (p) => (
  <Svg {...p}>
    <path d="M7 3.5h10M7 20.5h10M8 3.5c0 4.5 8 4.5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 4.5-8 8.5" />
  </Svg>
);
