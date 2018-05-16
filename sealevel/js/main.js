			var UNITWIDTH = 40;  //Breite eines Würfels in der maz
			var UNITHEIGHT = 40; //Höhe eines Würfels in der maze
			var totalBoxWide; //Variable speichert, wie viele Würfelweit die maze sein wird
			var objects = []; // Variable speichert eine Array der kollidierten Objekte
			var mapSize; //zur Berechnung der Grundebene
			
			var camera, scene, renderer, light, controls;
			
			var clock;
			
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

				
				// floor - water
				// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shaders_ocean.html
				var waterGeometry = new THREE.PlaneBufferGeometry( 10000, 10000 );
				
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
				
				// animation fehlt! anleitung: https://github.com/mrdoob/three.js/blob/master/examples/webgl_shaders_ocean.html
				
				
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
					inclination: 0.3, //0.485 --> abenddämmerung
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
					[1, 1, 1, 1, 1, 1, ], 
					[1, 14, 13, 6, 5, 1, ],
					[1, 15, 12, 7, 4, 1, ],
					[1, 16, 11, 8, 3, 1, ],
					[1, 17, 10, 9, 2, 1, ],
					[1, 1, 1, 1, 1, 1, ]
					];
				
					var widthOffset = UNITWIDTH / 2;
				
					var heightOffset = UNITHEIGHT / 2;
					
					totalBoxWide = map[0].length;
					for (var i = 0; i < totalBoxWide; i++) {
						for (var j = 0; j < map[i].length; j++) {
							for (var k = map[i][j]; k > 0; k = 0) {
								var boxGeometry = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT*map[i][j], UNITWIDTH);
								var boxMaterial = new THREE.MeshPhongMaterial({
								color: 0xEED6AF,
								});
								
								var box = new THREE.Mesh(boxGeometry, boxMaterial);
								
								box.position.z = (i - totalBoxWide / 2) * UNITWIDTH + widthOffset;
								box.position.y = heightOffset;
								box.position.x = (j - totalBoxWide / 2) * UNITWIDTH + widthOffset;
								
								scene.add(box);
								objects.push(box);
							}
						}
					}
					//mapSize = totalBoxWide * UNITWIDTH
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
					
					prevTime = time;

				}

				
				renderer.render( scene, camera );
				
			}	
