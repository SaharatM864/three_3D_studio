/**
 * The only module that may import "mediabunny" (enforced by ESLint). A second
 * bundled copy breaks its `instanceof` checks, e.g. on OutputFormat.
 */
export {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  Quality,
  StreamTarget,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny";
