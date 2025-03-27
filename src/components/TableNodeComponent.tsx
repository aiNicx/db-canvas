
import { memo } from "react";
import { Handle, Position } from "reactflow";
import { TableNode, Field } from "@/types/schema";
import { KeyRound, Key, Edit, Link } from "lucide-react";

interface TableNodeProps {
  data: TableNode;
  selected: boolean;
  onEdit?: (tableId: string) => void;
}

export const TableNodeComponent = memo(({ data, selected, onEdit }: TableNodeProps) => {
  const { name, fields, color } = data;
  
  // Use the custom color from the table data, or default to the theme color
  const headerBgColor = color ? color : "bg-muted";
  const cardBgColor = color ? `bg-${color}-50 dark:bg-${color}-950` : "bg-card";

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data.id);
    }
  };

  return (
    <div 
      className={`table-node ${selected ? 'border-primary border-2' : 'border border-border'}`}
      style={{ backgroundColor: color ? `var(--${color})` : undefined }}
    >
      <div className={`table-node-header ${headerBgColor} p-2 font-medium border-b text-center relative`}>
        {name}
        <button 
          onClick={handleEditClick}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Edit table"
        >
          <Edit className="h-3.5 w-3.5 text-foreground opacity-70" />
        </button>
      </div>
      <div className={`table-node-content ${cardBgColor} p-1`}>
        {fields.map((field, index) => (
          <div key={index} className="field-row flex items-center p-1.5 text-sm border-b border-border/30 last:border-0">
            <div className="field-key w-6 flex justify-center">
              {field.primary ? (
                <KeyRound className="h-3.5 w-3.5 text-amber-500" />
              ) : field.foreignKey ? (
                <Link className="h-3.5 w-3.5 text-primary" />
              ) : null}
            </div>
            <div className="field-name flex-1 font-medium truncate">{field.name}</div>
            <div className="field-type text-xs bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground">
              {field.type}
            </div>
            
            {/* Add visual indicator for constraints */}
            {field.notNull && (
              <div className="ml-1 text-xs bg-secondary px-1 py-0.5 rounded-sm text-secondary-foreground">
                NN
              </div>
            )}
            
            {/* Handles for connections */}
            <Handle
              id={field.name}
              type="source"
              position={Position.Right}
              className="connection-handle right-0 bg-primary/50 w-2 h-2 min-w-2 min-h-2"
              style={{ top: 10 + index * 34 }}
            />
            <Handle
              id={field.name}
              type="target"
              position={Position.Left}
              className="connection-handle left-0 bg-primary/50 w-2 h-2 min-w-2 min-h-2"
              style={{ top: 10 + index * 34 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

TableNodeComponent.displayName = "TableNodeComponent";
