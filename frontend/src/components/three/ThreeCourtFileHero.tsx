import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface TagPosition {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  visible: boolean;
  color: string;
}

interface ThreeCourtFileHeroProps {
  onSelectFeature?: (feature: string) => void;
}

export const ThreeCourtFileHero: React.FC<ThreeCourtFileHeroProps> = ({ onSelectFeature }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<TagPosition[]>([
    { id: 'petitions', label: 'Petitions', icon: '📄', x: 0, y: 0, visible: false, color: '#ef4444' },
    { id: 'evidence', label: 'Evidence', icon: '📑', x: 0, y: 0, visible: false, color: '#f59e0b' },
    { id: 'timeline', label: 'Timeline', icon: '⏱', x: 0, y: 0, visible: false, color: '#3b82f6' },
    { id: 'judgments', label: 'Judgments', icon: '⚖️', x: 0, y: 0, visible: false, color: '#10b981' }
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 560;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Adjusted camera position to frame the court file on the right and documents bursting left
    camera.position.set(0.3, 0.1, 7.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // --- 2. Dramatic Studio & Courtroom Lighting ---
    const ambientLight = new THREE.AmbientLight(0x2a2f40, 1.8);
    scene.add(ambientLight);

    // Main warm sunlight from upper left
    const sunLight = new THREE.DirectionalLight(0xfff6e6, 3.8);
    sunLight.position.set(5, 8, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Crimson legal rim light from bottom left
    const rimLight = new THREE.PointLight(0xef4444, 3.2, 14);
    rimLight.position.set(-4.5, -1.5, 4);
    scene.add(rimLight);

    // Soft warm backlight
    const backLight = new THREE.DirectionalLight(0xe5a93c, 1.2);
    backLight.position.set(-2, 4, -4);
    scene.add(backLight);

    // --- 3. High-Res Procedural Canvas Textures ---
    // A) Court File Manila Cover Texture with Gold Ashoka Lion Emblem
    const createFolderCoverTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d')!;

      // Rich Manila Kraft Leatherette background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1440);
      bgGrad.addColorStop(0, '#d1a774');
      bgGrad.addColorStop(0.35, '#c59963');
      bgGrad.addColorStop(0.7, '#b2844e');
      bgGrad.addColorStop(1, '#9e713c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 1440);

      // Paper grain fiber noise
      for (let i = 0; i < 50000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1440;
        const alpha = Math.random() * 0.09;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Legal Red Cloth Binding along spine (left edge)
      const spineGrad = ctx.createLinearGradient(0, 0, 110, 0);
      spineGrad.addColorStop(0, '#5a0d0d');
      spineGrad.addColorStop(0.7, '#8b1e1e');
      spineGrad.addColorStop(1, '#a82929');
      ctx.fillStyle = spineGrad;
      ctx.fillRect(0, 0, 110, 1440);

      // Spine stitches / brass grommets
      for (let y = 140; y < 1400; y += 220) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(55, y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2d1808';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Ornate Gold/Bronze Border
      ctx.strokeStyle = '#dfb877';
      ctx.lineWidth = 8;
      ctx.strokeRect(150, 140, 740, 1180);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fbf0d4';
      ctx.strokeRect(165, 155, 710, 1150);

      // Ashoka Lion Emblem (Embossed Metallic Gold)
      ctx.save();
      ctx.translate(520, 500);

      // Metallic seal circle
      const sealGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 150);
      sealGrad.addColorStop(0, '#fef3c7');
      sealGrad.addColorStop(0.5, '#d97706');
      sealGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = sealGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 145, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Outer beaded dots
      for (let angle = 0; angle < Math.PI * 2; angle += 0.18) {
        const bx = Math.cos(angle) * 132;
        const by = Math.sin(angle) * 132;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Abstract Lion Capital profile in deep bronze
      ctx.fillStyle = '#261204';
      ctx.beginPath();
      ctx.ellipse(0, -30, 68, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dharma Chakra Wheel
      ctx.strokeStyle = '#261204';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 75, 42, 0, Math.PI * 2);
      ctx.stroke();

      // Chakra spokes
      for (let i = 0; i < 24; i++) {
        const rad = (i * Math.PI) / 12;
        ctx.beginPath();
        ctx.moveTo(0, 75);
        ctx.lineTo(Math.cos(rad) * 40, 75 + Math.sin(rad) * 40);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Motto: सत्यमेव जयते
      ctx.fillStyle = '#1c0e04';
      ctx.font = 'bold 32px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('सत्यमेव जयते', 0, 185);

      ctx.restore();

      // Bold Title: COURT FILE
      ctx.fillStyle = '#1e1107';
      ctx.font = 'bold 64px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('COURT FILE', 520, 830);

      // Subtitle: REPUBLIC OF INDIA
      ctx.font = '700 28px "Inter", sans-serif';
      ctx.fillStyle = '#3c230e';
      ctx.letterSpacing = '8px';
      ctx.fillText('REPUBLIC OF INDIA', 520, 890);

      ctx.font = 'italic 24px "Playfair Display", serif';
      ctx.fillStyle = '#593415';
      ctx.letterSpacing = '1px';
      ctx.fillText('SUPREME COURT OF INDIA', 520, 945);

      // Stamped Case Number Box
      ctx.strokeStyle = '#8b1e1e';
      ctx.lineWidth = 4;
      ctx.strokeRect(260, 1010, 520, 95);
      ctx.fillStyle = '#8b1e1e';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillText('CASE: WP(C) 135/1973', 520, 1070);

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 16;
      return texture;
    };

    // B) Realistic Legal Document Sheet Texture
    const createDocumentTexture = (docTitle: string, pNumber: number, isHighlighted = false) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 850;
      const ctx = canvas.getContext('2d')!;

      // Crisp legal off-white bond paper
      ctx.fillStyle = '#f9f7f2';
      ctx.fillRect(0, 0, 600, 850);

      // Red legal court margin line on left
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 0);
      ctx.lineTo(70, 850);
      ctx.stroke();

      // Document Header
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px "Playfair Display", serif';
      ctx.fillText(docTitle.toUpperCase(), 90, 60);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText(`PAGE ${pNumber} OF 45`, 460, 60);

      // Rule line under header
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(90, 75);
      ctx.lineTo(540, 75);
      ctx.stroke();

      // Petition content paragraphs
      let y = 110;
      for (let i = 0; i < 24; i++) {
        const lineLen = 420 - Math.sin(i * 1.8) * 50;

        if (isHighlighted && i >= 6 && i <= 9) {
          // Soft rose highlight box for cited paragraph
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.fillRect(90, y - 10, lineLen + 10, 20);
          ctx.fillStyle = '#991b1b';
        } else {
          ctx.fillStyle = '#334155';
        }

        ctx.fillRect(90, y, lineLen, 3);
        y += 26;
      }

      // Circular Red Court Seal Stamp on bottom right
      ctx.save();
      ctx.translate(470, 740);
      ctx.rotate(-0.2);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIGH COURT', 0, -8);
      ctx.fillText('VERIFIED', 0, 8);
      ctx.fillText('CERTIFIED', 0, 24);
      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 8;
      return texture;
    };

    // --- 4. 3D Model Assembly ---
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Position composition: Court File on the right, tilted at ~25 degrees
    rootGroup.position.set(0.6, -0.15, 0);
    rootGroup.rotation.set(0.12, -0.42, 0.06);

    // 1) The Court File Folder Binder (Right Side Hero)
    const folderWidth = 3.0;
    const folderHeight = 4.2;
    const folderDepth = 0.45;

    // Front Cover (Prominently Angled and Visible)
    const frontCoverGeo = new THREE.BoxGeometry(folderWidth, folderHeight, 0.05);
    const frontCoverMat = new THREE.MeshStandardMaterial({
      map: createFolderCoverTexture(),
      roughness: 0.6,
      metalness: 0.18
    });
    const frontCover = new THREE.Mesh(frontCoverGeo, frontCoverMat);
    // Positioned on the right side of the spine
    frontCover.position.set(0.7, 0, 0.1);
    frontCover.rotation.set(0, 0.22, 0); // Open flap slightly
    frontCover.castShadow = true;
    frontCover.receiveShadow = true;
    rootGroup.add(frontCover);

    // Back Cover
    const backCoverMat = new THREE.MeshStandardMaterial({
      color: 0x9b703e,
      roughness: 0.75,
      metalness: 0.08
    });
    const backCover = new THREE.Mesh(frontCoverGeo, backCoverMat);
    backCover.position.set(0.4, 0, -0.3);
    backCover.castShadow = true;
    backCover.receiveShadow = true;
    rootGroup.add(backCover);

    // Thick Red Spine
    const spineGeo = new THREE.BoxGeometry(0.12, folderHeight, folderDepth + 0.1);
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x8b1e1e, // Crimson legal binding
      roughness: 0.5,
      metalness: 0.2
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(-0.8, 0, -0.1);
    rootGroup.add(spine);

    // 2) Cascading Radiating Documents Bursting Out Toward the Left
    const papersGroup = new THREE.Group();
    rootGroup.add(papersGroup);

    interface FloatingPaper {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      baseRot: THREE.Euler;
      flutterSpeed: number;
      flutterPhase: number;
    }

    const floatingPapers: FloatingPaper[] = [];
    const paperGeo = new THREE.PlaneGeometry(2.1, 2.9, 12, 12);

    // Subtly curve the papers along edges
    const posAttr = paperGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const py = posAttr.getY(i);
      const curl = Math.sin((px + py) * 1.4) * 0.05;
      posAttr.setZ(i, curl);
    }
    paperGeo.computeVertexNormals();

    // Document configurations fanning out from inside the folder toward the LEFT and forward
    const paperConfigs = [
      // Primary featured sheet fanning forward
      { pos: [-0.9, 0.2, 0.65], rot: [-0.08, -0.15, -0.08], title: 'Petition under Art 226', page: 14, highlight: true },
      // Upper left sheet
      { pos: [-1.6, 0.85, 0.4], rot: [-0.14, -0.32, 0.18], title: 'First Information Report', page: 2, highlight: false },
      // Lower left sheet
      { pos: [-1.4, -0.7, 0.5], rot: [0.15, -0.25, -0.14], title: 'Certified Annexure A', page: 5, highlight: false },
      // Far upper left sheet
      { pos: [-2.1, 1.2, 0.15], rot: [-0.18, -0.45, 0.25], title: 'Precedent: Maneka Gandhi', page: 8, highlight: true },
      // Lower back sheet
      { pos: [-1.8, -1.1, 0.1], rot: [0.2, -0.38, -0.22], title: 'Timeline & Event Log', page: 1, highlight: false },
      // Sheet peeking from folder interior
      { pos: [-0.1, 0.45, 0.1], rot: [0.05, 0.12, -0.05], title: 'Charge Sheet & Evidence', page: 19, highlight: false },
      // Backing sheet
      { pos: [-0.4, -0.5, -0.05], rot: [0.12, -0.05, 0.1], title: 'Affidavit of Petitioner', page: 4, highlight: false }
    ];

    paperConfigs.forEach((cfg, idx) => {
      const tex = createDocumentTexture(cfg.title, cfg.page, cfg.highlight);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.04
      });

      const paperMesh = new THREE.Mesh(paperGeo, mat);
      paperMesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      paperMesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      paperMesh.castShadow = true;
      paperMesh.receiveShadow = true;
      papersGroup.add(paperMesh);

      floatingPapers.push({
        mesh: paperMesh,
        basePos: new THREE.Vector3(...cfg.pos),
        baseRot: new THREE.Euler(...cfg.rot),
        flutterSpeed: 1.1 + idx * 0.22,
        flutterPhase: idx * 1.2
      });
    });

    // 3) Luminous Glowing Crimson Laser Lines & Floating Pins
    const linesGroup = new THREE.Group();
    rootGroup.add(linesGroup);

    // 4 feature connection anchors positioned in 3D around the composition
    const anchorPoints: { [key: string]: THREE.Vector3 } = {
      petitions: new THREE.Vector3(-1.9, 1.4, 0.8),
      evidence: new THREE.Vector3(1.9, 1.3, 0.9),
      timeline: new THREE.Vector3(-2.2, -1.2, 0.7),
      judgments: new THREE.Vector3(2.1, -1.0, 0.8)
    };

    const lineMaterials: { [key: string]: THREE.LineBasicMaterial } = {
      petitions: new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.95, linewidth: 2 }),
      evidence: new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.95, linewidth: 2 }),
      timeline: new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.95, linewidth: 2 }),
      judgments: new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.95, linewidth: 2 })
    };

    const anchorKeys = ['petitions', 'evidence', 'timeline', 'judgments'];
    anchorKeys.forEach((key) => {
      const dest = anchorPoints[key];
      // Originating from folder spine and document burst points
      const origin = key === 'petitions' || key === 'timeline' ? new THREE.Vector3(-0.9, 0.1, 0.5) : new THREE.Vector3(0.6, 0.2, 0.2);

      const mid = new THREE.Vector3(
        (origin.x + dest.x) * 0.5 + (dest.x > 0 ? 0.2 : -0.2),
        (origin.y + dest.y) * 0.5 + 0.25,
        (origin.z + dest.z) * 0.5 + 0.15
      );

      const curve = new THREE.QuadraticBezierCurve3(origin, mid, dest);
      const points = curve.getPoints(36);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMesh = new THREE.Line(curveGeo, lineMaterials[key]);
      linesGroup.add(lineMesh);

      // Glowing anchor sphere
      const sphereGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: lineMaterials[key].color });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(dest);
      linesGroup.add(sphere);

      // Pulsing outer halo ring
      const ringGeo = new THREE.RingGeometry(0.09, 0.16, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: lineMaterials[key].color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(dest);
      ring.lookAt(camera.position);
      linesGroup.add(ring);
    });

    // 4) Atmospheric Golden Dust Particles / Courtroom Sunlight Motes
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVelo: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 11;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 7;
      particleVelo.push((Math.random() - 0.5) * 0.006, Math.random() * 0.008 + 0.003, (Math.random() - 0.5) * 0.006);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- 5. Mouse Parallax ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = -0.42;
    let targetRotX = 0.12;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotY = -0.42 + mouseX * 0.22;
      targetRotX = 0.12 - mouseY * 0.18;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- 6. Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const updateTagPositions = () => {
      const newTags: TagPosition[] = [];
      const tempVec = new THREE.Vector3();

      anchorKeys.forEach((key) => {
        const localPos = anchorPoints[key];
        tempVec.copy(localPos);
        tempVec.applyMatrix4(rootGroup.matrixWorld);
        tempVec.project(camera);

        const isBehind = tempVec.z > 1;
        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-(tempVec.y * 0.5) + 0.5) * height;

        const tagInfo = tags.find((t) => t.id === key);
        if (tagInfo) {
          newTags.push({
            ...tagInfo,
            x: screenX,
            y: screenY,
            visible: !isBehind && screenX > 20 && screenX < width - 20 && screenY > 20 && screenY < height - 20
          });
        }
      });

      if (newTags.length > 0) {
        setTags(newTags);
      }
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse tilt
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.05;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.05;

      // Gentle vertical floating motion
      rootGroup.position.y = -0.15 + Math.sin(elapsed * 0.9) * 0.06;

      // Flutter individual paper documents
      floatingPapers.forEach((p) => {
        const flutter = Math.sin(elapsed * p.flutterSpeed + p.flutterPhase);
        p.mesh.position.y = p.basePos.y + flutter * 0.035;
        p.mesh.position.z = p.basePos.z + flutter * 0.025;
        p.mesh.rotation.z = p.baseRot.z + flutter * 0.02;
      });

      // Drift dust motes
      const posArr = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += particleVelo[i * 3 + 1];
        if (posArr[i * 3 + 1] > 4.5) posArr[i * 3 + 1] = -4.5;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      updateTagPositions();
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] select-none overflow-hidden" ref={mountRef}>
      {/* 3D Projected Glowing Interactive Tags */}
      {tags.map(
        (t) =>
          t.visible && (
            <div
              key={t.id}
              onClick={() => onSelectFeature && onSelectFeature(t.id)}
              style={{
                left: `${t.x}px`,
                top: `${t.y}px`,
                transform: 'translate(-50%, -50%)',
                borderColor: t.color,
                boxShadow: `0 0 24px ${t.color}50, inset 0 0 14px ${t.color}25`
              }}
              className="absolute z-30 cursor-pointer px-4 py-2 rounded-full bg-[#11131a]/92 backdrop-blur-md border border-opacity-80 text-white text-xs font-semibold tracking-wide flex items-center gap-2.5 transition-all duration-300 hover:scale-110 hover:bg-[#1a1e2a]"
            >
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: t.color }} />
              <span className="text-sm">{t.icon}</span>
              <span className="text-[13px] font-semibold text-white">{t.label}</span>
            </div>
          )
      )}
    </div>
  );
};
