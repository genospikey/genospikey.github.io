function Building(x, y, width, depthFactor, WindowWidth, WindowHeight, stage, groupFront, groupSide, groupTop, filter) {
    
    //set textures
    var textureFront = PIXI.Texture.fromImage('images/buildingFront.png');
    var textureSide = PIXI.Texture.fromImage('images/buildingSide.png');
    var textureSideTri = PIXI.Texture.fromImage('images/buildingSideTri.png');
    var textureTop = PIXI.Texture.fromImage('images/buildingTop.png');
    var textureTopTri = PIXI.Texture.fromImage('images/buildingTopTri.png');
    
    //get center
    var centerX = WindowWidth/2;
    var centerY = WindowHeight/2;
    depthFactor = depthFactor * WindowWidth/2000;

    //create building sprites
    var front = new PIXI.Sprite(textureFront);
    front.height = WindowHeight;
    front.width = width;
    front.x = x;
    front.y = y;
    
    var triWidthLeft = depthFactor * (centerX - x);
    var triHeight = depthFactor * 0.5 * (centerY - y);
    var triWidthRight = depthFactor * (centerX - x - width);
    // console.log(triWidthLeft + " " + triWidthRight);

    var sideLeft = new PIXI.Sprite(textureSide);
    sideLeft.height = WindowHeight;
    sideLeft.width = triWidthLeft;
    sideLeft.x = x;
    sideLeft.y = Math.max(y + triHeight,y);
    sideLeft.scale = 1;

    var sideRight = new PIXI.Sprite(textureSide);
    sideRight.height = WindowHeight;
    sideRight.width = triWidthRight;
    sideRight.x = x + width;
    sideRight.y = Math.max(y + triHeight,y);
    sideRight.scale = 1;
    
    var sideTriRight = new PIXI.Sprite(textureSideTri);
    if(y < centerY){
        sideTriRight.height = triHeight;
        sideTriRight.width = -1 * triWidthRight;
        sideTriRight.x = x + width + triWidthRight;
        sideTriRight.y = y;
        sideTriRight.scale = 1;
    }
    else{
        sideTriRight.height = -1 * triHeight;
        sideTriRight.width = triWidthRight;
        sideTriRight.x = x + width;
        sideTriRight.y = y + triHeight;
        sideTriRight.scale = 1;
    }

    var sideTriLeft = new PIXI.Sprite(textureSideTri);
    if(y < centerY){
        sideTriLeft.height = triHeight;
        sideTriLeft.width = -1 * triWidthLeft;
        sideTriLeft.x = x + triWidthLeft;
        sideTriLeft.y = y;
        sideTriLeft.scale = 1;
    }
    else{
        sideTriLeft.height = -1 * triHeight;
        sideTriLeft.width = triWidthLeft;
        sideTriLeft.x = x;
        sideTriLeft.y = y + triHeight;
        sideTriLeft.scale = 1;
    }
    

    var topTriLeft = new PIXI.Sprite(textureTopTri);
    if(y < centerY){
        topTriLeft.visible = false;
    }
    else{
        if(x < centerX){
            topTriLeft.height = -1 * triHeight;
            topTriLeft.width = triWidthLeft;
            topTriLeft.x = x;
            topTriLeft.y = y + triHeight;
            topTriLeft.scale = 1;
            topTriLeft.visible = true;	
        }
        else{
            topTriLeft.height = triHeight;
            topTriLeft.width = -1 * triWidthLeft;
            topTriLeft.x = x + triWidthLeft;
            topTriLeft.y = y;
            topTriLeft.scale = 1;
            topTriLeft.visible = true;	
        }
        
    }

    var topTriRight = new PIXI.Sprite(textureTopTri);
    if(y < centerY){
        topTriRight.visible = false;
    }
    else{
        if(x + width < centerX){
            topTriRight.height = triHeight;
            topTriRight.width = -1 * triWidthRight;
            topTriRight.x = x + width + triWidthRight;
            topTriRight.y = y;
            topTriRight.scale = 1;
            topTriRight.visible = true;	
        }
        else{
            topTriRight.height = -1 * triHeight;
            topTriRight.width = triWidthRight;
            topTriRight.x = x + width;
            topTriRight.y = y + triHeight;
            topTriRight.scale = 1;
            topTriRight.visible = true;	
        }
    }

    var top = new PIXI.Sprite(textureTop);
    if(y < centerY){
        top.visible = false;
    }
    else{
        top.height = triHeight;
        top.width = width;
        top.x = x
        if(x < centerX){
            top.width -= triWidthLeft;
            top.x += triWidthLeft;
        }

        if(x + width > centerX){
            top.width += triWidthRight;
        } 

        top.y = y;
        top.scale = 1;
        top.visible = true;	
    }

    sideLeft.parentGroup = groupSide;
    sideRight.parentGroup = groupSide;
    sideTriRight.parentGroup = groupSide;
    sideTriLeft.parentGroup = groupSide;
    front.parentGroup = groupFront;
    topTriLeft.parentGroup = groupTop;
    topTriRight.parentGroup = groupTop;
    top.parentGroup = groupTop;

    stage.addChild(sideLeft);
    stage.addChild(sideRight);
    stage.addChild(sideTriRight);
    stage.addChild(sideTriLeft);
    stage.addChild(topTriLeft);
    stage.addChild(topTriRight);
    stage.addChild(top);
    stage.addChild(front);

    if(filter){
        // console.log(typeof filter);
        front.filters = [filter];
        sideRight.filters = [filter];
        sideLeft.filters = [filter];
        sideTriLeft.filters = [filter];
        sideTriRight.filters = [filter];
        topTriLeft.filters = [filter];
        topTriRight.filters = [filter];
        top.filters = [filter];
    }
    var winTex = new PIXI.Texture.fromImage('images/window.png');
    var signTex = new PIXI.Texture.fromImage('images/whiteSquare.png');
    
    // console.log(depthFactor/(WindowWidth/2000));

    if(depthFactor/(WindowWidth/2000) > 0.05){
        addWindows(front, filter, 10 + Math.floor(Math.random()*5), winTex, WindowHeight, stage);
        addSign(sideLeft,signTex,filter,stage);
    }
}

function addWindows(building, filter, rowSize, texture, WindowHeight, stage){
    //determine number of windows
    var winWidth = (building.width - 10)/rowSize;
    var winHeight = winWidth * 2;
    var xOffset = 10;
    

    for(var y = 5; y < building.height && y < WindowHeight; y = y + winHeight){
        for(var x = 5; x < building.width - winWidth && x < WindowWidth; x = x + winWidth){
            var winSprite = new PIXI.Sprite(texture);
            winSprite.x = winWidth/10 + building.x + x;
            winSprite.y = winHeight/10 + building.y + y;
            winSprite.width = winWidth  - winWidth/5;
            winSprite.height = winHeight - winHeight/5;
            winSprite.parentGroup = building.parentGroup;
            building.addChild(winSprite);
            stage.addChild(winSprite);
        }
    }
}

function addSign(building, texture, filter, stage){
    var sign = new PIXI.Sprite(texture);
    console.log(building.x + " " + building.width);
    sign.x = building._width/2 + building.x;
    console.log(building.y);
    sign.y = building.y+10;

    //add to canvas
    sign.parentGroup = building.parentGroup;
    sign.zOrder = 1;
    building.addChild(sign);  
    stage.addChild(sign);
}