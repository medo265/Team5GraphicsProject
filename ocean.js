
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, stats;
let camera, scene, renderer;
let  water, sun;
let pirateBoatPosition;
let DutchBoatPosition; 
const mixers = [];
const clock = new THREE.Clock();
let whale,island,pirateBoat,mantaRay;
let audioListener, sound;
let clouds = [];
let rainDrops = [];
let rainGeo = new THREE.BufferGeometry();

//Points to go about it
const points = [
    new THREE.Vector3(-4000, -2000, 4000),
    new THREE.Vector3(-2800, -2000, 2800),
    new THREE.Vector3(-5000, -2000, -5000),
    //new THREE.Vector3(2800, -50, 2800),
    new THREE.Vector3(4000, -2000, 4000)
];
//connecting points to be a path
const path = new THREE.CatmullRomCurve3(points,true);
/////
//Points for manta path
//Points to go about it
const pointsManta = [
    new THREE.Vector3(-3500, -1000, 3500),
    new THREE.Vector3(-3000, -1000, 3000),
    new THREE.Vector3(3800, -1000, 3800),
    new THREE.Vector3(2800, -500, 2800),
    new THREE.Vector3(3500, -1000, -3500)
];
//connecting points to be a path
const pathManta = new THREE.CatmullRomCurve3(pointsManta,true);


init();

function init() {
    container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    container.appendChild(renderer.domElement);
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 20000.0;
    



    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    scene = new THREE.Scene();
    
    const controls = new OrbitControls(camera, renderer.domElement);
    //Keyboard controls 
    controls.keys = {

        LEFT: 'ArrowLeft',
        RIGHT: 'ArrowRight',
        UP: 'ArrowUp',
        BOTTOM: 'ArrowDown'
    }
    controls.listenToKeyEvents(window);
    controls.keyPanSpeed = 20;
    camera.position.set(2300, 200, 0);
    controls.maxDistance = 10000;
    // controls.target.set(0, 20, 0);
    // controls.panSpeed =2;
      
    controls.update();

    sun = new THREE.Vector3();

    const waterGeometry = new THREE.PlaneGeometry(100000, 100000);


    water = new Water(
        waterGeometry,
        {
            textureWidth: 5120,
            textureHeight: 5120,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x7ac5d8,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
        
    );

    water.rotation.x = -Math.PI / 2;

    scene.add(water);

    const sky = new Sky();
    sky.scale.setScalar(15000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 2,
        sunPosition: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();

    let renderTarget;

    function updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.sunPosition);

        sun.setFromSphericalCoords(1, phi, theta);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();

        if (renderTarget !== undefined) renderTarget.dispose();

        sceneEnv.add(sky);
        renderTarget = pmremGenerator.fromScene(sceneEnv);
        scene.add(sky);

        scene.environment = renderTarget.texture;
    }

    updateSun();
/////////////////
// add Fog 

scene.fog = new THREE.FogExp2(0xe8e6e3,0.0002);
//////

const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const oceanAmbientSound = new THREE.Audio(audioListener);
scene.add(oceanAmbientSound);

const loader = new THREE.AudioLoader();

function loadAudio() {
    loader.load(
        'narration.mp3',
        function (audioBuffer) {
            narrationSound.setBuffer(audioBuffer);
            narrationSound.setLoop(false); // Enable looping
            narrationSound.setVolume(0.5);
            narrationSound.play();
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        function (err) {
            console.log('An error happened');
        }
    );
}


const audioListener2 = new THREE.AudioListener();
camera.add(audioListener2);

const narrationSound = new THREE.Audio(audioListener2);
scene.add(narrationSound);

const loader2 = new THREE.AudioLoader();

function loadRainAudio() {
    loader2.load(
        'rain.mp3',
        function (audioBuffer) {
            oceanAmbientSound.setBuffer(audioBuffer);
            oceanAmbientSound.setLoop(true); // Enable looping
            oceanAmbientSound.setVolume(0.5);
            oceanAmbientSound.play();
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        function (err) {
            console.log('An error happened');
        }
    );
}


// Start loading and playing the audio
loadAudio();
loadRainAudio();



////////////////
//load Mini boat
    const loaderMiniBoat = new GLTFLoader();

    loaderMiniBoat.load('model/Boat/scene.gltf', function (gltf) {
        const desiredPosition = new THREE.Vector3(2000, 50, 1000);
        gltf.scene.position.copy(desiredPosition);
        gltf.scene.name = "MiniBoat";
        scene.add(gltf.scene);
    }, undefined, function (error) {
        console.error(error);
    });
/////////////
///Pirate boat loader
    const loaderPirateBoat = new GLTFLoader();

    loaderPirateBoat.load('model/PirateBoat/scene.gltf', function (gltf) {
        pirateBoatPosition = new THREE.Vector3(1500, 10, 50);
        gltf.scene.position.copy(pirateBoatPosition);
        gltf.scene.name = "PirateBoat";
        const desiredScale = 200;
        gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
        scene.add(gltf.scene);
        pirateBoat = gltf.scene;
    }, undefined, function (error) {
        console.error(error);
    });

// Loading Dutch Ship Large 
const loaderDucthShipLarge1 = new GLTFLoader();

loaderDucthShipLarge1.load('model/DutchShipLarge1 Moving/dutch_ship_large_01_2k.gltf', function (gltf) {
    // Set the desired position (x, z, y)
    const DutchBoatPosition = new THREE.Vector3(1500, 20, 600);

    // Apply the desired position to the loaded model
    gltf.scene.position.copy(DutchBoatPosition);

    // Give the Ship a name
    gltf.scene.name = "DutchBoatLarge";

    const desiredScale = 28;
    gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);

    // Add the model to the scene
    scene.add(gltf.scene);

    // Save the loaded object
    DutchBoat = gltf.scene;
        // Make the Dutch ship face towards the island
        DutchBoat.lookAt(pirateBoatPosition);

}, undefined, function (error) {
    console.error(error);
});

/////////////
////Whale loader
    const loaderWhale1 = new GLTFLoader();

    loaderWhale1.load('model/Whale1/scene.gltf', function (gltf) {
        const desiredPosition = new THREE.Vector3(1450, -500, 50);
        gltf.scene.position.copy(desiredPosition);
        const desiredScale = 3;
        gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
        gltf.scene.name = "Whale1";
        //const desiredScale = 1; // Adjust the scale factor as needed
        //gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
        scene.add(gltf.scene);
        if (gltf.animations && gltf.animations.length) {
            const animationMixer = new THREE.AnimationMixer(gltf.scene);
            const animationAction = animationMixer.clipAction(gltf.animations[0]);
            animationAction.play();
            mixers.push(animationMixer);
        }
        whale = gltf.scene;
    }, undefined, function (error) {
        console.error(error);
    });

///////////////
//whale path 

const pathGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(50));
const pathMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0 // Adjust the opacity value (0.0 to 1.0)
});
const pathObject = new THREE.Line(pathGeometry,pathMaterial);
scene.add(pathObject);



const loaderPirate = new GLTFLoader();

loaderPirate.load('model/Pirate/3dpeasit.gltf', function (gltf) {
    const desiredPosition = new THREE.Vector3(0, 180, 600);
    gltf.scene.position.copy(desiredPosition);
    gltf.scene.rotation.set(0, Math.PI, 0);
    const desiredScale = 1;
    gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
    gltf.scene.name = "PirateModel";
    scene.add(gltf.scene);
    if (gltf.animations && gltf.animations.length) {
        const animationMixer = new THREE.AnimationMixer(gltf.scene);
        const animationAction = animationMixer.clipAction(gltf.animations[0]);
        animationAction.play();
        mixers.push(animationMixer);
    }
}, undefined, function (error) {
    console.error(error);
});

////////////
////Fire loader

const loaderAnimatedFire = new GLTFLoader();

loaderAnimatedFire.load('model/animated_fire/scene.gltf', function (gltf) {
    const desiredPosition = new THREE.Vector3(0, 150, 500);
    gltf.scene.position.copy(desiredPosition);
    const desiredScale = 200;
    gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
    gltf.scene.name = "AnimatedModel";
    scene.add(gltf.scene);
    if (gltf.animations && gltf.animations.length) {
        const animationMixer = new THREE.AnimationMixer(gltf.scene);
        const animationAction = animationMixer.clipAction(gltf.animations[0]);
        animationAction.play();
        mixers.push(animationMixer);
    }
}, undefined, function (error) {
    console.error(error);
});

    
// Loading SeaBed
const loaderSeabed = new GLTFLoader();

loaderSeabed.load('model/Seabed flat not working/aerial_beach_01_4k.gltf', function (gltf) {
    // Set the desired position ( x ,z , y)
    const desiredPosition = new THREE.Vector3(0, -5000, -0);

    // Apply the desired position to the loaded model
    gltf.scene.position.copy(desiredPosition);
    // Give the seabed a name
    gltf.scene.name = "seabed"; 
    const desiredScale = 800; 
    gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
    // Add the model to the scene
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});

// Loading Island main
const loaderIslandMain = new GLTFLoader();

loaderIslandMain.load('model/Island Main/cannon_01_diff.jpg.gltf', function (gltf) {
    // Set the desired position ( x ,z , y)
    
    const isalndPosition = new THREE.Vector3(0, 12, 0);
    // Apply the desired position to the loaded model
    gltf.scene.position.copy(isalndPosition);
    // Give the seabed a name
    gltf.scene.name = "islandmain"; 
    const desiredScale = 18; 
    gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
    // Add the model to the scene
    scene.add(gltf.scene);
    island = gltf.scene;
    
}, undefined, function (error) {
    console.error(error);
});


// Loading Dutch Ship small
const loaderDucth1 = new GLTFLoader();

loaderDucth1.load('model/DutchShipMedium/dutch_ship_medium_1k.gltf', function (gltf) {
    // Set the desired position ( x ,z , y)
    const DutchLargeShip1 = new THREE.Vector3(0, 0, 120);

    // Apply the desired position to the loaded model
    gltf.scene.position.copy(DutchLargeShip1);
    // Give the seabed a name
    gltf.scene.name = "DutchMedium1"; 
    const desiredScale = 20; 
    gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
    // Add the model to the scene
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});

////////////
////Manta ray

    const loaderAnimatedMantaRay = new GLTFLoader();

    loaderAnimatedMantaRay.load('model/animated_mantaRay/scene.gltf', function (gltf) {
        const desiredPosition = new THREE.Vector3(0, -100, 0);
        gltf.scene.position.copy(desiredPosition);
        const desiredScale = 60;
        gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
        gltf.scene.name = "AnimatedModel";
        scene.add(gltf.scene);

        if (gltf.animations && gltf.animations.length) {
            const animationMixer = new THREE.AnimationMixer(gltf.scene);
            const animationAction = animationMixer.clipAction(gltf.animations[0]);
            animationAction.play();
            mixers.push(animationMixer);
        }
        mantaRay = gltf.scene;
    }, undefined, function (error) {
        console.error(error);
    });


// Manta Ray path

const pathGeometryManta = new THREE.BufferGeometry().setFromPoints(pathManta.getPoints(50));
const pathMaterialManta = new THREE.LineBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0 // Adjust the opacity value (0.0 to 1.0)
});
const pathObjectManta = new THREE.Line(pathGeometryManta,pathMaterialManta);
scene.add(pathObjectManta);




   /* const loaderAnimatedpirate = new FBXLoader();

    loaderAnimatedpirate.load('model/animatedpirate/Looking.fbx', function (fbx) {
        const desiredPosition = new THREE.Vector3(0, 20, 0);
        fbx.scene.position.copy(desiredPosition);
        const desiredScale = 1;
        fbx.scene.scale.set(desiredScale, desiredScale, desiredScale);
        fbx.scene.name = "AnimatedModel";
        scene.add(gltf.scene);

        if (fbx.animations && fbx.animations.length) {
            const animationMixer = new THREE.AnimationMixer(gltf.scene);
            const animationAction = animationMixer.clipAction(gltf.animations[0]);
            animationAction.play();
            mixers.push(animationMixer);
        }
    }, undefined, function (error) {
        console.error(error);
    });

*/
    const loaderAnimatedOceanCreature = new GLTFLoader();

    loaderAnimatedOceanCreature.load('model/animated_oceanCreature/scene.gltf', function (gltf) {
        const desiredPosition = new THREE.Vector3(750, 0, 300);
        gltf.scene.position.copy(desiredPosition);
        const desiredScale = 40;
        gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);
        gltf.scene.name = "AnimatedModel";
        scene.add(gltf.scene);

        if (gltf.animations && gltf.animations.length) {
            const animationMixer = new THREE.AnimationMixer(gltf.scene);
            const animationAction = animationMixer.clipAction(gltf.animations[0]);
            animationAction.play();
            mixers.push(animationMixer);
        }
    }, undefined, function (error) {
        console.error(error);
    });


    //Cloud
// Load smoke texture

// Load black smoke texture
const blackSmokeTextureLoader = new THREE.TextureLoader();
const blackSmokeTexture = blackSmokeTextureLoader.load('textures/smokeb.png'); // Replace with the actual path

// Create black smoke material
const blackSmokeMaterial = new THREE.MeshBasicMaterial({
    map: blackSmokeTexture,
    transparent: true,
    opacity: 1, // Adjust opacity as needed
    side: THREE.DoubleSide // Depending on your use case
});

// Create black smoke geometry
const blackSmokeGeometry = new THREE.PlaneGeometry(500, 500, 1, 1); // Adjust the size and segments as needed

// Array to store black cloud meshes
const blackClouds = [];

// Function to create a black cloud
function createBlackCloud() {
    const blackCloudMesh = new THREE.Mesh(blackSmokeGeometry, blackSmokeMaterial);
    // Adjust the rotation of the black cloud to make it horizontal
    blackCloudMesh.rotation.x = -Math.PI / 2;
    // Set the position of the black cloud
    blackCloudMesh.position.set(
        100,
        800,
        450
    );
    // Adjust the scale range as needed
    blackCloudMesh.scale.set(1, 1, 1);
    // Add the black cloud mesh to the array and scene
    blackClouds.push(blackCloudMesh);
    scene.add(blackCloudMesh);
}
createBlackCloud();

    // Load smoke texture
    const textureLoader = new THREE.TextureLoader();
    const smokeTexture = textureLoader.load('textures/smoke3.png'); // Replace with the actual path

    // Create smoke material
    const smokeMaterial = new THREE.MeshBasicMaterial({
        map: smokeTexture,
        transparent: true,
        opacity: 0.5, // Adjust opacity as needed
        side: THREE.DoubleSide // Depending on your use case
    });
    // Create smoke geometry
    const smokeGeometry = new THREE.PlaneGeometry(500, 500, 1, 1); // Adjust the size and segments as needed

    // Function to create a cloud
    function createCloud() {
        const cloudMesh = new THREE.Mesh(smokeGeometry, smokeMaterial);
        // Adjust the rotation of the cloud to make it horizontal
        cloudMesh.rotation.x = -Math.PI / 2;
        // Set the position of the cloud
        cloudMesh.position.set( // random positions
            Math.random() * 4500 - 800,  // x
            Math.random() * 1000 + 2800, // height
            Math.random() * 4500 - 800   // z
        );
        const randomScale = Math.random() * (2.0 - 0.5) + 0.5; // Adjust the scale range as needed
        cloudMesh.scale.set(randomScale, randomScale, 1);
        // Add the cloud mesh to the array and scene
        clouds.push(cloudMesh);
        scene.add(cloudMesh);
    }
    for (let i = 0; i < 20; i++) { // Change 5 to the desired number of clouds
        createCloud();
    }

    // Rain model
    function createRain() {
        const rainGeo = new THREE.BufferGeometry();
        const rainDrop = new THREE.Vector3(
            Math.random() * 400 - 150,
            Math.random() * 200 + 10,
            Math.random() * 400 + 350
        );
        // Use Float32Array to store vertex positions
        const vertices = new Float32Array([rainDrop.x, rainDrop.y, rainDrop.z]);
        rainGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const rainMaterial = new THREE.PointsMaterial({
            color: 0x7aadff,
            size: 3,
            transparent: true,
        });
        const rain = new THREE.Points(rainGeo, rainMaterial);
        // Set the scale of the rain object
        rain.scale.set(1, 3, 1);
        scene.add(rain);
        // Add raindrop to the array
        rainDrops.push(rain);
    }
    // Create multiple raindrops reduce number if render is laggy
    for (let i = 0; i < 500; i++) {
        createRain();
    }

    stats = new Stats();
    container.appendChild(stats.dom);

    const gui = new GUI();

    const folderSky = gui.addFolder('Sky');
    folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun);
    folderSky.add(parameters, 'sunPosition', -180, 180, 0.1).onChange(updateSun);
    folderSky.open();

    const waterUniforms = water.material.uniforms;

    const folderWater = gui.addFolder('Water');
    folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
    folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
    folderWater.open();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', function(event) {
        if (event.key === 'p') {
            // Check if the audio is currently playing
            if (oceanAmbientSound.isPlaying) {
                // Pause the audio
                oceanAmbientSound.pause();
            } else {
                // If not playing, play the audio
                oceanAmbientSound.play();
            }
        }

        if (event.key === 'n') {
            // Check if the audio is currently playing
            if (narrationSound.isPlaying) {
                // Pause the audio
                narrationSound.pause();
            } else {
                // If not playing, play the audio
                narrationSound.play();
            }
        }


    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
/*
function WhaleMovement() {
    if (whale && island) {
        const speed = 0.00001; // Adjust the speed of movement
        const radius = 2500; // Adjust the radius of the circle

        // Calculate new position in a circular path around the island
        const angle = -speed * performance.now();
        const newX = island.position.x + radius * Math.cos(angle);
        const newY = island.position.y + radius * Math.sin(angle);

        // Update the whale's position
        whale.position.set(newX,whale.position.z,newY);

        // Update the rotation to face towards the island
        const directionToIsland = new THREE.Vector3(pirateBoat.position.x - newX, 0,pirateBoat.position.y - newY);
        whale.lookAt(directionToIsland);
    } else {
        console.error("Whale or Island not found in the scene or not loaded yet.");
    }
}
*/


function cloudanimate() {
    const time = performance.now() * 0.001;
    const rotationSpeed = 0.1;

    if (clouds) {
        clouds.forEach((cloudMesh) => {
            cloudMesh.rotation.z = time * rotationSpeed;
        });
    }
}
function animateRain() {
    // Assuming you have a variable for your raindrops
    rainDrops.forEach((rain) => {
        // Move raindrops down along the z-axis
        //rain.rotation.y += 0.002;

        // Assuming rain has a velocity property
        rain.velocity = rain.velocity || 0;
        rain.velocity -= 0.1 + Math.random() * 0.1;

        rain.position.y += rain.velocity;

        // Reset raindrop position if it goes below a certain y-coordinate
        // Adjust the value based on your scene's dimensions
        if (rain.position.y < -500) {
            rain.position.y = 100;
            rain.velocity = Math.random() * 2 - 1; // Set a new random velocity
        }
    });
}


function PirateBoatMovement() {
    // Animate Pirate boat's position in a circle around MiniBoat
    const speed = 0.000125; // Adjust the speed of movement
    const radius = 3450; // Adjust the radius of the circle

    // Get the position you want to circle about
    const CircleAroundPosition = scene.getObjectByName("islandmain").position;

    // Calculate new position in a circular path around MiniBoat
    const angle = -speed * performance.now();
    const newX = CircleAroundPosition.x + radius * Math.cos(angle);
    const newZ = CircleAroundPosition.z + radius * Math.sin(angle);

    // Update the Pirate boat's position
    const pirateBoat = scene.getObjectByName("PirateBoat");
    if (pirateBoat) {
        pirateBoat.position.set(newX, pirateBoatPosition.y, newZ);
        // Update the rotation to face towards the center
        const directionToCenter = new THREE.Vector3(CircleAroundPosition.x - newX, 0, CircleAroundPosition.z - newZ);
        pirateBoat.lookAt(CircleAroundPosition);
    } else {
        console.error("Pirate boat not found in the scene or not loaded yet.");
    }
}

function WhaleMovement() {

    const timeWhale = (Date.now())/10;
    // /speed of animation , 6 is path points + 1 , a rule
    const t = (timeWhale/2000 % 5)/5
    const position = path.getPointAt(t);
 whale.position.copy(position);
const tangent = path.getTangentAt(t).normalize();
whale.lookAt(position.clone().add(tangent));

}

function mantaRayMovement() {

    const timeManta = (Date.now())/7;
    // /speed of animation , 6 is path points + 1 , a rule
    const t = (timeManta/2000 % 6)/6
    const position = pathManta.getPointAt(t);
    mantaRay.position.copy(position);
const tangent = pathManta.getTangentAt(t).normalize();
mantaRay.lookAt(position.clone().add(tangent));

}


function render() {
    const time = performance.now() * 0.001;
    water.material.uniforms['time'].value += 1.0 / 60.0;
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    cloudanimate();
    animateRain();
    PirateBoatMovement();
    WhaleMovement();
    mantaRayMovement();
    const delta = clock.getDelta();
    mixers.forEach(function (mixer) {
        mixer.update(delta);
    });
    
    stats.update();

    render();
}
animate();
