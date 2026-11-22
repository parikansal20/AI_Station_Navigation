"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  createFloorTileTexture,
  createSignboardTexture,
  createClockFaceTexture,
  createIndianRailwayWallTexture,
} from "@/utils/textures";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";

export default function GroundFloor() {
  const setSelectedFacility = useSimulationStore((s) => s.setSelectedFacility);

  const floorTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createFloorTileTexture();
  }, []);

  const entranceSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("लखनऊ जंक्शन सेंट्रल", "LUCKNOW JUNCTION CENTRAL", "#0F3870", "#FFD700");
  }, []);

  const ticketSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("टिकट काउंटर / पूछताछ", "TICKET COUNTERS & ENQUIRY", "#0F3870", "#FFFFFF");
  }, []);

  const waitingHallSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("सामान्य प्रतीक्षालय", "GENERAL WAITING HALL", "#0F3870", "#FFFFFF");
  }, []);

  const acLoungeSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("प्रथम श्रेणी एसी लाउंज", "1ST CLASS AC LOUNGE", "#7A1C1C", "#FFD700");
  }, []);

  const ladiesRoomSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("महिला प्रतीक्षालय / शिशु आहार", "LADIES WAITING & BABY CARE", "#831843", "#FFFFFF");
  }, []);

  const bookStoreSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("व्हीलर्स पुस्तक दुकान", "WHEELERS BOOK STORE", "#1E3A8A", "#FFFFFF");
  }, []);

  const pharmacySignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("जन औषधि केंद्र / प्राथमिक चिकित्सा", "JAN AUSHADHI PHARMACY & FIRST AID", "#065F46", "#FFFFFF");
  }, []);

  const gentsToiletSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("पुरुष शौचालय", "GENTS WASHROOM", "#0F3870", "#FFFFFF");
  }, []);

  const ladiesToiletSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("महिला शौचालय", "LADIES WASHROOM", "#831843", "#FFFFFF");
  }, []);

  const atmSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("भारतीय स्टेट बैंक ए.टी.एम.", "STATE BANK OF INDIA ATM", "#0284C7", "#FFFFFF");
  }, []);

  const cloakRoomSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("अमानती सामान घर (क्लॉक रूम)", "CLOAK ROOM & LUGGAGE LOCKER", "#0F3870", "#FFFFFF");
  }, []);

  const clockSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClockFaceTexture();
  }, []);

  const dadoWallTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createIndianRailwayWallTexture();
  }, []);

  const policeSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("आर.पी.एफ. एवं पुलिस पोस्ट", "RPF & POLICE POST", "#991B1B", "#FFFFFF");
  }, []);

  const smSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("स्टेशन मास्टर कार्यालय", "STATION MASTER OFFICE", "#0F3870", "#FFFFFF");
  }, []);

  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 11]} receiveShadow>
        <planeGeometry args={[44, 30]} />
        <meshStandardMaterial color="#EAE4D9" map={floorTexture || undefined} roughness={0.3} metalness={0.1} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.4, 11]} receiveShadow>
        <planeGeometry args={[44, 30]} />
        <meshStandardMaterial color="#F5F5F0" roughness={0.8} />
      </mesh>

      <group position={[0, 0, -4]}>
        <mesh position={[-13, 2.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[18, 4.4, 0.4]} />
          <meshStandardMaterial color="#D8D1C5" roughness={0.6} />
        </mesh>
        <mesh position={[13, 2.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[18, 4.4, 0.4]} />
          <meshStandardMaterial color="#D8D1C5" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.8, 0]} receiveShadow castShadow>
          <boxGeometry args={[8, 1.2, 0.4]} />
          <meshStandardMaterial color="#D8D1C5" roughness={0.6} />
        </mesh>
      </group>

      <group position={[0, 0, 26]}>
        <mesh position={[-14, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 4.4, 0.6]} />
          <meshStandardMaterial color="#A83232" roughness={0.5} />
        </mesh>
        <mesh position={[14, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 4.4, 0.6]} />
          <meshStandardMaterial color="#A83232" roughness={0.5} />
        </mesh>
        <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 1.2, 0.6]} />
          <meshStandardMaterial color="#A83232" roughness={0.5} />
        </mesh>
        {entranceSignTex && (
          <mesh position={[0, 3.8, 0.35]}>
            <planeGeometry args={[10, 1.0]} />
            <meshBasicMaterial map={entranceSignTex} />
          </mesh>
        )}
      </group>

      <mesh position={[-22, 2.2, 11]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 4.4, 30]} />
        <meshStandardMaterial color="#D8D1C5" roughness={0.6} />
      </mesh>

      <mesh position={[22, 2.2, 11]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 4.4, 30]} />
        <meshStandardMaterial color="#D8D1C5" roughness={0.6} />
      </mesh>

      <mesh position={[0, 2.2, 18]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 4.4, 8]} />
        <meshStandardMaterial color="#E0D7C9" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 4.4, 6]} />
        <meshStandardMaterial color="#E0D7C9" roughness={0.7} />
      </mesh>

      <group
        position={[-12, 0, 16]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "ticket-counters") || null);
        }}
      >
        <mesh position={[-4, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 4.4, 6]} />
          <meshStandardMaterial color="#ECE6DA" />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.5, 1.0, 0.6]} />
          <meshStandardMaterial color="#2B3A4A" roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.0, 0]}>
          <boxGeometry args={[7.5, 1.0, 0.1]} />
          <meshPhysicalMaterial color="#AEE" transmission={0.85} opacity={1} transparent roughness={0.1} />
        </mesh>
        {ticketSignTex && (
          <mesh position={[0, 3.2, 0.31]}>
            <planeGeometry args={[6, 0.8]} />
            <meshBasicMaterial map={ticketSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[-18, 0, 20]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "atm-booth") || null);
        }}
      >
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[1.2, 2.0, 1.0]} />
          <meshStandardMaterial color="#0284C7" roughness={0.3} />
        </mesh>
        {atmSignTex && (
          <mesh position={[0, 2.3, 0.51]}>
            <planeGeometry args={[1.8, 0.4]} />
            <meshBasicMaterial map={atmSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[-18, 0, 14]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "cloak-room") || null);
        }}
      >
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[3.2, 2.4, 2.0]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>
        {cloakRoomSignTex && (
          <mesh position={[0, 2.6, 1.01]}>
            <planeGeometry args={[3.0, 0.5]} />
            <meshBasicMaterial map={cloakRoomSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[-18, 0, 8]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "book-store") || null);
        }}
      >
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[3.5, 2.4, 2.2]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.4} />
        </mesh>
        {bookStoreSignTex && (
          <mesh position={[0, 2.6, 1.11]}>
            <planeGeometry args={[3.2, 0.5]} />
            <meshBasicMaterial map={bookStoreSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[-12, 0, 4]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "waiting-hall") || null);
        }}
      >
        {waitingHallSignTex && (
          <mesh position={[0, 3.5, 2]}>
            <planeGeometry args={[5, 0.7]} />
            <meshBasicMaterial map={waitingHallSignTex} />
          </mesh>
        )}
        {[-1.5, 1.5].map((zOffset, rIdx) => (
          <group key={rIdx} position={[0, 0, zOffset]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[6, 0.08, 0.6]} />
              <meshStandardMaterial color="#707B7C" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.75, -0.28]} castShadow>
              <boxGeometry args={[6, 0.5, 0.05]} />
              <meshStandardMaterial color="#707B7C" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      <group
        position={[14, 0, 16]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "ac-lounge") || null);
        }}
      >
        <mesh position={[-6, 2.2, 0]}>
          <boxGeometry args={[0.1, 4.4, 6]} />
          <meshPhysicalMaterial color="#DDD" transmission={0.8} transparent roughness={0.1} />
        </mesh>
        {acLoungeSignTex && (
          <mesh position={[-5.9, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[4.5, 0.7]} />
            <meshBasicMaterial map={acLoungeSignTex} />
          </mesh>
        )}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[3.2, 0.45, 0.8]} />
          <meshStandardMaterial color="#6B2D2D" roughness={0.7} />
        </mesh>
      </group>

      <group
        position={[14, 0, 8]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "ladies-waiting-room") || null);
        }}
      >
        <mesh position={[-6, 2.2, 0]}>
          <boxGeometry args={[0.1, 4.4, 6]} />
          <meshStandardMaterial color="#FCE7F3" roughness={0.6} />
        </mesh>
        {ladiesRoomSignTex && (
          <mesh position={[-5.9, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[4.5, 0.6]} />
            <meshBasicMaterial map={ladiesRoomSignTex} />
          </mesh>
        )}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[3.0, 0.45, 0.8]} />
          <meshStandardMaterial color="#9D174D" roughness={0.6} />
        </mesh>
      </group>

      <group
        position={[-18, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "pharmacy-medical") || null);
        }}
      >
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[3.2, 2.4, 2.2]} />
          <meshStandardMaterial color="#065F46" roughness={0.4} />
        </mesh>
        {pharmacySignTex && (
          <mesh position={[0, 2.6, 1.11]}>
            <planeGeometry args={[3.0, 0.5]} />
            <meshBasicMaterial map={pharmacySignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[-18, 0, -2]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "gents-washroom-gf") || null);
        }}
      >
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[3.0, 2.4, 2.0]} />
          <meshStandardMaterial color="#0F3870" roughness={0.5} />
        </mesh>
        {gentsToiletSignTex && (
          <mesh position={[0, 2.6, 1.01]}>
            <planeGeometry args={[2.6, 0.5]} />
            <meshBasicMaterial map={gentsToiletSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[-12, 0, -2]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "ladies-washroom-gf") || null);
        }}
      >
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[3.0, 2.4, 2.0]} />
          <meshStandardMaterial color="#831843" roughness={0.5} />
        </mesh>
        {ladiesToiletSignTex && (
          <mesh position={[0, 2.6, 1.01]}>
            <planeGeometry args={[2.6, 0.5]} />
            <meshBasicMaterial map={ladiesToiletSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[14, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "police-station") || null);
        }}
      >
        <mesh position={[-6, 2.2, 0]}>
          <boxGeometry args={[0.1, 4.4, 4]} />
          <meshStandardMaterial color="#991B1B" roughness={0.5} />
        </mesh>
        {policeSignTex && (
          <mesh position={[-5.9, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[3.5, 0.6]} />
            <meshBasicMaterial map={policeSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[14, 0, 4]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "station-master") || null);
        }}
      >
        <mesh position={[-6, 2.2, 0]}>
          <boxGeometry args={[0.1, 4.4, 4]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>
        {smSignTex && (
          <mesh position={[-5.9, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[3.5, 0.6]} />
            <meshBasicMaterial map={smSignTex} />
          </mesh>
        )}
      </group>

      <group
        position={[0, 0, 12]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "water-station-gf") || null);
        }}
      >
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[2.0, 1.2, 0.8]} />
          <meshStandardMaterial color="#0284C7" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[1.8, 0.15, 0.6]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>

      <group position={[0, 0, 4]}>
        {Array.from({ length: 18 }).map((_, stepIdx) => {
          const stepY = stepIdx * 0.35 + 0.175;
          const stepZ = -stepIdx * 0.45;
          return (
            <group key={stepIdx}>
              <mesh position={[0, stepY, stepZ]} castShadow receiveShadow>
                <boxGeometry args={[3.6, 0.35, 0.45]} />
                <meshStandardMaterial color="#A09B90" roughness={0.4} />
              </mesh>
              <mesh position={[0, stepY + 0.25, stepZ]} castShadow>
                <boxGeometry args={[0.15, 0.2, 0.45]} />
                <meshStandardMaterial color="#475569" roughness={0.5} />
              </mesh>
            </group>
          );
        })}

        {[-1.75, 1.75].map((xPos, sideIdx) => (
          <group key={sideIdx}>
            <mesh position={[xPos, 3.8, -3.8]} rotation={[0.66, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 9.8]} />
              <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[xPos, 3.3, -3.8]} rotation={[0.66, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 9.8]} />
              <meshStandardMaterial color="#64748B" metalness={0.7} roughness={0.3} />
            </mesh>

            {[0, 3, 6, 9, 12, 15, 17].map((stepIdx) => {
              const postY = stepIdx * 0.35 + 0.65;
              const postZ = -stepIdx * 0.45;
              return (
                <mesh key={stepIdx} position={[xPos, postY, postZ]} castShadow>
                  <cylinderGeometry args={[0.025, 0.025, 0.95]} />
                  <meshStandardMaterial color="#334455" metalness={0.8} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* ── 9. AUTHENTIC INDIAN RAILWAY STATION CLOCK ─────────────────────── */}
      <group position={[0, 4.8, 0]}>
        {/* Hanging Steel Suspension Rod */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 12]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Double-Sided Station Clock Frame */}
        <mesh castShadow rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.25, 32]} />
          <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* North Face Dial */}
        {clockSignTex && (
          <mesh position={[0, 0, 0.13]} rotation={[0, 0, 0]}>
            <circleGeometry args={[0.7, 32]} />
            <meshBasicMaterial map={clockSignTex} />
          </mesh>
        )}

        {/* South Face Dial */}
        {clockSignTex && (
          <mesh position={[0, 0, -0.13]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.7, 32]} />
            <meshBasicMaterial map={clockSignTex} />
          </mesh>
        )}
      </group>

      {/* ── 10. ENTRANCE SECURITY CHECKPOINT (BAGGAGE SCANNERS & METAL DETECTORS) ── */}
      <group position={[0, 0, 23.5]}>
        {[-4, 4].map((xOffset, idx) => (
          <group key={idx} position={[xOffset, 0, 0]}>
            {/* Baggage X-Ray Conveyor Tunnel */}
            <mesh position={[0, 0.75, 0]} castShadow>
              <boxGeometry args={[1.4, 1.1, 2.4]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Scanner Hood */}
            <mesh position={[0, 1.4, 0]}>
              <boxGeometry args={[1.2, 0.25, 1.0]} />
              <meshStandardMaterial color="#0EA5E9" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Entry Conveyor Roller Table */}
            <mesh position={[0, 0.5, 1.6]}>
              <boxGeometry args={[1.2, 0.1, 0.9]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Doorway Walk-Through Metal Detector Arch */}
            <group position={[xOffset > 0 ? 1.5 : -1.5, 0, 0.5]}>
              <mesh position={[-0.45, 1.1, 0]}>
                <boxGeometry args={[0.1, 2.2, 0.3]} />
                <meshStandardMaterial color="#1E293B" />
              </mesh>
              <mesh position={[0.45, 1.1, 0]}>
                <boxGeometry args={[0.1, 2.2, 0.3]} />
                <meshStandardMaterial color="#1E293B" />
              </mesh>
              <mesh position={[0, 2.15, 0]}>
                <boxGeometry args={[1.0, 0.15, 0.3]} />
                <meshStandardMaterial color="#1E293B" />
              </mesh>
              {/* Green Pass Indicator LED */}
              <mesh position={[0, 2.15, 0.16]}>
                <boxGeometry args={[0.2, 0.08, 0.02]} />
                <meshBasicMaterial color="#22C55E" />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* ── 11. CCTV CAMERA DOMES & PA SPEAKERS ────────────────────────────── */}
      <group position={[0, 4.2, 10]}>
        {[-6, 6].map((xPos, idx) => (
          <group key={idx} position={[xPos, 0, 0]}>
            {/* CCTV Camera Dome */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* PA Horn Speaker */}
            <mesh position={[0, -0.3, 0.2]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.18, 0.4, 16]} />
              <meshStandardMaterial color="#64748B" metalness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
