"use client"

import React, { useRef, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html, PerspectiveCamera } from "@react-three/drei"
import { Badge } from "@/components/ui/badge"
import * as THREE from "three"

interface ThreeCanvasProps {
  modelUrl: string
  isDefault: boolean
  productName: string
  onError?: () => void
}

// GLB Model Component
function GLBModel({ url, isDefault, onError }: { url: string; isDefault: boolean; onError?: () => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const [model, setModel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true)
        setError(false)

        // Use GLTFLoader directly for better error handling
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
        const loader = new GLTFLoader()

        loader.load(
          url,
          (gltf) => {
            setModel(gltf.scene)
            setLoading(false)

            // Center and scale the model
            const box = new THREE.Box3().setFromObject(gltf.scene)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())

            // Center the model
            gltf.scene.position.sub(center)

            // Scale to fit
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 2 / maxDim
            gltf.scene.scale.setScalar(scale)
          },
          (progress) => {
            console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%")
          },
          (error) => {
            console.error("Error loading GLB:", error)
            setError(true)
            setLoading(false)
            onError?.()
          },
        )
      } catch (err) {
        console.error("Error setting up GLB loader:", err)
        setError(true)
        setLoading(false)
        onError?.()
      }
    }

    loadModel()
  }, [url, onError])

  // Auto-rotate for default models
  useFrame((state) => {
    if (meshRef.current && isDefault) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  if (loading) {
    return (
      <Html center>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <div className="text-sm text-gray-600 dark:text-gray-200">Loading Model...</div>
        </div>
      </Html>
    )
  }

  if (error || !model) {
    return (
      <Html center>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-sm text-gray-600 dark:text-gray-200">Failed to load 3D model</div>
          <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">Check file path and format</div>
        </div>
      </Html>
    )
  }

  return (
    <group ref={meshRef}>
      <primitive object={model} />
      {isDefault && (
        <Html position={[0, -2, 0]} center>
          <Badge className="bg-yellow-100 text-yellow-800 text-xs whitespace-nowrap">
            Default Model - Upload Yours!
          </Badge>
        </Html>
      )}
    </group>
  )
}

// Fallback Duck Model (in case GLB fails)
function FallbackDuck({ isDefault }: { isDefault: boolean }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current && isDefault) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
      <mesh position={[0, 1.2, 0.3]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
      <mesh position={[0, 1.1, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color="#ff8c00" />
      </mesh>
      <Html position={[0, -2, 0]} center>
        <Badge className="bg-red-100 text-red-800 text-xs whitespace-nowrap">Fallback Model</Badge>
      </Html>
    </group>
  )
}

export default function ThreeCanvas({ modelUrl, isDefault, productName, onError }: ThreeCanvasProps) {
  const [useFallback, setUseFallback] = useState(false)

  const handleModelError = () => {
    console.log("Model failed to load, using fallback")
    setUseFallback(true)
    onError?.()
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
        <React.Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <div className="text-sm text-gray-600 dark:text-gray-200">Initializing 3D Scene...</div>
              </div>
            </Html>
          }
        >
          {useFallback ? (
            <FallbackDuck isDefault={isDefault} />
          ) : (
            <GLBModel url={modelUrl} isDefault={isDefault} onError={handleModelError} />
          )}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            autoRotateSpeed={0.5}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI}
            minPolarAngle={0}
          />

          <Environment preset="studio" />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        </React.Suspense>
      </Canvas>
    </div>
  )
}
