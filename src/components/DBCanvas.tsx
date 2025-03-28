
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Connection,
  EdgeTypes,
  getBezierPath,
} from "reactflow";
import { Project, TableNode, Connection as DBConnection } from "@/types/schema";
import { TableNodeComponent } from "./TableNodeComponent";
import { useProject } from "@/hooks/useProject"; // Updated import path
import { toast } from "sonner";
import "reactflow/dist/style.css";

interface DBCanvasProps {
  project: Project;
  showGrid: boolean;
  onEditTable?: (tableId: string) => void;
}

// Custom edge to replace the missing "floating" edge type
const FloatingEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: 'hsl(var(--primary))',
          strokeDasharray: data?.relationshipType === "oneToMany" ? "5 5" : undefined,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <text
        dy={-5}
        style={{
          fontSize: 10,
          fill: 'hsl(var(--primary))',
          fontWeight: 'bold',
        }}
      >
        <textPath
          href={`#${id}`}
          startOffset="50%"
          textAnchor="middle"
        >
          {data?.relationshipType === "oneToMany" ? "1:N" : "1:1"}
        </textPath>
      </text>
    </>
  );
};

const nodeTypes = {
  table: TableNodeComponent,
};

// Define edge types
const edgeTypes: EdgeTypes = {
  floating: FloatingEdge,
};

export function DBCanvas({ project, showGrid, onEditTable }: DBCanvasProps): JSX.Element {
  const { connectionsApi, tablesApi, currentProject } = useProject();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert tables to nodes for React Flow
  const initialNodes: Node[] = useMemo(
    () =>
      project.tables.map((table) => ({
        id: table.id,
        type: "table",
        position: table.position,
        data: {
          ...table,
          onEdit: onEditTable  // Pass edit handler in data object
        },
        draggable: true,
      })),
    [project.tables, onEditTable]
  );

  // Convert connections to edges for React Flow
  const initialEdges: Edge[] = useMemo(
    () =>
      project.connections.map((connection) => ({
        id: connection.id,
        source: connection.sourceId,
        target: connection.targetId,
        sourceHandle: connection.sourceField,
        targetHandle: `${connection.targetField}-left`,
        type: "floating",
        animated: true,
        zIndex: 10,
        style: {
          strokeWidth: 2,
          stroke: 'hsl(var(--primary))',
        },
        data: {
          relationshipType: connection.relationshipType,
        },
        markerEnd: 'arrow' as const,
      })),
    [project.connections, project.tables]
  );

  // Update nodes and edges when project changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);

    // Validate and clean up connections after initial load
    const invalidConnections = project.connections.filter(conn => {
      const sourceTable = project.tables.find(t => t.id === conn.sourceId);
      const targetTable = project.tables.find(t => t.id === conn.targetId);
      return !sourceTable || !targetTable ||
             !sourceTable.fields.some(f => f.name === conn.sourceField) ||
             !targetTable.fields.some(f => f.name === conn.targetField);
    });

    if (invalidConnections.length > 0) {
      toast.warning(`Found and removed ${invalidConnections.length} invalid connections`);
      
      // Remove invalid connections using the API
      invalidConnections.forEach(conn => {
        connectionsApi.deleteConnection(conn.id);
      });
      
      // Note: The project state will be updated automatically by the deleteConnection calls
      // via the updateProject callback passed to the hook. No need to call updateProject here.
    }
  }, [project, initialNodes, initialEdges, setNodes, setEdges, connectionsApi, tablesApi]); // Updated dependencies

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) {
        return;
      }

      // Extract the actual field name from the target handle (remove '-left' suffix if present)
      const targetField = params.targetHandle.endsWith('-left')
        ? params.targetHandle.replace('-left', '')
        : params.targetHandle;

      // First validate the connection would be valid
      const sourceTable = project.tables.find(t => t.id === params.source);
      const targetTable = project.tables.find(t => t.id === params.target);
      
      if (!sourceTable || !targetTable) {
        toast.error("Cannot create connection: tables not found");
        return;
      }

      const sourceFieldExists = sourceTable.fields.some(f => f.name === params.sourceHandle);
      const targetFieldExists = targetTable.fields.some(f => f.name === targetField);

      if (!sourceFieldExists || !targetFieldExists) {
        toast.error("Cannot create connection: fields not found");
        return;
      }

      // Try to add the connection to the project data first
      try {
        const newConnection = connectionsApi.addConnection({
          sourceId: params.source,
          targetId: params.target,
          sourceField: params.sourceHandle,
          targetField: targetField,
          relationshipType: "oneToMany", // Default relationship type
        });

        if (!newConnection) {
          return; // Error already shown by addConnection
        }

        // REMOVED: Immediate visual edge update.
        // Let the useEffect hook handle edge updates based on project prop changes.

        // Update the source table's field to mark it as a foreign key
        const updatedSourceTable = {
          ...sourceTable,
          fields: sourceTable.fields.map(field => {
            if (field.name === params.sourceHandle) {
              return {
                ...field,
                foreignKey: {
                  tableId: params.target,
                  fieldName: targetField
                }
              };
            }
            return field;
          })
        };
        tablesApi.updateTable(updatedSourceTable);

        toast.success(
          `Relation created: ${sourceTable.name}.${params.sourceHandle} → ${targetTable.name}.${targetField}`,
          { description: "Foreign key relation established" }
        );

      } catch (error) {
        console.error("Failed to create relation:", error);
        toast.error("Failed to create relation");
      }
    },
    // Removed setEdges from dependencies as it's no longer called directly
    [connectionsApi, tablesApi, project.tables]
  );

  // This handles node position changes
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Update the table position using the tables API
      // Use currentProject from useProject hook
      if (currentProject && node.id) {
        const tableToUpdate = currentProject.tables.find(table => table.id === node.id);
        if (tableToUpdate) {
          tablesApi.updateTable({
            ...tableToUpdate,
            position: node.position
          });
          // The project state will be updated automatically by the updateTable call
          // via the updateProject callback passed to the hook.
        }
      }
    },
    // Use currentProject in dependency array
    [currentProject, tablesApi, setNodes]
  );

  return (
    <div className="h-full w-full bg-canvas-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        fitView
        attributionPosition="bottom-right"
        className="db-canvas"
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="var(--canvas-grid)"
          />
        )}
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            return "#6366F1";
          }}
          nodeColor={(n) => {
            return "#fff";
          }}
          nodeBorderRadius={2}
        />
      </ReactFlow>
    </div>
  );
}
