(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function ImageHandler(imagePath) {
    this.imagePath = imagePath;
    this.image = null;
}
ImageHandler.prototype.load = function (callback) {
    var self = this;
    this.image = new Image();
    this.image.src = this.imagePath;
    this.image.onload = function () {
        self.canvas = document.createElement("canvas");
        self.canvas.width = self.image.width;
        self.canvas.height = self.image.height;
        self.ctx = self.canvas.getContext("2d");
        self.ctx.drawImage(self.image, 0, 0);
        callback();
    }
}
ImageHandler.prototype.scan = function (offset, width, height, pixelHandler, grid) {
    var imgData = this.ctx.getImageData(offset, 0, width, height);
    var data = imgData.data;

    for (var i = 0; i < data.length; i += 4) {
        var r = data[i];
        var g = data[i+1];
        var b = data[i+2];
        var alpha = data[i+3];
        var x = Math.floor((i/4) % width);
        var y = Math.floor((i/4) / height);
        pixelHandler(x, y, [r, g, b], grid);
    }
}

module.exports = ImageHandler;
},{}],2:[function(require,module,exports){
var worlddata = require("./worlddata.json");
var VisionSimulation = require("./vision-simulation");

var background = document.getElementById("canvas-background"),
    backgroundCtx = background.getContext("2d"),
    treeCanvas = document.getElementById("canvas-trees"),
    treeCtx = treeCanvas.getContext("2d"),
    canvas = document.getElementById("canvas-vision"),
    ctx = canvas.getContext("2d"),
    canvasContainer = document.getElementById("canvas-container"),
    CELL = [parseInt(Math.floor(parseInt(document.querySelector("#zoom").value))), parseInt(Math.floor(parseInt(document.querySelector("#zoom").value)))],
    COLOR_LIGHT_CENTER = [255,165,0],
    COLOR_LIGHT = [255, 255, 0],
    COLOR_TREE = [0,255,0],
    COLOR_STUMP = [102, 51, 0],
    COLOR_LIT_STUMP = [200, 200, 0],
    COLOR_INVALID = [255, 0, 0],
    COLOR_GRIDNAV = [0, 0, 255],
    COLOR_FOW_BLOCKER = [0,255,255],
    COLOR_WALL = [255,255,255],
    debug = false;
    
        
var vs = new VisionSimulation(worlddata, 'map_data.png', onReady);

function resize() {
    canvas.width = CELL[0]*vs.gridWidth;
    canvas.height = CELL[1]*vs.gridHeight;
    background.width = CELL[0]*vs.gridWidth;
    background.height = CELL[1]*vs.gridHeight;
    treeCanvas.width = CELL[0]*vs.gridWidth;
    treeCanvas.height = CELL[1]*vs.gridHeight;
    canvasContainer.style.width = CELL[0]*vs.gridWidth + 'px';
    canvasContainer.style.height = CELL[1]*vs.gridHeight + 'px';
}

function drawBackground() {
    backgroundCtx.drawImage(vs.imageHandler.image, 0, 0, vs.gridWidth, vs.gridHeight, 0, 0, CELL[0]*vs.gridWidth, CELL[1]*vs.gridHeight);
    
    for (p in vs.gridnav) {
        var pt = vs.gridnav[p];
        pt = vs.GridXYtoImageXY(pt.x, pt.y);
        backgroundCtx.fillStyle = "rgb("+COLOR_GRIDNAV.join(",")+")";
        backgroundCtx.fillRect(pt.x*CELL[0], pt.y*CELL[1], CELL[0], CELL[1]);
    }
    
    for (var k in vs.ent_fow_blocker_node) {
        var pt = vs.key2pt(k);
        pt = vs.GridXYtoImageXY(pt.x, pt.y);
        backgroundCtx.fillStyle = "rgb("+COLOR_FOW_BLOCKER.join(",")+")";
        backgroundCtx.fillRect(pt.x*CELL[0], pt.y*CELL[1], CELL[0], CELL[1]);
    }
    
    for (var k in vs.tools_no_wards) {
        var pt = vs.key2pt(k);
        pt = vs.GridXYtoImageXY(pt.x, pt.y);
        backgroundCtx.fillStyle = "rgb("+COLOR_FOW_BLOCKER.join(",")+")";
        backgroundCtx.fillRect(pt.x*CELL[0], pt.y*CELL[1], CELL[0], CELL[1]);
    }
}

function drawTrees() {
    for (var k in vs.tree_relations) {
        var pt = vs.key2pt(k);
        pt = vs.GridXYtoImageXY(pt.x, pt.y);
        var kC = vs.pt2key(vs.tree_relations[k]);
        var c = vs.tree_state[kC] ? COLOR_TREE : COLOR_STUMP;
        treeCtx.fillStyle = "rgb("+c.join(",")+")";
        treeCtx.fillRect(pt.x*CELL[0], pt.y*CELL[1], CELL[0], CELL[1]);
    }
}

function redraw(gX, gY) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var cpt = vs.GridXYtoImageXY(gX, gY);
    var key = vs.xy2key(gX, gY);
    if (!vs.gridnav[key] && !vs.tools_no_wards[key]) {
        for (var k in vs.lights) {
            var pt = vs.key2pt(k);
            pt = vs.GridXYtoImageXY(pt.x, pt.y);
            var c = vs.tree_relations[k] ? COLOR_LIT_STUMP : COLOR_LIGHT;
            ctx.fillStyle = "rgb("+c.join(",")+")";
            ctx.fillRect(pt.x*CELL[0], pt.y*CELL[1], CELL[0], CELL[1]);
        }
        ctx.fillStyle = "rgb("+COLOR_LIGHT_CENTER.join(",")+")";
        ctx.fillRect(cpt.x*CELL[0], cpt.y*CELL[1], CELL[0], CELL[1]);
    }
    else {
        ctx.fillStyle = "rgb("+COLOR_INVALID.join(",")+")";
        ctx.fillRect(cpt.x*CELL[0], cpt.y*CELL[1], CELL[0], CELL[1]);
    }
    
    if (debug && gX !== undefined && gY !== undefined) {
        var elevation = vs.elevationGrid[key].z;
        for (var i = 0; i < vs.elevationWalls[elevation].length; i++) {
            var pt = vs.xy2pt(vs.elevationWalls[elevation][i][1], vs.elevationWalls[elevation][i][2]);
            pt = vs.GridXYtoImageXY(pt.x, pt.y);
            ctx.fillStyle = "rgb("+COLOR_WALL.join(",")+")";
            ctx.fillRect(pt.x*CELL[0], pt.y*CELL[1], CELL[0], CELL[1]);
        }
    }
}

function getCoords(e) {
    var x = e.clientX+document.body.scrollLeft - canvasContainer.offsetLeft - canvasContainer.clientLeft;
    var y = e.clientY+document.body.scrollTop - canvasContainer.offsetTop - canvasContainer.clientTop
    return vs.ImageXYtoGridXY(Math.floor(x/CELL[0]), Math.floor(y/CELL[1]));
}

function onReady() {
    resize();
    drawBackground();
    drawTrees();

    document.getElementById("canvas-container").addEventListener("click", function(e) {
        var coords = getCoords(e);
        if (vs.toggleTree(coords.x, coords.y)) {
            var t1 = Date.now();
            vs.updateVisibility(coords.x, coords.y);
            var t2 = Date.now();
            document.querySelector("#fov").innerHTML = t2-t1;
            
            var t3 = Date.now();
            drawTrees();
            redraw(coords.x, coords.y);
            var t4 = Date.now();
            document.querySelector("#draw").innerHTML = t4 - t3;
        }
        e.preventDefault();
    });

    document.getElementById("canvas-container").addEventListener("mousemove", function(e) {
        var coords = getCoords(e);
        var worldXY = vs.GridXYtoWorldXY(coords.x, coords.y);
        document.querySelector("#x-coord").innerHTML = coords.x;
        document.querySelector("#y-coord").innerHTML = coords.y;
        document.querySelector("#worldX-coord").innerHTML = worldXY.x;
        document.querySelector("#worldY-coord").innerHTML = worldXY.y;
        
        var t1 = Date.now();
        vs.updateVisibility(coords.x, coords.y);
        var t2 = Date.now();
        document.querySelector("#fov").innerHTML = t2-t1;
        
        var t3 = Date.now();
        redraw(coords.x, coords.y);
        var t4 = Date.now();
        document.querySelector("#draw").innerHTML = t4 - t3;
    });

    document.getElementById("zoom").addEventListener("change", function (e){
        CELL = [parseInt(Math.floor(parseInt(document.querySelector("#zoom").value))), parseInt(Math.floor(parseInt(document.querySelector("#zoom").value)))];
        resize();
        var t3 = Date.now();
        drawBackground();
        drawTrees();
        redraw();
        var t4 = Date.now();
        document.querySelector("#draw").innerHTML = t4 - t3;
    }, false);

    document.getElementById("radius").addEventListener("change", function (e){
        vs.setRadius(parseInt(Math.floor(parseInt(document.getElementById("radius").value) / 64)));
    }, false);

    document.getElementById("debug").addEventListener("change", function (e){
        debug = document.getElementById('debug').checked;
    }, false);
}
},{"./vision-simulation":4,"./worlddata.json":5}],3:[function(require,module,exports){
/*
	This is rot.js, the ROguelike Toolkit in JavaScript.
	Version 0.6~dev, generated on Tue Mar 17 16:16:31 CET 2015.
*/
/**
 * @namespace Top-level ROT namespace
 */
var ROT = {
	/** Directional constants. Ordering is important! */
	DIRS: {
		"4": [
			[ 0, -1],
			[ 1,  0],
			[ 0,  1],
			[-1,  0]
		],
		"8": [
			[ 0, -1],
			[ 1, -1],
			[ 1,  0],
			[ 1,  1],
			[ 0,  1],
			[-1,  1],
			[-1,  0],
			[-1, -1]
		],
		"6": [
			[-1, -1],
			[ 1, -1],
			[ 2,  0],
			[ 1,  1],
			[-1,  1],
			[-2,  0]
		]
	}
};
/**
 * Always positive modulus
 * @param {int} n Modulus
 * @returns {int} this modulo n
 */
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}
if (!Object.create) {  
	/**
	 * ES5 Object.create
	 */
	Object.create = function(o) {  
		var tmp = function() {};
		tmp.prototype = o;
		return new tmp();
	};  
}  
/**
 * Sets prototype of this function to an instance of parent function
 * @param {function} parent
 */
Function.prototype.extend = function(parent) {
	this.prototype = Object.create(parent.prototype);
	this.prototype.constructor = this;
	return this;
}
if (typeof window != "undefined") {
	window.requestAnimationFrame =
		window.requestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame
		|| function(cb) { return setTimeout(cb, 1000/60); };

	window.cancelAnimationFrame =
		window.cancelAnimationFrame
		|| window.mozCancelAnimationFrame
		|| window.webkitCancelAnimationFrame
		|| window.oCancelAnimationFrame
		|| window.msCancelAnimationFrame
		|| function(id) { return clearTimeout(id); };
}
/**
 * @class Abstract FOV algorithm
 * @param {function} lightPassesCallback Does the light pass through x,y?
 * @param {object} [options]
 * @param {int} [options.topology=8] 4/6/8
 */
ROT.FOV = function(lightPassesCallback, options) {
	this._lightPasses = lightPassesCallback;
	this._options = {
		topology: 8
	}
	for (var p in options) { this._options[p] = options[p]; }
};

/**
 * Compute visibility for a 360-degree circle
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {function} callback
 */
ROT.FOV.prototype.compute = function(x, y, R, callback) {}

/**
 * Return all neighbors in a concentric ring
 * @param {int} cx center-x
 * @param {int} cy center-y
 * @param {int} r range
 */
ROT.FOV.prototype._getCircle = function(cx, cy, r) {
	var result = [];
	var dirs, countFactor, startOffset;

	switch (this._options.topology) {
		case 4:
			countFactor = 1;
			startOffset = [0, 1];
			dirs = [
				ROT.DIRS[8][7],
				ROT.DIRS[8][1],
				ROT.DIRS[8][3],
				ROT.DIRS[8][5]
			]
		break;

		case 6:
			dirs = ROT.DIRS[6];
			countFactor = 1;
			startOffset = [-1, 1];
		break;

		case 8:
			dirs = ROT.DIRS[4];
			countFactor = 2;
			startOffset = [-1, 1];
		break;
	}

	/* starting neighbor */
	var x = cx + startOffset[0]*r;
	var y = cy + startOffset[1]*r;

	/* circle */
	for (var i=0;i<dirs.length;i++) {
		for (var j=0;j<r*countFactor;j++) {
			result.push([x, y]);
			x += dirs[i][0];
			y += dirs[i][1];

		}
	}

	return result;
}
/**
 * @class Precise shadowcasting algorithm
 * @augments ROT.FOV
 */
ROT.FOV.PreciseShadowcasting = function(lightPassesCallback, options) {
	ROT.FOV.call(this, lightPassesCallback, options);
}
ROT.FOV.PreciseShadowcasting.extend(ROT.FOV);

ROT.FOV.PreciseShadowcasting.prototype.compute = function(x, y, R, callback) {
	/* this place is always visible */
	callback(x, y, 0, 1);
    
	callback(x-1, y-1, 0, 1);
	callback(x, y-1, 0, 1);
	callback(x+1, y-1, 0, 1);
	callback(x-1, y, 0, 1);
	callback(x+1, y, 0, 1);
	callback(x-1, y+1, 0, 1);
	callback(x, y+1, 0, 1);
	callback(x+1, y+1, 0, 1);
    
    callback(x-1, y-2, 0, 1);
    callback(x, y-2, 0, 1);
    callback(x+1, y-2, 0, 1);
    callback(x-2, y-1, 0, 1);
    callback(x-2, y, 0, 1);
    callback(x-2, y+1, 0, 1);
    callback(x+2, y-1, 0, 1);
    callback(x+2, y, 0, 1);
    callback(x+2, y+1, 0, 1);
    callback(x-1, y+2, 0, 1);
    callback(x, y+2, 0, 1);
    callback(x+1, y+2, 0, 1);

	/* standing in a dark place. FIXME is this a good idea?  */
	if (!this._lightPasses(x, y)) { return; }
	
	/* list of all shadows */
	var SHADOWS = [];
	var trees = {};
	var cx, cy, blocks, A1, A2, visibility,
        dx, dy, dd, a, b, radius,
        cx2, cy2, dd1,
        obstacleType;

	/* analyze surrounding cells in concentric rings, starting from the center */
	for (var r=1; r<=R; r++) {
        ////console.log('ring', r);
		var neighbors = this._getCircle(x, y, r);
		var neighborCount = neighbors.length;
        trees = {};
		for (var i=0;i<neighborCount;i++) {
			cx = neighbors[i][0];
			cy = neighbors[i][1];
            var key = cx+","+cy;
            //if (key == "44,102") //console.log('KEY', key, !this._lightPasses(cx, cy));
            obstacleType = this.walls[key];
            // if (key == "150,160") //console.log(key, obstacleType);
            // if (key == "151,161") //console.log(key, obstacleType);
            // if (key == "150,161") //console.log(key, obstacleType);
            // if (key == "151,160") //console.log(key, obstacleType);
            if (obstacleType && obstacleType[0] == 'tree') {
                cx2 = obstacleType[1];
                cy2 = obstacleType[2];
                radius = obstacleType[3];
            }
            else {
                cx2 = cx;
                cy2 = cy;
                radius = Math.SQRT2 / 2;
            }
            
            dx = cx2 - x;
            dy = cy2 - y;
            dd = Math.sqrt(dx * dx + dy * dy);
            if (dd > 1/2) {
                a = Math.asin(radius / dd);
                b = Math.atan2(dy, dx),
                A1 = normalize(b - a),
                A2 = normalize(b + a);
                blocks = !this._lightPasses(cx, cy);
                if (obstacleType && obstacleType[0] == 'tree') {
                    dx1 = cx - x;
                    dy1 = cy - y;
                    dd1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                    if (dd1 < dd) {
                        trees[obstacleType[1]+","+obstacleType[2]] = [obstacleType[1], obstacleType[2]];
                    }
                    
                    dx = cx - x;
                    dy = cy - y;
                    dd = Math.sqrt(dx * dx + dy * dy);
                    a = Math.asin(radius / dd);
                    b = Math.atan2(dy, dx),
                    A1 = normalize(b - a),
                    A2 = normalize(b + a);
                    visibility = this._checkVisibility(b, A1, A2, false, SHADOWS);
                    if (visibility) { callback(cx, cy, r, visibility); }
                }
                else {
                    //if (obstacleType) //console.log(obstacleType[0], radius);
                    //console.log('BLOCKS', cx, cy, blocks, b);
                    visibility = this._checkVisibility(b, A1, A2, blocks, SHADOWS);
                    if (visibility) { callback(cx, cy, r, visibility); }
                    if (this.done) return;
                }
            }

		} /* for all cells in this ring */
        
        // apply tree blockers
        for (var k in trees) {
            ////console.log('apply tree');
            cx2 = trees[k][0];
            cy2 = trees[k][1];
            dx = cx2 - x;
            dy = cy2 - y;
            dd = Math.sqrt(dx * dx + dy * dy);
            radius = Math.SQRT2 - .01;
            if (dd > 1/2) {
                a = Math.asin(radius / dd);
                b = Math.atan2(dy, dx),
                A1 = normalize(b - a),
                A2 = normalize(b + a);
                visibility = this._checkVisibility(b, A1, A2, true, SHADOWS);
                if (this.done) return;
            }
        }
	} /* for all rings */
}

/**
 * @param {int[2]} A1 arc start
 * @param {int[2]} A2 arc end
 * @param {bool} blocks Does current arc block visibility?
 * @param {int[][]} SHADOWS list of active shadows
 */
ROT.FOV.PreciseShadowcasting.prototype._checkVisibility = function(b, A1, A2, blocks, SHADOWS) {
    ////console.log('_checkVisibility', b, A1, A2, blocks, SHADOWS);
    // check if target center is inside a shadow
    var visible = !blocks;
    //console.log('_checkVisibility', b, visible);
	for (var i = 0; i < SHADOWS.length; i++) {
		var old = SHADOWS[i];
        if (isBetween(b, old[0], old[1])) {
            if (blocks) {
                ////console.log('blocks but not visible', SHADOWS.length);
                visible = false;
            }
            else {
                //console.log(i, b, JSON.stringify(SHADOWS));
                return false; // not visible, return
            }
        }
	}
    
    if (blocks) {
        if (A1 < 0 && A2 >= 0) {
            //console.log('splitting');
            this._mergeShadows(b, 0, A2, blocks, SHADOWS);
            this.done = false;
            this._mergeShadows(b, A1, 0, blocks, SHADOWS);
        }
        else {
            //console.log('not splitting', blocks, visible, b);
            this._mergeShadows(b, A1, A2, blocks, SHADOWS);
        }
        //console.log('end', A1, A2, JSON.stringify(SHADOWS), !isBetween(A1, SHADOWS[0][0], SHADOWS[0][1]), !isBetween(A2, SHADOWS[0][0], SHADOWS[0][1]));
        if (SHADOWS.length == 1 && (!isBetween(A1, SHADOWS[0][0], SHADOWS[0][1]) || !isBetween(A2, SHADOWS[0][0], SHADOWS[0][1])) && A1 != SHADOWS[0][0] && A2 != SHADOWS[0][1] ) {
            this.done = true;
        }
    }
    
    return visible;
}

ROT.FOV.PreciseShadowcasting.prototype._mergeShadows = function(b, A1, A2, blocks, SHADOWS) {
    ////console.log('merging', b, A1, A2);
    // check if target first edge is inside a shadow or which shadows it is between
    var index1 = 0,
        edge1 = false,
        firstIndex = 0;
    while (index1 < SHADOWS.length) {
        var old = SHADOWS[index1];
        firstIndex = index1;
        if (isBetween(A1, old[0], old[1])) {
            edge1 = true;
            break;
        }
        if (index1 > 0 && isBetween(A1, SHADOWS[index1 - 1][1], old[0])) {
            edge1 = false;
            break;
        }
        if (!isBefore(A1, old[1])) {
            index1++;
            firstIndex = index1;
            continue;
        }
        if (isBefore(A1, old[0])) {
            break;
        }
        index1++;
    }
    
    // check if target second edge is inside a shadow or which shadows it is between
    var index2 = SHADOWS.length - 1,
        edge2 = false,
        secondIndex = 0;
    while (index2 >= 0) {
        var old = SHADOWS[index2];
        secondIndex = index2;
        ////console.log(A2, old[0], old[1], isBetween(A2, old[0], old[1]))
        if (isBetween(A2, old[0], old[1])) {
            edge2 = true;
            break;
        }
        if (isBefore(A2, old[0])) {
            index2--;
            secondIndex = index2;
            continue;
        }
        if (!isBefore(A2, old[1])) {
            break;
        }
        index2--;
    }
    
    ////console.log(firstIndex, secondIndex, edge1, edge2, A1, A2);
    if (firstIndex == SHADOWS.length && !edge1 && secondIndex == 0 && edge2) firstIndex = 0;
    //if (secondIndex == -1) secondIndex = SHADOWS.length - 1;
    //console.log(firstIndex, secondIndex, edge1, edge2, A1, A2);
    //console.log(JSON.stringify(SHADOWS));
    if (SHADOWS.length == 0) {
        //console.log('empty shadows pushing', [A1, A2]);
        SHADOWS.push([A1, A2]);
    }
    /*else if (SHADOWS.length > 1 && firstIndex == SHADOWS.length && secondIndex == 0 && !edge1 && edge2) {
    
    }*/
    else {
        var new_shadow = [edge1 ? SHADOWS[firstIndex][0] : A1, edge2 ? SHADOWS[secondIndex][1] : A2];
        //console.log('new_shadow', new_shadow);
        secondIndex = Math.max(firstIndex, secondIndex);
        var sum1 = diff_sum(SHADOWS);
        var doShift = false;
        if (isBetween(0, new_shadow[0], new_shadow[1]) && new_shadow[0] != 0 && new_shadow[1] != 0) {
            //console.log('crosses 0');
            SHADOWS.splice(firstIndex, firstIndex == secondIndex && edge1 == edge2 && !edge1 ? 0 : secondIndex - firstIndex + 1, [new_shadow[0], 0]);
            //console.log([new_shadow[0], 0], JSON.stringify(SHADOWS));
            if (SHADOWS[0][0] != 0 && SHADOWS[0][1] != new_shadow[1]) {
                SHADOWS.splice(firstIndex + 1, 0, [0, new_shadow[1]]);
                //console.log([0, new_shadow[1]], JSON.stringify(SHADOWS));
            }
            //console.log(JSON.stringify(SHADOWS));
            doShift = true;
        }
        else {
            SHADOWS.splice(firstIndex, firstIndex == secondIndex && edge1 == edge2 && !edge1 ? 0 : secondIndex - firstIndex + 1, new_shadow);
        }
        var sum2 = diff_sum(SHADOWS);
        //console.log('sum1', sum1, 'sum2', sum2, sum2 < sum1, SHADOWS.length == 1 && (!isBetween(A1, SHADOWS[0][0], SHADOWS[0][1]) || !isBetween(A2, SHADOWS[0][0], SHADOWS[0][1])));
        if (sum2 < sum1) this.done = true;
        /*if (SHADOWS.length == 1 && (!isBetween(A1, SHADOWS[0][0], SHADOWS[0][1]) || !isBetween(A2, SHADOWS[0][0], SHADOWS[0][1]))) {
            this.done = true;
        }*/
        if (new_shadow[0] == 0 || doShift) {
            var count = 0;
            //console.log('shifting');
            while (SHADOWS[0][0] != 0) {
                SHADOWS.push(SHADOWS.shift());
                if (count >= SHADOWS.length) break;
                count++;
                //console.log(JSON.stringify(SHADOWS));
            }
            //console.log('end shifting', JSON.stringify(SHADOWS));
        }
        //console.log(JSON.stringify(SHADOWS));
        //console.log(diff_sum(SHADOWS));
    }
}

function isBefore(A1, A2) {
    if (A1 > 0 && A2 < 0) { // A1 in bottom half, A2 in top half
        return true;
    }
    else if (A2 > 0 && A1 < 0) { // A1 in top half, A2 in bottom half
        return false;
    }
    else {
        return A1 < A2;
    }
}

function isAfter(A1, A2) {
    return !isBefore(A1, A2);
}

function isBetween(b, A1, A2) {
    if (A1 < A2) {
        return ((A1 <= b) && (b <= A2));
    }
    else {
        return ((A1 <= b) && (b <= Math.PI)) || ((-Math.PI <= b) && (b <= A2));
    }
}

function normalize(x) {
    if (x > Math.PI) {
        return -(2 * Math.PI - x);
    }
    else if ( x < -Math.PI) {
        return 2 * Math.PI + x;
    }
    else {
        return x;
    }
}

function diff(A1, A2) {
    if (A1 > 0 && A2 < 0) { // A1 in bottom half, A2 in top half
        return Math.abs((Math.PI - A1) - (-Math.PI - A2));
    }
    else if (A2 > 0 && A1 < 0) { // A1 in top half, A2 in bottom half
        return Math.abs(-A1 + A2);
    }
    if (A1 <= 0 && A2 <= 0) { // A1,A2 in bottom half
        if (isAfter(A1, A2)) { // A1 after A2
            return -A1 + Math.PI - (-Math.PI - A2)
        }
        else {
            return Math.abs(A2 - A1);
        }
    }
    else {
        if (isAfter(A1, A2)) {
            return Math.PI + (Math.PI - A1) + A2
        }
        else {
            return Math.abs(A2 - A1);
        }
    }
}

function diff_sum(SHADOWS) {
    var sum = 0;
    for (var i = 0; i < SHADOWS.length; i++) {
        ////console.log(SHADOWS[i][0], SHADOWS[i][1], diff(SHADOWS[i][0], SHADOWS[i][1]));
        sum += diff(SHADOWS[i][0], SHADOWS[i][1]);
    }
    return sum;
}

module.exports = ROT;
},{}],4:[function(require,module,exports){
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
},{"./imageHandler.js":1,"./rot6.js":3}],5:[function(require,module,exports){
module.exports={"worldMinX":-8288,"worldMaxX":8288,"worldMinY":-8288,"worldMaxY":8288}
},{}]},{},[2]);
