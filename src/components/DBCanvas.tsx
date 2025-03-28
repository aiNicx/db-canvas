import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as dagre from 'dagre';
import ReactFlow, { // Keep ReactFlow as default import
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  getBezierPath,
  applyEdgeChanges,
  applyNodeChanges
} from 'reactflow';
import type { // Import types separately
  Node,
  Edge,
  Connection,
  EdgeTypes,
  EdgeChange,
  NodeChange
} from 'reactflow';
import { Project, TableNode, Connection as DBConnection } from "@/types/schema";
import { TableNodeComponent } from "./TableNodeComponent";
import { useProject } from "@/hooks/useProject";
import { toast } from "sonner";
import { FloatingEdge } from "./FloatingEdge";
import { useClipboardHandling } from '@/hooks/useClipboardHandling';
import { LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
 
  // Initialize state hooks with initial data (Moved up)
  // Note: reactFlowNodes/Edges are defined later, but hooks need initial values.
  // We'll use empty arrays initially and rely on useEffect to populate them.
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
 
  // Function to calculate optimal positions using Dagre
  const calculateAutoLayout = useCallback(() => {
    if (!currentProject || !nodes || nodes.length === 0) {
       console.log("Auto Layout: Missing project or nodes.");
       return;
    }
    console.log("Calculating Auto Layout using Dagre...");

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    // Configure layout options (Top-to-bottom, increased spacing)
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

    const nodeWidth = 250; // Define node dimensions for Dagre
    const nodeHeight = 200; // Adjust based on your TableNodeComponent size

    // Add nodes to Dagre graph
    nodes.forEach((node) => {
       // Ensure node dimensions are provided
       dagreGraph.setNode(node.id, {
         label: node.data.name,
         width: node.width ?? nodeWidth, // Use actual width if available, else default
         height: node.height ?? nodeHeight // Use actual height if available, else default
       });
    });

    // Add edges to Dagre graph (Dagre expects source -> target)
    // Our connections are stored FK -> PK (sourceId -> targetId)
    // Dagre needs PK -> FK (targetId -> sourceId) for TB layout
    currentProject.connections.forEach((conn) => {
       // Ensure both source and target nodes exist in the graph before adding edge
       if (dagreGraph.hasNode(conn.targetId) && dagreGraph.hasNode(conn.sourceId)) {
         dagreGraph.setEdge(conn.targetId, conn.sourceId);
       } else {
         console.warn(`Skipping edge for connection ${conn.id} due to missing node(s).`);
       }
    });

    try {
      dagre.layout(dagreGraph);
      console.log("Dagre layout calculated.");
    } catch (e) {
      console.error("Dagre layout failed:", e);
      toast.error("Auto-layout calculation failed.");
      return;
    }

    const positions: Record<string, { x: number; y: number }> = {};
    dagreGraph.nodes().forEach((nodeId) => {
      const node = dagreGraph.node(nodeId);
      if (node) {
        // Dagre calculates center position, adjust for top-left corner used by React Flow
        positions[nodeId] = { x: node.x - (node.width ?? nodeWidth) / 2, y: node.y - (node.height ?? nodeHeight) / 2 };
      }
    });

    // 4. Prepare updates (Keep existing logic, but use Dagre positions)
    const nodeUpdates: { id: string; position: { x: number; y: number } }[] = [];
    const tables = currentProject.tables; // Need tables for persistence step
    tables.forEach(table => {
      if (positions[table.id]) {
        // Log the specific position calculated
        console.log(`Calculated position for table ${table.id}: {x: ${positions[table.id].x}, y: ${positions[table.id].y}}`);
        nodeUpdates.push({ id: table.id, position: positions[table.id] });
      } else {
        console.log(`No position calculated for table ${table.id}`);
      }
    });
    console.log("Finished calculating all positions.");
 
    // 5. Update React Flow nodes state once
    if (nodeUpdates.length > 0) {
       console.log("Applying batch node position updates to React Flow state...");
       setNodes((nds) =>
         nds.map((node) => {
           const update = nodeUpdates.find((upd) => upd.id === node.id);
           if (update) {
             // console.log(`  - Applying position {x: ${update.position.x}, y: ${update.position.y}} to node ${node.id}`); // Optional: log individual application
             return { ...node, position: update.position };
           }
           return node;
         })
       );
    } else {
       console.log("No node updates to apply to React Flow state.");
    }
 
    // 6. Persist changes individually (assuming no batch update API)
    // Run this *after* updating the local state to avoid potential re-render conflicts
    if (nodeUpdates.length > 0) {
      console.log("Persisting individual table position updates...");
      nodeUpdates.forEach(update => {
        const tableToUpdate = tables.find(t => t.id === update.id);
        if (tableToUpdate) {
          // console.log(`  - Persisting position for table ${update.id}`); // Optional: log individual persistence
          tablesApi.updateTable({
            ...tableToUpdate,
            position: update.position
          });
        }
      });
      console.log("Finished persisting updates.");
    }
 
  }, [currentProject, tablesApi, setNodes]); // Dependencies remain the same
 
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
        id: connection.id,
        // Reverse source and target for visual representation (PK -> FK)
        source: connection.targetId, // Table with the referenced PK
        target: connection.sourceId, // Table with the FK
        sourceHandle: connection.targetField, // PK field name (connects to right handle of PK table)
        targetHandle: `${connection.sourceField}-left`, // FK field name (connects to left handle of FK table)
        type: "floating", animated: true, zIndex: 10,
        style: { strokeWidth: 2, stroke: 'hsl(var(--primary))' },
        data: { relationshipType: connection.relationshipType }, markerEnd: 'arrow' as const,
      })),
    [project.connections]
  );
 
  // Removed duplicate state hook initializations
  // const [nodes, setNodes, onNodesChangeInternal] = useNodesState(reactFlowNodes);
  // const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(reactFlowEdges);
 
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
          // Update React Flow state immediately
          setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n)));
          // The project state will be updated automatically by the updateTable call
          // via the updateProject callback passed to the hook.
        }
      }
    },
    // Use currentProject in dependency array
    [currentProject, tablesApi, setNodes] // Added setNodes
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
   <div className="h-full w-full bg-canvas-background relative"> {/* Added relative positioning */}
     {/* Moved Button outside ReactFlow and adjusted styling */}
     <Button
       variant="outline"
       size="icon" // Changed to icon size
       onClick={calculateAutoLayout}
       className="absolute left-4 top-4 z-50" // Increased z-index
       title="Auto-layout tables based on relationships"
     >
       <LayoutDashboard className="h-4 w-4" /> {/* Added icon */}
     </Button>
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
