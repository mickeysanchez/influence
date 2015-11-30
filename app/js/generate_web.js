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
