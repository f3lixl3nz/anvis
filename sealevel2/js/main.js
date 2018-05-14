			var UNITWIDTH = 40;  //Breite eines Würfels in der maz
			var UNITHEIGHT = 40; //Höhe eines Würfels in der maze
			var totalCubesWide; //Variable speichert, wie viele Würfelweit die maze sein wird
			var collidableObjects = []; // Variable speichert eine Array der kollidierten Objekte
			var mapSize; //zur Berechnung der Grundebene
			
			var camera, scene, renderer, controls;
			
			//var PLAYERSPEED = 400.0;
			var PLAYERCOLLISIONDISTANCE = 20;
			
			var clock;
			
			var objects = [];
			
			var water;

			var raycaster;

			var blocker = document.getElementById( 'blocker' );
			var instructions = document.getElementById( 'instructions' );

			var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

			if ( havePointerLock ) {

				var element = document.body;

				var pointerlockchange = function ( event ) {

					if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

						controlsEnabled = true;
						controls.enabled = true;

						blocker.style.display = 'none';

					} else {

						controls.enabled = false;

						blocker.style.display = 'block';

						instructions.style.display = '';

					}

				};

				var pointerlockerror = function ( event ) {

					instructions.style.display = '';

				};

				// Hook pointer lock state change events
				document.addEventListener( 'pointerlockchange', pointerlockchange, false );
				document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
				document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

				document.addEventListener( 'pointerlockerror', pointerlockerror, false );
				document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
				document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

				instructions.addEventListener( 'click', function ( event ) {

					instructions.style.display = 'none';

					// Ask the browser to lock the pointer
					element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
					element.requestPointerLock();

				}, false );

			} else {

				instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

			}

			var controlsEnabled = false;

			var moveForward = false;
			var moveBackward = false;
			var moveLeft = false;
			var moveRight = false;
			var canJump = false;

			var prevTime = performance.now();
			var velocity = new THREE.Vector3();
			var direction = new THREE.Vector3();
			var vertex = new THREE.Vector3();
			var color = new THREE.Color();

			init();
			animate();

			function init() {

				camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0xffffff );
				scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

				var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
				light.position.set( 0.5, 1, 0.75 );
				scene.add( light );
				
				clock = new THREE.Clock();
				
				controls = new THREE.PointerLockControls( camera );
				scene.add( controls.getObject() );

				var onKeyDown = function ( event ) {

					switch ( event.keyCode ) {

						case 38: // up
						case 87: // w
							moveForward = true;
							break;

						case 37: // left
						case 65: // a
							moveLeft = true; break;

						case 40: // down
						case 83: // s
							moveBackward = true;
							break;

						case 39: // right
						case 68: // d
							moveRight = true;
							break;

						case 32: // space
							if ( canJump === true ) velocity.y += 350;
							canJump = false;
							break;

					}

				};

				var onKeyUp = function ( event ) {

					switch( event.keyCode ) {

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

				document.addEventListener( 'keydown', onKeyDown, false );
				document.addEventListener( 'keyup', onKeyUp, false );

				raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

				// floor
				var waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
				water = new THREE.Water(
					waterGeometry,
					{
						textureWidth: 512,
						textureHeight: 512,
						waterNormals: new THREE.TextureLoader().load( 'js/textures/waternormals.jpg', function ( texture ) {
							texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
						}),
						alpha: 1.0,
						sunDirection: light.position.clone().normalize(),
						sunColor: 0xffffff,
						waterColor: 0x001e0f,
						distortionScale:  3.7,
						fog: scene.fog !== undefined
					}
				);
				
				water.rotation.x = - Math.PI / 2;
				
				scene.add( water );
				
			
				// objects
				function createMazeCubes() {
					var map = [ 
					[0, 0, 0, 0, 0, 0, ], 
					[0, 2, 2, 0, 3, 0, ],
					[0, 2, 0, 0, 0, 0, ],
					[0, 1, 0, 0, 0, 0, ],
					[0, 1, 0, 0, 3, 0, ],
					[0, 0, 0, 0, 0, 0, ]
					];
				
					var widthOffset = UNITWIDTH / 2;
				
					var heightOffset = UNITHEIGHT / 2;
					
					totalCubesWide = map[0].length;
					for (var i = 0; i < totalCubesWide; i++) {
						for (var j = 0; j < map[i].length; j++) {
							for (var k = map[i][j]; k > 0; k = 0) {
								var cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT*map[i][j], UNITWIDTH);
								var cubeMat = new THREE.MeshLambertMaterial({
									color: 0x81cfe0,
								});
								
								var cube = new THREE.Mesh(cubeGeo, cubeMat);
								cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
								cube.position.y = heightOffset;
								cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
								scene.add(cube);
									collidableObjects.push(cube);
							}
						}
					}
					//mapSize = totalCubesWide * UNITWIDTH
				}
				
				createMazeCubes();
				


				//

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				document.body.appendChild( renderer.domElement );

				//

				window.addEventListener( 'resize', onWindowResize, false );

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function animate() {

				requestAnimationFrame( animate );

				if ( controlsEnabled === true ) {

					raycaster.ray.origin.copy( controls.getObject().position );
					raycaster.ray.origin.y -= 10;

					var intersections = raycaster.intersectObjects( objects );

					var onObject = intersections.length > 0;

					var time = performance.now();
					var delta = ( time - prevTime ) / 1000;

					velocity.x -= velocity.x * 10.0 * delta;
					velocity.z -= velocity.z * 10.0 * delta;

					velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

					direction.z = Number( moveForward ) - Number( moveBackward );
					direction.x = Number( moveLeft ) - Number( moveRight );
					direction.normalize(); // this ensures consistent movements in all directions

					if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
					if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

					if ( onObject === true ) {

						velocity.y = Math.max( 0, velocity.y );
						canJump = true;

					}

					controls.getObject().translateX( velocity.x * delta );
					controls.getObject().translateY( velocity.y * delta );
					controls.getObject().translateZ( velocity.z * delta );

					if ( controls.getObject().position.y < 10 ) {

						velocity.y = 0;
						controls.getObject().position.y = 10;

						canJump = true;

					}

					prevTime = time;

				}

				renderer.render( scene, camera );

			}
			
			//Collision 
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

				// Player is not moving forward, apply rotation matrix needed
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
			
			//Nimmt einen Strahl und erkennt, ob er mit etwas aus derListe der kollidierbaren Objekte kollidiert.
			//Returns "true" wenn ein gewisser Abstand zum Objekt besteht
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
			
			function animatePlayer(delta) {
				// Gradual slowdown
				velocity.x -= velocity.x * 10.0 * delta;
				velocity.z -= velocity.z * 10.0 * delta;

				// If no collision and a movement key is being pressed, apply movement velocity
					if (detectPlayerCollision() == false) {
						if (moveForward) {
							velocity.z -= PLAYERSPEED * delta;
						}
						if (moveBackward) {
							velocity.z += PLAYERSPEED * delta;
						} 
						if (moveLeft) {
							velocity.x -= PLAYERSPEED * delta;
						}
						if (moveRight) {
							velocity.x += PLAYERSPEED * delta;
						}

						controls.getObject().translateX(velocity.x * delta);
						controls.getObject().translateZ(velocity.z * delta);
					} else {
						// Collision or no movement key being pressed. Stop movememnt
						velocity.x = 0;
						velocity.z = 0;
						}
					}
				
