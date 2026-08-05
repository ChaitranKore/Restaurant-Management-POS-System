import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu as MenuIcon,
  Radio,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CommandPalette from '@/components/CommandPalette';
import { navItemsForRole } from '@/components/nav-items';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { cn, initials } from '@/lib/utils';

const COLLAPSE_KEY = 'tableside-sidebar-collapsed';

function NavItems({ items, collapsed, onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {items.map(({ to, label, icon: Icon, end }) => {
        const link = (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <Icon className="size-4.5 shrink-0" aria-hidden="true" />
            {collapsed ? <span className="sr-only">{label}</span> : label}
          </NavLink>
        );

        // Collapsed to icons, the label has to come back on hover or the nav
        // becomes a guessing game.
        return collapsed ? (
          <Tooltip key={to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
}

function SidebarBody({ items, collapsed, onNavigate, user, onLogout }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-2 px-4',
          collapsed && 'justify-center px-0'
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-4.5" aria-hidden="true" />
        </span>
        {!collapsed ? (
          <span className="font-display text-lg font-semibold text-white">TableSide</span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <NavItems items={items} collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      <div className={cn('border-t border-sidebar-border p-2', collapsed && 'px-1')}>
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2 py-2',
            collapsed && 'justify-center px-0'
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs capitalize text-sidebar-foreground/60">{user?.role}</p>
            </div>
          ) : null}
          {!collapsed ? (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              className="grid size-8 shrink-0 place-items-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Layout({ title, subtitle, actions, children, bleed = false }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage blocked — the preference just won't persist */
    }
  }, [collapsed]);

  const items = navItemsForRole(user?.role ?? 'staff');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarBody items={items} collapsed={collapsed} user={user} onLogout={handleLogout} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" showClose={false} className="w-60 gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody
            items={items}
            collapsed={false}
            user={user}
            onLogout={handleLogout}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((previous) => !previous)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {actions}

            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'hidden items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold sm:inline-flex',
                    connected ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Radio
                    className={cn('size-3', connected && 'animate-pulse-soft')}
                    aria-hidden="true"
                  />
                  {connected ? 'Live' : 'Offline'}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {connected
                  ? 'Connected — new orders arrive instantly'
                  : 'Reconnecting to the order stream…'}
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 gap-2 text-muted-foreground md:inline-flex"
            >
              <Search className="size-4" />
              Search
              <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                ⌘K
              </kbd>
            </Button>

            <ThemeToggle size="icon-sm" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(user?.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {user?.role} · {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* `bleed` lets the kitchen display own the full canvas edge to edge. */}
        <main className={cn('min-w-0 flex-1', bleed ? '' : 'p-4 sm:p-6')}>{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
