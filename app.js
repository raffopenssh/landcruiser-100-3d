// Toyota Land Cruiser J70 - Technical Blueprint Visualization
// Wireframe/Line Drawing Style

class LandCruiserBlueprint {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.parts = {};
        this.isExploded = false;
        this.isRotating = false;
        this.isOrtho = false;
        this.selectedPart = null;
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        
        // Blueprint colors
        this.colors = {
            primary: 0x4a9eff,
            secondary: 0x2a6ecc,
            dim: 0x1a4a88,
            highlight: 0x88ccff,
            accent: 0x00ffaa
        };
        
        this.init();
        this.createScene();
        this.createVehicle();
        this.setupEventListeners();
        this.animate();
        
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1000);
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Perspective Camera
        this.perspCamera = new THREE.PerspectiveCamera(
            35,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.perspCamera.position.set(12, 8, 16);
        
        // Orthographic Camera
        const aspect = window.innerWidth / window.innerHeight;
        const frustum = 8;
        this.orthoCamera = new THREE.OrthographicCamera(
            -frustum * aspect, frustum * aspect,
            frustum, -frustum,
            0.1, 1000
        );
        this.orthoCamera.position.set(12, 8, 16);
        
        this.camera = this.perspCamera;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0a1628, 1);
        this.container.appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 40;
        this.controls.target.set(0, 1, 0);
    }
    
    createScene() {
        // Ambient light for slight visibility
        const ambient = new THREE.AmbientLight(0x4a9eff, 0.3);
        this.scene.add(ambient);
        
        // Ground grid - blueprint style
        this.createBlueprintGrid();
        
        // Reference axes
        this.createAxes();
    }
    
    createBlueprintGrid() {
        const gridGroup = new THREE.Group();
        
        // Main grid
        const gridSize = 30;
        const gridDivisions = 30;
        const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x1a4a88, 0x0d2844);
        grid.position.y = 0;
        gridGroup.add(grid);
        
        // Center cross
        const crossMat = new THREE.LineBasicMaterial({ color: 0x2a6ecc, transparent: true, opacity: 0.5 });
        const crossGeo1 = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-15, 0.01, 0),
            new THREE.Vector3(15, 0.01, 0)
        ]);
        const crossGeo2 = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.01, -15),
            new THREE.Vector3(0, 0.01, 15)
        ]);
        gridGroup.add(new THREE.Line(crossGeo1, crossMat));
        gridGroup.add(new THREE.Line(crossGeo2, crossMat));
        
        this.scene.add(gridGroup);
    }
    
    createAxes() {
        const axesGroup = new THREE.Group();
        const length = 2;
        
        // X axis (red-ish)
        const xMat = new THREE.LineBasicMaterial({ color: 0xff4444 });
        const xGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.01, 0),
            new THREE.Vector3(length, 0.01, 0)
        ]);
        axesGroup.add(new THREE.Line(xGeo, xMat));
        
        // Y axis (green-ish)
        const yMat = new THREE.LineBasicMaterial({ color: 0x44ff44 });
        const yGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, length, 0)
        ]);
        axesGroup.add(new THREE.Line(yGeo, yMat));
        
        // Z axis (blue)
        const zMat = new THREE.LineBasicMaterial({ color: 0x4a9eff });
        const zGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.01, 0),
            new THREE.Vector3(0, 0.01, length)
        ]);
        axesGroup.add(new THREE.Line(zGeo, zMat));
        
        axesGroup.position.set(-6, 0, -6);
        this.scene.add(axesGroup);
    }
    
    // Create wireframe material
    createWireMaterial(color = this.colors.primary, opacity = 1) {
        return new THREE.LineBasicMaterial({ 
            color: color,
            transparent: opacity < 1,
            opacity: opacity
        });
    }
    
    // Create edges from geometry
    createEdges(geometry, material) {
        const edges = new THREE.EdgesGeometry(geometry, 15);
        return new THREE.LineSegments(edges, material);
    }
    
    // Create wireframe box
    createWireBox(width, height, depth, color = this.colors.primary) {
        const geo = new THREE.BoxGeometry(width, height, depth);
        const edges = this.createEdges(geo, this.createWireMaterial(color));
        geo.dispose();
        return edges;
    }
    
    // Create wireframe cylinder
    createWireCylinder(radiusTop, radiusBottom, height, segments = 16, color = this.colors.primary) {
        const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
        const edges = this.createEdges(geo, this.createWireMaterial(color));
        geo.dispose();
        return edges;
    }
    
    // Create line between two points
    createLine(start, end, color = this.colors.primary) {
        const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
        return new THREE.Line(geo, this.createWireMaterial(color));
    }

    createVehicle() {
        this.vehicleGroup = new THREE.Group();
        
        this.createChassis();
        this.createBody();
        this.createEngine();
        this.createTransmission();
        this.createFrontAxle();
        this.createRearAxle();
        this.createSteering();
        this.createBrakes();
        this.createWheels();
        this.createInterior();
        this.createExhaust();
        this.createFuelTank();
        this.createDriveshafts();
        this.createCooling();
        
        this.scene.add(this.vehicleGroup);
    }
    
    createChassis() {
        const chassis = new THREE.Group();
        chassis.userData = { name: 'chassis', originalPosition: new THREE.Vector3(0, 0.4, 0) };
        
        const color = this.colors.primary;
        
        // Main ladder frame rails (extended for longer wheelbase)
        const frontX = 2.6;
        const rearX = -2.6;
        const railW = 0.45;
        
        // Bottom rails
        chassis.add(this.createLine(
            new THREE.Vector3(rearX, 0, -railW),
            new THREE.Vector3(frontX, 0, -railW),
            color
        ));
        chassis.add(this.createLine(
            new THREE.Vector3(rearX, 0, railW),
            new THREE.Vector3(frontX, 0, railW),
            color
        ));
        
        // Top rails
        chassis.add(this.createLine(
            new THREE.Vector3(rearX, 0.18, -railW),
            new THREE.Vector3(frontX, 0.18, -railW),
            color
        ));
        chassis.add(this.createLine(
            new THREE.Vector3(rearX, 0.18, railW),
            new THREE.Vector3(frontX, 0.18, railW),
            color
        ));
        
        // Frame side walls
        [-railW, railW].forEach(z => {
            [rearX, -1.8, -0.8, 0.2, 1.2, 1.8, frontX].forEach(x => {
                chassis.add(this.createLine(
                    new THREE.Vector3(x, 0, z),
                    new THREE.Vector3(x, 0.18, z),
                    this.colors.dim
                ));
            });
        });
        
        // Cross members
        [-2.3, -1.8, -1.0, 0, 1.0, 1.8, 2.3].forEach(x => {
            chassis.add(this.createLine(
                new THREE.Vector3(x, 0.09, -railW),
                new THREE.Vector3(x, 0.09, railW),
                this.colors.secondary
            ));
        });
        
        // Front cross member (boxed)
        const frontBox = this.createWireBox(0.2, 0.22, 1.0, this.colors.secondary);
        frontBox.position.set(frontX, 0.11, 0);
        chassis.add(frontBox);
        
        // Rear cross member
        const rearBox = this.createWireBox(0.2, 0.22, 0.9, this.colors.secondary);
        rearBox.position.set(rearX, 0.11, 0);
        chassis.add(rearBox);
        
        chassis.position.copy(chassis.userData.originalPosition);
        this.parts.chassis = chassis;
        this.vehicleGroup.add(chassis);
    }
    
    createBody() {
        const body = new THREE.Group();
        body.userData = { name: 'body', originalPosition: new THREE.Vector3(0, 0.8, 0) };
        
        const color = this.colors.primary;
        const W = 0.97; // Half width - LC100 is wider
        
        // LC100 proportions - curved SUV styling
        // Real dimensions: ~4.9m long, ~1.94m wide, ~1.87m tall
        // Wheelbase: 2850mm, Ground clearance: 220mm
        
        // === SIDE PROFILE - Left side ===
        const bodyBottom = 0.15;  // Lower sill line than J70
        const beltLine = 0.95;    // Character line height
        const hoodTop = 1.05;     // Hood height (lower than J70)
        const roofTop = 1.75;     // Roof height
        const cowlX = 0.6;        // Windshield base
        
        // LC100 has curved lines - simulate with more points
        const sideLeft = [
            // Lower body line with wheel arch cutouts
            [-2.4, bodyBottom, -W],
            [-1.2, bodyBottom, -W],  // Rear wheel arch start
            [-1.0, bodyBottom + 0.1, -W],  // Arch rise
            [-0.6, bodyBottom, -W],  // Between arches
            [1.2, bodyBottom, -W],   // Front wheel arch start
            [1.4, bodyBottom + 0.1, -W],  // Arch rise
            [2.5, bodyBottom, -W],   // Front end
            // Front bumper/fascia (curved)
            [2.6, 0.35, -W],
            [2.55, 0.55, -W],        // Lower grille
            [2.5, hoodTop, -W],      // Hood front edge
            // Hood (slopes down toward cowl)
            [cowlX, hoodTop - 0.1, -W],
            // Windshield (more raked than J70)
            [-0.1, roofTop - 0.05, -W],   // Windshield top
            // Roof (slight curve)
            [-1.6, roofTop, -W],     // Roof peak
            // Rear glass and tailgate
            [-2.2, roofTop - 0.15, -W],
            [-2.45, 0.8, -W],        // Tailgate
            [-2.45, bodyBottom, -W]  // Back to start
        ];
        
        for (let i = 0; i < sideLeft.length - 1; i++) {
            body.add(this.createLine(
                new THREE.Vector3(...sideLeft[i]),
                new THREE.Vector3(...sideLeft[i + 1]),
                color
            ));
        }
        
        // Right side (mirror)
        const sideRight = sideLeft.map(p => [p[0], p[1], W]);
        for (let i = 0; i < sideRight.length - 1; i++) {
            body.add(this.createLine(
                new THREE.Vector3(...sideRight[i]),
                new THREE.Vector3(...sideRight[i + 1]),
                color
            ));
        }
        
        // === CROSS CONNECTIONS ===
        // Bumper bottom
        body.add(this.createLine(new THREE.Vector3(2.5, bodyBottom, -W), new THREE.Vector3(2.5, bodyBottom, W), color));
        body.add(this.createLine(new THREE.Vector3(2.6, 0.35, -W), new THREE.Vector3(2.6, 0.35, W), color));
        // Hood front
        body.add(this.createLine(new THREE.Vector3(2.5, hoodTop, -W), new THREE.Vector3(2.5, hoodTop, W), color));
        // Cowl
        body.add(this.createLine(new THREE.Vector3(cowlX, hoodTop - 0.1, -W), new THREE.Vector3(cowlX, hoodTop - 0.1, W), color));
        // Windshield top
        body.add(this.createLine(new THREE.Vector3(-0.1, roofTop - 0.05, -W), new THREE.Vector3(-0.1, roofTop - 0.05, W), color));
        // Roof
        body.add(this.createLine(new THREE.Vector3(-1.6, roofTop, -W), new THREE.Vector3(-1.6, roofTop, W), color));
        // Rear glass top
        body.add(this.createLine(new THREE.Vector3(-2.2, roofTop - 0.15, -W), new THREE.Vector3(-2.2, roofTop - 0.15, W), color));
        // Tailgate
        body.add(this.createLine(new THREE.Vector3(-2.45, bodyBottom, -W), new THREE.Vector3(-2.45, bodyBottom, W), color));
        body.add(this.createLine(new THREE.Vector3(-2.45, 0.8, -W), new THREE.Vector3(-2.45, 0.8, W), color));
        
        // === LC100 GRILLE (large chrome grille with horizontal bars) ===
        const grilleLeft = -0.45;
        const grilleRight = 0.45;
        const grilleBottom = 0.55;
        const grilleTop = hoodTop - 0.02;
        
        // Grille outer frame
        body.add(this.createLine(new THREE.Vector3(2.55, grilleBottom, grilleLeft), new THREE.Vector3(2.55, grilleBottom, grilleRight), color));
        body.add(this.createLine(new THREE.Vector3(2.52, grilleTop, grilleLeft - 0.1), new THREE.Vector3(2.52, grilleTop, grilleRight + 0.1), color));
        body.add(this.createLine(new THREE.Vector3(2.55, grilleBottom, grilleLeft), new THREE.Vector3(2.52, grilleTop, grilleLeft - 0.1), color));
        body.add(this.createLine(new THREE.Vector3(2.55, grilleBottom, grilleRight), new THREE.Vector3(2.52, grilleTop, grilleRight + 0.1), color));
        
        // Horizontal grille bars (3 main bars LC100 style)
        [0.62, 0.72, 0.82, 0.92].forEach(y => {
            body.add(this.createLine(
                new THREE.Vector3(2.54, y, grilleLeft + 0.05),
                new THREE.Vector3(2.54, y, grilleRight - 0.05),
                this.colors.secondary
            ));
        });
        
        // Toyota emblem area (center)
        const emblem = this.createWireCylinder(0.1, 0.1, 0.02, 16, this.colors.accent);
        emblem.rotation.z = Math.PI / 2;
        emblem.position.set(2.56, 0.77, 0);
        body.add(emblem);
        
        // === HEADLIGHTS (LC100 rectangular with rounded corners) ===
        [-0.7, 0.7].forEach(z => {
            // Main headlight housing
            const headlight = this.createWireBox(0.1, 0.22, 0.3, color);
            headlight.position.set(2.52, 0.75, z);
            body.add(headlight);
            
            // Inner projector
            const projector = this.createWireCylinder(0.06, 0.06, 0.04, 12, this.colors.accent);
            projector.rotation.z = Math.PI / 2;
            projector.position.set(2.54, 0.75, z);
            body.add(projector);
            
            // Turn signal (wraparound to side)
            body.add(this.createLine(
                new THREE.Vector3(2.52, 0.62, z > 0 ? z + 0.15 : z - 0.15),
                new THREE.Vector3(2.4, 0.62, z > 0 ? z + 0.2 : z - 0.2),
                this.colors.accent
            ));
        });
        
        // Fog lights (lower bumper)
        [-0.35, 0.35].forEach(z => {
            const fog = this.createWireCylinder(0.06, 0.06, 0.03, 10, this.colors.dim);
            fog.rotation.z = Math.PI / 2;
            fog.position.set(2.58, 0.38, z);
            body.add(fog);
        });
        
        // === LC100 WINDSHIELD (more raked than J70) ===
        const wsBottom = hoodTop - 0.1;
        const wsTopY = roofTop - 0.05;
        const wsBaseX = cowlX;
        const wsTopX = -0.1;  // More rake
        
        // A-pillar lines
        body.add(this.createLine(
            new THREE.Vector3(wsBaseX, wsBottom, -0.88),
            new THREE.Vector3(wsTopX, wsTopY, -0.85),
            this.colors.secondary
        ));
        body.add(this.createLine(
            new THREE.Vector3(wsBaseX, wsBottom, 0.88),
            new THREE.Vector3(wsTopX, wsTopY, 0.85),
            this.colors.secondary
        ));
        
        // Windshield top edge
        body.add(this.createLine(
            new THREE.Vector3(wsTopX, wsTopY, -0.85),
            new THREE.Vector3(wsTopX, wsTopY, 0.85),
            color
        ));
        
        // === DOORS ===
        const doorBottom = bodyBottom + 0.08;
        const doorTop = roofTop - 0.12;
        const sillHeight = beltLine;  // Window sill at belt line
        
        // Front door
        body.add(this.createLine(new THREE.Vector3(0.15, doorBottom, -W), new THREE.Vector3(0.15, doorTop, -W), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(0.15, doorBottom, W), new THREE.Vector3(0.15, doorTop, W), this.colors.secondary));
        // Rear door
        body.add(this.createLine(new THREE.Vector3(-0.85, doorBottom, -W), new THREE.Vector3(-0.85, doorTop, -W), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(-0.85, doorBottom, W), new THREE.Vector3(-0.85, doorTop, W), this.colors.secondary));
        
        // Belt/character line (LC100 signature styling line)
        body.add(this.createLine(new THREE.Vector3(wsBaseX - 0.1, sillHeight, -W), new THREE.Vector3(-2.2, sillHeight, -W), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(wsBaseX - 0.1, sillHeight, W), new THREE.Vector3(-2.2, sillHeight, W), this.colors.secondary));
        
        // B-pillar
        body.add(this.createLine(new THREE.Vector3(0.15, sillHeight, -W), new THREE.Vector3(0.0, roofTop - 0.08, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(0.15, sillHeight, W), new THREE.Vector3(0.0, roofTop - 0.08, W), this.colors.dim));
        
        // C-pillar (LC100 has a thick C-pillar)
        body.add(this.createLine(new THREE.Vector3(-0.85, sillHeight, -W), new THREE.Vector3(-1.0, roofTop - 0.05, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-0.85, sillHeight, W), new THREE.Vector3(-1.0, roofTop - 0.05, W), this.colors.dim));
        
        // D-pillar (quarter panel)
        body.add(this.createLine(new THREE.Vector3(-1.5, sillHeight, -W), new THREE.Vector3(-1.6, roofTop, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.5, sillHeight, W), new THREE.Vector3(-1.6, roofTop, W), this.colors.dim));
        
        // === FENDER FLARES (boxy) ===
        // Front fenders
        const ffY = 0.35; // fender flare height
        [[-W - 0.08, -W], [W, W + 0.08]].forEach(([z1, z2]) => {
            body.add(this.createLine(new THREE.Vector3(2.3, ffY, z1), new THREE.Vector3(2.3, ffY, z2), this.colors.secondary));
            body.add(this.createLine(new THREE.Vector3(1.3, ffY, z1), new THREE.Vector3(1.3, ffY, z2), this.colors.secondary));
            body.add(this.createLine(new THREE.Vector3(2.3, ffY, z2), new THREE.Vector3(1.3, ffY, z2), this.colors.secondary));
        });
        
        // Rear fenders
        [[-W - 0.08, -W], [W, W + 0.08]].forEach(([z1, z2]) => {
            body.add(this.createLine(new THREE.Vector3(-1.3, ffY, z1), new THREE.Vector3(-1.3, ffY, z2), this.colors.secondary));
            body.add(this.createLine(new THREE.Vector3(-2.3, ffY, z1), new THREE.Vector3(-2.3, ffY, z2), this.colors.secondary));
            body.add(this.createLine(new THREE.Vector3(-1.3, ffY, z2), new THREE.Vector3(-2.3, ffY, z2), this.colors.secondary));
        });
        
        // === HOOD DETAILS ===
        // Hood bulge/air scoop outline
        body.add(this.createLine(new THREE.Vector3(2.4, 1.1, -0.25), new THREE.Vector3(1.3, 1.1, -0.25), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(2.4, 1.1, 0.25), new THREE.Vector3(1.3, 1.1, 0.25), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(2.4, 1.1, -0.25), new THREE.Vector3(2.4, 1.1, 0.25), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(1.3, 1.1, -0.25), new THREE.Vector3(1.3, 1.1, 0.25), this.colors.dim));
        
        // === SNORKEL (left A-pillar) ===
        body.add(this.createLine(new THREE.Vector3(0.85, 1.05, -W - 0.05), new THREE.Vector3(0.85, 1.9, -W - 0.05), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(0.75, 1.05, -W - 0.05), new THREE.Vector3(0.75, 1.9, -W - 0.05), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(0.75, 1.9, -W - 0.05), new THREE.Vector3(0.85, 1.9, -W - 0.05), this.colors.secondary));
        // Snorkel head
        const snorkelHead = this.createWireBox(0.12, 0.15, 0.08, this.colors.secondary);
        snorkelHead.position.set(0.8, 1.95, -W - 0.05);
        body.add(snorkelHead);
        
        // === SIDE MIRRORS ===
        [-W - 0.2, W + 0.2].forEach(z => {
            // Mirror arm
            body.add(this.createLine(
                new THREE.Vector3(0.6, 1.35, z > 0 ? W : -W),
                new THREE.Vector3(0.6, 1.35, z),
                this.colors.dim
            ));
            // Mirror head
            const mirror = this.createWireBox(0.08, 0.12, 0.06, this.colors.dim);
            mirror.position.set(0.6, 1.35, z);
            body.add(mirror);
        });
        
        // === REAR SECTION ===
        // Rear window
        body.add(this.createLine(new THREE.Vector3(-2.0, sillHeight + 0.1, -0.7), new THREE.Vector3(-2.0, roofTop - 0.2, -0.7), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-2.0, sillHeight + 0.1, 0.7), new THREE.Vector3(-2.0, roofTop - 0.2, 0.7), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-2.0, sillHeight + 0.1, -0.7), new THREE.Vector3(-2.0, sillHeight + 0.1, 0.7), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-2.0, roofTop - 0.2, -0.7), new THREE.Vector3(-2.0, roofTop - 0.2, 0.7), this.colors.dim));
        
        // Tail lights (vertical rectangles)
        [-0.75, 0.75].forEach(z => {
            const taillight = this.createWireBox(0.04, 0.3, 0.12, this.colors.accent);
            taillight.position.set(-2.52, 0.9, z);
            body.add(taillight);
        });
        
        // === ROOF RACK ===
        const rackY = roofTop + 0.08;
        const rackCorners = [
            [-1.8, rackY, -0.75],
            [0.5, rackY, -0.75],
            [0.5, rackY, 0.75],
            [-1.8, rackY, 0.75]
        ];
        for (let i = 0; i < 4; i++) {
            const next = (i + 1) % 4;
            body.add(this.createLine(
                new THREE.Vector3(...rackCorners[i]),
                new THREE.Vector3(...rackCorners[next]),
                this.colors.secondary
            ));
        }
        
        // Roof rack cross bars
        [-1.5, -0.8, -0.1, 0.3].forEach(x => {
            body.add(this.createLine(
                new THREE.Vector3(x, rackY, -0.75),
                new THREE.Vector3(x, rackY, 0.75),
                this.colors.dim
            ));
        });
        
        // Roof rack rails (side)
        body.add(this.createLine(new THREE.Vector3(-1.8, roofTop, -0.8), new THREE.Vector3(-1.8, rackY, -0.75), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.8, roofTop, 0.8), new THREE.Vector3(-1.8, rackY, 0.75), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(0.1, roofTop, -0.8), new THREE.Vector3(0.1, rackY, -0.75), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(0.1, roofTop, 0.8), new THREE.Vector3(0.1, rackY, 0.75), this.colors.dim));
        
        // === REAR BUMPER ===
        body.add(this.createLine(new THREE.Vector3(-2.55, 0.25, -0.8), new THREE.Vector3(-2.55, 0.25, 0.8), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(-2.55, 0.45, -0.8), new THREE.Vector3(-2.55, 0.45, 0.8), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(-2.55, 0.25, -0.8), new THREE.Vector3(-2.55, 0.45, -0.8), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(-2.55, 0.25, 0.8), new THREE.Vector3(-2.55, 0.45, 0.8), this.colors.secondary));
        
        // === SPARE TIRE (rear door mounted) ===
        const spare = this.createWireCylinder(0.38, 0.38, 0.22, 24, color);
        spare.rotation.z = Math.PI / 2;
        spare.position.set(-2.7, 0.85, 0);
        body.add(spare);
        
        // Spare tire inner
        const spareInner = this.createWireCylinder(0.25, 0.25, 0.22, 16, this.colors.dim);
        spareInner.rotation.z = Math.PI / 2;
        spareInner.position.set(-2.7, 0.85, 0);
        body.add(spareInner);
        
        // === FRONT BUMPER / BULL BAR ===
        // Main bar
        body.add(this.createLine(new THREE.Vector3(2.95, 0.5, -0.75), new THREE.Vector3(2.95, 0.5, 0.75), color));
        body.add(this.createLine(new THREE.Vector3(2.95, 0.7, -0.75), new THREE.Vector3(2.95, 0.7, 0.75), color));
        // Vertical supports
        body.add(this.createLine(new THREE.Vector3(2.95, 0.5, -0.75), new THREE.Vector3(2.95, 0.7, -0.75), color));
        body.add(this.createLine(new THREE.Vector3(2.95, 0.5, 0.75), new THREE.Vector3(2.95, 0.7, 0.75), color));
        body.add(this.createLine(new THREE.Vector3(2.95, 0.5, 0), new THREE.Vector3(2.95, 0.7, 0), color));
        // Bull bar connection to body
        body.add(this.createLine(new THREE.Vector3(2.8, 0.5, -0.7), new THREE.Vector3(2.95, 0.5, -0.75), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(2.8, 0.5, 0.7), new THREE.Vector3(2.95, 0.5, 0.75), this.colors.dim));
        
        body.position.copy(body.userData.originalPosition);
        this.parts.body = body;
        this.vehicleGroup.add(body);
    }

    createEngine() {
        const engine = new THREE.Group();
        engine.userData = { name: 'engine', originalPosition: new THREE.Vector3(2.0, 0.75, 0) };
        
        const color = this.colors.primary;
        
        // V8 engine block outline
        const block = this.createWireBox(0.7, 0.5, 0.6, color);
        block.position.set(0, 0, 0);
        engine.add(block);
        
        // Cylinder banks (V shape)
        const bankLeft = this.createWireBox(0.6, 0.15, 0.25, this.colors.secondary);
        bankLeft.position.set(0, 0.32, -0.2);
        bankLeft.rotation.x = 0.3;
        engine.add(bankLeft);
        
        const bankRight = this.createWireBox(0.6, 0.15, 0.25, this.colors.secondary);
        bankRight.position.set(0, 0.32, 0.2);
        bankRight.rotation.x = -0.3;
        engine.add(bankRight);
        
        // Valve covers
        const valveL = this.createWireBox(0.55, 0.08, 0.2, this.colors.accent);
        valveL.position.set(0, 0.42, -0.22);
        valveL.rotation.x = 0.3;
        engine.add(valveL);
        
        const valveR = this.createWireBox(0.55, 0.08, 0.2, this.colors.accent);
        valveR.position.set(0, 0.42, 0.22);
        valveR.rotation.x = -0.3;
        engine.add(valveR);
        
        // Intake manifold (center V)
        const intake = this.createWireBox(0.5, 0.15, 0.2, this.colors.secondary);
        intake.position.set(0, 0.45, 0);
        engine.add(intake);
        
        // Turbochargers
        const turboL = this.createWireCylinder(0.1, 0.1, 0.1, 12, this.colors.accent);
        turboL.position.set(0.4, 0.15, -0.35);
        engine.add(turboL);
        
        const turboR = this.createWireCylinder(0.1, 0.1, 0.1, 12, this.colors.accent);
        turboR.position.set(0.4, 0.15, 0.35);
        engine.add(turboR);
        
        // Oil pan
        const pan = this.createWireBox(0.6, 0.15, 0.5, this.colors.dim);
        pan.position.set(0, -0.32, 0);
        engine.add(pan);
        
        // Bellhousing mounting face
        const bellFace = this.createWireCylinder(0.25, 0.25, 0.05, 16, color);
        bellFace.rotation.z = Math.PI / 2;
        bellFace.position.set(-0.37, -0.05, 0);
        engine.add(bellFace);
        
        // Alternator
        const alternator = this.createWireCylinder(0.08, 0.08, 0.1, 12, this.colors.secondary);
        alternator.rotation.x = Math.PI / 2;
        alternator.position.set(-0.2, 0.1, 0.4);
        engine.add(alternator);
        
        // Radiator
        const radiator = this.createWireBox(0.08, 0.45, 0.7, this.colors.secondary);
        radiator.position.set(0.5, 0.05, 0);
        engine.add(radiator);
        
        engine.position.copy(engine.userData.originalPosition);
        this.parts.engine = engine;
        this.vehicleGroup.add(engine);
    }
    
    createTransmission() {
        const trans = new THREE.Group();
        trans.userData = { name: 'transmission', originalPosition: new THREE.Vector3(0.5, 0.55, 0) };
        
        const color = this.colors.primary;
        
        // Bell housing
        const bell = this.createWireCylinder(0.25, 0.3, 0.35, 12, color);
        bell.rotation.z = Math.PI / 2;
        bell.position.set(0.35, 0, 0);
        trans.add(bell);
        
        // Main gearbox case
        const mainCase = this.createWireBox(0.65, 0.35, 0.35, color);
        mainCase.position.set(-0.1, 0, 0);
        trans.add(mainCase);
        
        // Extension housing
        const extension = this.createWireCylinder(0.12, 0.15, 0.3, 12, this.colors.secondary);
        extension.rotation.z = Math.PI / 2;
        extension.position.set(-0.55, 0, 0);
        trans.add(extension);
        
        // Transfer case
        const transfer = this.createWireBox(0.4, 0.3, 0.35, color);
        transfer.position.set(-0.85, -0.05, 0);
        trans.add(transfer);
        
        // Output flanges
        const frontFlange = this.createWireCylinder(0.06, 0.06, 0.08, 8, this.colors.accent);
        frontFlange.rotation.z = Math.PI / 2;
        frontFlange.position.set(-0.65, 0.05, 0);
        trans.add(frontFlange);
        
        const rearFlange = this.createWireCylinder(0.06, 0.06, 0.08, 8, this.colors.accent);
        rearFlange.rotation.z = Math.PI / 2;
        rearFlange.position.set(-1.05, -0.05, 0);
        trans.add(rearFlange);
        
        // Shifter tower
        const shifter = this.createWireCylinder(0.05, 0.06, 0.15, 8, this.colors.secondary);
        shifter.position.set(-0.1, 0.25, 0);
        trans.add(shifter);
        
        trans.position.copy(trans.userData.originalPosition);
        this.parts.transmission = trans;
        this.vehicleGroup.add(trans);
    }
    
    createFrontAxle() {
        // LC100 has INDEPENDENT FRONT SUSPENSION (IFS) - double wishbone
        const ifs = new THREE.Group();
        ifs.userData = { name: 'front-axle', originalPosition: new THREE.Vector3(1.5, 0.5, 0) };
        
        const color = this.colors.primary;
        
        // Subframe / crossmember
        const subframe = this.createWireBox(0.6, 0.12, 1.5, color);
        subframe.position.set(0, 0, 0);
        ifs.add(subframe);
        
        // Front differential (center mounted)
        const diff = this.createWireCylinder(0.15, 0.15, 0.3, 16, color);
        diff.rotation.x = Math.PI / 2;
        diff.position.set(-0.1, -0.05, 0);
        ifs.add(diff);
        
        // Diff cover
        const cover = this.createWireCylinder(0.13, 0.13, 0.04, 16, this.colors.secondary);
        cover.rotation.z = Math.PI / 2;
        cover.position.set(-0.1, -0.05, 0.17);
        ifs.add(cover);
        
        // Per-side components
        [-0.75, 0.75].forEach(z => {
            const side = z > 0 ? 1 : -1;
            
            // Upper control arm (A-arm)
            ifs.add(this.createLine(new THREE.Vector3(-0.15, 0.1, z * 0.5), new THREE.Vector3(0.1, 0.05, z), color));
            ifs.add(this.createLine(new THREE.Vector3(0.15, 0.1, z * 0.5), new THREE.Vector3(0.1, 0.05, z), color));
            
            // Lower control arm (A-arm) - longer
            ifs.add(this.createLine(new THREE.Vector3(-0.2, -0.1, z * 0.4), new THREE.Vector3(0.05, -0.2, z), color));
            ifs.add(this.createLine(new THREE.Vector3(0.2, -0.1, z * 0.4), new THREE.Vector3(0.05, -0.2, z), color));
            
            // Steering knuckle / hub carrier
            const knuckle = this.createWireBox(0.1, 0.3, 0.1, this.colors.accent);
            knuckle.position.set(0.05, -0.08, z);
            ifs.add(knuckle);
            
            // CV axle shaft
            ifs.add(this.createLine(
                new THREE.Vector3(-0.1, -0.05, z * 0.2),
                new THREE.Vector3(0.05, -0.08, z),
                this.colors.secondary
            ));
            
            // CV joint boots
            const innerCV = this.createWireCylinder(0.05, 0.07, 0.08, 8, this.colors.dim);
            innerCV.rotation.x = Math.PI / 2 * side;
            innerCV.position.set(-0.08, -0.05, z * 0.25);
            ifs.add(innerCV);
            
            const outerCV = this.createWireCylinder(0.04, 0.06, 0.06, 8, this.colors.dim);
            outerCV.rotation.x = Math.PI / 2 * side;
            outerCV.position.set(0.03, -0.08, z * 0.9);
            ifs.add(outerCV);
            
            // Coil spring
            for (let i = 0; i < 7; i++) {
                const coil = this.createWireCylinder(0.07, 0.07, 0.02, 12, this.colors.secondary);
                coil.position.set(0.1, 0.08 + i * 0.05, z * 0.7);
                ifs.add(coil);
            }
            
            // Shock absorber (inside spring)
            const shock = this.createWireCylinder(0.03, 0.03, 0.3, 8, this.colors.dim);
            shock.position.set(0.1, 0.25, z * 0.7);
            ifs.add(shock);
            
            // Stabilizer bar connection
            ifs.add(this.createLine(
                new THREE.Vector3(0.2, -0.15, z * 0.6),
                new THREE.Vector3(0.2, 0.0, z * 0.6),
                this.colors.dim
            ));
        });
        
        // Stabilizer bar (sway bar)
        ifs.add(this.createLine(new THREE.Vector3(0.2, -0.15, -0.45), new THREE.Vector3(0.2, -0.15, 0.45), color));
        
        // Tie rod
        ifs.add(this.createLine(new THREE.Vector3(0.15, -0.12, -0.7), new THREE.Vector3(0.15, -0.12, 0.7), this.colors.secondary));
        
        ifs.position.copy(ifs.userData.originalPosition);
        this.parts['front-axle'] = ifs;
        this.vehicleGroup.add(ifs);
    }
    
    createRearAxle() {
        // LC100 rear: 4-link with coil springs (not leaf springs)
        const axle = new THREE.Group();
        axle.userData = { name: 'rear-axle', originalPosition: new THREE.Vector3(-1.5, 0.5, 0) };
        
        const color = this.colors.primary;
        const axleWidth = 1.65;
        
        // Axle housing tube
        const tube = this.createWireCylinder(0.1, 0.1, axleWidth, 12, color);
        tube.rotation.x = Math.PI / 2;
        axle.add(tube);
        
        // Differential housing (full-floating)
        const diff = this.createWireCylinder(0.2, 0.2, 0.25, 16, color);
        diff.rotation.z = Math.PI / 2;
        axle.add(diff);
        
        // Diff cover
        const cover = this.createWireCylinder(0.18, 0.18, 0.04, 16, this.colors.secondary);
        cover.rotation.z = Math.PI / 2;
        cover.position.x = 0.14;
        axle.add(cover);
        
        // Axle flanges / hubs
        [-axleWidth/2, axleWidth/2].forEach(z => {
            const flange = this.createWireCylinder(0.11, 0.11, 0.05, 12, this.colors.accent);
            flange.rotation.x = Math.PI / 2;
            flange.position.set(0, 0, z);
            axle.add(flange);
        });
        
        // 4-LINK SUSPENSION
        [-0.55, 0.55].forEach(z => {
            // Upper control arms (shorter, angled)
            axle.add(this.createLine(
                new THREE.Vector3(0, 0.12, z),
                new THREE.Vector3(0.6, 0.2, z * 0.6),
                color
            ));
            
            // Lower control arms (longer, trailing)
            axle.add(this.createLine(
                new THREE.Vector3(0, -0.08, z),
                new THREE.Vector3(0.8, -0.05, z * 0.7),
                color
            ));
            
            // Double wishbone
            for (let i = 0; i < 7; i++) {
                const coil = this.createWireCylinder(0.08, 0.08, 0.02, 12, this.colors.secondary);
                coil.position.set(0.15, 0.1 + i * 0.055, z);
                axle.add(coil);
            }
            
            // Shock absorbers
            const shock = this.createWireCylinder(0.035, 0.035, 0.35, 8, this.colors.dim);
            shock.position.set(0.2, 0.32, z * 0.8);
            shock.rotation.z = -0.1;
            axle.add(shock);
        });
        
        // Panhard rod (lateral locator)
        axle.add(this.createLine(
            new THREE.Vector3(0, 0.05, -0.7),
            new THREE.Vector3(-0.15, 0.12, 0.6),
            this.colors.secondary
        ));
        
        // Stabilizer bar
        axle.add(this.createLine(
            new THREE.Vector3(-0.1, -0.1, -0.5),
            new THREE.Vector3(-0.1, -0.1, 0.5),
            this.colors.dim
        ));
        
        // Brake lines
        axle.add(this.createLine(
            new THREE.Vector3(0, 0.08, 0),
            new THREE.Vector3(0.5, 0.15, 0),
            this.colors.dim
        ));
        
        axle.position.copy(axle.userData.originalPosition);
        this.parts['rear-axle'] = axle;
        this.vehicleGroup.add(axle);
    }

    createSteering() {
        const steering = new THREE.Group();
        steering.userData = { name: 'steering', originalPosition: new THREE.Vector3(1.3, 0.9, 0.35) };
        
        const color = this.colors.primary;
        
        // Steering box
        const box = this.createWireBox(0.15, 0.15, 0.12, color);
        box.position.set(0, -0.2, 0);
        steering.add(box);
        
        // Pitman arm
        steering.add(this.createLine(
            new THREE.Vector3(0, -0.28, 0.08),
            new THREE.Vector3(0, -0.4, 0.15),
            this.colors.secondary
        ));
        
        // Drag link
        steering.add(this.createLine(
            new THREE.Vector3(0, -0.4, 0.15),
            new THREE.Vector3(0.5, -0.35, 0.1),
            color
        ));
        
        // Tie rod
        steering.add(this.createLine(
            new THREE.Vector3(0.5, -0.35, -0.5),
            new THREE.Vector3(0.5, -0.35, 0.5),
            color
        ));
        
        // Tie rod ends
        [-0.5, 0.5].forEach(z => {
            const end = this.createWireCylinder(0.02, 0.025, 0.05, 8, this.colors.accent);
            end.position.set(0.5, -0.35, z);
            steering.add(end);
        });
        
        // Steering column
        const column = this.createWireCylinder(0.025, 0.025, 0.8, 8, color);
        column.rotation.z = -0.6;
        column.position.set(-0.25, 0.2, 0);
        steering.add(column);
        
        // Steering wheel
        const wheel = this.createWireCylinder(0.18, 0.18, 0.02, 24, color);
        wheel.rotation.x = 0.6;
        wheel.position.set(-0.55, 0.55, 0);
        steering.add(wheel);
        
        // Wheel center
        const center = this.createWireCylinder(0.05, 0.05, 0.03, 12, this.colors.secondary);
        center.rotation.x = 0.6;
        center.position.set(-0.55, 0.55, 0);
        steering.add(center);
        
        // Spokes
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const spoke = this.createLine(
                new THREE.Vector3(-0.55, 0.55, 0),
                new THREE.Vector3(
                    -0.55 + Math.cos(angle + 0.6) * 0.15,
                    0.55 + Math.sin(angle) * 0.15 * Math.cos(0.6),
                    Math.sin(angle) * 0.15 * Math.sin(0.6)
                ),
                this.colors.dim
            );
            steering.add(spoke);
        }
        
        // Steering damper
        const damper = this.createWireCylinder(0.02, 0.02, 0.3, 8, this.colors.dim);
        damper.rotation.x = Math.PI / 2;
        damper.position.set(0.35, -0.38, 0);
        steering.add(damper);
        
        steering.position.copy(steering.userData.originalPosition);
        this.parts.steering = steering;
        this.vehicleGroup.add(steering);
    }
    
    createBrakes() {
        const brakes = new THREE.Group();
        brakes.userData = { name: 'brakes', originalPosition: new THREE.Vector3(0, 0.52, 0) };
        
        const color = this.colors.primary;
        
        // Brake discs at each corner
        const positions = [
            [1.8, 0, 0.95],
            [1.8, 0, -0.95],
            [-1.8, 0, 0.95],
            [-1.8, 0, -0.95]
        ];
        
        positions.forEach(([x, y, z]) => {
            // Rotor disc
            const disc = this.createWireCylinder(0.18, 0.18, 0.025, 24, color);
            disc.rotation.x = Math.PI / 2;
            disc.position.set(x, y, z);
            brakes.add(disc);
            
            // Inner circle (hub)
            const hub = this.createWireCylinder(0.08, 0.08, 0.03, 16, this.colors.dim);
            hub.rotation.x = Math.PI / 2;
            hub.position.set(x, y, z);
            brakes.add(hub);
            
            // Ventilation slots
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const r = 0.13;
                brakes.add(this.createLine(
                    new THREE.Vector3(x, y + Math.cos(angle) * 0.09, z + Math.sin(angle) * 0.09),
                    new THREE.Vector3(x, y + Math.cos(angle) * r, z + Math.sin(angle) * r),
                    this.colors.dim
                ));
            }
            
            // Caliper
            const caliper = this.createWireBox(0.08, 0.12, 0.06, this.colors.accent);
            caliper.position.set(x, y + 0.12, z > 0 ? z - 0.06 : z + 0.06);
            brakes.add(caliper);
        });
        
        // Brake lines (simplified)
        // Front brake line
        brakes.add(this.createLine(
            new THREE.Vector3(1.8, 0.1, 0.9),
            new THREE.Vector3(1.0, 0.3, 0.3),
            this.colors.dim
        ));
        brakes.add(this.createLine(
            new THREE.Vector3(1.8, 0.1, -0.9),
            new THREE.Vector3(1.0, 0.3, -0.3),
            this.colors.dim
        ));
        
        // Master cylinder
        const master = this.createWireCylinder(0.04, 0.04, 0.15, 8, this.colors.secondary);
        master.rotation.z = Math.PI / 2;
        master.position.set(1.2, 0.6, -0.25);
        brakes.add(master);
        
        // Brake booster
        const booster = this.createWireCylinder(0.12, 0.12, 0.1, 16, color);
        booster.rotation.z = Math.PI / 2;
        booster.position.set(1.0, 0.6, -0.25);
        brakes.add(booster);
        
        brakes.position.copy(brakes.userData.originalPosition);
        this.parts.brakes = brakes;
        this.vehicleGroup.add(brakes);
    }
    
    createWheels() {
        const wheels = new THREE.Group();
        wheels.userData = { name: 'wheels', originalPosition: new THREE.Vector3(0, 0.52, 0) };
        
        const positions = [
            [1.8, 0, 1.05],
            [1.8, 0, -1.05],
            [-1.8, 0, 1.05],
            [-1.8, 0, -1.05]
        ];
        
        positions.forEach(([x, y, z]) => {
            const wheel = this.createWheel();
            wheel.position.set(x, y, z);
            if (z < 0) wheel.rotation.y = Math.PI;
            wheels.add(wheel);
        });
        
        wheels.position.copy(wheels.userData.originalPosition);
        this.parts.wheels = wheels;
        this.vehicleGroup.add(wheels);
    }
    
    createWheel() {
        const wheel = new THREE.Group();
        const color = this.colors.primary;
        
        // Larger tire - 285/75R16 = ~0.82m diameter = 0.41 radius
        const tireR = 0.48;  // Increased for visual impact
        const tireW = 0.32;
        const rimR = 0.28;
        
        // Tire outer
        const tireOuter = this.createWireCylinder(tireR, tireR, tireW, 32, color);
        tireOuter.rotation.x = Math.PI / 2;
        wheel.add(tireOuter);
        
        // Tire inner
        const tireInner = this.createWireCylinder(rimR + 0.02, rimR + 0.02, tireW, 24, this.colors.dim);
        tireInner.rotation.x = Math.PI / 2;
        wheel.add(tireInner);
        
        // Sidewall circles
        [tireW/2 - 0.02, -tireW/2 + 0.02].forEach(offset => {
            const sidewall = this.createWireCylinder(tireR - 0.08, tireR - 0.08, 0.01, 24, this.colors.secondary);
            sidewall.rotation.x = Math.PI / 2;
            sidewall.position.z = offset;
            wheel.add(sidewall);
        });
        
        // Rim
        const rim = this.createWireCylinder(rimR, rimR, tireW - 0.04, 20, color);
        rim.rotation.x = Math.PI / 2;
        wheel.add(rim);
        
        // Hub cap
        const cap = this.createWireCylinder(0.12, 0.12, 0.04, 12, this.colors.accent);
        cap.rotation.x = Math.PI / 2;
        cap.position.z = tireW/2 - 0.02;
        wheel.add(cap);
        
        // Lug pattern (6 lugs for Land Cruiser)
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const lug = this.createWireCylinder(0.018, 0.018, 0.05, 6, this.colors.secondary);
            lug.rotation.x = Math.PI / 2;
            lug.position.set(
                Math.sin(angle) * 0.08,
                Math.cos(angle) * 0.08,
                tireW/2 - 0.01
            );
            wheel.add(lug);
        }
        
        // Steel wheel slots (8 oval holes)
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const r = 0.18;
            wheel.add(this.createLine(
                new THREE.Vector3(Math.sin(angle) * (r-0.04), Math.cos(angle) * (r-0.04), 0),
                new THREE.Vector3(Math.sin(angle) * (r+0.04), Math.cos(angle) * (r+0.04), 0),
                this.colors.dim
            ));
        }
        
        return wheel;
    }
    
    createInterior() {
        const interior = new THREE.Group();
        // Interior positioned at floor level (body floor is at 0.2 + 0.8 offset = 1.0)
        interior.userData = { name: 'interior', originalPosition: new THREE.Vector3(0, 1.0, 0) };
        
        const color = this.colors.primary;
        const W = 0.85; // Interior width (slightly less than body)
        
        // Floor height relative to interior origin
        const floorY = 0;
        const seatBaseY = 0.1;  // Seat cushion height from floor
        const seatTopY = 0.45;  // Top of seat cushion
        const backrestH = 0.55; // Backrest height
        const headrestY = seatTopY + backrestH + 0.05;
        
        // === FLOOR PAN ===
        interior.add(this.createLine(new THREE.Vector3(0.6, floorY, -W), new THREE.Vector3(-1.8, floorY, -W), this.colors.dim));
        interior.add(this.createLine(new THREE.Vector3(0.6, floorY, W), new THREE.Vector3(-1.8, floorY, W), this.colors.dim));
        interior.add(this.createLine(new THREE.Vector3(0.6, floorY, -W), new THREE.Vector3(0.6, floorY, W), this.colors.dim));
        interior.add(this.createLine(new THREE.Vector3(-1.8, floorY, -W), new THREE.Vector3(-1.8, floorY, W), this.colors.dim));
        
        // Transmission tunnel
        const tunnel = this.createWireBox(1.8, 0.2, 0.3, this.colors.dim);
        tunnel.position.set(-0.3, floorY + 0.1, 0);
        interior.add(tunnel);
        
        // === DASHBOARD ===
        const dashY = 0.5;  // Dashboard height
        const dashX = 0.6;  // Dashboard X position (at firewall)
        
        // Dashboard body
        const dash = this.createWireBox(0.35, 0.4, 1.6, this.colors.secondary);
        dash.position.set(dashX, dashY, 0);
        interior.add(dash);
        
        // Instrument binnacle
        const binnacle = this.createWireBox(0.15, 0.3, 0.5, color);
        binnacle.position.set(dashX - 0.1, dashY + 0.15, 0.35);
        interior.add(binnacle);
        
        // Gauges (speedo, tacho)
        [0.2, 0.5].forEach(zOff => {
            const gauge = this.createWireCylinder(0.1, 0.1, 0.03, 16, this.colors.accent);
            gauge.rotation.z = Math.PI / 2;
            gauge.position.set(dashX - 0.18, dashY + 0.18, zOff);
            interior.add(gauge);
        });
        
        // Center vents
        const vents = this.createWireBox(0.05, 0.12, 0.3, this.colors.dim);
        vents.position.set(dashX - 0.1, dashY + 0.25, 0);
        interior.add(vents);
        
        // === STEERING WHEEL ===
        const swX = 0.35;
        const swY = dashY + 0.35;
        const swR = 0.2;
        const steeringWheel = this.createWireCylinder(swR, swR, 0.03, 20, color);
        steeringWheel.rotation.x = -0.3;  // Tilted toward driver
        steeringWheel.rotation.z = Math.PI / 2;
        steeringWheel.position.set(swX, swY, 0.35);
        interior.add(steeringWheel);
        
        // Steering column
        interior.add(this.createLine(
            new THREE.Vector3(swX, swY, 0.35),
            new THREE.Vector3(dashX, dashY, 0.35),
            this.colors.dim
        ));
        
        // === FRONT SEATS ===
        [0.45, -0.45].forEach(z => {
            // Seat base/cushion
            const base = this.createWireBox(0.5, 0.15, 0.5, color);
            base.position.set(0.05, seatBaseY + 0.075, z);
            interior.add(base);
            
            // Seat back
            const back = this.createWireBox(0.12, backrestH, 0.48, color);
            back.position.set(-0.22, seatTopY + backrestH/2, z);
            back.rotation.z = 0.12;
            interior.add(back);
            
            // Headrest
            const head = this.createWireBox(0.08, 0.18, 0.25, this.colors.dim);
            head.position.set(-0.3, headrestY + 0.09, z);
            interior.add(head);
            
            // Seat rails
            interior.add(this.createLine(
                new THREE.Vector3(0.3, floorY + 0.02, z - 0.15),
                new THREE.Vector3(-0.2, floorY + 0.02, z - 0.15),
                this.colors.dim
            ));
            interior.add(this.createLine(
                new THREE.Vector3(0.3, floorY + 0.02, z + 0.15),
                new THREE.Vector3(-0.2, floorY + 0.02, z + 0.15),
                this.colors.dim
            ));
        });
        
        // === CENTER CONSOLE ===
        const consoleBox = this.createWireBox(0.7, 0.35, 0.28, this.colors.secondary);
        consoleBox.position.set(0.15, floorY + 0.25, 0);
        interior.add(consoleBox);
        
        // Gear shifter (floor mounted)
        const shifter = this.createWireCylinder(0.025, 0.025, 0.3, 8, this.colors.accent);
        shifter.position.set(0.25, floorY + 0.45, 0.05);
        interior.add(shifter);
        
        // Shifter knob
        const knob = this.createWireCylinder(0.04, 0.04, 0.06, 8, color);
        knob.position.set(0.25, floorY + 0.62, 0.05);
        interior.add(knob);
        
        // Transfer case lever
        const transfer = this.createWireCylinder(0.025, 0.025, 0.28, 8, this.colors.accent);
        transfer.position.set(0.0, floorY + 0.4, 0.05);
        interior.add(transfer);
        
        // === REAR BENCH SEAT ===
        const rearX = -1.0;
        
        // Rear seat base
        const rearBase = this.createWireBox(0.5, 0.18, 1.5, color);
        rearBase.position.set(rearX, seatBaseY + 0.09, 0);
        interior.add(rearBase);
        
        // Rear seat back
        const rearBack = this.createWireBox(0.12, 0.55, 1.45, color);
        rearBack.position.set(rearX - 0.32, seatTopY + 0.28, 0);
        rearBack.rotation.z = 0.1;
        interior.add(rearBack);
        
        // === DOOR TRIM PANELS ===
        [-W, W].forEach(z => {
            const trim = this.createWireBox(1.5, 0.6, 0.05, this.colors.dim);
            trim.position.set(-0.3, 0.4, z);
            interior.add(trim);
            
            // Door handle
            const handle = this.createWireBox(0.12, 0.04, 0.03, this.colors.secondary);
            handle.position.set(0.1, 0.45, z > 0 ? z - 0.03 : z + 0.03);
            interior.add(handle);
            
            // Window crank/switch
            const crank = this.createWireCylinder(0.04, 0.04, 0.03, 8, this.colors.dim);
            crank.rotation.x = Math.PI / 2;
            crank.position.set(-0.1, 0.35, z > 0 ? z - 0.03 : z + 0.03);
            interior.add(crank);
        });
        
        // === ROOF LINING ===
        const roofY = 0.85; // Roof interior height
        interior.add(this.createLine(new THREE.Vector3(0.3, roofY, -W + 0.1), new THREE.Vector3(-1.7, roofY, -W + 0.1), this.colors.dim));
        interior.add(this.createLine(new THREE.Vector3(0.3, roofY, W - 0.1), new THREE.Vector3(-1.7, roofY, W - 0.1), this.colors.dim));
        
        // Sun visors
        [0.35, -0.35].forEach(z => {
            const visor = this.createWireBox(0.02, 0.12, 0.2, this.colors.dim);
            visor.position.set(0.35, roofY - 0.08, z);
            interior.add(visor);
        });
        
        // Interior mirror
        const mirror = this.createWireBox(0.04, 0.08, 0.2, this.colors.dim);
        mirror.position.set(0.4, roofY - 0.1, 0);
        interior.add(mirror);
        
        interior.position.copy(interior.userData.originalPosition);
        this.parts.interior = interior;
        this.vehicleGroup.add(interior);
    }
    
    createExhaust() {
        const exhaust = new THREE.Group();
        const color = this.colors.secondary;
        
        // Exhaust manifold (from engine)
        exhaust.add(this.createLine(new THREE.Vector3(2.3, 0.6, 0.35), new THREE.Vector3(2.0, 0.4, 0.4), color));
        
        // Downpipe
        exhaust.add(this.createLine(new THREE.Vector3(2.0, 0.4, 0.4), new THREE.Vector3(1.5, 0.35, 0.45), color));
        
        // Catalytic converter
        const cat = this.createWireBox(0.3, 0.12, 0.15, this.colors.dim);
        cat.position.set(1.2, 0.35, 0.45);
        exhaust.add(cat);
        
        // Main pipe running under vehicle
        exhaust.add(this.createLine(new THREE.Vector3(1.05, 0.35, 0.45), new THREE.Vector3(-2.0, 0.35, 0.45), color));
        
        // Muffler
        const muffler = this.createWireCylinder(0.1, 0.1, 0.5, 12, color);
        muffler.rotation.z = Math.PI/2;
        muffler.position.set(-1.5, 0.35, 0.45);
        exhaust.add(muffler);
        
        // Tail pipe
        exhaust.add(this.createLine(new THREE.Vector3(-2.0, 0.35, 0.45), new THREE.Vector3(-2.55, 0.35, 0.55), color));
        const tailPipe = this.createWireCylinder(0.04, 0.04, 0.15, 8, color);
        tailPipe.rotation.x = Math.PI/2;
        tailPipe.position.set(-2.55, 0.35, 0.62);
        exhaust.add(tailPipe);
        
        exhaust.position.set(0, 0.4, 0);
        this.vehicleGroup.add(exhaust);
    }
    
    createFuelTank() {
        const tank = new THREE.Group();
        const color = this.colors.primary;
        
        // Main fuel tank (under rear)
        const mainTank = this.createWireBox(0.8, 0.25, 0.7, color);
        mainTank.position.set(-1.2, 0.3, 0);
        tank.add(mainTank);
        
        // Tank straps
        [-0.95, -1.45].forEach(x => {
            tank.add(this.createLine(new THREE.Vector3(x, 0.2, -0.35), new THREE.Vector3(x, 0.45, -0.35), this.colors.dim));
            tank.add(this.createLine(new THREE.Vector3(x, 0.2, 0.35), new THREE.Vector3(x, 0.45, 0.35), this.colors.dim));
        });
        
        // Filler neck
        tank.add(this.createLine(new THREE.Vector3(-1.5, 0.4, -0.35), new THREE.Vector3(-1.8, 0.9, -0.85), this.colors.secondary));
        
        tank.position.set(0, 0.4, 0);
        this.vehicleGroup.add(tank);
    }
    
    createDriveshafts() {
        const ds = new THREE.Group();
        const color = this.colors.primary;
        
        // Front driveshaft
        const frontDS = this.createWireCylinder(0.045, 0.045, 1.3, 8, color);
        frontDS.rotation.z = Math.PI/2;
        frontDS.position.set(1.15, 0.55, 0);
        ds.add(frontDS);
        
        // Front U-joints
        [0.5, 1.8].forEach(x => {
            const uj = this.createWireCylinder(0.06, 0.06, 0.08, 8, this.colors.accent);
            uj.rotation.z = Math.PI/2;
            uj.position.set(x, 0.55, 0);
            ds.add(uj);
        });
        
        // Rear driveshaft
        const rearDS = this.createWireCylinder(0.05, 0.05, 1.5, 8, color);
        rearDS.rotation.z = Math.PI/2;
        rearDS.position.set(-1.05, 0.5, 0);
        ds.add(rearDS);
        
        // Rear U-joints
        [-0.3, -1.8].forEach(x => {
            const uj = this.createWireCylinder(0.065, 0.065, 0.08, 8, this.colors.accent);
            uj.rotation.z = Math.PI/2;
            uj.position.set(x, 0.5, 0);
            ds.add(uj);
        });
        
        ds.position.set(0, 0, 0);
        this.vehicleGroup.add(ds);
    }
    
    createCooling() {
        const cooling = new THREE.Group();
        const color = this.colors.secondary;
        
        // Radiator (larger, at front)
        const radiator = this.createWireBox(0.08, 0.5, 0.8, color);
        radiator.position.set(2.6, 1.0, 0);
        cooling.add(radiator);
        
        // Radiator core lines
        for (let y = 0.8; y <= 1.2; y += 0.1) {
            cooling.add(this.createLine(new THREE.Vector3(2.6, y, -0.35), new THREE.Vector3(2.6, y, 0.35), this.colors.dim));
        }
        
        // Upper hose
        cooling.add(this.createLine(new THREE.Vector3(2.55, 1.15, 0.1), new THREE.Vector3(2.2, 1.1, 0.1), color));
        
        // Lower hose
        cooling.add(this.createLine(new THREE.Vector3(2.55, 0.8, 0.1), new THREE.Vector3(2.2, 0.65, 0.1), color));
        
        // Overflow tank
        const overflow = this.createWireBox(0.08, 0.15, 0.1, this.colors.dim);
        overflow.position.set(2.45, 1.35, 0.3);
        cooling.add(overflow);
        
        // Fan shroud
        const shroud = this.createWireCylinder(0.3, 0.3, 0.05, 16, this.colors.dim);
        shroud.rotation.z = Math.PI/2;
        shroud.position.set(2.5, 1.0, 0);
        cooling.add(shroud);
        
        cooling.position.set(0, 0, 0);
        this.vehicleGroup.add(cooling);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        document.getElementById('btn-explode').addEventListener('click', () => this.toggleExplode());
        document.getElementById('btn-rotate').addEventListener('click', () => this.toggleRotate());
        document.getElementById('btn-ortho').addEventListener('click', () => this.toggleOrtho());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetView());
        
        document.querySelectorAll('.part-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const partName = btn.dataset.part;
                this.selectPart(partName);
                document.querySelectorAll('.part-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }
    
    onResize() {
        const aspect = window.innerWidth / window.innerHeight;
        
        this.perspCamera.aspect = aspect;
        this.perspCamera.updateProjectionMatrix();
        
        const frustum = 8;
        this.orthoCamera.left = -frustum * aspect;
        this.orthoCamera.right = frustum * aspect;
        this.orthoCamera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    toggleExplode() {
        this.isExploded = !this.isExploded;
        document.getElementById('btn-explode').classList.toggle('active');
        
        const offsets = {
            'chassis': new THREE.Vector3(0, -1.5, 0),
            'body': new THREE.Vector3(0, 2.5, 0),
            'engine': new THREE.Vector3(3, 0, 0),
            'transmission': new THREE.Vector3(1.5, -1.5, 0),
            'front-axle': new THREE.Vector3(2, -1.5, 0),
            'rear-axle': new THREE.Vector3(-2, -1.5, 0),
            'steering': new THREE.Vector3(2.5, 2, 1.5),
            'brakes': new THREE.Vector3(0, -2.5, 2),
            'wheels': new THREE.Vector3(0, 0, 2.5),
            'interior': new THREE.Vector3(0, 4, 0)
        };
        
        Object.keys(this.parts).forEach(name => {
            const part = this.parts[name];
            if (!part?.userData?.originalPosition) return;
            
            const target = this.isExploded
                ? part.userData.originalPosition.clone().add(offsets[name] || new THREE.Vector3())
                : part.userData.originalPosition.clone();
            
            this.animateTo(part.position, target);
        });
    }
    
    toggleRotate() {
        this.isRotating = !this.isRotating;
        document.getElementById('btn-rotate').classList.toggle('active');
    }
    
    toggleOrtho() {
        this.isOrtho = !this.isOrtho;
        document.getElementById('btn-ortho').classList.toggle('active');
        
        const newCamera = this.isOrtho ? this.orthoCamera : this.perspCamera;
        newCamera.position.copy(this.camera.position);
        this.camera = newCamera;
        this.controls.object = this.camera;
    }
    
    resetView() {
        if (this.isExploded) this.toggleExplode();
        if (this.isOrtho) this.toggleOrtho();
        this.isRotating = false;
        document.getElementById('btn-rotate').classList.remove('active');
        
        this.animateTo(this.camera.position, new THREE.Vector3(12, 8, 16));
        this.animateTo(this.controls.target, new THREE.Vector3(0, 1, 0));
        this.vehicleGroup.rotation.y = 0;
        
        document.querySelectorAll('.part-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('info-panel').classList.remove('visible');
    }
    
    animateTo(obj, target, duration = 800) {
        const start = obj.clone();
        const startTime = Date.now();
        
        const update = () => {
            const t = Math.min((Date.now() - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            obj.lerpVectors(start, target, ease);
            if (t < 1) requestAnimationFrame(update);
        };
        update();
    }
    
    selectPart(partName) {
        const part = this.parts[partName];
        const info = this.getPartInfo(partName);
        
        document.getElementById('info-title').textContent = info.title;
        document.getElementById('info-desc').innerHTML = info.description;
        
        // Load technical diagram if available
        const imgContainer = document.getElementById('info-image-container');
        if (info.image) {
            imgContainer.innerHTML = `<img src="${info.image}" alt="${info.title}">`;
        } else {
            imgContainer.innerHTML = '';
        }
        
        document.getElementById('info-panel').classList.add('visible');
        
        // Highlight selected part
        this.highlightPart(partName);
        
        // Focus camera
        if (part?.userData?.originalPosition) {
            const pos = this.isExploded ? part.position.clone() : part.userData.originalPosition.clone();
            const offset = new THREE.Vector3(5, 3, 5);
            this.animateTo(this.camera.position, pos.clone().add(offset));
            this.animateTo(this.controls.target, pos);
        }
    }
    
    highlightPart(selectedName) {
        Object.entries(this.parts).forEach(([name, part]) => {
            if (!part) return;
            const isSelected = name === selectedName;
            part.traverse(child => {
                if (child.material) {
                    child.material.color.setHex(
                        isSelected ? this.colors.highlight : 
                        (child.material.color.getHex() === this.colors.highlight ? this.colors.primary : child.material.color.getHex())
                    );
                }
            });
        });
    }
    
    getPartInfo(name) {
        const baseUrl = '/home/exedev/manual/manual/repair/img/png/';
        const data = {
            'chassis': {
                title: 'CHASSIS FRAME',
                description: `
                    <strong>TYPE:</strong> Ladder frame, box-section steel<br><br>
                    <strong>SPECIFICATIONS:</strong><br>
                    • Wheelbase: 2,730mm (SWB) / 2,980mm (LWB)<br>
                    • Overall length: 4,430-5,150mm<br>
                    • Frame width: 890mm<br>
                    • Ground clearance: 225mm<br><br>
                    <strong>CONSTRUCTION:</strong><br>
                    • High-tensile steel rails<br>
                    • 8 cross-members<br>
                    • E-coat corrosion protection<br>
                    • Body mount isolation bushings
                `,
                image: '../manual/manual/repair/img/png/A075599.png'
            },
            'body': {
                title: 'BODY PANELS',
                description: `
                    <strong>TYPE:</strong> Steel body-on-frame<br><br>
                    <strong>VARIANTS:</strong><br>
                    • 70 Series: 2-door short wheelbase<br>
                    • 76 Series: 5-door wagon<br>
                    • 78 Series: Troop carrier<br>
                    • 79 Series: Single/dual cab pickup<br><br>
                    <strong>FEATURES:</strong><br>
                    • Galvanized steel panels<br>
                    • Bull bar compatible<br>
                    • Snorkel provisions<br>
                    • Full-size spare mount
                `
            },
            'engine': {
                title: 'ENGINE - 2UZ-FE',
                description: `
                    <strong>TYPE:</strong> 4.7L V8 Petrol<br><br>
                    <strong>SPECIFICATIONS:</strong><br>
                    • Displacement: 4,664cc<br>
                    • Bore x Stroke: 86 x 96mm<br>
                    • Compression: 16.8:1<br>
                    • Power: 175kW<br>
                    • Torque: 434Nm<br><br>
                    <strong>SYSTEMS:</strong><br>
                    • Common-rail direct injection<br>
                    • Sequential twin turbo<br>
                    • Intercooled<br>
                    • DPF (selected markets)
                `
            },
            'transmission': {
                title: 'TRANSMISSION',
                description: `
                    <strong>MANUAL:</strong> H151F 5-speed<br>
                    • 1st: 4.313 | 2nd: 2.330<br>
                    • 3rd: 1.436 | 4th: 1.000<br>
                    • 5th: 0.838 | Rev: 4.220<br><br>
                    <strong>AUTOMATIC:</strong> AB60F 6-speed<br>
                    • Lock-up torque converter<br><br>
                    <strong>TRANSFER CASE:</strong> HF2AV<br>
                    • Part-time 4WD<br>
                    • Hi/Lo range<br>
                    • Low ratio: 2.488:1
                `
            },
            'front-axle': {
                title: 'FRONT AXLE',
                description: `
                    <strong>TYPE:</strong> Live axle, coil spring<br><br>
                    <strong>DIFFERENTIAL:</strong><br>
                    • Semi-floating design<br>
                    • Ratio: 4.100:1 or 4.300:1<br>
                    • Manual locking hubs (optional)<br><br>
                    <strong>SUSPENSION:</strong><br>
                    • Double wishbone<br>
                    • Panhard rod lateral location<br>
                    • Radius arms (leading)<br>
                    • Gas shock absorbers<br>
                    • Stabilizer bar<br><br>
                    <strong>TRAVEL:</strong> 220mm
                `
            },
            'rear-axle': {
                title: 'REAR AXLE',
                description: `
                    <strong>TYPE:</strong> Full-floating, leaf spring<br><br>
                    <strong>DIFFERENTIAL:</strong><br>
                    • Full-floating axle shafts<br>
                    • Ratio: 4.100:1 or 4.300:1<br>
                    • LSD or locker available<br><br>
                    <strong>SUSPENSION:</strong><br>
                    • 4-link coil (7+)<br>
                    • Progressive rate<br>
                    • Gas shock absorbers<br><br>
                    <strong>CAPACITY:</strong><br>
                    • GVM: 3,150-3,350kg<br>
                    • Payload: 850-1,200kg
                `
            },
            'steering': {
                title: 'STEERING SYSTEM',
                description: `
                    <strong>TYPE:</strong> Recirculating ball<br><br>
                    <strong>SPECIFICATIONS:</strong><br>
                    • Power assisted (hydraulic)<br>
                    • Turns lock-to-lock: 4.2<br>
                    • Turning radius: 6.7m<br><br>
                    <strong>COMPONENTS:</strong><br>
                    • Steering box (recirculating ball)<br>
                    • Pitman arm<br>
                    • Drag link<br>
                    • Tie rod assembly<br>
                    • Steering damper<br>
                    • Kingpin steering knuckles
                `
            },
            'brakes': {
                title: 'BRAKE SYSTEM',
                description: `
                    <strong>FRONT:</strong><br>
                    • Ventilated discs: 319mm<br>
                    • Twin-piston calipers<br><br>
                    <strong>REAR:</strong><br>
                    • Solid discs: 322mm<br>
                    • Single-piston calipers<br><br>
                    <strong>SYSTEMS:</strong><br>
                    • Vacuum servo booster<br>
                    • ABS (Anti-lock)<br>
                    • EBD (Electronic Brake Distribution)<br>
                    • Parking brake: Drum in disc
                `
            },
            'wheels': {
                title: 'WHEELS & TIRES',
                description: `
                    <strong>WHEELS:</strong><br>
                    • Size: 16x7.5J / 16x8J<br>
                    • PCD: 5 x 150mm<br>
                    • Offset: 0 to +25mm<br>
                    • Center bore: 110.1mm<br><br>
                    <strong>TIRES:</strong><br>
                    • 265/70R16<br>
                    • 285/75R16 (optional)<br>
                    • All-terrain or mud-terrain<br><br>
                    <strong>SPARE:</strong> Full-size, rear-mounted
                `
            },
            'interior': {
                title: 'INTERIOR',
                description: `
                    <strong>SEATING:</strong><br>
                    • 5-8 passengers (variant)<br>
                    • Vinyl or cloth upholstery<br>
                    • Driver lumbar support<br><br>
                    <strong>CONTROLS:</strong><br>
                    • Floor-mounted gear lever<br>
                    • Floor-mounted transfer lever<br>
                    • Analog instrument cluster<br><br>
                    <strong>FEATURES:</strong><br>
                    • Manual A/C (standard)<br>
                    • Power windows (optional)<br>
                    • Basic audio system
                `
            }
        };
        
        return data[name] || { title: name.toUpperCase(), description: 'Component information not available.' };
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        if (this.isRotating) {
            this.vehicleGroup.rotation.y += 0.3 * delta;
        }
        
        this.controls.update();
        
        // FPS display
        const fps = Math.round(1 / Math.max(delta, 0.001));
        document.getElementById('fps').textContent = `${Math.min(fps, 999)} FPS`;
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => new LandCruiserBlueprint());
