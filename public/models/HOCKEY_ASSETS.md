# Hockey-specific 3D asset integration

The experimental imported player preview now loads a **real goalie leg-pad GLB** from [3DAssets.dev](https://3dassets.dev/assets/ice-hockey-arena-and-locker-room-goalie-pads-c713e1bd) at `https://cdn.3dassets.dev/assets/33719/v1/model.glb`.

The asset page lists CC0 1.0 Universal, 1,824 triangles, 0.72 × 0.95 × 0.23 metres, no animations, and a stable CORS-enabled CDN. No attribution required. The file is **loaded from the CDN at runtime** and is not committed to the repository. If loading fails, the prototype pads remain.

## Known limitations

- `player.glb` is still the generic Cesium Man character. This does not yet replace the astronaut.
- These are **static leg pads**, not skinned to the player rig; no independent leg motion or attachment to leg bones.
- Size and offsets are provisional and need iPhone visual QA. Other equipment remains simplified geometry.
- CDN availability is required for the real pads to appear.
