
import { memo } from "react";
import { Handle, Position } from "reactflow";
import { TableNode, Field } from "@/types/schema";
import { KeyRound, Link, Edit } from "lucide-react";

interface TableNodeProps {
  data: TableNode;
  selected: boolean;
  onEdit?: (tableId: string) => void;
}

export const TableNodeComponent = memo(({ data, selected, onEdit }: TableNodeProps) => {
  const { name, fields, color } = data;
  
  // Define custom styling based on the table color
  const headerBgColor = color || "bg-slate-800 dark:bg-slate-800";
  const cardBgColor = color ? `bg-${color}-50 dark:bg-${color}-950` : "bg-black dark:bg-slate-900";
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data.id);
    }
  };

  return (
    <div 
      className={`table-node rounded-lg overflow-hidden ${selected ? 'ring-2 ring-primary' : 'ring-1 ring-slate-700'}`}
      style={{ backgroundColor: color ? `var(--${color})` : undefined }}
    >
      {/* Table Header */}
      <div 
        className={`${headerBgColor} p-3 font-medium text-white flex justify-between items-center`}
        style={{ backgroundColor: color ? undefined : "#1e293b" }}
      >
        <span className="truncate text-base">{name}</span>
        <button 
          onClick={handleEditClick}
          className="p-1 rounded-full hover:bg-slate-700/50 transition-colors"
          aria-label="Edit table"
        >
          <Edit className="h-4 w-4 text-white" />
        </button>
      </div>
      
      {/* Table Fields */}
      <div className={`${cardBgColor} text-white`} style={{ backgroundColor: color ? undefined : "#0f172a" }}>
        {fields.map((field, index) => (
          <div key={index} className="field-row flex items-center py-2 px-3 border-b border-slate-700/30 last:border-0 relative">
            {/* Field icon indicators */}
            <div className="field-key w-6 flex justify-center">
              {field.primary ? (
                <KeyRound className="h-4 w-4 text-amber-500" />
              ) : field.foreignKey ? (
                <Link className="h-4 w-4 text-blue-400" />
              ) : null}
            </div>
            
            {/* Field name */}
            <div className="field-name flex-1 font-medium text-base truncate">{field.name}</div>
            
            {/* Field type badge */}
            <div className="field-type text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 uppercase">
              {field.type}
            </div>
            
            {/* Field constraints */}
            {field.notNull && (
              <div className="ml-1 text-xs bg-slate-700 px-1.5 py-0.5 rounded text-white font-medium">
                NN
              </div>
            )}
            
            {/* Connection handles for each field */}
            <Handle
              id={field.name}
              type="source"
              position={Position.Right}
              className="connection-handle right-0 bg-blue-500 w-2.5 h-2.5 min-w-2.5 min-h-2.5"
              style={{ top: 16 + index * 38 }}
            />
            <Handle
              id={field.name}
              type="target"
              position={Position.Left}
              className="connection-handle left-0 bg-blue-500 w-2.5 h-2.5 min-w-2.5 min-h-2.5"
              style={{ top: 16 + index * 38 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

TableNodeComponent.displayName = "TableNodeComponent";
