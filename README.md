# AlgoArena: Interactive Graph Algorithm Visualizer & Comparator

AlgoArena is a web-based interactive graph playground, visualizer, and benchmarking platform. Built using vanilla HTML5, CSS3, and ES6+ JavaScript, it lets you construct custom graph structures dynamically, animate pathfinding and traversal algorithms step-by-step, and benchmark algorithm performance side-by-side.

---

## Features

1.  **Graph Construction**:
    *   **Add Nodes**: Click anywhere on the empty canvas (in Add Node mode) to spawn sequential nodes.
    *   **Add Weighted Edges**: Click on a source node and then a target node. A custom pop-up dialog will prompt you to enter the edge weight (supports negative values).
    *   **Delete Nodes**: Click on any node to select it, then click the **Delete Selected** button in the sidebar to delete the node and all connected edges.
    *   **Drag & Drop**: Click and drag nodes on the canvas to reposition them.
    *   **Clear Graph**: Click **Clear Canvas** to wipe out the nodes and edges.
2.  **Algorithm Visualizations**:
    *   Animate **5 essential graph algorithms**:
        *   **Breadth-First Search (BFS)** (Queue-based traversal)
        *   **Depth-First Search (DFS)** (Stack/recursion-based traversal)
        *   **Dijkstra's Algorithm** (Single-source shortest path, non-negative weights)
        *   **Bellman-Ford Algorithm** (Single-source shortest path, handles negative weights & cycles)
        *   **Kruskal's Algorithm** (Minimum Spanning Tree construction)
    *   Interactive starting node selection (defaults to Node 1 if none selected).
    *   Step-by-step traversal animations. Visited nodes light up in **orange**, and current nodes are marked in indigo.
    *   Interactive **Speed Slider** (100ms to 2000ms delay per step).
3.  **Benchmarking & Comparison Module**:
    *   Select two algorithms and click **Compare Traversals**.
    *   A split-screen comparison window opens with dual synchronized canvases displaying your custom graph.
    *   Both algorithms execute in real-time side-by-side.
    *   Compares the **traversal path sequence**, **total node visitation count**, and the **actual CPU execution runtime** measured in milliseconds using high-precision performance timers (`performance.now()`).

---

## File Structure

```
algo-arena/
├── index.html       # Application entry point and layout
├── style.css        # Premium dark neon glassmorphism stylesheet
└── js/
    ├── graph.js       # Core graph representation (nodes, weighted edges, additions, deletions, copy/clone)
    ├── algorithms.js  # Clean implementations of BFS, DFS, Dijkstra, Bellman-Ford, and Kruskal
    ├── visualizer.js  # Canvas rendering, mouse handlers, rubber bands, dragging, animation loop
    └── comparator.js  # UI controller, events binder, dual synchronization comparison player
```

---

## How to Run
Click on the link: https://niajituts.github.io/AlgoArena-Interactive-Graph-Visualizer/
