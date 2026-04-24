const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {
    const data = (req.body && req.body.data) || [];

    const validEdges = [];
    const invalidEntries = [];
    const duplicateEdges = [];
    const edgeSet = new Set();

    // ✅ STEP 1: Validate input
    data.forEach(item => {
        const trimmed = item.trim();
        const regex = /^[A-Z]->[A-Z]$/;

        if (!regex.test(trimmed) || trimmed[0] === trimmed[3]) {
            invalidEntries.push(item);
        } else if (edgeSet.has(trimmed)) {
            if (!duplicateEdges.includes(trimmed)) {
                duplicateEdges.push(trimmed);
            }
        } else {
            edgeSet.add(trimmed);
            validEdges.push(trimmed);
        }
    });

    // ✅ STEP 2: Build adjacency list
    const adj = {};
    const childSet = new Set();

    validEdges.forEach(edge => {
        const [p, c] = edge.split("->");

        if (!adj[p]) adj[p] = [];

        // multi-parent handling
        if (!childSet.has(c)) {
            adj[p].push(c);
            childSet.add(c);
        }
    });

    // collect all nodes
    const nodes = new Set();
    validEdges.forEach(e => {
        const [p, c] = e.split("->");
        nodes.add(p);
        nodes.add(c);
    });

    // ✅ STEP 3: Find roots
    let roots = [...nodes].filter(n => !childSet.has(n));

    // cycle-only case
    if (roots.length === 0 && nodes.size > 0) {
        roots = [[...nodes].sort()[0]];
    }

    // ✅ STEP 4: Build tree (recursive)
    function buildTree(node, visited = new Set()) {
        if (visited.has(node)) return null; // cycle detect
        visited.add(node);

        const result = {};
        if (!adj[node]) return result;

        adj[node].forEach(child => {
            const subtree = buildTree(child, new Set(visited));
            if (subtree === null) return; // skip cycle
            result[child] = subtree;
        });

        return result;
    }

    // ✅ STEP 5: Detect cycle (DFS)
    function hasCycle(node, visited = new Set(), stack = new Set()) {
        if (!adj[node]) return false;

        visited.add(node);
        stack.add(node);

        for (let child of adj[node]) {
            if (!visited.has(child)) {
                if (hasCycle(child, visited, stack)) return true;
            } else if (stack.has(child)) {
                return true;
            }
        }

        stack.delete(node);
        return false;
    }

    // ✅ STEP 6: Depth
    function getDepth(node) {
        if (!node || Object.keys(node).length === 0) return 1;

        let max = 0;
        for (let child in node) {
            max = Math.max(max, getDepth(node[child]));
        }
        return max + 1;
    }

    // ✅ STEP 7: Build hierarchies
    const hierarchies = [];
    let totalCycles = 0;

    roots.forEach(root => {
        if (hasCycle(root)) {
            totalCycles++;
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            const tree = {};
            tree[root] = buildTree(root);

            hierarchies.push({
                root,
                tree,
                depth: getDepth(tree[root])
            });
        }
    });

    // ✅ STEP 8: Summary
    let largestTree = "";
    let maxDepth = 0;

    hierarchies.forEach(h => {
        if (!h.has_cycle && h.depth > maxDepth) {
            maxDepth = h.depth;
            largestTree = h.root;
        }
    });

    res.json({
        user_id: "laxmipriyaTM_06102005", 
        email_id: "lm4647@srmist.edu.in",
        college_roll_number: "RA2311026050018",
        hierarchies,
        invalid_entries: invalidEntries,
        duplicate_edges: duplicateEdges,
        summary: {
            total_trees: hierarchies.filter(h => !h.has_cycle).length,
            total_cycles: totalCycles,
            largest_tree_root: largestTree
        }
    });
});

app.listen(3000, () => console.log("Server running on port 3000"));