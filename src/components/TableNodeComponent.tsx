import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TableNode } from '@/types/schema';
import { useProject } from '@/hooks/useProject';
import { useNavigate } from 'react-router-dom';
import { Edit, Copy } from 'lucide-react';
import './TableNodeComponent.css';

interface NodeComponentProps {
  id: string;
  data: TableNode;
  selected: boolean;
}

export function TableNodeComponent({ data, selected, id }: NodeComponentProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { tablesApi } = useProject();
  const navigate = useNavigate();

  // Extract current project ID from URL for navigation
  const path = window.location.pathname;
  const projectIdMatch = path.match(/\/editor\/([^\/]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (projectId) {
      navigate(`/editor/${projectId}/tables/${id}`);
    }
  };

  const handleDuplicateClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    tablesApi.duplicateTable(id);
  };

  const nodeClass = `table-node ${selected ? 'selected' : ''} ${isMenuOpen ? 'menu-open' : ''} ${data?.color ? `table-node-${data.color}` : ''}`;

  const handleMouseEnter = () => {
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    setIsMenuOpen(false);
  };

  return (
    <div 
      className={nodeClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Table header with title */}
      <div className="table-node-header">
        {data?.name || "Table"}
        <div className="table-node-actions">
          <button 
            className="table-action-button edit-button" 
            onClick={handleEditClick}
            title="Edit table"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button 
            className="table-action-button duplicate-button" 
            onClick={handleDuplicateClick}
            title="Duplicate table"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Table fields list */}
      <div className="table-node-fields">
        {data?.fields?.map((field, index) => (
          <div key={field.id || index} className="table-node-field">
            <div className="field-name">
              {field.primary && <span className="field-icon primary">PK</span>}
              {field.foreignKey && <span className="field-icon foreign">FK</span>}
              {field.name}
            </div>
            <div className="field-type">{field.type}</div>
            {/* Add a handle for each field */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${field.id}-out`}
              className="field-handle"
              style={{ top: `${28 + index * 24}px`, right: '-8px' }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id={`${field.id}-in`}
              className="field-handle"
              style={{ top: `${28 + index * 24}px`, left: '-8px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

