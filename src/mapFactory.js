class MapFactory {
    constructor(canvasName, mapCols, mapRows, tileWidth, tileHeight) {
        var _self = this;

        this.tileWidth = typeof tileWidth === "number" ? Math.abs(tileWidth) : 0;
        this.tileHeight = typeof tileHeight === "number" ? Math.abs(tileHeight) : 0;
        this.mapCols = typeof mapCols === "number" ? Math.abs(mapCols) : 0;
        this.mapRows = typeof mapRows === "number" ? Math.abs(mapRows) : 0;
        this.viewOffsetI = 0;
        this.viewOffsetJ = 0;

        this.minVisibleRows = Math.min(Math.trunc(document.body.clientHeight / this.tileHeight) /*- 1*/, this.mapRows);
        this.minVisibleCols = 0;
        this.maxVisibleRows = this.minVisibleRows; // Default behavior is fixed rows.
        this.maxVisibleCols = 0;

        this.mode = "mapDragging";

        var currOffsetI = 0;
        var currOffsetJ = 0;
        var crsrOffsetI = 0;
        var crsrOffsetJ = 0;

        var canvas = this["canvas"] = document.getElementById(canvasName);
        var context = this["context"] = canvas.getContext('2d');

        var assetBackground = this["assetBackground"] = new Image();
        var assetForeground = this["assetForeground"] = new Image();
        var assetCursor = this["assetCursor"] = new Image();

        var showCursor = function (ev) {
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
        };
        var hideCursor = function (ev) { // Hide cursor when mouse leaves
            var oldI = parseInt(canvas.dataset.offsetI);
            var oldJ = parseInt(canvas.dataset.offsetJ);

            _self.restoreTile(oldI, oldJ);
        };
        var mapDragging = function (ev) { // Dragging map 
            var tempOffsetI = Math.trunc(ev.offsetX / _self.tileWidth);
            var tempOffsetJ = Math.trunc(ev.offsetY / _self.tileHeight);

            var mapVisibleCols = _self["mapVisibleCols"];
            var mapVisibleRows = _self["mapVisibleRows"];

            var update = false;

            if (crsrOffsetI !== tempOffsetI) {
                var tempI = crsrOffsetI - tempOffsetI + currOffsetI;

                if (tempI < 0) {
                    tempI = 0;
                } else if (tempI + mapVisibleCols >= _self.mapCols) {
                    tempI = _self.mapCols - mapVisibleCols;
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
            if (update) {
                _self.drawBackground();
                _self.drawForeground();
            }
            canvas.style.cursor = "move";
        };
        var rangeOperating = function (ev, callbackName) {
            var tempOffsetI = Math.trunc(ev.offsetX / _self.tileWidth);
            var tempOffsetJ = Math.trunc(ev.offsetY / _self.tileHeight);

            var newI = tempOffsetI + _self.viewOffsetI;
            var newJ = tempOffsetJ + _self.viewOffsetJ;
            var oldI = parseInt(canvas.dataset.offsetI);
            var oldJ = parseInt(canvas.dataset.offsetJ);

            if (newI !== oldI || newJ !== oldJ || callbackName === "rangeselected") {
                canvas.dataset.offsetI = newI;
                canvas.dataset.offsetJ = newJ;

                for (var i = Math.min(crsrOffsetI + _self.viewOffsetI, oldI); i <= Math.max(crsrOffsetI + _self.viewOffsetI, oldI); i++) {
                    for (var j = Math.min(crsrOffsetJ + _self.viewOffsetJ, oldJ); j <= Math.max(crsrOffsetJ + _self.viewOffsetJ, oldJ); j++) {
                        _self.restoreTile(i, j);
                    }
                }
                var callback = _self[callbackName];
                if (callback && typeof callback === "function") {
                    callback(ev, Math.min(crsrOffsetI, tempOffsetI) + _self.viewOffsetI, Math.min(crsrOffsetJ, tempOffsetJ) + _self.viewOffsetJ,
                        Math.abs(crsrOffsetI - tempOffsetI), Math.abs(crsrOffsetJ - tempOffsetJ)); // left-top I, left-top J, width, height
                }
            }
        };
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
            switch (_self.mode) {
                case "mapDragging":
                    mapDragging(ev);
                    return true;
                case "rangeOperating":
                    rangeOperating(ev, "rangeselecting");
                    return true;
            }
        });
        canvas.addEventListener("mouseup", function (ev) {
            canvas.style.cursor = "initial";

            var tempOffsetI = Math.trunc(ev.offsetX / _self.tileWidth);
            var tempOffsetJ = Math.trunc(ev.offsetY / _self.tileHeight);

            if (crsrOffsetI === tempOffsetI && crsrOffsetJ === tempOffsetJ) { // Position doesn't change.
                var callback = _self["mousedown"];
                if (callback) {
                    callback(ev, tempOffsetI + _self.viewOffsetI, tempOffsetJ + _self.viewOffsetJ);
                }
            }
            else {
                switch (_self.mode) {
                    case "mapDragging":
                        // TODO:
                        break;
                    case "rangeOperating":
                        rangeOperating(ev, "rangeselected");
                        break;
                }
            }
        });
        //-------------------------------//
        window.addEventListener("resize", function (ev) {
            _self.update();
        });
        //-------------------------------//
        assetBackground.onload = function (ev) {
            _self.drawBackground();
        };
        assetForeground.onload = function (ev) {
            _self.drawForeground();
        };
        assetCursor.onload = function (ev) {
            canvas.addEventListener("mousemove", showCursor);
            canvas.addEventListener("mouseleave", hideCursor);
        };
        //-------------------------------//
        this.updateMapVisibleSize();
        //-------------------------------//
    }
}

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

MapFactory.prototype.mousedown = function (callback) {
    if (typeof callback === 'function') {
        this["mousedown"] = callback;
        return this;    
    }
    return this["mousedown"];
};

MapFactory.prototype.rangeselecting = function (callback) {
    if (typeof callback === 'function') {
        this["rangeselecting"] = callback;
        return this;
    }
    return this["rangeselecting"];
};

MapFactory.prototype.rangeselected = function (callback) {
    if (typeof callback === 'function') {
        this["rangeselected"] = callback;
        return this;
    }
    return this["rangeselected"];
};

MapFactory.prototype.updateMapVisibleSize = function () {
    var bb = this["canvas"].parentNode.getBoundingClientRect();
    var rows = Math.min(Math.trunc(document.body.clientHeight / this.tileHeight) /*- 1*/, this.mapRows);
    var cols = Math.min(Math.trunc((bb.right - bb.left) / this.tileWidth) - 1, this.mapCols);

    if (this.minVisibleRows > 0 && rows < this.minVisibleRows) {
        rows = this.minVisibleRows;
    }
    else if (this.maxVisibleRows > 0 && this.maxVisibleRows >= this.minVisibleRows && rows > this.maxVisibleRows) {
        rows = this.maxVisibleRows;
    }
    if (this.minVisibleCols > 0 && cols < this.minVisibleCols) {
        cols = this.minVisibleCols;
    }
    else if (this.maxVisibleCols > 0 && this.maxVisibleCols >= this.minVisibleCols && cols > this.maxVisibleCols) {
        cols = this.maxVisibleCols;
    }

    this["mapVisibleCols"] = cols;
    this["mapVisibleRows"] = rows;

    this["canvas"].width = cols * this.tileWidth;
    this["canvas"].height = rows * this.tileHeight;
};

MapFactory.prototype.drawBackground = function () {    
    var mapVisibleCols = this["mapVisibleCols"];
    var mapVisibleRows = this["mapVisibleRows"];
    var bac = this["bac"];

    if (this["assetBackground"].src && bac && typeof bac === "function") {
        for (var i = this.viewOffsetI; i < mapVisibleCols + this.viewOffsetI; i++) {
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
    var mapVisibleCols = this["mapVisibleCols"];
    var mapVisibleRows = this["mapVisibleRows"];
    var fac = this["fac"];

    if (this["assetForeground"].src && fac && typeof fac === "function") {
        for (var i = this.viewOffsetI; i < mapVisibleCols + this.viewOffsetI; i++) {
            for (var j = this.viewOffsetJ; j < mapVisibleRows + this.viewOffsetJ; j++) {
                var coor = fac(i, j);
                if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
                    this.drawForegroundTile(coor.x, coor.y, i, j);
                }
            }
        }
    }
};

MapFactory.prototype.drawCursor = function (i, j, cols, rows) {
    var cac = this["cac"];

    cols = isNaN(cols) ? 1 : parseInt(cols);
    rows = isNaN(rows) ? 1 : parseInt(rows);

    if (this["assetCursor"].src && cac && typeof cac === "function") {
        for (var tempI = i; tempI < i + cols; tempI++) {
            for (var tempJ = j; tempJ < j + rows; tempJ++) {
                var coor = cac(tempI, tempJ);
                if (coor && typeof coor.x === 'number' && typeof coor.y === 'number') {
                    this.drawCursorTile(coor.x, coor.y, tempI, tempJ);
                }
            }
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

MapFactory.prototype.update = function () {
    this.updateMapVisibleSize();
    this.drawBackground();
    this.drawForeground();
}
