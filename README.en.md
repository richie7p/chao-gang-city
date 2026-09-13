# Chao Gang City · 潮港都市

[繁體中文](README.md) | **English**

**[Live Demo / 線上展示](https://zippy-delta-forge-sand.grok.me/)**

A 3D open-world urban sandbox in your browser.

Walk around, find a car, drive, take on missions, and escape police cars as your wanted level rises. The game interface is in Traditional Chinese, and no account is required.

[![License: MIT](https://img.shields.io/badge/License-MIT-5ec2b8.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-000000.svg)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA.svg)](https://react.dev/)

<p align="center">
  <img src="screenshots/menu.png" alt="Chao Gang City menu: the bay and Central Avenue at dusk" width="880" />
</p>

<p align="center">
  <img src="screenshots/playing.png" alt="Third-person driving view" width="430" />
  <img src="screenshots/wanted.png" alt="Police pursuit and HUD" width="430" />
</p>

## Features

- **Third-person sandbox:** WASD walking and driving, mouse camera, Space to jump or handbrake, `E` to interact, `F` to talk
- **Vehicles:** acceleration, braking, reversing, steering, handbrake slides, body roll, durability, and speed HUD
- **0–5 wanted stars:** serious crashes or hitting pedestrians attract police; gain distance and hide to clear your wanted level
- **Citizen NPCs:** names, occupations, personalities, and modular scripted dialogue, with an extension point for an LLM
- **Three missions:** First Steps in the City → Midnight Passenger → Escape to Freedom
- **Original map:** Central Avenue, Bay District, Xinsheng Park, East City Commercial District, West Harbor Industrial District, Central Station, and South City Police Station
- **Dusk streetscape:** textured building facades, roads, grass, and sky; vehicles and pedestrians built from geometry

> An original urban sandbox with independently designed maps, characters, and systems.

## Controls

| Input | On foot | Driving |
| --- | --- | --- |
| `W` `A` `S` `D` | Move | Accelerate / steer / brake and reverse |
| Mouse drag or pointer lock | Rotate camera | Adjust camera; it recenters behind the car on release |
| `Shift` | Run | — |
| Space | Jump | Handbrake |
| `C` | Look back | Look back |
| Scroll wheel | Zoom in / out | Zoom in / out |
| `E` | Enter a vehicle, use shops | Exit vehicle, pick up passengers |
| `F` | Talk to citizens | — |
| `Esc` | Pause | Pause |

Touch devices have a virtual joystick, camera area, and interaction buttons.

## Missions

| Mission | Objective | Reward |
| --- | --- | --- |
| **First Steps in the City (城市初體驗)** | Get a vehicle and drive to Central Station | $1,500 |
| **Midnight Passenger (午夜載客)** | Pick up a passenger at Xinsheng Park and drive to East City Commercial District | $3,200 |
| **Escape to Freedom (逃出生天)** | Escape police and clear a two-star wanted level | $5,000 |

Free exploration remains available after completing the missions.

## Map

- Central Avenue
- Bay District
- Xinsheng Park
- East City Commercial District / East City Convenience Store
- West Harbor Industrial District
- Central Station
- South City Police Station
- Harbor Parking Lot

## Tech stack

| Layer | Technology |
| --- | --- |
| App shell | TanStack Start, React 19, Tailwind CSS v4 |
| 3D engine | Native Three.js with a fixed 1/60 step, without R3F |
| State | Zustand HUD |
| Collision | Custom circle / AABB collision |
| Input | Keyboard, pointer lock, gamepad, touch |

Game logic lives in [`src/game/`](src/game/):

```text
src/game/
  engine.ts      Main loop, camera, wanted level, missions
  city.ts        Districts, roads, buildings, colliders
  meshes.ts      Vehicles, pedestrians, streetlights, and props
  textures.ts    Facade, ground, and sky textures
  input.ts       WASD, handbrake, look back, wheel zoom
  dialogue.ts    Dialogue provider: scripted, replaceable with an LLM
  data.ts        Place names, NPCs, missions, UI strings (zh-TW)
```

## Quick start

Requires **Node.js 22** and npm.

```bash
git clone https://github.com/richie7p/chao-gang-city.git
cd chao-gang-city
npm install
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.

Suggested first session: select **Start Game (開始遊戲)** → press `E` beside the teal sports car on Central Avenue → drive around the city → try handbrake turns and police pursuits.

### Other commands

```bash
npm run typecheck   # TypeScript checks
npm run build       # Production build
npm run preview     # Preview the build
```

No database or sign-in is required to run the project.

## License

MIT License. See [LICENSE](LICENSE).
