//https://threejs.org/docs/index.html#api/materials/MeshStandardMaterial Dokumentation
			
//globale Variablen
			
//Würfeldefinition für die maze (=map)


var UNITWIDTH = 90;  //Breite eines Würfels in der maz
var UNITHEIGHT = 90; //Höhe eines Würfels in der maze
var totalCubesWide; //Variable speichert, wie viele Würfelweit die maze sein wird
var collidableObjects = []; // Variable speichert eine Array der kollidierten Objekte
var mapSize; //zur Berechnung der Grundebene

var camera, scene, renderer;

init(); //rufe die Funktion "init" auf
animate(); //rufe die Funktion "animate" auf

//Hauptfunktion
function init() {
   
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

	
    //Kameraposition und -sicht einstellen
	//Kamera erstellen + Einstellungen
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
	//Kameraposition
	camera.position.y = 600; //Kamerehöhe bleibt hier immer gleich
    camera.position.x = 0;
    camera.position.z = 600;
	camera.rotation.x = -0.75;
	camera.rotation.y = 0;

    //Kamera hinzufügen
    scene.add(camera);

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
	//Funktion "render" aufrufen
	render();
    //Funktion "requestAnimationFrame" updatet den Renderer ständig
    requestAnimationFrame(animate);
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
