import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SearchX, UtensilsCrossed, X } from 'lucide-react';
import api from '@/api/client';
import MenuItemCard from '@/components/MenuItemCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MenuCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

function Hero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-accent/45 to-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Fresh from our kitchen
        </p>
        <h1 className="font-display text-3xl leading-tight sm:text-5xl">
          Order in a couple of taps.
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground text-pretty">
          Browse the full menu, send your order straight to the kitchen, and follow every step in
          real time — from confirmed to served.
        </p>
      </div>
    </section>
  );
}

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sectionRefs = useRef({});
  // Set while a rail click is scrolling, so the observer doesn't fight the
  // smooth scroll and light up every section it passes through on the way.
  const isJumping = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/categories'), api.get('/menu')])
      .then(([categoryRes, menuRes]) => {
        if (cancelled) return;
        setCategories(categoryRes.data);
        setItems(menuRes.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the menu. Please try again shortly.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const normalisedQuery = query.trim().toLowerCase();

  const matchingItems = useMemo(() => {
    if (!normalisedQuery) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(normalisedQuery) ||
        (item.description ?? '').toLowerCase().includes(normalisedQuery)
    );
  }, [items, normalisedQuery]);

  // Only categories that still have something in them after filtering.
  const sections = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        items: matchingItems.filter((item) => item.category?._id === category._id),
      }))
      .filter((section) => section.items.length > 0);
  }, [categories, matchingItems]);

  useEffect(() => {
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isJumping.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveCategory(visible.target.dataset.categoryId);
      },
      // Top offset clears the sticky navbar + rail so a section counts as
      // "current" only once it's actually under them.
      { rootMargin: '-160px 0px -55% 0px', threshold: 0 }
    );

    sections.forEach(({ category }) => {
      const element = sectionRefs.current[category._id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const jumpToCategory = (categoryId) => {
    const element = sectionRefs.current[categoryId];
    if (!element) return;
    isJumping.current = true;
    setActiveCategory(categoryId);
    const top = element.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top, behavior: 'smooth' });
    window.setTimeout(() => {
      isJumping.current = false;
    }, 700);
  };

  if (loading) {
    return (
      <>
        <Hero />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <MenuCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Hero />

      <div className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the menu…"
              aria-label="Search the menu"
              className="h-11 pl-9 pr-9"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          {!normalisedQuery && sections.length > 1 ? (
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sections.map(({ category }) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => jumpToCategory(category._id)}
                  className={cn(
                    'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    activeCategory === category._id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:pb-16">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : null}

        {sections.length === 0 ? (
          normalisedQuery ? (
            <EmptyState
              icon={SearchX}
              title={`Nothing matches "${query}"`}
              description="Try a different dish, or clear the search to see the full menu."
              action={
                <Button variant="outline" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={UtensilsCrossed}
              title="The menu is empty"
              description="Nothing has been published yet. Please check back shortly."
            />
          )
        ) : (
          <div className="space-y-12">
            {sections.map(({ category, items: categoryItems }) => (
              <section
                key={category._id}
                data-category-id={category._id}
                ref={(element) => {
                  sectionRefs.current[category._id] = element;
                }}
                aria-labelledby={`category-${category._id}`}
              >
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 id={`category-${category._id}`} className="font-display text-2xl">
                    {category.name}
                  </h2>
                  <span className="nums text-sm text-muted-foreground">
                    {categoryItems.length} item{categoryItems.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryItems.map((item) => (
                    <MenuItemCard key={item._id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
