class MapFactory {
    constructor(canvasName, mapColumns, mapRows, tileWidth, tileHeight) {
        var _self = this;

        this.tileWidth = typeof tileWidth === "number" ? Math.abs(tileWidth) : 0;
        this.tileHeight = typeof tileHeight === "number" ? Math.abs(tileHeight) : 0;
        this.mapColumns = typeof mapColumns === "number" ? Math.abs(mapColumns) : 0;
        this.mapRows = typeof mapRows === "number" ? Math.abs(mapRows) : 0;
        this.viewOffsetI = 0;
        this.viewOffsetJ = 0;

        var currOffsetI = 0;
        var currOffsetJ = 0;
        var crsrOffsetI = 0;
        var crsrOffsetJ = 0;

        var canvas = this["canvas"] = document.getElementById(canvasName);
        var context = this["context"] = canvas.getContext('2d');

        var assetBackground = this["assetBackground"] = new Image();
        var assetForeground = this["assetForeground"] = new Image();
        var assetCursor = this["assetCursor"] = new Image();
        
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

        canvas.addEventListener("mousemove", function (ev) { // Draw cursor
            var newI = Math.trunc(ev.offsetX / _self.tileWidth) + _self.viewOffsetI;
            var newJ = Math.trunc(ev.offsetY / _self.tileHeight) + _self.viewOffsetJ;
            var oldI = parseInt(canvas.dataset.offsetI);
            var oldJ = parseInt(canvas.dataset.offsetJ);

            if (newI !== oldI || newJ !== oldJ) {
                canvas.dataset.offsetI = newI;
                canvas.dataset.offsetJ = newJ;

                var cac = _self["cac"];

                if (assetCursor.src && cac && typeof cac === "function") {
                    var coor = cac(newI, newJ);
                    if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
                        _self.drawCursorTile(coor.x, coor.y, newI, newJ);
                    } else {
                        canvas.style.cursor = "auto";
                        return true; // Cursor asset is not working. No needs to continue.
                    }
                } else {
                    canvas.style.cursor = "auto";
                    return true; // Same as above.
                }
                canvas.style.cursor = "none";
                _self.restoreTile(oldI, oldJ);
            }
            return true;
        });
        canvas.addEventListener("mouseleave", function (ev) { // Hide cursor when mouse leaves
            var oldI = parseInt(canvas.dataset.offsetI);
            var oldJ = parseInt(canvas.dataset.offsetJ);

            _self.restoreTile(oldI, oldJ);
        });
        canvas.addEventListener("mousemove", function (ev) { // Dragging map                  
            if (ev.which !== 1) {
                return true;
            }
            var tempOffsetI = Math.trunc(ev.offsetX / _self.tileWidth);
            var tempOffsetJ = Math.trunc(ev.offsetY / _self.tileHeight);

            var mapVisibleColumns = _self["mapVisibleColumns"];
            var mapVisibleRows = _self["mapVisibleRows"];

            var update = false;

            if (crsrOffsetI !== tempOffsetI) {
                var tempI = crsrOffsetI - tempOffsetI + currOffsetI;

                if (tempI < 0) {
                    tempI = 0;
                } else if (tempI + mapVisibleColumns >= _self.mapColumns) {
                    tempI = _self.mapColumns - mapVisibleColumns;
                }
                if (_self.viewOffsetI !== tempI) {
                    _self.viewOffsetI = tempI;
                    update = true;
                }
            }
            if (crsrOffsetJ !== tempOffsetJ) {
                var tempJ = crsrOffsetJ - tempOffsetJ + currOffsetJ;

                if (tempJ < 0) {
                    tempJ = 0;
                } else if (tempJ + mapVisibleRows >= _self.mapRows) {
                    tempJ = _self.mapRows - mapVisibleRows;
                }
                if (_self.viewOffsetJ !== tempJ) {
                    _self.viewOffsetJ = tempJ;
                    update = true;
                }
            }
            console.log("I Crsr: [" + crsrOffsetI + "] Temp: [" + tempOffsetI + "] View: [" + _self.viewOffsetI + "]");
            console.log("J Crsr: [" + crsrOffsetJ + "] Temp: [" + tempOffsetJ + "] View: [" + _self.viewOffsetJ + "]");
            
            if (update) {
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
        //-------------------------------//
        this.updateMapVisibleSize();
        //-------------------------------//
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
        return this;
    }
    return assetForeground.src;
};

MapFactory.prototype.backgroundAsset = function (url) {
    var assetBackground = this["assetBackground"];
    if (typeof url === 'string') {
        assetBackground.src = url;
        return this;
    }
    return assetBackground.src;
};

MapFactory.prototype.cursorAsset = function (url) {
    var assetCursor = this["assetCursor"];
    if (typeof url === 'string') {
        assetCursor.src = url;
        return this;
    }
    return assetCursor.src;
};

MapFactory.prototype.backgroundAssetMapping = function (callback) {
    if (typeof callback === 'function') {
        this["bac"] = callback;
        return this;
    }
    return this["bac"];
};

MapFactory.prototype.foregroundAssetMapping = function (callback) {
    if (typeof callback === 'function') {
        this["fac"] = callback;
        return this;
    }
    return this["fac"];
};

MapFactory.prototype.cursorAssetMapping = function (callback) {
    if (typeof callback === 'function') {
        this["cac"] = callback;
        return this;
    }
    return this["cac"];
};

MapFactory.prototype.updateMapVisibleSize = function () {
    var bb = this["canvas"].parentNode.getBoundingClientRect();
    
    this["mapVisibleColumns"] = Math.min(Math.trunc((bb.right - bb.left) / this.tileWidth) - 1, this.mapColumns);
    this["mapVisibleRows"] = Math.min(Math.trunc(document.body.clientHeight / this.tileHeight) - 1, this.mapRows);
    
    this["canvas"].width = this["mapVisibleColumns"] * this.tileWidth;
    this["canvas"].height = this["mapVisibleRows"] * this.tileHeight;
};

MapFactory.prototype.drawBackground = function () {    
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

MapFactory.prototype.drawCursor = function (i, j) {
    var cac = this["cac"];

    if (this["assetCursor"].src && cac && typeof cac === "function") {
        var coor = cac(i + this.viewOffsetI, j + this.viewOffsetJ);
        if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
            this.drawCursorTile(coor.x, coor.y, i, j);
        }
    }
};

MapFactory.prototype.drawBackgroundTile = function (sourceX, sourceY, i, j) {
    var destX = (i - this.viewOffsetI) * this.tileWidth;
    var destY = (j - this.viewOffsetJ) * this.tileHeight;
    var asset = this["assetBackground"];

    this["context"].drawImage(asset,
        sourceX, sourceY, this.tileWidth, this.tileHeight, destX, destY, this.tileWidth, this.tileHeight);
};

MapFactory.prototype.drawForegroundTile = function (sourceX, sourceY, i, j) {
    var destX = (i - this.viewOffsetI) * this.tileWidth;
    var destY = (j - this.viewOffsetJ) * this.tileHeight;
    var asset = this["assetForeground"];
    this["context"].drawImage(asset,
        sourceX, sourceY, this.tileWidth, this.tileHeight, destX, destY, this.tileWidth, this.tileHeight);
};

MapFactory.prototype.drawCursorTile = function (sourceX, sourceY, i, j) {
    var destX = (i - this.viewOffsetI) * this.tileWidth;
    var destY = (j - this.viewOffsetJ) * this.tileHeight;
    var asset = this["assetCursor"];
    this["context"].drawImage(asset,
        sourceX, sourceY, this.tileWidth, this.tileHeight, destX, destY, this.tileWidth, this.tileHeight);
};

MapFactory.prototype.clearTile = function (i, j) {
    var destX = (i - this.viewOffsetI) * this.tileWidth;
    var destY = (j - this.viewOffsetJ) * this.tileHeight;
    this["context"].clearRect(destX, destY, this.tileWidth, this.tileHeight);
};

MapFactory.prototype.restoreTile = function (i, j) {
    var bac = this["bac"];
    var fac = this["fac"];

    var assetBackground = this["assetBackground"];
    var assetForeground = this["assetForeground"];

    this.clearTile(i, j);
    if (assetBackground.src && bac && typeof bac === "function") {
        var coor = bac(i, j);
        if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
            this.drawBackgroundTile(coor.x, coor.y, i, j);
        }
    }
    if (assetForeground.src && fac && typeof fac === "function") {
        var coor = fac(i, j);
        if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
            this.drawForegroundTile(coor.x, coor.y, i, j);
        }
    }
}
