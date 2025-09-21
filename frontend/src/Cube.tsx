import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

function SpinningCube() {
  const cubeRef = useRef<Mesh>(null!);

  // Rotate cube every frame
  useFrame(() => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x += 0.01;
      cubeRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={cubeRef}>
      {/* Geometry: box */}
      <boxGeometry args={[1, 1, 1]} />
      {/* Material: basic color */}
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

export default function Cube() {
  return (
    <div style={{ position:"absolute",  width: "100px", height: "400px", zIndex: 999 }}>
      <Canvas camera={{ position: [3, 3, 3] }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} />
        
        {/* The cube */}
        <SpinningCube />
      </Canvas>
    </div>
  );
}
