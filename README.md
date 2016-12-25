#dota-vision-simulation

http://devilesk.com/dota2/apps/vision-simulation/

## Example

View demo in www/ folder and src/app.js for source code.

See [dota-interactive-map](https://github.com/devilesk/dota-interactive-map) for another application.

## Usage

```javascript
var VisionSimulation = require("dota-vision-simulation");
var worlddata = require("dota-vision-simulation/src/worlddata.json");


var vs = new VisionSimulation(worlddata, mapImageDataPath, onReadyCallback);
```

`worlddata` - world dimensions, {"worldMinX":-8288,"worldMaxX":8288,"worldMinY":-8288,"worldMaxY":8288}

`mapImageDataPath` - path to map data image, "www/map_data.png"

`onReadyCallback` - callback executed when map data is loaded and vision simulation is ready.

### Methods

`updateVisibility(gX, gY, radius)` - Executes the FOV calculation and update the `lights` property on the VisionSimulation object. (gX, gY) is a grid coordinate representing a 64x64 tile in the 260x260 world grid. radius optional.

`toggleTree(gX, gY)` - Toggles tree cut down state at (gX, gY) in grid coordinates.

`setRadius(r)` - Sets default radius.

`WorldXYtoGridXY, GridXYtoWorldXY, GridXYtoImageXY, ImageXYtoGridXY, WorldXYtoImageXY` - Functions for converting between world, grid, and image coordinates.

`key2pt, xy2key, xy2pt, pt2key` - Functions for converting between (x, y), {x: x, y: y}, and "x,y" coordinate formats.

`isValidXY(gX, gY, bCheckGridnav, bCheckToolsNoWards, bCheckTreeState)` - Check whether grid coordinate is a valid position or not. bCheckGridnav, bCheckToolsNoWards, bCheckTreeState optional.

### Data

`worlddata.json` and `map_data.png` come from [dota-map-coordinates](https://github.com/devilesk/dota-map-coordinates)