import { combineLatest, Subject, Subscription } from "rxjs"
import {
  BufferGeometry,
  Points,
  Line,
  LineBasicMaterial,
  PointsMaterial,
  Scene,
  Vector3,
} from "three"

import { clamp } from "three/src/math/MathUtils"
import { IWireFrame, WireFrame } from "./wireframe"

export class WireFrameRenderer {
  private pointsGeo: BufferGeometry
  private lineGeos: BufferGeometry[]
  private pointsObject: Points
  private lineObjects: Line[]

  private wireframeSub?: Subscription
  private wireframe: WireFrame

  constructor(
    private lineMaterial: LineBasicMaterial,
    pointsMaterial: PointsMaterial,
    private scene: Scene
  ) {
    this.pointsGeo = new BufferGeometry()

    this.pointsObject = new Points(this.pointsGeo, pointsMaterial)

    scene.add(this.pointsObject)

    this.lineGeos = []

    this.lineObjects = []
  }

  attachWireFrame(frame: WireFrame): WireFrameRenderer {
    this.wireframe = frame
    if (this.wireframeSub) {
      this.wireframeSub.unsubscribe()
    }

    this.setLineGeos(frame)
    this.setPointGeos(frame.points)

    this.wireframeSub = frame.subscribe((update) => {
      this.setLineGeos(update)
      this.setPointGeos(update.points)
    })

    return this
  }

  private setPointGeos(points: IWireFrame["points"]) {
    this.pointsGeo.setFromPoints(points)
  }

  private setLineGeos(
    frame: IWireFrame,
    opts?: {
      geos?: BufferGeometry[]
      lineMaterial?: LineBasicMaterial
      objs?: Line[]
    }
  ) {
    const lineGeos = opts?.geos ?? this.lineGeos
    const lineMat = opts?.lineMaterial ?? this.lineMaterial
    const collection = opts?.objs ?? this.lineObjects

    while (lineGeos.length < frame.connections.length) {
      const geo = new BufferGeometry()
      lineGeos.push(geo)
      const line = new Line(geo, lineMat)
      collection.push()
      this.scene.add(line)
    }

    lineGeos.forEach((geo, index) => {
      geo.setFromPoints([
        frame.points[frame.connections[index][0]],
        frame.points[frame.connections[index][1]],
      ])
    })
  }

  private lerpHandle: Subject<number>

  lerp(frame: WireFrame) {
    if (!this.wireframeSub || !this.wireframe) {
      throw new Error("Cannot Lerp, no current WireFrame")
    }

    const bLineMaterial = new LineBasicMaterial({
      color: this.lineMaterial.color,
      transparent: true,
    })

    const bLineGeos = []

    const bLineObjs = []

    const backwards = this.wireframe.points.length < frame.points.length

    this.lerpHandle = new Subject()

    const lookupMap = backwards
      ? buildPointLookup(frame, this.wireframe)
      : buildPointLookup(this.wireframe, frame)

    this.wireframeSub = combineLatest([
      this.wireframe,
      frame,
      this.lerpHandle,
    ]).subscribe(([frameA, frameB, alpha]) => {
      const larger = backwards ? frameB : frameA
      const smaller = backwards ? frameA : frameB

      this.lineMaterial.needsUpdate = true
      bLineMaterial.needsUpdate = true

      const live = larger.points.map((p) => p.clone())
      const lerpAnchors: [Vector3, Vector3][] = larger.points.map((p, i) => [
        p,
        smaller.points[lookupMap.get(i) ?? 0],
      ])

      const clampAlpha = easeInOutQuint(clamp(alpha, 0, 1))

      const a = backwards ? 1 - clampAlpha : clampAlpha
      this.lineMaterial.setValues({ opacity: 1 - a })
      bLineMaterial.setValues({ opacity: a })

      live.forEach((l, i) =>
        l.lerpVectors(lerpAnchors[i][0], lerpAnchors[i][1], a)
      )

      this.setPointGeos(live)
      this.setLineGeos({
        points: live,
        connections: larger.connections,
      })

      this.setLineGeos(
        {
          points: live,
          connections: smaller.connections.map((con) => [
            lookupMap.get(con[0]) ?? 0,
            lookupMap.get(con[1]) ?? 0,
          ]),
        },
        {
          geos: bLineGeos,
          lineMaterial: bLineMaterial,
          objs: bLineObjs,
        }
      )
    })

    return {
      run: (alpha: number) => {
        this.lerpHandle.next(alpha)
      },
    }
  }
}

const getIndecesSortedByDistance = (point: Vector3, points: Vector3[]) =>
  points
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.distanceTo(point) - b.p.distanceTo(point))
    .map((p) => p.i)

const buildPointLookup = (largeFrame: IWireFrame, smallFrame: IWireFrame) => {
  const lookup = new Map<number, number>()

  largeFrame.points.forEach((point, index) => {
    const sortedIndeces = getIndecesSortedByDistance(point, smallFrame.points)
    const vals = Array.from(lookup.values())
    while (
      vals.includes(sortedIndeces[0]) &&
      vals.length < smallFrame.points.length
    ) {
      sortedIndeces.shift()
    }
    lookup.set(index, sortedIndeces[0])
  })

  return lookup
}

function easeInOutQuint(x: number): number {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2
}