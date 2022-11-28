import {
  BufferGeometry,
  Points,
  Line,
  Vector3,
  LineBasicMaterial,
  PointsMaterial,
  Scene,
} from "three"
import { clamp } from "three/src/math/MathUtils"

export class WireFrameRenderer {
  private pointsGeo: BufferGeometry
  private lineGeos: BufferGeometry[]
  private pointsObject: Points
  private lineObjects: Line[]

  constructor(
    readonly frame: WireFrame,
    private lineMaterial: LineBasicMaterial,
    private pointsMaterial: PointsMaterial,
    private scene: Scene
  ) {
    this.pointsGeo = new BufferGeometry()
    this.setGeo()

    this.frame.subscribe((update) => {
      this.pointsGeo.setFromPoints(this.frame.points)

      this.frame.connections.forEach((con, index) => {
        update.forEach((update) => {
          if (con[0] == update.pointIndex || con[1] == update.pointIndex) {
            this.lineGeos[index].setFromPoints([
              this.frame.points[con[0]],
              this.frame.points[con[1]],
            ])
          }
        })
      })
    })
  }

  private setGeo() {
    this.pointsGeo.setFromPoints(this.frame.points)

    this.pointsObject = new Points()

    this.lineGeos = this.frame.connections.map((con) => {
      return new BufferGeometry().setFromPoints([
        this.frame.points[con[0]],
        this.frame.points[con[1]],
      ])
    })

    this.pointsObject = new Points(this.pointsGeo, this.pointsMaterial)

    this.lineObjects = this.lineGeos.map((geo) => {
      return new Line(geo, this.lineMaterial)
    })

    this.scene.add(this.pointsObject, ...this.lineObjects)
  }

  lerp(frame: WireFrame) {
    const findClosestPoint = (point: Vector3, points: Vector3[]) =>
      points.reduce((closest, current) => {
        if (point.distanceTo(current) < point.distanceTo(closest)) {
          return current
        }
        return closest
      }, points[0])

    const larger = frame.points > this.frame.points ? frame : this.frame
    const smaller = frame.points > this.frame.points ? this.frame : frame
    const lerpCons = larger.connections

    while (this.lineGeos.length < lerpCons.length) {
      const geo = new BufferGeometry()
      this.lineGeos.push(geo)

      this.lineObjects.push(new Line(geo, this.lineMaterial))
    }

    const live = larger.points.map((p) => p.clone())
    const lerpAnchors: [Vector3, Vector3][] = larger.points.map((p) => [
      p,
      findClosestPoint(p, smaller.points),
    ])

    return {
      run: (alpha: number) => {
        const clampAlpha = clamp(alpha, 0, 1)

        const a = frame.points > this.frame.points ? clampAlpha : 1 - clampAlpha

        live.forEach((l, i) =>
          l.lerpVectors(lerpAnchors[i][0], lerpAnchors[i][1], a)
        )
        this.pointsGeo.setFromPoints(live)
        this.lineGeos.forEach((line, index) => {
          const pointa = live[lerpCons[index][0]]
          const pointb = live[lerpCons[index][1]]
          line.setFromPoints([pointa, pointb])
        })
      },
    }
  }
}

interface VertextUpdate {
  pointIndex: number
  vector: Vector3
}

export class WireFrame {
  readonly points: Vector3[]
  readonly connections: [number, number][]

  private subscribers: Set<
    (update: { pointIndex: number; vector: Vector3 }[]) => void
  >

  constructor(points: Vector3[], connections: [number, number][]) {
    this.subscribers = new Set()
    const safeCon = connections.filter(
      (x) => x[0] < points.length && x[1] < points.length
    )

    if (safeCon.length != connections.length) {
      console.warn("some connections ignored due to invalid indeces")
    }

    this.points = points
    this.connections = safeCon
  }

  setVertices(updates: VertextUpdate[]) {
    const safeUpdates = updates.filter((u) => u.pointIndex < this.points.length)

    if (safeUpdates.length !== this.points.length) {
      console.warn("some updates ignored: nvalid index")
    }

    safeUpdates.forEach((u) => {
      this.points[u.pointIndex].set(u.vector.x, u.vector.y, u.vector.z)
    })

    this.subscribers.forEach((u) =>
      u(
        safeUpdates.map((update) => ({
          pointIndex: update.pointIndex,
          vector: this.points[update.pointIndex],
        }))
      )
    )
  }

  subscribe(onUpdate: (updates: VertextUpdate[]) => void): () => void {
    this.subscribers.add(onUpdate)
    return () => {
      this.subscribers.delete(onUpdate)
    }
  }
}
