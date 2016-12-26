var VisionSimulation = require("../src/vision-simulation.js");
var worlddata = require("../src/worlddata.json");

var start = Date.now();
var vs = new VisionSimulation(worlddata, './www/map_data.png', function () {
    console.log('load time', Date.now() - start + 'ms');
    var total = 0;
    for (var i = 0; i < 10; i++) {
        var c = profile();
        console.log('run', i, c + 'ms');
        total += c
    }
    console.log('average run', total/10 + 'ms');
});

function profile() {
    var t1 = Date.now();
    for (var i = 0; i < vs.gridWidth; i+=20) {
        for (var j = 0; j < vs.gridHeight; j+=20) {
            vs.updateVisibility(i, j);
        }
    }
    var t2 = Date.now()
    return t2 - t1;
}
