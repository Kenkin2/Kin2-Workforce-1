import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Box, Sphere } from '@react-three/drei';
import { useRef, useState } from 'react';
import { Group } from 'three';

function AnimatedBarChart() {
  const groupRef = useRef<Group>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = [
    { label: 'Mon', value: 65, color: '#3b82f6' },
    { label: 'Tue', value: 78, color: '#10b981' },
    { label: 'Wed', value: 92, color: '#f59e0b' },
    { label: 'Thu', value: 58, color: '#ef4444' },
    { label: 'Fri', value: 85, color: '#8b5cf6' },
    { label: 'Sat', value: 45, color: '#ec4899' },
    { label: 'Sun', value: 72, color: '#06b6d4' },
  ];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {data.map((item, index) => {
        const height = (item.value / 100) * 5;
        const x = (index - data.length / 2) * 1.5;
        const isHovered = hoveredIndex === index;
        
        return (
          <group key={index} position={[x, height / 2, 0]}>
            <Box
              args={[1, height, 1]}
              onPointerOver={() => setHoveredIndex(index)}
              onPointerOut={() => setHoveredIndex(null)}
            >
              <meshStandardMaterial
                color={item.color}
                emissive={item.color}
                emissiveIntensity={isHovered ? 0.5 : 0.1}
              />
            </Box>
            <Text
              position={[0, height + 0.5, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {item.value}%
            </Text>
            <Text
              position={[0, -0.7, 0]}
              fontSize={0.25}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              {item.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function DataSpheres() {
  const spheres = [
    { position: [-5, 3, -2], size: 0.8, color: '#3b82f6', label: 'Active\nUsers' },
    { position: [5, 3, -2], size: 1.0, color: '#10b981', label: 'Revenue\nGrowth' },
    { position: [-5, -3, -2], size: 0.6, color: '#f59e0b', label: 'Tasks\nCompleted' },
    { position: [5, -3, -2], size: 0.9, color: '#8b5cf6', label: 'Customer\nSatisfaction' },
  ];

  return (
    <group>
      {spheres.map((sphere, index) => (
        <group key={index} position={sphere.position as [number, number, number]}>
          <Sphere args={[sphere.size, 32, 32]}>
            <meshStandardMaterial
              color={sphere.color}
              emissive={sphere.color}
              emissiveIntensity={0.4}
              metalness={0.3}
              roughness={0.2}
            />
          </Sphere>
          <Text
            position={[0, sphere.size + 0.8, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            maxWidth={2}
          >
            {sphere.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function DataVisualization3D() {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 4, 18]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={30}
        />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
        <spotLight position={[0, 20, 0]} intensity={0.8} angle={0.6} penumbra={1} castShadow />

        <AnimatedBarChart />
        <DataSpheres />

        <gridHelper args={[30, 30, '#1e40af', '#1e3a8a']} position={[0, -3, 0]} />
        
        <Text
          position={[0, 6, 0]}
          fontSize={0.6}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          3D Data Visualization
        </Text>
      </Canvas>
    </div>
  );
}
