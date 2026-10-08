import {
  Data3DTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RedFormat,
  RepeatWrapping,
  TextureLoader,
  UnsignedByteType,
  type Texture,
} from "three";

import type { Disposable } from "../use-disposable";

export const CLOUD_TEXTURE_URLS = {
  localWeather: "/assets/clouds/local_weather.png",
  shape: "/assets/clouds/shape.bin",
  shapeDetail: "/assets/clouds/shape_detail.bin",
  turbulence: "/assets/clouds/turbulence.png",
};

export const CLOUD_SHAPE_TEXTURE_SIZE = 128;

export const CLOUD_SHAPE_DETAIL_TEXTURE_SIZE = 32;

export interface CloudTextures extends Disposable {
  localWeather: Texture;
  shape: Data3DTexture;
  shapeDetail: Data3DTexture;
  turbulence: Texture;
}

export async function loadCloudTextures(): Promise<CloudTextures> {
  const pending = [
    loadDataTexture2D(CLOUD_TEXTURE_URLS.localWeather),
    loadDataTexture3D(CLOUD_TEXTURE_URLS.shape, CLOUD_SHAPE_TEXTURE_SIZE),
    loadDataTexture3D(
      CLOUD_TEXTURE_URLS.shapeDetail,
      CLOUD_SHAPE_DETAIL_TEXTURE_SIZE
    ),
    loadDataTexture2D(CLOUD_TEXTURE_URLS.turbulence),
  ] as const;

  const results = await Promise.allSettled(pending);
  const failed = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );
  if (failed !== undefined) {
    for (const result of results) {
      if (result.status === "fulfilled") result.value.dispose();
    }
    throw failed.reason;
  }

  const [localWeather, shape, shapeDetail, turbulence] =
    await Promise.all(pending);

  return {
    localWeather,
    shape,
    shapeDetail,
    turbulence,
    dispose() {
      localWeather.dispose();
      shape.dispose();
      shapeDetail.dispose();
      turbulence.dispose();
    },
  };
}

async function loadDataTexture2D(url: string): Promise<Texture> {
  const texture = await new TextureLoader()
    .loadAsync(url)
    .catch((cause: unknown) => {
      throw new Error(`Failed to load cloud texture ${url}`, { cause });
    });
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

async function loadDataTexture3D(
  url: string,
  size: number
): Promise<Data3DTexture> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to load cloud texture ${url}: HTTP ${response.status}`
    );
  }
  const data = new Uint8Array(await response.arrayBuffer());
  const expectedBytes = size ** 3;
  if (data.byteLength !== expectedBytes) {
    throw new Error(
      `Invalid cloud texture ${url}: expected ${expectedBytes} bytes, got ${data.byteLength}`
    );
  }

  const texture = new Data3DTexture(data, size, size, size);
  texture.format = RedFormat;
  texture.type = UnsignedByteType;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.wrapR = RepeatWrapping;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}
