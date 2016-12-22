var VisionSimulation = require("../src/vision-simulation.js");
var worlddata = require("../src/worlddata.json");
var assert = require("assert");

var vs;

before(function(done) {
    this.timeout(10000);
    vs = new VisionSimulation(worlddata, './www/map_data.png', function () {
        done();
    });
});

describe('VisionSimulation', function() {
    it('should load', function() {
        assert.ok(!!vs);
    });
    it('should update vision', function() {
        vs.updateVisibility(0, 0);
        console.log(vs.lights);
        assert.ok(!!vs);
    });
});