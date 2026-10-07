import { MousePointerClick, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  AudioClipSpec,
  CameraSpec,
  ClipSpec,
  EnvironmentSpec,
  LightSpec,
  MaterialSpec,
  SceneObjectSpec,
} from "@/model/types";
import { useStudioStore, type StudioSelection } from "@/stores/studio-store";

import { formatTimecode } from "../format";
import {
  environmentPresetLabel,
  materialPresetLabel,
  objectDetail,
  selectionIcon,
} from "../scene-meta";
import {
  AnimatableValue,
  BooleanValue,
  ColorSwatch,
  DefaultValue,
  InspectorSection,
  NumberValue,
  PropertyRow,
  renderColor,
  renderNumber,
  renderVec3,
  TextValue,
  Vec3Value,
} from "./inspector-fields";
import { Panel, PanelHeader } from "./panel";

export function InspectorPanel({ clip }: { clip: ClipSpec }) {
  const selection = useStudioStore((s) => s.selection);

  return (
    <Panel className="border-l">
      <PanelHeader title="Inspector" />
      <ScrollArea className="min-h-0 flex-1">
        {selection ? (
          <SelectionDetails clip={clip} selection={selection} />
        ) : (
          <InspectorEmpty
            icon={<MousePointerClick />}
            title="ยังไม่ได้เลือกรายการ"
            description="เลือกกล้อง ไฟ หรือวัตถุจาก Outliner หรือ Timeline เพื่อดูค่า"
          />
        )}
      </ScrollArea>
    </Panel>
  );
}

function InspectorEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="text-xs">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function SelectionDetails({
  clip,
  selection,
}: {
  clip: ClipSpec;
  selection: StudioSelection;
}) {
  const fps = clip.video.fps;
  const Icon = selectionIcon(clip, selection);
  const missing = (
    <InspectorEmpty
      icon={<SearchX />}
      title="ไม่พบรายการนี้"
      description="รายการที่เลือกไม่มีอยู่ในคลิปแล้ว"
    />
  );

  function title(label: string, detail: string) {
    return (
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{label}</span>
        <Badge variant="outline" className="ml-auto font-normal">
          {detail}
        </Badge>
      </div>
    );
  }

  switch (selection.kind) {
    case "environment":
      return (
        <>
          {title("สภาพแวดล้อม", "environment")}
          <EnvironmentDetails environment={clip.environment} />
        </>
      );
    case "camera":
      return (
        <>
          {title("กล้อง", "camera")}
          <CameraDetails camera={clip.camera} fps={fps} />
        </>
      );
    case "light": {
      const light = clip.lights.find((item) => item.id === selection.id);
      if (!light) return missing;
      return (
        <>
          {title(light.id, light.kind)}
          <LightDetails light={light} fps={fps} />
        </>
      );
    }
    case "object": {
      const object = clip.objects.find((item) => item.id === selection.id);
      if (!object) return missing;
      return (
        <>
          {title(object.id, objectDetail(object))}
          <ObjectDetails object={object} fps={fps} />
        </>
      );
    }
    case "audio": {
      const audio = clip.audio.find((item) => item.id === selection.id);
      if (!audio) return missing;
      return (
        <>
          {title(audio.id, "audio")}
          <AudioDetails audio={audio} fps={fps} />
        </>
      );
    }
  }
}

function EnvironmentDetails({ environment }: { environment: EnvironmentSpec }) {
  return (
    <>
      <InspectorSection title="พื้นหลังและแสงรอบข้าง">
        <PropertyRow label="Preset">
          {environment.presetId ? (
            <span>{environmentPresetLabel(environment.presetId)}</span>
          ) : (
            <DefaultValue label="ไม่มี" />
          )}
        </PropertyRow>
        <PropertyRow label="พื้นหลัง">
          {environment.background ? (
            <ColorSwatch value={environment.background} />
          ) : (
            <DefaultValue label="ตาม preset" />
          )}
        </PropertyRow>
        <PropertyRow label="HDRI">
          {environment.hdri ? (
            <TextValue value={environment.hdri} />
          ) : (
            <DefaultValue label="ไม่มี" />
          )}
        </PropertyRow>
        {environment.hdri && (
          <PropertyRow label="HDRI เป็นพื้นหลัง">
            <BooleanValue value={environment.hdriAsBackground} />
          </PropertyRow>
        )}
        {environment.environmentIntensity !== undefined && (
          <PropertyRow label="ความเข้ม env">
            <NumberValue value={environment.environmentIntensity} />
          </PropertyRow>
        )}
        <PropertyRow label="Exposure">
          {environment.exposure !== undefined ? (
            <NumberValue value={environment.exposure} />
          ) : (
            <DefaultValue label="ตาม preset" />
          )}
        </PropertyRow>
      </InspectorSection>
      {environment.fog && (
        <InspectorSection title="หมอก">
          <PropertyRow label="สี">
            <ColorSwatch value={environment.fog.color} />
          </PropertyRow>
          <PropertyRow label="ระยะ">
            <span className="font-mono tabular-nums">
              {environment.fog.near} – {environment.fog.far}
            </span>
          </PropertyRow>
        </InspectorSection>
      )}
    </>
  );
}

function CameraDetails({ camera, fps }: { camera: CameraSpec; fps: number }) {
  return (
    <InspectorSection title="กล้อง">
      <PropertyRow label="ตำแหน่ง">
        <AnimatableValue value={camera.position} fps={fps} render={renderVec3} />
      </PropertyRow>
      <PropertyRow label="มองไปที่">
        <AnimatableValue value={camera.target} fps={fps} render={renderVec3} />
      </PropertyRow>
      <PropertyRow label="FOV">
        <AnimatableValue
          value={camera.fov}
          fps={fps}
          render={renderNumber("°")}
        />
      </PropertyRow>
      {camera.near !== undefined && (
        <PropertyRow label="Near">
          <NumberValue value={camera.near} />
        </PropertyRow>
      )}
      {camera.far !== undefined && (
        <PropertyRow label="Far">
          <NumberValue value={camera.far} />
        </PropertyRow>
      )}
    </InspectorSection>
  );
}

function LightDetails({ light, fps }: { light: LightSpec; fps: number }) {
  return (
    <>
      <InspectorSection title="แสง">
        <PropertyRow label="สี">
          <AnimatableValue value={light.color} fps={fps} render={renderColor} />
        </PropertyRow>
        <PropertyRow label="ความเข้ม">
          <AnimatableValue
            value={light.intensity}
            fps={fps}
            render={renderNumber()}
          />
        </PropertyRow>
        {light.kind === "hemisphere" && (
          <PropertyRow label="สีพื้น">
            {light.groundColor ? (
              <ColorSwatch value={light.groundColor} />
            ) : (
              <DefaultValue />
            )}
          </PropertyRow>
        )}
      </InspectorSection>
      {"position" in light && (
        <InspectorSection title="ตำแหน่ง">
          <PropertyRow label="ตำแหน่ง">
            <AnimatableValue
              value={light.position}
              fps={fps}
              render={renderVec3}
            />
          </PropertyRow>
          {"target" in light && (
            <PropertyRow label="ส่องไปที่">
              <AnimatableValue
                value={light.target}
                fps={fps}
                render={renderVec3}
              />
            </PropertyRow>
          )}
        </InspectorSection>
      )}
      {light.kind === "point" && (
        <InspectorSection title="การกระจาย">
          <PropertyRow label="ระยะ">
            {light.distance !== undefined ? (
              <NumberValue value={light.distance} />
            ) : (
              <DefaultValue label="ไม่จำกัด" />
            )}
          </PropertyRow>
          <PropertyRow label="Decay">
            {light.decay !== undefined ? (
              <NumberValue value={light.decay} />
            ) : (
              <DefaultValue />
            )}
          </PropertyRow>
        </InspectorSection>
      )}
      {light.kind === "spot" && (
        <InspectorSection title="กรวยแสง">
          <PropertyRow label="มุม">
            {light.angle !== undefined ? (
              <NumberValue value={light.angle} unit="rad" />
            ) : (
              <DefaultValue />
            )}
          </PropertyRow>
          <PropertyRow label="Penumbra">
            {light.penumbra !== undefined ? (
              <NumberValue value={light.penumbra} />
            ) : (
              <DefaultValue />
            )}
          </PropertyRow>
        </InspectorSection>
      )}
      {"castShadow" in light && (
        <InspectorSection title="เงา">
          <PropertyRow label="ทอดเงา">
            <BooleanValue value={light.castShadow} />
          </PropertyRow>
        </InspectorSection>
      )}
    </>
  );
}

function ObjectDetails({
  object,
  fps,
}: {
  object: SceneObjectSpec;
  fps: number;
}) {
  const transform = object.transform;

  return (
    <>
      <InspectorSection title="Transform">
        <PropertyRow label="ตำแหน่ง">
          <AnimatableValue
            value={transform?.position}
            fps={fps}
            render={renderVec3}
          />
        </PropertyRow>
        <PropertyRow label="หมุน (rad)">
          <AnimatableValue
            value={transform?.rotation}
            fps={fps}
            render={renderVec3}
          />
        </PropertyRow>
        <PropertyRow label="ขนาด">
          <AnimatableValue
            value={transform?.scale}
            fps={fps}
            render={renderVec3}
          />
        </PropertyRow>
      </InspectorSection>
      <ObjectKindDetails object={object} />
      {"material" in object && object.material && (
        <MaterialDetails material={object.material} fps={fps} />
      )}
      <InspectorSection title="เงา">
        <PropertyRow label="ทอดเงา">
          <BooleanValue value={object.castShadow} />
        </PropertyRow>
        <PropertyRow label="รับเงา">
          <BooleanValue value={object.receiveShadow} />
        </PropertyRow>
      </InspectorSection>
    </>
  );
}

function ObjectKindDetails({ object }: { object: SceneObjectSpec }) {
  switch (object.kind) {
    case "primitive":
      return (
        <InspectorSection title="รูปทรง">
          <PropertyRow label="Shape">
            <span>{object.shape}</span>
          </PropertyRow>
          <PropertyRow label="ขนาดตั้งต้น">
            {object.size ? (
              <Vec3Value value={object.size} />
            ) : (
              <DefaultValue label="1 × 1 × 1" />
            )}
          </PropertyRow>
        </InspectorSection>
      );
    case "model":
      return (
        <InspectorSection title="โมเดล">
          <PropertyRow label="ไฟล์">
            <TextValue value={object.src} />
          </PropertyRow>
          <PropertyRow label="Animation">
            {object.animation ? (
              <TextValue value={object.animation} />
            ) : (
              <DefaultValue label="ไม่มี" />
            )}
          </PropertyRow>
        </InspectorSection>
      );
    case "text":
      return (
        <InspectorSection title="ข้อความ">
          <PropertyRow label="ข้อความ">
            <span className="break-words">{object.text}</span>
          </PropertyRow>
          <PropertyRow label="ฟอนต์">
            {object.font ? (
              <TextValue value={object.font} />
            ) : (
              <DefaultValue />
            )}
          </PropertyRow>
          <PropertyRow label="ขนาด">
            {object.fontSize !== undefined ? (
              <NumberValue value={object.fontSize} />
            ) : (
              <DefaultValue />
            )}
          </PropertyRow>
        </InspectorSection>
      );
    case "custom":
      return (
        <InspectorSection title="Custom component">
          <PropertyRow label="Component">
            <TextValue value={object.componentKey} />
          </PropertyRow>
          <PropertyRow label="Props">
            {object.props ? (
              <pre className="overflow-x-auto rounded bg-muted/60 p-1.5 font-mono text-[11px]">
                {JSON.stringify(object.props, null, 2)}
              </pre>
            ) : (
              <DefaultValue label="ไม่มี" />
            )}
          </PropertyRow>
        </InspectorSection>
      );
  }
}

function MaterialDetails({
  material,
  fps,
}: {
  material: MaterialSpec;
  fps: number;
}) {
  const maps = Object.entries(material.maps ?? {}).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );

  return (
    <InspectorSection title="วัสดุ">
      <PropertyRow label="Preset">
        {material.presetId ? (
          <span>{materialPresetLabel(material.presetId)}</span>
        ) : (
          <DefaultValue label="ไม่มี" />
        )}
      </PropertyRow>
      <PropertyRow label="สี">
        <AnimatableValue value={material.color} fps={fps} render={renderColor} />
      </PropertyRow>
      <PropertyRow label="Metalness">
        <AnimatableValue
          value={material.metalness}
          fps={fps}
          render={renderNumber()}
        />
      </PropertyRow>
      <PropertyRow label="Roughness">
        <AnimatableValue
          value={material.roughness}
          fps={fps}
          render={renderNumber()}
        />
      </PropertyRow>
      {material.emissive && (
        <PropertyRow label="Emissive">
          <ColorSwatch value={material.emissive} />
        </PropertyRow>
      )}
      {material.emissiveIntensity !== undefined && (
        <PropertyRow label="ความสว่าง">
          <AnimatableValue
            value={material.emissiveIntensity}
            fps={fps}
            render={renderNumber()}
          />
        </PropertyRow>
      )}
      {material.opacity !== undefined && (
        <PropertyRow label="Opacity">
          <AnimatableValue
            value={material.opacity}
            fps={fps}
            render={renderNumber()}
          />
        </PropertyRow>
      )}
      {maps.map(([name, path]) => (
        <PropertyRow key={name} label={`Map: ${name}`}>
          <TextValue value={path} />
        </PropertyRow>
      ))}
    </InspectorSection>
  );
}

function AudioDetails({ audio, fps }: { audio: AudioClipSpec; fps: number }) {
  return (
    <InspectorSection title="เสียง">
      <PropertyRow label="ไฟล์">
        <TextValue value={audio.src} />
      </PropertyRow>
      <PropertyRow label="เริ่มที่">
        <span className="font-mono tabular-nums">
          f{audio.startFrame}
          <span className="ml-1.5 text-muted-foreground">
            {formatTimecode(audio.startFrame, fps)}
          </span>
        </span>
      </PropertyRow>
      <PropertyRow label="ตัดต้น">
        {audio.trimStartSeconds !== undefined ? (
          <NumberValue value={audio.trimStartSeconds} unit="s" />
        ) : (
          <DefaultValue label="0 s" />
        )}
      </PropertyRow>
      <PropertyRow label="ความยาว">
        {audio.durationInFrames !== undefined ? (
          <NumberValue value={audio.durationInFrames} unit="เฟรม" />
        ) : (
          <DefaultValue label="จนจบไฟล์" />
        )}
      </PropertyRow>
      <PropertyRow label="Volume">
        <AnimatableValue
          value={audio.volume}
          fps={fps}
          render={renderNumber()}
        />
      </PropertyRow>
    </InspectorSection>
  );
}
