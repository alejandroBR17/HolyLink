import type {DBMediaItem} from '../utils';

/** Local revisions describe bytes, never metadata; they are not sent to peers. */
export function mergeMediaRecord(existing:DBMediaItem|undefined,incoming:DBMediaItem,revision:()=>string=()=>crypto.randomUUID()):DBMediaItem {
  return {...existing,...incoming,blob:incoming.blob??existing?.blob,
    localBlobVersion:incoming.blob?revision():existing?.localBlobVersion};
}
