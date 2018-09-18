var textureSource, gHeader, gRow, gFooter, eGlint1, eGlint2, glintSheet1, glintSheet2;
var queue;
var preload = false;

var slots = [];
var hue = 0;
var fpsText;

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
            glint1: undefined,
            glint2: undefined
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
        {id:'guifooter', src:'./img/GUI_Footer.png'},
        {id:'enchant1', src:'./img/glint1.png'},
        {id:'enchant2', src:'./img/glint2.png'}
    ])

    function preloadedAssets() {
        gHeader = queue.getResult('guiheader');
        gRow = queue.getResult('guirow');
        gFooter = queue.getResult('guifooter');
        eGlint1 = queue.getResult('enchant1');
        eGlint2 = queue.getResult('enchant2');
        glintSheet1 = new createjs.SpriteSheet({
            images: [eGlint1],
            frames: {width:64, height: 64, regX: 16, regY: 0},
            framerate: 43,
            animations: {
                default: {
                    frames: [0,63],
                    next: "default"
                }
            }
        })
        glintSheet2 = new createjs.SpriteSheet({
            images: [eGlint2],
            frames: {width:64, height: 64, regX: 16, regY: 0},
            framerate: 30,
            animations: {
                default: {
                    frames: [0,63],
                    next: "default"
                }
            }
        })

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

            fpsText = new createjs.Text("FPS: "+createjs.Ticker.getMeasuredFPS(), "20px Arial", "#000000");
            fpsText.x = 16;
            fpsText.y = 16;
            //fpsText.textBaseline = "alphabetic";
            stage.addChild(fpsText);

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
                slots[i]['image'].x = tx;
                slots[i]['image'].y = ty;
                slots[i]['image'].scaleX = 1.4;
                slots[i]['image'].scaleY = 1.4;
                slots[i]['image'].cache(0,0,45,45);

                var gImg1 = slots[i]['glint1'] = new createjs.Sprite(glintSheet1);
                gImg1.play();
                gImg1.x = tx;
                gImg1.y = ty;
                gImg1.scaleX = slots[i]['image'].scaleX;
                gImg1.scaleY = slots[i]['image'].scaleY;
                gImg1.alpha = .15;
                gImg1.filters = [
                    new createjs.AlphaMaskFilter(slots[i]['image'].cacheCanvas)
                    //,new createjs.ColorFilter(0,0,0,.25,0,0,0,0)
                ]

                var gImg2 = slots[i]['glint2'] = new createjs.Sprite(glintSheet2);
                gImg2.play();
                gImg2.x = tx;
                gImg2.y = ty;
                gImg2.scaleX = slots[i]['image'].scaleX;
                gImg2.scaleY = slots[i]['image'].scaleY;
                gImg2.alpha = .15;
                gImg2.filters = [
                    new createjs.AlphaMaskFilter(slots[i]['image'].cacheCanvas)
                ]

                stage.addChild(slots[i]['image']);

                slots[i]['glint1'].cache(0,0,45,45)
                slots[i]['glint2'].cache(0,0,45,45)
                stage.addChild(slots[i]['glint1']);
                stage.addChild(slots[i]['glint2']);
                if ((i+1)%9 == 0) {
                    doY++;
                    doX = 0;
                } else {
                    doX++;
                }
            }

            stage.update();
            //createjs.Ticker.addEventListener("tick",runApp);
            createjs.Ticker.on('tick', runApp);
        }
    }

    // Dunno yet
    function runApp(event) {
        fpsText.text = "FPS: "+createjs.Ticker.getMeasuredFPS();
        
        //hue++;
        var rgb = hsv2rgb(hue%255,255,255);
        for (var i=0; i<9*rows; i++) {
            slots[i]['glint1'].filters = [
                new createjs.AlphaMaskFilter(slots[i]['image'].cacheCanvas)
                //,new createjs.ColorFilter(0,0,0,.25,rgb[0],rgb[1],rgb[2],0)
            ]
            slots[i]['glint2'].filters = [
                new createjs.AlphaMaskFilter(slots[i]['image'].cacheCanvas)
                //,new createjs.ColorFilter(0,0,0,.25,rgb[0],rgb[1],rgb[2],0)
            ]
            slots[i]['glint1'].cache(0,0,45,45);
            slots[i]['glint2'].cache(0,0,45,45);
        }
        
        stage.update(event);
    }

}