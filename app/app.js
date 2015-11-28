(function() {

    var scene, camera, renderer;
    var intersected = null;

    var mouse = new THREE.Vector2();
    var mouseDown = false;
    var mouseUp = true;

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onMouseDown(event) {
        mouseUp = false;
        mouseDown = true;
    }

    function onMouseUp(event) {
        mouseDown = false;
        mouseUp = true;
    }

    var nodes = [];

    function createNode(posX, posY, posZ) {
        // Main cube:
        var cubeWidth = 100,
            cubeHeight = 200,
            cubeDepth = 10;
        var cubeGeometry = new THREE.CubeGeometry(cubeWidth, cubeHeight, cubeDepth);
        var material = new THREE.MeshBasicMaterial({
            color: 0xF0C808,
        });
        var cube = new THREE.Mesh(cubeGeometry, material);
        cube.position.set(posX, posY, posZ);
        cube.userData.type = 'main';

        cube.userData.filled = false;
        cube.userData.fill = function() {
            if (cube.userData.filler.scale.y <= cube.scale.y + .01) {
                cube.userData.filler.visible = true;
                cube.userData.filler.scale.y += .01;
                // Fill from bottom:
                cube.userData.filler.position.y += (.01 * cubeHeight / 2);
            } else {
                cube.userData.filled = true;
            }
        }

        cube.userData.highlight = function() {
            cube.userData.outline.visible = true;
        }

        cube.userData.unHighlight = function() {
            cube.userData.outline.visible = false;
        }

        cube.userData.connectors = {};
        cube.userData.connectedNodes = [];
        cube.userData.connectTo = function(mesh) {
            var connector = createConnector(cube, mesh);
            cube.userData.connectors[cube.id + 'to' + mesh.id] = connector;
            cube.userData.connectedNodes.push(mesh);
            mesh.userData.connectors[mesh.id + 'to' + cube.id] = connector;
            mesh.userData.connectedNodes.push(cube);
            return connector;
        }

        cube.userData.fillTo = function(mesh) {
            cube.userData.connectors[cube.id + 'to' + mesh.id].userData.fill(cube, mesh);
        }

        cube.userData.animate = function() {
            if (cube.userData.filled) {
                _.each(cube.userData.connectedNodes, function(connectedNode) {
                    cube.userData.fillTo(connectedNode);
                });
            } else {
                _.each(cube.userData.connectedNodes, function(connectedNode) {
                    if (connectedNode.userData.connectors[connectedNode.id + 'to' + cube.id].userData.filled) {
                        cube.userData.fill();
                    }
                })
            }
        }

        nodes.push(cube);
        scene.add(cube);

        // Hover outline:
        var outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x06AED5,
            side: THREE.BackSide
        });
        var outlineMesh = new THREE.Mesh(cubeGeometry, outlineMaterial);
        outlineMesh.position.set(cube.position.x, cube.position.y, cube.position.z)
        outlineMesh.scale.multiplyScalar(1.10);
        outlineMesh.userData.type = 'outline';
        scene.add(outlineMesh);
        outlineMesh.visible = false;
        outlineMesh.userData.parent = cube;
        cube.userData.outline = outlineMesh;
        outlineMesh.userData.fill = function() {
            outlineMesh.userData.parent.userData.fill();
        }
        outlineMesh.userData.highlight = function() {
            outlineMesh.visible = true;
        }
        outlineMesh.userData.unHighlight = function() {
            outlineMesh.visible = false;
        }

        // Fill cube:
        var fillMaterial = new THREE.MeshBasicMaterial({
            color: 0x086788,
        });
        var fillMesh = new THREE.Mesh(cubeGeometry, fillMaterial);
        fillMesh.position.set(cube.position.x, cube.position.y, cube.position.z)
        fillMesh.position.y -= cubeHeight / 2;
        fillMesh.scale.y = .01;
        fillMesh.scale.multiplyScalar(1.01);
        fillMesh.userData.type = 'fill';
        scene.add(fillMesh);
        fillMesh.visible = false;
        fillMesh.userData.parent = cube;
        cube.userData.filler = fillMesh;
        fillMesh.userData.fill = function() {
            fillMesh.userData.parent.userData.fill();
        }
        fillMesh.userData.highlight = function() {
            fillMesh.userData.parent.userData.outline.visible = true;
        }
        fillMesh.userData.unHighlight = function() {
            fillMesh.userData.parent.userData.outline.visible = false;
        }

        return cube
    }

    var CONNECTOR_FILL_SPEED = 2;

    function createConnector(fromNode, toNode) {
        var startPos = fromNode.position;
        var endPos = toNode.position;
        // Connector:
        var material = new THREE.LineBasicMaterial({
            color: 0xF0C808,
            linewidth: 10,
        });
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            startPos.clone(),
            endPos.clone()
        );
        var line = new THREE.Line(geometry, material);

        line.userData.filled = false;

        line.userData.fill = function(fromNode, toNode) {
            var startPos = fromNode.position.clone();
            var endPos = toNode.position.clone();
            var filler = line.userData.fillers[fromNode.id];
            var dir = endPos.clone().sub(startPos).normalize();
            var totalLength = endPos.distanceTo(startPos);
            var currentLength = filler.geometry.vertices[0].distanceTo(
                filler.geometry.vertices[1])
            if (currentLength < totalLength) {
                filler.geometry.vertices[1].add(
                    dir.multiplyScalar(CONNECTOR_FILL_SPEED))
                filler.geometry.verticesNeedUpdate = true;
            } else {
                filler.geometry.verticesNeedUpdate = false;
                line.userData.filled = true;
            }
        }

        line.userData.highlight = function() {}
        line.userData.unHighlight = function() {}
        scene.add(line);

        line.userData.fillers = {};

        // Connector fill start:
        var fillStartMaterial = new THREE.LineBasicMaterial({
            color: 0x086788,
            linewidth: 10,
        });
        var fillStartGeometry = new THREE.Geometry();
        fillStartGeometry.vertices.push(
            startPos.clone(),
            startPos.clone()
        );
        var fillStartLine = new THREE.Line(fillStartGeometry, fillStartMaterial);
        fillStartLine.userData.fill = function() {}
        fillStartLine.userData.highlight = function() {}
        fillStartLine.userData.unHighlight = function() {}
        scene.add(fillStartLine);

        line.userData.fillers[fromNode.id] = fillStartLine;
        fillStartLine.userData.parent = line;

        // Connector filler end:
        var fillEndMaterial = new THREE.LineBasicMaterial({
            color: 0x086788,
            linewidth: 10,
        });
        var fillEndGeometry = new THREE.Geometry();
        fillEndGeometry.vertices.push(
            endPos.clone(),
            endPos.clone()
        );
        var fillEndLine = new THREE.Line(fillEndGeometry, fillEndMaterial);
        fillEndLine.userData.fill = function() {}
        fillEndLine.userData.highlight = function() {}
        fillEndLine.userData.unHighlight = function() {}
        scene.add(fillEndLine);

        line.userData.fillers[toNode.id] = fillEndLine;
        fillEndLine.userData.parent = line;

        return line;
    }


    function init() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1000;

        mesh = createNode(0, 0, 0);
        mesh2 = createNode(500, 500, 0);
        mesh3 = createNode(-500, 500, 0);
        mesh.userData.connectTo(mesh2);
        mesh.userData.connectTo(mesh3);
        mesh2.userData.connectTo(mesh3);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xfff1d0, 1);

        document.body.appendChild(renderer.domElement);
        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    }

    function animate() {
        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
        vector.unproject(camera);
        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        var intersects = ray.intersectObjects(scene.children);
        if (intersects.length > 0) {
            intersected = intersects[0];
            intersected.object.userData.highlight();
            if (mouseDown) {
                intersected.object.userData.fill();
            }
        } else {
            if (intersected != null) {
                intersected.object.userData.unHighlight();
            }
        }

        _.each(nodes, function(el) {
            el.userData.animate();
        })

        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    init();
    animate();
})();
