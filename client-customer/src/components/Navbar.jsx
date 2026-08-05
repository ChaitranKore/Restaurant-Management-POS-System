import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogOut, Receipt, ShoppingBag, User, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cn, initials } from '@/lib/utils';

function navLinkClass({ isActive }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
  );
}

export default function Navbar({ onOpenCart }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link
          to="/"
          className="mr-2 flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-4.5" aria-hidden="true" />
          </span>
          TableSide
        </Link>

        <div className="hidden items-center gap-0.5 sm:flex">
          <NavLink to="/" end className={navLinkClass}>
            Menu
          </NavLink>
          {user ? (
            <NavLink to="/orders" className={navLinkClass}>
              My orders
            </NavLink>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {/* Hidden on mobile — StickyCartBar covers the cart there. */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCart}
            className="relative hidden h-9 sm:inline-flex"
          >
            <ShoppingBag />
            Cart
            {itemCount > 0 ? (
              <motion.span
                key={itemCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="nums absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground"
              >
                {itemCount}
              </motion.span>
            ) : null}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  aria-label="Account menu"
                >
                  <Avatar>
                    <AvatarFallback>
                      {initials(user.name) || <User className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/orders')}>
                  <Receipt />
                  My orders
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild className="h-9">
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild className="h-9">
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
