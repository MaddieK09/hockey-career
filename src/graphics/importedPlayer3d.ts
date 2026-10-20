import type {PlayerAppearance} from '../player/appearance';
import type {Equipment} from '../player/equipment';
import type {Position} from '../player/types';
import {mountPlayer3D} from './player3d';

/**
 * The bundled Three.js hockey model is the default creator preview.
 * No HEAD request for an absent GLB, no cross-origin goalie pads, and no
 * external asset licensing or availability dependency.
 * A future properly licensed and rigged GLB can be integrated separately.
 */
export function mountImportedPlayer3D(host:HTMLElement,p:PlayerAppearance,e:Equipment,position:Position){
 return mountPlayer3D(host,p,e,position);
}
