
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
  color?: string; // Optional color property
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
