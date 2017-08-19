# RPG Map Factory

A pure, lightweight JavaScript library to create RPG-like map on HTML5 canvas. By **pure**, meaning it does not rely on any third-party library.

## How It Works

![How it works](https://github.com/rvhuang/rpg-map-factory/blob/master/doc/image/how-it-works.png)

The mapping functions are responsible for mapping logic between assets and actual map. When a **tile** is to be rendered on the visible area, the `MapFactory` instance invokes the callback functions to obtain left-top position on the assets.

```javascript
    var tileSize = 32; // The unit is pixel. 
    var mapSize = 40;  // The unit is tile.
    var canvasElementId = "myCanvas";
    var mapFactory = new MapFactory(canvasElementId, mapSize, mapSize, tileSize, tileSize);

    mapFactory.backgroundAsset('background.png'); // The asset URL
    mapFactory.backgroundAssetMapping(function (i, j) {
        // i and j are the coordinates of current tile to be displayed.
        // The unit is tile.
        // x and x are the left-top position on 'background.png' asset. 
        // The unit is pixel.
        var x = 0;
        var y = 0;
        //
        // TODO: put your mapping logic here.
        //
        return {x: x, y: x };
    });
```

A tile is rendered with following types of asset:

* Background
* Foreground
* Cursor

If a tile is not on visible area, the callback funtions will not be invoked for it. 

## Key Features

* Draggable map
* Responsible visiable area (can be disabled)
* No third-party dependencies
* Touch events supported (to be implemented in future)

More details are coming soon. 

