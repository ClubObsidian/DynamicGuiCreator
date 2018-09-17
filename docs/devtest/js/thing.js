// Use ajax to grab the minecraft block/item icons that destruc7i0n generously put together for the world.
function downloadTextureData(output) {
    return $.ajax({
        url: 'https://raw.githubusercontent.com/destruc7i0n/minecraft-textures/e04543fa12dbe3103d9d4986d80b437eac3cbd76/textures/113.js',
        type: 'GET',
        cache: true,
        success: function(data) {
            var tData;
            var dataScript = data.substring(0,data.length-26)+"; tData = Textures;"; // length-26 removes the "invalid" js code
            eval(dataScript);
            output(tData);
        },
        error: function() {
            output(-1);
        }
    });
}

function startStuff() {
    var textureData;
    /*
    var stage = new createjs.Stage("testCanvas");

    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 100;
    circle.y = 100;
    stage.addChild(circle);

    stage.update();
    */
   
    downloadTextureData(function(data){
        textureData = data;
        console.log(textureData);
    });

}

