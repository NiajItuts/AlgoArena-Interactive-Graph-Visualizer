// js/comparator.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Main App Graph and Visualizer
  const mainGraph = new Graph();
  const mainVisualizer = new GraphVisualizer('main-canvas', mainGraph);

  // Selected state
  let selectedAlgorithm = null;
  const helperText = document.getElementById('interaction-helper');
  const btnRun = document.getElementById('btn-run');
  const btnDeleteNode = document.getElementById('btn-delete-node');
  const btnClear = document.getElementById('btn-clear');
  const btnResetVis = document.getElementById('btn-reset-vis');

  // 2. Toolbar Operations Configuration
  const modeButtons = document.querySelectorAll('.btn-mode');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      mainVisualizer.currentMode = mode;
      
      // Update help text
      if (mode === 'node') {
        helperText.textContent = "Mode: Add Node. Click on the canvas to place a node.";
      } else if (mode === 'edge') {
        helperText.textContent = "Mode: Add Edge. Click node A, then click node B to connect them.";
      }
      
      // Reset edge creation temporary state
      mainVisualizer.edgeStartNode = null;
      mainVisualizer.draw();
    });
  });

  // Delete Selected Node Button
  btnDeleteNode.addEventListener('click', () => {
    if (mainVisualizer.selectedNode) {
      const nodeId = mainVisualizer.selectedNode.id;
      mainGraph.deleteNode(nodeId);
      mainVisualizer.selectedNode = null;
      btnDeleteNode.disabled = true;
      mainVisualizer.draw();
      helperText.textContent = `Deleted Node ${nodeId} and all connected edges.`;
    }
  });

  // Clear Canvas Button
  btnClear.addEventListener('click', () => {
    mainGraph.clear();
    mainVisualizer.resetVisuals();
    btnDeleteNode.disabled = true;
    helperText.textContent = "Canvas cleared.";
  });

  // Reset Visuals Button
  btnResetVis.addEventListener('click', () => {
    mainVisualizer.resetVisuals();
  });

  // 3. Algorithm Selection Logic
  const algoButtons = document.querySelectorAll('.btn-algo');
  algoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      algoButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAlgorithm = btn.dataset.algo;
      btnRun.disabled = false;

      // Reset visual state before selecting new algo
      mainVisualizer.resetVisuals();

      if (selectedAlgorithm === 'kruskal') {
        helperText.textContent = "Selected Kruskal's. Click 'Run Algorithm' to build the Minimum Spanning Tree.";
      } else {
        const algoNames = {
          bfs: 'BFS',
          dfs: 'DFS',
          dijkstra: "Dijkstra's",
          bellman: 'Bellman-Ford'
        };
        helperText.textContent = `Selected ${algoNames[selectedAlgorithm]}. Select a starting node, then click 'Run Algorithm'.`;
      }
    });
  });

  // 4. Algorithm Run Trigger
  btnRun.addEventListener('click', () => {
    if (!selectedAlgorithm || mainGraph.nodes.length === 0) return;

    let startNodeId = null;
    
    // For single-source algorithms, get start node
    if (selectedAlgorithm !== 'kruskal') {
      if (mainVisualizer.selectedNode) {
        startNodeId = mainVisualizer.selectedNode.id;
      } else {
        // Default to the first created node
        startNodeId = mainGraph.nodes[0].id;
        helperText.textContent = `No start node selected. Defaulting to Node ${startNodeId}.`;
      }
    }

    let result = null;
    
    switch (selectedAlgorithm) {
      case 'bfs':
        result = runBFS(mainGraph, startNodeId);
        break;
      case 'dfs':
        result = runDFS(mainGraph, startNodeId);
        break;
      case 'dijkstra':
        result = runDijkstra(mainGraph, startNodeId);
        break;
      case 'bellman':
        result = runBellmanFord(mainGraph, startNodeId);
        break;
      case 'kruskal':
        result = runKruskal(mainGraph);
        break;
    }

    if (result && result.steps) {
      mainVisualizer.setSteps(result.steps);
      mainVisualizer.play();
    }
  });

  // 5. Benchmarking / Comparison Dialog logic
  const modalCompare = document.getElementById('modal-compare');
  const btnCompare = document.getElementById('btn-compare');
  const btnCompareClose = document.getElementById('btn-compare-close');
  const btnComparePlay = document.getElementById('btn-compare-play');
  const btnCompareReset = document.getElementById('btn-compare-reset');
  const compareStatusMsg = document.getElementById('compare-status-msg');

  // Compare Visualizers
  let compareGraph1 = null;
  let compareGraph2 = null;
  let compareVis1 = null;
  let compareVis2 = null;
  let compareTimer = null;
  let isComparing = false;
  let compareIndex1 = 0;
  let compareIndex2 = 0;

  // Canvas context elements
  const cvs1 = document.getElementById('compare-canvas-1');
  const cvs2 = document.getElementById('compare-canvas-2');

  function resizeCompareCanvases() {
    const parent1 = cvs1.parentElement;
    const parent2 = cvs2.parentElement;
    const rect1 = parent1.getBoundingClientRect();
    const rect2 = parent2.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    cvs1.width = rect1.width * dpr;
    cvs1.height = rect1.height * dpr;
    cvs1.getContext('2d').scale(dpr, dpr);
    cvs1.style.width = `${rect1.width}px`;
    cvs1.style.height = `${rect1.height}px`;

    cvs2.width = rect2.width * dpr;
    cvs2.height = rect2.height * dpr;
    cvs2.getContext('2d').scale(dpr, dpr);
    cvs2.style.width = `${rect2.width}px`;
    cvs2.style.height = `${rect2.height}px`;
  }

  btnCompare.addEventListener('click', () => {
    if (mainGraph.nodes.length === 0) {
      alert('Please add some nodes and edges first!');
      return;
    }

    const algo1 = document.getElementById('compare-algo-1').value;
    const algo2 = document.getElementById('compare-algo-2').value;

    const namesMap = {
      bfs: 'Breadth-First Search (BFS)',
      dfs: 'Depth-First Search (DFS)',
      dijkstra: "Dijkstra's Algorithm",
      bellman: 'Bellman-Ford Algorithm',
      kruskal: "Kruskal's Algorithm (MST)"
    };

    document.getElementById('compare-title-1').textContent = namesMap[algo1];
    document.getElementById('compare-title-2').textContent = namesMap[algo2];

    // Open Modal
    modalCompare.classList.add('open');
    
    // Wait a brief tick to let elements render, then resize canvases
    setTimeout(() => {
      resizeCompareCanvases();
      
      // Clone main graph for each comparison pane
      compareGraph1 = mainGraph.clone();
      compareGraph2 = mainGraph.clone();
      
      compareVis1 = new GraphVisualizer('compare-canvas-1', compareGraph1);
      compareVis2 = new GraphVisualizer('compare-canvas-2', compareGraph2);
      
      // Start node selection for the runs
      const startNodeId = mainVisualizer.selectedNode ? mainVisualizer.selectedNode.id : mainGraph.nodes[0].id;
      
      // Run both algorithms and get results
      const runAlgo = (algoKey, graph, startId) => {
        switch(algoKey) {
          case 'bfs': return runBFS(graph, startId);
          case 'dfs': return runDFS(graph, startId);
          case 'dijkstra': return runDijkstra(graph, startId);
          case 'bellman': return runBellmanFord(graph, startId);
          case 'kruskal': return runKruskal(graph);
        }
      };

      const result1 = runAlgo(algo1, compareGraph1, startNodeId);
      const result2 = runAlgo(algo2, compareGraph2, startNodeId);

      // Populate text metrics
      document.getElementById('compare-count-1').textContent = result1.visitedOrder.length;
      document.getElementById('compare-count-2').textContent = result2.visitedOrder.length;

      document.getElementById('compare-visited-1').textContent = result1.visitedOrder.join(' → ') || 'None';
      document.getElementById('compare-visited-2').textContent = result2.visitedOrder.join(' → ') || 'None';

      document.getElementById('compare-time-1').textContent = `${result1.executionTime.toFixed(4)} ms`;
      document.getElementById('compare-time-2').textContent = `${result2.executionTime.toFixed(4)} ms`;

      // Set playback steps
      compareVis1.setSteps(result1.steps);
      compareVis2.setSteps(result2.steps);

      // Reset index
      compareIndex1 = 0;
      compareIndex2 = 0;
      isComparing = false;
      btnComparePlay.textContent = "Play Comparison";
      compareStatusMsg.textContent = "Ready. Click Play to start side-by-side execution.";
      
      // Draw initial graphs
      compareVis1.draw();
      compareVis2.draw();
    }, 100);
  });

  // Close Comparison Modal
  btnCompareClose.addEventListener('click', () => {
    modalCompare.classList.remove('open');
    stopComparison();
  });

  // Synchronized Side-by-Side Playback Loop
  function stopComparison() {
    isComparing = false;
    clearTimeout(compareTimer);
    btnComparePlay.textContent = "Play Comparison";
  }

  function runComparisonStep() {
    if (!isComparing) return;

    let stepsPending = false;

    // Advance Canvas 1
    if (compareIndex1 < compareVis1.steps.length) {
      const step = compareVis1.steps[compareIndex1];
      compareVis1.currentNodeId = step.currentNode;
      compareVis1.edgeHighlight = step.edgeHighlight || null;
      if (step.visitedNodes) compareVis1.visitedNodeIds = new Set(step.visitedNodes);
      if (step.visitedEdges) compareVis1.traversedEdges = step.visitedEdges;
      if (step.distances) compareVis1.distances = step.distances;
      compareVis1.draw();
      compareIndex1++;
      stepsPending = true;
    }

    // Advance Canvas 2
    if (compareIndex2 < compareVis2.steps.length) {
      const step = compareVis2.steps[compareIndex2];
      compareVis2.currentNodeId = step.currentNode;
      compareVis2.edgeHighlight = step.edgeHighlight || null;
      if (step.visitedNodes) compareVis2.visitedNodeIds = new Set(step.visitedNodes);
      if (step.visitedEdges) compareVis2.traversedEdges = step.visitedEdges;
      if (step.distances) compareVis2.distances = step.distances;
      compareVis2.draw();
      compareIndex2++;
      stepsPending = true;
    }

    if (stepsPending) {
      compareStatusMsg.textContent = `Comparing... Step ${Math.max(compareIndex1, compareIndex2)} / ${Math.max(compareVis1.steps.length, compareVis2.steps.length)}`;
      compareTimer = setTimeout(runComparisonStep, mainVisualizer.speed);
    } else {
      stopComparison();
      compareStatusMsg.textContent = "Comparison visualization complete.";
    }
  }

  btnComparePlay.addEventListener('click', () => {
    if (isComparing) {
      stopComparison();
      btnComparePlay.textContent = "Play Comparison";
      compareStatusMsg.textContent = "Paused.";
    } else {
      // If completed, reset indices first
      if (compareIndex1 >= compareVis1.steps.length && compareIndex2 >= compareVis2.steps.length) {
        compareIndex1 = 0;
        compareIndex2 = 0;
        compareVis1.visitedNodeIds.clear();
        compareVis1.traversedEdges = [];
        compareVis1.currentNodeId = null;
        compareVis1.edgeHighlight = null;
        compareVis1.distances = null;
        
        compareVis2.visitedNodeIds.clear();
        compareVis2.traversedEdges = [];
        compareVis2.currentNodeId = null;
        compareVis2.edgeHighlight = null;
        compareVis2.distances = null;
      }
      
      isComparing = true;
      btnComparePlay.textContent = "Pause";
      compareStatusMsg.textContent = "Running comparative visualization...";
      runComparisonStep();
    }
  });

  btnCompareReset.addEventListener('click', () => {
    stopComparison();
    compareIndex1 = 0;
    compareIndex2 = 0;
    
    compareVis1.visitedNodeIds.clear();
    compareVis1.traversedEdges = [];
    compareVis1.currentNodeId = null;
    compareVis1.edgeHighlight = null;
    compareVis1.distances = null;
    compareVis1.draw();

    compareVis2.visitedNodeIds.clear();
    compareVis2.traversedEdges = [];
    compareVis2.currentNodeId = null;
    compareVis2.edgeHighlight = null;
    compareVis2.distances = null;
    compareVis2.draw();

    compareStatusMsg.textContent = "Reset. Ready to play.";
  });
});
