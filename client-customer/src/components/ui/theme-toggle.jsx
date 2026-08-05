import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** Sun/moon cross-fade — both icons are always mounted so neither pops in. */
function ThemeToggle({ className, variant = 'ghost', size = 'icon' }) {
  const { toggle } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggle}
      aria-label="Toggle colour theme"
      className={cn('relative', className)}
    >
      <Sun className="rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export { ThemeToggle };
