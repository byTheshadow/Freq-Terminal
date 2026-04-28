// core/st-bridge.js
// 与 SillyTavern Extension API 通信的唯一入口

import EventBus from './event-bus.js';
import { parseAllMeowFM, extractRadioShow, extractLatestThinking } from './parser.js';

// ST 全局对象引用（ST 1.15 挂在 window 上）
const ST = () => window.SillyTavern?.getContext?.() ?? null;

// 获取所有角色卡
export function getCharacters() {
  const ctx = ST();
  if (!ctx) return [];
  return ctx.characters ?? [];
}

// 获取当前聊天角色名
export function getCurrentCharName() {
  const ctx = ST();
  return ctx?.name2 ?? ctx?.characters?.[ctx?.characterId]?.name ?? '';
}

// 获取当前聊天消息数组
export function getChatMessages() {
  const ctx = ST();
  return ctx?.chat ?? [];
}

// 获取当前聊天里所有解析好的 meow_FM 记录
export function getMeowFMRecords() {
  return parseAllMeowFM(getChatMessages());
}

// 获取最新一条 radio_show 数据（BGM / STATUS）
export function getLatestRadioShow() {
  const msgs = getChatMessages();
  for (let i = msgs.length - 1; i >= 0; i--) {
    const result = extractRadioShow(msgs[i].mes ?? '');
    if (result) return result;
  }
  return null;
}

// 获取最新 thinking 内容
export function getLatestThinking() {
  return extractLatestThinking(getChatMessages());
}

// 监听 ST 新消息事件，有新 AI 消息时触发回调
export function onNewMessage(callback) {
  const { eventSource, event_types } = window.SillyTavern ?? {};
  if (!eventSource || !event_types) {
    console.warn('[FreqTerminal] ST eventSource not available');
    return;
  }
  eventSource.on(event_types.MESSAGE_RECEIVED, (data) => {
    callback(data);
    // 同时广播到内部事件总线
    const msgs = getChatMessages();
    const last = msgs[msgs.length - 1];
    if (!last) return;
    const text = last.mes ?? '';
    // 检查是否有新的 meow_FM
    if (/<meow_FM>/i.test(text)) {
      EventBus.emit('meow_fm:updated', getMeowFMRecords());
    }
    // 检查 radio_show
    if (/<radio_show>/i.test(text)) {
      EventBus.emit('radio_show:updated', getLatestRadioShow());
    }
  });
}

// 获取插件自身设置（存在 ST extension_settings 里）
export function getSettings() {
  return window.extension_settings?.['freq-terminal'] ?? {};
}

// 保存插件设置
export function saveSettings(patch) {
  if (!window.extension_settings) window.extension_settings = {};
  window.extension_settings['freq-terminal'] = {
    ...getSettings(),
    ...patch,
  };
  window.saveSettingsDebounced?.();
}

export default { getCharacters, getCurrentCharName, getChatMessages, getMeowFMRecords, getLatestRadioShow, getLatestThinking, onNewMessage, getSettings, saveSettings };
