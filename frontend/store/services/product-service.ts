const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

export async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/products/`)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching products:", error)
    throw error
  }
}

export async function fetchCategories() {
  try {
    const response = await fetch(`${API_URL}/products/categories/`)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw error
  }
}

export async function fetchProductById(id: number) {
  try {
    const response = await fetch(`${API_URL}/products/${id}/`)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error)
    throw error
  }
}
