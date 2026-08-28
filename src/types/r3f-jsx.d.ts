import 'react';

type R3FElement = any;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: R3FElement;
      boxGeometry: R3FElement;
      bufferGeometry: R3FElement;
      circleGeometry: R3FElement;
      color: R3FElement;
      cylinderGeometry: R3FElement;
      directionalLight: R3FElement;
      group: R3FElement;
      line: R3FElement;
      lineBasicMaterial: R3FElement;
      mesh: R3FElement;
      meshBasicMaterial: R3FElement;
      meshPhysicalMaterial: R3FElement;
      meshStandardMaterial: R3FElement;
      planeGeometry: R3FElement;
      pointLight: R3FElement;
      points: R3FElement;
      pointsMaterial: R3FElement;
      primitive: R3FElement;
      ringGeometry: R3FElement;
      shaderMaterial: R3FElement;
      sphereGeometry: R3FElement;
      torusGeometry: R3FElement;
    }
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    ambientLight: any;
    boxGeometry: any;
    bufferGeometry: any;
    circleGeometry: any;
    color: any;
    cylinderGeometry: any;
    directionalLight: any;
    group: any;
    line: any;
    lineBasicMaterial: any;
    mesh: any;
    meshBasicMaterial: any;
    meshPhysicalMaterial: any;
    meshStandardMaterial: any;
    planeGeometry: any;
    pointLight: any;
    points: any;
    pointsMaterial: any;
    primitive: any;
    ringGeometry: any;
    shaderMaterial: any;
    sphereGeometry: any;
    torusGeometry: any;
  }
}
