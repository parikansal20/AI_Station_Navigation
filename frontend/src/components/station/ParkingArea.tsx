"use client";

import { useMemo } from "react";
import { createAsphaltTexture, createSignboardTexture } from "@/utils/textures";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";

function AutoRickshaw({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.4, 0.5, 2.2]} />
        <meshStandardMaterial color="#1E5631" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.15, -0.1]} castShadow>
        <boxGeometry args={[1.35, 0.8, 1.8]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.05, 0.82]}>
        <planeGeometry args={[1.2, 0.6]} />
        <meshPhysicalMaterial color="#AEE" transmission={0.8} opacity={0.9} transparent roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.65, 0.5]} castShadow>
        <boxGeometry args={[0.8, 0.15, 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.65, -0.5]} castShadow>
        <boxGeometry args={[1.2, 0.15, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.2, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15]} />
        <meshStandardMaterial color="#111" metalness={0.8} />
      </mesh>
      <mesh position={[-0.6, 0.2, -0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15]} />
        <meshStandardMaterial color="#111" metalness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.2, -0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15]} />
        <meshStandardMaterial color="#111" metalness={0.8} />
      </mesh>
    </group>
  );
}

function Car({ position, color = "#2563EB", rotationY = 0 }: { position: [number, number, number]; color?: string; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.8, 0.6, 3.8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.15, -0.2]} castShadow>
        <boxGeometry args={[1.6, 0.6, 2.0]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.15, 0.72]}>
        <planeGeometry args={[1.4, 0.45]} />
        <meshPhysicalMaterial color="#334" transmission={0.85} opacity={0.9} transparent roughness={0.1} />
      </mesh>
      {[-0.85, 0.85].map((xW, xIdx) =>
        [-1.1, 1.1].map((zW, zIdx) => (
          <mesh key={`${xIdx}-${zIdx}`} position={[xW, 0.25, zW]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.2]} />
            <meshStandardMaterial color="#222" metalness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
}

export default function ParkingArea() {
  const setSelectedFacility = useSimulationStore((s) => s.setSelectedFacility);

  const asphaltTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createAsphaltTexture();
  }, []);

  const parkingSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("स्टेशन पार्किंग एवं ऑटो स्टैंड", "STATION PARKING & PRE-PAID AUTO STAND", "#0F3870", "#FFD700");
  }, []);

  return (
    <group
      position={[0, 0, 36]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "parking-area") || null);
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[44, 16]} />
        <meshStandardMaterial map={asphaltTex || undefined} color="#33373B" roughness={0.8} />
      </mesh>

      <group position={[0, 0, 7.5]}>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[8.0, 1.2, 0.15]} />
          <meshStandardMaterial color="#0F3870" />
        </mesh>
        {parkingSignTex && (
          <mesh position={[0, 2.5, 0.09]}>
            <planeGeometry args={[7.8, 1.1]} />
            <meshBasicMaterial map={parkingSignTex} />
          </mesh>
        )}
        <mesh position={[-3.8, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2.5]} />
          <meshStandardMaterial color="#444" metalness={0.9} />
        </mesh>
        <mesh position={[3.8, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2.5]} />
          <meshStandardMaterial color="#444" metalness={0.9} />
        </mesh>
      </group>

      <AutoRickshaw position={[-14, 0, -2]} rotationY={Math.PI / 2} />
      <AutoRickshaw position={[-14, 0, 2]} rotationY={Math.PI / 2} />
      <AutoRickshaw position={[-14, 0, 6]} rotationY={Math.PI / 2} />

      <Car position={[6, 0, -3]} color="#E11D48" rotationY={Math.PI} />
      <Car position={[11, 0, -3]} color="#FFFFFF" rotationY={Math.PI} />
      <Car position={[16, 0, -3]} color="#0284C7" rotationY={Math.PI} />
      <Car position={[11, 0, 4]} color="#F59E0B" rotationY={0} />

      {[-18, 0, 18].map((xLight, lIdx) => (
        <group key={lIdx} position={[xLight, 0, 7]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 4.4]} />
            <meshStandardMaterial color="#223344" metalness={0.9} />
          </mesh>
          <mesh position={[0, 4.4, 0]}>
            <boxGeometry args={[0.6, 0.15, 0.4]} />
            <meshStandardMaterial color="#FFD" emissive="#FFD" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
