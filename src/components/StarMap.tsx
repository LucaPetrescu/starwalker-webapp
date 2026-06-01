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
import type { StarMapProps } from '@/types';
import type { SatelliteData } from '@/types/satellite';

const DOME_RADIUS = 500;
const STAR_COUNT = 12000;
const MIN_STAR_SIZE = 0.4;
const MAX_STAR_SIZE = 3.5;
const ROTATION_SENSITIVITY = 0.004;

const SAT_RADIUS = 490; // slightly inside dome surface so they're in front of stars
const ORBIT_POINTS = 128; // segments for the full orbit circle

const SATELLITE_COLORS = [
  0x3ecfcf, // cyan-teal   (matches primary accent)
  0xe8a84c, // amber-gold  (matches secondary)
  0x818cf8, // indigo-violet
  0x6ee7b7, // seafoam green
  0xf472b6, // dusty rose
  0x93c5fd, // slate blue
  0xfde68a, // pale gold
  0xc4b5fd, // lavender
  0x5eead4, // teal-mint
  0xfca5a5, // muted coral
];

interface SatelliteObjects {
  line: THREE.Line;
  marker: THREE.LineSegments;
  hitMesh: THREE.Mesh;
  colorIndex: number;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function computeElevation(
  obsLat: number,
  obsLon: number,
  satLat: number,
  satLon: number,
  satAltKm: number,
): number {
  const R = 6371;
  const φ1 = THREE.MathUtils.degToRad(obsLat);
  const φ2 = THREE.MathUtils.degToRad(satLat);
  const dφ = φ2 - φ1;
  const dλ = THREE.MathUtils.degToRad(satLon - obsLon);
  const a =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  const dRad = 2 * Math.asin(Math.sqrt(a));
  if (dRad < 0.001) return 90;
  const elevRad = Math.atan2(
    Math.cos(dRad) - R / (R + satAltKm),
    Math.sin(dRad),
  );
  return THREE.MathUtils.radToDeg(elevRad);
}

function satelliteBearing(
  obsLat: number,
  obsLon: number,
  satLat: number,
  satLon: number,
): number {
  const φ1 = THREE.MathUtils.degToRad(obsLat);
  const φ2 = THREE.MathUtils.degToRad(satLat);
  const dλ = THREE.MathUtils.degToRad(satLon - obsLon);
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (THREE.MathUtils.radToDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Convert azimuth + elevation to a 3-D point on the satellite layer. */
function azElToPoint(azDeg: number, elDeg: number): THREE.Vector3 {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(Math.max(2, elDeg));
  return new THREE.Vector3(
    SAT_RADIUS * Math.cos(el) * Math.sin(az),
    SAT_RADIUS * Math.sin(el),
    -SAT_RADIUS * Math.cos(el) * Math.cos(az),
  );
}

/** Fallback: map satellite lat/lon directly onto the dome sphere (no observer needed). */
function latLonToPoint(lat: number, lon: number): THREE.Vector3 {
  const φ = THREE.MathUtils.degToRad(lat);
  const λ = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    SAT_RADIUS * Math.cos(φ) * Math.sin(λ),
    SAT_RADIUS * Math.sin(φ),
    -SAT_RADIUS * Math.cos(φ) * Math.cos(λ),
  );
}

/**
 * Generate a full great-circle orbit through `center`.
 * The orbit plane is defined by `center` and the east tangent at that point.
 * Returns ORBIT_POINTS evenly spaced around 360° — use with THREE.LineLoop.
 */
function generateOrbitCircle(center: THREE.Vector3): THREE.Vector3[] {
  const p = center.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  let tangent = new THREE.Vector3().crossVectors(p, up).normalize();
  if (tangent.lengthSq() < 0.001) tangent.set(1, 0, 0);

  const points: THREE.Vector3[] = [];
  for (let i = 0; i < ORBIT_POINTS; i++) {
    const alpha = (i / ORBIT_POINTS) * Math.PI * 2;
    const pt = new THREE.Vector3()
      .addScaledVector(p, Math.cos(alpha))
      .addScaledVector(tangent, Math.sin(alpha))
      .normalize()
      .multiplyScalar(SAT_RADIUS);
    points.push(pt);
  }
  return points;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StarMap({
  onViewDirectionChange,
  satellites,
  selectedSatelliteId,
  onSatelliteClick,
  observerLat,
  observerLon,
}: StarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const skyGroupRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const viewDirectionRef = useRef(new THREE.Vector3());
  const viewQuatRef = useRef(new THREE.Quaternion());
  const horizonLabelRef = useRef<HTMLDivElement>(null);
  const groundOverlayRef = useRef<HTMLDivElement>(null);

  // Map: satellite id → Three.js objects for that satellite
  const satelliteObjectsRef = useRef<Map<string, SatelliteObjects>>(new Map());

  // ── Pointer / drag handlers ─────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !skyGroupRef.current) return;

      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;

      // Mark as dragged after 3px of movement so single clicks aren't blocked
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;

      prevMouseRef.current = { x: e.clientX, y: e.clientY };
      rotationRef.current.y += dx * ROTATION_SENSITIVITY;
      rotationRef.current.x += dy * ROTATION_SENSITIVITY;
      rotationRef.current.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, rotationRef.current.x),
      );
      skyGroupRef.current.rotation.order = 'YXZ';
      skyGroupRef.current.rotation.y = rotationRef.current.y;
      skyGroupRef.current.rotation.x = rotationRef.current.x;

      const tilt = rotationRef.current.x;

      // Horizon label
      const el = horizonLabelRef.current;
      if (el) {
        if (tilt > 0.05) {
          el.textContent = 'LOOKING BELOW THE HORIZON';
          el.style.color = 'rgba(232, 168, 76, 0.55)';
          el.style.opacity = '1';
          el.style.transform = 'translateX(-50%) translateY(0)';
        } else if (tilt < -0.05) {
          el.textContent = 'LOOKING ABOVE THE HORIZON';
          el.style.color = 'rgba(62, 207, 207, 0.55)';
          el.style.opacity = '1';
          el.style.transform = 'translateX(-50%) translateY(0)';
        } else {
          el.style.opacity = '0';
          el.style.transform = 'translateX(-50%) translateY(4px)';
        }
      }

      // Ground overlay — tracks the horizon's screen position and fades out
      // when the user looks below the horizon.
      // With 60° FOV (half = 30°), horizon NDC_y = tan(tilt) / tan(30°) = tan(tilt) * √3
      // Screen top % = 50 - NDC_y * 50, clamped to [0, 100].
      const ground = groundOverlayRef.current;
      if (ground) {
        const horizonTop = Math.max(0, Math.min(100, 50 - Math.tan(tilt) * Math.sqrt(3) * 50));
        ground.style.top = `${horizonTop}%`;
        ground.style.opacity = tilt > 0.05 ? '0' : '1';
      }

      if (onViewDirectionChange) {
        const skyGroup = skyGroupRef.current;
        const dir = viewDirectionRef.current;
        const quat = viewQuatRef.current;

        dir.set(0, 0, -1);
        skyGroup.getWorldQuaternion(quat);
        quat.invert();
        dir.applyQuaternion(quat);
        dir.normalize();

        const phi = Math.acos(THREE.MathUtils.clamp(dir.z, -1, 1));
        const theta = Math.atan2(dir.y, dir.x);
        const skyLongitude = (THREE.MathUtils.radToDeg(theta) + 360) % 360;
        const skyLatitude = 90 - THREE.MathUtils.radToDeg(phi);

        const bearingRaw = THREE.MathUtils.radToDeg(rotationRef.current.y);
        const bearing = ((bearingRaw % 360) + 360) % 360;

        onViewDirectionChange({ bearing, skyLongitude, skyLatitude });
      }
    },
    [onViewDirectionChange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasDragging = hasDraggedRef.current;
      isDraggingRef.current = false;
      hasDraggedRef.current = false;

      // If pointer didn't move → treat as click → raycast against satellite hit meshes
      if (!wasDragging && onSatelliteClick && cameraRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.params.Line = { threshold: 5 };
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);

        const hitMeshes = Array.from(satelliteObjectsRef.current.values()).map(
          (obj) => obj.hitMesh,
        );
        const intersects = raycaster.intersectObjects(hitMeshes);
        if (intersects.length > 0) {
          const satId = intersects[0].object.userData.satelliteId as string;
          onSatelliteClick(satId);
        }
      }
    },
    [onSatelliteClick],
  );

  const handlePointerLeave = useCallback(() => {
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
  }, []);

  // ── Scene setup (runs once on mount) ───────────────────────────────────────

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

    // Inverted dome (inner surface = planetarium ceiling)
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

    // Horizon circle — in skyGroup so it tilts with the sky.
    // When looking down the circle rises above viewport centre; looking up it drops below.
    const HORIZON_SEGMENTS = 256;
    const horizonPoints: THREE.Vector3[] = [];
    for (let i = 0; i < HORIZON_SEGMENTS; i++) {
      const angle = (i / HORIZON_SEGMENTS) * Math.PI * 2;
      horizonPoints.push(
        new THREE.Vector3(
          (DOME_RADIUS - 3) * Math.cos(angle),
          0,
          (DOME_RADIUS - 3) * Math.sin(angle),
        ),
      );
    }
    const horizonGeo = new THREE.BufferGeometry().setFromPoints(horizonPoints);
    const horizonMat = new THREE.LineBasicMaterial({
      color: 0x88aacc,
      opacity: 0.4,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const horizonLine = new THREE.LineLoop(horizonGeo, horizonMat);
    skyGroup.add(horizonLine);

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
        rendererRef.current.domElement.parentNode.removeChild(
          rendererRef.current.domElement,
        );
      }
      disposeObjects([dome, stars, horizonLine]);
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      skyGroupRef.current = null;
    };
  }, []);

  // ── Satellite rendering (re-runs when satellite list changes) ──────────────

  useEffect(() => {
    const skyGroup = skyGroupRef.current;
    if (!skyGroup) return;

    // Remove and dispose all previous satellite objects
    satelliteObjectsRef.current.forEach(({ line, marker, hitMesh }) => {
      skyGroup.remove(line, marker, hitMesh);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
      hitMesh.geometry.dispose();
      (hitMesh.material as THREE.Material).dispose();
    });
    satelliteObjectsRef.current.clear();

    if (!satellites?.length) return;

    satellites.forEach((sat: SatelliteData, index: number) => {
      const colorIndex = index % SATELLITE_COLORS.length;
      const color = SATELLITE_COLORS[colorIndex];

      // ── Compute dome position ──────────────────────────────────────────────
      let domePos: THREE.Vector3;
      if (
        observerLat !== undefined &&
        observerLon !== undefined &&
        typeof sat.latitude === 'number' &&
        typeof sat.longitude === 'number'
      ) {
        const az = satelliteBearing(observerLat, observerLon, sat.latitude, sat.longitude);
        const el = computeElevation(observerLat, observerLon, sat.latitude, sat.longitude, sat.altitudeKm);
        domePos = azElToPoint(az, el);
      } else {
        domePos = latLonToPoint(sat.latitude, sat.longitude);
      }

      // ── Full orbit circle ─────────────────────────────────────────────────
      const orbitPoints = generateOrbitCircle(domePos);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const lineMat = new THREE.LineBasicMaterial({
        color,
        opacity: 0.35,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.LineLoop(lineGeo, lineMat);
      skyGroup.add(line);

      // ── Position marker (square outline at satellite's current location) ──
      // orbitPoints[0] is exactly domePos (alpha=0 → p*1 + tangent*0 = p)
      const markerPos = domePos;

      const markerSize = 10; // units in dome space (~0.012 × SAT_RADIUS)
      const markerGeo = new THREE.EdgesGeometry(
        new THREE.PlaneGeometry(markerSize, markerSize),
      );
      const markerMat = new THREE.LineBasicMaterial({
        color,
        opacity: 0.9,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const marker = new THREE.LineSegments(markerGeo, markerMat);
      marker.position.copy(markerPos);
      // Orient the marker to face the center (so it lies flat on the dome surface)
      marker.lookAt(new THREE.Vector3(0, 0, 0));
      skyGroup.add(marker);

      // ── Invisible hit sphere (for raycasting) ─────────────────────────────
      const hitGeo = new THREE.SphereGeometry(12, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(markerPos);
      hitMesh.userData.satelliteId = sat.id;
      skyGroup.add(hitMesh);

      satelliteObjectsRef.current.set(sat.id, {
        line,
        marker,
        hitMesh,
        colorIndex,
      });
    });
  }, [satellites, observerLat, observerLon]);

  // ── Selected-state highlight (re-runs when selection changes) ──────────────

  useEffect(() => {
    satelliteObjectsRef.current.forEach(({ line, marker }, id) => {
      const isSelected = id === selectedSatelliteId;
      const lineMat = line.material as THREE.LineBasicMaterial;
      const markerMat = marker.material as THREE.LineBasicMaterial;

      if (selectedSatelliteId === null || selectedSatelliteId === undefined) {
        // Nothing selected — all satellites at default opacity
        lineMat.opacity = 0.35;
        markerMat.opacity = 0.9;
        marker.scale.setScalar(1);
      } else if (isSelected) {
        lineMat.opacity = 0.7;
        markerMat.opacity = 1.0;
        marker.scale.setScalar(1.5);
      } else {
        // Dim non-selected satellites so the selected one stands out
        lineMat.opacity = 0.15;
        markerMat.opacity = 0.4;
        marker.scale.setScalar(1);
      }
    });
  }, [selectedSatelliteId]);

  // ── Render ─────────────────────────────────────────────────────────────────

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
    >
      {/* Ground overlay — black fill below the horizon, tracks tilt, fades when looking down */}
      <div
        ref={groundOverlayRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, #000 25%)',
          pointerEvents: 'none',
          zIndex: 5,
          transition: 'opacity 200ms ease-out',
        }}
      />
      <div
        ref={horizonLabelRef}
        style={{
          position: 'absolute',
          bottom: 'var(--space-4)',
          left: '50%',
          transform: 'translateX(-50%) translateY(4px)',
          opacity: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-mono-sm)',
          fontWeight: 400,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          textShadow:
            '0 0 12px rgba(5,5,8,0.9), 0 0 24px rgba(5,5,8,0.7), 0 1px 2px rgba(5,5,8,1)',
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
          userSelect: 'none' as const,
          whiteSpace: 'nowrap' as const,
        }}
      />
    </div>
  );
}
