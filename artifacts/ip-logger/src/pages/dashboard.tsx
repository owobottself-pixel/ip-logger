import { useGetStatsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, Globe, Fingerprint, Activity, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading, isError, refetch } = useGetStatsSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-widest text-primary uppercase border-b border-border pb-4">System Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 bg-secondary" />
          <Skeleton className="h-32 bg-secondary" />
          <Skeleton className="h-32 bg-secondary" />
          <Skeleton className="h-32 bg-secondary" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 bg-secondary" />
          <Skeleton className="h-64 bg-secondary" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-widest text-primary uppercase border-b border-border pb-4">System Overview</h1>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive opacity-60" />
          <p className="text-destructive uppercase tracking-widest font-bold text-sm">API Connection Error</p>
          <p className="text-muted-foreground text-xs tracking-wider max-w-xs">
            Could not reach the server. Check that DATABASE_URL is set in Railway and the service is running.
          </p>
          <Button variant="outline" size="sm" className="uppercase tracking-widest text-xs rounded-sm mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">System Overview</h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-wider">Global interception statistics</p>
        </div>
        <div className="text-xs text-primary animate-pulse tracking-widest">
          LIVE FEED ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="TOTAL LINKS" value={stats?.totalLinks || 0} icon={LinkIcon} />
        <StatCard title="TOTAL INTERCEPTS" value={stats?.totalVisits || 0} icon={Activity} />
        <StatCard title="UNIQUE TARGETS" value={stats?.uniqueIps || 0} icon={Fingerprint} />
        <StatCard title="INTERCEPTS TODAY" value={stats?.visitsToday || 0} icon={Globe} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card border-border rounded-sm">
          <CardHeader className="border-b border-border bg-secondary/50">
            <CardTitle className="text-sm tracking-widest uppercase flex items-center justify-between">
              Top Active Links
              <Link href="/links" className="text-primary hover:underline flex items-center gap-1 text-xs">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {stats?.topLinks?.map(link => (
                <div key={link.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div>
                    <Link href={`/links/${link.id}`} className="font-bold text-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      /t/{link.token}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                    {link.visitCount} HITS
                  </Badge>
                </div>
              ))}
              {!stats?.topLinks?.length && (
                <div className="p-8 text-center text-muted-foreground text-sm tracking-wider uppercase">
                  No active links
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-sm">
          <CardHeader className="border-b border-border bg-secondary/50">
            <CardTitle className="text-sm tracking-widest uppercase flex items-center justify-between">
              Recent Intercepts
              <Link href="/logs" className="text-primary hover:underline flex items-center gap-1 text-xs">
                View Log <ArrowRight className="w-3 h-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {stats?.recentLogs?.slice(0, 5).map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div>
                    <div className="font-bold text-primary">{log.ip}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase flex items-center gap-2">
                      <span>{log.country || 'UNKNOWN'}</span>
                      <span>•</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <Link href={`/links/${log.linkId}`}>
                    <Badge variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
                      LINK #{log.linkId}
                    </Badge>
                  </Link>
                </div>
              ))}
              {!stats?.recentLogs?.length && (
                <div className="p-8 text-center text-muted-foreground text-sm tracking-wider uppercase">
                  No recent intercepts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string, value: number, icon: any }) {
  return (
    <Card className="bg-card border-border rounded-sm overflow-hidden group hover:border-primary/50 transition-colors">
      <CardContent className="p-6 relative">
        <div className="absolute right-0 top-0 opacity-5 w-24 h-24 -mt-4 -mr-4 group-hover:opacity-10 transition-opacity">
          <Icon className="w-full h-full text-primary" />
        </div>
        <h3 className="text-xs tracking-widest uppercase text-muted-foreground mb-2">{title}</h3>
        <div className="text-4xl font-bold text-foreground font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}
