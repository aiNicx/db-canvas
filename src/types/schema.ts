import { useTables } from "@/hooks/useTables";
import { useConnections } from "@/hooks/useConnections";


export interface Position {
  x: number;
  y: number;
}

export interface Field {
  name: string;
  type: string;
  notNull: boolean;
  primary: boolean;
  unique: boolean;
  defaultValue?: string;
  foreignKey?: {
    tableId: string;
    fieldName: string;
  };
}

export interface TableNode {
  id: string;
  name: string;
  fields: Field[];
  position: Position;
  color?: string; // Color property for table styling
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceField: string;
  targetField: string;
  relationshipType: "oneToOne" | "oneToMany";
}

export interface Project {
  id: string;
  name: string;
  tables: TableNode[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
}

export type RelationType = "oneToOne" | "oneToMany";

export interface SQLExportOptions {
  dialect: "mysql" | "postgresql" | "sqlite";
  includeDropStatements: boolean;
  includeTimestamps: boolean;
}


// Type for the Project Context
export interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  tablesApi: ReturnType<typeof useTables>;
  connectionsApi: ReturnType<typeof useConnections>;
  createProject: (name: string) => Project;
  openProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  // Update function now accepts an updater function for safe state updates
  updateFullProject: (updater: (prevProject: Project | null) => Project) => void;
  exportProjectSQL: (id: string, dbType: "mysql" | "postgresql" | "sqlite") => string; // Added export function
}
