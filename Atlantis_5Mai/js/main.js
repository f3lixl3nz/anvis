//https://threejs.org/docs/index.html#api/materials/MeshStandardMaterial Dokumentation
			
//globale Variablen
			
//Würfeldefinition für die maze (=map)


var UNITWIDTH = 90;  //Breite eines Würfels in der maz
var UNITHEIGHT = 90; //Höhe eines Würfels in der maze
var totalCubesWide; //Variable speichert, wie viele Würfelweit die maze sein wird
var collidableObjects = []; // Variable speichert eine Array der kollidierten Objekte
var mapSize; //zur Berechnung der Grundebene

var camera, controls, scene, renderer;


// Flags to determine which direction the player is moving
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

// Velocity vector for the player
var playerVelocity = new THREE.Vector3();

// How fast the player will move
var PLAYERSPEED = 800.0;

var clock;

var PLAYERCOLLISIONDISTANCE = 20;

//PointerLockControls
// Flag to determine if the player can move and look around
var controlsEnabled = false;

// HTML elements to be changed
var blocker = document.getElementById('blocker');

// Get the pointer lock state
getPointerLock();
// Set up the game
init();
// Start animating the scene
animate();

// Get the pointer lock and start listening for if its state changes
function getPointerLock() {
  document.onclick = function () {
    container.requestPointerLock();
  }
  document.addEventListener('pointerlockchange', lockChange, false); 
}

// Switch the controls on or off
function lockChange() {
    // Turn on controls
    if (document.pointerLockElement === container) {
        blocker.style.display = "none";
        controls.enabled = true;
        controlsEnabled = true;
    // Turn off the controls
    } else {
      // Display the blocker and instruction
        blocker.style.display = "";
        controls.enabled = false;
        controlsEnabled = false;
    }
}


//Hauptfunktion
function init() {
	
	// Set clock to keep track of frames
	clock = new THREE.Clock();
	
    //Szene erstellen
	scene = new THREE.Scene();

	// Nebel in die Szene einfügen für Hintergrund
	scene.fog = new THREE.FogExp2(0xcccccc, 0.0005);
	
    //Rendereinstellungen setzen
    renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

	
    //HTML Dokument einbinden und mit Renderer verbinden
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

	
	// Set camera position and view details
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
	camera.position.y = 20; // Height the camera will be looking from
	camera.position.x = 0;
	camera.position.z = 0;
		
	
	
	//Kamera zum Controller und zur Szene hinzufügen 
	controls = new THREE.PointerLockControls(camera);
	scene.add(controls.getObject());
	
	listenForPlayerMovement();	
	
    //Kamera hinzufügen
    //scene.add(camera);

    //Würfelwände der maze hinzufügen
    createMazeCubes();
	
	//Grundebene hinzufügen
	createGround();
	
	//Boundingbox hinzufügen
	createPerimWalls();
	
	

    //Lichtquelle hinzufügen
    addLights();

    //Fenstergröße anpassen --> EventListener
    window.addEventListener('resize', onWindowResize, false);
}



//Mazewürfel definieren inkl. Map
function createMazeCubes() {
	//Maze map erstellen mit der Annahme, gleich große Flächen zu erstellen
	//0 = leere Fläche, 1 = Würfel
	var map = [ //das ist das 1. Array
		[0, 0, 0, 0, 0, 0, ], //hier ist ein Array im Array
		[0, 2, 2, 0, 3, 0, ],
		[0, 2, 0, 0, 0, 0, ],
		[0, 1, 0, 0, 0, 0, ],
		[0, 1, 0, 0, 3, 0, ],
		[0, 0, 0, 0, 0, 0, ]
	];

	
	
	//Würfel in der Boundingbox behalten
	var widthOffset = UNITWIDTH / 2;
	//Boden auf Grundfläche von Würfel setzen mit y = 0
	var heightOffset = UNITHEIGHT / 2;
	
	//Sichtbarmachung der map Breite durch zeigen wie lange der 2. Array ist, also gibt die Anzahl der 1. Zeile an Nummern an. In dem Fall 6.
	//"totalCubesWide" wurde als globale Variable definiert
	totalCubesWide = map[0].length;
	
	//Würfel platzieren wo kein 0er ist
	//1. for-Schleife definiert das i, um die Zeile auszuwählen
	for (var i = 0; i < totalCubesWide; i++) {
		//2. for-Schleife definiert das j, um die Spalte in der jeweiligen Zeile auszuwählen
		for (var j = 0; j < map[i].length; j++) {
			//3. for-Schleife sagt, ob ein Würfel gebaut wird oder nicht un in welcher Größe abhängig des Wertes in der Matrix
			for (var k = map[i][j]; k > 0; k = 0) {
				
				//Würfelgeometrie erstellen mit den globalen Variablen UNITHEIGHT und UNITWIDTH, wobei die Höhe UNITHEIGHT mit der Zahl in der Matrix multipliziert wird, um die Höhe zu definieren.
				var cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT*map[i][j], UNITWIDTH);
				//Würfelmaterial erstellen
				var cubeMat = new THREE.MeshPhongMaterial({
					color: 0x81cfe0,
				});
				
				//Erzeuge den Würfel
				var cube = new THREE.Mesh(cubeGeo, cubeMat);
				//Würfelposition setzen
				cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
				cube.position.y = heightOffset;
				cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
				//Würfel hinzufügen
				scene.add(cube);
				//Kollisionerkennung
				collidableObjects.push(cube);
			}
			
			
		}
	}
	//
	mapSize = totalCubesWide * UNITWIDTH //Variable "mapSize" wurde oben als globale Variable gespeichert
		
}


//Grundebene erstellen

//Durch Berechnung der Map Größe, kann die Grundebene die entsprechende Größe bekommen

//Grundebene 
function createGround() {
	//Grundebenengeometrie und  -material erstellen
	var groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
	var groundMat = new THREE.MeshPhongMaterial({ color: 0xA0522D, side: THREE.DoubleSide});
	
	var ground = new THREE.Mesh(groundGeo, groundMat);
	ground.position.set(0, 1, 0);
	//Rotations der Grundebene zum Grundlevel
	ground.rotation.x = degreesToRadians(90);
	scene.add(ground);
}


//Boundingbox bzw. Mapbox erstellen
function createPerimWalls() {
	var halfMap = mapSize / 2; //Halb so groß wie die Map
	var sign = 1; //wird benötigt um eine Menge positiv oder negativ zu machen
	
	//2facher Loop für die gleichzeitige Erstellung der Grenzwände der Boundingbox
	for (var i = 0; i < 2; i++) {
		var perimGeo = new THREE.PlaneGeometry(mapSize, UNITHEIGHT);
		//Das Material Doppelseitig machen
		var perimMat = new THREE.MeshPhongMaterial({ color: 0x464646, side: THREE.DoubleSide});
		//Zwei Wände erstellen
		var perimWallLR = new THREE.Mesh(perimGeo, perimMat);
		var perimWallFB = new THREE.Mesh(perimGeo, perimMat);
		
		//Linke und rechte Wände erstellen
		perimWallLR.position.set(halfMap * sign, UNITHEIGHT / 2, 0); //Wand wir in der Mitte der Map erstellt. Sie muss nun mit "halfMap*sign" um die halbe Map auf die Seite (zuerst nach links, dann nach rechts (sign wird -1)) versetzt.
		perimWallLR.rotation.y = degreesToRadians(90); //Rotation um 90° ist notwendig, damit die Ebene nicht im Raum liegt, sondern steht.
		scene.add(perimWallLR);
		//Kollisionserkennung
		collidableObjects.push(perimWallLR);
		//Vorder- und Rückwand erstellen
		perimWallFB.position.set(0, UNITHEIGHT / 2, halfMap * sign); //Vorder- und Rückwand muss nicht seitlich verschoben werden, aber um die halbe Map nach vorne und nach hinten, deswegen ist der dritte Ausdruck "halfMap*sign".
		scene.add(perimWallFB);
		
		//Kollisionerkennung
		collidableObjects.push(perimWallFB);
		
		sign = -1; //Umkehrung für negative Werte
	}
}


//Bewegungssteuerung
// Add event listeners for player movement key presses
function listenForPlayerMovement() {
  // Listen for when a key is pressed
  // If it's a specified key, mark the direction as true since moving
  var onKeyDown = function(event) {

    switch (event.keyCode) {

      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true;
        break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;

    }

  };

  // Listen for when a key is released
  // If it's a specified key, mark the direction as false since no longer moving
  var onKeyUp = function(event) {

    switch (event.keyCode) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    }
  };

  // Add event listeners for when movement keys are pressed and released
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
}


//Kollisionerkennung
//  Determine if the player is colliding with a collidable object
function detectPlayerCollision() {
    // The rotation matrix to apply to our direction vector
    // Undefined by default to indicate ray should coming from front
    var rotationMatrix;
    // Get direction of camera
    var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();

    // Check which direction we're moving (not looking)
    // Flip matrix to that direction so that we can reposition the ray
    if (moveBackward) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(180));
    }
    else if (moveLeft) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(90));
    }
    else if (moveRight) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(270));
    }

    // Player is moving forward, no rotation matrix needed
    if (rotationMatrix !== undefined) {
        cameraDirection.applyMatrix4(rotationMatrix);
    }

    // Apply ray to player camera
    var rayCaster = new THREE.Raycaster(controls.getObject().position, cameraDirection);

    // If our ray hit a collidable object, return true
    if (rayIntersect(rayCaster, PLAYERCOLLISIONDISTANCE)) {
        return true;
    } else {
        return false;
    }
}


// Takes a ray and sees if it's colliding with anything from the list of collidable objects
// Returns true if certain distance away from object
function rayIntersect(ray, distance) {
    var intersects = ray.intersectObjects(collidableObjects);
    for (var i = 0; i < intersects.length; i++) {
        // Check if there's a collision
        if (intersects[i].distance < distance) {
            return true;
        }
    }
    return false;
}


//Lichtquellen definieren
function addLights() {
	//1. Licht hinzufügen
	var lightOne = new THREE.DirectionalLight(0xffffff);
	lightOne.position.set(1, 1, 1);
	scene.add(lightOne);

	//2. Licht hinzufügen
	var lightTwo = new THREE.DirectionalLight(0xffffff, .5);
	lightTwo.position.set(1, -1, -1);
	scene.add(lightTwo);
}


//onWindowResize Event Listener definieren (Bild bleibt proportional gleich bei Änderung der Fenstergröße
function onWindowResize() {

	//Kameraverhältnis
	camera.aspect = window.innerWidth / window.innerHeight;
	//Funktionsaufruf von "updateProjectionMatrix"
	camera.updateProjectionMatrix();

	//zum Renderer hinzufügen
	renderer.setSize(window.innerWidth, window.innerHeight);
}


//Animation
function animate() {
  render();
  requestAnimationFrame(animate);
  // Get the change in time between frames
  var delta = clock.getDelta();
  animatePlayer(delta);
}

// Animate the player camera
function animatePlayer(delta) {
    // Gradual slowdown
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.z -= playerVelocity.z * 10.0 * delta;

    // If no collision and a movement key is being pressed, apply movement velocity
    if (detectPlayerCollision() == false) {
        if (moveForward) {
            playerVelocity.z -= PLAYERSPEED * delta;
        }
        if (moveBackward) {
            playerVelocity.z += PLAYERSPEED * delta;
        } 
        if (moveLeft) {
            playerVelocity.x -= PLAYERSPEED * delta;
        }
        if (moveRight) {
            playerVelocity.x += PLAYERSPEED * delta;
        }

        controls.getObject().translateX(playerVelocity.x * delta);
        controls.getObject().translateZ(playerVelocity.z * delta);
    } else {
        // Collision or no movement key being pressed. Stop movememnt
        playerVelocity.x = 0;
        playerVelocity.z = 0;
    }
}



//Renderfunktion (nicht zu verwechseln mit der Variablen "renderer"
//diese Funktion ruft nur die Variable "renderer" auf.
function render() {
    renderer.render(scene, camera);
}


//Umrechnung Grad in Radiant
function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}


//Umrechnung Radiant in Grad
function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}
