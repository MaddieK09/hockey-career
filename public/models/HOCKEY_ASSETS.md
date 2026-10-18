# Hockey-specific 3D asset integration

The imported player preview can now optionally load `public/models/goalie-pads.glb`. If the file is absent, the prototype goalie pads remain visible.

A potential CC0 source to evaluate is [Ice Hockey Arena and Locker Room](https://3dassets.dev/packs/ice-hockey-arena-and-locker-room) on 3Dassets.dev. **No model from this pack has been downloaded or committed.** Verify each individual asset's license and geometry before importing.

## Known limitations

- The current `player.glb` is still the Cesium Man test character, not a hockey-specific human.
- The optional pads loader assumes the pads mesh is preassembled and aligned in local coordinates; it is not bone-rigged, so leg movements will not deform it.
- The preview remains experimental, and final scale/offset require testing on iPhone.
- The equipment overlay uses basic shapes. This is an integration hook, not a realistic goalie render.

## To install

Place a licensed, optimized GLB at `public/models/goalie-pads.glb`. Keep source/license attribution in `public/models/ASSET_LICENSE.md`. The game automatically attempts to load the file; no source-code change is needed.
