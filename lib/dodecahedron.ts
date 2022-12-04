import { Vector3 } from "three"
import { WireFrame } from "./wireframe"

export class Dodecahedron extends WireFrame {
  constructor(private rad: number, private center: Vector3) {
    const phi = 1.618
    const invPhi = 1 / phi

    const points = [
      //
      // (±1, ±1, ±1) // box corners

      new Vector3(1, -1, -1),
      new Vector3(1, 1, -1),
      new Vector3(1, -1, 1),
      new Vector3(1, 1, 1),
      new Vector3(-1, -1, -1),
      new Vector3(-1, 1, -1),
      new Vector3(-1, -1, 1),
      new Vector3(-1, 1, 1),

      // (0, ±phi, ±invPhi) top/bot horz edges
      new Vector3(0, -phi, -invPhi), // 8
      new Vector3(0, -phi, invPhi),
      new Vector3(0, phi, -invPhi),
      new Vector3(0, phi, invPhi),

      // (±invPhi, 0, ±phi) // horz side edges
      new Vector3(-invPhi, 0, -phi), // 12
      new Vector3(invPhi, 0, -phi),
      new Vector3(-invPhi, 0, phi),
      new Vector3(invPhi, 0, phi),

      // (±phi, ±invPhi, 0) // vert side egdhes
      new Vector3(-phi, -invPhi, 0), //16
      new Vector3(-phi, invPhi, 0),
      new Vector3(phi, -invPhi, 0),
      new Vector3(phi, invPhi, 0),
    ]

    const conns: [number, number][] = [
      //
      [8, 9],
      [10, 11],
      //
      [12, 13],
      [14, 15],
      //
      [16, 17],
      [18, 19],
      ///
      [8, 0],
      [8, 4],
      [9, 2],
      [9, 6],
      //
      [10, 1],
      [10, 5],
      [11, 3],
      [11, 7],
      ///
      [12, 4],
      [12, 5],
      [13, 0],
      [13, 1],
      //
      [14, 6],
      [14, 7],
      [15, 2],
      [15, 3],
      ///
      [16, 6],
      [16, 4],
      [17, 5],
      [17, 7],
      [18, 0],
      [18, 2],
      [19, 1],
      [19, 3],
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
