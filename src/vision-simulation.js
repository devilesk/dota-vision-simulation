var ImageHandler = require("./imageHandler.js");
var ROT = require("./rot6.js");

function key2pt(key) {
    var p = key.split(',').map(function (c) { return parseInt(c) });
    return {x: p[0], y: p[1]};
}

function xy2key(x, y) {
    return x + "," + y;
}

function xy2pt(x, y) {
    return {x: x, y: y};
}

function pt2key(pt) {
    return pt.x + "," + pt.y;
}

function getAdjacentCells(data, x, y) {
    var cells = [];
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (0 !== i || 0 !== j) {
                var k = (x + i) + "," + (y + j);
                if (data[k]) {
                    cells.push(data[k]);
                }
            }
        }
    }
    return cells;
}

function generateElevationWalls(data, elevation) {
    var walls = [];
    for (var i in data) {
        var pt = data[i];
        if (pt.z > elevation) {
            var adj = getAdjacentCells(data, pt.x, pt.y);
            for (var j = 0; j < adj.length; j++) {
                if (adj[j].z <= elevation) {
                    walls.push(['wall', pt.x, pt.y, Math.SQRT2 / 2]);
                    break;
                }
            }
        }
    }
    return walls;
}

function setElevationWalls(obj, data, elevation) {
    for (var i = 0; i < data[elevation].length; i++) {
        var el = data[elevation][i];
        obj[el[1] + "," + el[2]] = el;
    }
}

function setWalls(obj, data, id, r) {
    id = id || 'wall';
    r = r || (Math.SQRT2 / 2);
    for (var i in data) {
        obj[i] = [id, data[i].x, data[i].y, r];
    }
}

function setTreeWalls(obj, elevation, tree, tree_elevations, tree_state, tree_blocks) {
    for (var i in tree) {
        if (elevation < tree_elevations[i]) {
            if (tree_state[i]) {
                tree_blocks[i].forEach(function (pt) {
                    obj[pt.x + "," + pt.y] = ['tree', tree[i].x, tree[i].y, Math.SQRT2];
                });
            }
        }
    }
}

function VisionSimulation(worlddata, mapDataImagePath, onReady, opts) {
    var self = this;
    
    this.opts = opts || {},
    this.gridnav = null;
    this.ent_fow_blocker_node = null;
    this.tools_no_wards = null;
    this.elevationGrid = null;
    this.elevationWalls = {};
    this.tree = {}; // center key to point map
    this.tree_blocks = {}; // center to corners map
    this.tree_relations = {}; // corner to center map
    this.tree_elevations = {};
    this.tree_state = {};
    this.walls = {};
    this.radius = this.opts.radius || parseInt(1600 / 64);
    this.lights = {};
    this.worldMinX = worlddata.worldMinX;
    this.worldMinY = worlddata.worldMinY;
    this.worldMaxX = worlddata.worldMaxX;
    this.worldMaxY = worlddata.worldMaxY;
    this.worldWidth = this.worldMaxX - this.worldMinX;
    this.worldHeight = this.worldMaxY - this.worldMinY;
    this.gridWidth = this.worldWidth / 64 + 1;
    this.gridHeight = this.worldHeight / 64 + 1;
    
    this.imageHandler = new ImageHandler(mapDataImagePath);
    this.imageHandler.load(function () {
        self.gridnav = parseImage(self.imageHandler, self.gridWidth * 2, self.gridWidth, self.gridHeight, blackPixelHandler);
        self.ent_fow_blocker_node = parseImage(self.imageHandler, self.gridWidth * 3, self.gridWidth, self.gridHeight, blackPixelHandler);
        self.tools_no_wards = parseImage(self.imageHandler, self.gridWidth * 4, self.gridWidth, self.gridHeight, blackPixelHandler);
        self.elevationGrid = parseImage(self.imageHandler, 0, self.gridWidth, self.gridHeight, elevationPixelHandler);
        elevationValues.forEach(function (elevation) {
            self.elevationWalls[elevation] = generateElevationWalls(self.elevationGrid, elevation);
        });
        parseImage(self.imageHandler, self.gridWidth, self.gridWidth, self.gridHeight, treeElevationPixelHandler);
        onReady();
    });

    function parseImage(imageHandler, offset, width, height, pixelHandler) {
        var grid = {};
        imageHandler.scan(offset, width, height, pixelHandler, grid);
        return grid;
    }

    function blackPixelHandler(x, y, p, grid) {
        var pt = self.ImageXYtoGridXY(x, y);
        if (p[0] === 0) {
            grid[pt.x + "," + pt.y] = pt;
        }
    }

    var elevationValues = [];
    function elevationPixelHandler(x, y, p, grid) {
        var pt = self.ImageXYtoGridXY(x, y);
        pt.z = p[0];
        grid[pt.x + "," + pt.y] = pt;
        if (elevationValues.indexOf(p[0]) == -1) {
            elevationValues.push(p[0]);
        }
    }

    function treeElevationPixelHandler(x, y, p, grid) {
        var pt = self.ImageXYtoGridXY(x, y);
        if (p[1] == 0 && p[2] == 0) {
            // trees are 2x2 in grid
            // tree origins rounded up when converted to grid, so they represent top right corner. subtract 0.5 to get grid origin
            var treeOrigin = {x: pt.x - 0.5, y: pt.y - 0.5};
            var treeElevation = p[0] + 20;
            var kC = pt2key(treeOrigin);
            self.tree[kC] = treeOrigin;
            self.tree_elevations[kC] = treeElevation;
            self.tree_blocks[kC] = [];
            self.tree_state[kC] = true;
            // iterate through tree 2x2 by taking floor and ceil of tree grid origin
            [Math.floor, Math.ceil].forEach(function (i) {
                [Math.floor, Math.ceil].forEach(function (j) {
                    var treeCorner = {x: i(treeOrigin.x), y: j(treeOrigin.y)};
                    var kB = pt2key(treeCorner);
                    self.tree_relations[kB] = treeOrigin;
                    self.tree_blocks[kC].push(treeCorner);
                });
            });
        }
    }

    this.lightPassesCallback = function (x, y) {
        return (!(x+","+y in self.walls));
    }
}
VisionSimulation.prototype.updateVisibility = function (gX, gY) {
    var self = this,
        key = xy2key(gX, gY),
        elevation = this.elevationGrid[key].z,
        fov = new ROT.FOV.PreciseShadowcasting(this.lightPassesCallback, {topology:8});

    this.walls = {};
    setElevationWalls(this.walls, this.elevationWalls, elevation)
    setWalls(this.walls, this.ent_fow_blocker_node);
    setWalls(this.walls, this.tools_no_wards);
    setTreeWalls(this.walls, elevation, this.tree, this.tree_elevations, this.tree_state, this.tree_blocks);

    fov.walls = this.walls;
    this.lights = {};
    fov.compute(gX, gY, this.radius, function(x2, y2, r, vis) {
        var key = xy2key(x2, y2);
        if (vis == 1 && (gX-x2)*(gX-x2) + (gY-y2)*(gY-y2) < self.radius * self.radius) {
            self.lights[key] = 255;
        }
    });
}

VisionSimulation.prototype.toggleTree = function (x, y) {
    var key = xy2key(x, y);
    var isTree = !!this.tree_relations[key];
    if (isTree) {
        var pt = this.tree_relations[key];
        var kC = pt2key(pt);
        this.tree_state[kC] = !this.tree_state[kC];
    }
    return isTree;
}
VisionSimulation.prototype.setRadius = function (r) {
    this.radius = r;
}
VisionSimulation.prototype.WorldXYtoGridXY = function (wX, wY, bNoRound) {
    var x = (wX - this.worldMinX) / 64,
        y = (wY - this.worldMinY) / 64;
    if (!bNoRound) {
        x = parseInt(Math.round(x))
        y = parseInt(Math.round(y))
    }
    return {x: x, y: y};
}
VisionSimulation.prototype.GridXYtoWorldXY = function (gX, gY) {
    return {x: gX * 64 + this.worldMinX, y: gY * 64 + this.worldMinY};
}

VisionSimulation.prototype.GridXYtoImageXY = function (gX, gY) {
    return {x: gX, y: this.gridHeight - gY - 1};
}

VisionSimulation.prototype.ImageXYtoGridXY = function (x, y) {
    return {x: x, y: this.gridHeight - y - 1};
}

VisionSimulation.prototype.WorldXYtoImageXY = function (wX, wY) {
    var pt = this.WorldXYtoGridXY(wX, wY);
    return this.GridXYtoImageXY(pt.x, pt.y);
}

VisionSimulation.prototype.key2pt = key2pt;
VisionSimulation.prototype.xy2key = xy2key;
VisionSimulation.prototype.xy2pt = xy2pt;
VisionSimulation.prototype.pt2key = pt2key;
VisionSimulation.prototype.getAdjacentCells = getAdjacentCells;

module.exports = VisionSimulation;