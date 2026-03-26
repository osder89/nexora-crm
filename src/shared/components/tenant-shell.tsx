"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";

import { useCurrentPath } from "@/hooks/use-current-path";
import { clearSessionActivityState } from "@/services/auth/session-activity.client";

export type TenantNavIcon =
  | "dashboard"
  | "customers"
  | "products"
  | "purchases"
  | "suppliers"
  | "purchase_orders"
  | "receipts"
  | "sales"
  | "receivables"
  | "users"
  | "settings";

export type TenantNavLink = {
  href: string;
  label: string;
  icon: TenantNavIcon;
};

export type TenantNavGroup = {
  key: string;
  label: string;
  icon: "purchases";
  children: TenantNavLink[];
};

export type TenantNavItem = TenantNavLink | TenantNavGroup;

type TenantShellProps = {
  children: React.ReactNode;
  tenantName: string;
  role: "ADMIN_EMPRESA" | "VENDEDOR";
  email: string;
  links: TenantNavItem[];
};

export function TenantShell({ children, tenantName, role, email, links }: TenantShellProps) {
  const pathname = useCurrentPath();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const shellPadding = useMemo(() => (collapsed ? "md:pl-20" : "md:pl-72"), [collapsed]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_40%)]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-cyan-900/30 bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950 text-slate-100 shadow-2xl transition-all duration-300 md:flex md:flex-col ${
          collapsed ? "md:w-20" : "md:w-72"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          pathname={pathname}
          tenantName={tenantName}
          role={role}
          email={email}
          links={links}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-cyan-900/30 bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950 text-slate-100 shadow-2xl transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          collapsed={false}
          pathname={pathname}
          tenantName={tenantName}
          role={role}
          email={email}
          links={links}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </aside>

      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${shellPadding}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Abrir menu"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
              >
                <MenuIcon />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">MiniCRM - BOB</p>
                <p className="text-sm text-slate-600">Panel de empresa</p>
              </div>
            </div>

            <div className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-xs shadow-sm md:block">
              <p className="font-semibold text-slate-900">{email}</p>
              <p className="text-slate-500">{role}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  collapsed: boolean;
  pathname: string;
  tenantName: string;
  role: "ADMIN_EMPRESA" | "VENDEDOR";
  email: string;
  links: TenantNavItem[];
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
};

function SidebarContent({
  collapsed,
  pathname,
  tenantName,
  role,
  email,
  links,
  onToggleCollapse,
  onCloseMobile,
}: SidebarContentProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function isLinkActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isGroupActive(group: TenantNavGroup) {
    return group.children.some((child) => isLinkActive(child.href));
  }

  function isGroupOpen(group: TenantNavGroup) {
    if (collapsed) {
      return false;
    }

    if (group.key in openGroups) {
      return openGroups[group.key];
    }

    return isGroupActive(group);
  }

  function toggleGroup(groupKey: string) {
    setOpenGroups((current) => ({
      ...current,
      [groupKey]: !(current[groupKey] ?? true),
    }));
  }

  return (
    <>
      <div className={`border-b border-cyan-900/40 px-4 py-4 ${collapsed ? "text-center" : ""}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/90 text-sm font-bold text-slate-900 shadow-lg">MC</div>
            {!collapsed ? (
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Tenant</p>
                <p className="max-w-[155px] truncate text-sm font-semibold text-white">{tenantName}</p>
              </div>
            ) : null}
          </div>

          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden rounded-lg border border-cyan-700/50 bg-slate-800/70 p-2 text-cyan-100 hover:bg-slate-700 md:inline-flex"
              title={collapsed ? "Expandir menu" : "Colapsar menu"}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>
          ) : null}
        </div>

        {!collapsed ? (
          <div className="mt-3 rounded-lg border border-cyan-900/50 bg-slate-800/55 px-3 py-2 text-xs">
            <p className="truncate text-cyan-100">{email}</p>
            <p className="mt-0.5 text-cyan-300">{role}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((item) => {
          if (isNavGroup(item)) {
            const groupActive = isGroupActive(item);
            const groupOpen = isGroupOpen(item);

            return (
              <div key={item.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    groupActive
                      ? "bg-cyan-400/20 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,.45)]"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <span className={`${groupActive ? "text-cyan-300" : "text-slate-400 group-hover:text-cyan-300"}`}>
                    <NavIcon icon={item.icon} />
                  </span>
                  {!collapsed ? (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className="text-slate-300">{groupOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}</span>
                    </>
                  ) : null}
                </button>

                {!collapsed && groupOpen ? (
                  <div className="space-y-1 pl-8">
                    {item.children.map((child) => {
                      const childActive = isLinkActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onCloseMobile}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                            childActive
                              ? "bg-cyan-500/20 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,.45)]"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          }`}
                        >
                          <span className={`${childActive ? "text-cyan-300" : "text-slate-500 group-hover:text-cyan-300"}`}>
                            <NavIcon icon={child.icon} />
                          </span>
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          const isActive = isLinkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-cyan-400/20 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,.45)]"
                  : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className={`${isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-cyan-300"}`}>
                <NavIcon icon={item.icon} />
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-cyan-900/40 p-3">
        <button
          type="button"
          onClick={() => {
            clearSessionActivityState();
            void signOut({ callbackUrl: "/login" });
          }}
          className={`flex w-full items-center gap-3 rounded-xl border border-cyan-800/60 bg-slate-800/70 px-3 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-slate-700 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Salir" : undefined}
        >
          <LogoutIcon />
          {!collapsed ? <span>Salir</span> : null}
        </button>
      </div>
    </>
  );
}

function isNavGroup(item: TenantNavItem): item is TenantNavGroup {
  return "children" in item;
}

function NavIcon({ icon }: { icon: TenantNavIcon }) {
  switch (icon) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case "customers":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="8" r="3" />
          <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
          <path d="M15 9a2.6 2.6 0 1 0 0-5.2" />
          <path d="M18 19c0-2-1.2-3.8-3-4.6" />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7 12 3l8 4-8 4-8-4Z" />
          <path d="M4 7v10l8 4 8-4V7" />
          <path d="M12 11v10" />
        </svg>
      );
    case "purchases":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 5h18" />
          <path d="M6 5v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5" />
          <path d="M9 11h6M9 15h6" />
          <path d="M10 3h4" />
        </svg>
      );
    case "suppliers":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 19h18" />
          <path d="M5 19V9l7-4 7 4v10" />
          <path d="M9 19v-5h6v5" />
        </svg>
      );
    case "purchase_orders":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z" />
          <path d="M8 8h8M8 12h8" />
        </svg>
      );
    case "receipts":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16v10H4z" />
          <path d="M8 11l2 2 4-4" />
        </svg>
      );
    case "sales":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h16v14H4z" />
          <path d="M8 9h8M8 13h5" />
          <path d="M16 3v4M8 3v4" />
        </svg>
      );
    case "receivables":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.3 7A2 2 0 1 1 7.1 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    default:
      return null;
  }
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}



