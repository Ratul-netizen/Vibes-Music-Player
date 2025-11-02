import { describe, it, expect } from "@jest/globals"
import { cn } from "@/lib/utils"

describe("Utility Functions", () => {
  describe("cn() - Class Name Merge", () => {
    it("should merge class names correctly", () => {
      const result = cn("px-2", "px-4")
      expect(result).toContain("px-4")
    })

    it("should handle conditional classes", () => {
      const result = cn("base", false && "conditional", "other")
      expect(result).toContain("base")
      expect(result).toContain("other")
    })

    it("should handle undefined and null values", () => {
      const result = cn("px-2", undefined, null, "py-2")
      expect(result).toContain("px-2")
      expect(result).toContain("py-2")
    })

    it("should merge Tailwind conflicts with later value", () => {
      const result = cn("text-red-500 text-blue-500")
      expect(result).toContain("text-blue-500")
    })
  })
})
