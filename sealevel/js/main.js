			var UNITWIDTH = 40;  //Breite eines Würfels in der maz
			var UNITHEIGHT = 40; //Höhe eines Würfels in der maze
			var totalBoxWide; //Variable speichert, wie viele Würfelweit die maze sein wird
			var objects = []; // Variable speichert eine Array der kollidierten Objekte
			var mapSize; //zur Berechnung der Grundebene
			
			var camera, scene, renderer, light, controls;
			
			var clock;
			
			var water;

			var raycaster;
			
			var PLAYERCOLLISIONDISTANCE = 20;

			
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


			init();
			animate();

			
			function init() {
				// renderer
				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				document.body.appendChild( renderer.domElement );

				
				// windowresize
				window.addEventListener( 'resize', onWindowResize, false );
				
				function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

				}
				
				
				// camera
				camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

				
				//
				clock = new THREE.Clock();
				
				
				//
				scene = new THREE.Scene();
				
				
				// light
				light =  new THREE.HemisphereLight( 0xffffff, 0.6 );
				scene.add( light );
				
				var light2 = new THREE.DirectionalLight( 0xaabbff, 0.5 );
				light2.position.set(1, -1, -1);
				scene.add( light2 );
				
				var light3 = new THREE.DirectionalLight( 0xaabbff, 0.5 );
				light3.position.set(1, 1, 1);
				scene.add( light3 );
				
				
				// controls
				// https://threejs.org/examples/misc_controls_pointerlock.html
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
				
				}

				
				// water
				// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shaders_ocean.html
				// https://github.com/jbouny/ocean/wiki/How-to-use-%3F
				var waterGeometry = new THREE.PlaneBufferGeometry( 10000, 10000 );
				scene.fog = new THREE.FogExp2(0xcccccc, 0.001);
				
				water = new THREE.Water(waterGeometry,{
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
				//water.position.set (1,20,4);
				
				scene.add( water );
				
				
				// skybox
				// https://threejs.org/examples/?q=sky#webgl_shaders_sky
				var sky = new THREE.Sky();
				sky.scale.setScalar( 10000 );
				scene.add( sky );
				
				var uniforms = sky.material.uniforms;
				
				uniforms.turbidity.value = 10;
				uniforms.rayleigh.value = 2;
				uniforms.luminance.value = 1;
				uniforms.mieCoefficient.value = 0.005;
				uniforms.mieDirectionalG.value = 0.8;
				
				var parameters = {
					distance: 400,
					inclination: 0.3 , //0.485 --> abenddämmerung
					azimuth: 0.205
				};
				
				var cubeCamera = new THREE.CubeCamera( 1, 20000, 256 );
				cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
				
				function updateSun() {
					
					var theta = Math.PI * ( parameters.inclination - 0.5 );
					var phi = 2 * Math.PI * ( parameters.azimuth - 0.5 );
					
					light.position.x = parameters.distance * Math.cos( phi );
					light.position.y = parameters.distance * Math.sin( phi ) * Math.sin( theta );
					light.position.z = parameters.distance * Math.sin( phi ) * Math.cos( theta );
					
					sky.material.uniforms.sunPosition.value = light.position.copy( light.position );
					
					water.material.uniforms.sunDirection.value.copy( light.position ).normalize();
					
					cubeCamera.update( renderer, scene );
				}
				
				updateSun();
			
			
				// objects
				function createBoxLayout() {
					var map = [ 
					[0, 5, 1, 1, 0, 3, 1, 0],
					[0, 1, 2, 0, 0, 2, 1, 1], 
					[1, 2, 3, 2, 0, 4, 2, 0],
					[1, 2, 2, 4, 0, 5, 1, 0],
					[0,3, 2, 11, 12, 6, 5, 1],
					[1,2, 2, 10, 13, 7, 2, 0],
					[0, 1, 2, 9, 8, 2, 1, 0],
					[1, 0, 4, 1, 3, 1, 0, 0]
					];
				
					var widthOffset = UNITWIDTH / 2;
				
					var heightOffset = UNITHEIGHT / 2;
					
					totalBoxWide = map[0].length;
					for (var i = 0; i < totalBoxWide; i++) {
						for (var j = 0; j < map[i].length; j++) {
							if (map[i][j] > 0) {
								var boxGeometry = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT*map[i][j], UNITWIDTH);
								
								var textureLoader = new THREE.TextureLoader();

								var boxTexture = textureLoader.load('js/textures/diffuse.jpg');
								//var boxBumpMap = textureLoader.load('js/textures/bump.jpg');
								//var boxNormalMap = textureLoader.load('js/textures/normal.jpg');
								//var boxAoMap = textureLoader.load('js/textures/.jpg');

									// wrapS defines how the texture is wrapped horizontally and corresponds to U in UV mapping
									// wrapT defines how the texture is wrapped vertically and corresponds to V in UV mapping
									
									boxTexture.wrapS = THREE.RepeatWrapping;
									boxTexture.wrapT = THREE.RepeatWrapping;
									boxTexture.repeat.x = 1;
									boxTexture.repeat.y 
										if (map[i][j] > 1){
											boxTexture.repeat.set(1,1,);
										}
										if (map[i][j] > 2){
											boxTexture.repeat.set(1,2,);
										}
										if (map[i][j] > 3){
											boxTexture.repeat.set(1,3,);
										}
										if (map[i][j] > 4){
											boxTexture.repeat.set(1,4,);
										}
										if (map[i][j] > 5){
											boxTexture.repeat.set(1,5,);
										}
										if (map[i][j] > 6){
											boxTexture.repeat.set(1,6,);
										}
										if (map[i][j] > 7){
											boxTexture.repeat.set(1,7,);
										}
										if (map[i][j] > 8){
											boxTexture.repeat.set(1,8,);
										}
										if (map[i][j] > 9){
											boxTexture.repeat.set(1,9,);
										}
										if (map[i][j] > 10){
											boxTexture.repeat.set(1,10,);
										}
	
	
								var boxMaterial = new THREE.MeshPhongMaterial({
									color: 0xffffff,
									map: boxTexture, 
									//bumpMap: boxBumpMap,
									//normalMap: boxNormalMap, 
									//aoMap: boxAoMap
								}); 
								
								var box = new THREE.Mesh(boxGeometry, boxMaterial);
								
								box.position.z = (i - totalBoxWide / 2) * UNITWIDTH + widthOffset;
								box.position.y = heightOffset;
								box.position.x = (j - totalBoxWide / 2) * UNITWIDTH + widthOffset;
								
								box.receiveShadow = true;
								box.castShadow = true;
								scene.add(box);
								objects.push(box);
							}
						
						}
					
					}

				}
				
				createBoxLayout();

				
			// animation
			// https://threejs.org/examples/misc_controls_pointerlock.html
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

					if ( moveForward || moveBackward ) velocity.z -= direction.z * 800.0 * delta;
					if ( moveLeft || moveRight ) velocity.x -= direction.x * 800.0 * delta;

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
					
					if(water) {
						
						water.material.uniforms.time.value += delta;
					
					}
					
					prevTime = time;

				}
				
				renderer.render( scene, camera );
				
			}	

			
			//collision
			function rayIntersect(ray, distance) {
				var intersects = ray.intersectObjects(objects);
	
				if ( controlsEnabled === true ) {
					var onObject = intersects.length > 0;
				}
	
				for (var i = 0; i < intersects.length; i++) {
				// Check if there's a collision
					if (intersects[i].distance < distance) {
						return true;
					}
				}
				return false;
			}
			
	
			function detectPlayerCollision() {
				
				var rotationMatrix;
    
				var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();
				
				if (moveBackward) {
					rotationMatrix = new THREE.Matrix4();
					rotationMatrix.makeRotationY(degreesToRadians(180));
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
    
				if (rotationMatrix !== undefined) {
					cameraDirection.applyMatrix4(rotationMatrix);
				}

				var raycasterCollision = new THREE.Raycaster(controls.getObject().position, cameraDirection);

				if (rayIntersect(raycasterCollision, PLAYERCOLLISIONDISTANCE)) {
					return true;
				} else {
					return false;
				}
			}
			
			
			//Umrechnung Grad in Radiant
			function degreesToRadians(degrees) {
				return degrees * Math.PI / 180;
			}


			//Umrechnung Radiant in Grad
			function radiansToDegrees(radians) {
				return radians * 180 / Math.PI;
			}
			
			
			// sound
			// https://threejs.org/docs/#api/audio/Audio
				// create an AudioListener and add it to the camera
				var listener = new THREE.AudioListener();
				camera.add( listener );

				// create a global audio source
				var sound = new THREE.Audio( listener );

				// load a sound and set it as the Audio object's buffer
				var audioLoader = new THREE.AudioLoader();
					audioLoader.load( 'js/sound/ocean.ogg', function( buffer ) {
					sound.setBuffer( buffer );
					sound.setLoop( true );
					sound.setVolume( 1 );
					sound.play();
				});
				
				water.add( sound );
	
				
				
				
	
