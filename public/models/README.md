# Imported 3D character assets — v0.12.0

The player creator supports an optional `public/models/player.glb` model.

## Candidate asset

- Creator: Quaternius
- Pack: Ultimate Modular Men Pack
- Source: https://quaternius.com/packs/ultimatemodularcharacters.html
- License shown by publisher: CC0 (commercial use allowed)
- Available formats: FBX, OBJ, glTF, Blend
- 11 characters, 24 animations, modular pieces
- **This asset is not yet included in the repository.** Do not represent this version as a completed imported-character upgrade.

## Import checklist

1. Download the original asset from the publisher and retain its license information.
2. Choose a character and export it as a single `player.glb` using Blender, preserving its armature, textures and idle animation.
3. Place it at `public/models/player.glb`. Vite copies it to `/hockey-career/models/player.glb`.
4. Verify the mesh is upright and centered, that the browser loads it without missing textures, and that animations work.
5. Check portrait iPhone rendering, pinch zoom, rotation, and GPU memory use.
6. **Before release**, connect the imported character to appearance options, skater gear and goalie equipment. These are NOT yet implemented for the imported mesh.

## Current limitations

- Imported meshes do not yet respond to height, weight, hair, skin, or equipment selectors.
- The model is shown without hockey equipment.
- If the asset is missing, the existing procedural player preview is used.
- Hockey-specific skating and goaltending animations still need to be developed or retargeted.

## Asset licensing policy

Keep source, license and attribution metadata for each third-party asset. Prefer CC0 or other licenses that explicitly permit redistribution inside a public game repository. Do not commit Mixamo raw source assets.
