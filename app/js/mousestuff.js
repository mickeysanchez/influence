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
