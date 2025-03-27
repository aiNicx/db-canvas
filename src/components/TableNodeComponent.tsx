
import { memo } from "react";
import { Handle, Position } from "reactflow";
import { TableNode, Field } from "@/types/schema";
import { KeyRound, Key } from "lucide-react";

interface TableNodeProps {
  data: TableNode;
}

export const TableNodeComponent = memo(({ data }: TableNodeProps) => {
  const { name, fields } = data;

  return (
    <div className="table-node">
      <div className="table-node-header">{name}</div>
      <div className="table-node-content">
        {fields.map((field, index) => (
          <div key={index} className="field-row">
            <div className="field-key">
              {field.primary ? (
                <KeyRound className="h-3 w-3 text-amber-500" />
              ) : field.foreignKey ? (
                <Key className="h-3 w-3 text-primary" />
              ) : null}
            </div>
            <div className="field-name">{field.name}</div>
            <div className="field-type">{field.type}</div>
            
            {/* Handles for connections */}
            <Handle
              id={field.name}
              type="source"
              position={Position.Right}
              className="connection-handle"
              style={{ opacity: 0.5, top: 10 + index * 28 }}
            />
            <Handle
              id={field.name}
              type="target"
              position={Position.Left}
              className="connection-handle"
              style={{ opacity: 0.5, top: 10 + index * 28 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

TableNodeComponent.displayName = "TableNodeComponent";
