"use client";

import { useMemo } from "react";
import * as THREE from "three";

export interface PassengerSpec {
  pos: [number, number, number];
  rotationY: number;
  shirtColor: string;
  pantColor: string;
  isSitting?: boolean;
  hasLuggage?: boolean;
  isCoolie?: boolean;
}

export const PASSENGER_SPECS: PassengerSpec[] = [
  // Ground Floor Waiting Hall Benches Passengers (Sitting on row 1 at Z=2.45, row 2 at Z=5.45)
  { pos: [-13.8, 0.45, 2.45], rotationY: 0, shirtColor: "#2563EB", pantColor: "#1E293B", isSitting: true, hasLuggage: true },
  { pos: [-12.0, 0.45, 2.45], rotationY: 0, shirtColor: "#DC2626", pantColor: "#0F172A", isSitting: true },
  { pos: [-10.2, 0.45, 2.45], rotationY: 0, shirtColor: "#059669", pantColor: "#334155", isSitting: true },

  { pos: [-13.2, 0.45, 5.45], rotationY: 0, shirtColor: "#D97706", pantColor: "#1E293B", isSitting: true },
  { pos: [-11.4, 0.45, 5.45], rotationY: 0, shirtColor: "#9333EA", pantColor: "#0F172A", isSitting: true, hasLuggage: true },
  { pos: [-9.6, 0.45, 5.45], rotationY: 0, shirtColor: "#0284C7", pantColor: "#334155", isSitting: true },

  // AC Lounge & Ladies Lounge Seated Passengers
  { pos: [14.0, 0.45, 16.0], rotationY: -Math.PI / 2, shirtColor: "#1E3A8A", pantColor: "#334155", isSitting: true },
  { pos: [14.0, 0.45, 8.0], rotationY: -Math.PI / 2, shirtColor: "#BE185D", pantColor: "#831843", isSitting: true },

  // Ticket Counter Queue Passengers (Standing)
  { pos: [-12, 0, 18.5], rotationY: 0, shirtColor: "#4F46E5", pantColor: "#1E293B", hasLuggage: true },
  { pos: [-12, 0, 20.0], rotationY: 0, shirtColor: "#0284C7", pantColor: "#334155" },
  { pos: [-12, 0, 21.5], rotationY: 0, shirtColor: "#059669", pantColor: "#1E293B", hasLuggage: true },
  { pos: [-9, 0, 18.5], rotationY: 0, shirtColor: "#7C3AED", pantColor: "#0F172A" },

  // Main Station Concourse Walking Passengers
  { pos: [-4, 0, 12], rotationY: -Math.PI / 2, shirtColor: "#EA580C", pantColor: "#1E293B", hasLuggage: true },
  { pos: [3, 0, 15], rotationY: Math.PI / 4, shirtColor: "#0284C7", pantColor: "#334155" },
  { pos: [1, 0, 6], rotationY: Math.PI, shirtColor: "#16A34A", pantColor: "#0F172A", hasLuggage: true },

  // Red Shirt Coolie Porters with Luggage Trolley
  { pos: [-2, 0, 22], rotationY: Math.PI / 6, shirtColor: "#DC2626", pantColor: "#FFFFFF", isCoolie: true, hasLuggage: true },
  { pos: [4, 0, -6], rotationY: -Math.PI / 3, shirtColor: "#DC2626", pantColor: "#FFFFFF", isCoolie: true, hasLuggage: true },

  // Platform 1 Passengers (Standing & Seated on Benches at Y=1.05)
  { pos: [-20, 0.8, -8], rotationY: Math.PI / 2, shirtColor: "#2563EB", pantColor: "#1E293B", hasLuggage: true },
  { pos: [-22, 1.05, -8.0], rotationY: 0, shirtColor: "#D97706", pantColor: "#0F172A", isSitting: true },
  { pos: [0, 1.05, -8.0], rotationY: 0, shirtColor: "#2563EB", pantColor: "#1E293B", isSitting: true },
  { pos: [10, 0.8, -8], rotationY: -Math.PI / 2, shirtColor: "#059669", pantColor: "#334155" },

  // Platform 2 & 3 Passengers
  { pos: [-5, 0.8, -20], rotationY: 0, shirtColor: "#9333EA", pantColor: "#1E293B", hasLuggage: true },
  { pos: [12, 1.05, -20.0], rotationY: Math.PI, shirtColor: "#0284C7", pantColor: "#334155", isSitting: true },
  { pos: [-22, 1.05, -20.0], rotationY: 0, shirtColor: "#EA580C", pantColor: "#0F172A", isSitting: true },

  // Platform 4 & 5 Passengers
  { pos: [-22, 1.05, -34.0], rotationY: 0, shirtColor: "#16A34A", pantColor: "#1E293B", isSitting: true },

  // Foot Overbridge Deck Passengers
  { pos: [-2, 6.2, -18], rotationY: -Math.PI / 2, shirtColor: "#E11D48", pantColor: "#1E293B" },
  { pos: [1, 6.2, -28], rotationY: Math.PI / 2, shirtColor: "#2563EB", pantColor: "#0F172A", hasLuggage: true },
];

function HumanFigure({ spec }: { spec: PassengerSpec }) {
  const { pos, rotationY, shirtColor, pantColor, isSitting, hasLuggage, isCoolie } = spec;

  return (
    <group position={pos} rotation={[0, rotationY, 0]}>
      {isSitting ? (
        // Seated Passenger Model (Group origin at top surface of bench seat)
        <group>
          {/* Seated Thighs - bottom rests directly at Y=0 (bench top) */}
          <mesh position={[0, 0.08, 0.18]} castShadow>
            <boxGeometry args={[0.36, 0.16, 0.36]} />
            <meshStandardMaterial color={pantColor} roughness={0.7} />
          </mesh>
          {/* Torso */}
          <mesh position={[0, 0.40, 0.02]} castShadow>
            <boxGeometry args={[0.38, 0.48, 0.22]} />
            <meshStandardMaterial color={shirtColor} roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.76, 0.02]} castShadow>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="#D4A373" roughness={0.8} />
          </mesh>
          {/* Lower Legs (extending down from knees) */}
          <mesh position={[0, -0.20, 0.32]} castShadow>
            <boxGeometry args={[0.32, 0.40, 0.14]} />
            <meshStandardMaterial color={pantColor} roughness={0.7} />
          </mesh>
        </group>
      ) : (
        // Standing / Walking Passenger Model
        <group>
          {/* Legs */}
          <mesh position={[-0.1, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
            <meshStandardMaterial color={pantColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.1, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
            <meshStandardMaterial color={pantColor} roughness={0.7} />
          </mesh>
          {/* Torso */}
          <mesh position={[0, 1.15, 0]} castShadow>
            <boxGeometry args={[0.42, 0.55, 0.24]} />
            <meshStandardMaterial color={shirtColor} roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 1.55, 0]} castShadow>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#C68B59" roughness={0.8} />
          </mesh>
          {/* Coolie Red Turban / Cap */}
          {isCoolie && (
            <mesh position={[0, 1.68, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
              <meshStandardMaterial color="#DC2626" />
            </mesh>
          )}
        </group>
      )}

      {/* Passenger Travel Suitcase / Luggage */}
      {hasLuggage && (
        <group position={[0.38, isSitting ? 0.0 : 0.3, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.42, 0.22]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
          {/* Luggage Pull Handle */}
          <mesh position={[0, 0.26, 0]} castShadow>
            <boxGeometry args={[0.16, 0.12, 0.03]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function PassengerCrowd() {
  return (
    <group name="passenger-crowd">
      {PASSENGER_SPECS.map((spec, idx) => (
        <HumanFigure key={idx} spec={spec} />
      ))}
    </group>
  );
}
