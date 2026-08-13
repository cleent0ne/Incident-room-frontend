'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/profile/avatar';
import {
  IconBolt,
  IconChevronDown,
  IconClock,
  IconFlame,
  IconLogout,
  IconMenu,
  IconShield,
  IconUser,
  IconXMark,
} from '@/components/ui/icons';

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={`navlink${active ? ' active' : ''}`} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the user dropdown on an outside click.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Close both menus whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    setMenuOpen(false);
    setDrawerOpen(false);
    await logout();
    router.push('/');
  }

  return (
    <header className="site-header">
      <div className="shell topbar">
        <Link className="nav-logo" href="/">
          <span className="nav-logo-mark">
            <IconBolt size={15} />
          </span>
          <span className="brand">
            Incident <b>Room</b>
          </span>
          <span className="nav-status-dot" aria-hidden="true" title="Systems nominal" />
        </Link>

        <nav className="nav-links">
          <NavLink href="/scenarios">Scenarios</NavLink>
          <NavLink href="/daily">Daily</NavLink>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              {user.currentStreak > 0 && (
                <span className="nav-streak" title={`${user.currentStreak}-day streak`}>
                  <IconFlame size={13} />
                  <span>{user.currentStreak}</span>
                </span>
              )}
              <div className="nav-user" ref={menuRef}>
                <button
                  type="button"
                  className="nav-user-trigger"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <Avatar name={user.displayName} size={26} />
                  <span className="nav-user-name">{user.displayName}</span>
                  <IconChevronDown size={13} className="nav-user-chevron" />
                </button>

                {menuOpen && (
                  <div className="nav-user-menu" role="menu">
                    <div className="nav-user-menu-header">
                      <div className="nav-user-menu-name">{user.displayName}</div>
                      <div className="nav-user-menu-email">{user.email}</div>
                    </div>
                    <Link
                      href="/profile"
                      className="nav-user-menu-item"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <IconUser size={15} />
                      Profile
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="nav-user-menu-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <IconShield size={15} />
                        Admin
                      </Link>
                    )}
                    <button type="button" className="nav-user-menu-item danger" role="menuitem" onClick={handleLogout}>
                      <IconLogout size={15} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="nav-auth-group">
              <Link className="nav-login-btn" href="/login">
                Log in
              </Link>
              <Link className="btn-primary-lime text-xs py-2 px-4 !bg-[#A3E635] !text-[#0A0A0A] font-bold" href="/register">
                <span>Get started</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={drawerOpen}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <IconXMark size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </div>

      <div className={`nav-drawer${drawerOpen ? ' open' : ''}`}>
        <NavLink href="/scenarios" onClick={() => setDrawerOpen(false)}>
          <IconBolt size={15} /> Scenarios
        </NavLink>
        <NavLink href="/daily" onClick={() => setDrawerOpen(false)}>
          <IconClock size={15} /> Daily
        </NavLink>
        {user && (
          <NavLink href="/profile" onClick={() => setDrawerOpen(false)}>
            <IconUser size={15} /> Profile
          </NavLink>
        )}
        {user?.role === 'ADMIN' && (
          <NavLink href="/admin" onClick={() => setDrawerOpen(false)}>
            <IconShield size={15} /> Admin
          </NavLink>
        )}
        {user ? (
          <div className="nav-drawer-actions">
            <button className="nav-drawer-logout" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : (
          <div className="nav-drawer-actions">
            <Link className="nav-login-btn" href="/login" onClick={() => setDrawerOpen(false)}>
              Log in
            </Link>
            <Link className="nav-register-btn" href="/register" onClick={() => setDrawerOpen(false)}>
              <span>Get started</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}