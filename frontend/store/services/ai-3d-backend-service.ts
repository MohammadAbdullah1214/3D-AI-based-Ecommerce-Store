export interface GenerationRequest {
  id: string
  user: number
  user_username: string
  product: number
  product_name: string
  status: "queued" | "processing" | "completed" | "failed"
  detail_level: "low" | "medium" | "high"
  progress: number
  stage: string
  message: string
  estimated_time_remaining: string
  created_at: string
  completed_at: string | null
  error_message: string
  generated_model_file: string | null
  polygon_count: number | null
  file_size: number | null
  generation_time: number | null
  images: GenerationImage[]
  progress_logs: GenerationProgress[]
}

export interface GenerationImage {
  id: number
  image: string
  angle: string
  detected_angle: string
  order: number
  created_at: string
}

export interface GenerationProgress {
  stage: string
  progress: number
  message: string
  timestamp: string
}

export interface CreateGenerationRequest {
  product_id: number
  detail_level: "low" | "medium" | "high"
  images: Array<{
    file: File
    detected_angle: string
  }>
}

export interface QueueStatus {
  total_queued: number
  total_processing: number
  user_requests: number
}

export class AI3DBackendService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Get JWT token from localStorage or wherever you store it
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      }
    }

    return {}
  }

  async createGenerationRequest(data: CreateGenerationRequest): Promise<GenerationRequest> {
    const formData = new FormData()

    formData.append("product", data.product_id.toString())
    formData.append("detail_level", data.detail_level)

    // Add images
    data.images.forEach((image) => {
      formData.append("images", image.file)
      formData.append("detected_angles", image.detected_angle)
    })

    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to create generation request")
    }

    return await response.json()
  }

  async getGenerationRequest(id: string): Promise<GenerationRequest> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/${id}/`, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch generation request")
    }

    return await response.json()
  }

  async getGenerationStatus(id: string): Promise<GenerationRequest> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/${id}/status/`, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch generation status")
    }

    return await response.json()
  }

  async cancelGenerationRequest(id: string): Promise<{ message: string }> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/${id}/cancel/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to cancel generation request")
    }

    return await response.json()
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/queue_status/`, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch queue status")
    }

    return await response.json()
  }

  async getUserGenerationRequests(): Promise<GenerationRequest[]> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/`, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch generation requests")
    }

    const data = await response.json()
    return data.results || data
  }

  // Polling method for progress updates
  async pollProgress(requestId: string, onProgress: (request: GenerationRequest) => void, intervalMs = 2000) {
    const poll = async () => {
      try {
        const request = await this.getGenerationStatus(requestId)
        onProgress(request)

        // Continue polling if not completed
        if (request.status === "queued" || request.status === "processing") {
          setTimeout(poll, intervalMs)
        }
      } catch (error) {
        console.error("Error polling progress:", error)
        // Retry after a longer interval
        setTimeout(poll, intervalMs * 2)
      }
    }

    poll()
  }

  async downloadGeneratedModel(modelUrl: string): Promise<Blob> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(modelUrl, {
      headers,
    })

    if (!response.ok) {
      throw new Error("Failed to download generated model")
    }

    return await response.blob()
  }

  async getProgress(requestId: string): Promise<{
    progress_percentage: number
    current_stage: string
    status: "queued" | "processing" | "completed" | "failed"
    error_message?: string
    result_file_url?: string
  }> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/${requestId}/progress/`, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch generation progress")
    }

    return await response.json()
  }

  async cancelRequest(requestId: string): Promise<{ message: string }> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/ai-3d-generation/requests/${requestId}/cancel/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to cancel generation request")
    }

    return await response.json()
  }
}

export const ai3dService = new AI3DBackendService()
