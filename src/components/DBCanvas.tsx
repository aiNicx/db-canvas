
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
} from "reactflow";
import { Project } from "@/types/schema";
import { TableNodeComponent } from "./TableNodeComponent";
import "reactflow/dist/style.css";

interface DBCanvasProps {
  project: Project;
  showGrid: boolean;
}

const nodeTypes = {
  table: TableNodeComponent,
};

export function DBCanvas({ project, showGrid }: DBCanvasProps) {
  // Convert tables to nodes for React Flow
  const initialNodes: Node[] = useMemo(
    () =>
      project.tables.map((table) => ({
        id: table.id,
        type: "table",
        position: table.position,
        data: { ...table },
      })),
    [project.tables]
  );

  // Convert connections to edges for React Flow
  const initialEdges: Edge[] = useMemo(
    () =>
      project.connections.map((connection) => ({
        id: connection.id,
        source: connection.sourceId,
        target: connection.targetId,
        sourceHandle: connection.sourceField,
        targetHandle: connection.targetField,
        type: "floating",
        animated: true,
        style: { stroke: "hsl(var(--primary))" },
        data: {
          relationshipType: connection.relationshipType,
        },
      })),
    [project.connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when project changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [project, initialNodes, initialEdges, setNodes, setEdges]);

  // Handle new connections
  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "floating",
            animated: true,
            style: { stroke: "hsl(var(--primary))" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // This is a placeholder for handling node position changes
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Update the table position in the project
      console.log("Node position updated:", node.id, node.position);
    },
    []
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
