#!/usr/bin/env node
/**
 * Part Geometry Generator for Land Cruiser 100 Parts Catalog
 * 
 * This script generates simplified wireframe geometries for individual parts
 * based on part names and categories. The output is a JSON file that can be
 * loaded by the web app to display individual part highlights.
 * 
 * Usage: node generate-part-geometries.js [--category=engine] [--output=parts-geometry.json]
 */

const fs = require('fs');
const path = require('path');

// Shape templates - simplified wireframe definitions
// Each shape is defined as an array of edges (pairs of 3D points)
const SHAPE_TEMPLATES = {
    // Basic box shape
    box: (w, h, d) => {
        const hw = w/2, hh = h/2, hd = d/2;
        return {
            type: 'box',
            vertices: [
                [-hw,-hh,-hd], [hw,-hh,-hd], [hw,-hh,hd], [-hw,-hh,hd],
                [-hw,hh,-hd], [hw,hh,-hd], [hw,hh,hd], [-hw,hh,hd]
            ],
            edges: [
                [0,1],[1,2],[2,3],[3,0], // bottom
                [4,5],[5,6],[6,7],[7,4], // top
                [0,4],[1,5],[2,6],[3,7]  // verticals
            ]
        };
    },
    
    // Cylinder shape
    cylinder: (r, h, segments = 12) => {
        const vertices = [];
        const edges = [];
        const hh = h/2;
        
        // Bottom and top circles
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            vertices.push([x, -hh, z]); // bottom
            vertices.push([x, hh, z]);  // top
        }
        
        // Connect edges
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            edges.push([i*2, next*2]);       // bottom circle
            edges.push([i*2+1, next*2+1]);   // top circle
            edges.push([i*2, i*2+1]);        // vertical
        }
        
        return { type: 'cylinder', vertices, edges };
    },
    
    // Ring/washer shape
    ring: (outerR, innerR, h, segments = 12) => {
        const vertices = [];
        const edges = [];
        const hh = h/2;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const ox = Math.cos(angle) * outerR;
            const oz = Math.sin(angle) * outerR;
            const ix = Math.cos(angle) * innerR;
            const iz = Math.sin(angle) * innerR;
            
            // Outer bottom, outer top, inner bottom, inner top
            vertices.push([ox, -hh, oz]);
            vertices.push([ox, hh, oz]);
            vertices.push([ix, -hh, iz]);
            vertices.push([ix, hh, iz]);
        }
        
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const b = i * 4;
            const nb = next * 4;
            edges.push([b, nb]);       // outer bottom
            edges.push([b+1, nb+1]);   // outer top
            edges.push([b+2, nb+2]);   // inner bottom
            edges.push([b+3, nb+3]);   // inner top
            edges.push([b, b+1]);      // outer vertical
            edges.push([b+2, b+3]);    // inner vertical
        }
        
        return { type: 'ring', vertices, edges };
    },
    
    // Flat plate/gasket
    plate: (w, d, h = 0.02) => {
        return SHAPE_TEMPLATES.box(w, h, d);
    },
    
    // Bolt shape (cylinder with hex head)
    bolt: (shaftR, shaftH, headR, headH) => {
        const shaft = SHAPE_TEMPLATES.cylinder(shaftR, shaftH, 8);
        const head = SHAPE_TEMPLATES.cylinder(headR, headH, 6);
        
        // Offset head vertices
        const shaftTop = shaftH / 2;
        const headOffset = shaftTop + headH / 2;
        head.vertices = head.vertices.map(v => [v[0], v[1] + headOffset, v[2]]);
        
        // Combine
        const headEdgeOffset = shaft.vertices.length;
        return {
            type: 'bolt',
            vertices: [...shaft.vertices, ...head.vertices],
            edges: [...shaft.edges, ...head.edges.map(e => [e[0] + headEdgeOffset, e[1] + headEdgeOffset])]
        };
    },
    
    // Pipe/tube shape
    pipe: (outerR, innerR, length, segments = 12) => {
        return SHAPE_TEMPLATES.ring(outerR, innerR, length, segments);
    },
    
    // L-bracket shape
    bracket: (w, h, d, thickness) => {
        const t = thickness;
        const vertices = [
            // Vertical part
            [0, 0, 0], [t, 0, 0], [t, h, 0], [0, h, 0],
            [0, 0, d], [t, 0, d], [t, h, d], [0, h, d],
            // Horizontal part
            [t, 0, 0], [w, 0, 0], [w, t, 0], [t, t, 0],
            [t, 0, d], [w, 0, d], [w, t, d], [t, t, d]
        ];
        const edges = [
            // Vertical part
            [0,1],[1,2],[2,3],[3,0],
            [4,5],[5,6],[6,7],[7,4],
            [0,4],[1,5],[2,6],[3,7],
            // Horizontal part
            [8,9],[9,10],[10,11],[11,8],
            [12,13],[13,14],[14,15],[15,12],
            [8,12],[9,13],[10,14],[11,15]
        ];
        return { type: 'bracket', vertices, edges };
    },
    
    // Spring coil
    spring: (r, h, coils = 5, segments = 8) => {
        const vertices = [];
        const edges = [];
        const totalPoints = coils * segments;
        
        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const angle = t * coils * Math.PI * 2;
            const y = (t - 0.5) * h;
            vertices.push([Math.cos(angle) * r, y, Math.sin(angle) * r]);
            if (i > 0) edges.push([i-1, i]);
        }
        
        return { type: 'spring', vertices, edges };
    },
    
    // Generic sphere approximation
    sphere: (r, segments = 8) => {
        const vertices = [];
        const edges = [];
        
        // Latitude circles
        for (let lat = 1; lat < segments; lat++) {
            const phi = (lat / segments) * Math.PI;
            const y = Math.cos(phi) * r;
            const ringR = Math.sin(phi) * r;
            
            for (let lon = 0; lon < segments; lon++) {
                const theta = (lon / segments) * Math.PI * 2;
                vertices.push([Math.cos(theta) * ringR, y, Math.sin(theta) * ringR]);
            }
        }
        
        // Add poles
        vertices.push([0, r, 0]);  // top
        vertices.push([0, -r, 0]); // bottom
        
        // Connect latitude rings
        for (let lat = 0; lat < segments - 2; lat++) {
            for (let lon = 0; lon < segments; lon++) {
                const curr = lat * segments + lon;
                const next = lat * segments + ((lon + 1) % segments);
                const below = (lat + 1) * segments + lon;
                edges.push([curr, next]);
                edges.push([curr, below]);
            }
        }
        
        // Connect to poles
        const topPole = vertices.length - 2;
        const bottomPole = vertices.length - 1;
        for (let lon = 0; lon < segments; lon++) {
            edges.push([topPole, lon]);
            edges.push([bottomPole, (segments - 2) * segments + lon]);
        }
        
        return { type: 'sphere', vertices, edges };
    }
};

// Part name patterns to shape mappings
const SHAPE_PATTERNS = [
    // Gaskets and seals - flat
    { pattern: /gasket|seal|packing|shim/i, shape: 'plate', params: [0.15, 0.15, 0.005] },
    
    // Bearings - rings
    { pattern: /bearing/i, shape: 'ring', params: [0.04, 0.02, 0.02] },
    
    // Bolts and screws
    { pattern: /bolt|screw/i, shape: 'bolt', params: [0.008, 0.04, 0.012, 0.01] },
    
    // Nuts
    { pattern: /nut(?!.*donut)/i, shape: 'cylinder', params: [0.012, 0.01, 6] },
    
    // Washers
    { pattern: /washer/i, shape: 'ring', params: [0.015, 0.006, 0.003] },
    
    // Springs
    { pattern: /spring/i, shape: 'spring', params: [0.03, 0.08, 6] },
    
    // Pipes and tubes
    { pattern: /pipe|tube|hose/i, shape: 'pipe', params: [0.025, 0.02, 0.2] },
    
    // Filters
    { pattern: /filter/i, shape: 'cylinder', params: [0.06, 0.12] },
    
    // Pumps
    { pattern: /pump/i, shape: 'box', params: [0.12, 0.1, 0.08] },
    
    // Sensors
    { pattern: /sensor/i, shape: 'cylinder', params: [0.015, 0.04] },
    
    // Brackets and mounts
    { pattern: /bracket|mount|stay/i, shape: 'bracket', params: [0.08, 0.06, 0.03, 0.008] },
    
    // Covers and housings
    { pattern: /cover|housing|case/i, shape: 'box', params: [0.15, 0.08, 0.12] },
    
    // Rotors and discs
    { pattern: /rotor|disc|disk/i, shape: 'ring', params: [0.15, 0.08, 0.025] },
    
    // Pads
    { pattern: /pad/i, shape: 'plate', params: [0.08, 0.05, 0.015] },
    
    // Pistons
    { pattern: /piston/i, shape: 'cylinder', params: [0.045, 0.06] },
    
    // Valves
    { pattern: /valve/i, shape: 'cylinder', params: [0.015, 0.08] },
    
    // Gears
    { pattern: /gear/i, shape: 'cylinder', params: [0.06, 0.03, 24] },
    
    // Shafts
    { pattern: /shaft/i, shape: 'cylinder', params: [0.025, 0.3] },
    
    // Bushings
    { pattern: /bush|bushing/i, shape: 'ring', params: [0.025, 0.015, 0.04] },
    
    // O-rings
    { pattern: /o-ring|o ring/i, shape: 'ring', params: [0.03, 0.025, 0.004] },
    
    // Clips and clamps
    { pattern: /clip|clamp/i, shape: 'box', params: [0.03, 0.015, 0.02] },
    
    // Belts
    { pattern: /belt/i, shape: 'ring', params: [0.08, 0.075, 0.015] },
    
    // Pulleys
    { pattern: /pulley/i, shape: 'ring', params: [0.06, 0.02, 0.025] },
    
    // Connectors
    { pattern: /connector/i, shape: 'box', params: [0.04, 0.02, 0.025] },
    
    // Cables and wires
    { pattern: /cable|wire/i, shape: 'cylinder', params: [0.005, 0.3, 8] },
    
    // Tanks and reservoirs
    { pattern: /tank|reservoir/i, shape: 'box', params: [0.25, 0.15, 0.2] },
    
    // Radiators
    { pattern: /radiator/i, shape: 'box', params: [0.4, 0.35, 0.04] },
    
    // Default - small box
    { pattern: /./, shape: 'box', params: [0.08, 0.05, 0.06] }
];

/**
 * Determine shape for a part based on its name
 */
function classifyPart(partName) {
    const name = partName.toLowerCase();
    
    for (const rule of SHAPE_PATTERNS) {
        if (rule.pattern.test(name)) {
            return {
                shape: rule.shape,
                params: rule.params
            };
        }
    }
    
    // Default fallback
    return { shape: 'box', params: [0.05, 0.04, 0.03] };
}

/**
 * Generate geometry for a single part
 */
function generatePartGeometry(part) {
    const classification = classifyPart(part.name);
    const shapeFunc = SHAPE_TEMPLATES[classification.shape];
    
    if (!shapeFunc) {
        console.warn(`Unknown shape: ${classification.shape}`);
        return null;
    }
    
    const geometry = shapeFunc(...classification.params);
    
    return {
        partNumber: part.number,
        partName: part.name,
        category: part.category,
        shapeType: classification.shape,
        geometry: geometry
    };
}

/**
 * Load parts data from the parts-data.js file
 */
function loadPartsData() {
    const partsFile = path.join(__dirname, '..', 'parts-data.js');
    const content = fs.readFileSync(partsFile, 'utf8');
    
    // Extract the PARTS_DATABASE object
    const match = content.match(/const PARTS_DATABASE = (\{[\s\S]*?\});/);
    if (!match) {
        throw new Error('Could not parse parts-data.js');
    }
    
    // Evaluate the object (safe since we control the file)
    const partsDb = eval('(' + match[1] + ')');
    
    // Flatten into array
    const parts = [];
    for (const [category, categoryData] of Object.entries(partsDb)) {
        if (categoryData.parts) {
            for (const part of categoryData.parts) {
                parts.push({
                    ...part,
                    category: category
                });
            }
        }
    }
    
    return parts;
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);
    const options = {
        category: null,
        output: 'parts-geometry.json',
        limit: null
    };
    
    // Parse arguments
    for (const arg of args) {
        if (arg.startsWith('--category=')) {
            options.category = arg.split('=')[1];
        } else if (arg.startsWith('--output=')) {
            options.output = arg.split('=')[1];
        } else if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1]);
        }
    }
    
    console.log('Loading parts data...');
    let parts = loadPartsData();
    console.log(`Loaded ${parts.length} parts`);
    
    // Filter by category if specified
    if (options.category) {
        parts = parts.filter(p => p.category === options.category);
        console.log(`Filtered to ${parts.length} parts in category: ${options.category}`);
    }
    
    // Limit if specified
    if (options.limit) {
        parts = parts.slice(0, options.limit);
        console.log(`Limited to ${parts.length} parts`);
    }
    
    console.log('Generating geometries...');
    const geometries = [];
    let processed = 0;
    
    for (const part of parts) {
        const geom = generatePartGeometry(part);
        if (geom) {
            geometries.push(geom);
        }
        processed++;
        if (processed % 100 === 0) {
            console.log(`  Processed ${processed}/${parts.length}`);
        }
    }
    
    console.log(`Generated ${geometries.length} geometries`);
    
    // Write output
    const outputPath = path.join(__dirname, '..', options.output);
    fs.writeFileSync(outputPath, JSON.stringify(geometries, null, 2));
    console.log(`Written to ${outputPath}`);
    
    // Print summary by shape type
    const shapeCounts = {};
    for (const g of geometries) {
        shapeCounts[g.shapeType] = (shapeCounts[g.shapeType] || 0) + 1;
    }
    console.log('\nShape distribution:');
    for (const [shape, count] of Object.entries(shapeCounts).sort((a,b) => b[1] - a[1])) {
        console.log(`  ${shape}: ${count}`);
    }
}

main();
