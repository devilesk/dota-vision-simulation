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