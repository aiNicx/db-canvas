import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { validateTable } from '@/utils/validation';
import { handleError } from '@/utils/errorHandling';
import { TableNode, Project, Position } from '@/types/schema';

// Update the type of updateProject to accept the updater function
export const useTables = (
  project: Project | null,
  updateProject: (updater: (prevProject: Project | null) => Project) => void
): {
  tables: TableNode[];
  addTable: (table: Omit<TableNode, 'id' | 'position'>, position: Position) => TableNode | null;
  updateTable: (table: TableNode) => boolean;
  deleteTable: (id: string) => boolean;
  duplicateTable: (id: string) => TableNode | null;
} => {
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
    table: Omit<TableNode, 'id' | 'position'>,
    position: Position
  ): TableNode | null => {
    if (!project) {
      handleError(new Error('No project open'), 'No project open', {
        context: 'useTables.addTable',
      });
      return null;
    }

    const newTable: TableNode = {
      id: uuidv4(),
      ...table,
      position,
    };

    // Validate table before adding
    const validation = validateTable(newTable);
    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return null;
    }

    // Update project state using Immer
    updateProject(
      produce((draft) => {
        draft.tables.push(newTable);
        draft.updatedAt = new Date().toISOString();
        setTables(draft.tables); // Keep local state sync
      })
    );

    return newTable;
  };

  const updateTable = (table: TableNode): boolean => {
    if (!project) {
      handleError(new Error('No project open'), 'No project open', {
        context: 'useTables.updateTable',
      });
      return false;
    }

    const updatedTables = tables.map((t) => (t.id === table.id ? table : t));

    // Validate table before updating
    const validation = validateTable(table);
    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return false;
    }

    // Update project state using Immer
    updateProject(
      produce((draft) => {
        draft.tables = updatedTables;
        draft.updatedAt = new Date().toISOString();
        setTables(draft.tables); // Keep local state sync
      })
    );

    return true;
  };

  const deleteTable = (id: string): boolean => {
    if (!project) {
      toast.error('No project open');
      return false;
    }

    const updatedTables = tables.filter((t) => t.id !== id);

    // Update project state using Immer
    updateProject(
      produce((draft) => {
        draft.tables = updatedTables;
        draft.updatedAt = new Date().toISOString();
        setTables(draft.tables); // Keep local state sync
      })
    );

    return true;
  };

  const duplicateTable = (id: string): TableNode | null => {
    if (!project) {
      toast.error('No project open');
      return null;
    }

    const originalTable = tables.find((t) => t.id === id);
    if (!originalTable) {
      toast.error('Table not found');
      return null;
    }

    // Create a deep copy and generate new field IDs
    const duplicatedFields = originalTable.fields.map((field) => ({
      ...field,
      id: uuidv4(), // Generate new unique ID for each field
      // Reset foreign key if needed, or handle duplication logic carefully
      // For now, let's keep FK but it might point to the original table's fields
      // A more robust solution might involve updating FKs based on duplicated table context
    }));

    const newTable: TableNode = {
      ...originalTable, // Copy all properties
      id: uuidv4(), // New unique ID for the table
      name: `${originalTable.name} (Copy)`, // Append copy indicator
      position: {
        // Offset position slightly
        x: originalTable.position.x + 20,
        y: originalTable.position.y + 20,
      },
      fields: duplicatedFields, // Use fields with new IDs
    };

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
      const updatedTables = [...prevProject.tables, newTable];
      setTables(updatedTables); // Keep local state sync
      return {
        ...prevProject,
        tables: updatedTables,
        updatedAt: new Date().toISOString(),
      };
    });

    return newTable;
  };

  return {
    tables,
    addTable,
    updateTable,
    deleteTable,
    duplicateTable, // Add duplicateTable here
  };
};
