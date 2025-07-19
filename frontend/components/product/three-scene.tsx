"use client"

import { useRef, useEffect, useState, Suspense } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Environment, Html, Center } from "@react-three/drei"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { Badge } from "@/components/ui/badge"
import * as THREE from "three"

interface ThreeSceneProps {
  modelUrl: string
  isDefault: boolean
  productName: string
  resetTrigger: number
}

function Model({ url, isDefault, resetTrigger }: { url: string; isDefault: boolean; resetTrigger: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const [error, setError] = useState(false)

  // Use Three.js GLTFLoader directly instead of useGLTF to avoid dependencies
  const gltf = useLoader(GLTFLoader, url, undefined, (error) => {
    console.error("Failed to load GLTF:", error)
    setError(true)
  })

  // Reset rotation when resetTrigger changes
  useEffect(() => {
    if (groupRef.current && resetTrigger > 0) {
      groupRef.current.rotation.set(0, 0, 0)
    }
  }, [resetTrigger])

  // Auto-rotate for default models
  useFrame((state) => {
    if (groupRef.current && isDefault) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  if (error) {
    return <FallbackModel isDefault={isDefault} />
  }

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={gltf.scene.clone()} scale={1} />
      </Center>
      {isDefault && (
        <Html position={[0, -2, 0]} center>
          <Badge className="bg-yellow-100 text-yellow-800 text-xs whitespace-nowrap">Default Model</Badge>
        </Html>
      )}
    </group>
  )
}

// Simple fallback model using basic Three.js geometry
function FallbackModel({ isDefault }: { isDefault: boolean }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current && isDefault) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <group ref={meshRef}>
      {/* Simple shirt-like shape */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2.5, 0.3]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      {/* Sleeves */}
      <mesh position={[-1.5, 0.5, 0]}>
        <boxGeometry args={[1, 1.5, 0.3]} />
        <meshStandardMaterial color="#4338ca" />
      </mesh>
      <mesh position={[1.5, 0.5, 0]}>
        <boxGeometry args={[1, 1.5, 0.3]} />
        <meshStandardMaterial color="#4338ca" />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 1, 0.2]}>
        <boxGeometry args={[0.8, 0.3, 0.1]} />
        <meshStandardMaterial color="#3730a3" />
      </mesh>
      <Html position={[0, -2, 0]} center>
        <Badge className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">Fallback Shirt Model</Badge>
      </Html>
    </group>
  )
}

function Scene({ modelUrl, isDefault, productName, resetTrigger }: ThreeSceneProps) {
  return (
    <>
      <Suspense
        fallback={
          <Html center>
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <div className="text-sm text-gray-600 dark:text-gray-200">Loading {productName}...</div>
            </div>
          </Html>
        }
      >
        <Model url={modelUrl} isDefault={isDefault} resetTrigger={resetTrigger} />
      </Suspense>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={false}
        minDistance={3}
        maxDistance={10}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
      />

      <Environment preset="studio" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
    </>
  )
}

export default function ThreeScene({ modelUrl, isDefault, productName, resetTrigger }: ThreeSceneProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 w-16 h-16 rounded-lg mx-auto mb-2"></div>
          <div className="text-sm text-gray-600 dark:text-gray-200">Preparing 3D Scene...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
        dpr={[1, 2]}
      >
        <Scene modelUrl={modelUrl} isDefault={isDefault} productName={productName} resetTrigger={resetTrigger} />
      </Canvas>
    </div>
  )
}
