import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetSettings, useUpdateSettings, SettingsUpdateTheme, SettingsUpdateLogLevel } from "@workspace/api-client-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save, Server, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  maxResults: z.coerce.number().min(10).max(5000),
  requestDelay: z.coerce.number().min(0).max(10000),
  requestTimeout: z.coerce.number().min(1000).max(60000),
  headlessMode: z.boolean(),
  cacheEnabled: z.boolean(),
  loggingEnabled: z.boolean(),
  logLevel: z.enum(["debug", "info", "warning", "error"]),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { data: currentSettings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "system",
      maxResults: 100,
      requestDelay: 1000,
      requestTimeout: 30000,
      headlessMode: true,
      cacheEnabled: true,
      loggingEnabled: true,
      logLevel: "info",
    },
  });

  useEffect(() => {
    if (currentSettings) {
      form.reset({
        theme: currentSettings.theme as "light" | "dark" | "system",
        maxResults: currentSettings.maxResults,
        requestDelay: currentSettings.requestDelay,
        requestTimeout: currentSettings.requestTimeout,
        headlessMode: currentSettings.headlessMode,
        cacheEnabled: currentSettings.cacheEnabled,
        loggingEnabled: currentSettings.loggingEnabled,
        logLevel: currentSettings.logLevel as "debug" | "info" | "warning" | "error",
      });
    }
  }, [currentSettings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    // Apply UI theme
    setTheme(data.theme);

    // Save to backend
    updateSettings.mutate(
      { 
        data: {
          ...data,
          theme: data.theme as SettingsUpdateTheme,
          logLevel: data.logLevel as SettingsUpdateLogLevel
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "Configuration Saved", description: "System settings updated successfully." });
        },
        onError: () => {
          toast({ title: "Save Failed", description: "Could not apply configuration.", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 font-mono animate-pulse">Loading core config...</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            System Configuration
          </h1>
          <p className="text-muted-foreground">Manage engine behavior, extraction rules, and telemetry.</p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  Engine Parameters
                </CardTitle>
                <CardDescription>Control how the extraction engine interacts with targets.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <FormField
                  control={form.control}
                  name="maxResults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Global Max Results Limit</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Absolute ceiling for any single extraction session.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestDelay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Delay (ms)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Pause between network operations to evade detection.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestTimeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Timeout (ms)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Drop dead threshold for unresponsive targets.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headlessMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Headless Execution</FormLabel>
                        <FormDescription>Run engine processes without UI overhead.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                  <CardTitle className="text-lg">Environment</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UI Theme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light Profile</SelectItem>
                            <SelectItem value="dark">Dark Profile (Graphite)</SelectItem>
                            <SelectItem value="system">System Synced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cacheEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Aggressive Caching</FormLabel>
                          <FormDescription>Cache queries locally to speed up UI.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                  <CardTitle className="text-lg">Telemetry & Logging</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="loggingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Event Auditing</FormLabel>
                          <FormDescription>Record engine events to internal log file.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verbosity Horizon</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch("loggingEnabled")}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="debug">Verbose (Debug)</SelectItem>
                            <SelectItem value="info">Standard (Info)</SelectItem>
                            <SelectItem value="warning">Warnings Only</SelectItem>
                            <SelectItem value="error">Critical Errors Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Commit Configuration
              </Button>
            </div>
          </form>
        </Form>

      </div>
    </div>
  );
}
