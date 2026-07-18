import { useState } from "react";
import { useLocation } from "wouter";
import { useListBusinesses, useDeleteBusiness } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListBusinessesQueryKey } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Search as SearchIcon, 
  MoreVertical, 
  Eye, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  Globe
} from "lucide-react";
import { format } from "date-fns";

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Use a simple timeout for debouncing search
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading } = useListBusinesses({
    page,
    pageSize,
    search: debouncedSearch || undefined,
  });

  const deleteBusiness = useDeleteBusiness();

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteBusiness.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: `${name} has been removed.` });
            queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
          }
        }
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border bg-card px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intelligence Database</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse, filter, and manage extracted business records.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search names, categories, cities..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-md border border-border bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">Business Identity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact Intel</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16 text-center">
                      <div className="animate-pulse h-4 bg-muted rounded w-1/3 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No records found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data?.businesses.map((biz) => (
                  <TableRow 
                    key={biz.id} 
                    className="hover:bg-accent/5 cursor-pointer group"
                    onClick={() => setLocation(`/results/${biz.id}`)}
                  >
                    <TableCell>
                      <div className="font-semibold text-foreground">{biz.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                        <Badge variant="outline" className="font-mono text-[10px] bg-background">
                          {biz.category || 'Uncategorized'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {biz.city}{biz.state ? `, ${biz.state}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">{biz.country || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {biz.email ? (
                          <Badge variant="secondary" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                            <Mail className="h-3 w-3 mr-1" /> Email
                          </Badge>
                        ) : null}
                        {biz.website ? (
                          <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                            <Globe className="h-3 w-3 mr-1" /> Web
                          </Badge>
                        ) : null}
                        {!biz.email && !biz.website && (
                          <span className="text-xs text-muted-foreground italic">Sparse</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {biz.rating ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{biz.rating}</span>
                          <span className="text-xs text-muted-foreground">({biz.reviewCount})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {format(new Date(biz.updatedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/results/${biz.id}`); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {biz.website && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(biz.website!, '_blank'); }}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Visit Website
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleDelete(biz.id, biz.name); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-muted-foreground font-mono">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.total)} of {data.total} records
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="flex items-center justify-center px-3 text-sm font-medium">
                {page} / {data.totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
