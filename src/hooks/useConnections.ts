import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { validateConnection } from '@/utils/validation';
import { handleError } from '@/utils/errorHandling';
import { Connection as DBConnection, Project } from '@/types/schema';

// Update the type of updateProject to accept the updater function
export const useConnections = (
  project: Project | null,
  updateProject: (updater: (prevProject: Project | null) => Project) => void
): {
  connections: DBConnection[];
  addConnection: (connection: Omit<DBConnection, 'id'>) => DBConnection | null;
  updateConnection: (connection: DBConnection) => boolean;
  deleteConnection: (id: string) => boolean;
  validateConnection: typeof validateConnection;
} => {
  const [connections, setConnections] = useState<DBConnection[]>(project?.connections || []);

  useEffect(() => {
    if (project) {
      setConnections(project.connections);
    } else {
      // Reset connections if the project becomes null
      setConnections([]);
    }
  }, [project]);

  const addConnection = (connection: Omit<DBConnection, 'id'>): DBConnection | null => {
    if (!project) {
      handleError(new Error('No project open'), 'No project open', {
        context: 'useConnections.addConnection',
      });
      return null;
    }

    const validation = validateConnection({ ...connection, id: '' }, project.tables);
    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return null;
    }

    const newConnection: DBConnection = {
      id: uuidv4(),
      ...connection,
    };

    // Update project state using Immer
    updateProject(
      produce((draft) => {
        draft.connections.push(newConnection);
        draft.updatedAt = new Date().toISOString();
        setConnections(draft.connections); // Keep local state sync
      })
    );

    return newConnection;
  };

  const updateConnection = (connection: DBConnection): boolean => {
    if (!project) {
      toast.error('No project open');
      return false;
    }

    const validation = validateConnection(connection, project.tables);
    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return false;
    }

    const updatedConnections = connections.map((c) => (c.id === connection.id ? connection : c));

    // Update project state using Immer
    updateProject(
      produce((draft) => {
        draft.connections = updatedConnections;
        draft.updatedAt = new Date().toISOString();
        setConnections(draft.connections); // Keep local state sync
      })
    );

    return true;
  };

  const deleteConnection = (id: string): boolean => {
    if (!project) {
      handleError(new Error('No project open'), 'No project open', {
        context: 'useConnections.updateConnection',
      });
      return false;
    }

    // Find the connection being deleted to get source info
    const connectionToDelete = project.connections.find((c) => c.id === id);

    if (!connectionToDelete) {
      toast.error('Connection not found for deletion');
      return false;
    }

    // Update project state using the updater function
    updateProject((prevProject) => {
      if (!prevProject) {
        // Fallback to current project if prevProject is null (shouldn't happen)
        return project ?? {
          id: '',
          name: '',
          tables: [],
          connections: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // 1. Filter out the deleted connection
      const updatedConnections = prevProject.connections.filter((c) => c.id !== id);

      // 2. Remove the foreign key from the source table's field
      const updatedTables = prevProject.tables.map((table) => {
        if (table.id === connectionToDelete.sourceId) {
          return {
            ...table,
            fields: table.fields.map((field) => {
              if (field.name === connectionToDelete.sourceField && field.foreignKey) {
                // Return a new field object without the foreignKey property
                return {
                  ...field,
                  foreignKey: undefined
                };
              }
              return field;
            }),
          };
        }
        return table;
      });

      // REMOVED: setConnections(updatedConnections); - Local state sync is not needed here,
      // the component should react to the updated project prop.

      return {
        ...prevProject,
        connections: updatedConnections,
        tables: updatedTables, // Include updated tables
        updatedAt: new Date().toISOString(),
      };
    });

    toast.success('Connection deleted');
    return true;
  };

  return {
    connections,
    addConnection,
    updateConnection,
    deleteConnection,
    validateConnection,
  };
};
