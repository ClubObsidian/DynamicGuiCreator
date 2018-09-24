var textureSource, gHeader, gRow, gFooter, eGlint1, eGlint2, glintSheet1, glintSheet2;
var cGUI, cHover;
var queue;
var preload = false;

var slots = [];
var hue = 0;
var fpsText, hoverText;

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

var minecraftColors = {
    0: '#000000',
    1: '#0000AA',
    2: '#00AA00',
    3: '#00AAAA',
    4: '#AA0000',
    5: '#AA00AA',
    6: '#FFAA00',
    7: '#AAAAAA',
    8: '#555555',
    9: '#5555FF',
    a: '#55FF55',
    b: '#55FFFF',
    c: '#FF5555',
    d: '#FF55FF',
    e: '#FFFF55',
    f: '#FFFFFF'
}
var minecraftFormat = {
    r: "", // Reset
    k: "", // Random
    l: "BOLD ", // Bold
    m: "", // Strike
    n: "", // Underline
    o: "ITALIC " // Italic
}

// Used Forge as a reference on how to render the "magic" random text
function magicMinecraftText(ctx, text) {
    var whyMinecraft = "\u00c0\u00c1\u00c2\u00c8\u00ca\u00cb\u00cd\u00d3\u00d4\u00d5\u00da\u00df\u00e3\u00f5\u011f\u0130\u0131\u0152\u0153\u015e\u015f\u0174\u0175\u017e\u0207 !\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00f8\u00a3\u00d8\u00d7\u0192\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u00ae\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580\u03b1\u03b2\u0393\u03c0\u03a3\u03c3\u03bc\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u2205\u2208\u2229\u2261\u00b1\u2265\u2264\u2320\u2321\u00f7\u2248\u00b0\u2219\u00b7\u221a\u207f\u00b2\u25a0"
    var splitChars = text.split("");
    var magicText = "";
    for (var i=0; i<splitChars.length; ++i) {
        var char = splitChars[i];

        var j = whyMinecraft.indexOf(char);

        if (j != -1) {
            var charWidth = ctx.measureText(char).width;
            var randomChar;

            while (true) {
                j = Math.round(Math.random()*whyMinecraft.length);
                randomChar = whyMinecraft.charAt(j);

                if (charWidth == ctx.measureText(randomChar).width) {
                    break;
                }
            }
            
            magicText += randomChar;
        }
    }
    
    return magicText;
}

function parseMinecraftText(text) {
    var mText = [];
    var mLines = [];
    var mLine = 0;
    var mIndex = 0;
    var mEscape = false;
    var colorCode = "f";
    for (var i=0; i<= text.length; ++i) {
        var c = text.charAt(i);
        var c2;
        if (i+1 <= text.length) {
            c2 = text.charAt(i+1);
        }
        if (c == "&" && !mEscape) {
            if (c2 != undefined) {
                if (c2 == "&") {
                    mEscape = true;
                } else {
                    if (minecraftColors[c2] != undefined) {
                        if (mText[mIndex] != undefined){
                            mIndex++;
                        }
                        i++;
                        colorCode = c2.toLowerCase();
                        mText[mIndex] = ["",colorCode]
                    } else if (minecraftFormat[c2] != undefined) {
                        var prevFormat = ""
                        if (i != 0) {
                            if (mText[mIndex][0] != "") {
                                prevFormat = mText[mIndex][1];
                                mIndex++;
                            }
                        }
                        i++
                        var formatCode = c2.toLowerCase();
                        if (formatCode == "r") {
                            colorCode = "f";
                            prevFormat = colorCode;
                            mText[mIndex] = ["",colorCode];
                        } else {
                            if (mText[mIndex] == undefined) {
                                mText[mIndex] = ["",prevFormat+formatCode];
                            } else {
                                mText[mIndex][1] += formatCode;
                            }
                        }
                    }
                }
            }
        } else if (c == "|" && c2 == "|") {
            i++;
            mLines[mLine] = mText;
            mLine++;
            mText = [];
            mEscape = false;
            mIndex = 0;
            colorCode = "f";
        } else {
            if (mText[mIndex] == undefined) {
                mText[mIndex] = [c,'f'];
            } else {
                if (c2 != "&" && mEscape) {
                    mEscape = false;
                    mText[mIndex][0] += c;
                } else if (!mEscape) {
                    mText[mIndex][0] += c;
                }
            }
        }
        if (i == text.length) {
            mLines[mLine] = mText;
        }
    }
    return mLines;
}

function drawGUI(st) {

}

// Extends EaselJS's text class to help render Minecraft text
function minecraftText(text, font) {
    this.Text_constructor(text, font+" Minecraft");
}

var p = createjs.extend(minecraftText, createjs.Text);

p._drawText = function(ctx, o, lines) {
    var paint = !!ctx;
    if (!paint) {
        this.parsedText = parseMinecraftText(this.text);
        ctx = Text._workingContext;
        ctx.save();
        this._pretContext(ctx);
    }
    var lineHeight = this.lineHeight||this.getMeasuredLineHeight();
    var maxW = 0;
    var tx = 0;
    var ty = 0;
    if (this.parsedText == undefined || this.previousText != this.text) {
        this.parsedText = parseMinecraftText(this.text);
        this.previousText = this.text;
    }
    var textLines = this.parsedText;
    var font = this.font;
    for (var i=0; i<textLines.length; ++i) {
        var lineData = textLines[i];
        for (var j=0; j<lineData.length; ++j) {
            var formatCodes = lineData[j][1].split("");
            var fontFormat = "";
            var strike = false;
            var underline = false;
            var magic = false;
            for (k=1; k<formatCodes.length; ++k) {
                switch (formatCodes[k]) {
                    case "m":
                        strike = true;
                    break;

                    case "n":
                        underline = true;
                    break;

                    case "k":
                        magic = true;
                    break;

                    default:
                        fontFormat += minecraftFormat[formatCodes[k]];
                    break;
                }
            }
            var textChar = lineData[j][0];
            ctx.font = fontFormat+font;
            ctx.fillStyle = minecraftColors[formatCodes];
            if (magic){
                var magicText = magicMinecraftText(ctx, textChar);
                ctx.fillText(magicText, tx, ty, this.maxWidth||0xFFFF);
            } else {
                ctx.fillText(textChar, tx, ty, this.maxWidth||0xFFFF);
            }

            if (strike || underline) {
                var prevStrokeStyle = ctx.strokeStyle;
                var strokeWidth = ctx.measureText(textChar).width;
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (strike) {
                    var strokeY = ty+(lineHeight*.5);
                    ctx.moveTo(tx,strokeY);
                    ctx.lineTo(tx+strokeWidth,strokeY);
                    ctx.stroke();
                }
                if (underline) {
                    var strokeY = ty+lineHeight+3;
                    ctx.moveTo(tx,strokeY);
                    ctx.lineTo(tx+strokeWidth,strokeY);
                    ctx.stroke();
                }
                ctx.closePath()
                //ctx.strokeStyle = prevStrokeStyle;
            }
            tx += ctx.measureText(textChar).width;
        }
        ty += lineHeight+6;
        if (tx > maxW) { maxW = tx; }
        tx = 0;
    }
    ctx.font = font;

    if (o) {
        o.width = maxW;
        o.height = (textLines.length+1)*lineHeight;
    }
    if (!paint) { ctx.restore(); }
    return o;
}

window.minecrafText = createjs.promote(minecraftText, "Text");

function startStuff() {
    var maxRows = 5;
    var maxCols = 9;
    var guiW = 528; // The width of the entire GUI
    var guiH = 501; // Mistake... Forgot rows make height dynamic
    var guiX = 0; // GUI's x location
    var guiY = 0; // GUI's y location
    var guiSlotStartX = 24; // X location of where to start drawing items in slot (offset by gui's x)
    var guiSlotStartY = 54; // Y location of where to start drawing items in slot (offset by gui's y)
    var guiSlotGap = 9; // The gap between each slots
    var slotBounds = 45; // The size of the slot
    
    var rows = 3; // User defined rows. 3 is the default

    // initialize the slots in the inventory
    for (var i=0; i<(maxRows*maxCols); i++) {
        slots[i] = {
            item: 'air',
            data: {test: 1337},
            x: 0,
            y: 0,
            image: undefined,
            glint1: undefined,
            glint2: undefined,
            hover: undefined
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
            framerate: 35,
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
            framerate: 28,
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
    createjs.Ticker.addEventListener('tick',checkAssets);

    // Function to check if the texture is downloaded.
    function checkAssets(event) {
        if (textureSource != undefined && preload == true) {
            createjs.Ticker.removeEventListener("tick",checkAssets);
            var textureData = textureSource['items'];
            var testTexture= textureData[0]['texture']
            //console.log(testTexture);
            var testImage = new Image();
            testImage.setAttribute('src', testTexture);

            fpsText = new createjs.Text("FPS: "+createjs.Ticker.getMeasuredFPS(), "20px Arial", "#000000");
            //fpsText = new minecraftText("FPS: "+createjs.Ticker.getMeasuredFPS())
            fpsText.x = 16;
            fpsText.y = 16;
            //fpsText.textBaseline = "alphabetic";
            stage.addChild(fpsText);

            cGUI = new createjs.Container();


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

            cHover = new createjs.Container();

            hoverText = new minecraftText("test &aa&bb &cc TEST & && &&& &ddTEST &ee &ff &1one &22&33&44||NL &acolor change &lBold &mStrike Bold||NL &bcolor change &nUnderline &mWith strike &land bold &rReset format||NL &dChange color &kMagic text &rReset format", "16px");
            hoverText.x = 0;
            hoverText.y = 0;
            cHover.addChild(hoverText);
            stage.addChild(cHover);
            stage.on("stagemousemove", function(evt) {
                cHover.x = Math.round(evt.stageX)+20;
                cHover.y = Math.round(evt.stageY)-20;
            })

            stage.update();
            //createjs.Ticker.addEventListener("tick",runApp);
            createjs.Ticker.on('tick', runApp);
        }
    }

    // Run the main app
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