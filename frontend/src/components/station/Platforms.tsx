"use client";

import { useMemo } from "react";
import { createTactileTexture, createSignboardTexture, createCoachBoardTexture, createStairBannerTexture } from "@/utils/textures";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";

export const TRACK_CONFIGS = [
  { id: "track-1", z: -12, trainType: "lucknow-mail" },
  { id: "track-2", z: -16, trainType: "passenger" },
  { id: "track-3", z: -25, trainType: "vande-bharat" },
  { id: "track-4", z: -29, trainType: "intercity" },
  { id: "track-5", z: -39, trainType: "freight" },
];

export const PLATFORM_CONFIGS = [
  { id: "platform-1", z: -8, width: 3.6, number: 1, label: "Platform 1 - Lucknow Mail Express" },
  { id: "platform-2", z: -20, width: 4.5, number: 2, label: "Platform 2 & 3 - Vande Bharat & Intercity" },
  { id: "platform-4", z: -34, width: 4.5, number: 4, label: "Platform 4 & 5 - Passenger & Freight" },
];

export default function Platforms() {
  const setSelectedFacility = useSimulationStore((s) => s.setSelectedFacility);

  const tactileTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createTactileTexture();
  }, []);

  const pf1SignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("प्लेटफॉर्म 1", "PLATFORM 1", "#0F3870", "#FFD700");
  }, []);

  const pf2SignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("प्लेटफॉर्म 2 एवं 3", "PLATFORM 2 & 3", "#0F3870", "#FFD700");
  }, []);

  const pf4SignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("प्लेटफॉर्म 4 एवं 5", "PLATFORM 4 & 5", "#0F3870", "#FFD700");
  }, []);

  const chaiSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("सारथी चाय एवं जलपान", "SARTHI CHAI & REFRESHMENTS", "#B84A00", "#FFFFFF");
  }, []);

  const fobStairsUpSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createStairBannerTexture("सीढ़ियां: फुट ओवरब्रिज (1F)", "STAIRS TO FOOT OVERBRIDGE (FOB)", "up", "#0F3870", "#FFD700");
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {TRACK_CONFIGS.map((trk) => (
        <group key={trk.id} position={[0, 0, trk.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
            <planeGeometry args={[80, 2.6]} />
            <meshStandardMaterial color="#554E45" roughness={0.9} />
          </mesh>

          {Array.from({ length: 40 }).map((_, sleeperIdx) => (
            <mesh key={sleeperIdx} position={[-38 + sleeperIdx * 2.0, 0.12, 0]} castShadow>
              <boxGeometry args={[0.35, 0.12, 2.0]} />
              <meshStandardMaterial color="#3A3530" roughness={0.8} />
            </mesh>
          ))}

          <mesh position={[0, 0.22, -0.6]} castShadow>
            <boxGeometry args={[80, 0.1, 0.08]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.22, 0.6]} castShadow>
            <boxGeometry args={[80, 0.1, 0.08]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Overhead Catenary Electric Traction Poles & High-Voltage Line */}
          {[-30, 0, 30].map((xPole, pIdx) => (
            <group key={pIdx} position={[xPole, 0, 0]}>
              <mesh position={[0, 3.2, -1.2]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 6.4]} />
                <meshStandardMaterial color="#475569" metalness={0.8} />
              </mesh>
              <mesh position={[0, 5.8, -0.6]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 1.4]} />
                <meshStandardMaterial color="#475569" metalness={0.8} />
              </mesh>
            </group>
          ))}
          {/* Overhead Copper Contact Wire */}
          <mesh position={[0, 5.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 80]} />
            <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {PLATFORM_CONFIGS.map((pf) => {
        const signTex = pf.number === 1 ? pf1SignTex : pf.number === 2 ? pf2SignTex : pf4SignTex;
        const halfWidth = pf.width / 2;

        return (
          <group
            key={pf.id}
            position={[0, 0, pf.z]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === pf.id) || null);
            }}
          >
            <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
              <boxGeometry args={[80, 0.8, pf.width]} />
              <meshStandardMaterial color="#C4BFB5" roughness={0.5} />
            </mesh>

            <mesh position={[0, 0.81, -halfWidth + 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[80, 0.25]} />
              <meshStandardMaterial map={tactileTex || undefined} color="#FFD700" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.81, halfWidth - 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[80, 0.25]} />
              <meshStandardMaterial map={tactileTex || undefined} color="#FFD700" roughness={0.4} />
            </mesh>

            <group position={[0, 0, 0]}>
              {[-30, -15, 0, 15, 30].map((xCol, cIdx) => (
                <mesh key={cIdx} position={[xCol, 2.4, 0]} castShadow>
                  <cylinderGeometry args={[0.12, 0.12, 3.2]} />
                  <meshStandardMaterial color="#0F3870" metalness={0.8} />
                </mesh>
              ))}
              <mesh position={[0, 4.0, 0]} castShadow>
                <boxGeometry args={[65, 0.15, pf.width + 0.8]} />
                <meshStandardMaterial color="#1B4F8A" roughness={0.3} />
              </mesh>
            </group>

            {signTex && (
              <mesh position={[0, 3.2, 0]}>
                <planeGeometry args={[3.2, 0.7]} />
                <meshBasicMaterial map={signTex} />
              </mesh>
            )}

            {/* FOB Staircase Ground Landing Overhead Signboard */}
            {fobStairsUpSignTex && (
              <group position={[8.6, 2.8, 0]}>
                <mesh position={[0, 0, 0]} castShadow>
                  <boxGeometry args={[3.2, 0.65, 0.06]} />
                  <meshStandardMaterial color="#0F3870" />
                </mesh>
                <mesh position={[0, 0, 0.04]}>
                  <planeGeometry args={[3.1, 0.6]} />
                  <meshBasicMaterial map={fobStairsUpSignTex} />
                </mesh>
                <mesh position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[3.1, 0.6]} />
                  <meshBasicMaterial map={fobStairsUpSignTex} />
                </mesh>
              </group>
            )}

            <group position={[15, 0.8, 0]}>
              <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[1.6, 1.0, 0.8]} />
                <meshStandardMaterial color="#3A75A4" roughness={0.3} />
              </mesh>
              <mesh position={[0, 1.1, 0]}>
                <boxGeometry args={[1.4, 0.15, 0.6]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
            </group>

            {pf.number === 1 && (
              <group
                position={[-15, 0.8, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "irctc-stall-p1") || null);
                }}
              >
                <mesh position={[0, 1.1, 0]} castShadow>
                  <boxGeometry args={[3.4, 2.2, 1.6]} />
                  <meshStandardMaterial color="#D46A12" roughness={0.5} />
                </mesh>
                {chaiSignTex && (
                  <mesh position={[0, 2.0, 0.81]}>
                    <planeGeometry args={[3.2, 0.5]} />
                    <meshBasicMaterial map={chaiSignTex} />
                  </mesh>
                )}
              </group>
            )}

            {[-22, 0, 22].map((xBench, bIdx) => (
              <group key={bIdx} position={[xBench, 0.8, 0]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                  <boxGeometry args={[2.4, 0.06, 0.5]} />
                  <meshStandardMaterial color="#B0B5B9" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.55, -0.22]} castShadow>
                  <boxGeometry args={[2.4, 0.45, 0.04]} />
                  <meshStandardMaterial color="#B0B5B9" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}
