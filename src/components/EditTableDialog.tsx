
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      {/* Increased max-width to accommodate content */}
      <DialogContent className="max-w-lg">
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
              // Adjust gaps for better wrapping: smaller horizontal, add vertical
              className="flex flex-wrap gap-x-3 gap-y-2"
            >
              {TABLE_COLORS.map((color) => {
                // Map color values to specific Tailwind classes for background and border
                const colorClassMap: { [key: string]: string } = {
                  blue: "bg-blue-500 border-blue-600",
                  red: "bg-red-500 border-red-600",
                  green: "bg-green-500 border-green-600",
                  purple: "bg-purple-500 border-purple-600",
                  amber: "bg-amber-500 border-amber-600",
                  pink: "bg-pink-500 border-pink-600",
                  "": "bg-gray-300 border-gray-400", // Default style (slightly darker bg)
                };
                const colorSpecificClasses = colorClassMap[color.value] || colorClassMap[""];

                return (
                  // Reduce space between radio item and label
                  <div key={color.value} className="flex items-center space-x-1.5">
                    <RadioGroupItem
                      value={color.value}
                      id={`color-${color.value || 'default'}`}
                      // Apply base styles, color-specific styles, and state styles
                      className={`h-5 w-5 rounded-full border-2 ${colorSpecificClasses} data-[state=checked]:ring-2 data-[state=checked]:ring-ring data-[state=checked]:ring-offset-2 focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                      aria-label={color.name} // Add aria-label for accessibility
                    />
                    <Label htmlFor={`color-${color.value || 'default'}`}>{color.name}</Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
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
            {/* Added overflow-x-auto for horizontal scrolling */}
            <div className="max-h-[40vh] overflow-y-auto overflow-x-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10"> {/* Sticky header */}
                  <TableRow>
                    {/* Adjusted widths and added padding */}
                    <TableHead className="w-[180px] pl-4">Name</TableHead>
                    <TableHead className="w-[180px]">Type</TableHead>
                    <TableHead className="w-[90px] text-center">Not Null</TableHead>
                    <TableHead className="w-[90px] text-center">Primary</TableHead>
                    <TableHead className="w-[90px] text-center">Unique</TableHead>
                    <TableHead className="w-[60px] text-right pr-4"> {/* Added text-right and padding */}
                      <span className="sr-only">Actions</span> {/* Screen reader label */}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={index}>
                      {/* Added padding to first cell */}
                      <TableCell className="pl-4">
                        <Input
                          id={`fieldName-${index}`}
                          value={field.name}
                          onChange={(e) =>
                            handleFieldChange(index, { name: e.target.value })
                          }
                          placeholder="Field name"
                          className="h-8" // Smaller input
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={field.type}
                          onValueChange={(value) =>
                            handleFieldChange(index, { type: value })
                          }
                        >
                          <SelectTrigger className="h-8"> {/* Smaller trigger */}
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
                      </TableCell>
                      {/* Ensured Checkboxes are centered within the cell */}
                      <TableCell className="text-center align-middle">
                        <Checkbox
                          id={`fieldNotNull-${index}`}
                          checked={field.notNull}
                          onCheckedChange={(checked) =>
                            handleFieldChange(index, {
                              notNull: checked === true,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <Checkbox
                          id={`fieldPrimary-${index}`}
                          checked={field.primary}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              const newFields = fields.map((f, i) => ({
                                ...f,
                                primary: i === index,
                              }));
                              setFields(newFields);
                            } else {
                              handleFieldChange(index, { primary: false });
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <Checkbox
                          id={`fieldUnique-${index}`}
                          checked={field.unique}
                          onCheckedChange={(checked) =>
                            handleFieldChange(index, {
                              unique: checked === true,
                            })
                          }
                        />
                      </TableCell>
                      {/* Adjusted padding and alignment for delete button */}
                      <TableCell className="text-right pr-4 align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(index)}
                          disabled={fields.length <= 1}
                          className="h-8 w-8" // Smaller button
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
