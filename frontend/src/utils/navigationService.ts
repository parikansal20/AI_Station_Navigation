import { GraphNode, GraphEdge, STATION_NODES, STATION_EDGES } from "@/data/navigationData";
import { StationFacility, LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";

export interface PathResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalDistance: number; // in meters
  estimatedMinutes: number; // in minutes based on 1.2m/s walking speed
  instructionsEnglish: string[];
  instructionsHindi: string[];
  isFallbackAccessible?: boolean;
}

// Calculate 3D Euclidean Distance between two positions
function getDistance(posA: [number, number, number], posB: [number, number, number]): number {
  const dx = posA[0] - posB[0];
  const dy = posA[1] - posB[1];
  const dz = posA[2] - posB[2];
  return Math.hypot(dx, dy, dz);
}

// Find nearest node in graph for any arbitrary [X, Y, Z] world position
export function findNearestNode(position: [number, number, number], floorFilter?: "G" | "1F"): GraphNode {
  let nearest: GraphNode = STATION_NODES[0];
  let minDistance = Infinity;

  for (const node of STATION_NODES) {
    if (floorFilter && node.floor !== floorFilter) continue;
    const dist = getDistance(position, node.position);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = node;
    }
  }

  return nearest;
}

/**
 * Dijkstra's Shortest Path Algorithm
 * Calculates the exact shortest path between startNodeId and targetNodeId.
 */
export function computeDijkstraPath(
  startNodeId: string,
  targetNodeId: string,
  accessibleOnly = false
): PathResult | null {
  const startNode = STATION_NODES.find((n) => n.id === startNodeId);
  const targetNode = STATION_NODES.find((n) => n.id === targetNodeId);

  if (!startNode || !targetNode) return null;

  if (startNodeId === targetNodeId) {
    return {
      nodes: [startNode],
      edges: [],
      totalDistance: 0,
      estimatedMinutes: 0,
      instructionsEnglish: ["You are already at your destination."],
      instructionsHindi: ["आप अपने गंतव्य पर ही हैं।"],
    };
  }

  // Build Adjacency List for Bidirectional Graph
  const adjMap = new Map<string, { node: GraphNode; edge: GraphEdge }[]>();

  for (const edge of STATION_EDGES) {
    if (accessibleOnly && !edge.accessible) continue;

    const fromNode = STATION_NODES.find((n) => n.id === edge.from);
    const toNode = STATION_NODES.find((n) => n.id === edge.to);

    if (fromNode && toNode) {
      if (!adjMap.has(fromNode.id)) adjMap.set(fromNode.id, []);
      adjMap.get(fromNode.id)!.push({ node: toNode, edge });

      const reverseEdge: GraphEdge = {
        ...edge,
        from: toNode.id,
        to: fromNode.id,
      };
      if (!adjMap.has(toNode.id)) adjMap.set(toNode.id, []);
      adjMap.get(toNode.id)!.push({ node: fromNode, edge: reverseEdge });
    }
  }

  if (accessibleOnly && (!adjMap.get(startNodeId) || adjMap.get(startNodeId)!.length === 0)) {
    const fallbackResult = computeDijkstraPath(startNodeId, targetNodeId, false);
    if (fallbackResult) {
      fallbackResult.isFallbackAccessible = true;
    }
    return fallbackResult;
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edge: GraphEdge }>();
  const unvisited = new Set<string>();

  for (const node of STATION_NODES) {
    distances.set(node.id, Infinity);
    unvisited.add(node.id);
  }

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let smallestDist = Infinity;

    for (const nodeId of unvisited) {
      const dist = distances.get(nodeId) ?? Infinity;
      if (dist < smallestDist) {
        smallestDist = dist;
        currentId = nodeId;
      }
    }

    if (!currentId || smallestDist === Infinity) break;

    if (currentId === targetNodeId) {
      const pathNodes: GraphNode[] = [];
      const pathEdges: GraphEdge[] = [];
      let curr = targetNodeId;

      while (previous.has(curr)) {
        const { nodeId: prevId, edge } = previous.get(curr)!;
        const currNodeObj = STATION_NODES.find((n) => n.id === curr)!;
        pathNodes.unshift(currNodeObj);
        pathEdges.unshift(edge);
        curr = prevId;
      }
      pathNodes.unshift(startNode);

      let totalDistance = 0;
      const instructionsEnglish: string[] = [];
      const instructionsHindi: string[] = [];

      pathEdges.forEach((edge, idx) => {
        totalDistance += edge.distance;
        instructionsEnglish.push(`Step ${idx + 1}: ${edge.instructionEnglish}`);
        instructionsHindi.push(`चरण ${idx + 1}: ${edge.instructionHindi}`);
      });

      const estimatedMinutes = Math.max(1, Math.round((totalDistance / 1.2 / 60) * 10) / 10);

      return {
        nodes: pathNodes,
        edges: pathEdges,
        totalDistance: Math.round(totalDistance),
        estimatedMinutes,
        instructionsEnglish,
        instructionsHindi,
      };
    }

    unvisited.delete(currentId);
    const neighbors = adjMap.get(currentId) || [];

    for (const { node: neighbor, edge } of neighbors) {
      if (!unvisited.has(neighbor.id)) continue;

      const alt = distances.get(currentId)! + edge.distance;
      if (alt < distances.get(neighbor.id)!) {
        distances.set(neighbor.id, alt);
        previous.set(neighbor.id, { nodeId: currentId, edge });
      }
    }
  }

  if (accessibleOnly) {
    const fallbackResult = computeDijkstraPath(startNodeId, targetNodeId, false);
    if (fallbackResult) {
      fallbackResult.isFallbackAccessible = true;
    }
    return fallbackResult;
  }

  return null;
}

export function calculatePathFromPositionToFacility(
  startPosOrFacility: [number, number, number] | StationFacility | string | null,
  targetFacility: StationFacility,
  accessibleOnly = false
): PathResult | null {
  let startPosition: [number, number, number] = [0, 0.1, 26];
  let startNodeId: string | null = null;

  if (startPosOrFacility) {
    if (typeof startPosOrFacility === "string") {
      const matched = LUCKNOW_STATION_FACILITIES.find((f) => f.id === startPosOrFacility);
      if (matched) {
        startPosition = matched.position;
        startNodeId = matched.id;
      }
    } else if (Array.isArray(startPosOrFacility)) {
      startPosition = startPosOrFacility as [number, number, number];
    } else if (typeof startPosOrFacility === "object" && "position" in startPosOrFacility) {
      startPosition = startPosOrFacility.position;
      startNodeId = startPosOrFacility.id;
    }
  }

  const playerFloor: "G" | "1F" = startPosition[1] > 4.5 ? "1F" : "G";
  
  let startNode = startNodeId ? STATION_NODES.find((n) => n.id === startNodeId) : null;
  if (!startNode) {
    startNode = findNearestNode(startPosition, playerFloor);
  }

  let targetNode = STATION_NODES.find((n) => n.id === targetFacility.id);
  if (!targetNode) {
    targetNode = findNearestNode(targetFacility.position, targetFacility.floor);
  }

  if (!startNode || !targetNode) return null;

  const dijkstra = computeDijkstraPath(startNode.id, targetNode.id, accessibleOnly);

  const rawPathNodes: GraphNode[] = dijkstra ? [...dijkstra.nodes] : [startNode, targetNode];
  const pathEdges: GraphEdge[] = dijkstra ? [...dijkstra.edges] : [];

  const fullPositions: [number, number, number][] = [];

  if (getDistance(startPosition, startNode.position) > 0.5) {
    fullPositions.push(startPosition);
  }

  for (const node of rawPathNodes) {
    const lastPos = fullPositions[fullPositions.length - 1];
    if (!lastPos || getDistance(lastPos, node.position) > 0.2) {
      fullPositions.push(node.position);
    }
  }

  const lastPos = fullPositions[fullPositions.length - 1];
  if (getDistance(lastPos, targetFacility.position) > 0.5) {
    fullPositions.push(targetFacility.position);
  }

  let realTotalDistance = 0;
  for (let i = 0; i < fullPositions.length - 1; i++) {
    realTotalDistance += getDistance(fullPositions[i], fullPositions[i + 1]);
  }

  const estimatedMinutes = Math.max(1, Math.round((realTotalDistance / 1.2 / 60) * 10) / 10);

  const instructionsEng = dijkstra?.instructionsEnglish.length
    ? dijkstra.instructionsEnglish
    : [`Walk towards ${targetFacility.labelEnglish}.`];
  const instructionsHin = dijkstra?.instructionsHindi.length
    ? dijkstra.instructionsHindi
    : [`${targetFacility.labelHindi} की दिशा में आगे बढ़ें।`];

  const virtualNodes: GraphNode[] = fullPositions.map((pos, idx) => ({
    id: `route-pt-${idx}`,
    labelEnglish:
      idx === 0
        ? "Start Location"
        : idx === fullPositions.length - 1
        ? targetFacility.labelEnglish
        : `Waypoint ${idx}`,
    labelHindi:
      idx === 0
        ? "प्रारंभिक स्थान"
        : idx === fullPositions.length - 1
        ? targetFacility.labelHindi
        : `वेपॉइंट ${idx}`,
    position: pos,
    floor: pos[1] > 4.5 ? "1F" : "G",
    accessible: true,
  }));

  return {
    nodes: virtualNodes,
    edges: pathEdges,
    totalDistance: Math.round(realTotalDistance),
    estimatedMinutes,
    instructionsEnglish: instructionsEng,
    instructionsHindi: instructionsHin,
    isFallbackAccessible: dijkstra?.isFallbackAccessible,
  };
}
