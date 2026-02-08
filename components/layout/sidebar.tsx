'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api/client';

interface SidebarProps {
  username?: string;
}

export function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: '/', icon: 'home', label: 'Home' },
    { href: '/search', icon: 'search', label: 'Search' },
    { href: '/create', icon: 'create', label: 'Create' },
    { href: '/activity', icon: 'heart', label: 'Activity' },
    { href: username ? `/profile/${username}` : '/profile', icon: 'profile', label: 'Profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/profile/')) return pathname.startsWith('/profile/');
    return pathname.startsWith(href);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    await api.signOut();
    router.push('/login');
    router.refresh();
  };

  const iconClass = 'h-6 w-6 shrink-0';
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-neutral-800/80 bg-black">
      <div className="flex h-full flex-col px-3 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-900/80"
        >
          <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-xl font-bold text-white">clario</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-neutral-900/80 text-white'
                  : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-white'
              }`}
              aria-label={item.label}
            >
              {item.icon === 'home' && (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
              {item.icon === 'search' && (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {item.icon === 'create' && (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
              {item.icon === 'heart' && (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {item.icon === 'profile' && (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Menu at bottom */}
        <div className="relative mt-2" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${
              showMenu
                ? 'bg-neutral-900/80 text-white'
                : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-white'
            }`}
            aria-label="Menu"
          >
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>More</span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full min-w-[200px] rounded-xl border border-neutral-800 bg-neutral-950 py-1 shadow-xl">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
