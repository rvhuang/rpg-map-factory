var tileSize = 32;
var mapSize = 40;
var mapData = new Array(mapSize);
var mapFactory = new MapFactory("myCanvas", mapSize, mapSize, tileSize, tileSize);
var selectedAsset = {
    type: 'foregroundAsset',
    x: 0,
    y: 0
}; // Default tile

$(document).ready(function (ev) {
    mapFactory.backgroundAsset('images/background.png');
    mapFactory.backgroundAssetMapping(function (i, j) {
        if (typeof mapData[i] === 'undefined' || typeof mapData[i][j] === 'undefined') {
            return {
                x: 7 * tileSize,
                y: 3 * tileSize
            }; // default background tile. 
        }
        return mapData[i][j].b;
    });
    mapFactory.foregroundAsset('images/foreground.png');
    mapFactory.foregroundAssetMapping(function (i, j) {
        if (typeof mapData[i] === 'undefined' || typeof mapData[i][j] === 'undefined') {
            return {};
        }
        return mapData[i][j].f;
    });
    mapFactory.cursorAsset('images/cursor.png');
    mapFactory.cursorAssetMapping(function (i, j) {
        return { x: selectedAsset.x, y: selectedAsset.y };
    }); 
    mapFactory.mousedown(function (ev, i, j) {
        applySelectedAsset(i, j);
    });
    mapFactory.rangeselecting(function (ev, leftTopI, leftTopJ, cols, rows) {
        mapFactory.drawCursor(leftTopI, leftTopJ, cols, rows);
    });
    mapFactory.rangeselected(function (ev, leftTopI, leftTopJ, cols, rows) {
        for (var i = leftTopI; i <= leftTopI + cols; i++) {
            for (var j = leftTopJ; j <= leftTopJ + rows; j++) {
                applySelectedAsset(i, j);
            }
        }
    });
    $('[data-toggle="tooltip"]').tooltip();
});

function applySelectedAsset(i, j) {
    if (typeof mapData[i] === 'undefined') {
        mapData[i] = new Array(mapSize);
    }
    if (typeof mapData[i][j] === 'undefined') {
        mapData[i][j] = { // Default value
            b: {
                x: 7 * tileSize,
                y: 3 * tileSize
            },
            f: {}
        };
    }
    switch (selectedAsset.type) {
        case 'foregroundAsset':
            mapData[i][j].f.x = selectedAsset.x;
            mapData[i][j].f.y = selectedAsset.y;
            break;
        case 'backgroundAsset':
            mapData[i][j].b.x = selectedAsset.x;
            mapData[i][j].b.y = selectedAsset.y;
            break;
    }
    mapFactory.restoreTile(i, j);
}

function mouseDownHandler(ev, elementId) {
    selectedAsset.x = Math.trunc(ev.offsetX / 32) * 32;
    selectedAsset.y = Math.trunc(ev.offsetY / 32) * 32;
    selectedAsset.type = elementId;

    var context = null;

    switch (elementId) {
        case 'backgroundAsset':
            mapFactory.cursorAsset('images/background.png');
            context = document.getElementById("selectedBackground").getContext('2d');
            break;
        case 'foregroundAsset':
            mapFactory.cursorAsset('images/cursor.png');
            context = document.getElementById("selectedForeground").getContext('2d');
            break;
    }
    // Display current selected asset.
    context.clearRect(0, 0, tileSize, tileSize);
    context.drawImage(document.getElementById(elementId), selectedAsset.x, selectedAsset.y, tileSize, tileSize, 0, 0, tileSize, tileSize);
}

function mapSizeChanged(element) {
    var value = parseInt($(element).val());

    if (isNaN(value)) return;

    switch ($(element).attr('id')) {
        case 'visibleAreaWidth':
            mapFactory.minVisibleCols = value;
            mapFactory.maxVisibleCols = value;
            break;
        case 'visibleAreaHeight':
            mapFactory.minVisibleRows = value;
            mapFactory.maxVisibleRows = value;
            break;
    }
    mapFactory.update();
}

function responsiveChanged(element) {
    $('#visibleAreaWidth').prop('disabled', element.checked);
    $('#visibleAreaHeight').prop('disabled', element.checked);

    if (element.checked) {
        mapFactory.maxVisibleCols = 0;
        mapFactory.minVisibleCols = 0;
        mapFactory.update();
    } else {
        mapSizeChanged($('#visibleAreaWidth')[0]);
        mapSizeChanged($('#visibleAreaHeight')[0]);
    }
}

function modeChanged(mode) {
    switch (mode) {
        case 'pen':
            mapFactory.mode = "mapDragging";
            break;
        case 'square':
            mapFactory.mode = "rangeOperating";
            break;
    }
}
