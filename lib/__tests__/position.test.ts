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

  it("should allow dense insertions without precision loss", () => {
    let a = 1.0
    let b = 2.0
    const chain: number[] = [a, b]
    for (let i = 0; i < 8; i++) {
      const mid = calculatePosition(a, b)
      chain.push(mid)
      b = mid
    }
    // strictly increasing
    const sorted = [...chain].sort((x, y) => x - y)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]).toBeGreaterThan(sorted[i - 1])
    }
  })

  it("should return 1.0 when both neighbors are missing", () => {
    expect(calculatePosition(null, null)).toBe(1.0)
  })

  it("should place before the first element when only next exists", () => {
    expect(calculatePosition(null, 5.0)).toBe(4.0)
  })

  it("should place after the last element when only prev exists", () => {
    expect(calculatePosition(10.0, null)).toBe(11.0)
  })
})
