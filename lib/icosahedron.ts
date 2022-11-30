import { Vector3 } from "three"
import { WireFrame } from "./wireframe"

export class Icosahedron extends WireFrame {
  constructor(private rad: number, private center: Vector3) {
    const phi = 1.618

    const points = [
      new Vector3(0, 1, phi),
      new Vector3(0, -1, phi),
      new Vector3(0, 1, -phi),
      new Vector3(0, -1, -phi),
      new Vector3(phi, 0, 1),
      new Vector3(phi, 0, -1),
      new Vector3(-phi, 0, 1),
      new Vector3(-phi, 0, -1),
      new Vector3(1, phi, 0),
      new Vector3(-1, phi, 0),
      new Vector3(1, -phi, 0),
      new Vector3(-1, -phi, 0),
    ]

    const conns: [number, number][] = [
      [0, 1], //side vert
      [2, 3], //side vert
      [4, 5], //side horz
      [6, 7], //side horz
      [8, 9], //top horz
      [10, 11], //bottom horz
      //
      [0, 4],
      [0, 6],
      [1, 4],
      [1, 6],
      [2, 5],
      [2, 7],
      [3, 5],
      [3, 7],
      //
      [8, 0],
      [8, 2],
      [9, 0],
      [9, 2],
      [8, 4],
      [8, 5],
      [9, 6],
      [9, 7],
      //
      [10, 1],
      [10, 3],
      [11, 1],
      [11, 3],
      [10, 4],
      [10, 5],
      [11, 6],
      [11, 7],
    ]

    super(points, conns)

    this.setCenter(center)
    this.setRad(rad)
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
