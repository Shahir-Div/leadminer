import { useGetDashboardSummary } from "@workspace/api-client-react";
import { 
  Building2, 
  Search as SearchIcon, 
  Mail, 
  Globe, 
  Activity 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-primary/20 mb-4"></div>
          <div className="text-muted-foreground text-sm font-mono">Loading telemetry...</div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-6 text-destructive">
            <h3 className="font-semibold mb-2">Failed to load dashboard data</h3>
            <p className="text-sm opacity-80">Check server connection or logs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8 bg-background/50">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Intelligence Desk</h1>
          <p className="text-muted-foreground">Overview of your research and data collection.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card hover:bg-accent/5 transition-colors border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.totalBusinesses.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card hover:bg-accent/5 transition-colors border-l-4 border-l-chart-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Searches</CardTitle>
              <SearchIcon className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.totalSearches.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-accent/5 transition-colors border-l-4 border-l-chart-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">With Email</CardTitle>
              <Mail className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.businessesWithEmail.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalBusinesses > 0 
                  ? `${Math.round((summary.businessesWithEmail / summary.totalBusinesses) * 100)}% coverage`
                  : '0% coverage'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-accent/5 transition-colors border-l-4 border-l-chart-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">With Website</CardTitle>
              <Globe className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.businessesWithWebsite.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalBusinesses > 0 
                  ? `${Math.round((summary.businessesWithWebsite / summary.totalBusinesses) * 100)}% coverage`
                  : '0% coverage'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Discovery Growth (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summary.dailyGrowth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          try {
                            return format(new Date(value), 'MMM d');
                          } catch {
                            return value;
                          }
                        }}
                        fontSize={12}
                        tickMargin={10}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        fontSize={12} 
                        tickMargin={10} 
                        stroke="hsl(var(--muted-foreground))"
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)'
                        }}
                        labelFormatter={(value) => {
                          try {
                            return format(new Date(value as string), 'MMM d, yyyy');
                          } catch {
                            return value;
                          }
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.categoryBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="category" 
                        fontSize={12}
                        tickMargin={10}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        fontSize={12} 
                        tickMargin={10} 
                        stroke="hsl(var(--muted-foreground))"
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)'
                        }}
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--chart-2))" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="h-full border-muted bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {summary.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                  ) : (
                    summary.recentActivity.map((activity, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== summary.recentActivity.length - 1 && (
                          <div className="absolute top-6 bottom-[-24px] left-[7px] w-[2px] bg-border" />
                        )}
                        <div className="mt-1 h-4 w-4 rounded-full bg-primary/20 border border-primary flex items-center justify-center shrink-0 z-10">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {format(new Date(activity.timestamp), "MMM d, HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
