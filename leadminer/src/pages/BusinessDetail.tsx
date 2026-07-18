import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useGetBusiness, useUpdateBusiness, getGetBusinessQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Star, 
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Link as LinkIcon,
  Map,
  Save,
  Check
} from "lucide-react";

export default function BusinessDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: business, isLoading, error } = useGetBusiness(id, {
    query: {
      enabled: !!id,
      queryKey: getGetBusinessQueryKey(id)
    }
  });

  const updateBusiness = useUpdateBusiness();

  // Notes state
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    if (business && initializedRef.current !== id) {
      setNotes(business.notes || "");
      initializedRef.current = id;
    }
  }, [business, id]);

  const handleNotesSave = () => {
    if (!business || notes === business.notes) return;
    
    setIsSaving(true);
    updateBusiness.mutate(
      { id, data: { notes } },
      {
        onSuccess: (updatedData) => {
          setIsSaving(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
          
          // Update cache locally
          queryClient.setQueryData(getGetBusinessQueryKey(id), updatedData);
        },
        onError: () => {
          setIsSaving(false);
          toast({ title: "Failed to save notes", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 font-mono animate-pulse text-muted-foreground">Loading record profile...</div>;
  }

  if (error || !business) {
    return <div className="p-8 text-destructive">Failed to load record details.</div>;
  }

  const socialLinks = [
    { icon: Facebook, label: "Facebook", value: business.facebook },
    { icon: Instagram, label: "Instagram", value: business.instagram },
    { icon: Linkedin, label: "LinkedIn", value: business.linkedin },
    { icon: Twitter, label: "X (Twitter)", value: business.x },
    { icon: Youtube, label: "YouTube", value: business.youtube },
    { icon: LinkIcon, label: "TikTok", value: business.tiktok },
    { icon: LinkIcon, label: "Pinterest", value: business.pinterest },
    { icon: LinkIcon, label: "Threads", value: business.threads },
  ].filter(s => s.value);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/results")} className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Database
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {business.category || 'Uncategorized'}
                </Badge>
                {business.status && (
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {business.status}
                  </Badge>
                )}
                {business.rating && (
                  <span className="flex items-center text-sm font-medium text-amber-500">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    {business.rating} ({business.reviewCount})
                  </span>
                )}
              </div>
            </div>
            {business.website && (
              <Button onClick={() => window.open(business.website!, '_blank')}>
                <Globe className="h-4 w-4 mr-2" /> Visit Website
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Contact Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Email Address</h3>
                  {business.email ? (
                    <a href={`mailto:${business.email}`} className="text-primary hover:underline flex items-center font-medium">
                      <Mail className="h-4 w-4 mr-2" /> {business.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">Not found</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Phone Number</h3>
                  {business.phone ? (
                    <a href={`tel:${business.phone}`} className="text-primary hover:underline flex items-center font-medium">
                      <Phone className="h-4 w-4 mr-2" /> {business.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">Not found</span>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Physical Location</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    <span className="text-sm">
                      {[business.street, business.district, business.city, business.state, business.postalCode, business.country]
                        .filter(Boolean).join(", ")}
                    </span>
                  </div>
                  {business.mapsUrl && (
                    <a href={business.mapsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center mt-2 ml-6">
                      <Map className="h-3 w-3 mr-1" /> View on Maps
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {business.description && (
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{business.description}</p>
              </CardContent>
            </Card>
          )}

          {socialLinks.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <CardTitle className="text-lg">Social Footprint</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social, i) => (
                    <a 
                      key={i} 
                      href={social.value!} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-card hover:bg-accent/10 transition-colors text-sm font-medium"
                    >
                      <social.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {social.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Meta & Notes */}
        <div className="space-y-6">
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Analyst Notes</CardTitle>
                {saveSuccess ? (
                  <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">
                    <Check className="h-3 w-3 mr-1" /> Saved
                  </Badge>
                ) : isSaving ? (
                  <span className="text-xs text-muted-foreground font-mono animate-pulse">Saving...</span>
                ) : (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleNotesSave}>
                    <Save className="h-3 w-3 mr-1" /> Save
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Record operational details, context, or next steps..."
                className="min-h-[250px] resize-none bg-background/50 border-primary/20 focus-visible:ring-primary/50 text-sm font-mono"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesSave}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Internal ID</span>
                <span>{business.id}</span>
              </div>
              {business.searchSessionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session Ref</span>
                  <span className="text-primary cursor-pointer hover:underline">#{business.searchSessionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acquired</span>
                <span>{format(new Date(business.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{format(new Date(business.updatedAt), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>
          
          {business.openingHours && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Operational Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm whitespace-pre-wrap">{business.openingHours}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Ensure FileText is available for description
import { FileText } from "lucide-react";