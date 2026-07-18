import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateSearch, useGetSearch, useCancelSearch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Radar, Loader2, StopCircle, Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const searchSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  category: z.string().optional(),
  radius: z.coerce.number().min(100).max(50000).optional().default(5000),
  maxResults: z.coerce.number().min(1).max(1000).optional().default(50),
  language: z.string().optional().default("en"),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function Search() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSearchId, setActiveSearchId] = useState<number | null>(null);

  const createSearch = useCreateSearch();
  const cancelSearch = useCancelSearch();

  const { data: searchSession, refetch: refetchSearch } = useGetSearch(activeSearchId as number, {
    query: {
      enabled: !!activeSearchId,
      refetchInterval: (data) => {
        // Stop polling if completed, cancelled, or failed
        if (data?.state?.data?.status === "completed" || 
            data?.state?.data?.status === "cancelled" || 
            data?.state?.data?.status === "failed") {
          return false;
        }
        return 2000; // Poll every 2 seconds
      }
    }
  });

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      keyword: "",
      city: "",
      country: "",
      state: "",
      postalCode: "",
      category: "",
      radius: 5000,
      maxResults: 50,
      language: "en",
    },
  });

  async function onSubmit(data: SearchFormValues) {
    try {
      createSearch.mutate(
        { data },
        {
          onSuccess: (result) => {
            setActiveSearchId(result.id);
            toast({
              title: "Search Started",
              description: `Session ${result.id} initialized.`,
            });
          },
          onError: (error) => {
            toast({
              title: "Failed to start search",
              description: error.error || "Unknown error occurred",
              variant: "destructive",
            });
          }
        }
      );
    } catch (e) {
      console.error(e);
    }
  }

  const handleCancel = () => {
    if (activeSearchId) {
      cancelSearch.mutate(
        { id: activeSearchId },
        {
          onSuccess: () => {
            toast({
              title: "Search Cancelled",
              description: "The search process has been aborted.",
            });
            refetchSearch();
          }
        }
      );
    }
  };

  const handleReset = () => {
    setActiveSearchId(null);
    form.reset();
  };

  const isRunning = searchSession?.status === "running" || searchSession?.status === "pending";
  const isCompleted = searchSession?.status === "completed";
  const isFailed = searchSession?.status === "failed";
  const isCancelled = searchSession?.status === "cancelled";

  // Calculate progress safely
  const maxResults = searchSession?.maxResults || 100;
  const found = searchSession?.businessesFound || 0;
  const progressPercent = Math.min(100, Math.max(0, (found / maxResults) * 100));

  return (
    <div className="flex-1 overflow-auto p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Radar className="h-8 w-8 text-primary" />
            Radar Search
          </h1>
          <p className="text-muted-foreground">Launch a new intelligence gathering session.</p>
        </header>

        {activeSearchId && searchSession ? (
          <Card className="border-primary/50 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isRunning && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-chart-5" />}
                    {isCancelled && <StopCircle className="h-5 w-5 text-muted-foreground" />}
                    {isFailed && <AlertTriangle className="h-5 w-5 text-destructive" />}
                    Session #{searchSession.id}: {searchSession.keyword} in {searchSession.city}
                  </CardTitle>
                  <CardDescription className="mt-1 font-mono text-xs">
                    Status: <span className="uppercase font-semibold tracking-wider">{searchSession.status}</span>
                    {searchSession.durationSeconds && ` • Duration: ${searchSession.durationSeconds}s`}
                  </CardDescription>
                </div>
                {isRunning && (
                  <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelSearch.isPending}>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Abort
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Acquisition Progress</span>
                  <span className="font-mono">{found} / {maxResults} targets</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saved Records</p>
                  <p className="text-xl font-semibold font-mono text-primary">{searchSession.businessesSaved}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Language</p>
                  <p className="text-base font-medium">{searchSession.language || 'Default'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Radius</p>
                  <p className="text-base font-medium">{searchSession.radius ? `${searchSession.radius}m` : 'Default'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                  <p className="text-base font-medium">{searchSession.category || 'Any'}</p>
                </div>
              </div>
              
              {isFailed && searchSession.errorMessage && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 font-mono">
                  Error: {searchSession.errorMessage}
                </div>
              )}
            </CardContent>
            {!isRunning && (
              <CardFooter className="bg-muted/30 border-t border-border flex justify-between">
                <Button variant="outline" onClick={handleReset}>New Search</Button>
                <Button onClick={() => setLocation("/results")}>View Results</Button>
              </CardFooter>
            )}
          </Card>
        ) : (
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Search Parameters</CardTitle>
                  <CardDescription>Configure target parameters for extraction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="keyword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Keyword *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Coffee shop, Plumber, Marketing agency" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. restaurant, real_estate_agency" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. San Francisco" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Region (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. CA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. US" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="radius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Radius (meters)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Distance from city center</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxResults"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Results</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Limit extraction count</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <FormControl>
                            <Input placeholder="en, es, fr, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border py-4">
                  <Button type="submit" size="lg" className="w-full md:w-auto" disabled={createSearch.isPending}>
                    {createSearch.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-5 w-5" />
                    )}
                    Initialize Search
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}

      </div>
    </div>
  );
}
