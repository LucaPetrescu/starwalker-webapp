import * as THREE from 'three';

export function createScene(background = 0x0a0a12): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  return scene;
}

export function createCamera(fov: number, aspect: number, near: number, far: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 0);
  return camera;
}

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  return renderer;
}

export function updateCameraAspect(camera: THREE.PerspectiveCamera, width: number, height: number): void {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function resizeRenderer(renderer: THREE.WebGLRenderer, width: number, height: number): void {
  renderer.setSize(width, height);
}

export function disposeObjects(objects: THREE.Object3D[]): void {
  for (const obj of objects) {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material?.dispose();
      }
    }
    if (obj.children?.length) disposeObjects(obj.children);
  }
}

export function createStarGeometry(
  positions: Float32Array,
  sizes: Float32Array,
  colors: Float32Array
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

const starVertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(vColor, 0.9 * a);
  }
`;

export function createStarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {},
  });
}
