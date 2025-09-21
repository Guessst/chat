import { Canvas } from "@react-three/fiber";
import { EffectComposer, ChromaticAberration, Scanline } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function CRTWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Your normal DOM UI */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {children}
      </div>

      {/* Overlayed CRT shader */}
      <Canvas style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <EffectComposer>
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.002, 0.002]}
          />
          <Scanline
            blendFunction={BlendFunction.MULTIPLY} // darker overlay
            density={3.0}                          // increase scanline frequency
            opacity={0.6}                          // make them stronger
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
