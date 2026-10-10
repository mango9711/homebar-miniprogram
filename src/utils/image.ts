import Taro from '@tarojs/taro'

export const MAX_PHOTOS = 9

/**
 * H5：用 Canvas 等比缩放并转成 JPEG data URL，保证可持久化
 */
async function compressH5(src: string): Promise<string> {
  const g: any = globalThis as any
  const img: any = new g.Image()
  img.src = src
  if (!img.complete) {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load failed'))
    })
  }

  const MAX_EDGE = 1000
  let w = img.naturalWidth || img.width
  let h = img.naturalHeight || img.height
  if (w > MAX_EDGE || h > MAX_EDGE) {
    if (w >= h) {
      h = Math.round((h * MAX_EDGE) / w)
      w = MAX_EDGE
    } else {
      w = Math.round((w * MAX_EDGE) / h)
      h = MAX_EDGE
    }
  }

  const canvas = g.document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.72)
}

/**
 * 微信小程序：先压缩，再读取为 base64 data URL
 */
async function compressWeapp(src: string): Promise<string> {
  let filePath = src
  try {
    const res = await Taro.compressImage({ src, quality: 70 })
    filePath = res.tempFilePath
  } catch (e) {
    console.warn('[Image] compressImage failed, use original:', e)
  }
  return new Promise((resolve, reject) => {
    Taro.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        resolve(`data:image/jpeg;base64,${res.data}`)
      },
      fail: (err) => {
        console.error('[Image] readFile failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 选择图片并统一转为 data URL。
 * @param available 还可选择的数量
 * @returns 处理后的 data URL 列表（不超过 available）
 */
export async function pickPhotos(available: number): Promise<string[]> {
  const count = Math.min(MAX_PHOTOS, Math.max(1, available))
  const res = await Taro.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera']
  })
  
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB
  const out: string[] = []
  
  for (const path of res.tempFilePaths) {
    try {
      if (isH5) {
        out.push(await compressH5(path))
      } else {
        out.push(await compressWeapp(path))
      }
    } catch (e) {
      console.error('[Image] process photo failed:', e)
    }
  }
  return out.slice(0, count)
}
