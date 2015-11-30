// https://coolors.co/app/06aed5-086788-f0c808-fff1d0-dd1c1a

angular.module('influence', [])
    .controller('gameController', function($scope) {

        var scene, camera, renderer, controls;
        var startTime = new Date();
        var intersected = null;

        include "mousestuff.js"
        include "node.js"
        include "connector.js"
        include "generate_web.js"
        include "calc_percentage.js"

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
