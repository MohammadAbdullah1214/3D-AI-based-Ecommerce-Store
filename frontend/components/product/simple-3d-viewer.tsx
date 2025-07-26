"use client"

import { useRef, useEffect, useState, Suspense, useMemo } from "react"
import { createPortal } from "react-dom"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Maximize2, RotateCw, Minimize2 } from "lucide-react"
import * as THREE from "three"

interface Simple3DViewerProps {
  modelUrl?: string
  isDefault: boolean
  productName: string
  width?: number
  height?: number
  className?: string
  showControls?: boolean
  showARButton?: boolean
}

// Full 360-degree orbit controls with centered positioning
function Full360OrbitControls() {
  const { camera, gl } = useThree()
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [spherical, setSpherical] = useState({
    radius: 5,
    phi: Math.PI / 2, // Vertical angle (0 to PI)
    theta: 0, // Horizontal angle (0 to 2*PI)
  })
  const [autoRotate, setAutoRotate] = useState(false)
  // Centered target position
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (!gl?.domElement || !camera) return

    const handleMouseDown = (event: MouseEvent) => {
      setIsMouseDown(true)
      setMousePos({ x: event.clientX, y: event.clientY })
      setAutoRotate(false)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return

      const deltaX = event.clientX - mousePos.x
      const deltaY = event.clientY - mousePos.y

      setSpherical((prev) => ({
        ...prev,
        theta: prev.theta - deltaX * 0.01,
        phi: Math.max(0.1, Math.min(Math.PI - 0.1, prev.phi + deltaY * 0.01)),
      }))

      setMousePos({ x: event.clientX, y: event.clientY })
    }

    const handleMouseUp = () => {
      setIsMouseDown(false)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      setSpherical((prev) => ({
        ...prev,
        radius: Math.max(1, Math.min(20, prev.radius + event.deltaY * 0.01)),
      }))
    }

    const handleDoubleClick = () => {
      setAutoRotate((prev) => !prev)
    }

    const canvas = gl.domElement
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    canvas.addEventListener("dblclick", handleDoubleClick)

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("dblclick", handleDoubleClick)
    }
  }, [gl, camera, isMouseDown, mousePos])

  useFrame((state) => {
    if (camera) {
      // Auto-rotation
      if (autoRotate) {
        setSpherical((prev) => ({
          ...prev,
          theta: prev.theta + 0.01,
        }))
      }

      // Convert spherical coordinates to Cartesian
      const target = targetRef.current
      const x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      const y = target.y + spherical.radius * Math.cos(spherical.phi)
      const z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)

      // Smooth camera movement
      camera.position.lerp(new THREE.Vector3(x, y, z), 0.1)
      camera.lookAt(target)
    }
  })

  // Expose controls for external use
  useEffect(() => {
    ;(window as any).cameraControls = {
      setAutoRotate,
      resetCamera: () => {
        setSpherical({
          radius: 5,
          phi: Math.PI / 2,
          theta: 0,
        })
        setAutoRotate(false)
      },
      rotateToAngle: (angle: number) => {
        setSpherical((prev) => ({
          ...prev,
          theta: angle,
        }))
      },
    }
  }, [])

  return null
}

function Model({ url, isDefault }: { url: string; isDefault: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const [error, setError] = useState(false)
  const [gltf, setGltf] = useState<GLTF | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Enhanced URL validation
    if (!url || typeof url !== "string" || url.trim() === "" || url === "undefined" || url === "null") {
      console.warn("Invalid or missing model URL provided:", url)
      setError(true)
      setLoading(false)
      return
    }

    // Additional check for valid URL format
    try {
      new URL(url)
    } catch (urlError) {
      // If it's not a valid absolute URL, check if it's a valid relative path
      if (!url.startsWith("/") && !url.startsWith("./")) {
        console.warn("Invalid URL format:", url)
        setError(true)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(false)

    // Load GLB/GLTF model
    const loader = new GLTFLoader()
    loader.load(
      url,
      (loadedGltf) => {
        try {
          // Clone the scene to avoid issues with multiple instances
          const scene = loadedGltf.scene.clone()

          // Calculate bounding box for proper centering
          const box = new THREE.Box3().setFromObject(scene)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          // Center the model
          scene.position.set(-center.x, -center.y, -center.z)

          // Scale to fit nicely in view
          const maxDim = Math.max(size.x, size.y, size.z)
          if (maxDim > 0) {
            const scale = 2.5 / maxDim
            scene.scale.setScalar(scale)
          }

          // Ensure all materials are visible
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
              child.receiveShadow = true
              if (child.material) {
                child.material.needsUpdate = true
              }
            }
          })

          setGltf({ ...loadedGltf, scene })
          setLoading(false)
        } catch (err) {
          console.error("Error processing GLTF:", err)
          setError(true)
          setLoading(false)
        }
      },
      (progress) => {
        const percent = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0
        console.log("GLTF Loading progress:", percent + "%")
      },
      (err) => {
        console.error("Failed to load GLTF:", err)
        setError(true)
        setLoading(false)
      },
    )
    // Log the model URL for debugging
    console.log('Loading 3D model from URL:', url)
  }, [url])

  // Manual rotation for default models
  useFrame((state) => {
    if (groupRef.current && isDefault) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  if (loading) {
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#cccccc" wireframe />
        </mesh>
      </group>
    )
  }

  if (error || !gltf) {
    return <FallbackModel isDefault={isDefault} />
  }

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {gltf && <primitive object={gltf.scene} />}
    </group>
  )
}

function FallbackModel({ isDefault }: { isDefault: boolean }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current && isDefault) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Simple shirt shape - centered */}
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
    </group>
  )
}

function Scene({ modelUrl, isDefault }: { modelUrl: string; isDefault: boolean }) {
  return (
    <>
      <Suspense fallback={<FallbackModel isDefault={false} />}>
        <Model url={modelUrl} isDefault={isDefault} />
      </Suspense>
      {/* Enhanced lighting for 360-degree viewing */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.6} />
      <directionalLight position={[0, -10, 0]} intensity={0.4} />
      <pointLight position={[5, 0, 5]} intensity={0.5} />
      <pointLight position={[-5, 0, -5]} intensity={0.5} />
      <Full360OrbitControls />
    </>
  )
}

export default function Simple3DViewer({
  modelUrl,
  isDefault = false,
  productName = "Product",
  width,
  height,
  className = "",
  showControls = true,
  showARButton = false,
}: Simple3DViewerProps) {
  // Enhanced URL validation and fallback
  const validModelUrl = useMemo(() => {
    if (
      !modelUrl ||
      typeof modelUrl !== "string" ||
      modelUrl.trim() === "" ||
      modelUrl === "undefined" ||
      modelUrl === "null"
    ) {
      return "/assets/3d/realistic_yellow_polo_shirt.glb"
    }
    return modelUrl.trim()
  }, [modelUrl])

  const [mounted, setMounted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [key, setKey] = useState(0)
  const [autoRotate, setAutoRotate] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentView, setCurrentView] = useState<"front" | "left" | "right" | "back">("front")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Enhanced fullscreen effect with body scroll management
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        document.body.classList.remove('fullscreen-active');
      }
    }

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.classList.add('fullscreen-active');
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (isFullscreen) {
        document.body.classList.remove('fullscreen-active');
      }
    }
  }, [isFullscreen])

  const handleReset = () => {
    if ((window as any).cameraControls) {
      ;(window as any).cameraControls.resetCamera()
    }
    setAutoRotate(false)
  }

  const toggleAutoRotate = () => {
    const newAutoRotate = !autoRotate
    setAutoRotate(newAutoRotate)
    if ((window as any).cameraControls) {
      ;(window as any).cameraControls.setAutoRotate(newAutoRotate)
    }
  }

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    // Prevent body scroll when fullscreen is active
    if (newFullscreenState) {
      document.body.classList.add('fullscreen-active');
    } else {
      document.body.classList.remove('fullscreen-active');
    }
  }

  const rotateToFront = () => {
    if ((window as any).cameraControls) {
      ;(window as any).cameraControls.rotateToAngle(0)
    }
    setCurrentView("front")
  }

  const rotateToBack = () => {
    if ((window as any).cameraControls) {
      ;(window as any).cameraControls.rotateToAngle(Math.PI)
    }
    setCurrentView("back")
  }

  const rotateToSide = () => {
    if ((window as any).cameraControls) {
      ;(window as any).cameraControls.rotateToAngle(Math.PI / 2)
    }
    setCurrentView("left")
  }

  const rotateToRight = () => {
    if ((window as any).cameraControls) {
      ;(window as any).cameraControls.rotateToAngle(-Math.PI / 2)
    }
    setCurrentView("right")
  }

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{
          width: width || "100%",
          height: height || "100%",
          minHeight: "200px",
        }}
      >
        <div className="text-center">
          <div className="animate-pulse bg-gray-300 w-16 h-16 rounded-lg mx-auto mb-2"></div>
          <div className="text-sm text-gray-600 dark:text-gray-200">Loading 3D Viewer...</div>
        </div>
      </div>
    )
  }

  const viewerContent = (
    <div
      className="relative w-full h-full flex items-center justify-center"
      ref={containerRef}
      style={{
        minHeight: isFullscreen ? "100vh" : "200px",
        aspectRatio: isFullscreen ? "auto" : "1/1",
      }}
    >
      <Canvas
        key={key}
        camera={{
          position: [0, 0, 5],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        className="w-full h-full block"
        style={{ display: "block", width: "100%", height: "100%" }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
        dpr={[1, 2]}
      >
        <Scene modelUrl={validModelUrl} isDefault={isDefault} />
      </Canvas>

      {/* Enhanced Controls - Responsive positioning */}
      {showControls && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-2 z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg w-8 h-8 sm:w-auto sm:h-auto p-1 sm:p-2"
            title="Reset Camera"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-300 group-hover:text-primary" />
          </Button>
          <Button
            size="sm"
            variant={autoRotate ? "default" : "outline"}
            onClick={toggleAutoRotate}
            className={`bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg w-8 h-8 sm:w-auto sm:h-auto p-1 sm:p-2 ${autoRotate ? "ring-2 ring-primary" : ""}`}
            title="Toggle Auto-Rotate"
          >
            <RotateCw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${autoRotate ? "text-primary" : "text-gray-500 dark:text-gray-300 group-hover:text-primary"}`}
            />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg w-8 h-8 sm:w-auto sm:h-auto p-1 sm:p-2"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            ) : (
              <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-300 group-hover:text-primary" />
            )}
          </Button>
        </div>
      )}

      {/* Quick View Buttons - Responsive */}
      {showControls && (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex gap-1 sm:gap-2 z-10">
          <Button
            size="sm"
            onClick={rotateToFront}
            className={`text-xs shadow-lg transition-colors duration-150 px-2 py-1 sm:px-3 sm:py-2 ${currentView === "front" ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" : "bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-primary/80 dark:hover:bg-primary/60 hover:text-primary-foreground"}`}
            title="Front View"
          >
            Front
          </Button>
          <Button
            size="sm"
            onClick={rotateToSide}
            className={`text-xs shadow-lg transition-colors duration-150 px-2 py-1 sm:px-3 sm:py-2 ${currentView === "left" ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" : "bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-primary/80 dark:hover:bg-primary/60 hover:text-primary-foreground"}`}
            title="Left View"
          >
            Side
          </Button>
          <Button
            size="sm"
            onClick={rotateToRight}
            className={`text-xs shadow-lg transition-colors duration-150 px-2 py-1 sm:px-3 sm:py-2 ${currentView === "right" ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" : "bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-primary/80 dark:hover:bg-primary/60 hover:text-primary-foreground"}`}
            title="Right View"
          >
            Right
          </Button>
          <Button
            size="sm"
            onClick={rotateToBack}
            className={`text-xs shadow-lg transition-colors duration-150 px-2 py-1 sm:px-3 sm:py-2 ${currentView === "back" ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" : "bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-primary/80 dark:hover:bg-primary/60 hover:text-primary-foreground"}`}
            title="Back View"
          >
            Back
          </Button>
        </div>
      )}

      {/* Instructions - Responsive positioning and sizing */}
      {showControls && !isFullscreen && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
          <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-xs text-gray-600 dark:text-gray-100 shadow-lg max-w-[150px] sm:max-w-none">
            <div className="hidden sm:block">🖱️ Drag for 360° rotation</div>
            <div className="hidden sm:block">🔄 Scroll to zoom</div>
            <div className="hidden sm:block">👆 Double-click for auto-rotate</div>
            <div className="sm:hidden">Drag & scroll to explore</div>
          </div>
        </div>
      )}

      {/* Status Badge - Responsive */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10">
        <Badge className="bg-primary/90 dark:bg-primary/80 text-primary-foreground shadow-lg text-xs">
          {isDefault && productName === "Product" ? "Default Model" : productName}
          {autoRotate && " • Auto-rotating"}
        </Badge>
      </div>
    </div>
  )

  // Simple modal-style fullscreen that doesn't break anything
  if (isFullscreen) {
    return createPortal(
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsFullscreen(false)
          }
        }}
      >
        <div className="w-full h-full max-w-none max-h-none p-4 relative">
          {viewerContent}
          {/* Close button for fullscreen */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg z-10"
            title="Exit Fullscreen (ESC)"
          >
            <Minimize2 className="w-4 h-4 text-gray-700" />
          </Button>
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <div
      className={`relative w-full ${className}`}
      style={{
        width: width || "100%",
        height: height || "auto",
        minHeight: "200px",
        aspectRatio: width && height ? `${width}/${height}` : "1/1",
      }}
    >
      <div className="absolute inset-0">{viewerContent}</div>
    </div>
  )
}
