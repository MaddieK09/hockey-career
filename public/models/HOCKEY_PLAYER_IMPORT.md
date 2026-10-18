# Hockey player preview asset policy

`public/models/player.glb` is a generic Cesium Man demonstration character and is **no longer loaded by default**.

The player creator now checks for `public/models/hockey-player.glb`. If it is absent, it uses the existing fully equipped procedural skater/goalie preview, which supports appearance and equipment selections. This avoids showing the astronaut with disconnected overlay pieces.

To enable imported mode, add a licensed, upright, rigged hockey-player GLB named `hockey-player.glb` to this directory, then test fit and animations on mobile. The imported overlay and optional CDN goalie pads remain experimental. Do not rename a generic test model to `hockey-player.glb`.

This change is a temporary quality safeguard, not a completed realistic player asset.
