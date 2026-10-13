import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface GraphNode {
  id: string;
  name: string;
  subtitle?: string;
  category: 'party' | 'event' | 'document' | 'legal_issue' | 'precedent' | 'statute';
  color: string;
  pos3D: [number, number, number];
  pos2D: [number, number, number];
  description: string;
  sources: { title: string; file: string; page: number }[];
  date?: string;
}

const DEFAULT_NODES: GraphNode[] = [
  {
    id: 'node-incident',
    name: 'Incident',
    subtitle: '12 Jan 2023',
    category: 'event',
    color: '#e53935',
    pos3D: [0, 0, 0],
    pos2D: [0, 0, 0],
    description: 'Alleged unlawful detention of the petitioner without producing before magistrate within 24 hours.',
    sources: [
      { title: 'FIR (Page 2)', file: 'doc_fir_2023.pdf', page: 2 },
      { title: 'Petition (Page 14)', file: 'petition.pdf', page: 14 },
      { title: 'CCTV Report (Page 5)', file: 'cctv_report.pdf', page: 5 }
    ],
    date: '12 Jan 2023'
  },
  {
    id: 'node-petitioner',
    name: 'Petitioner',
    subtitle: 'Rajesh Sharma',
    category: 'party',
    color: '#ef4444',
    pos3D: [-3.2, 1.8, 1.2],
    pos2D: [-3.2, 1.8, 0],
    description: 'Aggrieved citizen challenging procedural irregularities and unlawful custody under Article 226.',
    sources: [{ title: 'Petition (Page 1)', file: 'petition.pdf', page: 1 }]
  },
  {
    id: 'node-respondent',
    name: 'Respondent',
    subtitle: 'State of Maharashtra',
    category: 'party',
    color: '#94a3b8',
    pos3D: [2.6, 2.1, -1.1],
    pos2D: [2.6, 2.1, 0],
    description: 'State authorities representing Police Department and District Magistrate.',
    sources: [{ title: 'Counter Affidavit (Page 3)', file: 'counter_affidavit.pdf', page: 3 }]
  },
  {
    id: 'node-fir',
    name: 'FIR',
    subtitle: 'Dated 12 Jan 2023',
    category: 'document',
    color: '#f8fafc',
    pos3D: [-3.4, -0.2, -1.4],
    pos2D: [-3.4, -0.2, 0],
    description: 'First Information Report No. 45/2023 registered at local police station.',
    sources: [{ title: 'FIR (Page 1)', file: 'doc_fir_2023.pdf', page: 1 }]
  },
  {
    id: 'node-chargesheet',
    name: 'Charge Sheet',
    subtitle: 'Dated 14 Feb 2023',
    category: 'document',
    color: '#f8fafc',
    pos3D: [-2.8, -2.1, 1.5],
    pos2D: [-2.8, -2.1, 0],
    description: 'Final Police Report submitted without annexing crucial medical verification documents.',
    sources: [{ title: 'Charge Sheet (Page 4)', file: 'chargesheet.pdf', page: 4 }]
  },
  {
    id: 'node-cctv',
    name: 'Key Evidence',
    subtitle: 'CCTV Footage',
    category: 'document',
    color: '#f8fafc',
    pos3D: [-1.2, -3.1, -0.8],
    pos2D: [-1.2, -3.1, 0],
    description: 'Electronic evidence showing petitioner was detained 36 hours prior to recorded arrest entry.',
    sources: [{ title: 'CCTV Report (Page 5)', file: 'cctv_report.pdf', page: 5 }]
  },
  {
    id: 'node-legal-issue',
    name: 'Legal Issue',
    subtitle: 'Violation of Article 14 & 21',
    category: 'legal_issue',
    color: '#f59e0b',
    pos3D: [3.4, 0.9, 1.4],
    pos2D: [3.4, 0.9, 0],
    description: 'Arbitrary executive action and breach of constitutional mandate under Article 22(2).',
    sources: [{ title: 'Petition (Page 14)', file: 'petition.pdf', page: 14 }]
  },
  {
    id: 'node-precedent',
    name: 'Precedent',
    subtitle: 'Maneka Gandhi v. UOI',
    category: 'precedent',
    color: '#eab308',
    pos3D: [3.8, -0.8, -1.2],
    pos2D: [3.8, -0.8, 0],
    description: 'Landmark ruling establishing that procedure depriving personal liberty must be just, fair and reasonable.',
    sources: [{ title: '(1978) 1 SCC 248', file: 'sci_reporters.pdf', page: 248 }]
  },
  {
    id: 'node-statute',
    name: 'Statute',
    subtitle: 'Constitutionality v. UOI',
    category: 'statute',
    color: '#b45309',
    pos3D: [2.5, -2.4, 1.1],
    pos2D: [2.5, -2.4, 0],
    description: 'Statutory provisions governing procedure established by law under CrPC Section 57 / BNSS.',
    sources: [{ title: 'Constitution of India', file: 'india_code.pdf', page: 45 }]
  }
];

interface ThreeCaseGraphViewProps {
  onSelectNode?: (node: GraphNode) => void;
  selectedNodeId?: string;
  onViewInTimeline?: (date?: string) => void;
}

export const ThreeCaseGraphView: React.FC<ThreeCaseGraphViewProps> = ({
  onSelectNode,
  selectedNodeId = 'node-incident',
  onViewInTimeline
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [activeNode, setActiveNode] = useState<GraphNode>(DEFAULT_NODES[0]);
  const [nodeScreenPos, setNodeScreenPos] = useState<{ [id: string]: { x: number; y: number; visible: boolean } }>({});

  const is3DRef = useRef(is3DMode);
  is3DRef.current = is3DMode;

  useEffect(() => {
    const found = DEFAULT_NODES.find((n) => n.id === selectedNodeId);
    if (found) setActiveNode(found);
  }, [selectedNodeId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 650;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0d12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Subtle Technical Dot Grid Floor
    const gridCount = 28;
    const gridSpacing = 0.55;
    const gridPoints: number[] = [];
    for (let x = -gridCount / 2; x <= gridCount / 2; x++) {
      for (let y = -gridCount / 2; y <= gridCount / 2; y++) {
        gridPoints.push(x * gridSpacing, y * gridSpacing, -1.8);
      }
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    const gridMat = new THREE.PointsMaterial({
      color: 0x1f2433,
      size: 0.035,
      transparent: true,
      opacity: 0.7
    });
    const gridMesh = new THREE.Points(gridGeo, gridMat);
    scene.add(gridMesh);

    // 3. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const centerPointLight = new THREE.PointLight(0xe53935, 3.5, 8);
    centerPointLight.position.set(0, 0, 1);
    scene.add(centerPointLight);

    // 4. Node Meshes & Energy Packets
    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    interface MeshEntry {
      node: GraphNode;
      mesh: THREE.Mesh;
      glowRing: THREE.Mesh;
      currentPos: THREE.Vector3;
      targetPos: THREE.Vector3;
    }

    const nodeEntries: MeshEntry[] = [];
    const raycastMeshes: THREE.Mesh[] = [];

    DEFAULT_NODES.forEach((node) => {
      const isIncident = node.id === 'node-incident';
      const radius = isIncident ? 0.45 : 0.26;

      // Central core sphere
      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        emissive: new THREE.Color(node.color),
        emissiveIntensity: isIncident ? 0.6 : 0.25,
        roughness: 0.3,
        metalness: 0.2
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.userData = { nodeId: node.id };
      raycastMeshes.push(sphereMesh);

      // Outer glowing ring
      const ringGeo = new THREE.RingGeometry(radius + 0.08, radius + 0.16, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isIncident ? 0.75 : 0.4
      });
      const glowRing = new THREE.Mesh(ringGeo, ringMat);
      sphereMesh.add(glowRing);

      const targetPos = new THREE.Vector3(...(is3DRef.current ? node.pos3D : node.pos2D));
      sphereMesh.position.copy(targetPos);
      graphGroup.add(sphereMesh);

      nodeEntries.push({
        node,
        mesh: sphereMesh,
        glowRing,
        currentPos: sphereMesh.position,
        targetPos
      });
    });

    // 5. Curved Connection Lines to Incident Hub
    const incidentNode = DEFAULT_NODES[0];
    const incidentVec = new THREE.Vector3(0, 0, 0);

    interface LineEntry {
      sourceId: string;
      lineMesh: THREE.Line;
      curve: THREE.CatmullRomCurve3;
      packetMesh: THREE.Mesh;
      t: number;
      speed: number;
    }

    const lineEntries: LineEntry[] = [];

    DEFAULT_NODES.slice(1).forEach((node, idx) => {
      const targetVec = new THREE.Vector3(...(is3DRef.current ? node.pos3D : node.pos2D));
      const midVec = new THREE.Vector3(
        (incidentVec.x + targetVec.x) * 0.5 + (Math.sin(idx) * 0.4),
        (incidentVec.y + targetVec.y) * 0.5 + (Math.cos(idx) * 0.3),
        (incidentVec.z + targetVec.z) * 0.5 + 0.3
      );

      const curve = new THREE.CatmullRomCurve3([incidentVec, midVec, targetVec]);
      const points = curve.getPoints(36);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: 0.45
      });
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      graphGroup.add(lineMesh);

      // Glowing energy packet flowing along line
      const packetGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(node.color) });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      graphGroup.add(packetMesh);

      lineEntries.push({
        sourceId: node.id,
        lineMesh,
        curve,
        packetMesh,
        t: Math.random(),
        speed: 0.0035 + (idx % 3) * 0.0015
      });
    });

    // 6. Camera Orbiting & Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      // Raycasting for node hover
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastMeshes);

      if (intersects.length > 0) {
        const id = intersects[0].object.userData.nodeId;
        const n = DEFAULT_NODES.find((item) => item.id === id);
        if (n) setHoveredNode(n);
        container.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        if (is3DRef.current) {
          rotationVelocityY = deltaX * 0.004;
          rotationVelocityX = deltaY * 0.004;
        } else {
          // In 2D mode, pan graph
          graphGroup.position.x += deltaX * 0.008;
          graphGroup.position.y -= deltaY * 0.008;
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        // If mouse didn't drag much, interpret as click
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(raycastMeshes);

        if (intersects.length > 0) {
          const id = intersects[0].object.userData.nodeId;
          const n = DEFAULT_NODES.find((item) => item.id === id);
          if (n) {
            setActiveNode(n);
            if (onSelectNode) onSelectNode(n);
          }
        }
      }
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.005, 5, 18);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 7. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const updateScreenCoordinates = () => {
      const positions: { [id: string]: { x: number; y: number; visible: boolean } } = {};
      const tempVec = new THREE.Vector3();

      nodeEntries.forEach(({ node, mesh }) => {
        mesh.getWorldPosition(tempVec);
        tempVec.project(camera);

        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-(tempVec.y * 0.5) + 0.5) * height;
        const isVisible = tempVec.z < 1 && screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50;

        positions[node.id] = { x: screenX, y: screenY, visible: isVisible };
      });

      setNodeScreenPos(positions);
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Apply drag momentum in 3D
      if (is3DRef.current) {
        graphGroup.rotation.y += rotationVelocityY;
        graphGroup.rotation.x += rotationVelocityX;
        rotationVelocityY *= 0.92;
        rotationVelocityX *= 0.92;

        // Subtle idle rotation when not dragging
        if (!isDragging && Math.abs(rotationVelocityY) < 0.0001) {
          graphGroup.rotation.y += 0.0008;
        }
      } else {
        // In 2D, smoothly lerp rotation to 0
        graphGroup.rotation.x += (0 - graphGroup.rotation.x) * 0.08;
        graphGroup.rotation.y += (0 - graphGroup.rotation.y) * 0.08;
      }

      // Smoothly transition node positions between 2D and 3D
      nodeEntries.forEach(({ node, mesh, glowRing }) => {
        const target = is3DRef.current ? node.pos3D : node.pos2D;
        mesh.position.x += (target[0] - mesh.position.x) * 0.08;
        mesh.position.y += (target[1] - mesh.position.y) * 0.08;
        mesh.position.z += (target[2] - mesh.position.z) * 0.08;

        // Pulsing glow ring on active or incident node
        if (node.id === activeNode.id || node.id === 'node-incident') {
          const scale = 1 + Math.sin(elapsed * 3) * 0.12;
          glowRing.scale.set(scale, scale, 1);
        }

        glowRing.lookAt(camera.position);
      });

      // Update lines and energy packets
      lineEntries.forEach((entry) => {
        const entryNode = nodeEntries.find((ne) => ne.node.id === entry.sourceId);
        if (entryNode) {
          const target = entryNode.mesh.position;
          const midVec = new THREE.Vector3(
            (incidentVec.x + target.x) * 0.5,
            (incidentVec.y + target.y) * 0.5 + 0.2,
            (incidentVec.z + target.z) * 0.5 + (is3DRef.current ? 0.3 : 0)
          );
          entry.curve.points = [incidentVec, midVec, target];

          const pts = entry.curve.getPoints(24);
          entry.lineMesh.geometry.setFromPoints(pts);

          // Advance energy packet along curve
          entry.t = (entry.t + entry.speed) % 1;
          const packetPos = entry.curve.getPointAt(entry.t);
          entry.packetMesh.position.copy(packetPos);
        }
      });

      renderer.render(scene, camera);
      updateScreenCoordinates();
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [is3DMode, activeNode.id]);

  return (
    <div className="relative w-full h-[620px] rounded-2xl bg-[#0c0d12] border border-[#222736] overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab" />

      {/* Floating 2D HTML Node Labels rendered directly over 3D coordinates */}
      {DEFAULT_NODES.map((n) => {
        const pos = nodeScreenPos[n.id];
        if (!pos || !pos.visible) return null;
        const isActive = n.id === activeNode.id;
        const isHovered = hoveredNode?.id === n.id;

        return (
          <div
            key={n.id}
            onClick={() => {
              setActiveNode(n);
              if (onSelectNode) onSelectNode(n);
            }}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, calc(-100% - 14px))',
              borderColor: isActive ? n.color : isHovered ? '#ffffff' : '#2d3345',
              boxShadow: isActive ? `0 0 16px ${n.color}50` : 'none'
            }}
            className={`absolute pointer-events-auto cursor-pointer px-2.5 py-1 rounded-lg bg-[#141722]/90 backdrop-blur-md border text-left transition-all duration-200 z-10 ${
              isActive ? 'scale-105 z-20' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: n.color }} />
              <span className="text-white text-xs font-semibold whitespace-nowrap">{n.name}</span>
            </div>
            {n.subtitle && (
              <div className="text-[10px] text-slate-400 whitespace-nowrap pl-3.5 font-mono">{n.subtitle}</div>
            )}
          </div>
        );
      })}

      {/* Top Left Indicator: Case Node Stats */}
      <div className="absolute top-4 left-5 pointer-events-none flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          KNOWLEDGE GRAPH • 9 CONNECTED ENTITIES
        </span>
      </div>

      {/* Bottom Bar: Legend, 2D/3D Mode Switcher & Camera Zoom Controls */}
      <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Node Categories Legend */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#131622]/90 backdrop-blur-md border border-[#272d3e] text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Party
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Event
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-200" /> Document
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Legal Issue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" /> Precedent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-700" /> Statute
          </span>
        </div>

        {/* 2D / 3D Mode Toggle & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-full bg-[#131622]/90 backdrop-blur-md border border-[#272d3e]">
            <button
              onClick={() => setIs3DMode(false)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                !is3DMode ? 'bg-[#c52828] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setIs3DMode(true)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                is3DMode ? 'bg-[#c52828] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D
            </button>
          </div>

          {/* Reset / Center */}
          <button
            onClick={() => {
              setIs3DMode(true);
            }}
            className="w-8 h-8 rounded-full bg-[#131622]/90 backdrop-blur-md border border-[#272d3e] text-slate-300 hover:text-white flex items-center justify-center text-xs"
            title="Reset Perspective"
          >
            ⤢
          </button>
        </div>
      </div>
    </div>
  );
};
