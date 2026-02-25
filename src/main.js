import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import getStarfield from "./getStarfield.js";
import { PLANETS } from "./planets.js";

// renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// camera
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 0, window.innerWidth < 600 ? 4 : 3);

// camera animation
const cameraTarget = new THREE.Vector3(0, 0, 3);
const controlsTarget = new THREE.Vector3(0, 0, 0);
let isAnimating = false;

// scene
const scene = new THREE.Scene();

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// loader
const loader = new THREE.TextureLoader();
const base = import.meta.env.BASE_URL;

// Planets
const planetObjects = [];

function createPlanet(data) {
  const group = new THREE.Group();
  group.position.set(data.position.x, data.position.y, data.position.z);
  group.rotation.z = (data.axialTilt * Math.PI) / 180;
  scene.add(group);

  const geo = new THREE.IcosahedronGeometry(data.radius, 16);
  const animatables = []; // { mesh, rotationSpeed }

  if (data.layers) {
    // multilayers planets(Earth, Venus)
    data.layers.forEach((layer) => {
      let mat;

      if (layer.type === "day") {
        const matParams = {
          map: loader.load(base + layer.map),
        };
        if (layer.specularMap) {
          matParams.specularMap = loader.load(base + layer.specularMap);
        }
        if (layer.normalMap) {
          matParams.normalMap = loader.load(base + layer.normalMap);
          matParams.normalScale = new THREE.Vector2(0.5, 0.5);
        }
        mat = new THREE.MeshPhongMaterial(matParams);
      } else if (layer.type === "night") {
        mat = new THREE.MeshBasicMaterial({
          map: loader.load(base + layer.map),
          blending: THREE.AdditiveBlending,
          transparent: true,
        });
      } else if (layer.type === "clouds") {
        mat = new THREE.MeshStandardMaterial({
          map: loader.load(base + layer.map),
          blending: THREE.AdditiveBlending,
          transparent: true,
        });
      }

      const mesh = new THREE.Mesh(geo, mat);
      if (layer.scale) mesh.scale.setScalar(layer.scale);
      group.add(mesh);
      animatables.push({
        mesh,
        rotationSpeed: layer.rotationSpeed ?? data.rotationSpeed,
      });
    });
  } else {
    // single layer planets
    const mat = data.texture
      ? new THREE.MeshPhongMaterial({ map: loader.load(base + data.texture) })
      : new THREE.MeshPhongMaterial({ color: data.color });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    animatables.push({ mesh, rotationSpeed: data.rotationSpeed });
  }

  return { group, animatables };
}

// add planets
PLANETS.forEach((data) => {
  const obj = createPlanet(data);
  obj.id = data.id;
  obj.group.visible = data.id === "earth";
  planetObjects.push(obj);
});

// stars
const stars = getStarfield({ numStars: 5000 });
scene.add(stars);

// light
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

// UI
const UI_KEYS = [
  ["distanceFromSun", "Distance from Sun"],
  ["radius", "Radius"],
  ["dayLength", "Day length"],
  ["orbitalSpeed", "Orbital speed"],
  ["axialTilt", "Axial tilt"],
  ["gravity", "Surface gravity"],
  ["moons", "Moons"],
  ["atmosphere", "Atmosphere"],
  ["temperature", "Temperature"],
  ["age", "Age"],
];

function updateUI(planet) {
  const ui = document.querySelector(".ui");
  ui.querySelector("h1").textContent = planet.name;
  ui.querySelectorAll("p").forEach((p) => p.remove());
  UI_KEYS.forEach(([key, label]) => {
    const p = document.createElement("p");
    p.innerHTML = `${label}: <span>${planet.info[key]}</span>`;
    ui.appendChild(p);
  });
}

updateUI(PLANETS.find((p) => p.id === "earth"));

// buttons
document.querySelectorAll(".planet-btn[data-planet]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const planet = PLANETS.find((p) => p.id === btn.dataset.planet);
    if (!planet) return;

    // show one planet
    planetObjects.forEach((obj) => {
      obj.group.visible = obj.id === planet.id;
    });

    cameraTarget.set(planet.camera.x, planet.camera.y, planet.camera.z);
    controlsTarget.set(planet.position.x, planet.position.y, planet.position.z);
    isAnimating = true;
    updateUI(planet);

    document
      .querySelectorAll(".planet-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// animation
function animate() {
  requestAnimationFrame(animate);

  planetObjects.forEach(({ animatables }) => {
    animatables.forEach(({ mesh, rotationSpeed }) => {
      mesh.rotation.y += rotationSpeed;
    });
  });

  if (isAnimating) {
    camera.position.lerp(cameraTarget, 0.05);
    controls.target.lerp(controlsTarget, 0.05);

    if (camera.position.distanceTo(cameraTarget) < 0.05) {
      camera.position.copy(cameraTarget);
      controls.target.copy(controlsTarget);
      isAnimating = false;
    }
  }

  stars.position.copy(camera.position);

  renderer.render(scene, camera);
  controls.update();
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
