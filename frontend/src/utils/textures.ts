import * as THREE from "three";

/**
 * Procedural PBR Texture Generator for Realistic Indian Station Render
 */

// 1. Polished Cream Station Floor Tile Texture
export function createFloorTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#EAE4D9";
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "rgba(210, 200, 185, 0.3)";
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 15 + 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#8A847A";
  ctx.lineWidth = 4;
  const tileSize = 64;
  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

// 2. Yellow Tactile Platform Safety Strip Texture
export function createTactileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#E5B800";
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "#C89E00";
  for (let y = 8; y < 256; y += 32) {
    ctx.fillRect(0, y, 256, 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 40);
  return texture;
}

// 3. Asphalt Parking Lot Texture with Yellow/White Lines
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#2D3136";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? "#1F2225" : "#3D4248";
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.lineTo(480, 32);
  ctx.stroke();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  for (let x = 64; x < 480; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x, 448);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 4. Indian Railway Station Bilingual Signboard Canvas Texture
export function createSignboardTexture(
  hindiText: string,
  englishText: string,
  bgColor = "#0F3870",
  textColor = "#FFFFFF"
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = "#F5A623";
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 1008, 240);

  ctx.fillStyle = textColor;
  ctx.font = "bold 56px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(hindiText, 512, 90);

  ctx.font = "bold 44px Arial, sans-serif";
  ctx.fillText(englishText, 512, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4b. Indian Railway Staircase Banner Texture with Directional Badges
export function createStairBannerTexture(
  hindiText: string,
  englishText: string,
  arrowDir: "down" | "up" | "right" | "left" = "down",
  bgColor = "#0F3870",
  textColor = "#FFD700"
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = "#F5A623";
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 1008, 240);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 988, 220);

  const arrowSymbol = arrowDir === "down" ? "⬇" : arrowDir === "up" ? "⬆" : arrowDir === "right" ? "➡" : "⬅";

  [80, 944].forEach((xPos) => {
    ctx.fillStyle = "#F5A623";
    ctx.beginPath();
    ctx.arc(xPos, 128, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0F3870";
    ctx.font = "bold 48px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(arrowSymbol, xPos, 128);
  });

  ctx.fillStyle = textColor;
  ctx.font = "bold 52px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(hindiText, 512, 85);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillText(englishText, 512, 168);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 5. Authentic Indian Railway Two-Tone Dado Wall Texture
export function createIndianRailwayWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Upper Half: Warm Indian Railway Cream Plaster
  ctx.fillStyle = "#EAE4D6";
  ctx.fillRect(0, 0, 512, 256);

  // Lower Half: Indian Railway Deep Navy/Maroon Dado Wall Tile
  ctx.fillStyle = "#152D4A";
  ctx.fillRect(0, 256, 512, 256);

  // Dado Transition Divider Trim (Gold/Brass Strip)
  ctx.fillStyle = "#D4A359";
  ctx.fillRect(0, 250, 512, 12);

  // Subtle tile seam lines on lower half
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(4, 1);
  return texture;
}

// 6. Indian Railway LED Coach Position Display Board Texture (S1, S2, B1, A1)
export function createCoachBoardTexture(coachCode: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = "#10B981";
  ctx.font = "bold 42px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(coachCode, 128, 50);

  ctx.fillStyle = "#F59E0B";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("COACH POSITION", 128, 95);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 7. Authentic Indian Station Clock Face Texture
export function createClockFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 16;
  ctx.stroke();

  // Dial Hour Ticks
  ctx.fillStyle = "#0F172A";
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x1 = 256 + Math.sin(angle) * 190;
    const y1 = 256 - Math.cos(angle) * 190;
    const x2 = 256 + Math.sin(angle) * 220;
    const y2 = 256 - Math.cos(angle) * 220;

    ctx.lineWidth = i % 3 === 0 ? 8 : 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Indian Railways Logo Emblem
  ctx.fillStyle = "#1D4ED8";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("INDIAN RAILWAYS", 256, 170);

  // Clock Hands (10:10 position)
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";

  // Hour Hand
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(160, 160);
  ctx.stroke();

  // Minute Hand
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(340, 140);
  ctx.stroke();

  // Center Pin
  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.arc(256, 256, 12, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
