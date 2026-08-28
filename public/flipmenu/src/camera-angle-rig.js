export function createCameraAngleRig(THREE, canvas, options = {}) {
  const state = {
    currentYaw: 0,
    currentPitch: 0,
    currentZoom: 0,
    targetYaw: 0,
    targetPitch: 0,
    targetZoom: 0,
    dragging: false,
    pointerId: null,
    dragDistance: 0,
    suppressClick: false,
  };

  const clamp = THREE.MathUtils.clamp;

  function smooth(current, target, delta, speed = 7.5) {
    return current + (target - current) * (1 - Math.exp(-speed * delta));
  }

  function onPointerDown(event) {
    if (options.isLayoutEditing?.()) return;
    if (event.button !== 0 || options.prefersReducedMotion?.()) return;
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.dragDistance = 0;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (options.isLayoutEditing?.()) return;
    if (!state.dragging || state.pointerId !== event.pointerId) return;
    const dx = event.movementX || 0;
    const dy = event.movementY || 0;
    state.dragDistance += Math.abs(dx) + Math.abs(dy);
    state.targetYaw = clamp(state.targetYaw - dx * 0.0038, -0.58, 0.58);
    state.targetPitch = clamp(state.targetPitch - dy * 0.0028, -0.28, 0.34);
  }

  function onPointerUp(event) {
    if (state.pointerId !== event.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
    if (state.dragDistance > 8) {
      state.suppressClick = true;
      window.setTimeout(() => {
        state.suppressClick = false;
      }, 80);
    }
    canvas.releasePointerCapture?.(event.pointerId);
  }

  function onWheel(event) {
    if (options.isLayoutEditing?.()) return;
    if (options.prefersReducedMotion?.()) return;
    event.preventDefault();
    state.targetZoom = clamp(state.targetZoom + event.deltaY * 0.0012, -0.82, 0.92);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return {
    state,
    update(delta) {
      state.currentYaw = smooth(state.currentYaw, state.targetYaw, delta, state.dragging ? 12 : 5.8);
      state.currentPitch = smooth(state.currentPitch, state.targetPitch, delta, state.dragging ? 12 : 5.8);
      state.currentZoom = smooth(state.currentZoom, state.targetZoom, delta, 6.2);
    },
    apply(baseCamera, baseLook, { focusMode = false, key = "desktop" } = {}) {
      const strength = key === "mobile" ? 0.34 : focusMode ? 0.48 : 1;
      const look = baseLook.clone();
      look.x += state.currentYaw * strength * 0.42;
      look.y += state.currentPitch * strength * 0.26;

      const offset = baseCamera.clone().sub(baseLook);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += state.currentYaw * strength;
      spherical.phi = clamp(spherical.phi + state.currentPitch * strength, 0.58, Math.PI - 0.58);
      spherical.radius = Math.max(3.1, spherical.radius + state.currentZoom * (key === "mobile" ? 0.42 : 0.72));
      const camera = new THREE.Vector3().setFromSpherical(spherical).add(look);
      return { camera, look };
    },
    shouldSuppressClick() {
      return state.suppressClick;
    },
    reset() {
      state.targetYaw = 0;
      state.targetPitch = 0;
      state.targetZoom = 0;
    },
    destroy() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    },
  };
}
