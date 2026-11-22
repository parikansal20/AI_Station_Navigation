"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { useSimulationStore } from "@/store/simulationStore";
import { stationAudioService } from "@/utils/stationAudioService";
import { PASSENGER_SPECS } from "@/components/station/PassengerCrowd";

interface ObstacleAABB {
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

const STATION_OBSTACLES: ObstacleAABB[] = [
  { name: "Entrance Facade Wall", minX: -22, maxX: -6, minZ: 25.5, maxZ: 26.5, minY: 0, maxY: 5 },
  { name: "Entrance Facade Wall", minX: 6, maxX: 22, minZ: 25.5, maxZ: 26.5, minY: 0, maxY: 5 },

  { name: "Platform Exit Wall", minX: -22, maxX: -4, minZ: -4.5, maxZ: -3.5, minY: 0, maxY: 5 },
  { name: "Platform Exit Wall", minX: 4, maxX: 22, minZ: -4.5, maxZ: -3.5, minY: 0, maxY: 5 },

  { name: "West Exterior Wall", minX: -22.5, maxX: -21.5, minZ: -4, maxZ: 26, minY: 0, maxY: 5 },
  { name: "East Exterior Wall", minX: 21.5, maxX: 22.5, minZ: -4, maxZ: 26, minY: 0, maxY: 5 },

  { name: "Concourse Central Partition Wall", minX: -0.3, maxX: 0.3, minZ: 14, maxZ: 22, minY: 0, maxY: 5 },
  { name: "Concourse Central Partition Wall", minX: -0.3, maxX: 0.3, minZ: -3, maxZ: 3, minY: 0, maxY: 5 },

  { name: "Ticket Counter Desk", minX: -16.5, maxX: -7.5, minZ: 15.0, maxZ: 17.0, minY: 0, maxY: 5 },
  { name: "Ticket Office Wall", minX: -16.5, maxX: -15.5, minZ: 13.0, maxZ: 19.0, minY: 0, maxY: 5 },

  { name: "SBI ATM Kiosk", minX: -19.0, maxX: -17.0, minZ: 19.2, maxZ: 20.8, minY: 0, maxY: 3 },
  { name: "Cloak Room Counter", minX: -20.0, maxX: -16.0, minZ: 12.8, maxZ: 15.2, minY: 0, maxY: 4 },
  { name: "Wheelers Book Store", minX: -20.2, maxX: -15.8, minZ: 6.8, maxZ: 9.2, minY: 0, maxY: 4 },
  { name: "Waiting Hall Benches Row 1", minX: -15.2, maxX: -8.8, minZ: 2.1, maxZ: 2.9, minY: 0, maxY: 2 },
  { name: "Waiting Hall Benches Row 2", minX: -15.2, maxX: -8.8, minZ: 5.1, maxZ: 5.9, minY: 0, maxY: 2 },
  { name: "Pharmacy & First Aid Booth", minX: -20.0, maxX: -16.0, minZ: -1.2, maxZ: 1.2, minY: 0, maxY: 4 },
  { name: "Washrooms Complex", minX: -20.0, maxX: -10.0, minZ: -3.5, maxZ: -1.0, minY: 0, maxY: 4 },
  { name: "1st Class AC Lounge Wall", minX: 7.8, maxX: 20.0, minZ: 12.8, maxZ: 19.2, minY: 0, maxY: 5 },
  { name: "Ladies Lounge Wall", minX: 7.8, maxX: 20.0, minZ: 4.8, maxZ: 11.2, minY: 0, maxY: 5 },
  { name: "RPF Police Station Wall", minX: 7.8, maxX: 20.0, minZ: -2.2, maxZ: 2.2, minY: 0, maxY: 5 },
  { name: "Station Master Office", minX: 7.8, maxX: 20.0, minZ: 2.2, maxZ: 6.2, minY: 0, maxY: 5 },

  { name: "Main Staircase Side Railing", minX: -2.1, maxX: -1.6, minZ: -4.5, maxZ: 4.5, minY: 0, maxY: 6.5 },
  { name: "Main Staircase Side Railing", minX: 1.6, maxX: 2.1, minZ: -4.5, maxZ: 4.5, minY: 0, maxY: 6.5 },

  { name: "Foot Overbridge West Wall", minX: -22.0, maxX: -2.8, minZ: -42.0, maxZ: -4.0, minY: 5.5, maxY: 10 },

  { name: "Foot Overbridge East Wall Section 1", minX: 2.8, maxX: 22.0, minZ: -42.0, maxZ: -36.5, minY: 5.5, maxY: 10 },
  { name: "Foot Overbridge East Wall Section 2", minX: 2.8, maxX: 22.0, minZ: -31.5, maxZ: -22.5, minY: 5.5, maxY: 10 },
  { name: "Foot Overbridge East Wall Section 3", minX: 2.8, maxX: 22.0, minZ: -17.5, maxZ: -10.5, minY: 5.5, maxY: 10 },
  { name: "Foot Overbridge East Wall Section 4", minX: 2.8, maxX: 22.0, minZ: -5.5, maxZ: -4.0, minY: 5.5, maxY: 10 },

  { name: "Staircase 1 North Rail", minX: 2.8, maxX: 8.8, minZ: -9.8, maxZ: -9.2, minY: 0, maxY: 10 },
  { name: "Staircase 1 South Rail", minX: 2.8, maxX: 8.8, minZ: -6.8, maxZ: -6.2, minY: 0, maxY: 10 },

  { name: "Staircase 2 North Rail", minX: 2.8, maxX: 8.8, minZ: -21.8, maxZ: -21.2, minY: 0, maxY: 10 },
  { name: "Staircase 2 South Rail", minX: 2.8, maxX: 8.8, minZ: -18.8, maxZ: -18.2, minY: 0, maxY: 10 },

  { name: "Staircase 3 North Rail", minX: 2.8, maxX: 8.8, minZ: -35.8, maxZ: -35.2, minY: 0, maxY: 10 },
  { name: "Staircase 3 South Rail", minX: 2.8, maxX: 8.8, minZ: -32.8, maxZ: -32.2, minY: 0, maxY: 10 },

  { name: "Lucknow Mail Express Train", minX: -40.0, maxX: 40.0, minZ: -13.5, maxZ: -10.5, minY: 0, maxY: 4 },
  { name: "Vande Bharat Express Train", minX: -40.0, maxX: 40.0, minZ: -26.5, maxZ: -23.5, minY: 0, maxY: 4 },
];

const HUMAN_OBSTACLES: ObstacleAABB[] = PASSENGER_SPECS.map((p, idx) => ({
  name: p.isCoolie ? `Coolie Porter ${idx + 1}` : p.isSitting ? `Seated Passenger ${idx + 1}` : `Passenger ${idx + 1}`,
  minX: p.pos[0] - 0.55,
  maxX: p.pos[0] + 0.55,
  minZ: p.pos[2] - 0.55,
  maxZ: p.pos[2] + 0.55,
  minY: p.pos[1] - 0.1,
  maxY: p.pos[1] + (p.isSitting ? 1.1 : 1.8),
}));

const ADDITIONAL_STATION_OBSTACLES: ObstacleAABB[] = [
  // Platform 1 Sarthi Chai Stall
  { name: "Sarthi Chai & Refreshment Stall", minX: -16.8, maxX: -13.2, minZ: -8.9, maxZ: -7.1, minY: 0.8, maxY: 4.0 },

  // Platform 1 Benches
  { name: "Platform 1 West Bench", minX: -23.3, maxX: -20.7, minZ: -8.4, maxZ: -7.6, minY: 0.8, maxY: 2.2 },
  { name: "Platform 1 Center Bench", minX: -1.3, maxX: 1.3, minZ: -8.4, maxZ: -7.6, minY: 0.8, maxY: 2.2 },
  { name: "Platform 1 East Bench", minX: 20.7, maxX: 23.3, minZ: -8.4, maxZ: -7.6, minY: 0.8, maxY: 2.2 },

  // Platform 2 & 3 Benches
  { name: "Platform 2 West Bench", minX: -23.3, maxX: -20.7, minZ: -20.4, maxZ: -19.6, minY: 0.8, maxY: 2.2 },
  { name: "Platform 2 Center Bench", minX: -1.3, maxX: 1.3, minZ: -20.4, maxZ: -19.6, minY: 0.8, maxY: 2.2 },
  { name: "Platform 2 East Bench", minX: 20.7, maxX: 23.3, minZ: -20.4, maxZ: -19.6, minY: 0.8, maxY: 2.2 },

  // Platform 4 & 5 Benches
  { name: "Platform 4 West Bench", minX: -23.3, maxX: -20.7, minZ: -34.4, maxZ: -33.6, minY: 0.8, maxY: 2.2 },
  { name: "Platform 4 Center Bench", minX: -1.3, maxX: 1.3, minZ: -34.4, maxZ: -33.6, minY: 0.8, maxY: 2.2 },
  { name: "Platform 4 East Bench", minX: 20.7, maxX: 23.3, minZ: -34.4, maxZ: -33.6, minY: 0.8, maxY: 2.2 },

  // 1F Executive Dormitories & Food Court
  { name: "1F Executive Dormitories", minX: 7.0, maxX: 21.0, minZ: 9.0, maxZ: 19.0, minY: 5.5, maxY: 10.0 },
  { name: "1F IRCTC Food Court", minX: -21.0, maxX: -7.0, minZ: 5.0, maxZ: 15.0, minY: 5.5, maxY: 10.0 },
];

const ALL_STATION_OBSTACLES: ObstacleAABB[] = [
  ...STATION_OBSTACLES,
  ...ADDITIONAL_STATION_OBSTACLES,
  ...HUMAN_OBSTACLES,
];

function checkAndResolveCollisions(pos: THREE.Vector3, playerRadius: number = 0.65) {
  let closestDistance = Infinity;
  let nearestObstacleName = "";

  for (let pass = 0; pass < 2; pass++) {
    for (const obstacle of ALL_STATION_OBSTACLES) {
      if (obstacle.minY !== undefined && pos.y < obstacle.minY - 0.2) continue;
      if (obstacle.maxY !== undefined && pos.y > obstacle.maxY + 0.2) continue;

      const closestX = THREE.MathUtils.clamp(pos.x, obstacle.minX, obstacle.maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, obstacle.minZ, obstacle.maxZ);

      const distX = pos.x - closestX;
      const distZ = pos.z - closestZ;
      const distanceSq = distX * distX + distZ * distZ;
      const distance = Math.sqrt(distanceSq);

      if (pass === 0 && distance < closestDistance) {
        closestDistance = distance;
        nearestObstacleName = obstacle.name;
      }

      if (distanceSq < playerRadius * playerRadius) {
        if (distance > 0.0001) {
          const overlap = playerRadius - distance;
          pos.x += (distX / distance) * overlap;
          pos.z += (distZ / distance) * overlap;
        } else {
          const pushX = Math.abs(pos.x - obstacle.minX) < Math.abs(obstacle.maxX - pos.x) ? obstacle.minX - playerRadius - pos.x : obstacle.maxX + playerRadius - pos.x;
          const pushZ = Math.abs(pos.z - obstacle.minZ) < Math.abs(obstacle.maxZ - pos.z) ? obstacle.minZ - playerRadius - pos.z : obstacle.maxX + playerRadius - pos.z;
          if (Math.abs(pushX) < Math.abs(pushZ)) {
            pos.x += pushX;
          } else {
            pos.z += pushZ;
          }
        }
      }
    }
  }

  return { closestDistance, nearestObstacleName };
}

export default function FirstPersonController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  const controlMode = useSimulationStore((s) => s.controlMode);
  const teleportTarget = useSimulationStore((s) => s.teleportTarget);
  const clearTeleportTarget = useSimulationStore((s) => s.clearTeleportTarget);
  const setPlayerState = useSimulationStore((s) => s.setPlayerState);
  const setIsPointerLocked = useSimulationStore((s) => s.setIsPointerLocked);
  const setObstacleProximity = useSimulationStore((s) => s.setObstacleProximity);
  const touchMoveVector = useSimulationStore((s) => s.touchMoveVector);
  const touchLookVector = useSimulationStore((s) => s.touchLookVector);

  const headBobEnabled = useSimulationStore((s) => s.headBobEnabled);
  const isAudioMuted = useSimulationStore((s) => s.isAudioMuted);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const walkTimerRef = useRef(0);
  const footstepTimerRef = useRef(0);
  const currentVelocityRef = useRef(new THREE.Vector3());

  useEffect(() => {
    stationAudioService.setMuted(isAudioMuted);
  }, [isAudioMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const [hasPointerLock, setHasPointerLock] = useState(false);

  useEffect(() => {
    setHasPointerLock(
      typeof window !== "undefined" &&
      !!(document.body.requestPointerLock || 
         (document.body as any).mozRequestPointerLock || 
         (document.body as any).webkitRequestPointerLock)
    );
  }, []);

  useEffect(() => {
    if (teleportTarget) {
      camera.position.set(teleportTarget[0], teleportTarget[1], teleportTarget[2]);
      clearTeleportTarget();
    }
  }, [teleportTarget, camera, clearTeleportTarget]);

  // Set camera rotation order to YXZ to prevent roll/tilt issues when looking around manually
  useEffect(() => {
    camera.rotation.order = "YXZ";
  }, [camera]);

  // Unified Mouse Drag & Mobile Touch Look Handler (Active when mouse pointer is not locked)
  useEffect(() => {
    if (controlMode !== "fps") return;

    const dom = gl.domElement;
    let isDragging = false;
    let previousTouchX = 0;
    let previousTouchY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      // Ignore if pointer lock is currently active on the canvas
      if (document.pointerLockElement === dom) return;
      isDragging = true;
      previousTouchX = e.clientX;
      previousTouchY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      if (document.pointerLockElement === dom) return;

      const movementX = e.clientX - previousTouchX;
      const movementY = e.clientY - previousTouchY;

      // Adjust sensitivity for dragging look around (0.003 is smooth and standard)
      camera.rotation.y -= movementX * 0.003;
      camera.rotation.x -= movementY * 0.003;
      camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));

      previousTouchX = e.clientX;
      previousTouchY = e.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    dom.addEventListener("pointerdown", handlePointerDown);
    dom.ownerDocument.addEventListener("pointermove", handlePointerMove);
    dom.ownerDocument.addEventListener("pointerup", handlePointerUp);

    return () => {
      dom.removeEventListener("pointerdown", handlePointerDown);
      dom.ownerDocument.removeEventListener("pointermove", handlePointerMove);
      dom.ownerDocument.removeEventListener("pointerup", handlePointerUp);
    };
  }, [gl, camera, controlMode]);

  useFrame((_, delta) => {
    if (controlMode !== "fps") return;

    const isRunning = keysRef.current["ShiftLeft"] || keysRef.current["ShiftRight"];
    const baseSpeed = isRunning ? 7.2 : 3.8;
    
    const forward = (keysRef.current["KeyW"] || keysRef.current["ArrowUp"] ? 1 : 0) -
                    (keysRef.current["KeyS"] || keysRef.current["ArrowDown"] ? 1 : 0);
    const side = (keysRef.current["KeyD"] || keysRef.current["ArrowRight"] ? 1 : 0) -
                 (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"] ? 1 : 0);

    const combinedForward = forward || -touchMoveVector.y;
    const combinedSide = side || touchMoveVector.x;

    const frontVector = new THREE.Vector3(0, 0, -combinedForward);
    const sideVector = new THREE.Vector3(combinedSide, 0, 0);
    const targetDirection = new THREE.Vector3();

    targetDirection
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(baseSpeed)
      .applyEuler(new THREE.Euler(0, camera.rotation.y, 0));

    // Smooth inertia acceleration & deceleration
    currentVelocityRef.current.lerp(targetDirection, Math.min(1.0, delta * 12));
    const isMoving = currentVelocityRef.current.lengthSq() > 0.05;

    camera.position.addScaledVector(currentVelocityRef.current, delta);

    // Natural human gait micro-bob & sway
    if (isMoving) {
      footstepTimerRef.current += delta;
      if (footstepTimerRef.current > (isRunning ? 0.30 : 0.46)) {
        stationAudioService.playFootstep();
        footstepTimerRef.current = 0;
      }

      if (headBobEnabled) {
        walkTimerRef.current += delta * (isRunning ? 11 : 7.5);
        const bobY = Math.sin(walkTimerRef.current) * (isRunning ? 0.045 : 0.025);
        const bobX = Math.cos(walkTimerRef.current * 0.5) * 0.012;
        camera.position.y += bobY * 0.15;
        camera.position.x += bobX * 0.1;
      }
    } else {
      walkTimerRef.current = THREE.MathUtils.lerp(walkTimerRef.current, 0, 0.1);
      footstepTimerRef.current = 0;
    }

    const { closestDistance, nearestObstacleName } = checkAndResolveCollisions(camera.position, 0.65);

    if (closestDistance < 0.85) {
      setObstacleProximity(true, nearestObstacleName);
    } else {
      setObstacleProximity(false);
    }

    if (touchLookVector.x !== 0 || touchLookVector.y !== 0) {
      camera.rotation.y -= touchLookVector.x * 0.03;
      camera.rotation.x -= touchLookVector.y * 0.03;
      camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));
    }

    let targetEyeY = 1.6;
    const posX = camera.position.x;
    const posZ = camera.position.z;
    const posY = camera.position.y;

    const inStair1 = Math.abs(posZ - (-8)) <= 1.6 && posX >= 2.6 && posX <= 8.8;
    const inStair2 = Math.abs(posZ - (-20)) <= 1.6 && posX >= 2.6 && posX <= 8.8;
    const inStair3 = Math.abs(posZ - (-34)) <= 1.6 && posX >= 2.6 && posX <= 8.8;
    const inFobStairs = inStair1 || inStair2 || inStair3;

    const inMainStairs = Math.abs(posX) < 2.2 && posZ >= -4.5 && posZ <= 4.5;

    if (inMainStairs) {
      const t = THREE.MathUtils.clamp((4.0 - posZ) / 8.0, 0, 1);
      targetEyeY = 1.6 + t * 6.2;
    }
    else if (inFobStairs) {
      const t = THREE.MathUtils.clamp((posX - 2.8) / 5.8, 0, 1);
      targetEyeY = 7.8 - t * 5.4;
    }
    else if (posY > 5.0) {
      targetEyeY = 7.8;
      if (posZ <= -4) {
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -2.8, 2.8);
      }
    }
    else if (posZ <= -4) {
      targetEyeY = 2.4;
    }
    else {
      targetEyeY = 1.6;
    }

    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetEyeY, 0.18);

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -36, 20);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -40, 38);

    setPlayerState(
      [camera.position.x, camera.position.y, camera.position.z],
      camera.rotation.y
    );
  });

  if (controlMode !== "fps") return null;

  if (!hasPointerLock) return null;

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={() => setIsPointerLocked(true)}
      onUnlock={() => setIsPointerLocked(false)}
    />
  );
}
