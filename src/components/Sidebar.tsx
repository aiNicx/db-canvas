import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useProject } from '@/hooks/useProject';
import { TableNode, Field } from '@/types/schema';
import { Connection } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code,
  TableProperties,
  Columns,
  ChevronRight,
  ChevronLeft,
  Edit,
  Trash2,
  // PaintBucket, // Removed unused import
  Link,
  Copy,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface SidebarProps {
  onEditTable?: (tableId: string) => void;
}

// Interface for the imported JSON column definition
interface ImportedColumnDef {
  table_name: string;
  column_name: string;
  data_type: string;
  column_default?: string | null;
  is_nullable?: string; // "YES" or "NO"
  referenced_table_name?: string | null; // Added for FK
  referenced_column_name?: string | null; // Added for FK
}

export function Sidebar({ onEditTable }: SidebarProps): JSX.Element {
  // Destructure correctly: get tablesApi and updateFullProject
  const { currentProject, tablesApi, updateFullProject } = useProject();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableNode | null>(null);
  const tablesListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const tableColors = [
    { name: 'Default', value: '' },
    { name: 'Blue', value: 'blue' },
    { name: 'Red', value: 'red' },
    { name: 'Green', value: 'green' },
    { name: 'Amber', value: 'amber' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
  ];

  // Effect to scroll the selected table into view
  useEffect(() => {
    if (selectedTable && tablesListRef.current) {
      const tableElement = tablesListRef.current.querySelector(
        `[data-table-id="${selectedTable.id}"]`
      );
      if (tableElement) {
        tableElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedTable]);

  // Generate SQL preview for a specific table
  const generateTableSQL = (table: TableNode): string => {
    let sql = `CREATE TABLE ${table.name} (\n`;

    table.fields.forEach((field, index) => {
      const comma = index < table.fields.length - 1 ? ',' : '';
      sql += `  ${field.name} ${field.type}${field.notNull ? ' NOT NULL' : ''}${field.primary ? ' PRIMARY KEY' : ''}${field.unique && !field.primary ? ' UNIQUE' : ''}${comma}\n`;
    });

    // Add foreign key references if any fields have them
    const foreignKeyFields = table.fields.filter((f) => f.foreignKey);
    if (foreignKeyFields.length > 0 && currentProject) {
      sql += ',\n';
      foreignKeyFields.forEach((field, index) => {
        if (field.foreignKey) {
          const targetTable = currentProject.tables.find((t) => t.id === field.foreignKey?.tableId);
          if (targetTable) {
            const comma = index < foreignKeyFields.length - 1 ? ',' : '';
            sql += `  FOREIGN KEY (${field.name}) REFERENCES ${targetTable.name}(${field.foreignKey.fieldName})${comma}\n`;
          }
        }
      });
    }

    sql += ');';
    return sql;
  };

  const handleTableClick = (table: TableNode): void => {
    setSelectedTable(table);
  };

  // Re-applying the definition to potentially refresh linter state
  const handleDuplicateTable = (tableId: string, tableName: string): void => {
    tablesApi.duplicateTable(tableId);
    toast.success(`Table "${tableName}" duplicated`);
  };

  const handleEditTable = (table: TableNode): void => {
    if (onEditTable) {
      onEditTable(table.id);
    }
  };

  const handleDeleteTable = (tableId: string, tableName: string): void => {
    if (confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      tablesApi.deleteTable(tableId); // Use tablesApi
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
      toast.success(`Table "${tableName}" deleted`);
    }
  };

  const changeTableColor = (table: TableNode, color: string): void => {
    if (!currentProject) return;

    const updatedTables = currentProject.tables.map((t) => {
      if (t.id === table.id) {
        return { ...t, color };
      }
      return t;
    });

    // Pass an updater function to updateFullProject
    updateFullProject((prevProject) => {
      if (!prevProject) return currentProject; // Should not happen, but safety first
      return {
        ...prevProject,
        tables: updatedTables,
        updatedAt: new Date().toISOString(), // Also update the timestamp
      };
    });

    // Also update the selected table if it's the one being modified
    if (selectedTable?.id === table.id) {
      setSelectedTable({ ...selectedTable, color });
    }

    toast.success(`Table color updated`);
  };

  // --- Import JSON Logic ---
  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>): void => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);

        // Basic validation (check if it's an array)
        if (!Array.isArray(jsonData)) {
          throw new Error('Invalid JSON format: Expected an array of column definitions.');
        }

        // TODO: More robust validation of the JSON structure against expected schema

        // Process the JSON data
        processImportedJson(jsonData);

        toast.success('Project imported successfully from JSON!');
      } catch (error) {
        console.error('Error importing JSON:', error);
        toast.error(
          `Error importing JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        // Reset file input value to allow importing the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = (): void => {
      toast.error('Error reading file.');
      // Reset file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Function to process the parsed JSON data and update the project state
  const processImportedJson = (jsonData: ImportedColumnDef[]): void => {
    if (!updateFullProject) return; // Ensure update function exists

    const tablesMap = new Map<string, TableNode>();
    // Keep track of fields created, mapping original colDef to the created Field object
    const fieldCreationMap = new Map<ImportedColumnDef, Field>();

    // --- First Pass: Create Tables and Fields ---
    jsonData.forEach((colDef) => {
      const tableName = colDef.table_name;
      if (!tableName) return;

      let table = tablesMap.get(tableName);
      if (!table) {
        table = {
          id: uuidv4(),
          name: tableName,
          fields: [],
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          color: '',
        };
        tablesMap.set(tableName, table);
      }

      const field: Field = {
        id: uuidv4(),
        name: colDef.column_name || `field_${table.fields.length + 1}`,
        type: colDef.data_type || 'text',
        primary: false,
        unique: false,
        notNull: colDef.is_nullable === 'NO',
        defaultValue: colDef.column_default,
        foreignKey: null, // Initialize FK as null
      };

      if (field.name.toLowerCase() === 'id') {
        field.primary = true;
      }

      table.fields.push(field);
      fieldCreationMap.set(colDef, field); // Map original def to created field
    });

    const newTables = Array.from(tablesMap.values());
    const newConnections: Connection[] = []; // Array to hold connections

    // --- Second Pass: Create Connections and Update FKs ---
    jsonData.forEach((colDef) => {
      if (colDef.referenced_table_name && colDef.referenced_column_name) {
        const sourceTable = tablesMap.get(colDef.table_name);
        const targetTable = tablesMap.get(colDef.referenced_table_name);

        // Find the source field object using the map
        const sourceField = fieldCreationMap.get(colDef);

        if (sourceTable && targetTable && sourceField) {
          // Find the target field object within the target table
          const targetField = targetTable.fields.find(
            (f) => f.name === colDef.referenced_column_name
          );

          if (targetField) {
            // 1. Update the source field's foreignKey property
            sourceField.foreignKey = {
              tableId: targetTable.id,
              fieldName: targetField.name, // Store target field name for display/info
            };

            // 2. Create the Connection object
            const newConnection: Connection = {
              id: uuidv4(),
              sourceId: sourceTable.id,
              targetId: targetTable.id,
              sourceField: sourceField.name, // Use field NAME
              targetField: targetField.name, // Use field NAME
              // Defaulting to oneToMany. Determining oneToOne might require checking unique constraints on the sourceField.
              relationshipType: 'oneToMany',
            };
            newConnections.push(newConnection);
          } else {
            console.warn(
              `Could not find target field '${colDef.referenced_column_name}' in table '${colDef.referenced_table_name}' for FK from ${colDef.table_name}.${colDef.column_name}`
            );
          }
        } else {
          if (!sourceTable)
            console.warn(`Could not find source table '${colDef.table_name}' for FK.`);
          if (!targetTable)
            console.warn(`Could not find target table '${colDef.referenced_table_name}' for FK.`);
          if (!sourceField)
            console.warn(
              `Could not find source field mapping for ${colDef.table_name}.${colDef.column_name}.`
            );
        }
      }
    });

    // --- Update Project State ---
    updateFullProject((prevProject) => {
      const baseProject = prevProject || {
        id: uuidv4(),
        name: 'Imported Project',
        tables: [],
        connections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...baseProject,
        tables: newTables,
        connections: newConnections, // Add connections here
        updatedAt: new Date().toISOString(),
      };
    });
  };
  // --- End Import JSON Logic ---

  if (collapsed) {
    return (
      <div className="w-12 border-l bg-card flex flex-col items-center py-4">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="mb-4">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size="icon">
            <TableProperties className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Columns className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Project Details</h3>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="tables" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <TableProperties className="h-4 w-4" />
            <span>Tables ({currentProject?.tables.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Columns className="h-4 w-4" />
            <span>Properties</span>
          </TabsTrigger>
          <TabsTrigger value="sql" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span>SQL</span>
          </TabsTrigger>
        </TabsList>

        {/* Fixed Tab Content - Each tab content now has a fixed height and proper overflow handling */}
        <TabsContent value="tables" className="flex-1 flex flex-col p-0">
          <div className="p-4 border-b">
            <Button onClick={handleImportClick} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import from JSON
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={tablesListRef} className="p-4 space-y-2">
                {currentProject?.tables.map((table) => (
                  <div
                    key={table.id}
                    data-table-id={table.id}
                    className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                      selectedTable?.id === table.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => handleTableClick(table)}
                  >
                    <div className="flex items-center gap-2">
                      <TableProperties className="h-4 w-4" />
                      <span>{table.name}</span>
                      <span className="text-xs opacity-70">({table.fields.length})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTable(table);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTable(table.id, table.name);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id, table.name);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {currentProject?.tables.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TableProperties className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tables in this project</p>
                    <p className="text-sm">Click "Add Table" to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {selectedTable ? (
                <div className="space-y-4">
                  <h3 className="font-medium">{selectedTable.name}</h3>

                  {/* Color selector */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Table Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {tableColors.map((color) => (
                        <button
                          key={color.value}
                          className={`w-6 h-6 rounded-full ${
                            color.value ? `bg-${color.value}-500` : 'bg-card border'
                          } ${selectedTable.color === color.value ? 'ring-2 ring-primary' : ''}`}
                          title={color.name}
                          onClick={() => changeTableColor(selectedTable, color.value)}
                          aria-label={`Set table color to ${color.name}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Fields</h4>
                    {selectedTable.fields.map((field, index) => (
                      <div key={index} className="p-3 text-sm border rounded-md bg-background">
                        <div className="flex justify-between items-center">
                          <span className="font-medium flex items-center gap-1">
                            {field.primary && (
                              <span className="text-amber-500 text-xs bg-amber-100 dark:bg-amber-950/50 px-1 rounded">
                                PK
                              </span>
                            )}
                            {field.foreignKey && (
                              <span className="text-primary text-xs bg-primary/10 px-1 rounded flex items-center">
                                <Link className="h-3 w-3 mr-0.5" />
                                FK
                              </span>
                            )}
                            <span className="ml-1">{field.name}</span>
                          </span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">{field.type}</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          {field.notNull && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                              NOT NULL
                            </span>
                          )}
                          {field.unique && !field.primary && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                              UNIQUE
                            </span>
                          )}
                          {field.defaultValue && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                              DEFAULT: {field.defaultValue}
                            </span>
                          )}
                        </div>

                        {field.foreignKey && currentProject && (
                          <div className="mt-2 text-xs p-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground">References: </span>
                            <span className="font-medium">
                              {
                                currentProject.tables.find(
                                  (t) => t.id === field.foreignKey?.tableId
                                )?.name
                              }
                              .{field.foreignKey.fieldName}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleEditTable(selectedTable)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Table
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Columns className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No table selected</p>
                  <p className="text-sm">Select a table to see its properties</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sql" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {selectedTable ? (
                <div className="space-y-4">
                  <h3 className="font-medium">SQL for {selectedTable.name}</h3>
                  <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto whitespace-pre">
                    {generateTableSQL(selectedTable)}
                  </pre>
                </div>
              ) : currentProject?.tables.length ? (
                <div className="space-y-6">
                  <div className="text-center py-4 text-muted-foreground">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No table selected</p>
                    <p className="text-sm">Select a table to see its SQL</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Full Database SQL</h3>
                    <div className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      <pre className="whitespace-pre">
                        {currentProject.tables.map(generateTableSQL).join('\n\n')}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tables in this project</p>
                  <p className="text-sm">Add tables to generate SQL</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
