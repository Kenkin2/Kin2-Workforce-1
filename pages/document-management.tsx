import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Upload, CloudUpload, File, HardDrive, Eye, Share2, FileText, Share, Users, Copy, FilePlus, Archive, FolderOpen, Route, Play } from "lucide-react";

export default function DocumentManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const documents = [
    { id: "1", name: "Employee Handbook 2024", type: "PDF", size: "2.4 MB", category: "HR", lastModified: "2 days ago" },
    { id: "2", name: "Safety Procedures", type: "DOCX", size: "1.8 MB", category: "Safety", lastModified: "1 week ago" },
    { id: "3", name: "Project Charter - Alpha", type: "PDF", size: "890 KB", category: "Projects", lastModified: "3 days ago" },
  ];

  return (
    <AppLayout 
      title="Document Management"
      breadcrumbs={[{ label: "Resources", href: "/dashboard" }, { label: "Documents" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Document Management System</h2>
            <p className="text-muted-foreground">Centralized document storage, version control, and collaboration</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-document-search" onClick={() => toast({ title: "Document Search", description: "Advanced document search coming soon!" })}>
              <Search className="mr-2 h-4 w-4" />
              Search Documents
            </Button>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-upload-document">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Document title..." data-testid="input-document-title" />
                  <Input placeholder="Category..." data-testid="input-document-category" />
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <CloudUpload className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Drag and drop files here</p>
                  </div>
                  <Button onClick={() => {
                    toast({ title: "Success", description: "Document uploaded successfully!" });
                    setIsUploadOpen(false);
                  }} className="w-full">
                    Upload Document
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Document Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,247</div>
              <p className="text-xs text-muted-foreground">+23 this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">8.3 GB</div>
              <p className="text-xs text-muted-foreground">of 50 GB</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared Documents</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">89</div>
              <p className="text-xs text-muted-foreground">Active collaborations</p>
            </CardContent>
          </Card>
        </div>

        {/* Document Management Interface */}
        <Tabs defaultValue="all-documents" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all-documents" data-testid="tab-all-documents">All Documents</TabsTrigger>
            <TabsTrigger value="shared" data-testid="tab-shared-docs">Shared</TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
            <TabsTrigger value="archived" data-testid="tab-archived">Archived</TabsTrigger>
            <TabsTrigger value="workflow" data-testid="tab-workflow">Workflow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`card-document-${doc.id}`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground" data-testid={`document-name-${doc.id}`}>{doc.name}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`document-details-${doc.id}`}>
                            {doc.type} • {doc.size} • {doc.category}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`document-modified-${doc.id}`}>
                            Modified {doc.lastModified}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-view-document-${doc.id}`} onClick={() => toast({ title: "Document Viewer", description: "Document preview coming soon!" })}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-share-document-${doc.id}`} onClick={() => toast({ title: "Share Document", description: "Document sharing coming soon!" })}>
                          <Share className="mr-1 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="shared">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Share2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Shared Documents</h3>
                  <p className="text-muted-foreground mb-4">Collaborative documents and team sharing</p>
                  <Button onClick={() => toast({ title: "Shared Documents", description: "Document collaboration coming soon!" })}>
                    <Users className="mr-2 h-4 w-4" />
                    View Shared
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Copy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Document Templates</h3>
                  <p className="text-muted-foreground mb-4">Standardized templates for common documents</p>
                  <Button onClick={() => toast({ title: "Templates", description: "Document templates coming soon!" })}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Browse Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="archived">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Archived Documents</h3>
                  <p className="text-muted-foreground mb-4">Historical document archive</p>
                  <Button onClick={() => toast({ title: "Archive", description: "Document archive coming soon!" })}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    View Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="workflow">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Route className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Document Workflow</h3>
                  <p className="text-muted-foreground mb-4">Approval workflows and document routing</p>
                  <Button onClick={() => toast({ title: "Workflow", description: "Document workflow system coming soon!" })}>
                    <Play className="mr-2 h-4 w-4" />
                    Manage Workflows
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}