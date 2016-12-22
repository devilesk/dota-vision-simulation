var Jimp = require("jimp");

function ImageHandler(imagePath) {
    this.imagePath = imagePath;
    this.image = null;
}
ImageHandler.prototype.load = function (callback) {
    var self = this;
    Jimp.read(this.imagePath).then(function (image) {
        self.image = image;
        callback();
    }).catch(function (err) {
        console.log('error', err);
    });
}
ImageHandler.prototype.scan = function (offset, width, height, pixelHandler, grid) {
    this.image.scan(offset, 0, width, height, function (x, y, idx) {
        var r = this.bitmap.data[idx + 0];
        var g = this.bitmap.data[idx + 1];
        var b = this.bitmap.data[idx + 2];
        var alpha = this.bitmap.data[idx + 3];
        pixelHandler(x - offset, y, [r, g, b], grid);
    });
}

module.exports = ImageHandler;