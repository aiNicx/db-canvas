
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, TableNode } from "@/types/schema";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProject } from "@/hooks/useProject"; // Updated import path
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableNode;
}

const DATA_TYPES = [
  "INT",
  "VARCHAR(255)",
  "TEXT",
  "DATE",
  "DATETIME",
  "BOOLEAN",
  "DECIMAL(10,2)",
  "FLOAT",
  "DOUBLE",
];

const TABLE_COLORS = [
  { name: "Default", value: "" },
  { name: "Blue", value: "blue" },
  { name: "Red", value: "red" },
  { name: "Green", value: "green" },
  { name: "Purple", value: "purple" },
  { name: "Amber", value: "amber" },
  { name: "Pink", value: "pink" },
];

export function EditTableDialog({
  open,
  onOpenChange,
  table,
}: EditTableDialogProps) {
  const { tablesApi } = useProject(); // Destructure tablesApi instead
  const [tableName, setTableName] = useState(table.name);
  const [tableColor, setTableColor] = useState(table.color || "");
  const [fields, setFields] = useState<Omit<Field, "foreignKey">[]>([]);

  // Initialize the form with the table data when it changes
  useEffect(() => {
    if (table) {
      setTableName(table.name);
      setTableColor(table.color || "");
      
      // We need to exclude foreignKey property for our form
      const formFields = table.fields.map(field => {
        const { foreignKey, ...rest } = field;
        return rest;
      });
      
      setFields(formFields);
    }
  }, [table]);

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: "",
        type: "VARCHAR(255)",
        notNull: false,
        primary: false,
        unique: false,
      },
    ]);
  };

  const handleFieldChange = (
    index: number,
    field: Partial<Omit<Field, "foreignKey">>
  ) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleSubmit = () => {
    // Validate table name
    if (!tableName.trim()) {
      toast.error("Table name cannot be empty");
      return;
    }

    // Validate fields
    for (const field of fields) {
      if (!field.name.trim() || !field.type) {
        toast.error("All fields must have a name and type");
        return;
      }
    }

    // Preserve foreignKey properties from original fields
    const updatedFields = fields.map(field => {
      const originalField = table.fields.find(f => f.name === field.name);
      return {
        ...field,
        foreignKey: originalField?.foreignKey,
      };
    });

    // Update the table using tablesApi
    tablesApi.updateTable({
      ...table,
      name: tableName,
      color: tableColor,
      fields: updatedFields,
    });

    toast.success("Table updated successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
          <DialogDescription>
            Update table structure and appearance. Changes will be saved to your project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
              className="flex flex-wrap gap-2"
            >
              {TABLE_COLORS.map((color) => (
                <div key={color.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={color.value} 
                    id={`color-${color.value || 'default'}`}
                    className={color.value ? `bg-${color.value}-500 border-${color.value}-500` : ''}
                  />
                  <Label htmlFor={`color-${color.value || 'default'}`}>{color.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Fields</Label>
              <Button
                type="button"
                size="sm"
                onClick={handleAddField}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-md bg-background">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`fieldName-${index}`}>Name</Label>
                    <Input
                      id={`fieldName-${index}`}
                      value={field.name}
                      onChange={(e) =>
                        handleFieldChange(index, { name: e.target.value })
                      }
                      placeholder="Field name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`fieldType-${index}`}>Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        handleFieldChange(index, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 items-center pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`fieldNotNull-${index}`}
                      checked={field.notNull}
                      onCheckedChange={(checked) =>
                        handleFieldChange(index, {
                          notNull: checked === true,
                        })
                      }
                    />
                    <Label htmlFor={`fieldNotNull-${index}`}>NOT NULL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`fieldPrimary-${index}`}
                      checked={field.primary}
                      onCheckedChange={(checked) => {
                        // Only one primary key allowed
                        if (checked === true) {
                          const newFields = fields.map((f, i) => ({
                            ...f,
                            primary: i === index,
                          }));
                          setFields(newFields);
                        } else {
                          handleFieldChange(index, {
                            primary: false,
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`fieldPrimary-${index}`}>
                      Primary Key
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`fieldUnique-${index}`}
                      checked={field.unique}
                      onCheckedChange={(checked) =>
                        handleFieldChange(index, {
                          unique: checked === true,
                        })
                      }
                    />
                    <Label htmlFor={`fieldUnique-${index}`}>Unique</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveField(index)}
                    className="ml-auto"
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
