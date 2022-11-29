import { Vector3 } from "three"
import { WireFrame } from "./wireframe"

export class Cube extends WireFrame {
  constructor(private rad: number, private center: Vector3) {
    const vecs = [
      new Vector3(-1, -1, -1),
      new Vector3(-1, 1, -1),
      new Vector3(1, 1, -1),
      new Vector3(1, -1, -1),
      new Vector3(-1, -1, 1),
      new Vector3(-1, 1, 1),
      new Vector3(1, 1, 1),
      new Vector3(1, -1, 1),
    ]

    const cons: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ]

    super(vecs, cons)
    this.update()
  }

  setCenter(center: Vector3) {
    this.center = center
    this.update()
  }

  setRad(rad: number) {
    this.rad = rad
    this.update()
  }

  update() {
    this.points.forEach((v) =>
      v
        .normalize()
        .multiplyScalar(Math.sqrt(3))
        .multiplyScalar(this.rad)
        .add(this.center)
    )

    this.next(this)
  }
}
