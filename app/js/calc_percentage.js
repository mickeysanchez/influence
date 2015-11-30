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
