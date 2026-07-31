// js/visualizer.js

class GraphVisualizer {
  constructor(canvasId, graph) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.graph = graph;

    // Interaction State
    this.currentMode = 'node'; // 'node', 'edge'
    this.selectedNode = null;
    this.edgeStartNode = null;
    this.draggedNode = null;
    this.mousePos = { x: 0, y: 0 };
    
    // Animation State
    this.steps = [];
    this.currentStepIndex = -1;
    this.animationTimer = null;
    this.speed = 800; // ms
    this.isPlaying = false;
    
    // Playback visual tracking
    this.visitedNodeIds = new Set();
    this.traversedEdges = [];
    this.currentNodeId = null;
    this.edgeHighlight = null;
    this.distances = null;
    
    // UI Helpers
    this.helperText = document.getElementById('interaction-helper');
    this.btnDeleteNode = document.getElementById('btn-delete-node');
    this.btnRun = document.getElementById('btn-run');
    this.btnResetVis = document.getElementById('btn-reset-vis');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedValue = document.getElementById('speed-value');

    this.setupListeners();
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    
    // Support Retina displays
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    this.draw();
  }

  setupListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());

    // Prevent right-click menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Speed Slider
    if (this.speedSlider) {
      this.speedSlider.addEventListener('input', (e) => {
        this.speed = parseInt(e.target.value);
        if (this.speedValue) this.speedValue.textContent = `${this.speed}ms`;
      });
    }
  }

  getMouseCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleMouseDown(e) {
    if (this.isPlaying) return; // Disable interactions while animating

    const pos = this.getMouseCoords(e);
    const clickedNode = this.graph.findNodeNear(pos.x, pos.y, 22);

    if (e.button === 0) { // Left click
      if (this.currentMode === 'node') {
        if (clickedNode) {
          // Select or start dragging
          this.selectedNode = clickedNode;
          this.draggedNode = clickedNode;
          this.btnDeleteNode.disabled = false;
          this.draw();
        } else {
          // Clicked empty space: add a new node
          this.graph.addNode(pos.x, pos.y);
          this.selectedNode = null;
          this.btnDeleteNode.disabled = true;
          this.draw();
        }
      } else if (this.currentMode === 'edge') {
        if (clickedNode) {
          if (!this.edgeStartNode) {
            // First node selected
            this.edgeStartNode = clickedNode;
            this.helperText.textContent = `Node ${clickedNode.label} selected. Click another node to create edge.`;
          } else if (this.edgeStartNode.id !== clickedNode.id) {
            // Second node selected: trigger weights pop-up
            this.promptEdgeWeight(this.edgeStartNode, clickedNode);
          }
          this.draw();
        } else {
          // Clicked empty space: cancel edge creation
          this.edgeStartNode = null;
          this.helperText.textContent = "Mode: Add Edge. Click a start node.";
          this.draw();
        }
      }
    }
  }

  handleMouseMove(e) {
    const pos = this.getMouseCoords(e);
    this.mousePos = pos;

    if (this.draggedNode) {
      // Drag node
      this.draggedNode.x = Math.max(22, Math.min(pos.x, this.canvas.width / (window.devicePixelRatio || 1) - 22));
      this.draggedNode.y = Math.max(22, Math.min(pos.y, this.canvas.height / (window.devicePixelRatio || 1) - 22));
      this.draw();
    } else if (this.edgeStartNode) {
      // Draw rubber band
      this.draw();
    }
  }

  handleMouseUp() {
    this.draggedNode = null;
  }

  promptEdgeWeight(nodeA, nodeB) {
    const modal = document.getElementById('modal-weight');
    const labelA = document.getElementById('weight-node-a');
    const labelB = document.getElementById('weight-node-b');
    const weightInput = document.getElementById('edge-weight-input');
    
    labelA.textContent = nodeA.label;
    labelB.textContent = nodeB.label;
    
    // Check if edge already exists and prefill weight
    const existing = this.graph.getEdge(nodeA.id, nodeB.id);
    weightInput.value = existing ? existing.weight : 1;

    modal.classList.add('open');
    weightInput.focus();
    weightInput.select();

    // Temp event handlers
    const saveBtn = document.getElementById('btn-weight-save');
    const cancelBtn = document.getElementById('btn-weight-cancel');

    const cleanup = () => {
      modal.classList.remove('open');
      this.edgeStartNode = null;
      this.helperText.textContent = "Mode: Add Edge. Click a start node.";
      
      // Remove temporary listeners
      saveBtn.removeEventListener('click', onSave);
      cancelBtn.removeEventListener('click', onCancel);
      weightInput.removeEventListener('keydown', onKeyDown);
      this.draw();
    };

    const onSave = () => {
      const weight = parseInt(weightInput.value) || 1;
      this.graph.addEdge(nodeA.id, nodeB.id, weight);
      cleanup();
    };

    const onCancel = () => {
      cleanup();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter') onSave();
      if (e.key === 'Escape') onCancel();
    };

    saveBtn.addEventListener('click', onSave);
    cancelBtn.addEventListener('click', onCancel);
    weightInput.addEventListener('keydown', onKeyDown);
  }

  // Draw the entire graph onto the canvas
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Edges
    this.graph.edges.forEach(edge => {
      const uNode = this.graph.getNodeById(edge.u);
      const vNode = this.graph.getNodeById(edge.v);
      if (!uNode || !vNode) return;

      let isTraversed = this.traversedEdges.some(
        e => (e.u === edge.u && e.v === edge.v) || (e.u === edge.v && e.v === edge.u)
      );

      let isHighlighted = this.edgeHighlight && (
        (this.edgeHighlight.u === edge.u && this.edgeHighlight.v === edge.v) ||
        (this.edgeHighlight.u === edge.v && this.edgeHighlight.v === edge.u)
      );

      // Edge style
      this.ctx.beginPath();
      this.ctx.moveTo(uNode.x, uNode.y);
      this.ctx.lineTo(vNode.x, vNode.y);

      if (isHighlighted) {
        this.ctx.strokeStyle = '#22d3ee'; // cyan
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = '#06b6d4';
        this.ctx.shadowBlur = 8;
      } else if (isTraversed) {
        this.ctx.strokeStyle = '#f97316'; // orange traversal edge
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(249, 115, 22, 0.4)';
        this.ctx.shadowBlur = 4;
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowBlur = 0;
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // reset

      // Draw Edge Weight
      const midX = (uNode.x + vNode.x) / 2;
      const midY = (uNode.y + vNode.y) / 2;

      this.ctx.beginPath();
      this.ctx.arc(midX, midY, 11, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#111622';
      this.ctx.strokeStyle = isHighlighted ? '#22d3ee' : 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#f3f4f6';
      this.ctx.font = '10px JetBrains Mono';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(edge.weight, midX, midY);
    });

    // Draw Rubber Band (for edge drawing mode)
    if (this.currentMode === 'edge' && this.edgeStartNode) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.edgeStartNode.x, this.edgeStartNode.y);
      this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
      this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // reset
    }

    // Draw Nodes
    this.graph.nodes.forEach(node => {
      const isVisited = this.visitedNodeIds.has(node.id);
      const isCurrent = this.currentNodeId === node.id;
      const isSelected = this.selectedNode && this.selectedNode.id === node.id;

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);

      // Node background coloring
      if (isVisited) {
        this.ctx.fillStyle = '#f97316'; // Visited: Orange!
        this.ctx.shadowColor = 'rgba(249, 115, 22, 0.8)';
        this.ctx.shadowBlur = 10;
      } else if (isCurrent) {
        this.ctx.fillStyle = '#4f46e5'; // Current: Indigo
        this.ctx.shadowColor = '#6366f1';
        this.ctx.shadowBlur = 10;
      } else {
        this.ctx.fillStyle = '#111622';
        this.ctx.shadowBlur = 0;
      }
      this.ctx.fill();

      // Node border ring
      if (isSelected) {
        this.ctx.strokeStyle = '#06b6d4'; // Selected: Cyan ring
        this.ctx.lineWidth = 3;
      } else if (isCurrent) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2.5;
      } else {
        this.ctx.strokeStyle = isVisited ? '#fdba74' : 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // reset

      // Draw Node Label text
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '500 13px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.label, node.x, node.y);

      // Draw Distance label (for shortest path algos Dijkstra / Bellman)
      if (this.distances && this.distances[node.id] !== undefined) {
        const distVal = this.distances[node.id];
        const distStr = distVal === Infinity ? '∞' : distVal;
        
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.font = '10px JetBrains Mono';
        this.ctx.fillText(`d=${distStr}`, node.x, node.y - 28);
      }
    });
  }

  // Animation Playback Management
  setSteps(steps) {
    this.steps = steps;
    this.currentStepIndex = 0;
    this.visitedNodeIds.clear();
    this.traversedEdges = [];
    this.currentNodeId = null;
    this.edgeHighlight = null;
    this.distances = null;
    this.btnResetVis.disabled = false;
  }

  play() {
    if (this.steps.length === 0) return;
    this.isPlaying = true;
    this.btnRun.disabled = true;
    this.btnResetVis.disabled = true;
    
    // Disable operations during play
    document.querySelectorAll('.btn-mode, .btn-algo').forEach(el => el.disabled = true);
    
    this.playback();
  }

  playback() {
    if (this.currentStepIndex >= this.steps.length) {
      this.stop();
      return;
    }

    const step = this.steps[this.currentStepIndex];
    
    // Apply step parameters to the visualizer state
    this.currentNodeId = step.currentNode;
    this.edgeHighlight = step.edgeHighlight || null;
    
    if (step.visitedNodes) {
      this.visitedNodeIds = new Set(step.visitedNodes);
    }
    if (step.visitedEdges) {
      this.traversedEdges = step.visitedEdges;
    }
    if (step.distances) {
      this.distances = step.distances;
    }

    this.helperText.textContent = step.description;
    this.draw();

    this.currentStepIndex++;
    this.animationTimer = setTimeout(() => this.playback(), this.speed);
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.animationTimer);
    
    // Re-enable controls
    document.querySelectorAll('.btn-mode, .btn-algo').forEach(el => el.disabled = false);
    this.btnResetVis.disabled = false;
    this.btnRun.disabled = false;
    
    this.helperText.textContent = "Algorithm run complete. Select Mode or Reset Visuals.";
  }

  resetVisuals() {
    this.isPlaying = false;
    clearTimeout(this.animationTimer);
    this.steps = [];
    this.currentStepIndex = -1;
    this.visitedNodeIds.clear();
    this.traversedEdges = [];
    this.currentNodeId = null;
    this.edgeHighlight = null;
    this.distances = null;
    
    this.btnResetVis.disabled = true;
    
    // Reset helper text based on mode
    if (this.currentMode === 'node') {
      this.helperText.textContent = "Mode: Add Node. Click on the canvas to place a node.";
    } else {
      this.helperText.textContent = "Mode: Add Edge. Click a start node.";
    }
    
    this.draw();
  }
}

// Export visualizer
window.GraphVisualizer = GraphVisualizer;
