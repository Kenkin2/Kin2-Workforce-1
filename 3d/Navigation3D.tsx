import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, RoundedBox, Float } from '@react-three/drei';
import { useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useLocation } from 'wouter';

interface NavigationItem {
  label: string;
  path: string;
  color: string;
  position: [number, number, number];
}

function NavigationButton({ item, onClick }: { item: NavigationItem; onClick: () => void }) {
  const meshRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new Vector3(hovered ? 1.2 : 1, hovered ? 1.2 : 1, hovered ? 1.2 : 1),
        0.1
      );
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group
        ref={meshRef}
        position={item.position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <RoundedBox args={[2, 1, 0.3]} radius={0.1}>
          <meshStandardMaterial
            color={item.color}
            emissive={item.color}
            emissiveIntensity={hovered ? 0.5 : 0.2}
          />
        </RoundedBox>
        <Text
          position={[0, 0, 0.2]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {item.label}
        </Text>
      </group>
    </Float>
  );
}

export default function Navigation3D() {
  const [, setLocation] = useLocation();

  const navigationItems: NavigationItem[] = [
    { label: 'Dashboard', path: '/home', color: '#3b82f6', position: [-3, 2, 0] },
    { label: 'Jobs', path: '/jobs', color: '#10b981', position: [3, 2, 0] },
    { label: 'Schedule', path: '/schedule', color: '#f59e0b', position: [-3, 0, 0] },
    { label: 'Timesheets', path: '/timesheets', color: '#8b5cf6', position: [3, 0, 0] },
    { label: 'Analytics', path: '/analytics', color: '#ec4899', position: [-3, -2, 0] },
    { label: 'Reports', path: '/reports', color: '#06b6d4', position: [3, -2, 0] },
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-slate-950 to-slate-900 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={20}
        />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />

        {navigationItems.map((item, index) => (
          <NavigationButton
            key={index}
            item={item}
            onClick={() => handleNavigation(item.path)}
          />
        ))}

        <Text
          position={[0, 4, 0]}
          fontSize={0.6}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          Interactive 3D Navigation
        </Text>
      </Canvas>
    </div>
  );
}
