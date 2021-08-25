// import './tailwind.css';
import * as THREE from '../13 - THREE-PLANET-EARTH/node_modules/three/build/three.module.js';
import Stats from '../13 - THREE-PLANET-EARTH/node_modules/three/examples/jsm/libs/stats.module.js';
//CDN
//https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js
//NPM
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js';
// import { OrbitControls } from './node_modules/three/examples/js/controls/OrbitControls.js';

import gsap from './node_modules/gsap/all.js';

/////////////Sphere custom shaders/////////

const vertexShader = `
varying vec2 vertexUV;
varying vec3 vertexNormal;

void main() {
  vertexUV = uv;
  vertexNormal = normalize(normalMatrix * normal);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
}`;
//position = (1, 0, 0)
const fragmentShader = `
uniform sampler2D globeTexture;

varying vec2 vertexUV; 
varying vec3 vertexNormal;

void main() {
  float intensity = 1.05 - dot(vertexNormal, vec3(0.0, 0.0, 1.0 ));
  vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);
  
  gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz, 1.0); 
}`;
/////////////Atmosphere custom shaders/////////

const atmosphereVertexShader = `

varying vec3 vertexNormal;

void main() {
  vertexNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
}`;
const atmosphereFragmentShader = `
varying vec3 vertexNormal; 
void main() {
  float intensity = pow(0.9 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
  gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
}`;

const canvasContainer = document.querySelector('#canvasContainer');

//SCENE
const scene = new THREE.Scene();
// console.log(scene);

//CAMERA
const fieldOfView = 75;
// const WIDTH = window.innerWidth;
// const HEIGHT = window.innerHeight;
// let aspectRatio = WIDTH / HEIGHT;
let aspectRatio = canvasContainer.offsetWidth / canvasContainer.offsetHeight;
const nearClippingPlane = 0.1;
const farClippingPlane = 1000;

const camera = new THREE.PerspectiveCamera(
  fieldOfView,
  aspectRatio,
  nearClippingPlane,
  farClippingPlane
);
camera.position.set(0, 0, 15);

//RENDER
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector('canvas'),
});

// renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight); //adaptar a toda la pantalla
renderer.setPixelRatio(window.devicePixelRatio); //Mejora la resolucion
// document.body.appendChild(renderer.domElement); //Crear un canvas en el body

//ORBIT CONTROLS

new OrbitControls(camera, renderer.domElement);

////////////////////EARTH////////////////////////////////

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: vertexShader, //Al tener mismo nombre en la PROPERTIE y su VARIABLE podemos dejarlo como vertexShader JS lo permite de momento lo dejamos como --> vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load('./img/earthmap1k.jpg'),
      },
    },
  })
);

////////////////////LIGHT////////////////////////////////

const light = new THREE.AmbientLight(0x222222);
scene.add(light);

const dLight = new THREE.DirectionalLight(0xffffff, 1);
dLight.position.set(5, 5, 5);
dLight.castShadow = true;
scene.add(dLight);

//////////////////////RELIEVE TIERRA/////////////////////

const geometry = new THREE.SphereGeometry(5, 50, 50);

// const customShader = new THREE.ShaderMaterial({
//   vertexShader: vertexShader, //Al tener mismo nombre en la PROPERTIE y su VARIABLE podemos dejarlo como vertexShader JS lo permite de momento lo dejamos como --> vertexShader: vertexShader,
//   fragmentShader: fragmentShader,
//   uniforms: {
//     globeTexture: {
//       value: new THREE.TextureLoader().load('./img/earthmap1k.jpg'),
//     },
//   },
// });
const texture = new THREE.TextureLoader().load('img/earthmap1k.jpg');
const bumpmap = new THREE.TextureLoader().load('img/earthbump1k.jpg');
const specmap = new THREE.TextureLoader().load('img/earthspec1k.jpg');
const material = new THREE.MeshPhongMaterial({
  map: texture,
  bumpMap: bumpmap,
  bumpScale: 0.4,
  // specularMap: specmap,
  // specular: 0x808080,
});
const sphereMesh = new THREE.Mesh(geometry, material);
scene.add(sphereMesh);

//////CREATING GROUP//////////

const group = new THREE.Group();
// group.add(sphere);
group.add(sphereMesh);
scene.add(group);

///////////////////// CLOUDS/////////////////

const cloudMesh = new THREE.Mesh(
  new THREE.SphereGeometry(5.2, 50, 50),
  new THREE.MeshPhongMaterial({
    emissive: 0xffffff,
    transparent: true,
    opacity: 0.9,
    map: new THREE.TextureLoader().load('./img/earthCloud.png'),
  })
);
scene.add(cloudMesh);

////////////ATMOSPHERE/////////////

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
);

atmosphere.scale.set(1.1, 1.1, 1.1);
atmosphere.position.set(0, 0, 0);

scene.add(atmosphere);

//////////STARS///////

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
});

const starVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 15000;
  starVertices.push(x, y, z);
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

/////////PLACING POINTS WITH LATITUDE AND LONGITUDE///////

function createPoints(lat, lng) {
  const points = new THREE.BoxGeometry(0.1, 0.1, 1);

  const shaderPoints = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.4,
    color: '#ffffff',
  });

  const pointsMesh = new THREE.Mesh(points, shaderPoints);

  const radius = 5;
  const latitude = (lat / 180) * Math.PI;
  const longitude = (lng / 180) * Math.PI;
  const x = radius * Math.cos(latitude) * Math.sin(longitude);
  const y = radius * Math.sin(latitude);
  const z = radius * Math.cos(latitude) * Math.cos(longitude);

  pointsMesh.position.set(x, y, z);
  //Con este METHOD orientamos en la direccion correcta (centro de nuestra sphere) nuestras BoxGeometry
  pointsMesh.lookAt(0, 0, 0);
  //Tranformar el punto incial de nuestra BoxGeometry a la superficie de la sphere (la propertie de translate no existe en THREEjs) hay que utilizar el METHOD applyMatrix4() http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
  pointsMesh.geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0, -0.5)
  );

  group.add(pointsMesh);
}

createPoints(45.7589, 4.84139); //Lyon
createPoints(-14.235, -51.9253); //Brazil
createPoints(20.5937, 78.9629); //India
createPoints(35.8617, 104.1954); //China
createPoints(37.0902, -95.7129); //USA

sphereMesh.rotation.y = -Math.PI / 2;

//////////MOUSE CONTROL///////////

const mouse = {
  x: 0,
  y: 0,
};
//ANIMATION
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // sphereMesh.rotation.y += 0.001;
  cloudMesh.rotation.y += 0.002;
  group.rotation.y = mouse.x * 0.5;

  gsap.to(group.rotation, {
    x: -mouse.y * 0.3,
    y: mouse.x * 0.3,
    duration: 2,
  });
}
animate();

addEventListener('mousemove', () => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;
});
// console.log(mouse);
