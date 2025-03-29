// validation.ts
import { TableNode, Field, Connection } from '@/types/schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateTable = (table: TableNode): ValidationResult => {
  const errors: string[] = [];

  if (!table.name.trim()) {
    errors.push('Table name is required');
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table.name)) {
    errors.push(
      'Table name must start with a letter or underscore and contain only alphanumeric characters'
    );
  }

  if (table.fields.length === 0) {
    errors.push('Table must have at least one field');
  }

  // Validate each field
  const fieldErrors = table.fields.flatMap((field) =>
    validateField(field).errors.map((e) => `Field '${field.name}': ${e}`)
  );
  errors.push(...fieldErrors);

  return { valid: errors.length === 0, errors };
};

export const validateField = (field: Field): ValidationResult => {
  const errors: string[] = [];

  if (!field.name.trim()) {
    errors.push('Field name is required');
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
    errors.push(
      'Field name must start with a letter or underscore and contain only alphanumeric characters'
    );
  }

  if (!field.type) {
    errors.push('Field type is required');
  }

  return { valid: errors.length === 0, errors };
};

export const validateConnection = (conn: Connection, tables: TableNode[]): ValidationResult => {
  const errors: string[] = [];

  const sourceTable = tables.find((t) => t.id === conn.sourceId);
  const targetTable = tables.find((t) => t.id === conn.targetId);

  if (!sourceTable) {
    errors.push('Source table not found');
  }

  if (!targetTable) {
    errors.push('Target table not found');
  }

  if (sourceTable && !sourceTable.fields.some((f) => f.name === conn.sourceField)) {
    errors.push(`Source field '${conn.sourceField}' not found in table '${sourceTable.name}'`);
  }

  if (targetTable && !targetTable.fields.some((f) => f.name === conn.targetField)) {
    errors.push(`Target field '${conn.targetField}' not found in table '${targetTable.name}'`);
  }

  return { valid: errors.length === 0, errors };
};
