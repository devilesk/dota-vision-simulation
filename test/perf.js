var VisionSimulation = require("../src/vision-simulation.js");
var worlddata = require("../src/worlddata.json");

var vs = new VisionSimulation(worlddata, './www/map_data.png', function () {
    for (var i = 0; i < 10; i++) {
        console.log('run', i);
        profile();
    }
});

function profile() {
    var t1 = Date.now();
    for (var i = 0; i < vs.gridWidth; i+=20) {
        var t2 = Date.now();
        for (var j = 0; j < vs.gridHeight; j+=20) {
            vs.updateVisibility(i, j);
        }
        console.log(Date.now() - t2 + 'ms');
    }
    console.log(Date.now() - t1 + 'ms');
}