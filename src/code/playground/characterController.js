function Vec3toString(vec3, fixed = 2) {
    return "{"+ vec3.x.toFixed(fixed) +
           " "+ vec3.y.toFixed(fixed) + 
           " "+ vec3.z.toFixed(fixed) + "}";
}

function NormaltoSlopeXZ(vec3) {
    var vecXY = new BABYLON.Vector3(vec3.x, vec3.y, 0); vecXY.normalize();
    var vecYZ = new BABYLON.Vector3(0, vec3.y, vec3.z); vecYZ.normalize();
    var pitch = Math.acos(
            BABYLON.Vector3.Dot(vecYZ, new BABYLON.Vector3.Up()));
    var roll = Math.acos(
            BABYLON.Vector3.Dot(vecXY, new BABYLON.Vector3.Up()));
    return [
        vec3.z<0 ? -pitch : pitch,
        vec3.x<0 ? -roll : roll
    ];
}

function toDeg(rad) {
    return rad / Math.PI * 180;
}

function toRad(deg) {
    return deg / 180 * Math.PI;
}

function InjectVec3toLine(vec3, line) {
    // console.log("vec3", vec3);
    // console.log("line", line);
    line.updateVerticesData(BABYLON.VertexBuffer.PositionKind, [0,0,0,vec3.x, vec3.z, vec3.z]);
}

var createScene = function () {
    // scene and scene settings
    var scene = new BABYLON.Scene(engine);
    var startTime = new Date();

    // basic axis / vector visualiation ------------------------------------------------------------------------------------------------
    var vecX = new BABYLON.LinesBuilder.CreateLines("vecX", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(1,0,0)]});
    var vecY = new BABYLON.LinesBuilder.CreateLines("vecY", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,1,0)]});
    var vecZ = new BABYLON.LinesBuilder.CreateLines("vecZ", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,0,1)]});
    vecX.position.y = 0.01; vecY.position.y = 0.01; vecZ.position.y = 0.01;
    vecX.color = new BABYLON.Color4(1,0,0,1);
    vecY.color = new BABYLON.Color4(0,1,0,1);
    vecZ.color = new BABYLON.Color4(0,0,1,1);

    // player setup -------------------------------------------------------------------------------------------------------------
    var pwidth = 0.5;
    var pheight = 1.8;
    var pdepth = 0.5;
    var floatingDistToGround = 0.05;
    // var player = new BABYLON.MeshBuilder.CreateBox("player", {height: pheight, width: pwidth, depth: pdepth});
    var player = new BABYLON.MeshBuilder.CreateSphere("player", {
        diameterY: pheight-floatingDistToGround*2, 
        diameterX: pwidth, 
        diameterZ: pdepth});
    
    player.material = new BABYLON.StandardMaterial("playerMat", scene);
    player.material.emissiveColor = new BABYLON.Color4(0,0.8,0,1);
    player.material.wireframe = true;
    player.material.alpha = 0.1;
    player.material.transparencyMode = 2;
    player.material. roughness = 1;
    player.position = new BABYLON.Vector3(1, 3, 1);
    
    var charX = vecX.clone(); charX.parent = player; charX.scaling.x = 0.5;
    var charY = vecY.clone(); charY.parent = player; charY.scaling.y = 0.5;
    var charZ = vecZ.clone(); charZ.parent = player; charZ.scaling.z = 0.5;
    player.charNormal = vecY.clone(); player.charNormal.parent = player; 
    player.charNormal.color = new BABYLON.Color4(0.08, 0.88, 0.99);
    player.charNormal.position.x = -0.02;

    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(
        pwidth/2, 
        pheight/2-floatingDistToGround, 
        pdepth/2);

    player.contactRay = new BABYLON.Ray(
        player.position,
        new BABYLON.Vector3(0, -1.0, 0));
    player.contactRay.length = 1.5;

    var charRay = vecY.clone(); charRay.parent = player; 
    charRay.scaling = new BABYLON.Vector3(0, -1.01, 0);
    charRay.color = new BABYLON.Color4(0.96, 1, 0);

    player.inputDirection = new BABYLON.Vector3(0,0,0);
    player.velocity = new BABYLON.Vector3(0,0,0);
    player.normal = new BABYLON.Vector3(0,1,0);
    player.slope = 0;

    // state
    player.falling = true;
    player.climbing = false;
    player.sprinting = false;
    player.jump = false;

    // settings
    player.jumpSpeed = 7;
    player.moveSpeed = 6;
    player.sprintSpeed = 10;


    // camera setup -------------------------------------------------------------------------------------------------------------
    var camera = new BABYLON.ArcRotateCamera("camera0", 
    -Math.PI/2-0.2, 1.2, 
    7, null, scene, true);
    camera.inputs.remove(camera.inputs.attached.keyboard);
    camera.inputs.remove(camera.inputs.attached.mousewheel);
    camera.lockedTarget = player;
    camera.attachControl(canvas, true);

    scene.onPointerDown = evt => {
        scene.getEngine().enterPointerlock();
    }

    camera.upperBetaLimit = 1.6;       // ca. horizont
    camera.lowerBetaLimit = 0;         // zenit
    camera.inputs.attached.pointers.angularSensibilityX = 1500;
    camera.inputs.attached.pointers.angularSensibilityY = 1500;



    // user input --------------------------------------------------------------------------------------------------------------
    var inputHandler = 
    (kbinfo) => {
        if(kbinfo.event.code == "ArrowUp" || kbinfo.event.code == "KeyW") {
            player.inputDirection.z = kbinfo.event.type == "keydown" ? 1 : 0;
        } else if(kbinfo.event.code == "ArrowDown" || kbinfo.event.code == "KeyS") {
            player.inputDirection.z = kbinfo.event.type == "keydown" ? -1 : 0;
        } else if(kbinfo.event.code == "ArrowRight" || kbinfo.event.code == "KeyD") {
            player.inputDirection.x = kbinfo.event.type == "keydown" ? 1 : 0;
        } else if(kbinfo.event.code == "ArrowLeft" || kbinfo.event.code == "KeyA") {
            player.inputDirection.x = kbinfo.event.type == "keydown" ? -1 : 0;
        } else if(kbinfo.event.key == "Shift") {
            player.sprinting = kbinfo.event.type == "keydown" ? true : false;
        } else if(kbinfo.event.code == "Space" && !player.falling) {
            player.jump = true;
            player.charNormal.rotationQuaternion = new BABYLON.Quaternion();
        }
    };
    
    
    // this is currently broken!
    // scene.onKeyboardObservable.add(inputHandler);

    document.addEventListener("keydown", (event) => inputHandler({event: event}));
    document.addEventListener("keyup", (event) => inputHandler({event: event}));


    // build a world to interact with -------------------------------------------------------------------------------------------
    var obstacles = [];

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.2, 1, 0.2), scene);
    light.intensity = 0.5;

    // obstacles ---------------------------------------------------------------------------------------------------------------
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, scene);
    ground.checkCollisions = true;
    ground.material = new BABYLON.StandardMaterial();
    ground.material.diffuseColor = new BABYLON.Color4(0.09, 0.42, 0.05);
    obstacles.push(ground);

    var box = BABYLON.MeshBuilder.CreateBox("box", {width: 3, depth: 3}, scene);
    box.position = new BABYLON.Vector3(5,0.5, 3);
    box.checkCollisions = true;
    obstacles.push(box);

    var tilted_box = BABYLON.MeshBuilder.CreateBox("tilted_box", {width: 5, depth: 5}, scene);
    tilted_box.position = new BABYLON.Vector3(-1.5, 0.5, 10);
    tilted_box.checkCollisions = true;
    tilted_box.rotationQuaternion = new BABYLON.Quaternion.FromEulerAngles(toRad(-10), 0, toRad(-20));
    obstacles.push(tilted_box);

    var tilted_box2 = BABYLON.MeshBuilder.CreateBox("tilted_box2", {width: 5, depth: 5}, scene);
    tilted_box2.position = new BABYLON.Vector3(-5.5, 0.5, 10);
    tilted_box2.checkCollisions = true;
    tilted_box2.rotationQuaternion = new BABYLON.Quaternion.FromEulerAngles(toRad(10), 0, toRad(20));
    obstacles.push(tilted_box2);

    var hoverbox = BABYLON.MeshBuilder.CreateBox("box", {width: 6, depth: 3}, scene);
    hoverbox.position = new BABYLON.Vector3(5,4.8, 12.5);
    hoverbox.checkCollisions = true;
    obstacles.push(hoverbox);

    for(var i=1; i<13; i++) {
        var ramp = BABYLON.MeshBuilder.CreateBox("ramp" + i.toString(), {width: 2, depth: 10, height: 20}, scene);
        ramp.position = new BABYLON.Vector3(10 + i*2, -10, 5);
        ramp.rotateAround(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(1,0,0),  -5/180*Math.PI * i );
        ramp.checkCollisions = true;
        obstacles.push(ramp);
    }

    // trampoline
    var trampoline = BABYLON.MeshBuilder.CreateBox("trampoline", {size: 2}, scene);
    trampoline.position = new BABYLON.Vector3(3, 0, 10);
    trampoline.scaling.y = 0.3;
    trampoline.checkCollisions = true;
    trampoline.material = new BABYLON.StandardMaterial();
    trampoline.material.diffuseColor = new BABYLON.Color4(1, 0.95, 0);
    obstacles.push(trampoline);

    // platform
    var platform = BABYLON.MeshBuilder.CreateBox("platform", {size: 2}, scene);
    platform.position = new BABYLON.Vector3(7, 0, 10);
    platform.scaling.y = 0.3;
    platform.checkCollisions = true;
    platform.material = new BABYLON.StandardMaterial();
    platform.material.diffuseColor = new BABYLON.Color4(0.96, 0.56, 0);
    platform.moving = "up"; //up, down, pause
    platform.min = 0;
    platform.max = 5;
    platform.speed = 3;
    platform.pauseTime = 2000; //pausing time in ms
    platform.lastAction = new Date();
    obstacles.push(platform);

    // GUI --------------------------------------------------------------------------------------------------------------------
    var fullscreenUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var guiText01 = new BABYLON.GUI.TextBlock("guiTextBlock01", "");
    guiText01.color = "white";
    guiText01.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
    guiText01.textVerticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
    guiText01.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    guiText01.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    guiText01.fontFamily = "Courier New";
    guiText01.fontSize = "15pt"; 

    var slider = new BABYLON.GUI.Slider("Hello");
    slider.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    slider.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    slider.height = "20px";
    slider.width = "200px";
    slider.onValueChangedObservable.add((number, eventState) => {
        platform.speed = number / 200 * 12;
    });

    fullscreenUI.addControl(guiText01); 
    fullscreenUI.addControl(slider);

    // main loop --------------------------------------------------------------------------------------------------------------
    // engine.runRenderLoop(()=>{}) whats the difference?! besides its an unremovable callback(?)
    engine.onBeginFrameObservable.add(() => {
        var dt = engine.getDeltaTime() / 1000;
        var elapsedTime = (new Date().getTime() - startTime.getTime());
        guiText01.text = "";
        guiText01.text = "Elapsed Time  (ms): " + (elapsedTime).toFixed(2)+"\n";



        // collision detection for player ------------------------------------------------------------------------------------
        var externalPhysicalImpact = false;
        var pitch, roll; 
        var dist;

        var rayCastResults = [];
        const pick = player.contactRay.intersectsMeshes(
            obstacles, 
            false,
            rayCastResults);

        var playerRayCastHit = rayCastResults.length>0;

        var standOnMovingPlatform = playerRayCastHit && rayCastResults[0].pickedMesh == platform && platform.moving != "pause";



        // move platform ----------------------------------------------------------
        if(platform.moving == "up") {
            platform.position = platform.position.add(new BABYLON.Vector3(0, platform.speed*dt, 0));
            if(standOnMovingPlatform) {
                player.position.y += platform.speed*dt;
            }
            // platform.moveWithCollisions(new BABYLON.Vector3(0, platform.speed*dt, 0));
            if(platform.position.y> platform.max) {
                platform.moving = "pause";
                platform.lastAction = new Date();
            }
        } else if(platform.moving == "down") {
            // platform.moveWithCollisions(new BABYLON.Vector3(0, -platform.speed*dt, 0));
            platform.position = platform.position.add(new BABYLON.Vector3(0, -platform.speed*dt, 0));
            if(standOnMovingPlatform) {
                player.position.y -= platform.speed*dt;
            }
            if(platform.position.y < platform.min) {
                platform.moving = "pause";
                platform.lastAction = new Date();
            }
        } else if(platform.moving == "pause") {
            if((new Date().getTime() - platform.lastAction.getTime()) > platform.pauseTime) {
                if(platform.position.y >= platform.max) {
                    platform.moving = "down";
                    platform.lastAction = new Date();
                } else {
                    platform.moving = "up";
                    platform.lastAction = new Date();
                }
            }
        }


        
        // "collision response" for player -----------------------------------------------------------------------------------
        const velocityPhysics =  new BABYLON.Vector3(0,0,0);

        if (playerRayCastHit) {
            dist = rayCastResults[0].distance;
            var normal = rayCastResults[0].getNormal(true);
            player.normal = normal;
            InjectVec3toLine(player.normal, player.charNormal);
            var slope = 
                Math.acos(BABYLON.Vector3.Dot(
                    player.normal, new BABYLON.Vector3.Up()));
            
            [pitch, roll] = NormaltoSlopeXZ(normal);
            player.charNormal.rotationQuaternion = new BABYLON.Quaternion.RotationYawPitchRoll(-player.rotation.y, pitch, -roll);

            // we could also use slope here or other surface attributes such as "marked-as-sticky"
            if(dist - 0.05 <= pheight/2) {
                player.falling = false;
                player.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
            } 

            // trampoline impact
            if (rayCastResults[0].pickedMesh == trampoline) {
                player.velocity.y = 10;
                externalPhysicalImpact = true;
                player.charNormal.rotationQuaternion = new BABYLON.Quaternion();
            }

            // if (rayCastResults[0].pickedMesh == platform && platform.moving != "pause") {
            //     player.velocity.y = platform.moving == "up" ? platform.speed : -platform.speed;
            //     externalPhysicalImpact = true;
            // }
        } else {
            player.material.emissiveColor = new BABYLON.Color4(0, 1, 0, 1);
            player.falling = true;
        }
 
        if (player.jump) {
            player.jump = false;
            player.falling = true;
            player.velocity.y = player.jumpSpeed;
        }




        // copy rotation from camera orientation if camera was turned and player is about to be moved ---------------
        if(player.inputDirection.length() > 0.1){
            player.rotation.y = Math.PI/2 - camera.alpha + Math.PI; 
        }

        // input form player + pyhsical interaction -----------------------------------------------------------------
        const velocityIntended = player.inputDirection
            .normalize()
            .scale(
                player.sprinting ? player.sprintSpeed : player.moveSpeed);

        // combine kinematic impacts such as gravity ----------------------------------------------------------------
        if (player.falling || externalPhysicalImpact) {
            velocityPhysics.y = player.velocity.y - 9.81 * dt;
            player.velocity.y = velocityPhysics.y;
        } else {
            player.velocity.y = 0.01;
        }

        const toWorld = new BABYLON.Matrix.RotationYawPitchRoll(
            player.rotation.y,
            0,
            0); 
        
        const moveCombined = velocityPhysics.add(
            BABYLON.Vector3.TransformCoordinates(velocityIntended, toWorld));

        // move the player based on input + physics
        player.moveWithCollisions(moveCombined.scale(dt));

        // gui update only ----------------------------------------------------------------------------------------
        guiText01.text += "Physics              (m/s): " + Vec3toString(velocityPhysics) + "\n";
        guiText01.text += "Vel.Input            (m/s): "+ Vec3toString(velocityIntended, 2) + "\n";
        guiText01.text += "Vel.Combined         (m/s): "+ Vec3toString(moveCombined, 2) + "\n";
        guiText01.text += "Position               (m): "+ Vec3toString(player.position) + "\n";
        guiText01.text += "Anzimuth             (deg): "+ ((player.rotation.y/Math.PI*180)%360).toFixed(2) +"°\n";
        guiText01.text += "Falling                   : "+ player.falling + "\n";
        guiText01.text += "Climbing                  : "+ player.climbing + "\n";
        guiText01.text += "Sprinting                 : "+ player.sprinting + "\n";
        guiText01.text += "Jump                      : "+ player.jump + "\n";
        
        if(playerRayCastHit) {
            guiText01.text += "Raycast Results           : " + rayCastResults.length + " \n";
            guiText01.text += "Standing on               : "+ rayCastResults[0].pickedMesh.name + "\n";
            guiText01.text += "Normal                    : "+ Vec3toString(player.normal) + "\n";
            guiText01.text += "Slope/-x /-y         (deg): "+ toDeg(slope).toFixed(1) + "°/ "+
                                                      toDeg(pitch).toFixed(1) + "°/ "+ 
                                                      toDeg(roll).toFixed(1) + "°\n";
            guiText01.text += "Distance               (m): "+ (dist).toFixed(1) + "\n";
        }

        guiText01.text += "Platform moves            : "+ platform.moving + "\n";
        guiText01.text += "Platform speed       (m/s): "+ platform.speed.toFixed(2) + "\n";
        // guiText01.text += "   lastAction     : "+ platform.lastAction.getTime() + "\n";
     
    });




    return scene;
};