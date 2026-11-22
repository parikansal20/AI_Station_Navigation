"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { createSignboardTexture, createStairBannerTexture } from "@/utils/textures";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";

export default function FirstFloorFOB() {
  const setSelectedFacility = useSimulationStore((s) => s.setSelectedFacility);

  const fobSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("फुट ओवरब्रिज - प्लेटफॉर्म 1 से 5", "FOOT OVERBRIDGE - PLATFORMS 1 TO 5", "#0F3870", "#FFD700");
  }, []);

  const dormSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("प्रथम तल शयनकक्ष (डॉर्मिटरी)", "EXECUTIVE DORMITORIES (1ST FLOOR)", "#0F3870", "#FFFFFF");
  }, []);

  const foodCourtSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSignboardTexture("IRCTC फूड कोर्ट", "IRCTC MULTI-CUISINE FOOD COURT", "#B84A00", "#FFFFFF");
  }, []);

  const pf1StairsSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createStairBannerTexture("सीढ़ियां: प्लेटफॉर्म 1 (लखनऊ मेल)", "STAIRS TO PLATFORM 1", "down", "#0F3870", "#FFD700");
  }, []);

  const pf2StairsSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createStairBannerTexture("सीढ़ियां: प्लेटफॉर्म 2 एवं 3 (वंदे भारत)", "STAIRS TO PLATFORM 2 & 3", "down", "#0F3870", "#FFD700");
  }, []);

  const pf4StairsSignTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createStairBannerTexture("सीढ़ियां: प्लेटफॉर्म 4 एवं 5 (पैसेंजर)", "STAIRS TO PLATFORM 4 & 5", "down", "#0F3870", "#FFD700");
  }, []);

  const stairConfigs = [
    { z: -8, label: "Platform 1", texture: pf1StairsSignTex, pfNum: "1" },
    { z: -20, label: "Platform 2 & 3", texture: pf2StairsSignTex, pfNum: "2 & 3" },
    { z: -34, label: "Platform 4 & 5", texture: pf4StairsSignTex, pfNum: "4 & 5" },
  ];

  return (
    <group position={[0, 6.2, 0]}>
      {/* 1st Floor Station Concourse Slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]} receiveShadow>
        <planeGeometry args={[44, 40]} />
        <meshStandardMaterial color="#DDD5C7" roughness={0.4} />
      </mesh>

      {/* Central Foot Overbridge (FOB Deck & Structure) */}
      <group
        position={[0, 0, -22]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "fob-central") || null);
        }}
      >
        {/* SOLID CONTINUOUS FOB WALKWAY FLOOR DECK */}
        <mesh position={[0, -0.05, -1]} receiveShadow castShadow>
          <boxGeometry args={[6.2, 0.15, 38]} />
          <meshStandardMaterial color="#A09B90" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Floor edge yellow safety tactile trims */}
        <mesh position={[-3.05, 0.03, -1]}>
          <boxGeometry args={[0.1, 0.02, 38]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
        <mesh position={[3.05, 0.03, -1]}>
          <boxGeometry args={[0.1, 0.02, 38]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>

        {/* FOB Blue Roof Canopy */}
        <mesh position={[0, 3.4, -1]} castShadow>
          <boxGeometry args={[6.6, 0.15, 38]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Structural Pillars & Glass Railing Panels along the FOB Walkway */}
        {Array.from({ length: 10 }).map((_, idx) => {
          const zPos = -18 + idx * 4.0;
          // Check if this pillar position coincides with a stair opening (Z = -8, -20, -34 -> relative Z = +14, +2, -12)
          const isStairOpening = Math.abs(zPos - 14) < 1.8 || Math.abs(zPos - 2) < 1.8 || Math.abs(zPos - (-12)) < 1.8;

          return (
            <group key={idx} position={[0, 1.6, zPos]}>
              {/* Left Pillar */}
              <mesh position={[-3.05, 0, 0]} castShadow>
                <boxGeometry args={[0.12, 3.4, 0.12]} />
                <meshStandardMaterial color="#1E293B" metalness={0.8} />
              </mesh>
              {/* Right Pillar */}
              <mesh position={[3.05, 0, 0]} castShadow>
                <boxGeometry args={[0.12, 3.4, 0.12]} />
                <meshStandardMaterial color="#1E293B" metalness={0.8} />
              </mesh>

              {/* Glass Railing Left */}
              <mesh position={[-3.1, -0.4, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[3.9, 2.0]} />
                <meshPhysicalMaterial
                  color="#E0F2FE"
                  transmission={0.92}
                  opacity={0.35}
                  transparent={true}
                  roughness={0.05}
                  ior={1.4}
                  thickness={0.05}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>

              {/* Glass Railing Right (Only rendered where there is NO stair opening) */}
              {!isStairOpening && (
                <mesh position={[3.1, -0.4, 0]} rotation={[0, -Math.PI / 2, 0]}>
                  <planeGeometry args={[3.9, 2.0]} />
                  <meshPhysicalMaterial
                    color="#E0F2FE"
                    transmission={0.92}
                    opacity={0.35}
                    transparent={true}
                    roughness={0.05}
                    ior={1.4}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                  />
                </mesh>
              )}

              {/* Stainless Steel Handrails Left */}
              <mesh position={[-2.95, -0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 3.9]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
              </mesh>

              {/* Stainless Steel Handrails Right (Only where NO stair opening) */}
              {!isStairOpening && (
                <mesh position={[2.95, -0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 3.9]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
                </mesh>
              )}
            </group>
          );
        })}

        {/* Entrance Overhead Signboard from Concourse to FOB */}
        {fobSignTex && (
          <group position={[0, 2.4, 17]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[5.4, 0.8, 0.08]} />
              <meshStandardMaterial color="#0F3870" />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[5.2, 0.7]} />
              <meshBasicMaterial map={fobSignTex} />
            </mesh>
            <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[5.2, 0.7]} />
              <meshBasicMaterial map={fobSignTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* 1st Floor Executive Dormitories */}
      <group
        position={[14, 0, 14]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "dormitories") || null);
        }}
      >
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 3.2, 10]} />
          <meshStandardMaterial color="#E5DFD3" roughness={0.6} />
        </mesh>
        {dormSignTex && (
          <mesh position={[-7.01, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[4.5, 0.6]} />
            <meshBasicMaterial map={dormSignTex} side={THREE.DoubleSide} />
          </mesh>
        )}
        {[-3, 3].map((xBed, bIdx) => (
          <group key={bIdx} position={[xBed, 0, 0]}>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[2.0, 0.3, 1.0]} />
              <meshStandardMaterial color="#2B5B84" />
            </mesh>
            <mesh position={[0, 1.8, 0]} castShadow>
              <boxGeometry args={[2.0, 0.3, 1.0]} />
              <meshStandardMaterial color="#2B5B84" />
            </mesh>
            {[-0.95, 0.95].map((xPost, pIdx) =>
              [-0.45, 0.45].map((zPost, zIdx) => (
                <mesh key={`${pIdx}-${zIdx}`} position={[xPost, 1.0, zPost]}>
                  <cylinderGeometry args={[0.03, 0.03, 2.0]} />
                  <meshStandardMaterial color="#444" metalness={0.9} />
                </mesh>
              ))
            )}
          </group>
        ))}
      </group>

      {/* 1st Floor IRCTC Food Court */}
      <group
        position={[-14, 0, 10]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "food-court-1f") || null);
        }}
      >
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 3.2, 10]} />
          <meshStandardMaterial color="#FFFBEB" roughness={0.4} />
        </mesh>
        {foodCourtSignTex && (
          <mesh position={[7.01, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[4.5, 0.6]} />
            <meshBasicMaterial map={foodCourtSignTex} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {/* Safety Balustrade Railing at 1F Lobby Edge */}
      <mesh position={[0, 0.5, 27.5]} castShadow>
        <boxGeometry args={[43, 1.0, 0.1]} />
        <meshPhysicalMaterial color="#D97706" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ======================================================== */}
      {/* STAIRCASES & OVERHEAD BANNER SIGNBOARDS TO PLATFORMS 1-5 */}
      {/* ======================================================== */}
      {stairConfigs.map((cfg, idx) => (
        <group key={idx} position={[0, 0, cfg.z]}>
          {/* OVERHEAD DOUBLE-SIDED BANNER GANTRY ACROSS FOB CORRIDOR */}
          {cfg.texture && (
            <group position={[0, 2.5, 0]}>
              {/* Top Hanger Posts attached to FOB Ceiling */}
              <mesh position={[-2.2, 0.5, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.9]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
              <mesh position={[2.2, 0.5, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.9]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>

              {/* Banner Backing Box Frame */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[4.8, 0.85, 0.08]} />
                <meshStandardMaterial color="#0F3870" roughness={0.3} />
              </mesh>

              {/* Outer Yellow Trim Frame */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[4.88, 0.93, 0.04]} />
                <meshStandardMaterial color="#F59E0B" roughness={0.3} />
              </mesh>

              {/* Front Signboard Banner */}
              <mesh position={[0, 0, 0.05]}>
                <planeGeometry args={[4.7, 0.8]} />
                <meshBasicMaterial map={cfg.texture} />
              </mesh>
              {/* Back Signboard Banner */}
              <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[4.7, 0.8]} />
                <meshBasicMaterial map={cfg.texture} />
              </mesh>
            </group>
          )}

          {/* OVER-STAIR ENTRANCE DIRECTIONAL BANNER (Right side entry) */}
          {cfg.texture && (
            <group position={[3.0, 2.4, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[2.8, 0.65, 0.06]} />
                <meshStandardMaterial color="#0F3870" />
              </mesh>
              <mesh position={[0, 0, 0.04]}>
                <planeGeometry args={[2.7, 0.6]} />
                <meshBasicMaterial map={cfg.texture} />
              </mesh>
              <mesh position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[2.7, 0.6]} />
                <meshBasicMaterial map={cfg.texture} />
              </mesh>
            </group>
          )}

          {/* STAIRCASE STEPS DESCENDING TO PLATFORM (Gentle 33-degree slope for clear visibility) */}
          <group position={[0, 0, 0]}>
            {/* Step Treads */}
            {Array.from({ length: 18 }).map((_, stepIdx) => {
              const stepY = -stepIdx * 0.3 - 0.15;
              const stepX = stepIdx * 0.32 + 3.0;
              return (
                <group key={stepIdx} position={[stepX, stepY, 0]}>
                  {/* Main Step Tread Block */}
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.55, 0.28, 2.6]} />
                    <meshStandardMaterial color="#94A3B8" roughness={0.4} metalness={0.2} />
                  </mesh>

                  {/* Bright Yellow Nosing Edge Safety Line */}
                  <mesh position={[-0.25, 0.15, 0]}>
                    <boxGeometry args={[0.06, 0.02, 2.6]} />
                    <meshStandardMaterial color="#F59E0B" roughness={0.3} />
                  </mesh>
                </group>
              );
            })}

            {/* Staircase Side Protective Walls / Parapets */}
            {/* Front Parapet Wall (Z = -1.35) */}
            <mesh position={[5.8, -2.7, -1.35]} rotation={[0, 0, -Math.atan2(5.4, 5.76)]} castShadow>
              <boxGeometry args={[8.0, 0.8, 0.12]} />
              <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Back Parapet Wall (Z = 1.35) */}
            <mesh position={[5.8, -2.7, 1.35]} rotation={[0, 0, -Math.atan2(5.4, 5.76)]} castShadow>
              <boxGeometry args={[8.0, 0.8, 0.12]} />
              <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Stainless Steel Side Handrails */}
            <mesh position={[5.8, -2.2, -1.3]} rotation={[0, 0, -Math.atan2(5.4, 5.76)]}>
              <cylinderGeometry args={[0.035, 0.035, 8.0]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[5.8, -2.2, 1.3]} rotation={[0, 0, -Math.atan2(5.4, 5.76)]}>
              <cylinderGeometry args={[0.035, 0.035, 8.0]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
