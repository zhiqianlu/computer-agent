import screenshot from 'screenshot-desktop';
import sharp from 'sharp';

/**
 * 截取屏幕并返回 base64 编码的图片
 */
export async function captureScreen() {
  try {
    // 截取屏幕
    const imgBuffer = await screenshot({ format: 'png' });
    
    // 获取屏幕尺寸
    const metadata = await sharp(imgBuffer).metadata();
    
    // 调整大小以减少 token 消耗 (最大宽度 1280)
    let processedBuffer = imgBuffer;
    if (metadata.width > 1280) {
      processedBuffer = await sharp(imgBuffer)
        .resize(1280, null, { fit: 'inside' })
        .png()
        .toBuffer();
    }
    
    // 转换为 base64
    const base64 = processedBuffer.toString('base64');
    
    return {
      base64,
      width: metadata.width,
      height: metadata.height,
      mimeType: 'image/png'
    };
  } catch (error) {
    console.error('Screenshot error:', error);
    throw error;
  }
}

/**
 * 获取屏幕尺寸
 */
export async function getScreenSize() {
  const imgBuffer = await screenshot({ format: 'png' });
  const metadata = await sharp(imgBuffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height
  };
}
