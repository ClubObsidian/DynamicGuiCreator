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

function startStuff() {
    var textureSource;
    /*
    var stage = new createjs.Stage("testCanvas");

    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 100;
    circle.y = 100;
    stage.addChild(circle);

    stage.update();
    */

    var stage = new createjs.Stage('mainApp');
   
    downloadTextureData(function(data){
        textureSource = data;
    });

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick",checkTexture);

    // Function to check if the texture is downloaded.
    function checkTexture(event) {
        if (textureSource != undefined) {
            createjs.Ticker.removeEventListener("tick",checkTexture);
            var textureData = textureSource['items'];
            var testTexture= textureData[0]['texture']
            console.log(testTexture);
            var testImage = document.createElement("IMG");
            testImage.setAttribute('src', testTexture);
            var testSprite = new createjs.Bitmap(testImage);
            testSprite.regX = testSprite.image.width/2;
            testSprite.regY = testSprite.image.height/2;
            testSprite.x = stage.canvas.width/2;
            testSprite.y = stage.canvas.height/2;
            stage.addChild(testSprite)

            stage.update();
            //createjs.Ticker.addEventListener("tick",runApp);
        }
    }

    // Dunno yet
    function runApp(event) {
        
    }

}