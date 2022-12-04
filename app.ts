import {
  AdditiveBlending,
  CineonToneMapping,
  Clock,
  LineBasicMaterial,
  PerspectiveCamera,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three"

import { Cube } from "./lib/cube"
import { Dodecahedron } from "./lib/dodecahedron"
import { Icosahedron } from "./lib/icosahedron"
import { Octohedron } from "./lib/octohedron"

import { WireFrameRenderer } from "./lib/renderer"

const scene = new Scene()

const renderer = new WebGLRenderer({
  powerPreference: "high-performance",
  precision: "highp",
  antialias: true,
})

const camera = new PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  1,
  500
)

camera.position.set(10, 5, 50)
camera.lookAt(0, 0, 0)
renderer.setSize(window.innerWidth, window.innerHeight)

renderer.toneMapping = CineonToneMapping
renderer.toneMappingExposure = 1.5

document.body.appendChild(renderer.domElement)

window.onresize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

// const lineMaterial = new LineBasicMaterial({ color: 0x909090 })
// const pointMaterial = new PointsMaterial({ size: 1.3, color: 0x00ff00 })
const flexPointsMaterial = new PointsMaterial({ size: 0.5, color: 0xa0a0a0 })
const flexLineMaterial = new LineBasicMaterial({
  color: 0xa0a0a0,
  transparent: true,
  blending: AdditiveBlending,
})

const cube = new Cube(5, new Vector3(0, 0, 0))
const octo = new Octohedron(5, new Vector3(0, 0, 0))
const dodc = new Dodecahedron(5, new Vector3(0, 0, 0))
const icos = new Icosahedron(5, new Vector3())

const flex = new WireFrameRenderer(
  flexLineMaterial,
  flexPointsMaterial,
  scene
).attachWireFrame(dodc)

// const o = new WireFrameRenderer(
//   lineMaterial,
//   pointMaterial,
//   scene
// ).attachWireFrame(cube)

// const c = new WireFrameRenderer(
//   lineMaterial,
//   pointMaterial,
//   scene
// ).attachWireFrame(octo)

const clock = new Clock()
clock.start()

const lerpHandle = flex.lerp(icos)

const tick = () => {
  // cube.setRad(Math.sin(clock.getElapsedTime()) + 10)
  // octo.setRad(Math.sin(clock.getElapsedTime() * 2) + 10)
  // icos.setRad(Math.sin(clock.getElapsedTime() * 2) + 10)
  const lerp = Math.cos(clock.getElapsedTime() * 0.5) * 0.5 + 0.5

  lerpHandle.run(lerp)

  const camX = Math.cos(clock.getElapsedTime() * 0.5) * 50
  const camZ = Math.sin(clock.getElapsedTime() * 0.5) * 50

  camera.position.setX(camX)
  camera.position.setZ(camZ)
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

tick()
