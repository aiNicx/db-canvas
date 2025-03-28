
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/hooks/useProject"; // Updated import path
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import { Database, FolderPlus, Copy, Trash2, ArrowRight, Import, Layers } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, duplicateProject } = useProject();
  const [newProjectName, setNewProjectName] = useState("Untitled Project");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [sqlImport, setSqlImport] = useState("");

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const project = createProject(newProjectName);
      setIsCreateDialogOpen(false);
      navigate(`/project/${project.id}`);
    }
  };

  const handleImportProject = () => {
    // In a full implementation, this would parse the SQL and create a project
    setIsImportDialogOpen(false);
    setSqlImport("");
  };

  const handleOpenProject = (id: string) => {
    navigate(`/project/${id}`);
  };

  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">DB Canvas</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Import className="h-4 w-4" />
              <span>Import</span>
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <Tabs defaultValue="recent" className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="recent">Recent Projects</TabsTrigger>
              <TabsTrigger value="all">All Projects</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="animate-fade-in">
            {sortedProjects.length === 0 ? (
              <div className="py-32 text-center">
                <div className="inline-block p-6 mb-4 bg-primary/10 rounded-full animate-float">
                  <Layers className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">Create your first database schema project</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Project</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProjects.slice(0, 6).map((project) => (
                  <Card key={project.id} className="overflow-hidden animate-scale-in">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start justify-between">
                        <span className="truncate">{project.name}</span>
                      </CardTitle>
                      <CardDescription>
                        Updated {formatDistanceToNow(new Date(project.updatedAt))} ago
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Database className="h-4 w-4" />
                        <span>{project.tables.length} tables</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateProject(project.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="default"
                        className="flex items-center gap-2"
                        onClick={() => handleOpenProject(project.id)}
                      >
                        <span>Open</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="animate-fade-in">
            {sortedProjects.length === 0 ? (
              <div className="py-32 text-center">
                <div className="inline-block p-6 mb-4 bg-primary/10 rounded-full animate-float">
                  <Layers className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">Create your first database schema project</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Project</span>
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedProjects.map((project) => (
                    <Card key={project.id} className="overflow-hidden animate-scale-in">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-start justify-between">
                          <span className="truncate">{project.name}</span>
                        </CardTitle>
                        <CardDescription>
                          Updated {formatDistanceToNow(new Date(project.updatedAt))} ago
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Database className="h-4 w-4" />
                          <span>{project.tables.length} tables</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => duplicateProject(project.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="default"
                          className="flex items-center gap-2"
                          onClick={() => handleOpenProject(project.id)}
                        >
                          <span>Open</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new database schema design project. You can add tables and relationships once the project is created.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import from SQL</DialogTitle>
            <DialogDescription>
              Paste your SQL schema to import it as a new project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sql">SQL Schema</Label>
              <textarea
                id="sql"
                value={sqlImport}
                onChange={(e) => setSqlImport(e.target.value)}
                placeholder="Paste your SQL schema here..."
                rows={10}
                className="min-h-[200px] p-3 rounded-md border resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportProject}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
