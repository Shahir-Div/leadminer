import { useState } from "react";
import { useListLogs, useClearLogs, getListLogsQueryKey, ListLogsLevel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Trash2, 
  RefreshCw, 
  Search,
  ChevronLeft,
  ChevronRight,
  Terminal
} from "lucide-react";

export default function Logs() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<ListLogsLevel | "all">("all");
  const [search, setSearch] = useState("");
  const pageSize = 50;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListLogs({
    page,
    pageSize,
    level: level === "all" ? undefined : level as ListLogsLevel,
    search: search || undefined
  });

  const clearLogs = useClearLogs();

  const handleClear = () => {
    if (confirm("Purge entire application event log? This cannot be undone.")) {
      clearLogs.mutate(undefined, {
        onSuccess: () => {
          toast({ title: "Logs Purged", description: "Event telemetry has been cleared." });
          queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
        }
      });
    }
  };

  const getLevelBadge = (lvl: string) => {
    switch(lvl) {
      case 'error': return <Badge variant="destructive" className="font-mono uppercase text-[10px]">Error</Badge>;
      case 'warning': return <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10 font-mono uppercase text-[10px]">Warning</Badge>;
      case 'info': return <Badge variant="secondary" className="bg-primary/10 text-primary font-mono uppercase text-[10px]">Info</Badge>;
      case 'debug': return <Badge variant="outline" className="font-mono uppercase text-[10px]">Debug</Badge>;
      default: return <Badge variant="outline" className="font-mono uppercase text-[10px]">{lvl}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border bg-card px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">System Telemetry</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Grep messages..."
              className="pl-9 h-9 text-sm font-mono bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            />
          </div>
          
          <Select 
            value={level} 
            onValueChange={(v: ListLogsLevel | "all") => { setLevel(v); setPage(1); }}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 w-9 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button variant="destructive" size="sm" onClick={handleClear} disabled={clearLogs.isPending} className="h-9">
            <Trash2 className="h-4 w-4 mr-2" />
            Purge
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/10 p-6">
        <div className="font-mono text-sm max-w-[1400px] mx-auto bg-card border border-border rounded-md shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Reading streams...</div>
          ) : data?.logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No telemetry found in current view.</div>
          ) : (
            <div className="divide-y divide-border">
              {data?.logs.map((log) => (
                <div key={log.id} className="p-3 flex gap-4 hover:bg-accent/5 transition-colors">
                  <div className="w-32 shrink-0 text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "HH:mm:ss.SSS")}
                  </div>
                  <div className="w-20 shrink-0">
                    {getLevelBadge(log.level)}
                  </div>
                  <div className="w-24 shrink-0 text-muted-foreground truncate">
                    [{log.module}]
                  </div>
                  <div className="flex-1 text-foreground break-all">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 max-w-[1400px] mx-auto">
            <div className="text-xs text-muted-foreground font-mono">
              Lines {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.total)}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center px-2 text-xs font-mono">
                {page}/{data.totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="h-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
