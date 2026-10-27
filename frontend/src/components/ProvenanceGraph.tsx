import React, { useState } from 'react';
import { Share2, Info, ExternalLink, ArrowRight, BookOpen, Compass } from 'lucide-react';
import { ProvenanceGraphResponse, GraphNode, GraphEdge } from '../types';

interface ProvenanceGraphProps {
  graphData: ProvenanceGraphResponse;
  onSelectArtifact?: (artifactId: string) => void;
  onClose?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  Artifact: '#89b399',             // Sage
  Creator: '#d8b86d',              // Brass
  Place: '#6fb7c9',                // Lagoon
  'Cultural Tradition': '#b88fd0', // Amethyst
  Collection: '#e08a6a',           // Terracotta
};

export const ProvenanceGraph: React.FC<ProvenanceGraphProps> = ({
  graphData,
  onSelectArtifact,
  onClose,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(
    graphData.nodes.find((n) => n.is_center) || graphData.nodes[0] || null
  );

  // Position nodes radially around the center node for SVG rendering
  const width = 720;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 140;

  const centerNode = graphData.nodes.find((n) => n.is_center) || graphData.nodes[0];
  const outerNodes = graphData.nodes.filter((n) => n.id !== centerNode?.id);

  // Calculate coordinates for nodes
  const nodePositions: Record<string, { x: number; y: number }> = {};
  if (centerNode) {
    nodePositions[centerNode.id] = { x: centerX, y: centerY };
  }

  outerNodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, outerNodes.length);
    nodePositions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <div className="provenance-container">
      <div className="page-head tight">
        <div>
          <div className="page-kicker">Chart of relations</div>
          <h2 className="page-title small">
            <Share2 size={20} color="var(--accent-gold)" />
            Documented provenance graph
          </h2>
          <p className="page-lede">Explicit connections, each grounded in a verified museum citation.</p>
        </div>
        {onClose && (
          <button className="ghost-btn" onClick={onClose}>
            Back to challenge
          </button>
        )}
      </div>

      {/* SVG Interactive Canvas */}
      <div className="svg-graph-viewport">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="20"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#5d7a6c" />
            </marker>
          </defs>

          {/* Orbit ring */}
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#d8b86d" strokeOpacity="0.14" strokeDasharray="2 6" />
          <circle cx={centerX} cy={centerY} r={radius + 52} fill="none" stroke="#d8b86d" strokeOpacity="0.07" />

          {/* Render Directed Edges */}
          {graphData.edges.map((edge, idx) => {
            const sourcePos = nodePositions[edge.source];
            const targetPos = nodePositions[edge.target];
            if (!sourcePos || !targetPos) return null;

            const midX = (sourcePos.x + targetPos.x) / 2;
            const midY = (sourcePos.y + targetPos.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke="#3b5b4e"
                  strokeWidth="1.5"
                  strokeDasharray={edge.label === 'related to' ? '4,4' : undefined}
                  markerEnd="url(#arrow)"
                />
                <rect
                  x={midX - 35}
                  y={midY - 8}
                  width="70"
                  height="16"
                  fill="#0a1210"
                  rx="8"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill="#9db0a5"
                  fontSize="9"
                  fontFamily="var(--font-sans)"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {graphData.nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            const color = TYPE_COLORS[node.type] || '#89b399';
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                className="graph-node"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(node)}
              >
                <circle r={node.is_center ? 34 : 25} fill={color} opacity={isSelected ? 0.22 : 0.08} />
                <circle
                  r={node.is_center ? 26 : 18}
                  fill="#101c18"
                  stroke={isSelected ? '#ffffff' : color}
                  strokeWidth={isSelected ? 3 : 2}
                  style={{ filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' : 'none' }}
                />
                <circle
                  r={node.is_center ? 10 : 6}
                  fill={color}
                  opacity={0.8}
                />
                <text
                  y={node.is_center ? 38 : 28}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#abb8b0'}
                  fontSize={node.is_center ? 11 : 9.5}
                  fontWeight={node.is_center ? '600' : '400'}
                  fontFamily="var(--font-sans)"
                >
                  {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="graph-legend">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            <span>{type}</span>
          </div>
        ))}
      </div>

      {/* Selected Node Details & Traversal Card */}
      {selectedNode && (
        <div className="node-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="node-type" style={{ color: TYPE_COLORS[selectedNode.type] || 'inherit' }}>
                {selectedNode.type}
              </span>
              <h3 className="node-name">
                {selectedNode.label}
              </h3>
            </div>

            {selectedNode.type === 'Artifact' &&
              selectedNode.id !== graphData.artifact_id &&
              onSelectArtifact && (
                <button className="ghost-btn" onClick={() => onSelectArtifact(selectedNode.id)}>
                  <Compass size={13} />
                  Investigate Artifact
                </button>
              )}
          </div>

          {/* Connected Edges from this Node */}
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {graphData.edges
              .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
              .map((e, idx) => (
                <div key={idx} style={{ marginTop: '0.3rem' }}>
                  • <span style={{ color: 'var(--accent-sage)' }}>{e.label}</span>:{' '}
                  {e.notes || 'Documented historical relationship'}
                  {e.evidence_source_id && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginLeft: '6px' }}>
                      [Evid: {e.evidence_source_id}]
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
