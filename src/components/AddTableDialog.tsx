
import { useState } from "react";
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
import { Plus, Trash2, KeySquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTable: (tableData: Omit<TableNode, "id" | "position">) => void;
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

export function AddTableDialog({
  open,
  onOpenChange,
  onAddTable,
}: AddTableDialogProps) {
  const [tableName, setTableName] = useState("");
  const [fields, setFields] = useState<Omit<Field, "foreignKey">[]>([
    {
      name: "id",
      type: "INT",
      notNull: true,
      primary: true,
      unique: true,
    },
  ]);

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
      return;
    }

    // Validate fields
    for (const field of fields) {
      if (!field.name.trim() || !field.type) {
        return;
      }
    }

    onAddTable({
      name: tableName,
      fields,
    });

    // Reset form
    setTableName("");
    setFields([
      {
        name: "id",
        type: "INT",
        notNull: true,
        primary: true,
        unique: true,
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>
            Create a new table for your database schema. Add fields and set their properties.
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
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
