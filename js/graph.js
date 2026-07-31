class Graph {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.nodeIdCounter = 1;
  }

  // Add a node at coordinates (x, y)
  addNode(x, y) {
    const node = {
      id: this.nodeIdCounter++,
      label: `${this.nodeIdCounter - 1}`,
      x: x,
      y: y
    };
    this.nodes.push(node);
    return node;
  }

  // Delete a node and all edges connected to it
  deleteNode(id) {
    this.nodes = this.nodes.filter(node => node.id !== id);
    this.edges = this.edges.filter(edge => edge.u !== id && edge.v !== id);
  }

  // Add or update an edge between node u and node v with a weight
  addEdge(u, v, weight) {
    // Check if edge already exists (undirected, so check both directions)
    const existingEdge = this.edges.find(
      edge => (edge.u === u && edge.v === v) || (edge.u === v && edge.v === u)
    );

    if (existingEdge) {
      existingEdge.weight = weight;
      return existingEdge;
    } else {
      const edge = { u, v, weight };
      this.edges.push(edge);
      return edge;
    }
  }

  // Delete an edge between u and v
  deleteEdge(u, v) {
    this.edges = this.edges.filter(
      edge => !((edge.u === u && edge.v === v) || (edge.u === v && edge.v === u))
    );
  }

  // Get node object by its ID
  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }

  // Get edge object between u and v
  getEdge(u, v) {
    return this.edges.find(
      edge => (edge.u === u && edge.v === v) || (edge.u === v && edge.v === u)
    );
  }

  // Find a node near coordinates (x, y) within a certain pixel radius
  findNodeNear(x, y, radius = 20) {
    return this.nodes.find(node => {
      const dist = Math.hypot(node.x - x, node.y - y);
      return dist <= radius;
    });
  }

  // Clear all nodes and edges, resetting the ID counter
  clear() {
    this.nodes = [];
    this.edges = [];
    this.nodeIdCounter = 1;
  }

  // Create a deep copy of the graph (useful for benchmarking)
  clone() {
    const cloneGraph = new Graph();
    cloneGraph.nodeIdCounter = this.nodeIdCounter;
    
    // Copy nodes
    cloneGraph.nodes = this.nodes.map(node => ({ ...node }));
    
    // Copy edges
    cloneGraph.edges = this.edges.map(edge => ({ ...edge }));
    
    return cloneGraph;
  }

  // Get neighbors of a node
  getNeighbors(nodeId) {
    const neighbors = [];
    this.edges.forEach(edge => {
      if (edge.u === nodeId) {
        neighbors.push({ nodeId: edge.v, weight: edge.weight });
      } else if (edge.v === nodeId) {
        neighbors.push({ nodeId: edge.u, weight: edge.weight });
      }
    });
    return neighbors;
  }
}

// Export class to global scope
window.Graph = Graph;
