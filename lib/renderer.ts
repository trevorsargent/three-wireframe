import { combineLatest, Subject, Subscription, tap } from "rxjs"
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

    const bLineMaterial = this.lineMaterial.clone()
    const bLineGeos = []

    const bLineObjs = []

    const backwards = this.wireframe.points.length < frame.points.length

    this.lerpHandle = new Subject()

    const lookupMap = backwards
      ? buildIndexLookup(frame, this.wireframe)
      : buildIndexLookup(this.wireframe, frame)

    this.wireframeSub.unsubscribe()

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
      const lookup = lookupMap.largeToSmall
      const lerpAnchors: [Vector3, Vector3][] = larger.points.map((p, i) => [
        p,
        smaller.points[lookup.get(i)!],
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

      // set temp stuff (smaller)
      const reverseLookup = lookupMap.smallToLarge

      this.setLineGeos(
        {
          points: live, // points in the order of larger
          connections: smaller.connections.map((con) => [
            reverseLookup.get(con[0])!,
            reverseLookup.get(con[1])!,
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

const getIndecesSortedByDistance = (
  point: Vector3,
  startIndex: number,
  points: Vector3[]
): PointRelationship[] => {
  return points
    .map((p, i) => ({
      distance: p.distanceTo(point) + Math.random() * 0.001,
      endIndex: i,
      startIndex,
    }))
    .sort((a, b) => a.distance - b.distance)
}

interface PointRelationship {
  distance: number
  endIndex: number
  startIndex: number
}

const indexOfLongestSubArray = (arr: any[][]) =>
  arr.reduce(
    (maxIndex, subArray, curIndex) =>
      subArray.length > arr[maxIndex].length ? curIndex : maxIndex,
    0
  )

const buildIndexLookup = (largeFrame: IWireFrame, smallFrame: IWireFrame) => {
  const lookup = new Map<number, number>()
  const reverse = new Map<number, number>()

  const connect = (largeIndex: number, smallIndex: number) => {
    lookup.set(largeIndex, smallIndex)
    reverse.set(smallIndex, largeIndex)
  }

  const closestLargeBySmallIndex = smallFrame.points
    .map((point, idx) =>
      getIndecesSortedByDistance(point, idx, largeFrame.points)
    )
    .sort((a, b) => b[0].distance - a[0].distance)

  const available = new Set(
    new Array(largeFrame.points.length).fill(null).map((_, i) => i)
  )

  console.log(closestLargeBySmallIndex)

  let r = 0

  while (available.size > 0) {
    const next = closestLargeBySmallIndex[r].find((rel) =>
      available.has(rel.endIndex)
    )

    if (!next) {
      continue
    }

    connect(next.endIndex, next.startIndex)
    available.delete(next.endIndex)

    r = (r + 1) % closestLargeBySmallIndex.length
  }

  return {
    largeToSmall: lookup,
    smallToLarge: reverse,
  }
}

function easeInOutQuint(x: number): number {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2
}
