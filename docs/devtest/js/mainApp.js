var textureSource, gHeader, gRow, gFooter;
var queue;
var preload = false;

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

function centerOrigin(oimg, width, height) {
    if (width) {
        oimg.regX = oimg.image.width*.5;
    }
    if (height) {
        oimg.regY = oimg.image.height*.5;
    }
}

function startStuff() {
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

            var guiHeader = new createjs.Bitmap(gHeader);
            centerOrigin(guiHeader,true,false);
            guiHeader.x = stage.canvas.width*.5;
            guiHeader.y = 32;
            stage.addChild(guiHeader);
            
            var guiRow;
            for (var i=0; i<3; i++) {
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
            
            var testSprite = new createjs.Bitmap(testImage);
            testSprite.x = 159;
            testSprite.y = 67;
            stage.addChild(testSprite);

            stage.update();
            //createjs.Ticker.addEventListener("tick",runApp);
        }
    }

    // Dunno yet
    function runApp(event) {
        
    }

}