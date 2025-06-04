import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import ReactFlow, { MiniMap, Controls, Background, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

export default function Home() {
  const [nodes, setNodes] = useState([
    { id: '1', data: { label: 'Nodo 1' }, position: { x: 0, y: 0 } },
    { id: '2', data: { label: 'Nodo 2' }, position: { x: 100, y: 100 } },
  ]);
  const [edges, setEdges] = useState([
    { id: 'e1-2', source: '1', target: '2' },
  ]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <nav style={{ padding: '10px', background: '#eee' }}>
        <Link href="/">ReactFlow</Link> | <Link href="/canvas">Canvas</Link>
      </nav>
      <div style={{ height: 'calc(100% - 40px)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
      </div>
    </div>
  );
}
