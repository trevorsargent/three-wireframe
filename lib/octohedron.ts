import { Vector3 } from "three"
import { WireFrame } from "./wireframe"

export class Octohedron extends WireFrame {
  constructor(private rad: number, private center: Vector3) {
    const vecs = [
      new Vector3(0, -1, 0),
      new Vector3(-1, 0, 0),
      new Vector3(0, 0, -1),
      new Vector3(1, 0, 0),
      new Vector3(0, 0, 1),
      new Vector3(0, 1, 0),
    ]
    const cons: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
      [5, 1],
      [5, 2],
      [5, 3],
      [5, 4],
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
