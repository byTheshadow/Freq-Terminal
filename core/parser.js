// core/parser.js
// 解析预设输出的 XML 标签

import EventBus from './event-bus.js';

// 解析单条 <meow_FM> 块的内容
function parseMeowFM(rawText) {
  // 提取 serial
  const serial = rawText.match(/serial\s*:\s*(.+)/)?.[1]?.trim() ?? '';
  // 提取 time
  const time   = rawText.match(/time\s*:\s*(.+)/)?.[1]?.trim() ?? '';
  // 提取 scene
  const scene  = rawText.match(/scene\s*:\s*(.+)/)?.[1]?.trim() ?? '';
  // 提取 plot（可能多行，取到下一个字段或结尾）
  const plotMatch = rawText.match(/plot\s*:\s*([\s\S]*?)(?=\nseeds\s*:|$)/i);
  const plot   = plotMatch?.[1]?.trim() ?? '';
  // 提取 seeds（{{getvar::seeds}} 已被 ST 替换为实际内容）
  const seedsMatch = rawText.match(/seeds\s*:\s*([\s\S]*?)$/i);
  const seeds  = seedsMatch?.[1]?.trim() ?? '';

  return { serial, time, scene, plot, seeds, raw: rawText };
}

// 从完整消息文本中提取所有 <meow_FM> 块
export function extractMeowFM(messageText) {
  const results = [];
  // 匹配 <meow_FM>...</meow_FM>，大小写不敏感，允许拼写变体 mewo_FM
  const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/gi;
  let match;
  while ((match = regex.exec(messageText)) !== null) {
    results.push(parseMeowFM(match[1]));
  }
  return results;
}

// 解析 <radio_show> 提取 BGM / STATUS
export function extractRadioShow(messageText) {
  const match = messageText.match(/<radio_show>([\s\S]*?)<\/radio_show>/i);
  if (!match) return null;
  const raw = match[1];
  return {
    bgm:    raw.match(/BGM\s*:\s*(.+)/i)?.[1]?.trim() ?? '',
    status: raw.match(/STATUS\s*:\s*(.+)/i)?.[1]?.trim() ?? '',
    wear:   raw.match(/CHAR_WEAR\s*:\s*(.+)/i)?.[1]?.trim() ?? '',
    raw,
  };
}

// 扫描 ST 聊天历史，提取所有 meow_FM 记录
export function parseAllMeowFM(chatMessages) {
  const all = [];
  for (const msg of chatMessages) {
    const text = msg.mes ?? msg.message ?? '';
    const found = extractMeowFM(text);
    if (found.length > 0) all.push(...found);
  }
  // 按 serial 排序
  all.sort((a, b) => a.serial.localeCompare(b.serial));
  return all;
}

// 提取最新一条 thinking 内容（Claude 模型）
export function extractLatestThinking(chatMessages, charCount = 800) {
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const msg = chatMessages[i];
    const thinking = msg.extra?.reasoning ?? msg.thinking ?? '';
    if (thinking) return thinking.slice(-charCount);
  }
  return '';
}

// 推断宇宙频率是否开启（从最新 meow_FM 或 radio_show 判断）
export function isCosmicFreqActive(chatMessages) {
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const text = chatMessages[i].mes ?? '';
    if (/<meow_FM>/i.test(text) || /<radio_show>/i.test(text)) {
      // 如果 plot 或 status 里出现「宇宙频率」相关词
      return /宇宙频率|cosmic|第四面墙/i.test(text);
    }
  }
  return false;
}

export default { extractMeowFM, extractRadioShow, parseAllMeowFM, extractLatestThinking, isCosmicFreqActive };
