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
