
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import { TableNode } from "@/types/schema";
import { DBCanvas } from "@/components/DBCanvas";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database, ArrowLeft, Plus, Save, Download, Grid, Layers } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddTableDialog } from "@/components/AddTableDialog";

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, openProject, currentProject, updateProject } = useProject();
  const [showGrid, setShowGrid] = useState(true);
  const [showAddTable, setShowAddTable] = useState(false);

  useEffect(() => {
    if (id) {
      openProject(id);
    }
  }, [id, openProject]);

  const handleExportSQL = () => {
    if (!currentProject) return;
    
    // In a real implementation, this would generate proper SQL
    const sql = `/* SQL export for ${currentProject.name} */\n\n`;
    
    // Create a download link
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '_')}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("SQL exported successfully");
  };

  const handleAddTable = (tableData: Omit<TableNode, "id" | "position">) => {
    try {
      // Add table at center of the canvas
      // In a real implementation, we would calculate a good position
      const position = { x: 100, y: 100 };
      const newTable = { ...tableData, position };
      
      // This is a placeholder - the actual addTable would be called here
      
      setShowAddTable(false);
      toast.success(`Table "${tableData.name}" added`);
    } catch (error) {
      console.error("Failed to add table", error);
      toast.error("Failed to add table");
    }
  };

  if (!currentProject) {
    // Project not found or not loaded yet
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Layers className="h-12 w-12 text-primary mx-auto mb-4 animate-float" />
          <h2 className="text-2xl font-semibold mb-2">Loading project...</h2>
          <p className="text-muted-foreground mb-4">Please wait while we load your project.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-card z-10">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">{currentProject.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? "bg-accent" : ""}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowAddTable(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Table</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleExportSQL}
            >
              <Download className="h-4 w-4" />
              <span>Export SQL</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          <DBCanvas project={currentProject} showGrid={showGrid} />
        </div>
        <Sidebar />
      </div>

      <AddTableDialog
        open={showAddTable}
        onOpenChange={setShowAddTable}
        onAddTable={handleAddTable}
      />
    </div>
  );
};

export default Editor;
