import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Connection as DBConnection, Project, TableNode } from "@/types/schema";

// Update the type of updateProject to accept the updater function
export const useConnections = (
  project: Project | null,
  updateProject: (updater: (prevProject: Project | null) => Project) => void
) => {
  const [connections, setConnections] = useState<DBConnection[]>(project?.connections || []);

  useEffect(() => {
    if (project) {
      setConnections(project.connections);
    } else {
      // Reset connections if the project becomes null
      setConnections([]);
    }
  }, [project]);

  const validateConnection = (conn: DBConnection, tables: TableNode[]): boolean => {
    const sourceTable = tables.find(t => t.id === conn.sourceId);
    const targetTable = tables.find(t => t.id === conn.targetId);
    
    if (!sourceTable || !targetTable) {
      toast.error("Invalid connection: tables not found");
      return false;
    }

    const sourceFieldExists = sourceTable.fields.some(f => f.name === conn.sourceField);
    const targetFieldExists = targetTable.fields.some(f => f.name === conn.targetField);

    if (!sourceFieldExists || !targetFieldExists) {
      toast.error("Invalid connection: fields not found");
      return false;
    }

    return true;
  };

  const addConnection = (connection: Omit<DBConnection, "id">): DBConnection | null => {
    if (!project) {
      toast.error("No project open");
      return null;
    }

    if (!validateConnection({...connection, id: ""}, project.tables)) {
      return null;
    }

    const newConnection: DBConnection = {
      id: uuidv4(),
      ...connection,
    };

    // Update project state using the updater function
    updateProject(prevProject => {
      if (!prevProject) return project!; // Should not happen
      const updatedConnections = [...prevProject.connections, newConnection];
      setConnections(updatedConnections); // Keep local state sync
      return {
        ...prevProject,
        connections: updatedConnections,
        updatedAt: new Date().toISOString()
      };
    });

    return newConnection;
  };

  const updateConnection = (connection: DBConnection): boolean => {
    if (!project) {
      toast.error("No project open");
      return false;
    }

    if (!validateConnection(connection, project.tables)) {
      return false;
    }

    const updatedConnections = connections.map(c => 
      c.id === connection.id ? connection : c
    );

    // Update project state using the updater function
    updateProject(prevProject => {
      if (!prevProject) return project!; // Should not happen
      setConnections(updatedConnections); // Keep local state sync
      return {
        ...prevProject,
        connections: updatedConnections,
        updatedAt: new Date().toISOString()
      };
    });

    return true;
  };

  const deleteConnection = (id: string): boolean => {
    if (!project) {
      toast.error("No project open");
      return false;
    }

    const updatedConnections = connections.filter(c => c.id !== id);

    // Update project state using the updater function
    updateProject(prevProject => {
      if (!prevProject) return project!; // Should not happen
      setConnections(updatedConnections); // Keep local state sync
      return {
        ...prevProject,
        connections: updatedConnections,
        updatedAt: new Date().toISOString()
      };
    });

    return true;
  };

  return {
    connections,
    addConnection,
    updateConnection,
    deleteConnection,
    validateConnection
  };
};