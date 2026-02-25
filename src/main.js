import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import getStarfield from "./getStarfield.js";
import { PLANETS } from "./planets.js";

//renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
// renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.outputColorSpace = THREE.SRGBColorSpace;

//camera
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = window.innerWidth < 600 ? 4 : 3;

//scene
const scene = new THREE.Scene();

//OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

//geometry
const geometry = new THREE.IcosahedronGeometry(1, 16);

//Group
const earthGroup = new THREE.Group();
earthGroup.rotation.z = (-23.4 * Math.PI) / 180;
scene.add(earthGroup);

//Materials
const loader = new THREE.TextureLoader();
const base = import.meta.env.BASE_URL;
const material = new THREE.MeshPhongMaterial({
  map: loader.load(base + "8k_earth_daymap.webp"),
  specularMap: loader.load(base + "8k_earth_specular_map.webp"),
  normalMap: loader.load(base + "8k_earth_normal_map.webp"),
  normalScale: new THREE.Vector2(0.5, 0.5),
});
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMaterial = new THREE.MeshBasicMaterial({
  map: loader.load(base + "8k_earth_nightmap.webp"),
  blending: THREE.AdditiveBlending,
  opacity: 1,
  transparent: true,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMaterial);
earthGroup.add(lightsMesh);

const cloudsMaterial = new THREE.MeshStandardMaterial({
  map: loader.load(base + "8k_earth_clouds.webp"),
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 1.0,
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMaterial);
cloudsMesh.scale.setScalar(1.005);
earthGroup.add(cloudsMesh);

//stars
const stars = getStarfield({ numStars: 5000 });
scene.add(stars);

//add light
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

//animation
function animate() {
  requestAnimationFrame(animate);
  earthMesh.rotation.y += 0.002;
  lightsMesh.rotation.y += 0.002;
  cloudsMesh.rotation.y += 0.0023;
  // stars.rotation.y -= 0.001;
  renderer.render(scene, camera);
  controls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);
