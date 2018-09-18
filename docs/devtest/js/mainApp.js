var textureSource, gHeader, gRow, gFooter;
var queue;
var preload = false;

var slots = [];
var hue = 0;

// Use ajax to grab the minecraft block/item icons that destruc7i0n generously put together for the world.
function downloadTextureData(output) {
    return $.ajax({
        url: 'https://raw.githubusercontent.com/destruc7i0n/minecraft-textures/e04543fa12dbe3103d9d4986d80b437eac3cbd76/textures/113.js',
        type: 'GET',
        cache: true,
        success: function(data) {
            var tData;
            var dataScript = data.substring(0,data.length-26)+'; tData = Textures;'; // length-26 removes the "invalid" js code
            eval(dataScript);
            output(tData);
        },
        error: function() {
            output(-1);
        }
    });
}

// Centers the image's anchor point
function centerOrigin(oimg, width, height) {
    if (width) {
        oimg.regX = oimg.image.width*.5;
    }
    if (height) {
        oimg.regY = oimg.image.height*.5;
    }
}

// Converts HSV to RGB
function hsv2rgb(h,s,v) {
	var r, g, b, i, f, p, q, t;
	
	h = h/255;
	s = s/255;
	v = v/255;
	
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}
	return [
		Math.round(r * 255),
		Math.round(g * 255),
		Math.round(b * 255)
	];
}

function drawGUI(st) {

}

function startStuff() {
    var maxRows = 5;
    var maxCols = 9;
    var guiW = 528;
    var guiH = 501;
    var guiX = 0;
    var guiY = 0;
    var guiSlotStartX = 24;
    var guiSlotStartY = 54;
    var guiSlotGap = 9;
    var slotBounds = 45
    
    var rows = 3;

    // initialize the slots in the inventory
    for (var i=0; i<(maxRows*maxCols); i++) {
        slots[i] = {
            item: 'air',
            data: {test: 1337},
            x: 0,
            y: 0,
            image: undefined,
            effects: undefined
        }
    }

    var stage = new createjs.Stage('mainApp');

    // Fetches the minecraft textures from a git repo
    downloadTextureData(function(data){
        textureSource = data;
    });

    // Preloads the gui creator assets
    queue = new createjs.LoadQueue();
    queue.addEventListener('complete', preloadedAssets);
    queue.loadManifest([
        {id:'guiheader', src:'./img/GUI_Header.png'},
        {id:'guirow', src:'./img/GUI_Row.png'},
        {id:'guifooter', src:'./img/GUI_Footer.png'}
    ])

    function preloadedAssets() {
        gHeader = queue.getResult('guiheader');
        gRow = queue.getResult('guirow');
        gFooter = queue.getResult('guifooter');
        preload = true;
    }

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener('tick',checkTextures);

    // Function to check if the texture is downloaded.
    function checkTextures(event) {
        if (textureSource != undefined && preload == true) {
            createjs.Ticker.removeEventListener("tick",checkTextures);
            var textureData = textureSource['items'];
            var testTexture= textureData[0]['texture']
            console.log(testTexture);
            var testImage = new Image();
            testImage.setAttribute('src', testTexture);

            guiX = Math.round(stage.canvas.width*.5)-Math.round(guiW*.5);
            guiY = Math.round(stage.canvas.height*.5)-Math.round(guiH*.5);

            var guiHeader = new createjs.Bitmap(gHeader);
            centerOrigin(guiHeader,true,false);
            guiHeader.x = guiX+Math.round(guiW*.5);
            guiHeader.y = guiY;
            stage.addChild(guiHeader);
            
            var guiRow;
            for (var i=0; i<rows; i++) {
                guiRow = new createjs.Bitmap(gRow);
                centerOrigin(guiRow,true,false);
                guiRow.x = stage.canvas.width*.5;
                guiRow.y = (guiHeader.y+guiHeader.image.height)+(i*guiRow.image.height);
                stage.addChild(guiRow);
            }

            var guiFooter = new createjs.Bitmap(gFooter);
            centerOrigin(guiFooter,true,false);
            guiFooter.x = stage.canvas.width*.5;
            guiFooter.y = guiRow.y+guiRow.image.height;
            stage.addChild(guiFooter);
            
            var doX = 0;
            var doY = 0;
            for (var i=0; i < 9*rows; i++) {
                var tx, ty;
                tx = guiX+guiSlotStartX+(guiSlotGap*doX)+(slotBounds*doX);
                ty = guiY+guiSlotStartY+(guiSlotGap*doY)+(slotBounds*doY);
                
                slots[i]['item'] = textureData['id'];
                slots[i]['x'] = tx;
                slots[i]['y'] = ty;
                slots[i]['image'] = new createjs.Bitmap(testImage);
                slots[i]['effects'] = new createjs.Bitmap(testImage);
                slots[i]['image'].x = tx;
                slots[i]['image'].y = ty;
                slots[i]['image'].scaleX = 1.4;
                slots[i]['image'].scaleY = 1.4;

                slots[i]['effects'].x = tx;
                slots[i]['effects'].y = ty;
                slots[i]['effects'].scaleX = slots[i]['image'].scaleX;
                slots[i]['effects'].scaleY = slots[i]['image'].scaleY;
                slots[i]['effects'].alpha = 1;
                slots[i]['effects'].filters = [
                    new createjs.ColorFilter(0,0,0,.25,0,0,0,0)
                ]

                stage.addChild(slots[i]['image']);
                slots[i]['effects'].cache(0,0,45,45)
                stage.addChild(slots[i]['effects']);
                if ((i+1)%9 == 0) {
                    doY++;
                    doX = 0;
                } else {
                    doX++;
                }
            }

            stage.update();
            createjs.Ticker.addEventListener("tick",runApp);
        }
    }

    // Dunno yet
    function runApp(event) {
        hue++;
        var rgb = hsv2rgb(hue%255,255,255);
        for (var i=0; i<9*rows; i++) {
            slots[i]['effects'].filters = [
                new createjs.ColorFilter(0,0,0,.1,rgb[0],rgb[1],rgb[2],0)
            ]
            slots[i]['effects'].cache(0,0,45,45);
        }
        stage.update();
    }

}