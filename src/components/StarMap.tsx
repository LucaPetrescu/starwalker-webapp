import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  generateRandomSpherePosition,
  generateStarColor,
  generateStarSize,
} from '@/utils/starGeneration';
import {
  createStarGeometry,
  createStarMaterial,
  createScene,
  createCamera,
  createRenderer,
  disposeObjects,
  updateCameraAspect,
  resizeRenderer,
} from '@/utils/threeHelpers';
import useLocation from '@/hooks/useLocation';

const DOME_RADIUS = 500;
const STAR_COUNT = 12000;
const MIN_STAR_SIZE = 0.4;
const MAX_STAR_SIZE = 3.5;
const ROTATION_SENSITIVITY = 0.004;

export function StarMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const skyGroupRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !skyGroupRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
    rotationRef.current.y += dx * ROTATION_SENSITIVITY;
    rotationRef.current.x += dy * ROTATION_SENSITIVITY;
    rotationRef.current.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, rotationRef.current.x));
    skyGroupRef.current.rotation.order = 'YXZ';
    skyGroupRef.current.rotation.y = rotationRef.current.y;
    skyGroupRef.current.rotation.x = rotationRef.current.x;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handlePointerLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const location = useLocation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = createScene(0x050508);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const camera = createCamera(60, aspect, 1, 2000);
    camera.lookAt(0, 0, -1);
    cameraRef.current = camera;

    const renderer = createRenderer(container);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const skyGroup = new THREE.Group();
    skyGroupRef.current = skyGroup;
    scene.add(skyGroup);

    // Inverted dome (inner surface visible = planetarium ceiling)
    const domeGeometry = new THREE.SphereGeometry(DOME_RADIUS, 64, 48);
    const domeMaterial = new THREE.MeshBasicMaterial({
      color: 0x080810,
      side: THREE.BackSide,
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    skyGroup.add(dome);

    // Stars on the inner surface (slightly inward to avoid z-fighting)
    const starRadius = DOME_RADIUS - 2;
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const colors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const pos = generateRandomSpherePosition(starRadius);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      sizes[i] = generateStarSize(MIN_STAR_SIZE, MAX_STAR_SIZE);
      const c = generateStarColor();
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const starGeometry = createStarGeometry(positions, sizes, colors);
    const starMaterial = createStarMaterial();
    const stars = new THREE.Points(starGeometry, starMaterial);
    skyGroup.add(stars);

    const resize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      updateCameraAspect(cameraRef.current, w, h);
      resizeRenderer(rendererRef.current, w, h);
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
      if (rendererRef.current?.domElement?.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      disposeObjects([dome, stars]);
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      skyGroupRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    />
  );
}
