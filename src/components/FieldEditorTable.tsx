import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, GripVertical, Link, Unlink } from 'lucide-react';
import { Field, COMMON_DATA_TYPES } from '@/types/schema';
// import { useProject } from '@/hooks/useProject'; // Removed unused import
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { v4 as uuidv4 } from 'uuid';

interface FieldEditorTableProps {
  fields: Field[];
  onChange: (fields: Field[]) => void;
  availableTables?: { id: string; name: string; fields: Field[] }[];
}

function SortableTableRow({
  field,
  index,
  handleFieldChange,
  handleRemoveField,
  fields,
  isDragging,
  isOver,
  availableTables,
  handleSetForeignKey,
  handleRemoveForeignKey,
}: {
  field: Field;
  index: number;
  handleFieldChange: (index: number, field: Partial<Field>) => void;
  handleRemoveField: (index: number) => void;
  fields: Field[];
  isDragging: boolean;
  isOver: boolean;
  availableTables?: { id: string; name: string; fields: Field[] }[];
  handleSetForeignKey: (index: number, targetTableId: string, targetFieldName: string) => void;
  handleRemoveForeignKey: (index: number) => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });
  const [selectedFkTableId, setSelectedFkTableId] = useState<string | undefined>(
    field.foreignKey?.tableId
  );
  const [selectedFkFieldName, setSelectedFkFieldName] = useState<string | undefined>(
    field.foreignKey?.fieldName
  );

  useEffect(() => {
    setSelectedFkTableId(field.foreignKey?.tableId);
    setSelectedFkFieldName(field.foreignKey?.fieldName);
  }, [field.foreignKey]);

  const targetTableFields = availableTables?.find((t) => t.id === selectedFkTableId)?.fields || [];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging
      ? 'hsl(var(--accent)/0.1)'
      : isOver
        ? 'hsl(var(--accent)/0.05)'
        : undefined,
  };

  const handleDefaultValueChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    let defaultValue: string | number | boolean | null = value;
    if (value === 'null') defaultValue = null;
    else if (value === 'true') defaultValue = true;
    else if (value === 'false') defaultValue = false;
    else if (!isNaN(Number(value)) && value.trim() !== '') defaultValue = Number(value);

    handleFieldChange(index, { defaultValue });
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell className="pl-2 w-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          {...listeners}
        >
          <GripVertical className="h-4 w-4 transition-opacity opacity-70 hover:opacity-100" />
        </Button>
      </TableCell>
      <TableCell className="pl-2">
        <Input
          value={field.name}
          onChange={(e) => handleFieldChange(index, { name: e.target.value })}
          placeholder="Field name"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Select
          value={field.type}
          onValueChange={(value) => handleFieldChange(index, { type: value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_DATA_TYPES.map((type) => (
              <SelectItem key={type.name} value={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-center align-middle">
        <Checkbox
          checked={field.notNull}
          onCheckedChange={(checked) => handleFieldChange(index, { notNull: checked === true })}
        />
      </TableCell>
      <TableCell className="text-center align-middle">
        <Checkbox
          checked={field.primary}
          onCheckedChange={(checked) => handleFieldChange(index, { primary: checked === true })}
        />
      </TableCell>
      <TableCell className="text-center align-middle">
        <Checkbox
          checked={field.unique}
          onCheckedChange={(checked) => handleFieldChange(index, { unique: checked === true })}
        />
      </TableCell>
      <TableCell>
        <Input
          value={field.defaultValue === null ? 'null' : String(field.defaultValue ?? '')}
          onChange={handleDefaultValueChange}
          placeholder="Default"
          className="h-8"
        />
      </TableCell>
      <TableCell className="text-center align-middle w-[60px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${field.foreignKey ? 'text-primary hover:text-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
              title={
                field.foreignKey
                  ? `Links to ${availableTables?.find((t) => t.id === field.foreignKey?.tableId)?.name}.${field.foreignKey.fieldName}`
                  : 'Set Foreign Key'
              }
            >
              {field.foreignKey ? (
                <Link className="h-4 w-4" />
              ) : (
                <Unlink className="h-4 w-4 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-4 space-y-3">
            <h4 className="font-medium leading-none">Foreign Key</h4>
            <p className="text-sm text-muted-foreground">
              Link this field to a field in another table.
            </p>
            <Select
              value={selectedFkTableId}
              onValueChange={(value) => {
                setSelectedFkTableId(value);
                setSelectedFkFieldName(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Target Table" />
              </SelectTrigger>
              <SelectContent>
                {availableTables?.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedFkFieldName}
              onValueChange={setSelectedFkFieldName}
              disabled={!selectedFkTableId || targetTableFields.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Target Field" />
              </SelectTrigger>
              <SelectContent>
                {targetTableFields.map((f) => (
                  <SelectItem key={f.id} value={f.name}>
                    {f.name} ({f.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveForeignKey(index)}
                disabled={!field.foreignKey}
              >
                Remove
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedFkTableId && selectedFkFieldName) {
                    handleSetForeignKey(index, selectedFkTableId, selectedFkFieldName);
                  }
                }}
                disabled={!selectedFkTableId || !selectedFkFieldName}
              >
                Set Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell className="text-right pr-4 align-middle">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveField(index)}
          disabled={fields.length <= 1}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function FieldEditorTable({
  fields,
  onChange,
  availableTables,
}: FieldEditorTableProps): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent): void => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (active.id !== over?.id && over?.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(fields, oldIndex, newIndex));
      }
    }
  };

  const handleAddField = (): void => {
    // Explicitly type the new field object
    const newField: Field = {
      id: uuidv4(),
      name: '',
      type: 'VARCHAR(255)',
      notNull: false,
      primary: false,
      unique: false,
      defaultValue: undefined,
      foreignKey: undefined,
    };
    // Correctly update state
    onChange([...fields, newField]);
  };

  const handleRemoveField = useCallback(
    (index: number): void => {
      if (fields.length <= 1) return;
      const newFields = [...fields];
      newFields.splice(index, 1);
      onChange(newFields);
    },
    [fields, onChange]
  );

  const handleFieldChange = useCallback(
    (index: number, fieldUpdate: Partial<Field>): void => {
      const newFields = [...fields];
      const currentId = newFields[index].id;
      newFields[index] = { ...newFields[index], ...fieldUpdate, id: currentId };

      if (fieldUpdate.primary) {
        newFields.forEach((f, i) => {
          if (i !== index) f.primary = false;
        });
      }

      onChange(newFields);
    },
    [fields, onChange]
  );

  const handleSetForeignKey = useCallback(
    (index: number, targetTableId: string, targetFieldName: string): void => {
      const newFields = [...fields];
      newFields[index] = {
        ...newFields[index],
        foreignKey: { tableId: targetTableId, fieldName: targetFieldName },
      };
      onChange(newFields);
    },
    [fields, onChange]
  );

  const handleRemoveForeignKey = useCallback(
    (index: number): void => {
      const newFields = [...fields];
      newFields[index] = {
        ...newFields[index],
        foreignKey: undefined,
      };
      onChange(newFields);
    },
    [fields, onChange]
  );

  // This return statement was missing or misplaced in the previous error state
  return (
    <div className="space-y-4">
      <div className="max-h-[40vh] overflow-y-auto overflow-x-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-8 px-1"></TableHead> {/* Drag Handle */}
              <TableHead className="pl-2 min-w-[150px]">Name</TableHead> {/* Use min-w */}
              <TableHead className="min-w-[150px]">Type</TableHead> {/* Use min-w */}
              <TableHead className="w-[70px] text-center px-1">Not Null</TableHead>{' '}
              {/* Slightly smaller */}
              <TableHead className="w-[70px] text-center px-1">Primary</TableHead>{' '}
              {/* Slightly smaller */}
              <TableHead className="w-[70px] text-center px-1">Unique</TableHead>{' '}
              {/* Slightly smaller */}
              <TableHead className="min-w-[120px]">Default Value</TableHead> {/* Use min-w */}
              <TableHead className="w-[50px] text-center px-1">FK</TableHead>{' '}
              {/* Slightly smaller */}
              <TableHead className="w-[50px] text-right pr-2"></TableHead>{' '}
              {/* Actions, slightly smaller */}
            </TableRow>
          </TableHeader>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {useMemo(
                  () =>
                    fields.map((field, index) => (
                      <SortableTableRow
                        key={field.id}
                        field={field}
                        index={index}
                        handleFieldChange={handleFieldChange}
                        handleRemoveField={handleRemoveField}
                        fields={fields}
                        isDragging={activeId === field.id}
                        isOver={overId === field.id && activeId !== field.id}
                        availableTables={availableTables}
                        handleSetForeignKey={handleSetForeignKey}
                        handleRemoveForeignKey={handleRemoveForeignKey}
                      />
                    )),
                  [
                    fields,
                    activeId,
                    overId,
                    availableTables,
                    handleFieldChange,
                    handleRemoveField,
                    handleSetForeignKey,
                    handleRemoveForeignKey,
                  ]
                )}
              </TableBody>
            </SortableContext>
          </DndContext>
        </Table>
      </div>
      <Button type="button" size="sm" onClick={handleAddField} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
}
