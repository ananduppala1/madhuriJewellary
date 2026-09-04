import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Layers,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { Button, cn } from "@/components/ui";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/products", label: "Products", Icon: Package },
  { to: "/collections", label: "Collections", Icon: Layers },
  { to: "/gallery", label: "Gallery", Icon: Images },
  { to: "/site-settings", label: "Site Settings", Icon: Settings },
];

const PUBLIC_SITE = import.meta.env["VITE_PUBLIC_SITE_URL"] ?? "https://www.madhurijewellers.in";

export function AdminLayout() {
  const { admin, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close the drawer on navigation, or it stays over the new page on mobile.
  useEffect(() => setMenuOpen(false), [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const initials = (admin?.fullName ?? admin?.email ?? "A").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* Sidebar — a fixed rail on desktop, a drawer below lg. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div>
            <p className="text-[0.9375rem] font-semibold leading-tight text-white">Madhuri</p>
            <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-accent">Jewellers</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white lg:hidden"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-white"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
                )
              }
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <a
            href={PUBLIC_SITE}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white"
          >
            <ExternalLink aria-hidden className="h-4 w-4 shrink-0" />
            View website
          </a>
        </div>
      </aside>

      {/* Drawer scrim */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="rounded-md p-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Menu aria-hidden className="h-5 w-5" />
          </button>

          <p className="flex-1 truncate text-sm font-medium text-ink">
            {NAV.find((item) => pathname.startsWith(item.to))?.label ?? "Admin"}
          </p>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[0.8125rem] font-medium leading-tight text-ink">
                {admin?.fullName ?? "Administrator"}
              </p>
              <p className="text-[0.6875rem] text-ink-3">{admin?.email}</p>
            </div>
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
            >
              {initials}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} loading={signingOut}>
              <LogOut aria-hidden className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Sign out</span>
            </Button>
          </div>
        </header>

        <main id="admin-main" className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Consistent page title block used at the top of each screen. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
