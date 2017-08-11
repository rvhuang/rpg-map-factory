// https://vxresource.wordpress.com/category/resources/tilesets/
// Write your Javascript code.

class MapFactory {
    constructor(canvasName, mapColumns, mapRows, tileWidth, tileHeight) {
        var _self = this;

        this.tileWidth = typeof tileWidth === "number" ? Math.abs(tileWidth) : 0;
        this.tileHeight = typeof tileHeight === "number" ? Math.abs(tileHeight) : 0;
        this.mapColumns = typeof mapColumns === "number" ? Math.abs(mapColumns) : 0;
        this.mapRows = typeof mapRows === "number" ? Math.abs(mapRows) : 0;
        this.viewOffsetI = 0;
        this.viewOffsetJ = 0;
        this["mvr"] = 16;

        var currOffsetI = 0;
        var currOffsetJ = 0;
        var crsrOffsetI = 0;
        var crsrOffsetJ = 0;

        var canvas = this["canvas"] = document.getElementById(canvasName);
        var context = this["context"] = canvas.getContext('2d');
        var assetBackground = this["assetBackground"] = new Image();
        var assetForeground = this["assetForeground"] = new Image();
        
        //-------------------------------//
        this.updateMapVisibleSize();
        //-------------------------------//
        canvas.addEventListener("mousedown", function (ev) {
            if (ev.button !== 0) {
                return true;
            }
            crsrOffsetI = Math.trunc(ev.offsetX / _self.tileWidth);
            crsrOffsetJ = Math.trunc(ev.offsetY / _self.tileHeight);
            currOffsetI = _self.viewOffsetI;
            currOffsetJ = _self.viewOffsetJ;

            canvas.style.cursor = "move";
        });
        canvas.addEventListener("mousemove", function (ev) {
            if (ev.which !== 1) {
                return true;
            }
            var mapVisibleColumns = _self["mapVisibleColumns"];
            var mapVisibleRows = _self["mapVisibleRows"];

            var tempOffsetI = Math.trunc(ev.offsetX / _self.tileWidth);
            var tempOffsetJ = Math.trunc(ev.offsetY / _self.tileHeight);
            var update = false;

            if (crsrOffsetI !== tempOffsetI) {
                _self.viewOffsetI = Math.max(crsrOffsetI - tempOffsetI + currOffsetI, 0);                
                update = true;
            }
            if (crsrOffsetJ !== tempOffsetJ) {
                _self.viewOffsetJ = Math.max(crsrOffsetJ - tempOffsetJ + currOffsetJ, 0);
                update = true;
            }
            console.log("I Crsr: [" + crsrOffsetI + "] Temp: [" + tempOffsetI + "] View: [" + _self.viewOffsetI + "]");
            console.log("J Crsr: [" + crsrOffsetJ + "] Temp: [" + tempOffsetJ + "] View: [" + _self.viewOffsetJ + "]");

            if (update && _self.viewOffsetI >= 0 && _self.viewOffsetJ >= 0 && _self.viewOffsetI + mapVisibleColumns < _self.mapColumns && _self.viewOffsetJ + mapVisibleRows < _self.mapRows) {
                _self.drawBackground();
                _self.drawForeground();
            }
            canvas.style.cursor = "move";
        });
        canvas.addEventListener("mouseup", function (ev) {
            canvas.style.cursor = "initial";
        });
        //-------------------------------//
        window.addEventListener("resize", function (ev) {
            _self.updateMapVisibleSize();
            _self.drawBackground();
            _self.drawForeground();
        });
        //-------------------------------//
        assetBackground.onload = function (ev) {
            _self.drawBackground();
        };
        assetForeground.onload = function (ev) {
            _self.drawForeground();
        };
    }
}

MapFactory.prototype.fixedMapVisibleRows = function (numberOfTiles) {
    if (typeof numberOfTiles === 'number') {
        if (this["mvr"] !== numberOfTiles) {
            this["mvr"] = numberOfTiles;

            this.updateMapVisibleSize();
            this.drawBackground();
            this.drawForeground();
        }
    }
    return this["mvr"];
};

MapFactory.prototype.foregroundAsset = function (url) {
    var assetForeground = this["assetForeground"];
    if (typeof url === 'string') {
        assetForeground.src = url;
    }
    return assetForeground.src;
};

MapFactory.prototype.backgroundAsset = function (url) {
    var assetBackground = this["assetBackground"];
    if (typeof url === 'string') {
        assetBackground.src = url;
    }
    return assetBackground.src;
};

MapFactory.prototype.updateMapVisibleSize = function () {
    var bb = this["canvas"].parentNode.getBoundingClientRect();

    this["mapVisibleColumns"] = Math.min(Math.trunc((bb.right - bb.left) / this.tileWidth) - 1, this.mapColumns);
    this["mapVisibleRows"] = Math.min(this["mvr"], this.mapRows);

    this["canvas"].width = this["mapVisibleColumns"] * this.tileWidth;
    this["canvas"].height = this["mapVisibleRows"] * this.tileHeight;
};

MapFactory.prototype.backgroundAssetMapping = function (callback) {
    if (typeof callback === 'function') {
        this["bac"] = callback;
    }
    return this["bac"];
};

MapFactory.prototype.foregroundAssetMapping = function (callback) {
    if (typeof callback === 'function') {
        this["fac"] = callback;
    }
    return this["fac"];
};

MapFactory.prototype.drawBackground = function () {
    this["context"].fillStyle = "white";
    this["context"].fillRect(0, 0, this["canvas"].clientWidth, this["canvas"].clientHeight);

    var mapVisibleColumns = this["mapVisibleColumns"];
    var mapVisibleRows = this["mapVisibleRows"];
    var bac = this["bac"];

    if (this["assetBackground"].src && bac && typeof bac === "function") {
        for (var i = this.viewOffsetI; i < mapVisibleColumns + this.viewOffsetI; i++) {
            for (var j = this.viewOffsetJ; j < mapVisibleRows + this.viewOffsetJ; j++) {
                var coor = bac(i, j);
                if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
                    this.drawBackgroundTile(coor.x, coor.y, i, j);
                }
            }
        }
    }
};

MapFactory.prototype.drawForeground = function() {
    var mapVisibleColumns = this["mapVisibleColumns"];
    var mapVisibleRows = this["mapVisibleRows"];
    var fac = this["fac"];

    if (this["assetForeground"].src && fac && typeof fac === "function") {
        for (var i = this.viewOffsetI; i < mapVisibleColumns + this.viewOffsetI; i++) {
            for (var j = this.viewOffsetJ; j < mapVisibleRows + this.viewOffsetJ; j++) {
                var coor = fac(i, j);
                if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
                    this.drawForegroundTile(coor.x, coor.y, i, j);
                }
            }
        }
    }
};

MapFactory.prototype.drawBackgroundTile = function (sourceX, sourceY, i, j) {
    var destX = (i - this.viewOffsetI) * this.tileWidth;
    var destY = (j - this.viewOffsetJ) * this.tileHeight;

    this["context"].drawImage(this["assetBackground"], sourceX, sourceY, this.tileWidth, this.tileHeight, destX, destY, this.tileWidth, this.tileHeight);
};
MapFactory.prototype.drawForegroundTile = function (sourceX, sourceY, i, j) {
    var destX = (i - this.viewOffsetI) * this.tileWidth;
    var destY = (j - this.viewOffsetJ) * this.tileHeight;

    this["context"].drawImage(this["assetForeground"], sourceX, sourceY, this.tileWidth, this.tileHeight, destX, destY, this.tileWidth, this.tileHeight);
};
