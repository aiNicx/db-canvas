import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { TableNode, Project, Position } from "@/types/schema";

// Update the type of updateProject to accept the updater function
export const useTables = (
  project: Project | null,
  updateProject: (updater: (prevProject: Project | null) => Project) => void
) => {
  const [tables, setTables] = useState<TableNode[]>(project?.tables || []);

  useEffect(() => {
    if (project) {
      setTables(project.tables);
    } else {
      // Reset tables if the project becomes null
      setTables([]);
    }
  }, [project]);

  const addTable = (
    table: Omit<TableNode, "id" | "position">,
    position: Position
  ): TableNode | null => {
    if (!project) {
      toast.error("No project open");
      return null;
    }

    const newTable: TableNode = {
      id: uuidv4(),
      ...table,
      position,
    };

    // Update project state using the updater function
    updateProject(prevProject => {
      if (!prevProject) return project!; // Should not happen, but satisfy TS
      const updatedTables = [...prevProject.tables, newTable];
      setTables(updatedTables); // Keep local state sync (optional but can be useful)
      return {
        ...prevProject,
        tables: updatedTables,
        updatedAt: new Date().toISOString()
      };
    });

    return newTable;
  };

  const updateTable = (table: TableNode): boolean => {
    if (!project) {
      toast.error("No project open");
      return false;
    }

    const updatedTables = tables.map(t => 
      t.id === table.id ? table : t
    );

    // Update project state using the updater function
    updateProject(prevProject => {
      if (!prevProject) return project!; // Should not happen
      setTables(updatedTables); // Keep local state sync
      return {
        ...prevProject,
        tables: updatedTables,
        updatedAt: new Date().toISOString()
      };
    });

    return true;
  };

  const deleteTable = (id: string): boolean => {
    if (!project) {
      toast.error("No project open");
      return false;
    }

    const updatedTables = tables.filter(t => t.id !== id);

    // Update project state using the updater function
    updateProject(prevProject => {
      if (!prevProject) return project!; // Should not happen
      setTables(updatedTables); // Keep local state sync
      return {
        ...prevProject,
        tables: updatedTables,
        updatedAt: new Date().toISOString()
      };
    });

    return true;
  };

  return {
    tables,
    addTable,
    updateTable,
    deleteTable
  };
};