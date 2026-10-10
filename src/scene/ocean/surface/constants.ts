export type Rgb = readonly [number, number, number];

export const DETAIL_TEXTURE_SIZE = 512;
export const DETAIL_MEAN = 0.4089;
export const DETAIL_STD = 0.1328;

export const LUMA: Rgb = [0.2126, 0.7152, 0.0722];

export const N_WATER = 1.34;
export const ETA_AIR_WATER = 1 / N_WATER;
export const ETA_AIR_WATER_2 = ETA_AIR_WATER * ETA_AIR_WATER;

export const CLIPMAP_MAX_LEVELS = 16;
export const CLIPMAP_MORPH_START = 0.55;
export const CLIPMAP_MORPH_END = 0.8;
export const GEOMETRY_WAVE_SAMPLES_FULL = 8;
export const GEOMETRY_WAVE_SAMPLES_MIN = 4;

export const FEATURE_DIV = 45;
export const ROUGH_FLOOR = 0.075;
export const ROUGH_FROM_VAR = 0.6;
export const ROUGH_FROM_FOOT = 0.3;
export const ROUGH_FOOT_SCALE = 0.55;
export const ROUGH_MAX = 0.6;

export const REFL_RELAX = 1.7;
export const REFL_RELAX_MAX = 0.74;
export const GLINT_CLAMP = 0.9;
export const REFL_FILTER: Rgb = [0.88, 1, 1.1];
export const REFL_DESAT = 1.8;
export const REFL_CHROMA = 0.62;
export const REFL_DESAT_CAP = 0.6;
export const REFL_GREY: Rgb = [0.84, 1, 1.21];
export const REFL_BAND: Rgb = [0.86, 0.99, 1.16];
export const REFL_BAND_DESAT = 0.8;
export const REFL_WARM_GAIN = 3.5;
export const REFL_BAND_ELEV = 13;
export const REFL_NEAR = 0.26;
export const GRAZE_RANGE = 4000;
export const GRAZE_AMOUNT = 0.15;
export const REFL_CEIL = 0.86;

export const FAR_SINK = 0.78;
export const FAR_SINK_RANGE = 4000;

export const RIPPLE_TILE = 0.55;
export const RIPPLE_STEP = 2.5 / DETAIL_TEXTURE_SIZE;
export const RIPPLE_GAIN = 2.6;
export const RIPPLE_FINE = 0.7;
export const RIPPLE_FOOT = 0.22;
export const RIPPLE_OCT = 4;
export const RIPPLE_OCT_AMP = 0.85;

export const FOAM_RELIEF_FINE = 0.6;
export const FOAM_RELIEF_OCT = 0.55;
export const FOAM_RELIEF_RMS = 0.01906;
export const FOAM_RELIEF_NORM =
  1 / (FOAM_RELIEF_RMS * Math.hypot(FOAM_RELIEF_OCT, 1));
export const FOAM_RELIEF_CLAMP = 2;

export const WAVE_SCALE = 2.6;
export const HEIGHT_SOFT = 1.3;
export const BODY_BIAS = 1.07;
export const BODY_SOFT = 0.27;

export interface SeaPalette {
  trough: readonly [Rgb, Rgb];
  abyss: readonly [Rgb, Rgb];
  body: readonly [Rgb, Rgb];
  crest: readonly [Rgb, Rgb];
  bodyBlue: readonly [Rgb, Rgb];
  scatter: readonly [Rgb, Rgb];
}

export const SEA: SeaPalette = {
  trough: [
    [0.008, 0.019, 0.016],
    [0.004, 0.0103, 0.0233],
  ],
  abyss: [
    [0.017, 0.044, 0.04],
    [0.0091, 0.0237, 0.0539],
  ],
  body: [
    [0.028, 0.093, 0.0995],
    [0.0192, 0.0497, 0.113],
  ],
  crest: [
    [0.165, 0.52, 0.47],
    [0.1283, 0.3668, 0.567],
  ],
  bodyBlue: [
    [0.021, 0.072, 0.115],
    [0.0155, 0.0401, 0.0911],
  ],
  scatter: [
    [0.088, 0.3, 0.282],
    [0.0713, 0.1847, 0.4197],
  ],
};

export const SAT_BOOST = [1.12, 1] as const;

export const DEEP_COLOR_HEX = 0x071a26;
export const SCATTER_COLOR_HEX = 0x2e8f8f;
export const FOAM_COLOR_HEX = 0xdce7ea;

export const SHALLOW_MAX = 0.88;
export const MASS_SCALE = 0.0055;
export const MASS_NEAR = 0.021;
export const MASS_FINE = 0.11;
export const MASS_AMOUNT = 1.35;
export const MASS_SOFT = 0.55;
export const MASS_HUE = 0.003;
export const MASS_HUE_AMOUNT = 0.5;
export const SKY_VIS_MIN = 0.34;
export const SHADOW_LUM = 0.487;
export const GROUP_SCALE = 3.4;
export const GROUP_SOFT = 1;
export const GROUP_DARK = 0.5;
export const CHOP_LIFT = 0.55;
export const CREST_RADIUS = 5;
export const SSS_DEPTH = 0.8;
export const SSS_GAIN = 1.7;
export const SSS_MAX = 0.75;
export const SSS_G = 0.62;
export const LIP_TIP = 0.6;
export const LIP_BASE = 3;

export const MU_CLEAR: Rgb = [0.428933, 0.153794, 0.213026];
export const MU_TURBID: Rgb = [0.470402, 0.199974, 0.351875];

export const SCATTER_GAIN = 0.72;
export const SCATTER_BASE = 0.16;

export const SPEC_KNEE = 3;
export const SPEC_MAX = 4;
export const SPEC_WHITE = 0.25;
export const SPEC_ROUGH_MIN = 0.12;
export const SPEC_ROUGH_MAX = 0.4;
export const SPEC_SPREAD_RANGE = 4000;
export const SPEC_SPREAD = 0.035;
export const SPEC_AA_VAR = 6;
export const SPEC_AA_DESAT = 0.6;

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export const CARVE_W_C = 0.62;
export const CARVE_W_F = 0.38;
export const CARVE_TILE_C = 17;
export const CARVE_TILE_F = CARVE_TILE_C / (3 + GOLDEN_RATIO);
export const CARVE_ROT = Math.atan(1 / GOLDEN_RATIO);
export const CARVE_ROT_C = Math.cos(CARVE_ROT);
export const CARVE_ROT_S = Math.sin(CARVE_ROT);
export const CARVE_WARP_TILE = 110;
export const CARVE_WARP_AMP = 8;
export const CARVE_WARP_RHO = 0.249;
export const CARVE_WARP_ORTH =
  1 / Math.sqrt(1 - CARVE_WARP_RHO * CARVE_WARP_RHO);
export const CARVE_FOOT_F = 0.15;
export const CARVE_TRIM = 1;
export const RAMP_IN = 0.1;
export const RAMP_FULL = 0.8;
export const RAMP_MED_TOP = 0.5;
export const RAMP_MED_IN = 0.45;
export const RAMP_SPARSE_MIN = 0.25;
export const SPARSE_CLIP = -2 * DETAIL_STD;

export const AGE_END = 0.72;
export const AGE_FAR_LO = 1.125;
export const AGE_FAR_HI = 4.5;
export const LACE_HALF = 2 * DETAIL_STD;
export const LACE_MIN = 0.78;
export const TONE_FLOOR = 0.45;
export const TONE_FAR = 0.78;
export const FOAM_AMB = 0.55;
export const FOAM_SUN = 0.6;
export const FOAM_WRAP = 0.3;
export const FOAM_FWD = 0.15;
export const FOAM_CEIL = 1.05;
export const FOAM_RED_AGED = 0.889;
export const FOAM_SPEC_FILM = 0.5;

export const SCUD_TONE = 0.18 / 0.475;
export const BUB_SUN_T = 1 - 0.475;
export const MILK_PATH = Math.sqrt(LIP_TIP * LIP_BASE);
export const BUB_DEPTH = 0.12;
export const BUB_VY_MIN = 0.2;
export const BUB_TILE = 5.3;
export const BUB_LOD_MIN = 3;
export const BUB_CONTRAST = 0.45;
export const BUB_PLUME_MAX = 1.9;
export const APRON_DROP = 1.6 * DETAIL_STD * Math.hypot(CARVE_W_C, CARVE_W_F);
export const APRON_SPAN = 0.3;
export const APRON_COV_GAIN = 4.8;
export const APRON_ALPHA = 0.4;
export const APRON_FOOT = 3;
export const SCUD_OCC_MIN = 0.45;
