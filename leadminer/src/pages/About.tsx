import { Info, Github, ExternalLink, Server, Database, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="flex-1 overflow-auto p-8 bg-background">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex flex-col items-center justify-center py-12 text-center border-b border-border mb-8">
          <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6 shadow-sm">
            <Server className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">LeadMiner AI</h1>
          <p className="text-muted-foreground mt-2 text-lg">Local-First Business Intelligence Workspace</p>
          <div className="mt-4 px-3 py-1 bg-muted rounded-full text-xs font-mono font-medium border border-border">
            Version 1.0.0
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                Storage Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All extracted data is stored entirely locally. No third-party cloud synchronization occurs without explicit export actions. Built on high-performance SQLite for rapid querying of thousands of records.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Extraction Layer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Utilizes headless browser automation to traverse directories, index endpoints, and resolve complex contact matrices. Engineered for stealth and stability.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Technical Stack</CardTitle>
            <CardDescription>Underlying architecture powering the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Frontend Framework</span>
                <span className="font-medium text-foreground">React 18 + Vite</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Interface Engine</span>
                <span className="font-medium text-foreground">TailwindCSS + shadcn/ui</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">State Management</span>
                <span className="font-medium text-foreground">TanStack Query</span>
              </li>
              <li className="flex justify-between pb-2">
                <span className="text-muted-foreground">Routing</span>
                <span className="font-medium text-foreground">Wouter</span>
              </li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
