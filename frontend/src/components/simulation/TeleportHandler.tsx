"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/store/simulationStore";

export default function TeleportHandler() {
  const { camera, controls } = useThree();
  const teleportTarget = useSimulationStore((s) => s.teleportTarget);
  const clearTeleportTarget = useSimulationStore((s) => s.clearTeleportTarget);
  const setPlayerState = useSimulationStore((s) => s.setPlayerState);
  const controlMode = useSimulationStore((s) => s.controlMode);
  const activePathResult = useSimulationStore((s) => s.activePathResult);
  const currentNavStepIndex = useSimulationStore((s) => s.currentNavStepIndex);

  const desiredCamPos = useRef(new THREE.Vector3());
  const desiredTargetPos = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);

  useEffect(() => {
    if (!teleportTarget) return;

    const [tx, ty, tz] = teleportTarget;

    let floorY = 0.0;
    if (ty > 4.5) {
      floorY = 6.2;
    } else if (tz <= -4) {
      floorY = 0.9;
    }

    const eyeY = floorY + 1.6;

    let ux = 0;
    let uz = -1;
    let yaw = 0;

    if (activePathResult && activePathResult.nodes.length > 1) {
      const currIdx = Math.min(currentNavStepIndex, activePathResult.nodes.length - 1);
      const nextIdx = Math.min(currIdx + 1, activePathResult.nodes.length - 1);

      const currNode = activePathResult.nodes[currIdx];
      const nextNode = activePathResult.nodes[nextIdx];

      if (currNode && nextNode && currIdx !== nextIdx) {
        const dx = nextNode.position[0] - currNode.position[0];
        const dz = nextNode.position[2] - currNode.position[2];
        const len = Math.hypot(dx, dz);
        if (len > 0.1) {
          ux = dx / len;
          uz = dz / len;
          yaw = Math.atan2(dx, dz);
        }
      }
    }

    if (controlMode === "fps") {
      desiredCamPos.current.set(tx, eyeY, tz);
      camera.position.set(tx, eyeY, tz);
      camera.rotation.set(0, yaw, 0);
      setPlayerState([tx, eyeY, tz], yaw);
      isAnimating.current = false;
    } else {
      let camX = tx - ux * 2.2;
      let camY = floorY + 1.9;
      let camZ = tz - uz * 2.2;

      if (tz > -4) {
        if (Math.abs(tx) <= 3) {
          camX = THREE.MathUtils.clamp(camX, -2.5, 2.5);
        } else if (tx > 3) {
          camX = THREE.MathUtils.clamp(camX, 3.5, 7.5);
        } else if (tx < -3) {
          camX = THREE.MathUtils.clamp(camX, -7.5, -3.5);
        }
      } else if (ty > 4.5) {
        camX = THREE.MathUtils.clamp(camX, -2.8, 2.8);
      }

      const lookX = tx + ux * 3.5;
      const lookY = eyeY;
      const lookZ = tz + uz * 3.5;

      desiredCamPos.current.set(camX, camY, camZ);
      desiredTargetPos.current.set(lookX, lookY, lookZ);
      isAnimating.current = true;

      setPlayerState([tx, eyeY, tz], yaw);
    }

    clearTeleportTarget();
  }, [teleportTarget, camera, controls, controlMode, activePathResult, currentNavStepIndex, clearTeleportTarget, setPlayerState]);

  useFrame((_, delta) => {
    if (!isAnimating.current || controlMode === "fps") return;

    const t = Math.min(1.0, delta * 6.5);

    camera.position.lerp(desiredCamPos.current, t);

    if (controls && "target" in controls) {
      (controls as any).target.lerp(desiredTargetPos.current, t);
      (controls as any).update();
    }

    if (camera.position.distanceTo(desiredCamPos.current) < 0.05) {
      isAnimating.current = false;
    }
  });

  return null;
}
