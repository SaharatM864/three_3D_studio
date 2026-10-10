import { Bug, Eye, Gauge, Orbit } from "lucide-react";

import {
  EXPOSURE_COMPENSATION_RANGE,
  FOV_RANGE,
  matchRenderQuality,
  ORBIT_SPEED_RANGE,
} from "@/game/settings";
import { presetIds } from "@/presets/registry";
import {
  CLOUDS_QUALITY_PRESETS,
  type CloudsQualityPreset,
} from "@/scene/clouds/quality";
import {
  DEFAULT_RENDER_QUALITY,
  MAX_PIXEL_RATIOS,
  OCEAN_GRIDS,
  PIXEL_BUDGETS,
  RENDER_QUALITIES,
  SUN_SHADOW_MAP_SIZES,
  type OceanGridId,
  type PixelBudgetId,
  type RenderQualityId,
} from "@/scene/render-config";
import { usePlaygroundSettingsStore } from "@/stores/playground-settings-store";

import { PanelSection } from "./panel-controls";
import { OptionSetting, SliderSetting, SwitchSetting } from "./settings-fields";

const RENDER_QUALITY_LABELS: Record<RenderQualityId, string> = {
  high: "สูง · เหมือน Studio",
  performance: "ลื่น",
};

const PIXEL_BUDGET_LABELS: Record<PixelBudgetId, string> = {
  "720p": "720p",
  "1080p": "1080p",
  "1440p": "1440p",
  "2160p": "4K",
};

const CLOUDS_QUALITY_LABELS: Record<CloudsQualityPreset, string> = {
  low: "ต่ำ",
  medium: "กลาง",
  high: "สูง",
  ultra: "สูงสุด",
};

const OCEAN_GRID_LABELS: Record<OceanGridId, string> = {
  fine: "ละเอียด",
  coarse: "เบา",
};

const renderQualityIds = presetIds(RENDER_QUALITIES);
const pixelBudgetIds = presetIds(PIXEL_BUDGETS);
const oceanGridIds = presetIds(OCEAN_GRIDS);

const decimalFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const signedFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

function formatMultiplier(value: number): string {
  return `${decimalFormat.format(value)}×`;
}

function formatDegrees(value: number): string {
  return `${decimalFormat.format(value)}°`;
}

function formatStops(value: number): string {
  return `${signedFormat.format(value)} EV`;
}

export function QualitySection() {
  const quality = usePlaygroundSettingsStore((s) => s.quality);
  const setQuality = usePlaygroundSettingsStore((s) => s.setQuality);
  const tier = matchRenderQuality(quality);

  return (
    <PanelSection icon={Gauge} title="คุณภาพการแสดงผล">
      <OptionSetting
        label="ชุดคุณภาพ"
        detail={tier === null ? "กำหนดเอง" : undefined}
        options={renderQualityIds}
        value={tier}
        format={(id) => RENDER_QUALITY_LABELS[id]}
        onChange={(id) => setQuality(RENDER_QUALITIES[id])}
      />
      <OptionSetting
        label="ความละเอียดสูงสุด"
        options={pixelBudgetIds}
        value={quality.pixelBudget}
        format={(id) => PIXEL_BUDGET_LABELS[id]}
        onChange={(pixelBudget) => setQuality({ pixelBudget })}
      />
      <OptionSetting
        label="Pixel ratio สูงสุด"
        options={MAX_PIXEL_RATIOS}
        value={quality.maxPixelRatio}
        format={formatMultiplier}
        onChange={(maxPixelRatio) => setQuality({ maxPixelRatio })}
      />
      <OptionSetting
        label="ขนาด shadow map"
        options={SUN_SHADOW_MAP_SIZES}
        value={quality.sunShadowMapSize}
        onChange={(sunShadowMapSize) => setQuality({ sunShadowMapSize })}
      />
      <OptionSetting
        label="คุณภาพเมฆ"
        options={CLOUDS_QUALITY_PRESETS}
        value={quality.clouds}
        format={(id) => CLOUDS_QUALITY_LABELS[id]}
        onChange={(clouds) => setQuality({ clouds })}
      />
      <SwitchSetting
        label="Temporal upscale ของเมฆ"
        description="render เมฆที่ความละเอียดต่ำแล้วสะสมข้ามเฟรม"
        checked={quality.cloudsTemporalUpscale}
        onChange={(cloudsTemporalUpscale) =>
          setQuality({ cloudsTemporalUpscale })
        }
      />
      <OptionSetting
        label="Grid ของทะเล"
        options={oceanGridIds}
        value={quality.oceanGrid}
        format={(id) => OCEAN_GRID_LABELS[id]}
        onChange={(oceanGrid) => setQuality({ oceanGrid })}
      />
      {tier !== DEFAULT_RENDER_QUALITY && (
        <p className="text-[11px] text-muted-foreground">
          ภาพจะต่างจาก Studio และไฟล์ export
        </p>
      )}
    </PanelSection>
  );
}

export function ViewSection() {
  const view = usePlaygroundSettingsStore((s) => s.view);
  const setView = usePlaygroundSettingsStore((s) => s.setView);

  return (
    <PanelSection icon={Eye} title="มุมมอง">
      <SliderSetting
        label="มุมกล้อง (FOV)"
        value={view.fov}
        range={FOV_RANGE}
        format={formatDegrees}
        onChange={(fov) => setView({ fov })}
      />
      <SliderSetting
        label="ชดเชยแสง"
        value={view.exposureCompensation}
        range={EXPOSURE_COMPENSATION_RANGE}
        format={formatStops}
        onChange={(exposureCompensation) => setView({ exposureCompensation })}
      />
    </PanelSection>
  );
}

export function OrbitSection() {
  const orbit = usePlaygroundSettingsStore((s) => s.orbit);
  const setOrbit = usePlaygroundSettingsStore((s) => s.setOrbit);

  return (
    <PanelSection icon={Orbit} title="กล้อง orbit">
      <SliderSetting
        label="ความเร็วหมุน"
        value={orbit.rotateSpeed}
        range={ORBIT_SPEED_RANGE}
        format={formatMultiplier}
        onChange={(rotateSpeed) => setOrbit({ rotateSpeed })}
      />
      <SliderSetting
        label="ความเร็วซูม"
        value={orbit.zoomSpeed}
        range={ORBIT_SPEED_RANGE}
        format={formatMultiplier}
        onChange={(zoomSpeed) => setOrbit({ zoomSpeed })}
      />
      <SliderSetting
        label="ความเร็วเลื่อน"
        value={orbit.panSpeed}
        range={ORBIT_SPEED_RANGE}
        format={formatMultiplier}
        onChange={(panSpeed) => setOrbit({ panSpeed })}
      />
      <SwitchSetting
        label="Damping"
        description="กล้องค่อย ๆ หยุดหลังปล่อยเมาส์"
        checked={orbit.damping}
        onChange={(damping) => setOrbit({ damping })}
      />
    </PanelSection>
  );
}

export function DebugSection() {
  const debug = usePlaygroundSettingsStore((s) => s.debug);
  const setDebug = usePlaygroundSettingsStore((s) => s.setDebug);

  return (
    <PanelSection icon={Bug} title="Debug">
      <SwitchSetting
        label="แสดง FPS"
        description="เปิดได้ด้วย ?stats ใน URL"
        checked={debug.showStats}
        onChange={(showStats) => setDebug({ showStats })}
      />
      <SwitchSetting
        label="Inspector ของ three"
        description="GPU ms ทีละ pass เปิดได้ด้วย ?inspector ใน URL"
        checked={debug.showInspector}
        onChange={(showInspector) => setDebug({ showInspector })}
      />
      <SwitchSetting
        label="หยุด render เมื่อฉากนิ่ง"
        description="ปิดเพื่อ render ทุกเฟรมตอนวัด FPS"
        checked={debug.pauseWhenIdle}
        onChange={(pauseWhenIdle) => setDebug({ pauseWhenIdle })}
      />
      <SwitchSetting
        label="แสดงจุดลอยตัว"
        description="จุดส้มคือ probe ที่จมน้ำ จุดฟ้าคือความสูงน้ำที่ฟิสิกส์อ่านได้ ต้องแตะผิวน้ำที่เห็น"
        checked={debug.showBuoyancy}
        onChange={(showBuoyancy) => setDebug({ showBuoyancy })}
      />
      <SwitchSetting
        label="แสดง collider"
        description="เส้นรูปทรงที่ฟิสิกส์ใช้ชน (Rapier) ของทุก body รวมถึงตัวเรือ"
        checked={debug.showPhysics}
        onChange={(showPhysics) => setDebug({ showPhysics })}
      />
    </PanelSection>
  );
}
