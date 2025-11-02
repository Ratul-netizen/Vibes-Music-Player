/**
 * Extract dominant color from an image using Canvas API
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        
        if (!ctx) {
          resolve("#9333ea") // Fallback purple
          return
        }
        
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Calculate average color
        let r = 0
        let g = 0
        let b = 0
        let count = 0
        
        // Sample pixels (every 10th pixel for performance)
        for (let i = 0; i < data.length; i += 40) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
        
        r = Math.floor(r / count)
        g = Math.floor(g / count)
        b = Math.floor(b / count)
        
        // Convert to hex
        const hex = `#${[r, g, b].map(x => {
          const hex = x.toString(16)
          return hex.length === 1 ? "0" + hex : hex
        }).join("")}`
        
        resolve(hex)
      } catch (error) {
        resolve("#9333ea") // Fallback purple
      }
    }
    
    img.onerror = () => {
      resolve("#9333ea") // Fallback purple
    }
    
    img.src = imageUrl
  })
}



