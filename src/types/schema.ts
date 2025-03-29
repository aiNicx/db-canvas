import { useTables } from '@/hooks/useTables';
import { useConnections } from '@/hooks/useConnections';

export interface Position {
  x: number;
  y: number;
}

export type FieldType =
  | 'INT'
  | 'VARCHAR'
  | 'TEXT'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'DECIMAL'
  | 'FLOAT'
  | 'DOUBLE'
  | 'TIMESTAMP'
  | 'JSON'
  | string;

export interface Field<T extends FieldType = FieldType> {
  id: string;
  name: string;
  type: T;
  notNull: boolean;
  primary: boolean;
  unique: boolean;
  defaultValue?: string | number | boolean | null;
  foreignKey?: {
    tableId: string;
    fieldName: string;
  };
}

// Interface to represent a database data type, potentially with parameters
export interface DataType {
  name: string; // e.g., 'VARCHAR', 'INT', 'DECIMAL'
  params?: number[]; // e.g., [255] for VARCHAR(255), [10, 2] for DECIMAL(10,2)
  // We might add more properties later, like requiresParams: boolean
}

// Example list of common data types (can be expanded)
export const COMMON_DATA_TYPES: DataType[] = [
  { name: 'INT' },
  { name: 'VARCHAR', params: [255] },
  { name: 'TEXT' },
  { name: 'DATE' },
  { name: 'DATETIME' },
  { name: 'BOOLEAN' },
  { name: 'DECIMAL', params: [10, 2] },
  { name: 'FLOAT' },
  { name: 'DOUBLE' },
];

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
  relationshipType: 'oneToOne' | 'oneToMany';
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

export type RelationType = 'oneToOne' | 'oneToMany';

export interface SQLExportOptions {
  dialect: 'mysql' | 'postgresql' | 'sqlite';
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
  exportProjectSQL: (id: string, dbType: 'mysql' | 'postgresql' | 'sqlite') => string; // Added export function
}
