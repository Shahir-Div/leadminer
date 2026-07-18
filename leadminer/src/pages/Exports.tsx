import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useExportBusinesses, ExportRequestFormat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { DownloadCloud, FileSpreadsheet, FileJson, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const exportSchema = z.object({
  format: z.enum(["csv", "json", "xlsx"]),
  scope: z.enum(["all", "selected"]),
  includeNotes: z.boolean().default(true),
  includeSources: z.boolean().default(true),
  includeEmptyFields: z.boolean().default(true),
});

type ExportFormValues = z.infer<typeof exportSchema>;

export default function Exports() {
  const { toast } = useToast();
  const exportBusinesses = useExportBusinesses();
  
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: "csv",
      scope: "all",
      includeNotes: true,
      includeSources: true,
      includeEmptyFields: false,
    },
  });

  const onSubmit = (data: ExportFormValues) => {
    exportBusinesses.mutate(
      {
        data: {
          format: data.format as ExportRequestFormat,
          includeNotes: data.includeNotes,
          includeSources: data.includeSources,
          includeEmptyFields: data.includeEmptyFields,
          // businessIds: [] would go here if scope was "selected"
        }
      },
      {
        onSuccess: (result) => {
          // Trigger file download
          const blob = new Blob([result.content], { 
            type: data.format === 'json' ? 'application/json' : 
                  data.format === 'csv' ? 'text/csv' : 
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Export Complete",
            description: `Successfully exported ${result.recordCount} records to ${result.filename}.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Export Failed",
            description: "There was an error generating your export file.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="flex-1 overflow-auto p-8 bg-background">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <DownloadCloud className="h-8 w-8 text-primary" />
            Data Extraction
          </h1>
          <p className="text-muted-foreground">Export your intelligence database to external formats.</p>
        </header>

        <Card className="border-border shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle>Export Configuration</CardTitle>
                <CardDescription>Select format and data inclusion parameters.</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8 pt-6">
                
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">File Format</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <FormItem>
                            <FormLabel className="cursor-pointer [data-state=checked]:border-primary hover:border-primary/50 transition-colors flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 space-y-2">
                              <FormControl>
                                <RadioGroupItem value="csv" className="sr-only" />
                              </FormControl>
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <span className="font-semibold">CSV</span>
                              <span className="text-xs text-muted-foreground text-center">Standard comma-separated</span>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="cursor-pointer [data-state=checked]:border-primary hover:border-primary/50 transition-colors flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 space-y-2">
                              <FormControl>
                                <RadioGroupItem value="xlsx" className="sr-only" />
                              </FormControl>
                              <FileSpreadsheet className="h-8 w-8 text-green-600/80" />
                              <span className="font-semibold">Excel</span>
                              <span className="text-xs text-muted-foreground text-center">Rich formatted tables</span>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="cursor-pointer [data-state=checked]:border-primary hover:border-primary/50 transition-colors flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 space-y-2">
                              <FormControl>
                                <RadioGroupItem value="json" className="sr-only" />
                              </FormControl>
                              <FileJson className="h-8 w-8 text-yellow-600/80" />
                              <span className="font-semibold">JSON</span>
                              <span className="text-xs text-muted-foreground text-center">Raw programmatic data</span>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-base font-medium">Inclusion Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="includeNotes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Analyst Notes</FormLabel>
                            <FormDescription>
                              Include custom notes attached to records.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="includeSources"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Source URLs</FormLabel>
                            <FormDescription>
                              Include raw source links where data was found.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="includeEmptyFields"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Empty Columns</FormLabel>
                            <FormDescription>
                              Keep structural columns even if all values are empty.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border py-4 flex justify-end">
                <Button type="submit" size="lg" disabled={exportBusinesses.isPending}>
                  {exportBusinesses.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <DownloadCloud className="mr-2 h-5 w-5" />
                  )}
                  Generate Payload
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

      </div>
    </div>
  );
}
