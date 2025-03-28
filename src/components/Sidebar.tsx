
import { useState } from 'react';
import { useProject } from '@/hooks/useProject'; // Updated import path
import { TableNode } from '@/types/schema';
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
  PaintBucket,
  Link
} from 'lucide-react';
import { toast } from 'sonner';

interface SidebarProps {
  onEditTable?: (tableId: string) => void;
}


export function Sidebar({ onEditTable }: SidebarProps) {
  // Destructure correctly: get tablesApi and updateFullProject
  const { currentProject, tablesApi, updateFullProject } = useProject();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableNode | null>(null);
  const tableColors = [
    { name: "Default", value: "" },
    { name: "Blue", value: "blue" },
    { name: "Red", value: "red" },
    { name: "Green", value: "green" },
    { name: "Amber", value: "amber" },
    { name: "Purple", value: "purple" },
    { name: "Pink", value: "pink" },
  ];

  // Generate SQL preview for a specific table
  const generateTableSQL = (table: TableNode): string => {
    let sql = `CREATE TABLE ${table.name} (\n`;
    
    table.fields.forEach((field, index) => {
      const comma = index < table.fields.length - 1 ? ',' : '';
      sql += `  ${field.name} ${field.type}${field.notNull ? ' NOT NULL' : ''}${field.primary ? ' PRIMARY KEY' : ''}${field.unique && !field.primary ? ' UNIQUE' : ''}${comma}\n`;
    });
    
    // Add foreign key references if any fields have them
    const foreignKeyFields = table.fields.filter(f => f.foreignKey);
    if (foreignKeyFields.length > 0 && currentProject) {
      sql += ',\n';
      foreignKeyFields.forEach((field, index) => {
        if (field.foreignKey) {
          const targetTable = currentProject.tables.find(t => t.id === field.foreignKey?.tableId);
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

  const handleTableClick = (table: TableNode) => {
    setSelectedTable(table);
  };

  const handleEditTable = (table: TableNode) => {
    if (onEditTable) {
      onEditTable(table.id);
    }
  };

  const handleDeleteTable = (tableId: string, tableName: string) => {
    if (confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      tablesApi.deleteTable(tableId); // Use tablesApi
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
      toast.success(`Table "${tableName}" deleted`);
    }
  };

  const changeTableColor = (table: TableNode, color: string) => {
    if (!currentProject) return;
    
    const updatedTables = currentProject.tables.map(t => {
      if (t.id === table.id) {
        return { ...t, color };
      }
      return t;
    });
    
    updateFullProject({ // Use updateFullProject
      ...currentProject,
      tables: updatedTables,
    });
    
    // Also update the selected table if it's the one being modified
    if (selectedTable?.id === table.id) {
      setSelectedTable({ ...selectedTable, color });
    }
    
    toast.success(`Table color updated`);
  };

  if (collapsed) {
    return (
      <div className="w-12 border-l bg-card flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="mb-4"
        >
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
    <div className="w-80 border-l bg-card flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Project Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(true)}
        >
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

        <TabsContent value="tables" className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {currentProject?.tables.map((table) => (
                <div
                  key={table.id}
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
                    <span className="text-xs opacity-70">
                      ({table.fields.length})
                    </span>
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
        </TabsContent>

        <TabsContent value="properties" className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4">
              {selectedTable ? (
                <div className="space-y-4">
                  <h3 className="font-medium">{selectedTable.name}</h3>
                  
                  {/* Color selector */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Table Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {tableColors.map(color => (
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
                      <div
                        key={index}
                        className="p-3 text-sm border rounded-md bg-background"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium flex items-center gap-1">
                            {field.primary && (
                              <span className="text-amber-500 text-xs bg-amber-100 dark:bg-amber-950/50 px-1 rounded">PK</span>
                            )}
                            {field.foreignKey && (
                              <span className="text-primary text-xs bg-primary/10 px-1 rounded flex items-center">
                                <Link className="h-3 w-3 mr-0.5" />FK
                              </span>
                            )}
                            <span className="ml-1">{field.name}</span>
                          </span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {field.type}
                          </span>
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
                              {currentProject.tables.find(t => t.id === field.foreignKey?.tableId)?.name}.
                              {field.foreignKey.fieldName}
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

        <TabsContent value="sql" className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1">
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
