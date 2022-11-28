import {
  Clock,
  LineBasicMaterial,
  PerspectiveCamera,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three"

import { WireFrame, WireFrameRenderer } from "./lib/wireframe"

const scene = new Scene()

const renderer = new WebGLRenderer({
  antialias: true,
})

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.onresize = (e) => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

const camera = new PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  500
)

camera.position.set(0, 10, 200)
camera.lookAt(0, 0, 0)

const lineMaterial = new LineBasicMaterial({ color: 0x909090 })
const pointMaterial = new PointsMaterial({ size: 1, color: 0x00ff00 })

const points = [
  new Vector3(-10, 0, 0),
  new Vector3(0, 10, 0),
  new Vector3(10, 0, 0),
  new Vector3(0, 5, 5),
]

class Cube extends WireFrame {
  private baseVecs: Vector3[]
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

    this.baseVecs = vecs

    this.setRad(rad)
  }

  setRad(rad: number) {
    this.rad = rad
    this.setVertices(
      this.baseVecs
        .map((v) =>
          v
            .normalize()
            .multiplyScalar(Math.sqrt(3))
            .multiplyScalar(rad)
            .add(this.center)
        )
        .map((p, i) => ({
          pointIndex: i,
          vector: p,
        }))
    )
  }
}

const cube = new Cube(5, new Vector3(0, 0, 0))

const pyr = new WireFrame(points, [
  [0, 1],
  [1, 2],
  [0, 2],
  [0, 3],
  [1, 3],
  [2, 3],
])

const wire = new WireFrameRenderer(cube, lineMaterial, pointMaterial, scene)

const clock = new Clock()
clock.start()

setTimeout(() => {}, 5000)

const lerp = wire.lerp(pyr)

const tick = () => {
  //   wire.frame.setVertices([
  //     {
  //       pointIndex: 3,
  //       vector: new Vector3(
  //         0,
  //         Math.sin(clock.getElapsedTime() * 0.8) * 5 + 10,
  //         Math.cos(clock.getElapsedTime() * 0.8) * 5 + 10
  //       ),
  //     },
  //     {
  //       pointIndex: 1,
  //       vector: new Vector3(
  //         0,
  //         Math.sin(clock.getElapsedTime() * 0.8 + 3) * 5 + 10,
  //         0
  //       ),
  //     },
  //   ])

  //   cube.setRad(Math.sin(clock.getElapsedTime()) + 3)

  lerp.run(Math.cos(clock.getElapsedTime() * 0.5) * 1 + 0.5)
  const camX = Math.cos(clock.getElapsedTime() * 0.5) * 50
  const camZ = Math.sin(clock.getElapsedTime() * 0.5) * 50
  camera.position.setX(camX)
  camera.position.setZ(camZ)
  camera.lookAt(0, 0, 0)
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

tick()
