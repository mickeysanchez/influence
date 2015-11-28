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
