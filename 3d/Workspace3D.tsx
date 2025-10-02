import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text, Box, Cylinder } from '@react-three/drei';
import { Suspense } from 'react';

function Office3DModel() {
  return (
    <group position={[0, 0, 0]}>
      <Box args={[6, 0.2, 4]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#6b7280" />
      </Box>
      
      <Box args={[4, 1.5, 2]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      
      <Box args={[3.5, 0.1, 1.8]} position={[0, 1.55, 0]}>
        <meshStandardMaterial color="#1f2937" />
      </Box>
      
      <Cylinder args={[0.05, 0.05, 1.5]} position={[-1.5, 0.75, 0.8]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#374151" />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 1.5]} position={[1.5, 0.75, 0.8]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#374151" />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 1.5]} position={[-1.5, 0.75, -0.8]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#374151" />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 1.5]} position={[1.5, 0.75, -0.8]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#374151" />
      </Cylinder>

      <Box args={[1, 0.8, 0.8]} position={[-2, 2.2, 0]}>
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
      </Box>
      <Box args={[1, 0.8, 0.8]} position={[0, 2.2, 0]}>
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
      </Box>
      <Box args={[1, 0.8, 0.8]} position={[2, 2.2, 0]}>
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
      </Box>

      <Text
        position={[0, 3.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Kin2 Workforce Platform
      </Text>
    </group>
  );
}

export default function Workspace3D() {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-blue-950 to-slate-900 rounded-lg overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[8, 6, 8]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={2}
        />
        
        <ambientLight intensity={0.4} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#3b82f6" />

        <Suspense fallback={null}>
          <Office3DModel />
          <ContactShadows
            position={[0, -0.1, 0]}
            opacity={0.5}
            scale={15}
            blur={2}
            far={10}
          />
          <Environment preset="city" />
        </Suspense>

        <gridHelper args={[20, 20, '#1e40af', '#1e3a8a']} position={[0, -0.1, 0]} />
      </Canvas>
    </div>
  );
}
