import { calculatePosition } from "../position"

describe("Position Calculation", () => {
  it("should calculate middle position", () => {
    const result = calculatePosition(1.0, 2.0)
    expect(result).toBe(1.5)
  })

  it("should handle first position", () => {
    const result = calculatePosition(null, 1.0)
    expect(result).toBe(0)
  })

  it("should handle last position", () => {
    const result = calculatePosition(3.0, null)
    expect(result).toBe(4.0)
  })

  it("should handle empty playlist", () => {
    const result = calculatePosition(null, null)
    expect(result).toBe(1.0)
  })

  it("should handle fractional positions", () => {
    const result = calculatePosition(1.25, 1.5)
    expect(result).toBe(1.375)
  })

  it("should maintain order after multiple insertions", () => {
    const pos1 = calculatePosition(null, null) // 1.0
    const pos2 = calculatePosition(pos1, null) // 2.0
    const pos3 = calculatePosition(pos1, pos2) // 1.5
    const pos4 = calculatePosition(pos1, pos3) // 1.25

    const positions = [pos1, pos2, pos3, pos4].sort((a, b) => a - b)
    expect(positions).toEqual([1.0, 1.25, 1.5, 2.0])
  })
})
