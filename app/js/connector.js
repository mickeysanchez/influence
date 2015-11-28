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
