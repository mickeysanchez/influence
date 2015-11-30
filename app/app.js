// https://coolors.co/app/06aed5-086788-f0c808-fff1d0-dd1c1a

angular.module('influence', [])
    .controller('gameController', function($scope) {

        var scene, camera, renderer, controls;
        var startTime = new Date();
        var intersected = null;

        var mouse = new THREE.Vector2();
        var mouseDown = false;
        var mouseUp = true;
        var rightMouseDown = false;

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
            rightMouseDown = false;
            mouseUp = true;
        }

        function onRightMouseDown(event) {
            event.preventDefault();
            rightMouseDown = true;
            return false;
        }

        NODE_FILL_SPEED = 0.05;
        var nodes = [];

        function createNode(posX, posY, posZ) {
            // Main cube:
            var cubeWidth = 100,
                cubeHeight = 200,
                cubeDepth = 10;
            var cubeGeometry = new THREE.CubeGeometry(cubeWidth, cubeHeight, cubeDepth);
            var material = new THREE.MeshBasicMaterial({
                color: 0xF0C808
            });
            var cube = new THREE.Mesh(cubeGeometry, material);
            cube.position.set(posX, posY, posZ);
            cube.userData.type = 'main';

            cube.userData.filled = false;
            cube.userData.fill = function(colorHex) {
                cube.userData.filler.material.color.setHex(
                    colorHex
                )
                if (cube.userData.filler.scale.y <= cube.scale.y + .01) {
                    cube.userData.filler.visible = true;
                    cube.userData.filler.scale.y += NODE_FILL_SPEED;
                    // Fill from bottom:
                    cube.userData.filler.position.y += (NODE_FILL_SPEED * cubeHeight / 2);
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
                        var connector = connectedNode.userData.connectors[
                            connectedNode.id + 'to' + cube.id];
                        if (connector.userData.filled) {
                            cube.userData.fill(connector.userData.filledColor);
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
                outlineMesh.userData.parent.userData.fill(
                    outlineMesh.userData.parent.userData.filler.material.color.getHex());
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
                fillMesh.userData.parent.userData.fill(
                    fillMesh.userData.parent.userData.filler.material.color.getHex());
            }
            fillMesh.userData.highlight = function() {
                fillMesh.userData.parent.userData.outline.visible = true;
            }
            fillMesh.userData.unHighlight = function() {
                fillMesh.userData.parent.userData.outline.visible = false;
            }

            return cube
        }

        var CONNECTOR_LINE_WIDTH = 2;
        var CONNECTOR_FILL_SPEED = 5;

        function createConnector(fromNode, toNode) {
            var startPos = fromNode.position;
            var endPos = toNode.position;
            // Connector:
            var material = new THREE.LineBasicMaterial({
                color: 0xF0C808,
                linewidth: CONNECTOR_LINE_WIDTH
            });
            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                startPos.clone(),
                endPos.clone()
            );
            var line = new THREE.Line(geometry, material);

            line.userData.filled = false;

            line.userData.fill = function(fromNode, toNode) {
                if (fromNode.position == undefined) return;
                var startPos = fromNode.position.clone();
                var endPos = toNode.position.clone();
                var filler = line.userData.fillers[fromNode.id];
                var dir = endPos.clone().sub(startPos).normalize();
                var totalLength = endPos.distanceTo(startPos);
                // var currentLength = filler.geometry.vertices[0].distanceTo(
                //     filler.geometry.vertices[1]);
                var currentLength = _.reduce(line.userData.fillers, function(memo, filler) {
                    return memo + filler.geometry.vertices[0].distanceTo(
                        filler.geometry.vertices[1]);;
                }, 0);
                filler.material.color.setHex(
                    fromNode.userData.filler.material.color.getHex());
                if (currentLength < totalLength) {
                    filler.geometry.vertices[1].add(
                        dir.multiplyScalar(CONNECTOR_FILL_SPEED));
                    filler.geometry.verticesNeedUpdate = true;
                } else {
                    filler.geometry.verticesNeedUpdate = false;
                    line.userData.filled = true;
                    line.userData.filledColor = filler.material.color.getHex();
                }
            }

            line.userData.highlight = function() {}
            line.userData.unHighlight = function() {}
            scene.add(line);

            line.userData.fillers = {};

            // Connector fill start:
            var fillStartMaterial = new THREE.LineBasicMaterial({
                color: 0x086788,
                linewidth: CONNECTOR_LINE_WIDTH
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
                linewidth: CONNECTOR_LINE_WIDTH
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

        var NUM_NODES = 15;

        function generateWeb() {
            var nodes = [];
            while (nodes.length < NUM_NODES) {
                var node = createNode(
                    chance.floating({
                        min: -2000,
                        max: 2000
                    }), chance.floating({
                        min: -1000,
                        max: 1000
                    }), 0)
                nodes.push(node);
                _.each(chance.pick(nodes, chance.integer({
                    min: 2,
                    max: 6
                })), function(randNode) {
                    if (chance.bool({
                            likelihood: 100
                        }))
                        node.userData.connectTo(randNode);

                })
            }
        }

        var fillPercentages = {
            blue: 0,
            red: 0
        }

        function percentFilled() {
            var nodeFillSum = 0
            _.each(nodes, function(node) {
                nodeFillSum += node.userData.filler.scale.y;
            })

            return Math.floor((nodeFillSum / nodes.length) * 100) - 1;
        }


        function init() {
            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(
                75, window.innerWidth / window.innerHeight, 1, 10000);
            camera.position.z = 2000;

            generateWeb();

            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0xfff1d0, 1);

            controls = new THREE.OrbitControls(camera);
            console.log(controls)


            document.body.appendChild(renderer.domElement);
            renderer.domElement.addEventListener('mousemove', onMouseMove, false);
            renderer.domElement.addEventListener('mousedown', onMouseDown, false);
            renderer.domElement.addEventListener('mouseup', onMouseUp, false);
            renderer.domElement.addEventListener('contextmenu', onRightMouseDown, false);
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
                    if (rightMouseDown) {
                        intersected.object.userData.fill(0xDD1C1A);
                    } else {
                        intersected.object.userData.fill(0x086788);
                    }
                }
            } else {
                if (intersected != null) {
                    intersected.object.userData.unHighlight();
                }
            }

            _.each(nodes, function(el) {
                el.userData.animate();
            })

            // console.log(percentFilled());

            requestAnimationFrame(animate);
            renderer.render(scene, camera);

            document.getElementsByClassName('timer')[0].innerText = (new Date() - startTime) / 1000;
        }

        init();
        animate();
    });
