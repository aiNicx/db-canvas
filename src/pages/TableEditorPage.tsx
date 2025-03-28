
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, TableNode } from "@/types/schema";
import { FieldEditorTable } from "@/components/FieldEditorTable";
import { useProject } from "@/hooks/useProject";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const TABLE_COLORS = [
  { name: "Default", value: "" },
  { name: "Blue", value: "blue" },
  { name: "Red", value: "red" },
  { name: "Green", value: "green" },
  { name: "Purple", value: "purple" },
  { name: "Amber", value: "amber" },
  { name: "Pink", value: "pink" },
];

export function TableEditorPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { tablesApi, currentProject } = useProject();
  
  const [tableName, setTableName] = useState("");
  const [tableColor, setTableColor] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Load table data if editing
  useEffect(() => {
    if (tableId) {
      const table = currentProject?.tables.find(t => t.id === tableId);
      if (table) {
        setIsEditing(true);
        setTableName(table.name);
        setTableColor(table.color || "");
        setFields(table.fields.map(f => ({ ...f })));
      }
    } else {
      // Default fields for new table
      setFields([{
        id: uuidv4(),
        name: "id",
        type: "INT",
        notNull: true,
        primary: true,
        unique: true
      }]);
    }
  }, [tableId, currentProject]);

  const handleFieldsChange = (newFields: Field[]) => {
    setFields(newFields);
  };

  const handleSubmit = () => {
    if (!tableName.trim()) {
      toast.error("Table name is required");
      return;
    }

    for (const field of fields) {
      if (!field.name.trim() || !field.type) {
        toast.error("All fields must have a name and type");
        return;
      }
    }

    if (isEditing && tableId) {
      const table = currentProject?.tables.find(t => t.id === tableId);
      if (table) {
        tablesApi.updateTable({
          ...table,
          name: tableName,
          color: tableColor,
          fields,
          position: table.position // Ensure position is included
        });
      }
      toast.success("Table updated successfully");
    } else if (currentProject) {
      tablesApi.addTable(
        {
          name: tableName,
          color: tableColor,
          fields
        },
        { x: 0, y: 0 } // Default position
      );
      toast.success("Table created successfully");
    } else {
      toast.error("No project selected");
    }

    navigate(-1);
  };

  const availableTablesForFK = currentProject?.tables
    .filter(t => t.id !== tableId)
    .map(t => ({ id: t.id, name: t.name, fields: t.fields })) || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Table" : "Create New Table"}
      </h1>
      
      <div className="space-y-8">
        {/* Table Details Section */}
        <div className="space-y-4 bg-slate-900/50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Table Details</h2>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tableName">Table Name</Label>
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Enter table name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Table Color</Label>
              <RadioGroup 
                value={tableColor}
                onValueChange={setTableColor}
                className="flex flex-wrap gap-x-3 gap-y-2"
              >
                {TABLE_COLORS.map((color) => {
                  const colorClassMap: { [key: string]: string } = {
                    blue: "bg-blue-500 border-blue-600",
                    red: "bg-red-500 border-red-600",
                    green: "bg-green-500 border-green-600",
                    purple: "bg-purple-500 border-purple-600",
                    amber: "bg-amber-500 border-amber-600",
                    pink: "bg-pink-500 border-pink-600",
                    "": "bg-gray-300 border-gray-400",
                  };
                  const colorSpecificClasses = colorClassMap[color.value] || colorClassMap[""];

                  return (
                    <div key={color.value} className="flex items-center space-x-1.5">
                      <RadioGroupItem
                        value={color.value}
                        id={`color-${color.value || 'default'}`}
                        className={`h-5 w-5 rounded-full border-2 ${colorSpecificClasses} data-[state=checked]:ring-2 data-[state=checked]:ring-ring data-[state=checked]:ring-offset-2 focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                        aria-label={color.name}
                      />
                      <Label htmlFor={`color-${color.value || 'default'}`}>{color.name}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Fields Section */}
        <div className="space-y-4 bg-slate-900/50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Fields</h2>
          <FieldEditorTable
            fields={fields}
            onChange={handleFieldsChange}
            availableTables={availableTablesForFK}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {isEditing ? "Save Changes" : "Create Table"}
        </Button>
      </div>
    </div>
  );
}
