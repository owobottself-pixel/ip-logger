import { useState } from "react";
import { useListLinks, useCreateLink, useDeleteLink, getListLinksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Copy, Trash2, Plus, Target, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Links() {
  const { data: links, isLoading } = useListLinks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createLink.mutate(
      { data: { name, redirectUrl: redirectUrl || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          setIsDialogOpen(false);
          setName("");
          setRedirectUrl("");
          toast({
            title: "LINK DEPLOYED",
            description: "New tracking link successfully generated.",
          });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Confirm destruction of tracking link?")) return;
    deleteLink.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          toast({
            title: "LINK DESTROYED",
            description: "Tracking link and associated logs scheduled for deletion.",
          });
        }
      }
    );
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/t/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "COPIED TO CLIPBOARD",
      description: "Tracking URL acquired.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">Tracking Links</h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-wider">Manage active interception points</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-sm uppercase tracking-widest font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Deploy Link
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest text-primary border-b border-border pb-4">Deploy New Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">Operation Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="bg-background border-border rounded-sm font-mono focus-visible:ring-primary"
                  placeholder="e.g. TARGET_ALPHA_1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="redirectUrl" className="text-xs uppercase tracking-widest text-muted-foreground">Redirect URL (Optional)</Label>
                <Input 
                  id="redirectUrl" 
                  value={redirectUrl} 
                  onChange={(e) => setRedirectUrl(e.target.value)} 
                  className="bg-background border-border rounded-sm font-mono focus-visible:ring-primary"
                  placeholder="https://example.com/document.pdf"
                />
              </div>
              <Button type="submit" disabled={createLink.isPending} className="w-full rounded-sm uppercase tracking-widest font-bold">
                {createLink.isPending ? "Deploying..." : "Deploy"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-primary animate-pulse tracking-widest">SCANNING...</div>
        ) : links?.length === 0 ? (
          <Card className="bg-card border-border rounded-sm border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Target className="w-12 h-12 mb-4 opacity-20" />
              <p className="tracking-widest uppercase">No active tracking links</p>
            </CardContent>
          </Card>
        ) : (
          links?.map((link) => (
            <Card key={link.id} className="bg-card border-border rounded-sm overflow-hidden hover:border-primary/50 transition-colors group">
              <div className="flex flex-col sm:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link href={`/links/${link.id}`} className="text-lg font-bold text-foreground hover:text-primary transition-colors uppercase">
                      {link.name}
                    </Link>
                    <span className="px-2 py-0.5 rounded text-xs tracking-widest bg-primary/10 text-primary border border-primary/20">
                      {link.visitCount} HITS
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary/50">Created:</span>
                      {new Date(link.createdAt).toLocaleDateString()}
                    </div>
                    {link.redirectUrl && (
                      <div className="flex items-center gap-2 truncate max-w-xs">
                        <span className="text-primary/50">Target:</span>
                        <a href={link.redirectUrl} target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
                          {link.redirectUrl} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-secondary/30 p-4 border-t sm:border-t-0 sm:border-l border-border flex sm:flex-col items-center justify-center gap-2 min-w-[120px]">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(link.token)}
                    className="w-full bg-background hover:bg-primary hover:text-primary-foreground border-border rounded-sm text-xs tracking-widest uppercase"
                  >
                    <Copy className="w-3 h-3 mr-2" /> URL
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(link.id)}
                    className="w-full bg-background hover:bg-destructive hover:text-destructive-foreground border-border rounded-sm text-xs tracking-widest uppercase"
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}