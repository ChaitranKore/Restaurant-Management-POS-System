import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Flame,
  ReceiptText,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ChartEmpty, ChartTooltip, chartPalette } from '@/components/charts';
import { useTheme } from '@/lib/theme';
import { cn, formatCurrency } from '@/lib/utils';

/** Percent change vs the comparison period; null when there's no baseline. */
function delta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function StatCard({ label, value, icon: Icon, change, hint, to }) {
  const positive = change != null && change >= 0;
  const Wrapper = to ? Link : 'div';

  return (
    <Wrapper to={to} className={cn('block', to && 'group')}>
      <Card interactive={Boolean(to)} className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="nums mt-1.5 text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {change != null ? (
            <>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                  positive ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive'
                )}
              >
                {positive ? (
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="size-3" aria-hidden="true" />
                )}
                {Math.abs(change).toFixed(0)}%
              </span>
              <span className="text-muted-foreground">vs yesterday</span>
            </>
          ) : (
            <span className="text-muted-foreground">{hint}</span>
          )}
        </div>
      </Card>
    </Wrapper>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    api
      .get('/dashboard/stats')
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load the dashboard.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-read the tokens whenever the theme flips so the SVG colours follow.
  const palette = useMemo(() => chartPalette(), [theme, stats]);

  const paymentData = useMemo(
    () =>
      (stats?.paymentBreakdown ?? []).map((entry, index) => ({
        name: entry._id === 'cash' ? 'Cash' : 'Card',
        value: entry.total,
        count: entry.count,
        fill: palette.series[index % palette.series.length],
      })),
    [stats, palette]
  );

  const topItems = useMemo(
    () => (stats?.topItemsToday ?? []).map((item) => ({ name: item._id, quantity: item.quantity })),
    [stats]
  );

  const hasRevenue = (stats?.revenueSeries ?? []).some((day) => day.total > 0);
  const hasOrders = (stats?.ordersByHour ?? []).some((hour) => hour.count > 0);

  return (
    <Layout
      title="Dashboard"
      subtitle="Today's service at a glance"
      actions={
        <Button variant="outline" size="sm" asChild className="hidden h-9 sm:inline-flex">
          <Link to="/kitchen">
            Kitchen display
            <ArrowRight />
          </Link>
        </Button>
      }
    >
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : !stats ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Revenue today"
              value={formatCurrency(stats.todayRevenue)}
              icon={TrendingUp}
              change={delta(stats.todayRevenue, stats.yesterdayRevenue)}
              hint={`${stats.todayPaymentsCount} payment${stats.todayPaymentsCount === 1 ? '' : 's'} taken`}
            />
            <StatCard
              label="Orders today"
              value={stats.todayOrders}
              icon={ReceiptText}
              change={delta(stats.todayOrders, stats.yesterdayOrders)}
              hint="No orders yesterday to compare"
              to="/orders"
            />
            <StatCard
              label="Active orders"
              value={stats.activeOrders}
              icon={Flame}
              hint="In the kitchen right now"
              to="/kitchen"
            />
            <StatCard
              label="Menu items"
              value={stats.totalMenuItems}
              icon={UtensilsCrossed}
              hint="Published on the menu"
              to="/menu"
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue, last 7 days</CardTitle>
              </CardHeader>
              <CardContent className="h-72 pt-0">
                {hasRevenue ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueSeries} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={palette.series[0]} stopOpacity={0.32} />
                          <stop offset="100%" stopColor={palette.series[0]} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        stroke={palette.muted}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={palette.muted}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        cursor={{ stroke: palette.grid }}
                        content={
                          <ChartTooltip
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(label) => `${label} · revenue`}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Revenue"
                        stroke={palette.series[0]}
                        strokeWidth={2}
                        fill="url(#revenueFill)"
                        dot={{ r: 3, strokeWidth: 0, fill: palette.series[0] }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmpty message="No payments in the last 7 days yet." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment methods</CardTitle>
              </CardHeader>
              <CardContent className="h-72 pt-0">
                {paymentData.length ? (
                  <div className="flex h-full flex-col">
                    {/* ResponsiveContainer resolves a percentage height against
                        the parent's *definite* height; as a flex child with
                        height:auto that computes to zero and the chart vanishes.
                        flex-1 + min-h-0 gives it a real box to fill. */}
                    <div className="min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="58%"
                            outerRadius="88%"
                            // Gaps only make sense between slices. With a single
                            // method taken, a padding angle leaves the lone
                            // sector degenerate and nothing is drawn at all.
                            paddingAngle={paymentData.length > 1 ? 2 : 0}
                            strokeWidth={0}
                            isAnimationActive={false}
                          >
                            {paymentData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-3 shrink-0 space-y-1.5">
                      {paymentData.map((entry) => (
                        <li key={entry.name} className="flex items-center gap-2 text-sm">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ background: entry.fill }}
                            aria-hidden="true"
                          />
                          <span>{entry.name}</span>
                          <span className="nums ml-auto font-semibold">
                            {formatCurrency(entry.value)}
                          </span>
                          <span className="nums w-8 text-right text-xs text-muted-foreground">
                            ×{entry.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ChartEmpty message="No payments recorded today." />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Orders by hour</CardTitle>
              </CardHeader>
              <CardContent className="h-64 pt-0">
                {hasOrders ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ordersByHour} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <XAxis
                        dataKey="label"
                        stroke={palette.muted}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={1}
                      />
                      <YAxis
                        stroke={palette.muted}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: palette.grid, opacity: 0.35 }}
                        content={
                          <ChartTooltip labelFormatter={(label) => `${label} · orders placed`} />
                        }
                      />
                      <Bar dataKey="count" name="Orders" fill={palette.series[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmpty message="No orders placed today yet." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top items today</CardTitle>
              </CardHeader>
              <CardContent className="h-64 pt-0">
                {topItems.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topItems}
                      layout="vertical"
                      margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
                    >
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke={palette.muted}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={104}
                      />
                      <Tooltip
                        cursor={{ fill: palette.grid, opacity: 0.35 }}
                        content={<ChartTooltip formatter={(value) => `${value} sold`} />}
                      />
                      <Bar dataKey="quantity" name="Sold" fill={palette.series[4]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmpty message="Nothing sold today yet." />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
