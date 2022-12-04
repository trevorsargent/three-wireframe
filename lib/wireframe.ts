import { Observable, ReplaySubject, Subject } from "rxjs"
import { Vector3 } from "three"

export interface IWireFrame {
  readonly points: Vector3[]
  readonly connections: [number, number][]
}

export class WireFrame extends ReplaySubject<IWireFrame> implements IWireFrame {
  readonly points: Vector3[]
  readonly connections: [number, number][]

  constructor(points: Vector3[], connections: [number, number][]) {
    super()
    const safeCon = connections.filter(
      (x) => x[0] < points.length && x[1] < points.length
    )

    if (safeCon.length != connections.length) {
      console.warn("some connections ignored due to invalid indeces")
    }

    this.points = points
    this.connections = safeCon
  }
}
