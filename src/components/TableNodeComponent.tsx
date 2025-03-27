
import { memo } from "react";
import { Handle, Position } from "reactflow";
import { TableNode, Field } from "@/types/schema";
import { KeyRound, Key } from "lucide-react";

interface TableNodeProps {
  data: TableNode;
  selected: boolean;
}

export const TableNodeComponent = memo(({ data, selected }: TableNodeProps) => {
  const { name, fields } = data;

  return (
    <div className={`table-node ${selected ? 'border-primary border-2' : 'border border-border'}`}>
      <div className="table-node-header bg-muted p-2 font-medium border-b text-center">
        {name}
      </div>
      <div className="table-node-content bg-card p-1">
        {fields.map((field, index) => (
          <div key={index} className="field-row flex items-center p-1 text-sm border-b border-border/30 last:border-0">
            <div className="field-key w-6 flex justify-center">
              {field.primary ? (
                <KeyRound className="h-3 w-3 text-amber-500" />
              ) : field.foreignKey ? (
                <Key className="h-3 w-3 text-primary" />
              ) : null}
            </div>
            <div className="field-name flex-1 font-medium">{field.name}</div>
            <div className="field-type text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {field.type}
            </div>
            
            {/* Handles for connections */}
            <Handle
              id={field.name}
              type="source"
              position={Position.Right}
              className="connection-handle right-0 bg-primary/50 w-2 h-2 min-w-2 min-h-2"
              style={{ top: 10 + index * 28 }}
            />
            <Handle
              id={field.name}
              type="target"
              position={Position.Left}
              className="connection-handle left-0 bg-primary/50 w-2 h-2 min-w-2 min-h-2"
              style={{ top: 10 + index * 28 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

TableNodeComponent.displayName = "TableNodeComponent";
