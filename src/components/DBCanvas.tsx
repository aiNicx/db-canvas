
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
  EdgeChange,
  applyEdgeChanges,
  NodeChange,        // Added
  applyNodeChanges,  // Added
} from "reactflow";
import { Project, TableNode, Connection as DBConnection } from "@/types/schema";
import { TableNodeComponent } from "./TableNodeComponent";
import { useProject } from "@/hooks/useProject"; // Updated import path
import { toast } from "sonner";
import { FloatingEdge } from "./FloatingEdge"; // Import the extracted component
import { useClipboardHandling } from '@/hooks/useClipboardHandling';
import "reactflow/dist/style.css";

interface DBCanvasProps {
  project: Project;
  showGrid: boolean;
  onEditTable?: (tableId: string) => void;
}

// FloatingEdge component definition removed

const nodeTypes = {
  table: TableNodeComponent,
};

// Define edge types
const edgeTypes: EdgeTypes = {
  floating: FloatingEdge,
};

export function DBCanvas({ project, showGrid, onEditTable }: DBCanvasProps): JSX.Element {
  const { connectionsApi, tablesApi, currentProject } = useProject();

  // Convert tables/connections for initial state and updates
  const reactFlowNodes: Node[] = useMemo(
    () =>
      project.tables.map((table) => ({
        id: table.id, type: "table", position: table.position,
        data: { ...table, onEdit: onEditTable }, draggable: true,
      })),
    [project.tables, onEditTable]
  );
  const reactFlowEdges: Edge[] = useMemo(
    () =>
      project.connections.map((connection) => ({
        id: connection.id, source: connection.sourceId, target: connection.targetId,
        sourceHandle: connection.sourceField, targetHandle: `${connection.targetField}-left`,
        type: "floating", animated: true, zIndex: 10,
        style: { strokeWidth: 2, stroke: 'hsl(var(--primary))' },
        data: { relationshipType: connection.relationshipType }, markerEnd: 'arrow' as const,
      })),
    [project.connections]
  );

  // Initialize state hooks with initial data
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(reactFlowEdges);

  // Effect to update nodes/edges when reactFlowNodes/reactFlowEdges change (e.g., project loaded/updated)
  // This replaces the previous problematic useEffect
  useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  useEffect(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);


  // Initialize clipboard handling hook (pass nodes state)
  useClipboardHandling({ nodes, projectTables: project.tables, tablesApi });


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
    [currentProject, tablesApi] // Removed setNodes
  );


  // Custom handler for node changes (handles selection, position, etc.)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes] // Depends on current nodes and the setter
  );

  // Custom handler for edge changes (handles selection, and intercepts removal)
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const nextChanges = changes.reduce<EdgeChange[]>((acc, change) => {
        if (change.type === 'remove') {
          // Call the API to delete the connection from the project state
          connectionsApi.deleteConnection(change.id);
          // Don't apply the removal change directly via setEdges,
          // let the project state update trigger the re-render.
          return acc;
        }
        // Accumulate other changes (selection, etc.)
        acc.push(change);
        return acc;
      }, []);

      // Apply accumulated non-remove changes using the setter from useEdgesState
      if (nextChanges.length > 0) {
        setEdges(applyEdgeChanges(nextChanges, edges));
      }
    },
    [connectionsApi, edges, setEdges] // Depends on API, current edges, and the setter
  );


  return (
    <div className="h-full w-full bg-canvas-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange} // Use custom handler
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
