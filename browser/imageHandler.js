var PNG = require('png-js');

function ImageHandler(imagePath) {
    this.imagePath = imagePath;
    this.canvas = null;
    this.png = null;
    this.enabled = true;
}
ImageHandler.prototype.load = function (callback) {
    var self = this;
    var t1 = Date.now();
    try {
        self.canvas = document.createElement("canvas");
    }
    catch (e) {
        if (self.enabled) callback(e);
        return;
    }
    PNG.load(this.imagePath, self.canvas, function(err, png) {
        self.png = png;
        self.ctx = self.canvas.getContext("2d");
        if (self.enabled) callback(err);
    });
}
ImageHandler.prototype.disable = function () {
    this.enabled = false;
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