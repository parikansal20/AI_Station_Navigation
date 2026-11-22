"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/store/simulationStore";

function PathArrow({ position, quaternion }: { position: THREE.Vector3; quaternion: THREE.Quaternion }) {
  return (
    <group position={position} quaternion={quaternion}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} castShadow>
        <coneGeometry args={[0.35, 0.7, 4]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFB300"
          emissiveIntensity={1.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

export default function PathRenderer() {
  const activePathResult = useSimulationStore((s) => s.activePathResult);
  const isLiveNavigating = useSimulationStore((s) => s.isLiveNavigating);
  const currentNavStepIndex = useSimulationStore((s) => s.currentNavStepIndex);

  const breadcrumbGroupRef = useRef<THREE.Group>(null);
  const goalBeaconRef = useRef<THREE.Group>(null);
  const liveAvatarRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);

  const { curve, tubeGeometry, arrowSampleData, startPos, endPos, currentStepPos } = useMemo(() => {
    if (!activePathResult || activePathResult.nodes.length < 2) {
      return { curve: null, tubeGeometry: null, arrowSampleData: [], startPos: null, endPos: null, currentStepPos: null };
    }

    const displayNodes = isLiveNavigating
      ? activePathResult.nodes.slice(Math.min(currentNavStepIndex, activePathResult.nodes.length - 1))
      : activePathResult.nodes;

    if (displayNodes.length < 2) {
      const lastNode = activePathResult.nodes[activePathResult.nodes.length - 1];
      return {
        curve: null,
        tubeGeometry: null,
        arrowSampleData: [],
        startPos: activePathResult.nodes[0].position,
        endPos: lastNode ? lastNode.position : null,
        currentStepPos: lastNode ? lastNode.position : null,
      };
    }

    const rawNodes = displayNodes.map(
      (n) => new THREE.Vector3(n.position[0], n.position[1], n.position[2])
    );

    const nodePoints: THREE.Vector3[] = [];
    for (let i = 0; i < rawNodes.length; i++) {
      const curr = rawNodes[i];
      if (nodePoints.length === 0) {
        nodePoints.push(curr);
      } else {
        const prev = nodePoints[nodePoints.length - 1];
        const dist = prev.distanceTo(curr);
        if (dist > 0.1) {
          const heightDiff = Math.abs(curr.y - prev.y);
          const steps = heightDiff > 0.5 ? Math.max(5, Math.floor(dist / 1.2)) : Math.max(1, Math.floor(dist / 4.0));
          for (let s = 1; s <= steps; s++) {
            const subPoint = new THREE.Vector3().lerpVectors(prev, curr, s / steps);
            nodePoints.push(subPoint);
          }
        }
      }
    }

    if (nodePoints.length < 2) {
      return { curve: null, tubeGeometry: null, arrowSampleData: [], startPos: null, endPos: null, currentStepPos: null };
    }

    const splineCurve = new THREE.CatmullRomCurve3(nodePoints, false, "catmullrom", 0.0);
    const geometry = new THREE.TubeGeometry(splineCurve, 128, 0.18, 8, false);

    let remainingDist = 0;
    for (let i = 0; i < displayNodes.length - 1; i++) {
      const p1 = displayNodes[i].position;
      const p2 = displayNodes[i + 1].position;
      remainingDist += Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
    }

    const numArrows = Math.max(2, Math.floor(remainingDist / 4));
    const arrowData: { pos: THREE.Vector3; quat: THREE.Quaternion }[] = [];

    const defaultUp = new THREE.Vector3(0, 1, 0);

    for (let i = 1; i < numArrows; i++) {
      const t = i / numArrows;
      const pos = splineCurve.getPointAt(t);
      const tangent = splineCurve.getTangentAt(t).normalize();

      const matrix = new THREE.Matrix4();
      matrix.lookAt(new THREE.Vector3(0, 0, 0), tangent, defaultUp);
      const quat = new THREE.Quaternion().setFromRotationMatrix(matrix);

      arrowData.push({ pos, quat });
    }

    const activeStepNode = activePathResult.nodes[Math.min(currentNavStepIndex, activePathResult.nodes.length - 1)];

    return {
      curve: splineCurve,
      tubeGeometry: geometry,
      arrowSampleData: arrowData,
      startPos: displayNodes[0].position,
      endPos: activePathResult.nodes[activePathResult.nodes.length - 1].position,
      currentStepPos: activeStepNode ? activeStepNode.position : displayNodes[0].position,
    };
  }, [activePathResult, isLiveNavigating, currentNavStepIndex]);

  useFrame((_, delta) => {
    if (!curve || !breadcrumbGroupRef.current) return;

    progressRef.current = (progressRef.current + delta * 0.35) % 1.0;

    breadcrumbGroupRef.current.children.forEach((child, idx) => {
      const offset = (progressRef.current + idx * 0.12) % 1.0;
      const point = curve.getPointAt(offset);
      child.position.set(point.x, point.y + 0.15, point.z);
    });

    if (goalBeaconRef.current) {
      goalBeaconRef.current.rotation.y += delta * 2.0;
      goalBeaconRef.current.position.y = (endPos ? endPos[1] : 0) + 1.8 + Math.sin(Date.now() * 0.004) * 0.3;
    }

    if (liveAvatarRef.current && currentStepPos) {
      liveAvatarRef.current.rotation.y += delta * 1.5;
      liveAvatarRef.current.position.set(
        currentStepPos[0],
        currentStepPos[1] + 0.3 + Math.sin(Date.now() * 0.006) * 0.15,
        currentStepPos[2]
      );
    }
  });

  if (!curve || !tubeGeometry || !startPos || !endPos) return null;

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color={isLiveNavigating ? "#00FFCC" : "#00E5FF"}
          emissive={isLiveNavigating ? "#00D6A4" : "#00B0FF"}
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {arrowSampleData.map((arrow, idx) => (
        <PathArrow key={idx} position={arrow.pos} quaternion={arrow.quat} />
      ))}

      <group ref={breadcrumbGroupRef}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <mesh key={idx}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        ))}
      </group>

      {isLiveNavigating && currentStepPos && (
        <group ref={liveAvatarRef} position={currentStepPos}>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.05]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <octahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color="#FFD700" emissive="#FF8800" emissiveIntensity={2.0} />
          </mesh>
        </group>
      )}

      <group position={endPos}>
        <group ref={goalBeaconRef} position={[0, 1.8, 0]}>
          <mesh rotation={[Math.PI, 0, 0]} castShadow>
            <coneGeometry args={[0.6, 1.2, 4]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.5} />
          </mesh>
        </group>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.1]} />
          <meshBasicMaterial color="#EF4444" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}
