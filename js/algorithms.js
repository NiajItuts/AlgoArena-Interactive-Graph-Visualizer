// js/algorithms.js

/**
 * Runs BFS on the graph starting from startNodeId.
 * Returns steps and comparison metrics.
 */
function runBFS(graph, startNodeId) {
  const startTime = performance.now();
  const steps = [];
  const visited = new Set();
  const visitedOrder = [];
  const traversedEdges = [];
  
  if (graph.nodes.length === 0) {
    return { steps, visitedOrder, executionTime: 0 };
  }

  const queue = [startNodeId];
  visited.add(startNodeId);
  visitedOrder.push(startNodeId);

  steps.push({
    type: 'visit',
    currentNode: startNodeId,
    visitedNodes: [...visited],
    visitedEdges: [...traversedEdges],
    description: `Start BFS from node ${startNodeId}`
  });

  while (queue.length > 0) {
    const u = queue.shift();

    // Get neighbors and sort them for a deterministic, clean visualization
    const neighbors = graph.getNeighbors(u).sort((a, b) => a.nodeId - b.nodeId);
    
    for (const neighbor of neighbors) {
      const v = neighbor.nodeId;
      if (!visited.has(v)) {
        visited.add(v);
        visitedOrder.push(v);
        traversedEdges.push({ u, v });

        steps.push({
          type: 'traverse',
          currentNode: u,
          edgeHighlight: { u, v },
          visitedNodes: [...visited],
          visitedEdges: [...traversedEdges],
          description: `Traverse edge from ${u} to ${v}`
        });

        steps.push({
          type: 'visit',
          currentNode: v,
          visitedNodes: [...visited],
          visitedEdges: [...traversedEdges],
          description: `Visit node ${v} and add its neighbors to queue`
        });

        queue.push(v);
      }
    }
  }

  const endTime = performance.now();
  return {
    steps,
    visitedOrder,
    executionTime: endTime - startTime
  };
}

/**
 * Runs DFS on the graph starting from startNodeId.
 * Returns steps and comparison metrics.
 */
function runDFS(graph, startNodeId) {
  const startTime = performance.now();
  const steps = [];
  const visited = new Set();
  const visitedOrder = [];
  const traversedEdges = [];

  if (graph.nodes.length === 0) {
    return { steps, visitedOrder, executionTime: 0 };
  }

  function dfsHelper(u, parent = null) {
    visited.add(u);
    visitedOrder.push(u);
    if (parent !== null) {
      traversedEdges.push({ u: parent, v: u });
    }

    steps.push({
      type: 'visit',
      currentNode: u,
      visitedNodes: [...visited],
      visitedEdges: [...traversedEdges],
      description: `Visit node ${u}`
    });

    const neighbors = graph.getNeighbors(u).sort((a, b) => a.nodeId - b.nodeId);
    for (const neighbor of neighbors) {
      const v = neighbor.nodeId;
      if (!visited.has(v)) {
        steps.push({
          type: 'traverse',
          currentNode: u,
          edgeHighlight: { u, v },
          visitedNodes: [...visited],
          visitedEdges: [...traversedEdges],
          description: `Traverse from node ${u} to unvisited node ${v}`
        });
        dfsHelper(v, u);
      }
    }
  }

  dfsHelper(startNodeId);

  const endTime = performance.now();
  return {
    steps,
    visitedOrder,
    executionTime: endTime - startTime
  };
}

/**
 * Runs Dijkstra's algorithm from startNodeId.
 * Returns steps and comparison metrics.
 */
function runDijkstra(graph, startNodeId) {
  const startTime = performance.now();
  const steps = [];
  const visited = new Set();
  const visitedOrder = [];
  const traversedEdges = [];
  
  const distances = {};
  const previous = {};
  
  graph.nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[startNodeId] = 0;

  steps.push({
    type: 'init',
    currentNode: startNodeId,
    visitedNodes: [],
    visitedEdges: [],
    distances: { ...distances },
    description: `Initialize distances. Set distance of node ${startNodeId} to 0.`
  });

  const unvisited = new Set(graph.nodes.map(n => n.id));

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let u = null;
    let minDist = Infinity;
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDist) {
        minDist = distances[nodeId];
        u = nodeId;
      }
    });

    // If remaining nodes are unreachable
    if (u === null) break;

    unvisited.delete(u);
    visited.add(u);
    visitedOrder.push(u);
    
    if (previous[u] !== null) {
      traversedEdges.push({ u: previous[u], v: u });
    }

    steps.push({
      type: 'visit',
      currentNode: u,
      visitedNodes: [...visited],
      visitedEdges: [...traversedEdges],
      distances: { ...distances },
      description: `Select node ${u} with minimum distance (${minDist === Infinity ? '∞' : minDist})`
    });

    const neighbors = graph.getNeighbors(u);
    for (const neighbor of neighbors) {
      const v = neighbor.nodeId;
      const weight = neighbor.weight;
      
      if (unvisited.has(v)) {
        const alt = distances[u] + weight;
        
        steps.push({
          type: 'traverse',
          currentNode: u,
          edgeHighlight: { u, v },
          visitedNodes: [...visited],
          visitedEdges: [...traversedEdges],
          distances: { ...distances },
          description: `Examine neighbor ${v} of node ${u}`
        });

        if (alt < distances[v]) {
          distances[v] = alt;
          previous[v] = u;

          steps.push({
            type: 'relax',
            currentNode: u,
            edgeHighlight: { u, v },
            visitedNodes: [...visited],
            visitedEdges: [...traversedEdges],
            distances: { ...distances },
            description: `Relax edge (${u}, ${v}): update distance of node ${v} to ${alt}`
          });
        }
      }
    }
  }

  const endTime = performance.now();
  return {
    steps,
    visitedOrder,
    executionTime: endTime - startTime
  };
}

/**
 * Runs Bellman-Ford algorithm from startNodeId.
 * Returns steps and comparison metrics.
 */
function runBellmanFord(graph, startNodeId) {
  const startTime = performance.now();
  const steps = [];
  const visited = new Set();
  const visitedOrder = [];
  const traversedEdges = [];
  
  const distances = {};
  const previous = {};
  
  graph.nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[startNodeId] = 0;
  visited.add(startNodeId);
  visitedOrder.push(startNodeId);

  steps.push({
    type: 'init',
    currentNode: startNodeId,
    visitedNodes: [startNodeId],
    visitedEdges: [],
    distances: { ...distances },
    description: `Initialize distances. Set distance of node ${startNodeId} to 0.`
  });

  const numVertices = graph.nodes.length;
  
  // Relax all edges |V| - 1 times
  for (let i = 1; i <= numVertices - 1; i++) {
    let anyUpdate = false;
    
    // Sort edges to ensure deterministic order during traversal visualization
    const sortedEdges = [...graph.edges].sort((a, b) => {
      if (a.u !== b.u) return a.u - b.u;
      return a.v - b.v;
    });

    for (const edge of sortedEdges) {
      const { u, v, weight } = edge;
      
      steps.push({
        type: 'traverse',
        currentNode: u,
        edgeHighlight: { u, v },
        visitedNodes: [...visited],
        visitedEdges: [...traversedEdges],
        distances: { ...distances },
        description: `Pass ${i}: Examine edge (${u}, ${v}) with weight ${weight}`
      });

      // Relax in direction u -> v
      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
        previous[v] = u;
        anyUpdate = true;
        visited.add(v);
        if (!visitedOrder.includes(v)) {
          visitedOrder.push(v);
        }
        
        // Add to traversed edges if it updates
        const existingTraversed = traversedEdges.findIndex(e => e.v === v);
        if (existingTraversed !== -1) {
          traversedEdges[existingTraversed] = { u, v };
        } else {
          traversedEdges.push({ u, v });
        }

        steps.push({
          type: 'relax',
          currentNode: v,
          edgeHighlight: { u, v },
          visitedNodes: [...visited],
          visitedEdges: [...traversedEdges],
          distances: { ...distances },
          description: `Pass ${i}: Relax edge (${u}, ${v}). Distance to ${v} is now ${distances[v]}`
        });
      }
      
      // Since it's an undirected graph, relax in direction v -> u as well
      if (distances[v] !== Infinity && distances[v] + weight < distances[u]) {
        distances[u] = distances[v] + weight;
        previous[u] = v;
        anyUpdate = true;
        visited.add(u);
        if (!visitedOrder.includes(u)) {
          visitedOrder.push(u);
        }

        const existingTraversed = traversedEdges.findIndex(e => e.v === u);
        if (existingTraversed !== -1) {
          traversedEdges[existingTraversed] = { u: v, v: u };
        } else {
          traversedEdges.push({ u: v, v: u });
        }

        steps.push({
          type: 'relax',
          currentNode: u,
          edgeHighlight: { u, v },
          visitedNodes: [...visited],
          visitedEdges: [...traversedEdges],
          distances: { ...distances },
          description: `Pass ${i}: Relax edge (${v}, ${u}). Distance to ${u} is now ${distances[u]}`
        });
      }
    }
    
    if (!anyUpdate) break; // Optimization if no changes in a pass
  }

  // Check for negative weight cycles
  let hasNegativeCycle = false;
  for (const edge of graph.edges) {
    const { u, v, weight } = edge;
    if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
      hasNegativeCycle = true;
      break;
    }
    if (distances[v] !== Infinity && distances[v] + weight < distances[u]) {
      hasNegativeCycle = true;
      break;
    }
  }

  if (hasNegativeCycle) {
    steps.push({
      type: 'error',
      currentNode: null,
      visitedNodes: [...visited],
      visitedEdges: [...traversedEdges],
      distances: { ...distances },
      description: "Negative-weight cycle detected! Shortest paths are undefined."
    });
  }

  const endTime = performance.now();
  return {
    steps,
    visitedOrder,
    executionTime: endTime - startTime,
    hasNegativeCycle
  };
}

/**
 * Runs Kruskal's MST algorithm.
 * Returns steps and comparison metrics.
 */
function runKruskal(graph) {
  const startTime = performance.now();
  const steps = [];
  const visited = new Set();
  const visitedOrder = [];
  const mstEdges = [];
  
  if (graph.nodes.length === 0) {
    return { steps, visitedOrder, executionTime: 0 };
  }

  // DSU Helper structures
  const parent = {};
  const rank = {};
  
  graph.nodes.forEach(node => {
    parent[node.id] = node.id;
    rank[node.id] = 0;
  });

  function find(i) {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]); // Path compression
    return parent[i];
  }

  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      if (rank[rootI] < rank[rootJ]) {
        parent[rootI] = rootJ;
      } else if (rank[rootI] > rank[rootJ]) {
        parent[rootJ] = rootI;
      } else {
        parent[rootJ] = rootI;
        rank[rootI]++;
      }
      return true;
    }
    return false;
  }

  // Sort edges by weight
  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);

  steps.push({
    type: 'init',
    currentNode: null,
    visitedNodes: [],
    visitedEdges: [],
    description: `Sorted ${sortedEdges.length} edges by weight for Kruskal's Algorithm.`
  });

  for (const edge of sortedEdges) {
    const { u, v, weight } = edge;

    steps.push({
      type: 'traverse',
      currentNode: null,
      edgeHighlight: { u, v },
      visitedNodes: [...visited],
      visitedEdges: [...mstEdges],
      description: `Check edge (${u}, ${v}) with weight ${weight}`
    });

    const rootU = find(u);
    const rootV = find(v);

    if (rootU !== rootV) {
      union(u, v);
      mstEdges.push({ u, v });
      
      // Visited nodes are colored orange in Kruskal as they get connected to the MST
      visited.add(u);
      visited.add(v);
      if (!visitedOrder.includes(u)) visitedOrder.push(u);
      if (!visitedOrder.includes(v)) visitedOrder.push(v);

      steps.push({
        type: 'mst-add',
        currentNode: null,
        edgeHighlight: { u, v },
        visitedNodes: [...visited],
        visitedEdges: [...mstEdges],
        description: `Edge (${u}, ${v}) does not create a cycle. Add to MST.`
      });
    } else {
      steps.push({
        type: 'mst-discard',
        currentNode: null,
        edgeHighlight: { u, v },
        visitedNodes: [...visited],
        visitedEdges: [...mstEdges],
        description: `Edge (${u}, ${v}) creates a cycle. Discard it.`
      });
    }
  }

  const endTime = performance.now();
  return {
    steps,
    visitedOrder,
    executionTime: endTime - startTime
  };
}

// Export algorithms to global scope
window.runBFS = runBFS;
window.runDFS = runDFS;
window.runDijkstra = runDijkstra;
window.runBellmanFord = runBellmanFord;
window.runKruskal = runKruskal;
