import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Box, Sphere } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { Vector3 } from 'three';

interface Analytics3DProps {
  data?: {
    revenue: number;
    workers: number;
    jobs: number;
    shifts: number;
  };
}

function BarChart3D({ data }: { data: number[]; labels: string[]; colors: string[] }) {
  return (
    <group>
      {data.map((value, index) => {
        const height = (value / Math.max(...data)) * 5;
        const x = (index - data.length / 2) * 2;
        return (
          <group key={index} position={[x, height / 2, 0]}>
            <Box args={[1.5, height, 1.5]}>
              <meshStandardMaterial color={data[index] > 0 ? '#3b82f6' : '#ef4444'} />
            </Box>
            <Text
              position={[0, height + 0.5, 0]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {value.toLocaleString()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function FloatingMetrics({ data }: Analytics3DProps) {
  const metrics = [
    { label: 'Revenue', value: data?.revenue || 0, color: '#10b981', position: [-4, 2, 0] },
    { label: 'Workers', value: data?.workers || 0, color: '#3b82f6', position: [4, 2, 0] },
    { label: 'Jobs', value: data?.jobs || 0, color: '#f59e0b', position: [-4, -2, 0] },
    { label: 'Shifts', value: data?.shifts || 0, color: '#8b5cf6', position: [4, -2, 0] },
  ];

  return (
    <group>
      {metrics.map((metric, index) => (
        <group key={index} position={metric.position as [number, number, number]}>
          <Sphere args={[0.8, 32, 32]}>
            <meshStandardMaterial
              color={metric.color}
              emissive={metric.color}
              emissiveIntensity={0.3}
            />
          </Sphere>
          <Text
            position={[0, 1.5, 0]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {metric.label}
          </Text>
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {metric.value.toLocaleString()}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function Analytics3D({ data }: Analytics3DProps) {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 15]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
        />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
        <spotLight position={[0, 15, 0]} intensity={0.8} angle={0.6} penumbra={1} />

        <FloatingMetrics data={data} />

        <gridHelper args={[20, 20, '#334155', '#1e293b']} />
      </Canvas>
    </div>
  );
}
