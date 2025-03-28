import { getBezierPath, EdgeProps, Position } from 'reactflow';

// Define the props specifically for FloatingEdge
interface FloatingEdgeProps extends EdgeProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: {
    relationshipType?: 'oneToOne' | 'oneToMany';
  };
}

export const FloatingEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: FloatingEdgeProps) => {
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
      {/* Optional: Add text label back if needed, ensuring it uses props correctly */}
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

// Default export can be useful if it's the primary export
// export default FloatingEdge;