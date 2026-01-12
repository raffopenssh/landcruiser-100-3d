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
        
        // Renderer with Safari WebGL compatibility
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        var rendererParams = { 
            canvas: canvas,
            context: context,
            antialias: true,
            alpha: true,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false
        };
        
        this.renderer = new THREE.WebGLRenderer(rendererParams);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
        this.parts['chassis'] = chassis;
        this.vehicleGroup.add(chassis);
    }
    
    createBody() {
        const body = new THREE.Group();
        body.userData = { name: 'body', originalPosition: new THREE.Vector3(0, 0.8, 0) };
        
        const color = this.colors.primary;
        const W = 0.97; // Half width - LC100 is wider
        
        // LC100 proportions - tall SUV styling
        // Real dimensions: ~4.89m long, ~1.94m wide, ~1.85m tall
        // Wheelbase: 2850mm, Ground clearance: 220mm
        
        // === SIDE PROFILE - Left side ===
        const bodyBottom = 0.18;
        const beltLine = 1.05;    // Character/window sill line
        const hoodTop = 1.15;     // Hood height - taller
        const roofTop = 1.85;     // Roof height - taller
        const cowlX = 0.55;       // Windshield base
        
        // LC100 profile - SUV wagon body style
        const sideLeft = [
            // Lower body line
            [-2.45, bodyBottom, -W],
            [-1.15, bodyBottom, -W],  // Rear wheel arch
            [-0.95, bodyBottom + 0.12, -W],
            [-0.5, bodyBottom, -W],
            [1.1, bodyBottom, -W],    // Front wheel arch
            [1.35, bodyBottom + 0.12, -W],
            [2.3, bodyBottom, -W],
            // Front end - more vertical
            [2.45, 0.35, -W],         // Lower bumper
            [2.5, 0.5, -W],           // Upper bumper
            [2.5, hoodTop, -W],       // Hood/grille top (flat front)
            // Hood (nearly flat)
            [cowlX, hoodTop, -W],     // Cowl
            // Windshield (moderate rake)
            [-0.05, roofTop, -W],     // Windshield top
            // Roof (extends all the way back for wagon body)
            [-1.9, roofTop, -W],      // Roof line - extended back
            // Rear tailgate (wagon style - nearly vertical)
            [-2.2, roofTop, -W],      // Rear roof corner
            [-2.45, roofTop - 0.15, -W], // Rear glass top
            [-2.45, beltLine, -W],    // Rear window bottom
            [-2.45, bodyBottom, -W]   // Rear bumper
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
        // Roof cross members
        body.add(this.createLine(new THREE.Vector3(-1.0, roofTop, -W), new THREE.Vector3(-1.0, roofTop, W), color));
        body.add(this.createLine(new THREE.Vector3(-1.9, roofTop, -W), new THREE.Vector3(-1.9, roofTop, W), color));
        // Rear roof corner
        body.add(this.createLine(new THREE.Vector3(-2.2, roofTop, -W), new THREE.Vector3(-2.2, roofTop, W), color));
        // Rear glass top (tailgate window frame)
        body.add(this.createLine(new THREE.Vector3(-2.45, roofTop - 0.15, -W), new THREE.Vector3(-2.45, roofTop - 0.15, W), color));
        // Belt line at rear
        body.add(this.createLine(new THREE.Vector3(-2.45, beltLine, -W), new THREE.Vector3(-2.45, beltLine, W), color));
        // Tailgate bottom
        body.add(this.createLine(new THREE.Vector3(-2.45, bodyBottom, -W), new THREE.Vector3(-2.45, bodyBottom, W), color));
        
        // === LC100 GRILLE (large prominent chrome grille) ===
        const grilleLeft = -0.5;
        const grilleRight = 0.5;
        const grilleBottom = 0.55;
        const grilleTop = hoodTop;
        
        // Grille outer frame (tall rectangular shape)
        body.add(this.createLine(new THREE.Vector3(2.52, grilleBottom, grilleLeft), new THREE.Vector3(2.52, grilleBottom, grilleRight), color));
        body.add(this.createLine(new THREE.Vector3(2.52, grilleTop, grilleLeft), new THREE.Vector3(2.52, grilleTop, grilleRight), color));
        body.add(this.createLine(new THREE.Vector3(2.52, grilleBottom, grilleLeft), new THREE.Vector3(2.52, grilleTop, grilleLeft), color));
        body.add(this.createLine(new THREE.Vector3(2.52, grilleBottom, grilleRight), new THREE.Vector3(2.52, grilleTop, grilleRight), color));
        
        // Thick horizontal chrome bars (LC100 signature)
        [0.65, 0.8, 0.95, 1.08].forEach(y => {
            body.add(this.createLine(
                new THREE.Vector3(2.52, y, grilleLeft + 0.03),
                new THREE.Vector3(2.52, y, grilleRight - 0.03),
                this.colors.secondary
            ));
            // Double line for thick bar effect
            body.add(this.createLine(
                new THREE.Vector3(2.52, y + 0.02, grilleLeft + 0.03),
                new THREE.Vector3(2.52, y + 0.02, grilleRight - 0.03),
                this.colors.dim
            ));
        });
        
        // Toyota emblem (prominent, centered)
        const emblem = this.createWireCylinder(0.12, 0.12, 0.03, 20, this.colors.accent);
        emblem.rotation.z = Math.PI / 2;
        emblem.position.set(2.54, 0.87, 0);
        body.add(emblem);
        // Inner emblem ring
        const emblemInner = this.createWireCylinder(0.08, 0.08, 0.02, 16, color);
        emblemInner.rotation.z = Math.PI / 2;
        emblemInner.position.set(2.55, 0.87, 0);
        body.add(emblemInner);
        
        // === HEADLIGHTS (large rectangular beside grille) ===
        [-0.72, 0.72].forEach(z => {
            // Main headlight housing (taller)
            const headlight = this.createWireBox(0.1, 0.28, 0.32, color);
            headlight.position.set(2.48, 0.82, z);
            body.add(headlight);
            
            // Multi-reflector units inside
            const mainBeam = this.createWireCylinder(0.07, 0.07, 0.04, 12, this.colors.accent);
            mainBeam.rotation.z = Math.PI / 2;
            mainBeam.position.set(2.5, 0.85, z);
            body.add(mainBeam);
            
            const lowBeam = this.createWireCylinder(0.05, 0.05, 0.03, 10, this.colors.secondary);
            lowBeam.rotation.z = Math.PI / 2;
            lowBeam.position.set(2.5, 0.75, z > 0 ? z - 0.08 : z + 0.08);
            body.add(lowBeam);
            
            // Turn signal (amber, below headlight)
            const signal = this.createWireBox(0.05, 0.08, 0.25, this.colors.accent);
            signal.position.set(2.48, 0.62, z);
            body.add(signal);
        });
        
        // Front bumper chrome strip
        body.add(this.createLine(new THREE.Vector3(2.48, 0.42, -0.85), new THREE.Vector3(2.48, 0.42, 0.85), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(2.48, 0.48, -0.85), new THREE.Vector3(2.48, 0.48, 0.85), this.colors.secondary));
        
        // Fog lights (in bumper)
        [-0.4, 0.4].forEach(z => {
            const fog = this.createWireCylinder(0.07, 0.07, 0.04, 10, this.colors.dim);
            fog.rotation.z = Math.PI / 2;
            fog.position.set(2.5, 0.38, z);
            body.add(fog);
        });
        
        // Lower air intake
        body.add(this.createLine(new THREE.Vector3(2.48, 0.28, -0.6), new THREE.Vector3(2.48, 0.28, 0.6), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(2.48, 0.22, -0.5), new THREE.Vector3(2.48, 0.22, 0.5), this.colors.dim));
        
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
        
        // D-pillar (quarter panel area)
        body.add(this.createLine(new THREE.Vector3(-1.5, sillHeight, -W), new THREE.Vector3(-1.9, roofTop, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.5, sillHeight, W), new THREE.Vector3(-1.9, roofTop, W), this.colors.dim));
        
        // Quarter window (small rear window behind C-pillar)
        body.add(this.createLine(new THREE.Vector3(-1.0, sillHeight + 0.08, -W), new THREE.Vector3(-1.0, roofTop - 0.1, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.0, sillHeight + 0.08, W), new THREE.Vector3(-1.0, roofTop - 0.1, W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.5, sillHeight + 0.08, -W), new THREE.Vector3(-1.5, roofTop - 0.08, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.5, sillHeight + 0.08, W), new THREE.Vector3(-1.5, roofTop - 0.08, W), this.colors.dim));
        // Quarter window top edge
        body.add(this.createLine(new THREE.Vector3(-1.0, roofTop - 0.1, -W), new THREE.Vector3(-1.5, roofTop - 0.08, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.0, roofTop - 0.1, W), new THREE.Vector3(-1.5, roofTop - 0.08, W), this.colors.dim));
        // Quarter window bottom edge
        body.add(this.createLine(new THREE.Vector3(-1.0, sillHeight + 0.08, -W), new THREE.Vector3(-1.5, sillHeight + 0.08, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-1.0, sillHeight + 0.08, W), new THREE.Vector3(-1.5, sillHeight + 0.08, W), this.colors.dim));
        
        // Rear side panel (behind quarter window to tailgate)
        body.add(this.createLine(new THREE.Vector3(-1.9, roofTop, -W), new THREE.Vector3(-2.2, roofTop, -W), color));
        body.add(this.createLine(new THREE.Vector3(-1.9, roofTop, W), new THREE.Vector3(-2.2, roofTop, W), color));
        // Vertical connection to rear
        body.add(this.createLine(new THREE.Vector3(-2.2, sillHeight, -W), new THREE.Vector3(-2.2, roofTop, -W), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-2.2, sillHeight, W), new THREE.Vector3(-2.2, roofTop, W), this.colors.dim));
        
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
        
        // === REAR SECTION (TAILGATE) ===
        // Tailgate window frame (LC100 has large rear window in swing-out tailgate)
        body.add(this.createLine(new THREE.Vector3(-2.45, beltLine + 0.15, -0.7), new THREE.Vector3(-2.45, roofTop - 0.2, -0.7), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(-2.45, beltLine + 0.15, 0.7), new THREE.Vector3(-2.45, roofTop - 0.2, 0.7), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(-2.45, beltLine + 0.15, -0.7), new THREE.Vector3(-2.45, beltLine + 0.15, 0.7), this.colors.secondary));
        body.add(this.createLine(new THREE.Vector3(-2.45, roofTop - 0.2, -0.7), new THREE.Vector3(-2.45, roofTop - 0.2, 0.7), this.colors.secondary));
        
        // Lower tailgate section (horizontal split like LC100)
        body.add(this.createLine(new THREE.Vector3(-2.45, beltLine - 0.1, -0.8), new THREE.Vector3(-2.45, beltLine - 0.1, 0.8), this.colors.dim));
        // Toyota lettering area
        body.add(this.createLine(new THREE.Vector3(-2.45, 0.7, -0.35), new THREE.Vector3(-2.45, 0.7, 0.35), this.colors.dim));
        body.add(this.createLine(new THREE.Vector3(-2.45, 0.55, -0.35), new THREE.Vector3(-2.45, 0.55, 0.35), this.colors.dim));
        
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
        
        // === RUNNING BOARDS / SIDE STEPS ===
        // LC100 has chrome/aluminum running boards
        [-W - 0.1, W + 0.1].forEach(z => {
            // Main running board tube
            body.add(this.createLine(new THREE.Vector3(1.0, 0.3, z), new THREE.Vector3(-1.4, 0.3, z), this.colors.secondary));
            body.add(this.createLine(new THREE.Vector3(1.0, 0.22, z), new THREE.Vector3(-1.4, 0.22, z), this.colors.secondary));
            // End caps
            body.add(this.createLine(new THREE.Vector3(1.0, 0.22, z), new THREE.Vector3(1.0, 0.3, z), this.colors.dim));
            body.add(this.createLine(new THREE.Vector3(-1.4, 0.22, z), new THREE.Vector3(-1.4, 0.3, z), this.colors.dim));
            // Support brackets
            [0.5, -0.3, -0.9].forEach(x => {
                body.add(this.createLine(new THREE.Vector3(x, 0.3, z), new THREE.Vector3(x, 0.4, z > 0 ? W : -W), this.colors.dim));
            });
        });
        
        // === ROOF RAILS ===
        // Longitudinal rails on roof
        [-0.8, 0.8].forEach(z => {
            body.add(this.createLine(new THREE.Vector3(0.0, roofTop + 0.02, z), new THREE.Vector3(-1.9, roofTop + 0.02, z), this.colors.secondary));
            // Rail supports
            [0.0, -0.6, -1.2, -1.8].forEach(x => {
                body.add(this.createLine(new THREE.Vector3(x, roofTop, z), new THREE.Vector3(x, roofTop + 0.05, z), this.colors.dim));
            });
        });
        
        body.position.copy(body.userData.originalPosition);
        this.parts['body'] = body;
        this.vehicleGroup.add(body);
    }

    createEngine() {
        const engine = new THREE.Group();
        engine.userData = { name: 'engine', originalPosition: new THREE.Vector3(2.0, 0.75, 0) };
        
        const color = this.colors.primary;
        this.engineParts = {};
        
        // === CYLINDER BLOCK (11xx parts) ===
        const cylinderBlock = new THREE.Group();
        cylinderBlock.userData = { 
            name: 'cylinder-block', 
            label: 'Cylinder Block',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1105_cylinder-block'
        };
        const block = this.createWireBox(0.7, 0.5, 0.6, color);
        cylinderBlock.add(block);
        engine.add(cylinderBlock);
        this.engineParts['cylinder-block'] = cylinderBlock;
        
        // === CYLINDER HEAD LEFT (11xx parts) ===
        const cylinderHeadLeft = new THREE.Group();
        cylinderHeadLeft.userData = { 
            name: 'cylinder-head-lh', 
            label: 'Cylinder Head LH',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1104_cylinder-head'
        };
        const bankLeft = this.createWireBox(0.6, 0.15, 0.25, this.colors.secondary);
        bankLeft.position.set(0, 0.32, -0.2);
        bankLeft.rotation.x = 0.3;
        cylinderHeadLeft.add(bankLeft);
        const valveL = this.createWireBox(0.55, 0.08, 0.2, this.colors.accent);
        valveL.position.set(0, 0.42, -0.22);
        valveL.rotation.x = 0.3;
        cylinderHeadLeft.add(valveL);
        engine.add(cylinderHeadLeft);
        this.engineParts['cylinder-head-lh'] = cylinderHeadLeft;
        
        // === CYLINDER HEAD RIGHT ===
        const cylinderHeadRight = new THREE.Group();
        cylinderHeadRight.userData = { 
            name: 'cylinder-head-rh', 
            label: 'Cylinder Head RH',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1104_cylinder-head'
        };
        const bankRight = this.createWireBox(0.6, 0.15, 0.25, this.colors.secondary);
        bankRight.position.set(0, 0.32, 0.2);
        bankRight.rotation.x = -0.3;
        cylinderHeadRight.add(bankRight);
        const valveR = this.createWireBox(0.55, 0.08, 0.2, this.colors.accent);
        valveR.position.set(0, 0.42, 0.22);
        valveR.rotation.x = -0.3;
        cylinderHeadRight.add(valveR);
        engine.add(cylinderHeadRight);
        this.engineParts['cylinder-head-rh'] = cylinderHeadRight;
        
        // === INTAKE MANIFOLD (17xx parts) ===
        const intakeManifold = new THREE.Group();
        intakeManifold.userData = { 
            name: 'intake-manifold', 
            label: 'Intake Manifold',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1701_manifold'
        };
        const intake = this.createWireBox(0.5, 0.15, 0.2, this.colors.secondary);
        intake.position.set(0, 0.45, 0);
        intakeManifold.add(intake);
        const throttle = this.createWireCylinder(0.06, 0.06, 0.08, 12, this.colors.accent);
        throttle.rotation.x = Math.PI / 2;
        throttle.position.set(0.25, 0.45, 0);
        intakeManifold.add(throttle);
        engine.add(intakeManifold);
        this.engineParts['intake-manifold'] = intakeManifold;
        
        // === EXHAUST MANIFOLDS ===
        const exhaustLeft = new THREE.Group();
        exhaustLeft.userData = { 
            name: 'exhaust-manifold-lh', 
            label: 'Exhaust Manifold LH',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1701_manifold'
        };
        const exhL = this.createWireCylinder(0.08, 0.08, 0.25, 8, this.colors.dim);
        exhL.rotation.x = Math.PI / 2;
        exhL.position.set(0, 0.15, -0.45);
        exhaustLeft.add(exhL);
        engine.add(exhaustLeft);
        this.engineParts['exhaust-manifold-lh'] = exhaustLeft;
        
        const exhaustRight = new THREE.Group();
        exhaustRight.userData = { 
            name: 'exhaust-manifold-rh', 
            label: 'Exhaust Manifold RH',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1701_manifold'
        };
        const exhR = this.createWireCylinder(0.08, 0.08, 0.25, 8, this.colors.dim);
        exhR.rotation.x = Math.PI / 2;
        exhR.position.set(0, 0.15, 0.45);
        exhaustRight.add(exhR);
        engine.add(exhaustRight);
        this.engineParts['exhaust-manifold-rh'] = exhaustRight;
        
        // === OIL PAN (15xx parts) ===
        const oilPan = new THREE.Group();
        oilPan.userData = { 
            name: 'oil-pan', 
            label: 'Oil Pan & Pump',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1501_engine-oil-pump'
        };
        const pan = this.createWireBox(0.6, 0.15, 0.5, this.colors.dim);
        pan.position.set(0, -0.32, 0);
        oilPan.add(pan);
        engine.add(oilPan);
        this.engineParts['oil-pan'] = oilPan;
        
        // === TIMING COVER ===
        const timingCover = new THREE.Group();
        timingCover.userData = { 
            name: 'timing-cover', 
            label: 'Timing Cover',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1106_timing-gear-cover-rear-end-plate'
        };
        const timing = this.createWireBox(0.1, 0.4, 0.55, this.colors.secondary);
        timing.position.set(0.4, 0.05, 0);
        timingCover.add(timing);
        engine.add(timingCover);
        this.engineParts['timing-cover'] = timingCover;
        
        // === ALTERNATOR ===
        const alternatorGroup = new THREE.Group();
        alternatorGroup.userData = { 
            name: 'alternator', 
            label: 'Alternator',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1903_alternator'
        };
        const alternator = this.createWireCylinder(0.08, 0.08, 0.1, 12, this.colors.secondary);
        alternator.rotation.x = Math.PI / 2;
        alternator.position.set(-0.2, 0.1, 0.4);
        alternatorGroup.add(alternator);
        const altPulley = this.createWireCylinder(0.06, 0.06, 0.02, 12, this.colors.accent);
        altPulley.rotation.x = Math.PI / 2;
        altPulley.position.set(-0.2, 0.1, 0.46);
        alternatorGroup.add(altPulley);
        engine.add(alternatorGroup);
        this.engineParts['alternator'] = alternatorGroup;
        
        // === STARTER ===
        const starterGroup = new THREE.Group();
        starterGroup.userData = { 
            name: 'starter', 
            label: 'Starter Motor',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1904_starter'
        };
        const starter = this.createWireCylinder(0.06, 0.06, 0.15, 12, this.colors.secondary);
        starter.rotation.z = Math.PI / 2;
        starter.position.set(-0.35, -0.15, 0.25);
        starterGroup.add(starter);
        engine.add(starterGroup);
        this.engineParts['starter'] = starterGroup;
        
        // === WATER PUMP ===
        const waterPump = new THREE.Group();
        waterPump.userData = { 
            name: 'water-pump', 
            label: 'Water Pump',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1601_water-pump'
        };
        const pump = this.createWireCylinder(0.08, 0.08, 0.08, 12, this.colors.secondary);
        pump.position.set(0.38, 0.1, 0);
        waterPump.add(pump);
        engine.add(waterPump);
        this.engineParts['water-pump'] = waterPump;
        
        // === AIR CLEANER ===
        const airCleaner = new THREE.Group();
        airCleaner.userData = { 
            name: 'air-cleaner', 
            label: 'Air Cleaner',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1703_air-cleaner'
        };
        const airBox = this.createWireBox(0.25, 0.15, 0.2, this.colors.dim);
        airBox.position.set(0.15, 0.6, 0.35);
        airCleaner.add(airBox);
        const intakeTube = this.createWireCylinder(0.04, 0.04, 0.15, 8, this.colors.dim);
        intakeTube.rotation.z = Math.PI / 4;
        intakeTube.position.set(0.22, 0.52, 0.2);
        airCleaner.add(intakeTube);
        engine.add(airCleaner);
        this.engineParts['air-cleaner'] = airCleaner;
        
        // === IGNITION COILS ===
        const ignitionSystem = new THREE.Group();
        ignitionSystem.userData = { 
            name: 'ignition-coils', 
            label: 'Ignition Coils & Plugs',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/1901_ignition-coil-spark-plug'
        };
        for (let i = 0; i < 4; i++) {
            const coilL = this.createWireBox(0.04, 0.08, 0.04, this.colors.accent);
            coilL.position.set(-0.15 + i * 0.12, 0.48, -0.22);
            ignitionSystem.add(coilL);
            const coilR = this.createWireBox(0.04, 0.08, 0.04, this.colors.accent);
            coilR.position.set(-0.15 + i * 0.12, 0.48, 0.22);
            ignitionSystem.add(coilR);
        }
        engine.add(ignitionSystem);
        this.engineParts['ignition-coils'] = ignitionSystem;
        
        // === FUEL INJECTION ===
        const fuelInjection = new THREE.Group();
        fuelInjection.userData = { 
            name: 'fuel-injection', 
            label: 'Fuel Injection System',
            category: 'engine',
            japanPartsUrl: 'tool-engine-fuel/2211_fuel-injection-system'
        };
        const fuelRailL = this.createWireCylinder(0.015, 0.015, 0.4, 8, this.colors.accent);
        fuelRailL.rotation.z = Math.PI / 2;
        fuelRailL.position.set(0, 0.35, -0.15);
        fuelInjection.add(fuelRailL);
        const fuelRailR = this.createWireCylinder(0.015, 0.015, 0.4, 8, this.colors.accent);
        fuelRailR.rotation.z = Math.PI / 2;
        fuelRailR.position.set(0, 0.35, 0.15);
        fuelInjection.add(fuelRailR);
        engine.add(fuelInjection);
        this.engineParts['fuel-injection'] = fuelInjection;
        
        // Bellhousing mounting face
        const bellFace = this.createWireCylinder(0.25, 0.25, 0.05, 16, color);
        bellFace.rotation.z = Math.PI / 2;
        bellFace.position.set(-0.37, -0.05, 0);
        engine.add(bellFace);
        
        engine.position.copy(engine.userData.originalPosition);
        this.parts.engine = engine;
        this.parts['engine'] = engine;
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
        this.parts['transmission'] = trans;
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
        this.parts['steering'] = steering;
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
        this.parts['brakes'] = brakes;
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
        this.parts['wheels'] = wheels;
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
        this.parts['interior'] = interior;
        this.vehicleGroup.add(interior);
    }
    
    createExhaust() {
        const exhaust = new THREE.Group();
        exhaust.userData = { name: 'exhaust', originalPosition: new THREE.Vector3(0, 0.4, 0) };
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
        
        exhaust.position.copy(exhaust.userData.originalPosition);
        this.parts['exhaust'] = exhaust;
        this.vehicleGroup.add(exhaust);
    }
    
    createFuelTank() {
        const tank = new THREE.Group();
        tank.userData = { name: 'fuel-tank', originalPosition: new THREE.Vector3(0, 0.4, 0) };
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
        
        tank.position.copy(tank.userData.originalPosition);
        this.parts['fuel-tank'] = tank;
        this.vehicleGroup.add(tank);
    }
    
    createDriveshafts() {
        const ds = new THREE.Group();
        ds.userData = { name: 'driveshafts', originalPosition: new THREE.Vector3(0, 0, 0) };
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
        
        ds.position.copy(ds.userData.originalPosition);
        this.parts['driveshafts'] = ds;
        this.vehicleGroup.add(ds);
    }
    
    createCooling() {
        const cooling = new THREE.Group();
        cooling.userData = { name: 'cooling', originalPosition: new THREE.Vector3(0, 0, 0) };
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
        
        cooling.position.copy(cooling.userData.originalPosition);
        this.parts['cooling'] = cooling;
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
            });
        });
        
        // Setup search functionality
        this.setupSearch();
        
        // Click detection on 3D model
        this.renderer.domElement.addEventListener('click', (event) => this.onCanvasClick(event));
        
        // Hover effect
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onCanvasHover(event));
    }
    
    onCanvasClick(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.vehicleGroup.children, true);
        
        if (intersects.length > 0) {
            // Find which part was clicked
            let clickedObject = intersects[0].object;
            
            // Traverse up to find the part group
            while (clickedObject.parent && clickedObject.parent !== this.vehicleGroup) {
                clickedObject = clickedObject.parent;
            }
            
            // Find the part name
            const partName = this.findPartName(clickedObject);
            if (partName) {
                this.selectPart(partName);
            }
        }
    }
    
    onCanvasHover(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.vehicleGroup.children, true);
        
        if (intersects.length > 0) {
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.renderer.domElement.style.cursor = 'grab';
        }
    }
    
    findPartName(object) {
        // Check if this object is directly in our parts dictionary
        for (const [name, part] of Object.entries(this.parts)) {
            if (part === object) {
                return name;
            }
        }
        
        // Check by matching userData or traverse children
        for (const [name, part] of Object.entries(this.parts)) {
            if (!part) continue;
            let found = false;
            part.traverse(child => {
                if (child === object) found = true;
            });
            if (found) return name;
        }
        
        return null;
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
            'driveshafts': new THREE.Vector3(0, -2, -2),
            'exhaust': new THREE.Vector3(0, -1, 3),
            'fuel-tank': new THREE.Vector3(-2, -2, -2),
            'cooling': new THREE.Vector3(3, 1, 0),
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
        
        // Reset all part colors
        this.resetHighlight();
        this.selectedPart = null;
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
        // Part number formatting
        const formatPartNumber = (num) => num.replace(/-/g, '');
        
        // Japan-Parts.eu category mapping based on part code prefix
        const JAPAN_PARTS_CATEGORIES = {
            // Tool / Engine / Fuel
            '09': 'tool-engine-fuel/0901_standard-tool',
            '11': 'tool-engine-fuel/1101_partial-engine-assembly',
            '12': 'tool-engine-fuel/1201_ventilation-hose',
            '13': 'tool-engine-fuel/1301_crankshaft-piston',
            '15': 'tool-engine-fuel/1501_engine-oil-pump',
            '16': 'tool-engine-fuel/1601_water-pump',
            '17': 'tool-engine-fuel/1701_manifold',
            '19': 'tool-engine-fuel/1901_ignition-coil-spark-plug',
            '22': 'tool-engine-fuel/2211_fuel-injection-system',
            '23': 'electrical/8201_battery-battery-cable',
            // Powertrain / Chassis
            '33': 'powertrain-chassis/3312_shift-lever-retainer',
            '35': 'powertrain-chassis/3501_transaxle-or-transmission-assy-gasket-kit-atm',
            '36': 'powertrain-chassis/3608_transfer-assembly-gasket-kit',
            '37': 'powertrain-chassis/3701_propeller-shaft-universal-joint',
            '41': 'powertrain-chassis/4101_rear-axle-housing-differential',
            '42': 'powertrain-chassis/4102_rear-axle-shaft-hub',
            '43': 'powertrain-chassis/4301_front-axle-housing-differential',
            '44': 'powertrain-chassis/4701_brake-pedal-bracket',
            '45': 'powertrain-chassis/4501_steering-column-shaft',
            '46': 'powertrain-chassis/4601_parking-brake-cable',
            '47': 'powertrain-chassis/4701_brake-pedal-bracket',
            '48': 'powertrain-chassis/4802_front-axle-arm-steering-knuckle',
            '49': 'powertrain-chassis/4804_rear-spring-shock-absorber',
            // Body
            '51': 'body/5151_frame',
            '52': 'body/5251_cab-mounting-body-mounting',
            '53': 'body/5351_radiator-grille',
            '55': 'body/5551_instrument-panel-glove-compartment',
            '58': 'body/5851_front-floor-panel-front-floor-member',
            '61': 'body/6151_side-member',
            '62': 'body/6152_side-window',
            '64': 'body/6451_inside-trim-board',
            '67': 'body/6751_front-door-panel-glass',
            '68': 'body/6761_back-door-panel-glass',
            '69': 'body/6765_lock-cylinder-set',
            '71': 'body/7151_seat-seat-track',
            '72': 'body/7152_seat-belt',
            '73': 'body/7152_seat-belt',
            '74': 'body/7451_armrest-visor',
            '75': 'body/7551_emblem-name-plate',
            '76': 'body/7652_spoiler-side-mudguard',
            '77': 'body/7751_fuel-tank-tube',
            '78': 'body/7851_accelerator-link',
            // Electrical
            '81': 'electrical/8101_headlamp',
            '82': 'electrical/8201_battery-battery-cable',
            '83': 'electrical/8301_meter',
            '84': 'electrical/8401_switch-relay-computer',
            '85': 'electrical/8501_windshield-wiper',
            '86': 'electrical/8601_radio-receiver-amplifier-condenser',
            '87': 'electrical/8701_mirror',
            '88': 'electrical/8712_heating-air-conditioning-heater-unit-blower',
            '89': 'electrical/8421_air-bag',
            '90': 'electrical/8401_switch-relay-computer'
        };
        
        // Get japan-parts.eu URL for a part
        const getBuyUrl = (partNum, partCode) => {
            const baseUrl = 'https://www.japan-parts.eu/toyota/eu/2007/land-cruiser-100/uzj100l-gnaeka/3_791450_002_';
            
            // Get prefix from code or part number
            let prefix = '';
            if (partCode && partCode.length >= 2) {
                prefix = partCode.substring(0, 2);
            } else if (partNum) {
                prefix = partNum.replace(/-/g, '').substring(0, 2);
            }
            
            // Find matching category
            const category = JAPAN_PARTS_CATEGORIES[prefix];
            if (category) {
                return `${baseUrl}/${category}`;
            }
            
            // Fallback to base catalog
            return 'https://www.japan-parts.eu/toyota/eu/2007/land-cruiser-100/uzj100l-gnaeka';
        };
        
        document.getElementById('info-title').textContent = info.title;
        
        // Show sub-components if available
        const subContainer = document.getElementById('sub-components');
        subContainer.innerHTML = '';
        
        // Check for engine sub-components
        if (partName === 'engine' && this.engineParts) {
            const baseUrl = 'https://www.japan-parts.eu/toyota/eu/2007/land-cruiser-100/uzj100l-gnaeka/3_791450_002_';
            Object.values(this.engineParts).forEach(subPart => {
                const data = subPart.userData;
                if (data && data.label) {
                    const btn = document.createElement('button');
                    btn.className = 'sub-btn';
                    btn.innerHTML = `<a class="sub-link" href="${baseUrl}/${data.japanPartsUrl}" target="_blank">${data.label}</a>`;
                    btn.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('sub-link')) {
                            e.preventDefault();
                            this.highlightSubComponent(subPart);
                            document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                        }
                    });
                    subContainer.appendChild(btn);
                }
            });
        }
        
        // Build description with parts list
        let html = info.description;
        
        if (info.parts && info.parts.length > 0) {
            html += `<div class="part-list">
                <div class="part-list-title">PART NUMBERS:</div>`;
            info.parts.forEach((p, idx) => {
                html += `<div class="part-item" data-part-idx="${idx}" data-part-name="${p.name}" data-part-number="${p.number}">
                    <span class="part-name">${p.name}</span>
                    <span class="part-number">${p.number}</span>
                    <a href="${getBuyUrl(p.number, p.code)}" target="_blank" class="buy-link" onclick="event.stopPropagation()">BUY</a>
                </div>`;
            });
            html += '</div>';
        }
        
        document.getElementById('info-desc').innerHTML = html;
        
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
        
        // Zoom to part with smooth animation
        if (part?.userData?.originalPosition) {
            const pos = this.isExploded ? part.position.clone() : part.userData.originalPosition.clone();
            // Calculate zoom distance based on part
            const zoomDistance = 6;
            const offset = new THREE.Vector3(zoomDistance, zoomDistance * 0.6, zoomDistance);
            this.animateTo(this.camera.position, pos.clone().add(offset), 800);
            this.animateTo(this.controls.target, pos, 800);
        }
        
        // Update button states
        document.querySelectorAll('.part-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.part === partName);
        });
        
        // Add click handlers for individual parts in the list
        // Clicking a part row selects it and highlights it
        document.querySelectorAll('.part-item').forEach(item => {
            item.addEventListener('click', function(e) {
                // If clicking the BUY link, let it handle the navigation
                if (e.target.classList.contains('buy-link')) return;
                
                // Remove previous selection
                document.querySelectorAll('.part-item').forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    }
    
    highlightPart(selectedName) {
        Object.entries(this.parts).forEach(([name, part]) => {
            if (!part) return;
            const isSelected = name === selectedName;
            part.traverse(child => {
                if (child.material) {
                    if (isSelected) {
                        // Bright highlight for selected part
                        child.material.color.setHex(this.colors.accent);
                        if (child.material.linewidth !== undefined) {
                            child.material.linewidth = 2;
                        }
                        child.material.opacity = 1.0;
                    } else {
                        // Dim other parts
                        child.material.color.setHex(this.colors.dim);
                        if (child.material.linewidth !== undefined) {
                            child.material.linewidth = 1;
                        }
                        child.material.opacity = 0.4;
                    }
                    child.material.transparent = true;
                    child.material.needsUpdate = true;
                }
            });
        });
    }
    
    highlightSubComponent(subPart) {
        // First dim all engine parts
        if (this.engineParts) {
            Object.values(this.engineParts).forEach(part => {
                part.traverse(child => {
                    if (child.material) {
                        child.material.color.setHex(this.colors.dim);
                        child.material.opacity = 0.3;
                        child.material.transparent = true;
                        child.material.needsUpdate = true;
                    }
                });
            });
        }
        
        // Highlight the selected sub-component
        subPart.traverse(child => {
            if (child.material) {
                child.material.color.setHex(this.colors.accent);
                child.material.opacity = 1.0;
                child.material.transparent = true;
                child.material.needsUpdate = true;
            }
        });
        
        // Zoom to the sub-component
        const box = new THREE.Box3().setFromObject(subPart);
        const center = box.getCenter(new THREE.Vector3());
        const worldCenter = subPart.parent.localToWorld(center.clone());
        
        const offset = new THREE.Vector3(2, 1.5, 2);
        this.animateTo(this.camera.position, worldCenter.clone().add(offset), 600);
        this.animateTo(this.controls.target, worldCenter, 600);
    }
    
    resetHighlight() {
        Object.entries(this.parts).forEach(([name, part]) => {
            if (!part) return;
            part.traverse(child => {
                if (child.material) {
                    child.material.color.setHex(this.colors.primary);
                    child.material.opacity = 1.0;
                    child.material.transparent = false;
                    child.material.needsUpdate = true;
                }
            });
        });
    }
    
    getPartInfo(name) {
        const data = {
            'chassis': {
                title: 'CHASSIS FRAME - J100',
                description: `
                    <strong>TYPE:</strong> Ladder frame, box-section steel<br><br>
                    <strong>SPECIFICATIONS:</strong><br>
                    • Wheelbase: 2,850mm<br>
                    • Overall length: 4,890mm<br>
                    • Overall width: 1,940mm<br>
                    • Ground clearance: 220mm<br><br>
                    <strong>CONSTRUCTION:</strong><br>
                    • High-tensile steel rails<br>
                    • 7 cross-members<br>
                    • E-coat corrosion protection<br>
                    • Body mount isolation bushings
                `,
                parts: [
                    { name: 'Frame Assembly', number: '51100-60210' },
                    { name: 'Frame Cross Member #1', number: '51205-60100' },
                    { name: 'Frame Cross Member #2', number: '51206-60080' },
                    { name: 'Body Mount Cushion', number: '52205-60050' },
                    { name: 'Frame Side Rail RH', number: '51101-60150' },
                    { name: 'Frame Side Rail LH', number: '51102-60140' }
                ]
            },
            'body': {
                title: 'BODY PANELS - J100',
                description: `
                    <strong>TYPE:</strong> Steel body-on-frame SUV<br><br>
                    <strong>VARIANTS:</strong><br>
                    • UZJ100: V8 Petrol (2UZ-FE)<br>
                    • HDJ100: Diesel (1HD-FTE)<br>
                    • FZJ100: 6-cyl Petrol (1FZ-FE)<br><br>
                    <strong>DIMENSIONS:</strong><br>
                    • Length: 4,890mm | Width: 1,940mm | Height: 1,890mm
                `,
                parts: [
                    { name: 'Hood Assembly', number: '53301-60550' },
                    { name: 'Front Fender RH', number: '53811-60700' },
                    { name: 'Front Fender LH', number: '53812-60680' },
                    { name: 'Front Door RH', number: '67001-60590' },
                    { name: 'Front Door LH', number: '67002-60570' },
                    { name: 'Rear Door RH', number: '67003-60410' },
                    { name: 'Rear Door LH', number: '67004-60390' },
                    { name: 'Back Door Assembly', number: '67005-60691' },
                    { name: 'Front Bumper Cover', number: '52119-60918' },
                    { name: 'Rear Bumper Cover', number: '52159-60916' },
                    { name: 'Grille Assembly', number: '53111-60490' }
                ]
            },
            'engine': {
                title: 'ENGINE - 2UZ-FE V8',
                description: `
                    <strong>TYPE:</strong> 4.7L DOHC V8 Petrol<br><br>
                    <strong>SPECIFICATIONS:</strong><br>
                    • Displacement: 4,664cc<br>
                    • Bore x Stroke: 94 x 84mm<br>
                    • Compression: 10.0:1<br>
                    • Power: 175kW @ 4,800rpm<br>
                    • Torque: 434Nm @ 3,400rpm
                `,
                parts: [
                    { name: 'Engine Assembly 2UZ-FE', number: '19000-50470' },
                    { name: 'Cylinder Head RH', number: '11101-59327' },
                    { name: 'Cylinder Head LH', number: '11102-59276' },
                    { name: 'Cylinder Block', number: '11401-59755' },
                    { name: 'Intake Manifold', number: '17109-50101' },
                    { name: 'Exhaust Manifold RH', number: '17104-50140' },
                    { name: 'Exhaust Manifold LH', number: '17105-50110' },
                    { name: 'Timing Chain', number: '13506-50030' },
                    { name: 'Water Pump', number: '16100-59275' },
                    { name: 'Oil Pump', number: '15100-50050' },
                    { name: 'Spark Plug (each)', number: '90919-01194' }
                ]
            },
            'transmission': {
                title: 'TRANSMISSION & TRANSFER',
                description: `
                    <strong>AUTO (A750F/A750E) 5-Speed:</strong><br>
                    • 1st: 3.520 | 2nd: 2.042<br>
                    • 3rd: 1.400 | 4th: 1.000<br>
                    • 5th: 0.716 | Rev: 3.224<br><br>
                    <strong>MANUAL (H151F) 5-Speed:</strong><br>
                    • 1st: 4.313 | 2nd: 2.330<br>
                    • 3rd: 1.436 | 4th: 1.000<br>
                    • 5th: 0.838 | Rev: 4.220<br><br>
                    <strong>TRANSFER (Full-Time 4WD):</strong><br>
                    • Type: VF2A / VF2BM<br>
                    • Center diff lock: Viscous/Electric<br>
                    • Low range: 2.488:1<br>
                    • High range: 1.000:1<br><br>
                    <strong>CLUTCH (Manual):</strong><br>
                    • Disc diameter: 300mm | Hydraulic release
                `,
                parts: [
                    { name: 'Transmission A750F', number: '35010-60A30' },
                    { name: 'Transfer Case VF2A', number: '36100-60590' },
                    { name: 'Torque Converter', number: '32000-60050' },
                    { name: 'ATF Filter', number: '35330-60050' },
                    { name: 'Trans Oil Pan Gasket', number: '35168-60010' },
                    { name: 'Transfer Shift Lever', number: '33505-60100' }
                ]
            },
            'front-axle': {
                title: 'FRONT AXLE - IFS',
                description: `
                    <strong>TYPE:</strong> Independent front suspension<br>
                    • Double wishbone (high-mount)<br>
                    • Torsion bar springs<br>
                    • Ratio: 3.909:1 or 4.100:1
                `,
                parts: [
                    { name: 'Front Differential Carrier', number: '41110-60820' },
                    { name: 'Front Axle Shaft RH', number: '43030-60040' },
                    { name: 'Front Axle Shaft LH', number: '43040-60020' },
                    { name: 'CV Joint Boot Kit', number: '04427-60100' },
                    { name: 'Upper Control Arm RH', number: '48610-60050' },
                    { name: 'Upper Control Arm LH', number: '48640-60010' },
                    { name: 'Lower Control Arm RH', number: '48068-60030' },
                    { name: 'Lower Control Arm LH', number: '48069-60020' },
                    { name: 'Torsion Bar RH', number: '48131-60140' },
                    { name: 'Front Shock Absorber', number: '48510-69505' },
                    { name: 'Steering Knuckle RH', number: '43211-60120' }
                ]
            },
            'rear-axle': {
                title: 'REAR AXLE - LIVE',
                description: `
                    <strong>TYPE:</strong> Semi-floating live axle<br>
                    • 4-link coil spring<br>
                    • Ratio: 3.909:1 or 4.100:1<br>
                    • Electric rear locker (option)
                `,
                parts: [
                    { name: 'Rear Axle Housing', number: '42110-60760' },
                    { name: 'Rear Differential Carrier', number: '41110-60770' },
                    { name: 'Rear Axle Shaft RH', number: '42311-60200' },
                    { name: 'Rear Axle Shaft LH', number: '42312-60160' },
                    { name: 'Rear Coil Spring', number: '48231-60730' },
                    { name: 'Rear Shock Absorber', number: '48531-69445' },
                    { name: 'Lateral Control Rod', number: '48740-60070' },
                    { name: 'Upper Control Arm', number: '48790-60010' },
                    { name: 'Lower Control Arm', number: '48710-60070' },
                    { name: 'Differential Lock Actuator', number: '41303-60030' }
                ]
            },
            'steering': {
                title: 'STEERING SYSTEM',
                description: `
                    <strong>TYPE:</strong> Recirculating ball, power assisted<br>
                    • Turns lock-to-lock: 4.2<br>
                    • Turning radius: 6.7m
                `,
                parts: [
                    { name: 'Steering Gear Box', number: '44110-60212' },
                    { name: 'Power Steering Pump', number: '44320-60370' },
                    { name: 'Steering Column', number: '45250-60120' },
                    { name: 'Pitman Arm', number: '45401-60090' },
                    { name: 'Relay Rod', number: '45450-60060' },
                    { name: 'Tie Rod End RH', number: '45046-69235' },
                    { name: 'Tie Rod End LH', number: '45047-69105' },
                    { name: 'Steering Damper', number: '45700-60060' },
                    { name: 'PS Reservoir', number: '44360-60120' },
                    { name: 'Steering Wheel', number: '45100-60590' }
                ]
            },
            'brakes': {
                title: 'BRAKE SYSTEM',
                description: `
                    <strong>FRONT:</strong> Ventilated discs 319mm, Twin-piston<br>
                    <strong>REAR:</strong> Solid discs 322mm<br>
                    • ABS standard | EBD equipped
                `,
                parts: [
                    { name: 'Front Brake Rotor', number: '43512-60150' },
                    { name: 'Front Brake Pad Set', number: '04465-60280' },
                    { name: 'Front Brake Caliper RH', number: '47730-60280' },
                    { name: 'Front Brake Caliper LH', number: '47750-60200' },
                    { name: 'Rear Brake Rotor', number: '42431-60290' },
                    { name: 'Rear Brake Pad Set', number: '04466-60090' },
                    { name: 'Rear Brake Caliper', number: '47830-60061' },
                    { name: 'Brake Master Cylinder', number: '47201-60570' },
                    { name: 'Brake Booster', number: '44610-60760' },
                    { name: 'ABS Actuator', number: '44050-60100' }
                ]
            },
            'wheels': {
                title: 'WHEELS & TIRES',
                description: `
                    <strong>WHEELS:</strong> 16x8J, PCD 5x150mm<br>
                    <strong>TIRES:</strong> 275/70R16
                `,
                parts: [
                    { name: 'Alloy Wheel 16x8', number: '42611-60A00' },
                    { name: 'Steel Wheel 16x8', number: '42601-60490' },
                    { name: 'Wheel Nut', number: '90942-01058' },
                    { name: 'Wheel Hub RH Front', number: '43502-60120' },
                    { name: 'Wheel Hub LH Front', number: '43512-60070' },
                    { name: 'Wheel Bearing Front', number: '90369-54001' },
                    { name: 'Wheel Bearing Rear', number: '90366-40068' },
                    { name: 'TPMS Sensor', number: '42607-60010' },
                    { name: 'Spare Tire Carrier', number: '51900-60150' }
                ]
            },
            'driveshafts': {
                title: 'PROPELLER SHAFTS',
                description: `
                    <strong>FRONT:</strong> 2-piece, center bearing<br>
                    <strong>REAR:</strong> Single piece, double cardan
                `,
                parts: [
                    { name: 'Front Propeller Shaft', number: '37140-60390' },
                    { name: 'Rear Propeller Shaft', number: '37110-60820' },
                    { name: 'Center Bearing Support', number: '37230-60130' },
                    { name: 'Universal Joint Front', number: '04371-60070' },
                    { name: 'Universal Joint Rear', number: '04371-60050' },
                    { name: 'Propeller Shaft Flange', number: '41303-35040' },
                    { name: 'Drive Shaft Dust Boot', number: '04438-60020' }
                ]
            },
            'exhaust': {
                title: 'EXHAUST SYSTEM',
                description: `
                    <strong>COMPONENTS:</strong> Cast manifolds, dual cats<br>
                    • Pipe diameter: 2.5" | Rear exit
                `,
                parts: [
                    { name: 'Exhaust Manifold RH', number: '17104-50140' },
                    { name: 'Exhaust Manifold LH', number: '17105-50110' },
                    { name: 'Catalytic Converter RH', number: '17410-50290' },
                    { name: 'Catalytic Converter LH', number: '17420-50170' },
                    { name: 'Center Exhaust Pipe', number: '17420-50210' },
                    { name: 'Muffler Assembly', number: '17430-50310' },
                    { name: 'Tail Pipe', number: '17405-50170' },
                    { name: 'Exhaust Gasket', number: '17451-50020' },
                    { name: 'O2 Sensor Front', number: '89467-60010' },
                    { name: 'O2 Sensor Rear', number: '89465-60150' }
                ]
            },
            'fuel-tank': {
                title: 'FUEL SYSTEM',
                description: `
                    <strong>MAIN TANK:</strong> 96 liters, steel<br>
                    <strong>SUB TANK:</strong> 45 liters (option)
                `,
                parts: [
                    { name: 'Fuel Tank Main', number: '77001-60820' },
                    { name: 'Fuel Tank Sub', number: '77002-60180' },
                    { name: 'Fuel Pump Assembly', number: '23220-50130' },
                    { name: 'Fuel Filter', number: '23300-50090' },
                    { name: 'Fuel Sender Gauge', number: '83320-60450' },
                    { name: 'Fuel Tank Cap', number: '77310-52010' },
                    { name: 'Fuel Filler Pipe', number: '77201-60310' },
                    { name: 'Fuel Injector', number: '23209-50090' },
                    { name: 'Fuel Pressure Regulator', number: '23280-50040' }
                ]
            },
            'cooling': {
                title: 'COOLING SYSTEM',
                description: `
                    <strong>RADIATOR:</strong> Aluminum core, ~12L capacity<br>
                    <strong>THERMOSTAT:</strong> 82°C opening
                `,
                parts: [
                    { name: 'Radiator Assembly', number: '16400-50280' },
                    { name: 'Radiator Cap', number: '16401-20353' },
                    { name: 'Cooling Fan', number: '16361-50100' },
                    { name: 'Fan Clutch', number: '16210-50100' },
                    { name: 'Water Pump', number: '16100-59275' },
                    { name: 'Thermostat', number: '90916-03100' },
                    { name: 'Upper Radiator Hose', number: '16571-50170' },
                    { name: 'Lower Radiator Hose', number: '16572-50090' },
                    { name: 'Coolant Reservoir', number: '16470-50220' },
                    { name: 'Heater Core', number: '87107-60120' }
                ]
            },
            'interior': {
                title: 'INTERIOR & SYSTEMS',
                description: `
                    <strong>A/C:</strong> Dual-zone, R-134a<br>
                    <strong>SRS:</strong> Driver/Pass front, side, curtain airbags
                `,
                parts: [
                    { name: 'Dashboard Assembly', number: '55300-60040' },
                    { name: 'Instrument Cluster', number: '83800-60B20' },
                    { name: 'Steering Column', number: '45250-60120' },
                    { name: 'Driver Seat Assembly', number: '71100-60740' },
                    { name: 'A/C Compressor', number: '88320-60720' },
                    { name: 'A/C Condenser', number: '88460-60350' },
                    { name: 'Evaporator Core', number: '88501-60260' },
                    { name: 'Blower Motor', number: '87103-60190' },
                    { name: 'Driver Airbag Module', number: '45130-60100' },
                    { name: 'ECU Engine Control', number: '89661-60B40' }
                ]
            }
        };
        
        // Use external PARTS_DATABASE if available, otherwise fall back to inline data
        if (typeof PARTS_DATABASE !== 'undefined' && PARTS_DATABASE[name]) {
            return PARTS_DATABASE[name];
        }
        return data[name] || { title: name.toUpperCase(), description: 'Component information not available.', parts: [] };
    }
    
    // Parts database for search
    getAllParts() {
        const allParts = [];
        const categories = ['chassis', 'body', 'engine', 'transmission', 'front-axle', 'rear-axle', 
                           'steering', 'brakes', 'wheels', 'driveshafts', 'exhaust', 'fuel-tank', 'cooling', 'interior'];
        
        categories.forEach(cat => {
            const info = this.getPartInfo(cat);
            if (info.parts) {
                info.parts.forEach(part => {
                    allParts.push({
                        category: cat,
                        categoryTitle: info.title,
                        name: part.name,
                        number: part.number
                    });
                });
            }
        });
        return allParts;
    }
    
    searchParts(query) {
        if (!query || query.length < 2) return [];
        query = query.toLowerCase();
        return this.getAllParts().filter(part => 
            part.name.toLowerCase().includes(query) || 
            part.number.toLowerCase().includes(query) ||
            part.categoryTitle.toLowerCase().includes(query)
        ).slice(0, 10);
    }
    
    setupSearch() {
        const searchInput = document.getElementById('part-search');
        const searchResults = document.getElementById('search-results');
        const self = this;
        
        searchInput.addEventListener('input', function() {
            const results = self.searchParts(this.value);
            if (results.length > 0) {
                searchResults.innerHTML = results.map(r => `
                    <div class="search-result-item" data-category="${r.category}">
                        <div>${r.name}</div>
                        <div class="part-number">${r.number}</div>
                    </div>
                `).join('');
                searchResults.classList.add('visible');
                
                // Add click handlers
                searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const cat = this.dataset.category;
                        self.selectPart(cat);
                        searchResults.classList.remove('visible');
                        searchInput.value = '';
                    });
                });
            } else {
                searchResults.classList.remove('visible');
            }
        });
        
        searchInput.addEventListener('blur', function() {
            setTimeout(() => searchResults.classList.remove('visible'), 200);
        });
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

// Initialize with error handling
window.addEventListener('DOMContentLoaded', function() {
    try {
        new LandCruiserBlueprint();
    } catch(e) {
        console.error('Failed to initialize:', e);
        var loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = '<p style="color: #ff6666;">Failed to initialize 3D view.<br>' + e.message + '</p>';
        }
    }
});
