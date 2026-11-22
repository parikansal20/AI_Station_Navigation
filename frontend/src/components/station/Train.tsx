"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface TrainProps {
  trackZ: number;
  initialX?: number;
  direction?: 1 | -1;
  speed?: number;
  isVandeBharat?: boolean;
}

export default function Train({
  trackZ,
  initialX = -10,
  direction = 1,
  speed = 0.08,
  isVandeBharat = false,
}: TrainProps) {
  const trainGroupRef = useRef<THREE.Group>(null);
  const posXRef = useRef(initialX);

  useFrame((_, delta) => {
    if (!trainGroupRef.current) return;
    posXRef.current += direction * speed * delta * 60;
    if (direction === 1 && posXRef.current > 45) posXRef.current = -55;
    if (direction === -1 && posXRef.current < -55) posXRef.current = 45;
    trainGroupRef.current.position.x = posXRef.current;
  });

  const bodyColor = isVandeBharat ? "#FFFFFF" : "#103874";
  const stripeColor = isVandeBharat ? "#103874" : "#D42A2A";

  return (
    <group ref={trainGroupRef} position={[initialX, 0, trackZ]}>
      <group position={[14 * direction, 0, 0]}>
        <mesh position={[0, 2.1, 0]} castShadow>
          <boxGeometry args={[8.0, 3.2, 2.7]} />
          <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[4.1 * direction, 1.8, 0]} rotation={[0, 0, -0.3 * direction]} castShadow>
          <boxGeometry args={[1.3, 2.6, 2.65]} />
          <meshStandardMaterial color={stripeColor} roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[4.6 * direction, 1.5, 0.8]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1]} />
          <meshBasicMaterial color="#FFFFDD" />
        </mesh>
        <mesh position={[4.6 * direction, 1.5, -0.8]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1]} />
          <meshBasicMaterial color="#FFFFDD" />
        </mesh>
        <mesh position={[0, 3.9, 0]} castShadow>
          <boxGeometry args={[1.8, 0.4, 1.2]} />
          <meshStandardMaterial color="#222" metalness={0.9} />
        </mesh>
      </group>

      {[-1, -2, -3].map((coachIdx) => {
        const xOffset = coachIdx * 14.0 * direction;
        return (
          <group key={coachIdx} position={[xOffset, 0, 0]}>
            <mesh position={[0, 2.1, 0]} castShadow>
              <boxGeometry args={[13.2, 3.1, 2.7]} />
              <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.3} />
            </mesh>

            <mesh position={[0, 2.1, 1.36]}>
              <planeGeometry args={[13.0, 0.5]} />
              <meshStandardMaterial color={stripeColor} />
            </mesh>
            <mesh position={[0, 2.1, -1.36]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[13.0, 0.5]} />
              <meshStandardMaterial color={stripeColor} />
            </mesh>

            {[-4.5, -2.5, -0.5, 1.5, 3.5].map((xWin, wIdx) => (
              <group key={wIdx}>
                <mesh position={[xWin, 2.3, 1.37]}>
                  <planeGeometry args={[1.2, 0.7]} />
                  <meshPhysicalMaterial color="#335" transmission={0.9} opacity={1} transparent roughness={0.1} />
                </mesh>
                <mesh position={[xWin, 2.3, -1.37]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[1.2, 0.7]} />
                  <meshPhysicalMaterial color="#335" transmission={0.9} opacity={1} transparent roughness={0.1} />
                </mesh>
              </group>
            ))}

            {[-4.2, 4.2].map((xBogie, bIdx) => (
              <group key={bIdx} position={[xBogie, 0.4, 0]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[2.4, 0.3, 2.3]} />
                  <meshStandardMaterial color="#222" metalness={0.8} />
                </mesh>
                {[-0.75, 0.75].map((xWheel, wIdx) => (
                  <mesh key={wIdx} position={[xWheel, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.38, 0.38, 2.4]} />
                    <meshStandardMaterial color="#555" metalness={0.9} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}
