import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { LogOut, Moon, Search, Sun } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/lib/theme';
import { navItemsForRole } from '@/components/nav-items';

/** ⌘K / Ctrl-K jump-to-anywhere. */
export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggle } = useTheme();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange((previous) => !previous);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  const run = (action) => {
    onOpenChange(false);
    action();
  };

  const items = navItemsForRole(user?.role ?? 'staff');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a screen or an action, then press Enter.
        </DialogDescription>

        <Command loop className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Command.Input
              placeholder="Jump to a screen or run an action…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Nothing matches that.
            </Command.Empty>

            <Command.Group
              heading="Go to"
              className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {items.map(({ to, label, icon: Icon, keywords }) => (
                <Command.Item
                  key={to}
                  value={`${label} ${keywords}`}
                  onSelect={() => run(() => navigate(to))}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Actions"
              className="mt-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              <Command.Item
                value="toggle theme dark light appearance"
                onSelect={() => run(toggle)}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <Sun className="size-4 text-muted-foreground dark:hidden" aria-hidden="true" />
                <Moon className="hidden size-4 text-muted-foreground dark:block" aria-hidden="true" />
                Toggle theme
              </Command.Item>
              <Command.Item
                value="log out sign out"
                onSelect={() => run(logout)}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive data-[selected=true]:bg-destructive/10"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
