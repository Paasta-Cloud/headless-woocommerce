export default function Icon({ name, ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
    bag: <><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>,
    heart: <path d="M12 21 3 12a5.5 5.5 0 0 1 9-7 5.5 5.5 0 0 1 9 7Z"/>,
    menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
    arrow: <path d="m14 5-7 7 7 7"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    check: <><path d="m8 12 3 3 6-7"/><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/></>,
    home: <><path d="m2 11 10-9 10 9M5 9v12h14V9M9 21v-7h6v7"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    pin: <><path d="M19 9c0 6-7 13-7 13S5 15 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></>,
    order: <><path d="M5 2h14v20l-3-2-4 2-4-2-3 2V2ZM8 7h8M8 11h8M8 15h5"/></>,
  };
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.info}</svg>;
}
