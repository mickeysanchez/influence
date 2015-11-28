(function() {

    var scene, camera, renderer;
    var intersected = null;

    include "mousestuff.js"
    include "node.js"
    include "connector.js"

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
