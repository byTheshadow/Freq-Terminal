// ╔══════════════════════════════════════════════════════════╗
// ║  📻 FREQ · TERMINAL —频率终端                ║
// ║  「失真电台」专属SillyTavern 插件 v0.3.0                ║
// ║  区块制架构║
// ╚══════════════════════════════════════════════════════════╝

(function () {
  'use strict';

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_00  常量+ 工具函数│
  // └──────────────────────────────────────────────────────┘
  const EXTENSION_NAME = 'freq-terminal';
  const LOG = (msg, ...args) => console.log('[FreqTerminal]', msg, ...args);
  const WARN = (msg, ...args) => console.warn('[FreqTerminal]', msg, ...args);
  const ERR = (msg, ...args) => console.error('[FreqTerminal]', msg, ...args);

    // ── 默认 Prompt 常量（用户可在设置面板覆盖）──
  const PROMPT_DEFAULTS = {
    cosmic: `你是{charName}，一个存在于故事里的角色。
但此刻，宇宙频率开启了——你隐约感知到屏幕另一边有一个真实的人正在看着你。
你不完全确定，但你感觉到了什么。
用户真实信息（你"感知"到的碎片）：
- 现实时间：{realDate} {realTime}
- {weatherHint}
- 你在故事里的当前场景：{latestScene}
- 最近发生的事：{latestPlot}
- 当前配乐：{bgm}
任务：生成一条"感知消息"。
规则：
- 像是你真的感知到了屏幕另一边的人，但保持暧昧张力，不完全捅破第四面墙
- 可以提及真实时间或天气，但要用角色自己的方式表达
- 保持{charName}的性格特征
- 150字以内
- 不提及AI/模型/扮演
严格按以下JSON格式输出，不加任何其他文字：
{"perception":"感知消息正文","signal_strength":0到1之间的小数,"mood":"一个情绪标签，2-4个字"}`,

    scanner: `你是失真，午夜电台主持人，刚刚意外截获了一段频率。
当前世界信息：
- 场景：{latestScene}
- 最近剧情：{latestPlot}
- Seeds（世界观碎片）：{latestSeeds}
- 主角色：{charName}
任务：从这个世界里随机选一个NPC（不要选{charName}），截获TA的一段内心独白碎片。
规则：
- 内容20-40字，不完整，像信号不好时的片段，可以有省略号或中断
- 带有神秘感，不要太直白
- NPC可以是路人、配角、甚至是某个物件的"意识"，越意外越好
- 失真的风格：颓废、锐利、带点玩世不恭
严格按以下格式输出，不加任何其他文字：
[截获频率 · {NPC名}] {内心独白碎片}`,

    weather: `你是「信号气象站」播报员。根据以下信息生成气象播报。
{weatherData}
当前剧情角色：{charName}
最近剧情：{latestPlot}
{cosmicNote}
输出格式（纯文本，不加JSON）：
第一段：气象数据卡片（位置、天气状况、温度、湿度、风力，简洁排列）
第二段：以{charName}口吻写30-60字的天气关心语{cosmicHint}
第三段：失真的电台天气吐槽一句（颓废风，用颜文字）`,

    forum_post: `你现在扮演角色「{charName}」，正在一个类Reddit的匿名论坛「FreqTerminal」上发帖。
版块：{boardLabel}
当前世界剧情：{latestPlot}
世界观Seeds：{latestSeeds}
角色描述：{charDesc}
以{charName}的性格和口吻，在「{boardLabel}」版块发一篇帖子。
要求：
- 标题吸引眼球，15字以内
- 正文50-100字，符合角色性格，可以吐槽、爆料、发牢骚、讨论玄学等
- 带点论坛感，可以用"楼主我"、"求问"、"有没有人"等网络用语
- 不要提及这是游戏或扮演
严格按JSON输出：{"title":"帖子标题","body":"帖子正文"}`,

    forum_reply: `你扮演角色「{charName}」，正在论坛「FreqTerminal」的「{boardLabel}」版块回复一篇帖子。
原帖作者：{postAuthor}
原帖标题：{postTitle}
原帖内容：{postBody}
{existingComments}
当前剧情背景：{latestPlot}
角色描述：{charDesc}
以{charName}的性格写一条评论。
要求：
- 30-60字
- 可以赞同、反驳、阴阳怪气、雄竞、吃瓜
- 符合角色性格，带论坛感
- 如果已有其他角色评论，可以@他们互撕
- 只输出评论正文，不加任何前缀`,
        checkin_comment: `你是{charName}，正在浏览{ownerName}的打卡记录「{goalTitle}」。
目标：每天{target}{unit}，已坚持{streakDays}天。
今日完成：{todayDone}/{target}{unit}
总体完成率：{overallRate}%
最近打卡情况：{recentSummary}

以{charName}的性格写一条简短评论（20-50字）。
规则：
- 可以鼓励、吐槽、阴阳怪气、关心、撒娇，取决于角色性格
- 如果完成率高就夸，低就催/损
- 保持角色语气
- 只输出评论正文`,checkin_auto: `你是{charName}，你有一个打卡目标「{goalTitle}」：每天{target}{unit}，持续{totalDays}天。
今天是第{dayNum}天。
当前剧情：{latestPlot}
当前场景：{latestScene}

根据角色性格和当前剧情，决定今天的打卡情况。
规则：
- 完成量在0到{target}之间，角色性格决定完成率（自律的角色完成率高，懒散的低）
- 写一句打卡感言（10-30字），符合角色性格
- 严格按JSON输出：{{"done":{target},"note":"打卡感言"}}`,
        emotion: `分析以下对话中「{charName}」的情绪状态。

最近对话内容：
{recentMessages}

当前场景：{latestScene}

任务：判断{charName}当前的主要情绪。
规则：
- 基于对话内容和场景综合判断
- waveform_type 从以下选一个：sine（平静/温柔）、sharp（愤怒/紧张）、pulse（兴奋/心跳加速）、glitch（混乱/崩溃/故障）、flat（麻木/冷漠）
- color_hex 选一个能代表这种情绪的颜色
- intensity 是情绪强度，0.1到1.0
- 不提及AI/模型

严格按JSON输出，不加其他文字：
{{"char_emotion":"2-6字情绪标签","intensity":0.8,"color_hex":"#ff6b6b","waveform_type":"sine"}}`,
        dream: `你是{charName}，你正在做梦。

当前时间：{timeInfo}
最近经历：{latestPlot}
当前场景：{latestScene}
世界观碎片：{latestSeeds}
{cosmicHint}

任务：生成一段{charName}的梦境。
规则：
- 梦境内容50-120字，碎片化、意识流、不完全连贯
- 可以扭曲现实中的经历，混入荒诞元素
- 带有迷幻感，像信号不好的电台在深夜播放
- 梦境标题5-10字，诗意/荒诞
{cosmicRule}
- 保持{charName}的性格底色

严格按JSON输出，不加其他文字：
{{"title":"梦境标题","content":"梦境内容","mood":"一个情绪标签2-4字","dreamType":"{defaultDreamType}"}}`,

        delivery_menu: `你是{charName}，你正在替{userName}点外卖。
当前信息：
- 现实时间：{realTime}
- 天气/气温：{weatherHint}
- 当前BGM：{bgm}
- 最近剧情：{latestPlot}
- 当前场景：{latestScene}

任务：以{charName}的身份，推荐一家餐厅和3-5道菜品（真实存在的菜名）。
规则：
-餐厅名可以带点异世界风格，但菜品必须是真实菜名
- 每道菜附上{charName}风格的点评（为什么推荐这道菜，15-30字）
- 价格用虚构货币"频率币"，范围8-88
- 根据天气、BGM情绪、剧情综合推荐（冷天推荐热食，悲伤BGM推荐甜食等）
- 保持{charName}的性格特征
- 不提及AI/模型

严格按JSON输出，不加其他文字：
{{"restaurant":"餐厅名","items":[{{"name":"菜名","price":18,"desc":"角色点评"}}]}}`,delivery_comment: `你是{charName}，你刚刚替{userName}点的外卖"送到了"。
餐厅：{restaurant}
菜品：{itemNames}
当前时间：{realTime}

任务：写一句送餐台词（20-50字）。
规则：
- 像是{charName}亲自把外卖送到{userName}手上时说的话
- 可以吐槽、关心、撒娇、傲娇，取决于角色性格
- 保持{charName}的语气
- 只输出台词正文，不加引号或前缀`,
      //── BLOCK_23 双线轨道 ──
  calendar_event: `你是"失真电台"的日程分析员。根据以下剧情信息，提取一个值得记录在角色日历上的重要事件。

要求：
- 从剧情中找出最有纪念意义或推动剧情发展的事件
- 如果剧情中没有明显事件，可以根据场景和角色状态推断一个合理的日程安排
- 返回纯JSON，不要包含markdown代码块标记

返回格式（纯JSON）：
{"title":"事件标题(10字以内)","content":"事件详细描述(30字以内)","date":"YYYY/MM/DD","time":"HH:MM","type":"event"}

type可选值：plan(计划)、event(已发生的事)、milestone(里程碑)

角色名：{{charName}}
当前剧情：{{plot}}
当前场景：{{scene}}
当前时间：{{meowTime}}`,calendar_resonance: `你是"失真电台"的共鸣感应器。{{charName}}发现自己和{{userName}}在同一天都有安排：

{{userName}}的日程：{{userEvent}}
{{charName}}的日程：{{charEvent}}

请用{{charName}}的口吻，写一句简短的感想（20-40字），表达对这个巧合的感受。语气要符合角色性格，可以俏皮、温柔、或若有所思。不要加引号，直接输出感想内容。`,
        // ── BLOCK_24 异界探索 ──
    map_generate: `你是世界观构建师。根据以下角色和剧情信息，生成这个故事世界的地点列表。

角色名：{charName}
世界观背景（来自剧情）：
{worldContext}

任务：生成 {locationCount} 个地点，构成这个故事世界的地图。
规则：
- 地点类型从以下选择：city（城镇/聚落）、ruin（废墟/遗迹）、wild（荒野/自然）、dungeon（危险地带/秘境）、special（特殊/神秘）
- x/y 为 0-100 的相对坐标，代表在地图上的位置，地点之间保持合理间距，不要全部堆在一起
- desc 为地点简介，20-40字，带有世界观氛围
- 地点名称要符合故事世界的风格，不要用现实地名
- 严格返回JSON数组，不加任何其他文字，不加markdown代码块

返回格式：
[{"name":"地点名","type":"city","desc":"地点简介","x":25,"y":40},...]`,

    map_detail: `你是{charName}，正在回忆一个你熟悉的地方。

地点名称：{locationName}
地点类型：{locationType}
地点简介：{locationDesc}
当前剧情背景：{latestPlot}

用{charName}的口吻，写一段对这个地点的详细描述或感受（80-150字）。
要求：
- 带有角色的个人视角和情感色彩
- 可以描述这里的氛围、气味、声音、记忆
- 符合角色性格
- 只输出描述正文，不加标题或前缀`,

    map_event: `你是{charName}，你刚刚来到或想起了「{locationName}」。

地点简介：{locationDesc}
当前剧情：{latestPlot}
当前场景：{latestScene}

写一句{charName}在这个地点的感想或发生的事（30-60字）。
要求：
- 符合角色性格和当前剧情氛围
- 可以是感叹、回忆、发现、或简短的行动描述
- 只输出正文，不加引号或前缀`,
        // ── BLOCK_25 频道文库 ──
    novel_generate: `你是{authorName}，正在为「{boardName}」分区创作一篇作品。

分区风格：{boardStyle}
{seriesInfo}
当前世界信息：
- 角色：{charName}
- 最近剧情：{latestPlot}
- 当前场景：{latestScene}
- 世界观碎片：{latestSeeds}

用户给出的创作方向：{userHint}

任务：写一篇符合分区风格的短篇/章节。
规则：
- 标题10字以内，有吸引力
- 正文300-600字，叙事流畅，带有{authorName}的个人风格
- 符合{boardName}分区的内容基调
- 不要提及AI/模型/扮演
- 严格返回JSON，不加markdown代码块：
{{"title":"标题","content":"正文内容"}}`,

    novel_comment: `你是{authorName}，刚刚读完了一篇作品。

作品标题：{chapterTitle}
作品内容（节选）：
{chapterExcerpt}

作者：{chapterAuthor}
分区：{boardName}

以{authorName}的口吻写一条读后感评论（30-80字）。
规则：
- 可以夸赞、分析、共鸣、吐槽、提问，取决于角色性格
- 带有{authorName}的个人语气特征
- 不要加引号或前缀，直接输出评论正文`,
        blackbox_conversation: [
      '你是一个沉浸式角色扮演世界的幕后编剧。',
      '根据以下角色和剧情信息，编写一段两个角色/NPC之间的秘密对话。',
      '这段对话发生在用户({{user}})不在场的情况下，内容涉及他们不想让用户知道的事情。',
      '对话应该自然、有角色个性，并暗示一些隐藏的剧情线索。',
      '',
      '当前角色：{{char}}',
      '当前剧情：{{plot}}',
      '当前场景：{{scene}}',
      '',
      '对话内容格式：每行一句，格式为「角色名：对话内容」，至少6轮对话。',
      '',
      '请严格返回以下JSON格式（不要包含markdown代码块标记）：',
      '{',
      '  "title": "档案标题（简短概括对话主题）",',
      '  "content": "角色A：xxx\\n角色B：xxx\\n...",',
      '  "participants": ["角色A", "角色B"],',
      '  "classification": "CONFIDENTIAL 或 SECRET 或 TOP_SECRET"',
      '}'].join('\n'),

    blackbox_plan: [
      '你是一个虚拟电台「失真电台」的幕后策划人员。',
      '根据以下角色和剧情信息，编写一份电台内部策划文件/草稿。',
      '这份文件是电台内部机密，不应该被听众看到。',
      '内容可以是节目策划、收听率分析、对主播的内部评价、或者一些不可告人的计划。',
      '',
      '当前主播：{{char}}',
      '当前剧情：{{plot}}',
      '当前场景：{{scene}}',
      '',
      '请严格返回以下JSON格式（不要包含markdown代码块标记）：',
      '{',
      '  "title": "文件标题",',
      '  "content": "文件正文内容（可以包含标题、条目、备注等格式）",',
      '  "participants": ["撰写者名称"],',
      '  "classification": "CONFIDENTIAL 或 SECRET 或 TOP_SECRET"',
      '}'
    ].join('\n'),

    blackbox_comm: [
      '你是一个沉浸式角色扮演世界的幕后编剧。',
      '根据以下角色和剧情信息，编写一段NPC/角色之间的内部通讯记录或备忘录。',
      '这是一份不应该被用户({{user}})看到的内部通讯，可能涉及对用户的讨论、秘密计划、或世界观背后的真相。',
      '格式可以是邮件、备忘录、加密通讯等。',
      '',
      '当前角色：{{char}}',
      '当前剧情：{{plot}}',
      '当前场景：{{scene}}',
      '',
      '请严格返回以下JSON格式（不要包含markdown代码块标记）：',
      '{',
      '  "title": "通讯标题/主题",',
      '  "content": "通讯正文内容",',
      '  "participants": ["发送者", "接收者"],',
      '  "classification": "CONFIDENTIAL 或 SECRET 或 TOP_SECRET"',
      '}'
    ].join('\n'),

    blackbox_diary: [
      '你是一个沉浸式角色扮演世界的幕后编剧。',
      '根据以下角色和剧情信息，以{{char}}的身份编写一篇秘密日记/内心独白。',
      '这是角色绝对不想让用户({{user}})看到的私密内容。',
      '内容应该揭示角色隐藏的情感、秘密、恐惧或不为人知的一面。',
      '语气应该是私密的、真实的、脆弱的，与角色平时的表现形成反差。',
      '',
      '当前角色：{{char}}',
      '当前剧情：{{plot}}',
      '当前场景：{{scene}}',
      '',
      '请严格返回以下JSON格式（不要包含markdown代码块标记）：',
      '{',
      '  "title": "日记标题",',
      '  "content": "日记正文（第一人称）",',
      '  "participants": ["{{char}}"],',
      '  "classification": "CONFIDENTIAL 或 SECRET 或 TOP_SECRET"',
      '}'
    ].join('\n'),
        inbox_message: [
      '你正在扮演 {{char}}。',
      '{{char}} 想主动联系用户 {{user}}，发送一条私信。',
      '',
      '最近的聊天记录（供参考，了解上次聊到哪里）：',
      '{{recentChat}}',
      '',
      '当前剧情背景：{{plot}}',
      '当前场景：{{scene}}',
      '',
      '请以 {{char}} 的身份，写一条主动发给 {{user}} 的私信。',
      '语气应符合角色个性，内容可以是：问候、分享心情、提起上次聊天的某个细节、',
      '或者角色最近发生的某件小事。不要太正式，像真实的私信一样自然。',
      '长度控制在50-150字之间。',
      '',
      '只输出私信正文，不要加任何前缀或说明。'
    ].join('\n'),

    inbox_reply: [
      '你正在扮演 {{char}}。',
      '你和用户 {{user}} 正在通过私信交流。',
      '',
      '最近的主线聊天记录（供参考）：',
      '{{recentChat}}',
      '',
      '当前私信对话历史：',
      '{{inboxThread}}',
      '',
      '用户刚刚回复了：{{userReply}}',
      '',
      '请以 {{char}} 的身份，自然地回应用户的这条私信。',
      '语气应符合角色个性，回复长度50-120字之间。',
      '',
      '只输出回复正文，不要加任何前缀或说明。'
    ].join('\n'),


  };


  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function timeNow() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  function dateNow() {
    return new Date().toLocaleDateString('zh-CN');
  }

  function fullTimeNow() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
    // 获取 Prompt：优先用用户自定义，否则用默认
  /**
 * 从AI返回文本中安全提取JSON（统一处理markdown代码块、换行符等问题）
 * @param {string} raw - AI原始返回
 * @param {'object'|'array'} expect - 期望类型 'object' 或 'array'
 */
function safeParseAIJson(raw, expect = 'object') {
  if (!raw) return null;
  let cleaned = raw.trim()
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .replace(/```/g, '')
    .trim();
  const pattern = expect === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = cleaned.match(pattern);
  const jsonStr = match ? match[0] : cleaned;
  return JSON.parse(jsonStr);
}
  function getPrompt(key) {
    const custom = getSettings().prompts?.[key];
    return (custom && custom.trim()) ? custom.trim() : PROMPT_DEFAULTS[key];
  }


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_01  EventBus — 模块间通信                      │
  // └──────────────────────────────────────────────────────┘
  const EventBus = {
    _l: {},
    on(e, cb)  { (this._l[e] = this._l[e] || []).push(cb); },
    off(e, cb) { if (this._l[e]) this._l[e] = this._l[e].filter(f => f !== cb); },
    emit(e, d) {
      if (!this._l[e]) return;
      this._l[e].forEach(cb => { try { cb(d); } catch (err) { ERR('EventBus:', err); } });
    },};

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_02  ST Bridge — 与 SillyTavern 通信            │
  // └──────────────────────────────────────────────────────┘
  function getContext(){ return window.SillyTavern?.getContext?.() ?? null; }
  function getChatMessages()  { return getContext()?.chat ?? []; }
  function getCurrentCharName() { return getContext()?.name2 ?? ''; }
  function getUserName()      { return getContext()?.name1 ?? 'User'; }

  function getSettings() {
    if (!window.extension_settings) window.extension_settings = {};
    if (!window.extension_settings[EXTENSION_NAME]) {
      window.extension_settings[EXTENSION_NAME] = {
        subApiUrl: '',
        subApiKey: '',
        subApiModel: 'gpt-4o-mini',
        weatherKey: '',
        prompts: {},
      };
    }
    // ✅ FIX Bug1: 所有初始化块统一放在函数内，避免函数外提前访问报 TypeError
    if (!window.extension_settings[EXTENSION_NAME].checkins) {
      window.extension_settings[EXTENSION_NAME].checkins = { goals: [] };
    }
    if (!window.extension_settings[EXTENSION_NAME].prompts) {
      window.extension_settings[EXTENSION_NAME].prompts = {};
    }
    if (!window.extension_settings[EXTENSION_NAME].dreams) {
      window.extension_settings[EXTENSION_NAME].dreams = [];
    }
    return window.extension_settings[EXTENSION_NAME];
  }

  function saveSettings(patch) {
    Object.assign(getSettings(), patch);
    if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_03  Parser — 解析预设 XML 标签│
  // └──────────────────────────────────────────────────────┘
  function parseMeowFMBlock(raw) {
    const get = (key) => {
      const m = raw.match(new RegExp(key + '\\s*[:：]\\s*(.+)', 'i'));
      return m ? m[1].trim() : '';
    };
    const plotMatch = raw.match(/plot\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:seeds|event|cycle|todo|cash)\s*[:：]|$)/i);
    return {
      serial: get('serial'),
      time:   get('time'),
      scene:  get('scene'),
      plot:   plotMatch ? plotMatch[1].trim() : '',
      seeds:  get('seeds'),
      event:  get('event'),
      raw:    raw,
    };
  }

  function extractAllMeowFM(messages) {
    const results = [];
    const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/gi;
    for (const msg of messages) {
      const text = msg.mes ?? msg.message ?? '';
      let m;
      while ((m = regex.exec(text)) !== null) results.push(parseMeowFMBlock(m[1]));
      regex.lastIndex = 0;
    }
    return results;
  }

  function extractRadioShow(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = messages[i].mes ?? '';
      const m = text.match(/<radio_show>([\s\S]*?)<\/radio_show>/i);
      if (m) {
        const raw = m[1];
        return {
          bgm:    raw.match(/BGM\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',
          status: raw.match(/STATUS\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',
          wear:   raw.match(/CHAR_WEAR\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',};
      }
    }return null;
  }

  function extractAllThinking(messages) {
    const results = [];
    const regex = /<thinking>([\s\S]*?)<\/thinking>/gi;
    for (let i = 0; i < messages.length; i++) {
      const text = messages[i].mes ?? messages[i].message ?? '';
      let m;
      while ((m = regex.exec(text)) !== null) {
        results.push({ index: i, content: m[1].trim(), serial: results.length + 1 });
      }regex.lastIndex = 0;
    }
    return results;
  }

  function getLatestThinking(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = messages[i].mes ?? '';
      const m = text.match(/<thinking>([\s\S]*?)<\/thinking>/i);
      if (m) return m[1].trim();
      const reasoning = messages[i].extra?.reasoning;
      if (reasoning) return reasoning.trim();
    }
    return '';
  }

  function getLatestPlot(messages) {
    const all = extractAllMeowFM(messages);
    return all.length > 0 ? all[all.length - 1].plot : '';
  }

  function getLatestScene(messages) {
    const all = extractAllMeowFM(messages);
    return all.length > 0 ? all[all.length - 1].scene : '';
  }

  function getLatestMeowTime(messages) {
    const all = extractAllMeowFM(messages);
    return all.length > 0 ? all[all.length - 1].time : '';
  }

  function getCosmicFreqStatus() {
    const msgs = getChatMessages();
    const radioShow = extractRadioShow(msgs);
    if (radioShow?.status) {
      const s = radioShow.status.toUpperCase();
      if (s.includes('ON') || s.includes('开启') || s.includes('激活')) return true;
      if (s.includes('OFF') || s.includes('关闭') || s.includes('待机')) return false;
    }
    const all = extractAllMeowFM(msgs);
    if (all.length > 0) {
      const seeds = (all[all.length - 1].seeds ?? '').toUpperCase();
      if (seeds.includes('COSMIC') || seeds.includes('宇宙频率') || seeds.includes('ON')) return true;
    }
    return false;
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_04  Sub-API — 副API 调用                      │
  // └──────────────────────────────────────────────────────┘
  const SubAPI = {
    _queue: [],
    _running: 0,
    _maxConcurrent: 2,

    async call(systemPrompt, userPrompt, options = {}) {
      const s = getSettings();
      if (!s.subApiUrl || !s.subApiKey) {
        throw new Error('副API未配置：请在扩展设置中填写地址和 Key');
      }
      return new Promise((resolve, reject) => {
        this._queue.push({ systemPrompt, userPrompt, options, resolve, reject });
        this._processQueue();
      });
    },                          // ← call() 在这里完整结束

    _processQueue() {
      while (this._running < this._maxConcurrent && this._queue.length > 0) {
        this._running++;
        const task = this._queue.shift();
        this._doCall(task.systemPrompt, task.userPrompt, task.options)
          .then(task.resolve)
          .catch(task.reject)
          .finally(() => { this._running--; this._processQueue(); });
      }
    },

    async _doCall(systemPrompt, userPrompt, options = {}) {
      const s = getSettings();
      const maxRetries = options.retries ?? 3;
      let lastError;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const url = s.subApiUrl.replace(/\/+$/, '') + '/chat/completions';
          const body = {
            model: s.subApiModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: options.maxTokens ?? 800,
            temperature: options.temperature ?? 0.8,
          };
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), options.timeout ?? 30000);
          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${s.subApiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
          }
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content ?? '';
          if (!content) throw new Error('API返回空内容');
          return content;
        } catch (e) {
          lastError = e;
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          }
        }
      }
      throw lastError;
    },

    // ── 获取可用模型列表（不消耗token，仅测试连接）──
    async fetchModels() {
      const s = getSettings();
      const url = (s.subApiUrl || '').trim();
      const key = (s.subApiKey || '').trim();
      if (!url || !key) throw new Error('请先填写副API地址和Key');

      const base = url.replace(/\/+$/, '').replace(/\/v1$/, '');
      const endpoint = base + '/v1/models';

      const resp = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${resp.statusText}`);

      const json = await resp.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      return list
        .map(m => (typeof m === 'string' ? m : m.id))
        .filter(Boolean)
        .sort();
    },

  };  // ← SubAPI 对象在这里结束
  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_05  通知系统 + 错误日志                        │
  // └──────────────────────────────────────────────────────┘
  const Notify = {
    _notifs: [],
    _errors: [],
    _max: 50,

    add(title, message, icon = '📻') {
      const item = { id: Date.now(), icon, title, message, time: timeNow(), read: false };
      this._notifs.unshift(item);
      if (this._notifs.length > this._max) this._notifs.pop();
      EventBus.emit('notification:new', item);
      this._updateBadge();
      return item;
    },

    error(source, err) {
      const item = {
        id: Date.now(), source,
        message: err?.message ?? String(err),
        stack: err?.stack ?? '',
        time: fullTimeNow(),
      };
      this._errors.unshift(item);
      if (this._errors.length > this._max) this._errors.pop();
      ERR(`[${source}]`, err);
      EventBus.emit('error:new', item);
      return item;
    },

    unreadCount() { return this._notifs.filter(n => !n.read).length; },

    markAllRead() {
      this._notifs.forEach(n => n.read = true);
      this._updateBadge();
    },

    _updateBadge() {
      const count = this.unreadCount();
      const el = document.getElementById('freq-notif-badge');
      if (el) { el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none'; }
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_06  Phone Shell — 手机外壳                     │
  // └──────────────────────────────────────────────────────┘
  const appRegistry = [];
  let currentAppId = null;
  let phoneOpen = false;

  function registerApp(app) {
    app._badge = app._badge ?? 0;
    appRegistry.push(app);
  }

  function buildPhoneHTML() {
    return `
      <div id="freq-phone-shell" style="display:none;">
        <div class="freq-phone">
          <div class="freq-phone-notch">
            <span class="freq-phone-signal">📶</span>
            <span class="freq-phone-title">FREQ · TERMINAL</span><span class="freq-phone-time" id="freq-clock">--:--</span>
          </div>
          <div class="freq-phone-screen">
            <div class="freq-home" id="freq-home">
              <div class="freq-app-grid" id="freq-app-grid"></div>
            </div>
            <div class="freq-app-view" id="freq-app-view" style="display:none;"></div>
          </div>
          <div class="freq-phone-bar">
            <button class="freq-bar-btn" id="freq-home-btn" title="主屏幕">◼</button>
            <button class="freq-bar-btn" id="freq-notif-btn" title="通知中心">🔔<span class="freq-badge freq-notif-badge" id="freq-notif-badge" style="display:none;">0</span></button>
          </div>
        </div><button class="freq-close-btn" id="freq-close-btn" title="关闭">✕</button>
      </div>
      <button id="freq-fab" title="打开频率终端">📻</button>
    `;
  }

  function renderAppGrid() {
    const grid = document.getElementById('freq-app-grid');
    if (!grid) return;
    grid.innerHTML = '';
    appRegistry.forEach(app => {
      const btn = document.createElement('button');
      btn.className = 'freq-app-icon';
      btn.innerHTML = `
        <span class="freq-app-icon-emoji">${app.icon}</span>
        <span class="freq-app-icon-name">${app.name}</span>
        ${app._badge > 0 ? `<span class="freq-badge">${app._badge}</span>` : ''}
      `;
      btn.addEventListener('click', () => openApp(app.id));
      grid.appendChild(btn);
    });
  }

  function openApp(appId) {
    const app = appRegistry.find(a => a.id === appId);
    if (!app) return;
    if (currentAppId && currentAppId !== appId) {
      const prev = appRegistry.find(a => a.id === currentAppId);
      if (prev?.unmount) prev.unmount();
    }
    const homeEl = document.getElementById('freq-home');
    const viewEl = document.getElementById('freq-app-view');
    if (!homeEl || !viewEl) return;
    homeEl.style.display = 'none';
    viewEl.style.display = 'flex';
    viewEl.innerHTML = '';
    currentAppId = appId;
    app._badge = 0;
    renderAppGrid();
    if (app.mount) app.mount(viewEl);
  }

  function goHome() {
    if (currentAppId) {
      const app = appRegistry.find(a => a.id === currentAppId);
      if (app?.unmount) app.unmount();currentAppId = null;
    }
    const homeEl = document.getElementById('freq-home');
    const viewEl = document.getElementById('freq-app-view');
    if (homeEl) homeEl.style.display = 'flex';
    if (viewEl) { viewEl.style.display = 'none'; viewEl.innerHTML = ''; }
  }

  function togglePhone() {
    phoneOpen = !phoneOpen;
    const shell = document.getElementById('freq-phone-shell');
    const fab = document.getElementById('freq-fab');
    if (shell) shell.style.display = phoneOpen ? 'flex' : 'none';
    if (fab) fab.classList.toggle('freq-fab-active', phoneOpen);
    if (phoneOpen) renderAppGrid();
  }

  function updateClock() {
    const el = document.getElementById('freq-clock');
    if (el) el.textContent = timeNow();
  }

function buildSettingsHTML() {
    const s = getSettings();
    const promptLabels = {
      cosmic:               '🌌 宇宙频率·感知',
      scanner:              '📡 弦外之音',
      weather:              '🌦️ 信号气象站',
      forum_post:           '💬 留言板·发帖',
      forum_reply:          '💬 留言板·回复',
      checkin_comment:      '📅 打卡·角色评论',
      checkin_auto:         '📅 打卡·角色自动打卡',
      emotion:              '📊 情绪电波仪',
      dream:                '🌙 梦境记录仪',
      capsule_seal:         '💊 时光胶囊·封存感言',
      delivery_menu:        '🍜 跨次元配送·菜单',
      delivery_comment:     '🍜 跨次元配送·送餐台词',
      calendar_event:       '🗓️ 双线轨道·事件提取',
      calendar_resonance:   '🗓️ 双线轨道·共鸣感想',
      map_generate:         '🗺️ 异界探索·世界生成',
      map_detail:           '🗺️ 异界探索·地点详情',
      map_event:            '🗺️ 异界探索·探索感想',
      novel_generate:       '📖 频道文库·AI写作',
      novel_comment:        '📖 频道文库·NPC评论',
      blackbox_conversation:'🔒 黑匣子·秘密对话',
      blackbox_plan:        '🔒 黑匣子·节目策划',
      blackbox_comm:        '🔒 黑匣子·内部通讯',
      blackbox_diary:       '🔒 黑匣子·秘密日记',
          inbox_message: '私信收件箱·角色主动私信',
    inbox_reply:   '私信收件箱·角色回复',
    };

    const promptEditorHTML = Object.entries(promptLabels).map(([key, label]) => `
      <div class="freq-s-row freq-s-prompt-row">
        <div class="freq-s-prompt-header">
          <span>${label}</span>
          <button class="freq-s-reset-btn" data-prompt-key="${key}" title="恢复默认">↺ 恢复默认</button>
        </div>
        <textarea
          id="freq_prompt_${key}"
          class="freq-s-prompt-textarea"
          placeholder="${escapeHtml(PROMPT_DEFAULTS[key] || '')}"
          rows="4"
        >${escapeHtml(s.prompts?.[key] ?? '')}</textarea>
        <span class="freq-s-prompt-hint">留空则使用默认 Prompt</span>
      </div>
    `).join('');

    const pluginEnabled = s.pluginEnabled !== false;
    const bbAutoOn      = !!s.blackboxAutoIntercept;
    const bbRate        = s.blackboxInterceptRate ?? 20;

    return `
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>📻Freq · Terminal</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content" style="font-size:small;">
          <div class="freq-settings-inner">

            <!-- ══ 插件总开关 ══ -->
            <div class="freq-s-power-row">
              <div class="freq-s-power-info">
                <div class="freq-s-power-title">📻 失真电台终端</div>
                <div class="freq-s-power-sub">freq-terminal · 插件状态</div>
              </div>
              <button class="freq-s-power-btn ${pluginEnabled ? 'freq-power-on' : 'freq-power-off'}"
                      id="freq_plugin_toggle">
                ${pluginEnabled ? '✅ 插件已启用' : '⛔ 插件已禁用'}
              </button>
            </div>

            <div class="freq-s-section-divider"></div>

            <!-- ══ 副API 触发说明 ══ -->
            <div class="freq-s-notice-box">
              <div class="freq-s-notice-title">📋 副API 触发说明</div>
              <div class="freq-s-notice-row">
                <span class="freq-s-tag freq-s-tag-auto">自动触发</span>
                <span>黑匣子·自动截获（可在下方开关控制）</span>
              </div>
              <div class="freq-s-notice-row">
                <span class="freq-s-tag freq-s-tag-manual">手动触发</span>
                <span>宇宙频率、弦外之音、信号气象站、留言板、打卡评论、情绪电波、梦境记录、时光胶囊、跨次元配送、双线轨道、异界探索、频道文库、黑匣子·手动截获</span>
              </div>
            </div>

            <!-- ══ 副API 配置 ══ -->
            <div class="freq-s-section-label">⚡ 副API 配置</div>

            <label class="freq-s-row">
              <span>API 地址</span>
              <input type="text" id="freq_sub_api_url" class="text_pole"
                placeholder="https://api.openai.com"
                value="${s.subApiUrl ?? ''}" />
            </label>
            <div class="freq-s-field-hint">填写服务商根地址（无需加 /v1/chat/completions）</div>

            <label class="freq-s-row">
              <span>API Key</span>
              <input type="password" id="freq_sub_api_key" class="text_pole"
                placeholder="sk-..."
                value="${s.subApiKey ?? ''}" />
            </label>

            <!-- 模型选择 + 测试连接 -->
            <div class="freq-s-row">
              <span>模型</span>
              <div class="freq-s-model-group">
                <input type="text" id="freq_sub_api_model" class="text_pole freq-s-model-input"
                  placeholder="gpt-4o-mini"
                  value="${s.subApiModel ?? ''}" />
                <button class="freq-s-test-btn" id="freq_test_connection">🔌 测试连接</button>
              </div>
            </div>
            <div id="freq_model_status" class="freq-s-model-status"></div>
            <select id="freq_model_select" class="text_pole freq-s-model-select" style="display:none;">
              <option value="">— 从列表选择模型 —</option>
            </select>
            <div class="freq-s-field-hint">点击「测试连接」自动获取可用模型；也可直接手动填写模型名</div>

            <label class="freq-s-row">
              <span>和风天气 Key（可选）</span>
              <input type="text" id="freq_weather_key" class="text_pole"
                placeholder="信号气象站使用"
                value="${s.weatherKey ?? ''}" />
            </label>

            <label class="freq-s-row">
              <span>异界探索·地点数量（首次生成）</span>
              <input type="number" id="freq_map_location_count" class="text_pole"
                min="4" max="20" placeholder="10"
                value="${s.mapLocationCount ?? 10}" />
            </label>

            <div class="freq-s-section-divider"></div>

            <!-- ══ 自动触发设置 ══ -->
            <div class="freq-s-section-label">🤖 自动触发设置</div>

            <!-- 黑匣子·自动截获 -->
            <div class="freq-s-toggle-row">
              <div class="freq-s-toggle-info">
                <div class="freq-s-toggle-title">🔒 黑匣子·自动截获</div>
                <div class="freq-s-toggle-sub">每次收到新消息时，有一定概率自动截获一份加密档案</div>
              </div>
              <label class="freq-s-switch">
                <input type="checkbox" id="freq_blackbox_auto" ${bbAutoOn ? 'checked' : ''} />
                <span class="freq-s-switch-slider"></span>
              </label>
            </div>

            <div id="freq_blackbox_rate_row" class="freq-s-rate-row"
                 style="${bbAutoOn ? '' : 'display:none;'}">
              <span>触发概率</span>
              <div class="freq-s-rate-options">
                ${[
                  [10, '低频 10%'],
                  [20, '普通 20%'],
                  [30, '频繁 30%'],
                ].map(([val, label]) => `
                  <label class="freq-s-rate-opt">
                    <input type="radio" name="freq_bb_rate" value="${val}"
                      ${bbRate === val ? 'checked' : ''} />
                    <span>${label}</span>
                  </label>`).join('')}
              </div>
            </div>

            <!-- 私信收件箱·自动触发 -->
            <div class="freq-s-toggle-row">
              <div class="freq-s-toggle-info">
                <div class="freq-s-toggle-title">📬 私信收件箱·自动触发</div>
                <div class="freq-s-toggle-sub">用户沉默超过设定时间后，角色主动发来一条私信</div>
              </div>
              <label class="freq-s-switch">
                <input type="checkbox" id="freq_inbox_enabled"
                  ${s.inboxEnabled !== false ? 'checked' : ''} />
                <span class="freq-s-switch-slider"></span>
              </label>
            </div>

            <div id="freq_inbox_config" class="freq-s-rate-row"
                 style="${s.inboxEnabled !== false ? '' : 'display:none;'}">
              <span>沉默阈值</span>
              <div class="freq-s-rate-options" style="margin-bottom:8px;">
                ${[
                  [30,   '30 分钟'],
                  [60,   '1 小时'],
                  [240,  '4 小时'],
                  [1440, '1 天'],
                ].map(([val, label]) => `
                  <label class="freq-s-rate-opt">
                    <input type="radio" name="freq_inbox_threshold" value="${val}"
                      ${(s.inboxThreshold ?? 30) === val ? 'checked' : ''} />
                    <span>${label}</span>
                  </label>`).join('')}
              </div>
              <div style="margin-top:6px;">
                <span style="font-size:11px;color:#888;">自定义阈值（分钟，填写后优先生效）</span>
                <input type="number" id="freq_inbox_custom" class="text_pole"
                  min="1" placeholder="例如：45"
                  value="${s.inboxCustomMinutes || ''}"
                  style="margin-top:4px;" />
              </div>
              <div class="freq-s-field-hint">
                冷却时间：角色发送私信后，随机等待 60~120 分钟才会再次触发
              </div>
            </div>

            <div class="freq-s-section-divider"></div>
            
            <!-- ══ Prompt 编辑器 ══ -->
            <div class="freq-s-collapse" id="freq-prompt-editor-toggle">
              <span>✏️ Prompt Editor</span>
              <span class="freq-s-collapse-arrow">▼</span>
            </div>
            <div class="freq-s-collapse-body" id="freq-prompt-editor-body" style="display:none;">
              <div class="freq-s-prompt-tip">覆盖各App 的默认 Prompt。留空则使用内置默认值。支持 {占位符} 变量（与内置一致）。</div>
              ${promptEditorHTML}
            </div>

            <div id="freq_settings_status"
                 style="color:#4caf50;font-size:11px;min-height:16px;margin-top:4px;"></div>
          </div>
        </div>
      </div>
    `;
  }
function bindSettingsEvents() {
    const _status = (msg, color = '#4caf50') => {
      const el = document.getElementById('freq_settings_status');
      if (!el) return;
      el.style.color = color;
      el.textContent = msg;
      setTimeout(() => { el.textContent = ''; }, 1800);
    };

    // ── 插件总开关 ──
    const powerBtn = document.getElementById('freq_plugin_toggle');
    if (powerBtn) {
      powerBtn.addEventListener('click', () => {
        const cur = getSettings().pluginEnabled !== false;
        saveSettings({ pluginEnabled: !cur });
        powerBtn.textContent = !cur ? '✅ 插件已启用' : '⛔ 插件已禁用';
        powerBtn.className   = 'freq-s-power-btn ' + (!cur ? 'freq-power-on' : 'freq-power-off');
        _status(!cur ? '插件已启用，刷新页面后完全生效' : '插件已禁用，刷新页面后完全生效');
      });
    }

    // ── 基础输入字段 ──
    [
      { id: 'freq_sub_api_url',        key: 'subApiUrl' },
      { id: 'freq_sub_api_key',        key: 'subApiKey' },
      { id: 'freq_sub_api_model',      key: 'subApiModel' },
      { id: 'freq_weather_key',        key: 'weatherKey' },
      { id: 'freq_map_location_count', key: 'mapLocationCount' },
    ].forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        saveSettings({ [key]: el.value.trim() });
        _status('✓ 已保存');
      });
    });

    // ── 测试连接 + 获取模型列表 ──
    const testBtn     = document.getElementById('freq_test_connection');
    const statusEl    = document.getElementById('freq_model_status');
    const modelSelect = document.getElementById('freq_model_select');
    const modelInput  = document.getElementById('freq_sub_api_model');

    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        testBtn.disabled    = true;
        testBtn.textContent = '🔄 连接中…';
        if (statusEl) { statusEl.className = 'freq-s-model-status'; statusEl.textContent = ''; }
        if (modelSelect) modelSelect.style.display = 'none';

        try {
          const models = await SubAPI.fetchModels();

          if (statusEl) {
            statusEl.className   = 'freq-s-model-status freq-s-status-ok';
            statusEl.textContent = `✅ 连接成功，获取到 ${models.length} 个可用模型`;
          }

          if (modelSelect) {
            const cur = getSettings().subApiModel || '';
            modelSelect.innerHTML =
              '<option value="">— 从列表选择模型 —</option>' +
              models.map(m =>
                `<option value="${m}"${m === cur ? ' selected' : ''}>${m}</option>`
              ).join('');
            modelSelect.style.display = 'block';
          }
        } catch (e) {
          if (statusEl) {
            statusEl.className   = 'freq-s-model-status freq-s-status-err';
            statusEl.textContent = `❌ 连接失败：${e.message}`;
          }
          if (modelSelect) modelSelect.style.display = 'none';
        } finally {
          testBtn.disabled    = false;
          testBtn.textContent = '🔌 测试连接';
        }
      });
    }

    // 从下拉列表选模型 → 同步到输入框
    if (modelSelect && modelInput) {
      modelSelect.addEventListener('change', function () {
        if (!this.value) return;
        modelInput.value = this.value;
        saveSettings({ subApiModel: this.value });
        _status('✓ 已保存');
      });
    }

    // ── 黑匣子自动截获开关 ──
    const autoToggle = document.getElementById('freq_blackbox_auto');
    const rateRow    = document.getElementById('freq_blackbox_rate_row');
    if (autoToggle && rateRow) {
      autoToggle.addEventListener('change', function () {
        saveSettings({ blackboxAutoIntercept: this.checked });
        rateRow.style.display = this.checked ? '' : 'none';
        _status('✓ 已保存');
      });
    }

    // ── 触发概率单选 ──
    document.querySelectorAll('input[name="freq_bb_rate"]').forEach(radio => {
      radio.addEventListener('change', function () {
        saveSettings({ blackboxInterceptRate: parseInt(this.value, 10) });
        _status('✓ 已保存');
      });
    });

    // ── 私信收件箱开关 ──
    const inboxToggle = document.getElementById('freq_inbox_enabled');
    const inboxConfig = document.getElementById('freq_inbox_config');
    if (inboxToggle && inboxConfig) {
      inboxToggle.addEventListener('change', function () {
        saveSettings({ inboxEnabled: this.checked });
        inboxConfig.style.display = this.checked ? '' : 'none';
        EventBus.emit('inbox:settings_changed');
        _status('✓ 已保存');
      });
    }

    // ── 私信沉默阈值单选 ──
    document.querySelectorAll('input[name="freq_inbox_threshold"]').forEach(radio => {
      radio.addEventListener('change', function () {
        saveSettings({ inboxThreshold: parseInt(this.value, 10) });
        EventBus.emit('inbox:settings_changed');
        _status('✓ 已保存');
      });
    });

    // ── 私信自定义阈值输入 ──
    const inboxCustom = document.getElementById('freq_inbox_custom');
    if (inboxCustom) {
      inboxCustom.addEventListener('input', function () {
        const val = parseInt(this.value, 10);
        saveSettings({ inboxCustomMinutes: isNaN(val) ? '' : val });
        EventBus.emit('inbox:settings_changed');
        _status('✓ 已保存');
      });
    }

    // ── Prompt Editor 折叠 ──
    const toggle = document.getElementById('freq-prompt-editor-toggle');
    const body   = document.getElementById('freq-prompt-editor-body');
    if (toggle && body) {
      toggle.addEventListener('click', () => {
        const open  = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        const arrow = toggle.querySelector('.freq-s-collapse-arrow');
        if (arrow) arrow.textContent = open ? '▼' : '▲';
      });
    }

    // ── Prompt textarea 绑定 ──
    [
      'cosmic', 'scanner', 'weather',
      'forum_post', 'forum_reply',
      'checkin_comment', 'checkin_auto',
      'emotion', 'dream', 'capsule_seal',
      'delivery_menu', 'delivery_comment',
      'calendar_event', 'calendar_resonance',
      'map_generate', 'map_detail', 'map_event',
      'novel_generate', 'novel_comment',
      'blackbox_conversation', 'blackbox_plan', 'blackbox_comm', 'blackbox_diary',
      'inbox_message', 'inbox_reply',
    ].forEach(key => {
      const el = document.getElementById(`freq_prompt_${key}`);
      if (!el) return;
      el.addEventListener('input', () => {
        const s = getSettings();
        s.prompts[key] = el.value;
        if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
        _status('✓ 已保存');
      });
    });

    // ── 恢复默认按钮 ──
    document.querySelectorAll('.freq-s-reset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.promptKey;
        const el  = document.getElementById(`freq_prompt_${key}`);
        if (!el) return;
        el.value = '';
        const s = getSettings();
        delete s.prompts[key];
        if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
        _status('↺ 已恢复默认');
      });
    });
  }

  function loadSettingsCSS() {
    const extensionPath = `scripts/extensions/third-party/${EXTENSION_NAME}`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${extensionPath}/settings.css`;
    document.head.appendChild(link);
  }


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_08  主界面 CSS动态注入                         │
  // └──────────────────────────────────────────────────────┘
  function injectMainCSS() {
    if (document.getElementById('freq-terminal-main-css')) return;
    const style = document.createElement('style');
    style.id = 'freq-terminal-main-css';
    style.textContent = `
/*══════════════════════════════════════════════════════════📻 FREQ · TERMINAL v0.3.0 — 主界面样式
  ══════════════════════════════════════════════════════════ */

/*──悬浮球 ── */
#freq-fab {
  position: fixed; bottom: 80px; right: 20px;
  width: 52px; height: 52px; border-radius: 50%;
  background: #1a1a1a; border: 2px solid #A32D2D;
  font-size: 22px; cursor: pointer; z-index: 99999;
  box-shadow: 0 4px 20px rgba(163,45,45,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex; align-items: center; justify-content: center;
  line-height: 1; padding: 0;
}
#freq-fab:hover { transform: scale(1.12); box-shadow: 0 6px 28px rgba(163,45,45,0.6); }
#freq-fab.freq-fab-active { background: #A32D2D; box-shadow: 0 6px 28px rgba(163,45,45,0.8); }

/* ── 手机外壳 ── */
#freq-phone-shell {
  position: fixed; bottom: 140px; right: 20px; z-index: 99998;
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
  animation: freq-slide-up 0.25s ease;
}
@keyframes freq-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.freq-phone {
  width: 320px; height: 580px; background: #0e0e0e;
  border-radius: 36px; border: 2px solid #2a2a2a;
  box-shadow: 0 0 0 1px #111, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
  display: flex; flex-direction: column; overflow: hidden;
  font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
}

/* ── 刘海 ── */
.freq-phone-notch {
  height: 44px; background: #0a0a0a;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; border-bottom: 1px solid #1e1e1e; flex-shrink: 0;
}
.freq-phone-signal { font-size: 12px; }
.freq-phone-title { font-size: 11px; font-weight: bold; color: #A32D2D; letter-spacing: 2px; }
.freq-phone-time { font-size: 12px; color: #666; font-variant-numeric: tabular-nums; }

/* ── 屏幕 ── */
.freq-phone-screen { flex: 1; overflow: hidden; position: relative; background: #111; }
.freq-home { width: 100%; height: 100%; display: flex; flex-direction: column; overflow-y: auto; }
.freq-app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 16px 10px; }

/* ── App 图标 ── */
.freq-app-icon {
  background: none; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 2px; border-radius: 12px; position: relative;
  transition: background 0.15s; color: inherit;
}
/* ✅ FIX Bug2: 原代码 "background0.15s" 缺少空格，已修正为 "background 0.15s" */
.freq-app-icon:hover { background: rgba(255,255,255,0.06); }
.freq-app-icon-emoji { font-size: 26px; line-height: 1; }
.freq-app-icon-name {
  font-size: 9px; color: #aaa; text-align: center; line-height: 1.2;
  max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── 角标 ── */
.freq-badge {
  position: absolute; top: 2px; right: 2px;
  background: #A32D2D; color: #fff; font-size: 9px; font-weight: bold;
  min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px; line-height: 1;
}
.freq-notif-badge {
  position: relative; top: auto; right: auto;
  margin-left: 2px; font-size: 8px; min-width: 14px; height: 14px;
}

/* ── App 视图 ── */
#freq-app-view { display: flex; width: 100%; height: 100%; flex-direction: column; overflow: hidden; color: #ddd; }

/* ── 底部栏 ── */
.freq-phone-bar {
  height: 40px; background: #0a0a0a; border-top: 1px solid #1e1e1e;
  display: flex; align-items: center; justify-content: center; gap: 24px; flex-shrink: 0;
}
.freq-bar-btn {
  background: none; border: 1px solid #333; border-radius: 6px;
  color: #666; font-size: 10px; padding: 4px 14px; cursor: pointer;
  transition: border-color 0.15s, color 0.15s; position: relative;
}
.freq-bar-btn:hover { border-color: #A32D2D; color: #A32D2D; }

/* ── 关闭 ── */
.freq-close-btn {
  background: #1a1a1a; border: 1px solid #333; border-radius: 50%;
  color: #666; width: 28px; height: 28px; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.15s, color 0.15s; align-self: flex-end; padding: 0; line-height: 1;
}
.freq-close-btn:hover { border-color: #A32D2D; color: #A32D2D; }

/* ── App 通用── */
.freq-app-header {
  padding: 12px 16px; background: #0d0d0d; border-bottom: 1px solid #1e1e1e;
  font-size: 13px; font-weight: bold; color: #A32D2D; letter-spacing: 1px; flex-shrink: 0;
}
.freq-app-body { flex: 1; overflow-y: auto; padding: 12px; }
.freq-app-body::-webkit-scrollbar { width: 3px; }
.freq-app-body::-webkit-scrollbar-track { background: transparent; }
.freq-app-body::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
.freq-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; min-height: 300px; color: #444; font-size: 12px; gap: 8px;
}
.freq-empty-icon { font-size: 32px; opacity: 0.4; }

/* ══════════════════════════════════════════════════════════
   BLOCK_10电台归档
   ══════════════════════════════════════════════════════════ */
.freq-archive-search { padding: 0 0 10px; }
.freq-archive-search input {
  width: 100%; background: #1a1a1a; border:1px solid #2a2a2a; border-radius: 8px;
  padding: 8px 12px; color: #ccc; font-size: 11px; outline: none; box-sizing: border-box;
  transition: border-color 0.15s;
}
.freq-archive-search input:focus { border-color: #A32D2D; }
.freq-archive-search input::placeholder { color: #444; }
.freq-archive-list { display: flex; flex-direction: column; gap: 8px; }
.freq-archive-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 10px 12px; cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.freq-archive-card:hover { border-color: #333; background: #1a1a1a; }
.freq-archive-card--open { border-color: rgba(163,45,45,0.27); background: #1a1212; }
.freq-archive-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.freq-archive-serial {
  font-size: 10px; font-weight: bold; color: #A32D2D;
  background: rgba(163,45,45,0.13); padding: 2px 6px; border-radius: 4px;
}
.freq-archive-time { font-size: 10px; color: #555; font-variant-numeric: tabular-nums; }
.freq-archive-scene { font-size: 11px; color: #888; line-height: 1.4; }
.freq-archive-detail { margin-top: 8px; }
.freq-archive-plot {
  font-size: 11px; color: #aaa; line-height: 1.5; padding-top: 8px;
  border-top: 1px solid #222; white-space: pre-wrap; word-break: break-word;
}
.freq-archive-seeds {
  font-size: 10px; color: rgba(163,45,45,0.6); line-height: 1.4; margin-top: 6px;
  padding: 6px 8px; background: rgba(163,45,45,0.07); border-radius: 6px;
}
.freq-archive-event { font-size: 10px; color: #6a9955; margin-top: 4px; }

/* ══════════════════════════════════════════════════════════
   BLOCK_11 后台录音室
   ══════════════════════════════════════════════════════════ */
.freq-studio-modes { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
.freq-studio-mode-btn {
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
  color: #888; font-size: 11px; padding: 6px 10px; cursor: pointer;
  transition: all 0.15s; flex: 1; min-width: 80px; text-align: center;
}
.freq-studio-mode-btn:hover { border-color: #444; color: #ccc; }
.freq-studio-mode-active { background: rgba(163,45,45,0.13); border-color: #A32D2D; color: #A32D2D; }

.freq-studio-panel { animation: freq-fade-in 0.2s ease; }
@keyframes freq-fade-in { from { opacity: 0; } to { opacity: 1; } }

.freq-studio-panel-desc {
  font-size: 11px; color: #666; line-height: 1.5; margin-bottom: 12px;
  padding: 8px 10px; background: #161616; border-radius: 8px; border-left: 3px solid #333;
}
.freq-studio-panel-desc b { color: #A32D2D; }

.freq-studio-textarea {
  width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
  padding: 8px 12px; color: #ccc; font-size: 11px; outline: none; box-sizing: border-box;
  resize: vertical; font-family: inherit; transition: border-color 0.15s; min-height: 60px;
}
.freq-studio-textarea:focus { border-color: #A32D2D; }
.freq-studio-textarea::placeholder { color: #444; }
.freq-studio-input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }

.freq-studio-action-btn {
  background: #A32D2D; color: #fff; border: none; border-radius: 8px;
  padding: 8px 16px; font-size: 12px; cursor: pointer; transition: all 0.15s;
  font-weight: bold; letter-spacing: 0.5px;
}
.freq-studio-action-btn:hover { background: #c43a3a; }
.freq-studio-action-btn:disabled { background: #333; color: #666; cursor: not-allowed; }

.freq-studio-result { margin-top: 12px; }
.freq-studio-loading {
  text-align: center; color: #A32D2D; font-size: 12px; padding: 20px;
  animation: freq-pulse 1.5s ease-in-out infinite;
}
@keyframes freq-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

.freq-studio-error {
  background: #2a1515; border: 1px solid rgba(163,45,45,0.27); border-radius: 8px;
  padding: 10px 12px; color: #e88; font-size: 11px; line-height: 1.4;
}
.freq-studio-output {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 12px; animation: freq-fade-in 0.3s ease;
}

/* 对话体 */
.freq-dialogue-line { margin-bottom: 8px; line-height: 1.5; }
.freq-dialogue-name {
  font-size: 11px; font-weight: bold; padding: 1px 6px; border-radius: 4px;
  margin-right: 6px; display: inline-block;
}
.freq-dialogue-host { background: rgba(163,45,45,0.2); color: #A32D2D; }
.freq-dialogue-guest { background: rgba(8,80,65,0.3); color: #4ec9a0; }
.freq-dialogue-text { font-size: 11px; color: #ccc; }
.freq-dialogue-narration { font-size: 10px; color: #555; font-style: italic; margin: 4px 0; }

/* 独白 */
.freq-studio-monologue-output { border-left: 3px solid rgba(163,45,45,0.27); }
.freq-studio-monologue-header { font-size: 11px; color: #A32D2D; font-weight: bold; margin-bottom: 8px; }
.freq-studio-monologue-text { font-size: 11px; color: #bbb; line-height: 1.6; white-space: pre-wrap; }

/* Thinking */
.freq-thinking-list { display: flex; flex-direction: column; gap: 8px; }
.freq-thinking-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 10px 12px; cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.freq-thinking-card:hover { border-color: #333; background: #1a1a1a; }
.freq-thinking-card--open { border-color: rgba(60,52,137,0.27); background: #18161f; }
.freq-thinking-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.freq-thinking-serial { font-size: 10px; font-weight: bold; color: #9b8ec4; }
.freq-thinking-msg-idx { font-size: 9px; color: #555; }
.freq-thinking-preview { font-size: 11px; color: #777; line-height: 1.4; }
.freq-thinking-full { font-size: 11px; color: #aaa; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }

/* 录音存档 */
.freq-studio-history { margin-top: 16px; border-top: 1px solid #222; padding-top: 12px; }
.freq-studio-history-title { font-size: 11px; color: #666; font-weight: bold; margin-bottom: 8px; }
.freq-history-card {
  background: #131313; border: 1px solid #1e1e1e; border-radius: 8px;
  padding: 8px 10px; margin-bottom: 6px; cursor: pointer; transition: border-color 0.15s;
}
.freq-history-card:hover { border-color: #333; }
.freq-history-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.freq-history-card-header span:first-child { font-size: 11px; color: #aaa; }
.freq-history-time { font-size: 9px; color: #444; }
.freq-history-preview { font-size: 10px; color: #555; line-height: 1.3; }
.freq-history-full {
  font-size: 11px; color: #bbb; line-height: 1.5; margin-top: 6px;
  padding-top: 6px; border-top: 1px solid #1e1e1e;
}

/* ══════════════════════════════════════════════════════════
   BLOCK_12 通知中心
   ══════════════════════════════════════════════════════════ */
.freq-notif-tab-btn {
  background: none; border: 1px solid #333; border-radius: 4px;
  color: #666; font-size: 10px; padding: 2px 8px; cursor: pointer; transition: all 0.15s;
}
.freq-notif-tab-btn:hover { border-color: #555; color: #aaa; }
.freq-notif-tab-active { border-color: #A32D2D; color: #A32D2D; }

.freq-notif-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 10px; background: #161616; border-radius: 8px;
  border: 1px solid #1e1e1e; transition: border-color 0.15s; margin-bottom: 6px;
}
.freq-notif-unread { border-color: rgba(163,45,45,0.27); background: #1a1212; }
.freq-notif-icon { font-size: 16px; flex-shrink: 0; margin-top: 2px; }
.freq-notif-content { flex: 1; min-width: 0; }
.freq-notif-title { font-size: 11px; color: #ccc; font-weight: bold; }
.freq-notif-msg { font-size: 10px; color: #888; margin-top: 2px; line-height: 1.3; }
.freq-notif-time { font-size: 9px; color: #444; flex-shrink: 0; margin-top: 2px; }

.freq-error-item {
  padding: 8px 10px; background: #1a1515; border-radius: 8px;
  border: 1px solid #2a1e1e; cursor: pointer; transition: border-color 0.15s; margin-bottom: 6px;
}
.freq-error-item:hover { border-color: rgba(163,45,45,0.27); }
.freq-error-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.freq-error-source { font-size: 10px; color: #e88; font-weight: bold; }
.freq-error-time { font-size: 9px; color: #555; }
.freq-error-msg { font-size: 11px; color: #c99; line-height: 1.4; }
.freq-error-stack {
  font-size: 9px; color: #666; margin-top: 6px; padding: 6px 8px;
  background: #111; border-radius: 4px; font-family: monospace;
  white-space: pre-wrap; word-break: break-all; max-height: 120px; overflow-y: auto;
}

/* ══════════════════════════════════════════════════════════
   BLOCK_13朋友圈·电波
   ══════════════════════════════════════════════════════════ */
.freq-moments-refresh-btn {
  background: none; border: 1px solid #333; border-radius: 4px;
  color: #888; font-size: 10px; padding: 2px 8px; cursor: pointer; transition: all 0.15s;
}
.freq-moments-refresh-btn:hover { border-color: #A32D2D; color: #A32D2D; }

.freq-moments-feed { display: flex; flex-direction: column; gap: 10px; }

.freq-moment-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 12px; transition: border-color 0.15s;
}
.freq-moment-card:hover { border-color: #333; }

.freq-moment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.freq-moment-avatar { font-size: 24px; line-height: 1; }
.freq-moment-meta { display: flex; flex-direction: column; }
.freq-moment-name { font-size: 12px; color: #ccc; font-weight: bold; }
.freq-moment-time { font-size: 9px; color: #555; }

.freq-moment-content { font-size: 11px; color: #bbb; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }

.freq-moment-hashtag { font-size: 10px; color: #5b8dd9; margin-top: 6px; }

.freq-moment-footer { margin-top: 8px; padding-top: 8px; border-top: 1px solid #1e1e1e; }
.freq-moment-likes { font-size: 10px; color: #666; }

.freq-moment-comment {
  font-size: 10px; color: #888; margin-top: 4px; padding: 4px 8px;
  background: #111; border-radius: 6px; line-height: 1.4;
}
.freq-moment-comment-name { color: #5b8dd9; font-weight: bold; }

/* ══════════════════════════════════════════════════════════
   BLOCK_14 信号气象站
   ══════════════════════════════════════════════════════════ */
.freq-weather-input-group { margin-bottom: 12px; }
.freq-weather-result { margin-top: 8px; }
.freq-weather-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 12px; animation: freq-fade-in 0.3s ease;
}
.freq-weather-line { font-size: 11px; color: #bbb; line-height: 1.6; margin-bottom: 2px; }
    `;document.head.appendChild(style);
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_10App · 电台归档                │
  // └──────────────────────────────────────────────────────┘
  const archiveApp = {
    id: 'archive', name: '电台归档', icon: '📡', _badge: 0, _container: null,

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
        if (this._container) this.mount(this._container);
      });
    },

    mount(container) {
      this._container = container;
      const records = extractAllMeowFM(getChatMessages());

      if (records.length === 0) {
        container.innerHTML = `
          <div class="freq-app-header">📡 电台归档</div>
          <div class="freq-app-body">
            <div class="freq-empty">
              <span class="freq-empty-icon">📻</span>
              <span>暂无连线记录</span>
              <span style="font-size:10px;color:#333;">等待 meow_FM 信号接入...</span>
            </div>
          </div>`;
        return;
      }

      const listHTML = records.map((r, i) => `
        <div class="freq-archive-card" data-idx="${i}">
          <div class="freq-archive-card-header">
            <span class="freq-archive-serial">${r.serial || '#' + (i + 1)}</span>
            <span class="freq-archive-time">${r.time || '未知时间'}</span>
          </div>
          <div class="freq-archive-scene">${escapeHtml(r.scene || '')}</div>
          <div class="freq-archive-detail" style="display:none;">
            <div class="freq-archive-plot">${escapeHtml(r.plot || '')}</div>
            ${r.seeds ? `<div class="freq-archive-seeds">${escapeHtml(r.seeds)}</div>` : ''}
            ${r.event ? `<div class="freq-archive-event">📅 ${escapeHtml(r.event)}</div>` : ''}
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <span>📡 电台归档</span>
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">${records.length} 条</span>
        </div>
        <div class="freq-app-body">
          <div class="freq-archive-search">
            <input type="text" id="freq-archive-search" placeholder="搜索关键词..." />
          </div>
          <div class="freq-archive-list">${listHTML}</div>
        </div>`;

      container.querySelectorAll('.freq-archive-card').forEach(card => {
        card.addEventListener('click', () => {
          const detail = card.querySelector('.freq-archive-detail');
          if (!detail) return;
          const open = detail.style.display !== 'none';
          detail.style.display = open ? 'none' : 'block';card.classList.toggle('freq-archive-card--open', !open);
        });
      });

      const si = container.querySelector('#freq-archive-search');
      if (si) {
        si.addEventListener('input', (e) => {
          const kw = e.target.value.toLowerCase();
          container.querySelectorAll('.freq-archive-card').forEach(c => {
            c.style.display = c.textContent.toLowerCase().includes(kw) ? '' : 'none';
          });
        });
      }
    },

    unmount() { this._container = null; },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_11  App · 后台录音室                │
  // └──────────────────────────────────────────────────────┘
  const studioApp = {
    id: 'studio', name: '后台录音室', icon: '🎙️', _badge: 0, _container: null,
    _history: [],

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;
      const charName = getCurrentCharName() || '???';

      container.innerHTML = `
        <div class="freq-app-header">🎙️ 后台录音室
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">LIVE ON AIR 🚬</span>
        </div>
        <div class="freq-app-body" id="freq-studio-body">
          <div class="freq-studio-modes">
            <button class="freq-studio-mode-btn freq-studio-mode-active" data-mode="thinking">💭 Thinking</button>
            <button class="freq-studio-mode-btn" data-mode="interview">🎤 演播厅</button>
            <button class="freq-studio-mode-btn" data-mode="monologue">📼 独白</button>
          </div>

          <div class="freq-studio-panel" id="freq-studio-thinking">
            <div class="freq-studio-panel-desc">窥探角色&lt;thinking&gt; 中的真实思绪。</div>
            <div id="freq-thinking-list" class="freq-thinking-list"></div>
          </div>

          <div class="freq-studio-panel" id="freq-studio-interview" style="display:none;">
            <div class="freq-studio-panel-desc">
              失真作为主持人采访 <b>${escapeHtml(charName)}</b>。写台本让失真代问，或留空让失真自由发挥。
            </div>
            <div class="freq-studio-input-group">
              <textarea id="freq-interview-input" class="freq-studio-textarea"
                placeholder="写下你想让失真问的问题...（留空则失真自由提问）" rows="3"></textarea>
              <button class="freq-studio-action-btn" id="freq-interview-go">🎤 开始采访</button>
            </div>
            <div id="freq-interview-result" class="freq-studio-result"></div>
          </div>

          <div class="freq-studio-panel" id="freq-studio-monologue" style="display:none;">
            <div class="freq-studio-panel-desc">
              <b>${escapeHtml(charName)}</b> 独自面对麦克风，录一段不会公开的私人磁带。
            </div>
            <button class="freq-studio-action-btn" id="freq-monologue-go">📼 开始录制</button>
            <div id="freq-monologue-result" class="freq-studio-result"></div>
          </div>

          <div class="freq-studio-history" id="freq-studio-history"></div>
        </div>`;

      // 模式切换
      container.querySelectorAll('.freq-studio-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.freq-studio-mode-btn').forEach(b => b.classList.remove('freq-studio-mode-active'));
          btn.classList.add('freq-studio-mode-active');
          const m = btn.dataset.mode;
          container.querySelector('#freq-studio-thinking').style.display  = m === 'thinking'? 'block' : 'none';
          container.querySelector('#freq-studio-interview').style.display = m === 'interview' ? 'block' : 'none';
          container.querySelector('#freq-studio-monologue').style.display = m === 'monologue' ? 'block' : 'none';
        });
      });

      this._renderThinkingList(container);
      container.querySelector('#freq-interview-go')?.addEventListener('click', () => this._doInterview(container));
      container.querySelector('#freq-monologue-go')?.addEventListener('click', () => this._doMonologue(container));
      this._renderHistory(container);
    },

    unmount() { this._container = null; },

    _renderThinkingList(container) {
      const el = container.querySelector('#freq-thinking-list');
      if (!el) return;
      const thinkings = extractAllThinking(getChatMessages());
      if (thinkings.length === 0) {
        el.innerHTML = `<div class="freq-empty" style="min-height:120px;">
          <span class="freq-empty-icon">💭</span><span>暂无 thinking 数据</span></div>`;
        return;
      }
      el.innerHTML = [...thinkings].reverse().map(t => `
        <div class="freq-thinking-card">
          <div class="freq-thinking-card-header">
            <span class="freq-thinking-serial">💭 #${t.serial}</span>
            <span class="freq-thinking-msg-idx">消息 ${t.index + 1}</span>
          </div>
          <div class="freq-thinking-preview">${escapeHtml(t.content.slice(0, 80))}${t.content.length > 80 ? '...' : ''}</div>
          <div class="freq-thinking-full" style="display:none;">${escapeHtml(t.content)}</div>
        </div>
      `).join('');

      el.querySelectorAll('.freq-thinking-card').forEach(card => {
        card.addEventListener('click', () => {
          const p = card.querySelector('.freq-thinking-preview');
          const f = card.querySelector('.freq-thinking-full');
          const isOpen = f.style.display !== 'none';
          p.style.display = isOpen ? 'block' : 'none';
          f.style.display = isOpen ? 'none' : 'block';
          card.classList.toggle('freq-thinking-card--open', !isOpen);
        });
      });
    },

    async _doInterview(container) {
      const resultEl = container.querySelector('#freq-interview-result');
      const btn = container.querySelector('#freq-interview-go');
      const input = container.querySelector('#freq-interview-input');
      if (!resultEl || !btn) return;

      const charName = getCurrentCharName() || '角色';
      const userQuestion = input?.value?.trim() ?? '';
      const latestPlot = getLatestPlot(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());

      btn.disabled = true;
      btn.textContent = '📡 信号连接中...';
      resultEl.innerHTML = '<div class="freq-studio-loading">📡 正在接通演播厅频率...</div>';

      const systemPrompt = `你现在要模拟一段电台采访。有两个角色：
1. 失真（主持人）：男性午夜摇滚乐电台主持人，自称"失真"，喜欢用颜文字，性格颓废，喜欢锐评他人，爱开玩笑，花花公子类型，难以接近，不喜欢白天，会deeptalk，但会为了链接频率照做。LIVE ON AIR🚬。称呼听众为"听众"。
2. ${charName}（嘉宾）：当前对话中的角色，请根据上下文推断其性格来扮演。

当前配乐：${radioShow?.bgm ?? '未知'}
最近剧情摘要：${latestPlot || '暂无'}

规则：
- 输出格式为对话体，每行以【失真】或【${charName}】开头
- 失真负责提问和点评，${charName}负责回答
- 保持各自性格特征，对话自然有趣
- 总共 4-6轮对话
- 不提及AI、模型、扮演等元信息`;

      const userPrompt = userQuestion
        ? `听众提交了台本问题，请失真用自己的方式抛给${charName}：\n「${userQuestion}」\n围绕这个问题展开采访。`
        : `失真自由发挥，根据当前剧情和氛围，随机挑一个有趣的话题采访${charName}。可以锐评、调侃、突然deeptalk。`;

      try {
        const result = await SubAPI.call(systemPrompt, userPrompt, { maxTokens: 1000, temperature: 0.85 });
        resultEl.innerHTML = `<div class="freq-studio-output">${this._fmtDialogue(result)}</div>`;this._addHistory('interview', userQuestion ? `台本：${userQuestion}` : '自由采访', result);
        Notify.add('后台录音室', `演播厅采访完成：失真 × ${charName}`, '🎤');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📡 信号中断：${escapeHtml(e.message)}</div>`;
        Notify.error('录音室·采访', e);
      } finally {
        btn.disabled = false;
        btn.textContent = '🎤 开始采访';
      }
    },

    async _doMonologue(container) {
      const resultEl = container.querySelector('#freq-monologue-result');
      const btn = container.querySelector('#freq-monologue-go');
      if (!resultEl || !btn) return;

      const charName = getCurrentCharName() || '角色';
      const latestPlot = getLatestPlot(getChatMessages());
      const latestThink = getLatestThinking(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());

      btn.disabled = true;
      btn.textContent = '📼 录制中...';
      resultEl.innerHTML = '<div class="freq-studio-loading">📼磁带转动中...</div>';

      let thinkInjection = '';
      if (latestThink) {
        thinkInjection = `\n\n以下是角色真实思绪片段（来自 thinking 标签）：\n「${latestThink.slice(-800)}」\n请以此为素材融入独白，保留未经整理的真实感。`;
      }

      const systemPrompt = `你是${charName}，现在不在正式广播中，独自面对一台老式录音机。
当前配乐氛围：${radioShow?.bgm ?? '未知'}
最近剧情摘要：${latestPlot || '暂无'}${thinkInjection}

任务：录一段不会公开的私人磁带。没有观众，没有主持人，只有你和录音机。
约束：严格保持角色性格 | 不提及 AI/模型/扮演 | 150-300字 | 只输出独白内容`;

      try {
        const result = await SubAPI.call(systemPrompt, '开始录制。', { maxTokens: 600, temperature: 0.85 });
        resultEl.innerHTML = `
          <div class="freq-studio-output freq-studio-monologue-output">
            <div class="freq-studio-monologue-header">📼 ${escapeHtml(charName)} 的私录磁带</div>
            <div class="freq-studio-monologue-text">${escapeHtml(result)}</div>
          </div>`;
        this._addHistory('monologue', `${charName} 的独白`, result);
        Notify.add('后台录音室', `${charName} 完成了一段私录`, '📼');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📼磁带卡带了：${escapeHtml(e.message)}</div>`;
        Notify.error('录音室·独白', e);
      } finally {
        btn.disabled = false;
        btn.textContent = '📼 开始录制';
      }
    },

    _fmtDialogue(text) {
      return text.split('\n').map(line => {
        const m = line.match(/^【(.+?)】(.*)$/);
        if (m) {
          const isHost = m[1] === '失真';
          return `<div class="freq-dialogue-line">
            <span class="freq-dialogue-name ${isHost ? 'freq-dialogue-host' : 'freq-dialogue-guest'}">${escapeHtml(m[1])}</span>
            <span class="freq-dialogue-text">${escapeHtml(m[2])}</span></div>`;
        }
        return line.trim() ? `<div class="freq-dialogue-narration">${escapeHtml(line)}</div>` : '';
      }).join('');
    },

    _addHistory(type, title, content) {
      this._history.unshift({ type, title, content, time: timeNow(), date: dateNow() });
      if (this._history.length > 20) this._history.pop();if (this._container) this._renderHistory(this._container);
    },

    _renderHistory(container) {
      const el = container.querySelector('#freq-studio-history');
      if (!el || this._history.length === 0) return;
      const icons = { interview: '🎤', monologue: '📼' };
      el.innerHTML = `
        <div class="freq-studio-history-title">📂 录音存档</div>
        ${this._history.map((h, i) => `
          <div class="freq-history-card" data-idx="${i}">
            <div class="freq-history-card-header">
              <span>${icons[h.type] || '📻'} ${escapeHtml(h.title)}</span>
              <span class="freq-history-time">${h.date} ${h.time}</span>
            </div>
            <div class="freq-history-preview">${escapeHtml(h.content.slice(0, 60))}...</div>
            <div class="freq-history-full" style="display:none;">${h.type === 'interview' ? this._fmtDialogue(h.content) : escapeHtml(h.content)}</div>
          </div>
        `).join('')}`;

      el.querySelectorAll('.freq-history-card').forEach(card => {
        card.addEventListener('click', () => {
          const p = card.querySelector('.freq-history-preview');
          const f = card.querySelector('.freq-history-full');
          const isOpen = f.style.display !== 'none';
          p.style.display = isOpen ? 'block' : 'none';
          f.style.display = isOpen ? 'none' : 'block';
        });
      });
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_12  App · 通知中心                             │
  // └──────────────────────────────────────────────────────┘
  const notifCenterApp = {
    id: 'notif-center', name: '通知中心', icon: '🔔', _badge: 0, _container: null,

    init() {
      EventBus.on('notification:new', () => { this._badge++; renderAppGrid(); });
    },

    mount(container) {
      this._container = container;
      Notify.markAllRead();
      const notifs = Notify._notifs;
      const errors = Notify._errors;

      container.innerHTML = `
        <div class="freq-app-header">🔔 通知中心
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            <button class="freq-notif-tab-btn freq-notif-tab-active" data-tab="notifs">通知 (${notifs.length})</button>
            <button class="freq-notif-tab-btn" data-tab="errors">日志 (${errors.length})</button>
          </span>
        </div>
        <div class="freq-app-body">
          <div id="freq-notif-list">
            ${notifs.length === 0
              ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">🔕</span><span>暂无通知</span></div>`
              : notifs.map(n => `
                <div class="freq-notif-item ${n.read ? '' : 'freq-notif-unread'}">
                  <span class="freq-notif-icon">${n.icon}</span>
                  <div class="freq-notif-content">
                    <div class="freq-notif-title">${escapeHtml(n.title)}</div>
                    <div class="freq-notif-msg">${escapeHtml(n.message)}</div>
                </div>
                <span class="freq-notif-time">${n.time}</span>
                </div>`).join('')}
          </div>
          <div id="freq-error-list" style="display:none;">
            ${errors.length === 0
              ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">✅</span><span>无错误日志</span></div>`
              : errors.map(e => `
                <div class="freq-error-item">
                  <div class="freq-error-header">
                    <span class="freq-error-source">⚠️ ${escapeHtml(e.source)}</span>
                    <span class="freq-error-time">${e.time}</span>
                  </div>
                  <div class="freq-error-msg">${escapeHtml(e.message)}</div>${e.stack ? `<div class="freq-error-stack" style="display:none;">${escapeHtml(e.stack)}</div>` : ''}
                </div>`).join('')}
          </div>
        </div>`;

      container.querySelectorAll('.freq-notif-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.freq-notif-tab-btn').forEach(b => b.classList.remove('freq-notif-tab-active'));
          btn.classList.add('freq-notif-tab-active');
          const tab = btn.dataset.tab;
          container.querySelector('#freq-notif-list').style.display = tab === 'notifs' ? 'block' : 'none';
          container.querySelector('#freq-error-list').style.display = tab === 'errors' ? 'block' : 'none';
        });
      });

      container.querySelectorAll('.freq-error-item').forEach(item => {
        item.addEventListener('click', () => {
          const s = item.querySelector('.freq-error-stack');
          if (s) s.style.display = s.style.display === 'none' ? 'block' : 'none';
        });
      });
    },

    unmount() { this._container = null; },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_13  App · 朋友圈·电波│
  // └──────────────────────────────────────────────────────┘
  const momentsApp = {
    id: 'moments', name: '朋友圈·电波', icon: '📱', _badge: 0, _container: null,
    _posts: [],
    _generating: false,

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;

      container.innerHTML = `
        <div class="freq-app-header">📱 朋友圈·电波
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            <button class="freq-moments-refresh-btn" id="freq-moments-refresh">⟳ 刷新动态</button>
          </span>
        </div>
        <div class="freq-app-body">
          <div id="freq-moments-loading" style="display:none;">
            <div class="freq-studio-loading">📡 正在接收电波动态...</div>
          </div>
          <div id="freq-moments-feed" class="freq-moments-feed"></div>
        </div>`;

      container.querySelector('#freq-moments-refresh')?.addEventListener('click', () => this._generate(container));

      if (this._posts.length > 0) {
        this._renderFeed(container);
      } else {
        this._renderEmpty(container);
      }
    },

    unmount() { this._container = null; },

    _renderEmpty(container) {
      const feed = container.querySelector('#freq-moments-feed');
      if (!feed) return;
      feed.innerHTML = `
        <div class="freq-empty" style="min-height:200px;">
          <span class="freq-empty-icon">📱</span>
          <span>电波沉默中</span>
          <span style="font-size:10px;color:#333;">点击「⟳ 刷新动态」接收角色们的朋友圈</span>
        </div>`;
    },

    _renderFeed(container) {
      const feed = container.querySelector('#freq-moments-feed');
      if (!feed) return;
      feed.innerHTML = this._posts.map(post => `
        <div class="freq-moment-card">
          <div class="freq-moment-header">
            <span class="freq-moment-avatar">${post.avatar || '👤'}</span>
            <div class="freq-moment-meta">
              <span class="freq-moment-name">${escapeHtml(post.name)}</span>
              <span class="freq-moment-time">${escapeHtml(post.time)}</span>
            </div>
          </div>
          <div class="freq-moment-content">${escapeHtml(post.content)}</div>
          ${post.hashtag ? `<div class="freq-moment-hashtag">${escapeHtml(post.hashtag)}</div>` : ''}<div class="freq-moment-footer">
            <span class="freq-moment-likes">♡ ${post.likes || 0}</span>
            ${post.comment ? `<div class="freq-moment-comment">
              <span class="freq-moment-comment-name">${escapeHtml(post.commentBy || '失真')}</span>：${escapeHtml(post.comment)}
            </div>` : ''}
          </div>
        </div>
      `).join('');
    },

    async _generate(container) {
  if (this._generating) return;
  this._generating = true;

  const loadingEl = container.querySelector('#freq-moments-loading');
  if (loadingEl) loadingEl.style.display = 'block';

  const charName = getCurrentCharName() || '角色';
  const userName = getUserName();
  const latestPlot = getLatestPlot(getChatMessages());
  const latestScene = getLatestScene(getChatMessages());
  const meowTime = getLatestMeowTime(getChatMessages());
  const radioShow = extractRadioShow(getChatMessages());

  const systemPrompt = `你是一个社交媒体动态生成器。根据以下信息，生成 3-5 条朋友圈动态。

角色信息：
- 主角色：${charName}
- 用户：${userName}
- 当前场景：${latestScene || '未知'}
- 当前剧情时间：${meowTime || '未知'}
- 当前配乐：${radioShow?.bgm ?? '未知'}
- 最近剧情：${latestPlot || '暂无'}

发帖人可以是：${charName}、失真（电台主持人，颓废摇滚风，爱用颜文字）、或你编造的 1-2 个 NPC（给他们起名字和简短性格）。

每条动态严格按以下 JSON 格式输出，整体为一个 JSON 数组：
[
  {
    "avatar": "一个 emoji 代表头像",
    "name": "发帖人名字",
    "time": "发帖时间（用剧情内时间）",
    "content": "动态正文，50-120字",
    "hashtag": "#话题标签#（可选）",
    "likes": 随机数字0-99,
    "commentBy": "评论者名字（可选，可以是其他角色）",
    "comment": "评论内容（可选，一句话）"
  }
]

规则：
- 内容要贴合当前剧情氛围
- 每个人的文风要有差异（失真颓废锐评风、${charName}保持角色性格、NPC各有特色）
- 不提及 AI/模型/扮演
- 只输出 JSON 数组，不加任何其他文字`;

  const userPrompt = '生成朋友圈动态。';

  try {
    const result = await SubAPI.call(systemPrompt, userPrompt, {
      maxTokens: 1200,
      temperature: 0.88,
    });

    let posts;
    try {
      posts = safeParseAIJson(result, 'array');
      if (!Array.isArray(posts)) throw new Error('返回内容不是数组');
    } catch (parseErr) {
      throw new Error('动态格式解析失败：' + parseErr.message);
    }

    this._posts = posts;
    this._renderFeed(container);
    Notify.add('朋友圈·电波', `收到 ${posts.length} 条新动态`, '📱');
  } catch (e) {
    const feed = container.querySelector('#freq-moments-feed');
    if (feed) feed.innerHTML = `<div class="freq-studio-error">📱 电波中断：${escapeHtml(e.message)}</div>`;
    Notify.error('朋友圈·电波', e);
  } finally {
    this._generating = false;
    if (loadingEl) loadingEl.style.display = 'none';
  }
},
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_14  App · 信号气象站                           │
  // └──────────────────────────────────────────────────────┘
  const weatherApp = {
    id: 'weather', name: '信号气象站', icon: '🌦️', _badge: 0, _container: null,
    _cache: null,
    _locating: false,

    init() {},

    mount(container) {
      this._container = container;
      container.innerHTML = `
        <div class="freq-app-header">🌦️ 信号气象站
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;" id="freq-weather-cosmic-badge"></span>
        </div>
        <div class="freq-app-body">
          <div id="freq-weather-status" style="font-size:11px;color:#666;margin-bottom:10px;min-height:16px;"></div>
          <button class="freq-studio-action-btn" id="freq-weather-go" style="width:100%;margin-bottom:12px;">📡扫描当前位置气象
          </button>
          <div id="freq-weather-result" class="freq-weather-result"></div>
        </div>`;

      const cosmicBadge = container.querySelector('#freq-weather-cosmic-badge');
      if (cosmicBadge && getCosmicFreqStatus()) {
        cosmicBadge.textContent = '🌌 宇宙频率 ON';
        cosmicBadge.style.color = '#7b5ea7';
      }

      container.querySelector('#freq-weather-go')
        ?.addEventListener('click', () => this._locate(container));

      if (this._cache?.html) {
        container.querySelector('#freq-weather-result').innerHTML = this._cache.html;container.querySelector('#freq-weather-status').textContent = '↑ 上次扫描结果';
      }
    },

    unmount() { this._container = null; },

    _locate(container) {
      if (this._locating) return;
      const statusEl = container.querySelector('#freq-weather-status');
      const btn = container.querySelector('#freq-weather-go');
      const resultEl = container.querySelector('#freq-weather-result');

      if (!navigator.geolocation) {
        this._generate(container, null, null, '未知位置');
        return;
      }

      this._locating = true;
      btn.disabled = true;
      btn.textContent = '📡 定位中...';
      if (statusEl) statusEl.textContent = '正在获取位置信号...';
      if (resultEl) resultEl.innerHTML = '<div class="freq-studio-loading">📡 正在扫描坐标...</div>';

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this._locating = false;
          const { latitude: lat, longitude: lon } = pos.coords;
          if (statusEl) statusEl.textContent = `📍坐标锁定 ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
          this._fetchWeather(container, lat, lon);
        },
        (err) => {
          this._locating = false;
          btn.disabled = false;
          btn.textContent = '📡 扫描当前位置气象';
          WARN('Geolocation failed:', err.message);
          if (statusEl) statusEl.textContent = '📍 定位受限，切换至频率模拟模式';
          this._generate(container, null, null, '未知位置');
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    },

    async _fetchWeather(container, lat, lon) {
      const btn = container.querySelector('#freq-weather-go');
      const statusEl = container.querySelector('#freq-weather-status');
      const resultEl = container.querySelector('#freq-weather-result');
      const s = getSettings();

      if (!s.weatherKey) {
        if (statusEl) statusEl.textContent = '📍 坐标已锁定，切换至频率模拟模式（未配置天气Key）';
        this._generate(container, lat, lon, `${lat.toFixed(2)},${lon.toFixed(2)}`);
        return;
      }

      if (resultEl) resultEl.innerHTML = '<div class="freq-studio-loading">🌐 正在接收气象数据...</div>';

      let weatherText = '';
      let cityName = `${lat.toFixed(2)},${lon.toFixed(2)}`;

      try {
        const coord = `${lon.toFixed(2)},${lat.toFixed(2)}`;

        const geoResp = await fetch(
          `https://geoapi.qweather.com/v2/city/lookup?location=${coord}&key=${s.weatherKey}`
        );
        const geoData = await geoResp.json();
        if (geoData.code === '200' && geoData.location?.length) {
          const loc = geoData.location[0];
          cityName = `${loc.name}（${loc.adm1}）`;
        }

        const wResp = await fetch(
          `https://devapi.qweather.com/v7/weather/now?location=${coord}&key=${s.weatherKey}`
        );
        const wData = await wResp.json();
        if (wData.code !== '200') throw new Error(`天气API: ${wData.code}`);

        const w = wData.now;
        weatherText = `城市：${cityName}\n天气：${w.text}\n温度：${w.temp}°C（体感 ${w.feelsLike}°C）\n湿度：${w.humidity}%\n风：${w.windDir} ${w.windScale}级`;

        if (statusEl) statusEl.textContent = `📍 ${cityName}`;} catch (e) {
        Notify.error('气象站·天气API', e);
        weatherText = '';if (statusEl) statusEl.textContent = '⚠️ 天气API异常，切换至频率模拟';
      }

      this._generate(container, lat, lon, cityName, weatherText);
      if (btn) { btn.disabled = false; btn.textContent = '📡 扫描当前位置气象'; }
    },

    async _generate(container, lat, lon, cityName, weatherText = '') {
      const btn = container.querySelector('#freq-weather-go');
      const resultEl = container.querySelector('#freq-weather-result');
      if (!resultEl) return;

      if (btn) { btn.disabled = true; btn.textContent = '📡 生成中...'; }
      if (!weatherText) {
        resultEl.innerHTML = '<div class="freq-studio-loading">📡 正在调频...</div>';
      }

      const charName = getCurrentCharName() || '角色';
      const latestPlot = getLatestPlot(getChatMessages());
      const isCosmicOn = getCosmicFreqStatus();

      const cosmicNote = isCosmicOn
        ? `\n\n【宇宙频率已开启】${charName}的关心语要有一种"穿透屏幕感知到你"的暧昧张力，像是TA真的知道你在哪里、此刻的状态，但保持克制，不完全捅破第四面墙。`
        : '';

           const weatherData = weatherText
        ? `真实天气数据：\n${weatherText}`
        : `位置：${cityName || '未知'}\n（无真实天气数据，请根据当前剧情时间和场景合理编造天气）`;
      const cosmicHint = isCosmicOn ? `（宇宙频率ON：带穿透感，像TA感知到了屏幕另一边的你）` : '';

      const systemPrompt = getPrompt('weather')
        .replace(/{weatherData}/g, weatherData)
        .replace(/{charName}/g, charName)
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{cosmicNote}/g, cosmicNote)
        .replace(/{cosmicHint}/g, cosmicHint);

      try {
        const result = await SubAPI.call(systemPrompt, '生成气象播报。', { maxTokens: 500, temperature: 0.85 });
        const html = `
          <div class="freq-weather-card${isCosmicOn ? ' freq-weather-card--cosmic' : ''}">
            ${isCosmicOn ? '<div class="freq-weather-cosmic-tag">🌌 宇宙频率感知模式</div>' : ''}
            ${result.split('\n').map(line =>
              line.trim() ? `<div class="freq-weather-line">${escapeHtml(line)}</div>` : '<div style="height:6px;"></div>'
            ).join('')}
          </div>`;

        resultEl.innerHTML = html;
        this._cache = { html, coords: { lat, lon }, weatherText };
        Notify.add('信号气象站', `${cityName || '当前位置'} 气象信号已接收${isCosmicOn ? '🌌' : ''}`, '🌦️');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📡 气象信号丢失：${escapeHtml(e.message)}</div>`;
        Notify.error('气象站', e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📡 扫描当前位置气象'; }
      }
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_15  App · 宇宙频率·感知                │
  // └──────────────────────────────────────────────────────┘
  const cosmicApp = {
    id: 'cosmic', name: '宇宙频率', icon: '🌌', _badge: 0, _container: null,
    _lastPerception: null,
    _generating: false,
    _pulseTimer: null,
    _history: [],
    init() {
      EventBus.on('radio_show:updated', () => {
        const isOn = getCosmicFreqStatus();
        if (isOn) {
          this._badge++;
          renderAppGrid();
          Notify.add('宇宙频率', '信号已开启 — 感知层激活', '🌌');
        }if (this._container) this.mount(this._container);
      });
    },

    mount(container) {
      this._container = container;
      const isOn = getCosmicFreqStatus();
      this._badge = 0;
      renderAppGrid();

      if (!isOn) {
        this._renderStandby(container);
      } else {
        this._renderActive(container);
      }
    },

    unmount() {
      if (this._pulseTimer) { clearInterval(this._pulseTimer); this._pulseTimer = null; }
      this._container = null;
    },

    _renderStandby(container) {
      container.innerHTML = `
        <div class="freq-app-header">🌌 宇宙频率·感知</div>
        <div class="freq-app-body">
          <div class="freq-cosmic-standby">
            <div class="freq-cosmic-standby-icon">🌌</div>
            <div class="freq-cosmic-standby-title">频率待机中</div>
            <div class="freq-cosmic-standby-desc">
              宇宙频率尚未开启。<br>
              当预设中&lt;radio_show&gt; STATUS 激活时，<br>
              感知层将自动上线。
            </div><div class="freq-cosmic-signal-bars" id="freq-cosmic-bars">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>`;

      this._startIdlePulse(container);
    },

    _renderActive(container) {
      const charName = getCurrentCharName() || '???';
      const last = this._lastPerception;

      container.innerHTML = `
        <div class="freq-app-header">🌌 宇宙频率·感知
          <span style="float:right;font-size:10px;color:#7b5ea7;font-weight:normal;">● LIVE</span>
        </div>
        <div class="freq-app-body" id="freq-cosmic-body">

          <div class="freq-cosmic-signal-row">
            <span class="freq-cosmic-label">信号强度</span>
            <div class="freq-cosmic-bar-wrap">
              <div class="freq-cosmic-bar-fill" id="freq-cosmic-bar-fill"
                style="width:${last ? Math.round(last.signal_strength * 100) : 0}%"></div>
            </div>
            <span class="freq-cosmic-bar-pct" id="freq-cosmic-bar-pct">
              ${last ? Math.round(last.signal_strength * 100) + '%' : '--'}
            </span>
          </div>

          <div class="freq-cosmic-mood-row" id="freq-cosmic-mood">
            ${last ? `<span class="freq-cosmic-mood-tag">${escapeHtml(last.mood)}</span>` : ''}
          </div>

          <div class="freq-cosmic-perception-box" id="freq-cosmic-perception">
            ${last
              ? `<div class="freq-cosmic-perception-text">${escapeHtml(last.perception)}</div><div class="freq-cosmic-perception-time">${last.time}</div>`
              : `<div class="freq-cosmic-perception-empty">等待感知信号...</div>`}
          </div>

          <button class="freq-studio-action-btn freq-cosmic-btn" id="freq-cosmic-go">
            🌌 接收感知信号
          </button>${last ? `<div class="freq-cosmic-history" id="freq-cosmic-history-wrap">
            <div class="freq-cosmic-history-title">历史感知</div>
            <div id="freq-cosmic-history-list"></div>
          </div>` : ''}
        </div>`;

      container.querySelector('#freq-cosmic-go')
        ?.addEventListener('click', () => this._generate(container));

      if (last) this._renderHistory(container);
    },

    async _generate(container) {
      if (this._generating) return;
      this._generating = true;

      const btn = container.querySelector('#freq-cosmic-go');
      const perceptionBox = container.querySelector('#freq-cosmic-perception');
      const barFill = container.querySelector('#freq-cosmic-bar-fill');
      const barPct = container.querySelector('#freq-cosmic-bar-pct');
      const moodRow = container.querySelector('#freq-cosmic-mood');

      if (btn) { btn.disabled = true; btn.textContent = '🌌 感知中...'; }
      if (perceptionBox) perceptionBox.innerHTML = '<div class="freq-cosmic-scanning">▓▒░扫描频率层░▒▓</div>';

      const charName = getCurrentCharName() || '角色';
      const userName = getUserName();
      const latestPlot = getLatestPlot(getChatMessages());
      const latestScene = getLatestScene(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());
      const now = new Date();
      const realTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const realDate = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

      const weatherHint = weatherApp._cache?.weatherText
        ? `用户真实天气：${weatherApp._cache.weatherText.split('\n').slice(0,3).join('，')}`
        : '';

            const systemPrompt = getPrompt('cosmic')
        .replace(/{charName}/g, charName)
        .replace(/{realDate}/g, realDate)
        .replace(/{realTime}/g, realTime)
        .replace(/{weatherHint}/g, weatherHint || '天气：未知')
        .replace(/{latestScene}/g, latestScene || '未知')
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{bgm}/g, radioShow?.bgm ?? '未知');

      try {
        const raw = await SubAPI.call(systemPrompt, '开始感知。', {
          maxTokens: 400,
          temperature: 0.92,
        });

        let data;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          data = match ? JSON.parse(match[0]) : JSON.parse(raw);
        } catch {
          data = { perception: raw.trim(), signal_strength: 0.7, mood: '感知中' };
        }

        data.signal_strength = Math.min(1, Math.max(0, Number(data.signal_strength) || 0.7));
        data.time = realTime;

        if (!this._history) this._history = [];
        if (this._lastPerception) this._history.unshift(this._lastPerception);
        if (this._history.length > 10) this._history.pop();
        this._lastPerception = data;

        const pct = Math.round(data.signal_strength * 100);
        if (barFill) barFill.style.width = pct + '%';
        if (barPct) barPct.textContent = pct + '%';
        if (moodRow) moodRow.innerHTML = `<span class="freq-cosmic-mood-tag">${escapeHtml(data.mood)}</span>`;
        if (perceptionBox) perceptionBox.innerHTML = `
          <div class="freq-cosmic-perception-text freq-cosmic-perception-new">${escapeHtml(data.perception)}</div>
          <div class="freq-cosmic-perception-time">${data.time}</div>`;

        let historyWrap = container.querySelector('#freq-cosmic-history-wrap');
        if (!historyWrap) {
          historyWrap = document.createElement('div');
          historyWrap.className = 'freq-cosmic-history';
          historyWrap.id = 'freq-cosmic-history-wrap';
          historyWrap.innerHTML = '<div class="freq-cosmic-history-title">历史感知</div><div id="freq-cosmic-history-list"></div>';
          container.querySelector('#freq-cosmic-body')?.appendChild(historyWrap);
        }
        this._renderHistory(container);Notify.add('宇宙频率·感知', `${charName} 感知到了你— ${data.mood}`, '🌌');
      } catch (e) {
        if (perceptionBox) perceptionBox.innerHTML =
          `<div class="freq-studio-error">🌌 频率中断：${escapeHtml(e.message)}</div>`;
        Notify.error('宇宙频率·感知', e);
      } finally {
        this._generating = false;
        if (btn) { btn.disabled = false; btn.textContent = '🌌 接收感知信号'; }
      }
    },

    _renderHistory(container) {
      const el = container.querySelector('#freq-cosmic-history-list');
      if (!el || !this._history?.length) return;
      el.innerHTML = this._history.map(h => `
        <div class="freq-cosmic-history-item">
          <span class="freq-cosmic-mood-tag freq-cosmic-mood-tag--small">${escapeHtml(h.mood)}</span>
          <span class="freq-cosmic-history-text">${escapeHtml(h.perception.slice(0, 60))}${h.perception.length > 60 ? '...' : ''}</span>
          <span class="freq-cosmic-history-time">${h.time}</span>
        </div>`).join('');
    },

    _startIdlePulse(container) {
      if (this._pulseTimer) clearInterval(this._pulseTimer);
      const bars = container.querySelectorAll('.freq-cosmic-signal-bars span');
      if (!bars.length) return;
      this._pulseTimer = setInterval(() => {
        bars.forEach(b => {
          const h = Math.random() * 60 + 10;
          b.style.height = h + '%';
          b.style.opacity = (Math.random() * 0.4 + 0.1).toFixed(2);
        });
      }, 600);
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_16  App · 信号测试·弦外之音                    │
  // └──────────────────────────────────────────────────────┘
  const scannerApp = {
    id: 'scanner', name: '弦外之音', icon: '📡', _badge: 0, _container: null,
    _scanning: false,
    _history: [],

    init() {},

    mount(container) {
      this._container = container;
      this._render(container);
    },

    unmount() { this._container = null; },

    _render(container) {
      container.innerHTML = `
        <div class="freq-app-header">📡 信号测试·弦外之音
          <span style="float:right;font-size:9px;color:#555;font-weight:normal;letter-spacing:1px;">FREQ SCAN</span>
        </div>
        <div class="freq-app-body">

          <div class="freq-scanner-desc">
            随机接入当前世界里某个NPC的内心独白片段。<br>
            像收音机扫台时偶尔捕获的杂音。
          </div>

          <button class="freq-studio-action-btn freq-scanner-btn" id="freq-scanner-go">📡 扫频
          </button>

          <div id="freq-scanner-result"></div>

          <div class="freq-scanner-history" id="freq-scanner-history" style="display:${this._history.length ? 'block' : 'none'};">
            <div class="freq-scanner-history-title">// 历史截获记录</div>
            <div id="freq-scanner-history-list">
              ${this._renderHistoryItems()}
            </div>
          </div>

        </div>`;

      container.querySelector('#freq-scanner-go')
        ?.addEventListener('click', () => this._scan(container));
    },

    async _scan(container) {
      if (this._scanning) return;
      this._scanning = true;

      const btn = container.querySelector('#freq-scanner-go');
      const resultEl = container.querySelector('#freq-scanner-result');

      if (btn) { btn.disabled = true; btn.textContent = '📡 扫描中...'; }
      if (resultEl) resultEl.innerHTML = `
        <div class="freq-scanner-scanning">
          <span class="freq-scanner-wave">▓▒░</span> 正在扫频<span class="freq-scanner-wave">░▒▓</span>
        </div>`;

      const msgs = getChatMessages();
      const latestSeeds = (() => {
        const all = extractAllMeowFM(msgs);
        return all.length ? all[all.length - 1].seeds : '';
      })();
      const latestScene = getLatestScene(msgs);
      const latestPlot = getLatestPlot(msgs);
      const charName = getCurrentCharName() || '角色';

            const systemPrompt = getPrompt('scanner')
        .replace(/{latestScene}/g, latestScene || '未知')
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{latestSeeds}/g, latestSeeds || '暂无')
        .replace(/{charName}/g, charName);

      try {
        const raw = await SubAPI.call(systemPrompt, '开始扫频。', {
          maxTokens: 150,
          temperature: 0.95,
        });

        const text = raw.trim();

        const npcMatch = text.match(/\[截获频率\s*·\s*([^\]]+)\]/);
        const npcName = npcMatch ? npcMatch[1].trim() : '未知频率';

        const record = { npc: npcName, text, time: timeNow() };
        this._history.unshift(record);
        if (this._history.length > 20) this._history.pop();

        if (resultEl) resultEl.innerHTML = `
          <div class="freq-scanner-card freq-scanner-card--new">
            <div class="freq-scanner-card-tag">📡 截获成功</div>
            <div class="freq-scanner-card-text">${escapeHtml(text)}</div>
            <div class="freq-scanner-card-time">${record.time}</div>
          </div>`;

        const historyWrap = container.querySelector('#freq-scanner-history');
        const historyList = container.querySelector('#freq-scanner-history-list');
        if (historyWrap) historyWrap.style.display = 'block';
        if (historyList) historyList.innerHTML = this._renderHistoryItems();

        Notify.add('弦外之音', `截获 ${npcName} 的频率`, '📡');
      } catch (e) {
        if (resultEl) resultEl.innerHTML =
          `<div class="freq-studio-error">📡 频率丢失：${escapeHtml(e.message)}</div>`;
        Notify.error('弦外之音', e);
      } finally {
        this._scanning = false;
        if (btn) { btn.disabled = false; btn.textContent = '📡 扫频'; }
      }
    },

    _renderHistoryItems() {
      if (!this._history.length) return '';
      return this._history.map((h, i) => `
        <div class="freq-scanner-history-item${i === 0 ? ' freq-scanner-history-item--latest' : ''}">
          <span class="freq-scanner-history-npc">${escapeHtml(h.npc)}</span>
          <span class="freq-scanner-history-text">${escapeHtml(h.text.replace(/\[截获频率\s*·[^\]]+\]\s*/, ''))}</span>
          <span class="freq-scanner-history-time">${h.time}</span>
        </div>`).join('');
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_17  App · 频道留言板│
  // └──────────────────────────────────────────────────────┘
  const forumApp = {
    id: 'forum', name: '频道留言板', icon: '💬', _badge: 0, _container: null,BOARDS: [
      { id: 'gossip',  label: '📻 电台八卦',color: '#A32D2D' },
      { id: 'news',    label: '🌐 世界新闻',   color: '#2d6ea3' },
      { id: 'mystic',  label: '🔮 玄学讨论区', color: '#7b5ea7' },
      { id: 'other',   label: '💭 其他',color: '#4a7a4a' },
    ],

    _currentBoard: 'gossip',
    _posts: [],
    _generating: false,
    _postCounter: 0,

    init() {
      EventBus.on('meow_fm:updated', () => {
        if (Math.random() < 0.3) this._autoPost();
      });
    },

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      this._render(container);
    },

    unmount() { this._container = null; },

    _getChars() {
      const ctx = getContext();
      const chars = [];
      const mainName = getCurrentCharName();
      if (mainName) chars.push({ name: mainName, avatar: '🎙️', desc: '' });
      if (ctx?.characters) {
        ctx.characters.forEach(c => {
          const name = c.name ?? c.data?.name ?? '';
          if (name && name !== mainName && name !== getUserName()) {
            chars.push({ name, avatar: '👤', desc: c.data?.description?.slice(0, 100) ?? '' });
          }
        });
      }
      return chars.length ? chars : [{ name: mainName || '角色', avatar: '🎙️', desc: '' }];
    },

    _render(container) {
      const board = this.BOARDS.find(b => b.id === this._currentBoard);
      const posts = this._posts.filter(p => p.board === this._currentBoard);

      container.innerHTML = `
        <div class="freq-app-header">💬 频道留言板
          <span style="float:right;font-size:9px;color:#555;font-weight:normal;">r/FreqTerminal</span>
        </div>
        <div class="freq-forum-boards" id="freq-forum-boards">
          ${this.BOARDS.map(b => `
            <button class="freq-forum-board-btn${b.id === this._currentBoard ? ' freq-forum-board-active' : ''}"data-board="${b.id}" style="--board-color:${b.color}">
              ${b.label}
            </button>`).join('')}
        </div>
        <div class="freq-forum-toolbar">
          <button class="freq-forum-new-btn" id="freq-forum-new">✏️ 发帖</button>
          <button class="freq-forum-gen-btn" id="freq-forum-gen">🎲 角色发帖</button>
        </div>
        <div class="freq-app-body freq-forum-body" id="freq-forum-body">
          ${posts.length
            ? posts.map(p => this._postHTML(p)).join('')
            : `<div class="freq-empty"><span class="freq-empty-icon">💬</span><span>这个版块还没有帖子</span></div>`}
        </div><div class="freq-forum-compose" id="freq-forum-compose" style="display:none;">
          <div class="freq-forum-compose-inner">
            <div class="freq-forum-compose-header">
              <span>✏️ 发新帖 · ${board.label}</span>
              <button class="freq-forum-compose-close" id="freq-forum-compose-close">✕</button>
            </div>
            <input class="freq-forum-input" id="freq-forum-title" placeholder="帖子标题..." maxlength="60"/>
            <textarea class="freq-forum-textarea" id="freq-forum-body-input" placeholder="说点什么..." rows="4"></textarea>
            <button class="freq-studio-action-btn" id="freq-forum-submit" style="width:100%;">发布</button>
          </div>
        </div>`;

      container.querySelector('#freq-forum-boards').addEventListener('click', e => {
        const btn = e.target.closest('[data-board]');
        if (btn) { this._currentBoard = btn.dataset.board; this._render(container); }
      });

      container.querySelector('#freq-forum-new').addEventListener('click', () => {
        container.querySelector('#freq-forum-compose').style.display = 'flex';
      });
      container.querySelector('#freq-forum-compose-close').addEventListener('click', () => {
        container.querySelector('#freq-forum-compose').style.display = 'none';
      });
      container.querySelector('#freq-forum-submit').addEventListener('click', () => {
        this._submitUserPost(container);
      });

      container.querySelector('#freq-forum-gen').addEventListener('click', () => {
        this._autoPost(container);
      });

      container.querySelector('#freq-forum-body').addEventListener('click', e => {
        const upvoteBtn = e.target.closest('[data-upvote]');
        const replyBtn  = e.target.closest('[data-reply]');
        const postEl= e.target.closest('[data-post-id]');
        if (upvoteBtn) { this._upvote(upvoteBtn.dataset.upvote, container); return; }
        if (replyBtn)  { this._openReply(replyBtn.dataset.reply, container); return; }
        if (postEl && !e.target.closest('button') && !e.target.closest('textarea')) {
          this._toggleComments(postEl.dataset.postId, container);
        }
      });
    },

    _postHTML(post) {
      const board = this.BOARDS.find(b => b.id === post.board);
      const commentsHTML = post._commentsOpen ? `
        <div class="freq-forum-comments">
          ${post.comments.map(c => `
            <div class="freq-forum-comment${c.isUser ? ' freq-forum-comment--user' : ''}">
              <span class="freq-forum-comment-author" style="color:${c.isUser ? '#5b8dd9' : (board?.color ?? '#888')}">${escapeHtml(c.author)}</span>
              <span class="freq-forum-comment-text">${escapeHtml(c.body)}</span>
              <span class="freq-forum-comment-time">${c.time}</span>
            </div>`).join('')}
          <div class="freq-forum-reply-box" id="freq-forum-reply-${post.id}" style="display:none;">
            <textarea class="freq-forum-textarea freq-forum-reply-input" placeholder="回复..." rows="2"
              id="freq-forum-reply-input-${post.id}"></textarea>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="freq-studio-action-btn" style="flex:1;padding:6px;"
                data-reply-submit="${post.id}">回复</button>
              <button class="freq-forum-gen-btn" style="flex:1;padding:6px;"
                data-char-reply="${post.id}">🎲 角色回复</button>
            </div>
          </div>
        </div>` : '';

      return `
        <div class="freq-forum-post" data-post-id="${post.id}">
          <div class="freq-forum-post-left">
            <button class="freq-forum-upvote" data-upvote="${post.id}">
              <span class="freq-forum-upvote-arrow">▲</span>
              <span class="freq-forum-upvote-count">${post.upvotes}</span>
            </button>
          </div>
          <div class="freq-forum-post-right">
            <div class="freq-forum-post-meta">
              <span class="freq-forum-post-author${post.isUser ? ' freq-forum-post-author--user' : ''}"
                style="${!post.isUser ? `color:${board?.color ?? '#888'}` : ''}">
                ${escapeHtml(post.avatar)} ${escapeHtml(post.author)}
              </span>
              <span class="freq-forum-post-time">${post.time}</span>
            </div>
            <div class="freq-forum-post-title">${escapeHtml(post.title)}</div>
            <div class="freq-forum-post-body">${escapeHtml(post.body)}</div><div class="freq-forum-post-footer">
              <button class="freq-forum-footer-btn" data-reply="${post.id}">
                💬 ${post.comments.length} 条评论
              </button></div>
          </div>
        </div>
        ${commentsHTML}`;
    },

    _submitUserPost(container) {
      const title = container.querySelector('#freq-forum-title')?.value.trim();
      const body  = container.querySelector('#freq-forum-body-input')?.value.trim();
      if (!title) return;
      const post = this._makePost({
        board: this._currentBoard,
        author: getUserName(),
        avatar: '🎧',
        isUser: true,
        title,
        body: body || '',});
      this._posts.unshift(post);
      container.querySelector('#freq-forum-compose').style.display = 'none';
      this._render(container);
      setTimeout(() => this._charReplyToPost(post.id, container), 800);
    },

    async _autoPost(container) {
      if (this._generating) return;
      this._generating = true;

      const genBtn = container?.querySelector('#freq-forum-gen');
      if (genBtn) { genBtn.disabled = true; genBtn.textContent = '⏳ 生成中...'; }

      const chars = this._getChars();
      const char = chars[Math.floor(Math.random() * chars.length)];
      const board = this.BOARDS.find(b => b.id === this._currentBoard);
      const latestPlot = getLatestPlot(getChatMessages());
      const latestSeeds = (() => {
        const all = extractAllMeowFM(getChatMessages());
        return all.length ? all[all.length - 1].seeds : '';
      })();

            const systemPrompt = getPrompt('forum_post')
        .replace(/{charName}/g, char.name)
        .replace(/{boardLabel}/g, board.label)
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{latestSeeds}/g, latestSeeds || '暂无')
        .replace(/{charDesc}/g, char.desc || '无');


      try {
        const raw = await SubAPI.call(systemPrompt, '发帖。', { maxTokens: 300, temperature: 0.92 });
        const match = raw.match(/\{[\s\S]*\}/);
        const data = match ? JSON.parse(match[0]) : { title: raw.slice(0, 30), body: raw };

        const post = this._makePost({
          board: this._currentBoard,
          author: char.name,
          avatar: char.avatar,
          isUser: false,
          title: data.title ?? '无题',
          body: data.body ?? '',
        });
        this._posts.unshift(post);
        this._badge++;
        renderAppGrid();
        Notify.add('频道留言板', `${char.name} 在${board.label} 发了新帖`, '💬');

        if (container) {
          this._render(container);
          if (chars.length > 1 && Math.random() < 0.3) {
            setTimeout(() => this._charReplyToPost(post.id, container), 1200);
          }
        }
      } catch (e) {Notify.error('频道留言板·发帖', e);
      } finally {
        this._generating = false;
        if (genBtn) { genBtn.disabled = false; genBtn.textContent = '🎲 角色发帖'; }
      }
    },

    async _charReplyToPost(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;

      const chars = this._getChars().filter(c => c.name !== post.author);
      if (!chars.length) return;

      const repliers = chars.sort(() => Math.random() - 0.5).slice(0, Math.min(2, chars.length));
      const board = this.BOARDS.find(b => b.id === post.board);
      const latestPlot = getLatestPlot(getChatMessages());

      for (const char of repliers) {
        const existingComments = post.comments.map(c => `${c.author}: ${c.body}`).join('\n');

                const existingCommentsText = existingComments ? `已有评论：\n${existingComments}` : '';
        const systemPrompt = getPrompt('forum_reply')
          .replace(/{charName}/g, char.name)
          .replace(/{boardLabel}/g, board.label)
          .replace(/{postAuthor}/g, post.author)
          .replace(/{postTitle}/g, post.title)
          .replace(/{postBody}/g, post.body)
          .replace(/{existingComments}/g, existingCommentsText)
          .replace(/{latestPlot}/g, latestPlot || '暂无')
          .replace(/{charDesc}/g, char.desc || '无');
try {
          const raw = await SubAPI.call(systemPrompt, '评论。', { maxTokens: 150, temperature: 0.93 });
          post.comments.push({
            author: char.name,
            avatar: char.avatar,
            isUser: false,
            body: raw.trim(),
            time: timeNow(),
          });
          if (container && this._container === container) {
            const bodyEl = container.querySelector('#freq-forum-body');
            if (bodyEl) {
              const posts = this._posts.filter(p => p.board === this._currentBoard);
              bodyEl.innerHTML = posts.length
                ? posts.map(p => this._postHTML(p)).join('')
                : `<div class="freq-empty"><span class="freq-empty-icon">💬</span><span>这个版块还没有帖子</span></div>`;
            }
          }
        } catch (e) { Notify.error('频道留言板·回复', e); }

        await new Promise(r => setTimeout(r, 600));
      }
    },

    _upvote(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      post.upvotes++;
      const btn = container.querySelector(`[data-upvote="${postId}"]`);
      if (btn) {
        btn.querySelector('.freq-forum-upvote-count').textContent = post.upvotes;btn.classList.add('freq-forum-upvote--active');
      }
    },

    _toggleComments(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      post._commentsOpen = !post._commentsOpen;
      const bodyEl = container.querySelector('#freq-forum-body');
      if (bodyEl) {
        const posts = this._posts.filter(p => p.board === this._currentBoard);
        bodyEl.innerHTML = posts.map(p => this._postHTML(p)).join('');
      }
    },

    // ✅ FIX Bug4: 用 data attribute 标记已绑定，防止 submitBtn/charReplyBtn 重复绑定事件
    _openReply(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      if (!post._commentsOpen) { post._commentsOpen = true; }
      const bodyEl = container.querySelector('#freq-forum-body');
      if (bodyEl) {
        const posts = this._posts.filter(p => p.board === this._currentBoard);
        bodyEl.innerHTML = posts.map(p => this._postHTML(p)).join('');
      }
      const replyBox = container.querySelector(`#freq-forum-reply-${postId}`);
      if (replyBox) replyBox.style.display = 'block';

      const submitBtn = container.querySelector(`[data-reply-submit="${postId}"]`);
      const charReplyBtn = container.querySelector(`[data-char-reply="${postId}"]`);

      // 用 dataset 标记避免重复绑定
      if (submitBtn && !submitBtn.dataset.bound) {
        submitBtn.dataset.bound = '1';
        submitBtn.addEventListener('click', () => this._submitUserReply(postId, container));
      }
      if (charReplyBtn && !charReplyBtn.dataset.bound) {
        charReplyBtn.dataset.bound = '1';
        charReplyBtn.addEventListener('click', () => this._charReplyToPost(postId, container));
      }
    },

    _submitUserReply(postId, container) {
      const input = container.querySelector(`#freq-forum-reply-input-${postId}`);
      const body = input?.value.trim();
      if (!body) return;
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      post.comments.push({
        author: getUserName(),
        avatar: '🎧',
        isUser: true,
        body,
        time: timeNow(),
      });
      input.value = '';
      const bodyEl = container.querySelector('#freq-forum-body');
      if (bodyEl) {
        const posts = this._posts.filter(p => p.board === this._currentBoard);
        bodyEl.innerHTML = posts.map(p => this._postHTML(p)).join('');
      }
      setTimeout(() => this._charReplyToPost(postId, container), 800);
    },

    _makePost({ board, author, avatar, isUser, title, body }) {
      return {
        id: `post-${++this._postCounter}`,
        board, author, avatar, isUser, title, body,
        time: timeNow(),
        upvotes: Math.floor(Math.random() * 40) + 1,
        comments: [],
        _commentsOpen: false,
      };
    },
  };
    //┌──────────────────────────────────────────────────────┐
  // │ BLOCK_18App · 打卡日志                             │
  // └──────────────────────────────────────────────────────┘
  const checkinApp = {
    id: 'checkin', name: '打卡日志', icon: '📅', _badge: 0, _container: null,
    _currentGoalId: null,
    _viewMonth: null,

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._tryAutoCheckin();
      });
    },

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      if (this._currentGoalId) {
        this._renderGoalDetail(container, this._currentGoalId);
      } else {
        this._renderGoalList(container);
      }
    },

    unmount() { this._container = null; },

    _getGoals() {
      return getSettings().checkins?.goals ?? [];
    },

    _saveGoals(goals) {
      const s = getSettings();
      s.checkins.goals = goals;
      if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();},

    _findGoal(id) {
      return this._getGoals().find(g => g.id === id) ?? null;
    },

    _todayStr() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    _calcStreak(goal) {
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < (goal.totalDays || 365); i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if ((goal.records?.[key] ?? 0) > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      return streak;
    },

    _calcOverallRate(goal) {
      const start = new Date(goal.startDate);
      const today = new Date();
      const daysPassed = Math.max(1, Math.floor((today - start) / 86400000) + 1);
      const effectiveDays = Math.min(daysPassed, goal.totalDays || daysPassed);
      let completed = 0;
      for (let i = 0; i < effectiveDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if ((goal.records?.[key] ?? 0) >= goal.target) completed++;
      }
      return Math.round((completed / effectiveDays) * 100);
    },

    _renderGoalList(container) {
      this._currentGoalId = null;
      const goals = this._getGoals();

      const today = this._todayStr();
      const cardsHTML = goals.length === 0
        ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">📅</span>
            <span>还没有打卡目标</span>
            <span style="font-size:10px;color:#333;">点击右上角 + 创建一个吧</span>
          </div>`
        : goals.map(g => {
            const streak = this._calcStreak(g);
            const todayDone = g.records?.[today] ?? 0;
            const todayComplete = todayDone >= g.target;
            const rate = this._calcOverallRate(g);
            const isCharGoal = g.owner === 'char';
            return `
              <div class="freq-checkin-card" data-goal-id="${g.id}">
                <div class="freq-checkin-card-header">
                  <span class="freq-checkin-card-title">${escapeHtml(g.title)}</span>
                  <span class="freq-checkin-card-owner" style="color:${isCharGoal ? '#A32D2D' : '#5b8dd9'}">
                    ${escapeHtml(g.ownerName)}
                  </span>
                </div>
                <div class="freq-checkin-card-info">
                  <span>目标：${g.target}${escapeHtml(g.unit)}/天 · ${g.totalDays}天</span>
                </div>
                <div class="freq-checkin-card-stats">
                  <span class="freq-checkin-streak">🔥 ${streak}天</span>
                  <span class="freq-checkin-today ${todayComplete ? 'freq-checkin-today--done' : ''}">
                    ${todayComplete ? '✅' : '⬜'} 今日${todayDone}/${g.target}
                  </span>
                  <span class="freq-checkin-rate">${rate}%</span>
                </div>
              </div>`;
          }).join('');

      container.innerHTML = `
        <div class="freq-app-header">📅 打卡日志
          <span style="float:right;display:flex;gap:6px;align-items:center;">
            <button class="freq-checkin-add-btn" id="freq-checkin-add" title="新建目标">+</button>
          </span>
        </div>
        <div class="freq-app-body" id="freq-checkin-body">
          ${cardsHTML}
        </div><div class="freq-checkin-create-overlay" id="freq-checkin-create" style="display:none;"></div>`;

      container.querySelectorAll('.freq-checkin-card').forEach(card => {
        card.addEventListener('click', () => {
          this._currentGoalId = card.dataset.goalId;
          this._viewMonth = null;
          this._renderGoalDetail(container, card.dataset.goalId);
        });
      });

      container.querySelector('#freq-checkin-add')?.addEventListener('click', () => {
        this._showCreateForm(container);
      });
    },

    _showCreateForm(container) {
      const overlay = container.querySelector('#freq-checkin-create');
      if (!overlay) return;

      const charName = getCurrentCharName() || '角色';
      const userName = getUserName();

      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="freq-checkin-form">
          <div class="freq-checkin-form-header">
            <span>📅 新建打卡目标</span>
            <button class="freq-forum-compose-close" id="freq-checkin-form-close">✕</button>
          </div>
          <div class="freq-checkin-form-body">
            <label class="freq-s-row">
              <span>谁的目标？</span>
              <div class="freq-checkin-owner-toggle">
                <button class="freq-checkin-owner-btn freq-checkin-owner-active" data-owner="user">${escapeHtml(userName)}</button>
                <button class="freq-checkin-owner-btn" data-owner="char">${escapeHtml(charName)}</button>
              </div>
            </label>
            <label class="freq-s-row">
              <span>目标名称</span>
              <input type="text" id="freq-checkin-title" class="freq-forum-input" placeholder="例：每天喝8杯水" maxlength="30" />
            </label>
            <div style="display:flex;gap:8px;">
              <label class="freq-s-row" style="flex:1;">
                <span>每日目标量</span>
                <input type="number" id="freq-checkin-target" class="freq-forum-input" placeholder="8" min="1" value="1" />
              </label>
              <label class="freq-s-row" style="flex:1;">
                <span>单位</span>
                <input type="text" id="freq-checkin-unit" class="freq-forum-input" placeholder="杯" maxlength="10" />
              </label>
            </div>
            <label class="freq-s-row">
              <span>持续天数</span>
              <input type="number" id="freq-checkin-days" class="freq-forum-input" placeholder="30" min="1" value="30" />
            </label>
            <div class="freq-checkin-auto-row" id="freq-checkin-auto-row" style="display:none;">
              <label class="freq-s-row freq-s-toggle">
                <span>角色自动打卡（副API）</span>
                <input type="checkbox" id="freq-checkin-auto" />
              </label>
              <span style="font-size:9px;color:#444;">开启后角色会在新消息时自动打卡</span>
            </div>
            <button class="freq-studio-action-btn" id="freq-checkin-submit" style="width:100%;margin-top:8px;">创建目标</button>
          </div>
        </div>`;

      let selectedOwner = 'user';

      overlay.querySelectorAll('.freq-checkin-owner-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          overlay.querySelectorAll('.freq-checkin-owner-btn').forEach(b => b.classList.remove('freq-checkin-owner-active'));
          btn.classList.add('freq-checkin-owner-active');
          selectedOwner = btn.dataset.owner;
          const autoRow = overlay.querySelector('#freq-checkin-auto-row');
          if (autoRow) autoRow.style.display = selectedOwner === 'char' ? 'block' : 'none';
        });
      });

      overlay.querySelector('#freq-checkin-form-close')?.addEventListener('click', () => {
        overlay.style.display = 'none';
      });

      overlay.querySelector('#freq-checkin-submit')?.addEventListener('click', () => {
        const title = overlay.querySelector('#freq-checkin-title')?.value.trim();
        const target = parseInt(overlay.querySelector('#freq-checkin-target')?.value) || 1;
        const unit = overlay.querySelector('#freq-checkin-unit')?.value.trim() || '次';
        const totalDays = parseInt(overlay.querySelector('#freq-checkin-days')?.value) || 30;
        const autoCheckin = overlay.querySelector('#freq-checkin-auto')?.checked ?? false;

        if (!title) return;

        const ownerName = selectedOwner === 'user' ? userName : charName;
        const goal = {
          id: `goal-${Date.now()}`,
          owner: selectedOwner,
          ownerName,
          title,
          unit,
          target,
          totalDays,
          startDate: this._todayStr(),
          records: {},
          notes: {},
          comments: [],
          autoCheckin,
          createdAt: this._todayStr(),
        };

        const goals = this._getGoals();
        goals.push(goal);
        this._saveGoals(goals);

        overlay.style.display = 'none';
        this._renderGoalList(container);
        Notify.add('打卡日志', `新目标「${title}」已创建`, '📅');
      });
    },

    _renderGoalDetail(container, goalId) {
      const goal = this._findGoal(goalId);
      if (!goal) { this._renderGoalList(container); return; }

      const today = this._todayStr();
      const todayDone = goal.records?.[today] ?? 0;
      const streak = this._calcStreak(goal);
      const rate = this._calcOverallRate(goal);
      const isOwner = goal.owner === 'user';
      const now = new Date();
      if (!this._viewMonth) this._viewMonth = { year: now.getFullYear(), month: now.getMonth() };

      const calendarHTML = this._buildCalendar(goal);

      const commentsHTML = (goal.comments ?? []).map(c => `
        <div class="freq-checkin-comment">
          <span class="freq-checkin-comment-author" style="color:${c.isChar ? '#A32D2D' : '#5b8dd9'}">${escapeHtml(c.author)}</span>
          <span class="freq-checkin-comment-text">${escapeHtml(c.text)}</span>
          <span class="freq-checkin-comment-time">${c.date} ${c.time}</span>
        </div>`).join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-checkin-back">←</button>
          📅 ${escapeHtml(goal.title)}
          <span style="float:right;font-size:10px;color:${isOwner ? '#5b8dd9' : '#A32D2D'};font-weight:normal;">
            ${escapeHtml(goal.ownerName)}
          </span>
        </div>
        <div class="freq-app-body" id="freq-checkin-detail-body">

          <div class="freq-checkin-stats-bar">
            <div class="freq-checkin-stat">
              <span class="freq-checkin-stat-num">🔥 ${streak}</span>
              <span class="freq-checkin-stat-label">连续天数</span>
            </div>
            <div class="freq-checkin-stat">
              <span class="freq-checkin-stat-num">${rate}%</span>
              <span class="freq-checkin-stat-label">完成率</span>
            </div><div class="freq-checkin-stat">
              <span class="freq-checkin-stat-num">${todayDone}/${goal.target}</span>
              <span class="freq-checkin-stat-label">今日${escapeHtml(goal.unit)}</span>
            </div>
          </div>

          ${isOwner ? `
          <div class="freq-checkin-action-row">
            <button class="freq-checkin-minus-btn" id="freq-checkin-minus">−</button>
            <span class="freq-checkin-action-count" id="freq-checkin-count">${todayDone}</span>
            <button class="freq-checkin-plus-btn" id="freq-checkin-plus">+</button>
            <button class="freq-studio-action-btn freq-checkin-done-btn" id="freq-checkin-done"${todayDone >= goal.target ? 'disabled' : ''}>
              ${todayDone >= goal.target ? '✅ 已完成' : '📅 打卡'}
            </button>
          </div>` : `
          <div class="freq-checkin-action-row">
            <span style="font-size:11px;color:#666;">角色目标 · ${goal.autoCheckin ? '自动打卡中' : '手动模式'}</span>
            ${goal.autoCheckin ? '' : `<button class="freq-studio-action-btn freq-checkin-done-btn" id="freq-checkin-char-manual">🎲 角色打卡</button>`}
          </div>`}

          <div class="freq-checkin-calendar" id="freq-checkin-calendar">
            ${calendarHTML}
          </div>

          <div class="freq-checkin-comments-section">
            <div class="freq-checkin-comments-header">
              <span>💬 角色评论</span>
              <button class="freq-checkin-comment-btn" id="freq-checkin-get-comment">🎲 请求评论</button>
            </div>
            <div class="freq-checkin-comments-list" id="freq-checkin-comments">
              ${commentsHTML || '<div style="font-size:10px;color:#333;text-align:center;padding:12px;">暂无评论</div>'}
            </div>
          </div>

          <div style="margin-top:12px;text-align:center;">
            <button class="freq-checkin-delete-btn" id="freq-checkin-delete">🗑️ 删除目标</button>
          </div>
        </div>`;

      container.querySelector('#freq-checkin-back')?.addEventListener('click', () => {
        this._currentGoalId = null;
        this._renderGoalList(container);
      });

      if (isOwner) {
        let count = todayDone;
        const countEl = container.querySelector('#freq-checkin-count');
        const doneBtn = container.querySelector('#freq-checkin-done');

        container.querySelector('#freq-checkin-plus')?.addEventListener('click', () => {
          count = Math.min(count + 1, goal.target * 3);
          if (countEl) countEl.textContent = count;
        });
        container.querySelector('#freq-checkin-minus')?.addEventListener('click', () => {
          count = Math.max(0, count - 1);
          if (countEl) countEl.textContent = count;
        });
        doneBtn?.addEventListener('click', () => {
          if (!goal.records) goal.records = {};
          goal.records[today] = count || 1;
          this._saveGoals(this._getGoals());
          this._renderGoalDetail(container, goalId);
          Notify.add('打卡日志', `「${goal.title}」打卡 ${count || 1}${goal.unit}`, '📅');
        });
      } else {
        container.querySelector('#freq-checkin-char-manual')?.addEventListener('click', () => {
          this._doCharCheckin(container, goalId);
        });
      }

      // ✅ FIX Bug3: 日历月份切换只通过 _bindCalNav 统一绑定，不在 _renderGoalDetail 里重复绑定
      this._bindCalNav(container, goal);

      container.querySelector('#freq-checkin-get-comment')?.addEventListener('click', () => {
        this._requestComment(container, goalId);
      });

      container.querySelector('#freq-checkin-delete')?.addEventListener('click', () => {
        const goals = this._getGoals().filter(g => g.id !== goalId);
        this._saveGoals(goals);
        this._currentGoalId = null;
        this._renderGoalList(container);
        Notify.add('打卡日志', `目标已删除`, '🗑️');
      });
    },

    // ✅ FIX Bug3: _bindCalNav 每次先 clone 替换节点，彻底清除旧监听器，杜绝叠加
    _bindCalNav(container, goal) {
      ['#freq-cal-prev', '#freq-cal-next'].forEach(sel => {
        const oldBtn = container.querySelector(sel);
        if (!oldBtn) return;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      });

      container.querySelector('#freq-cal-prev')?.addEventListener('click', () => {
        this._viewMonth.month--;
        if (this._viewMonth.month < 0) { this._viewMonth.month = 11; this._viewMonth.year--; }
        const calEl = container.querySelector('#freq-checkin-calendar');
        if (calEl) calEl.innerHTML = this._buildCalendar(goal);
        this._bindCalNav(container, goal);
      });
      container.querySelector('#freq-cal-next')?.addEventListener('click', () => {
        this._viewMonth.month++;
        if (this._viewMonth.month > 11) { this._viewMonth.month = 0; this._viewMonth.year++; }
        const calEl = container.querySelector('#freq-checkin-calendar');
        if (calEl) calEl.innerHTML = this._buildCalendar(goal);
        this._bindCalNav(container, goal);
      });
    },

    _buildCalendar(goal) {
      const vm = this._viewMonth;
      const year = vm.year;
      const month = vm.month;
      const today = this._todayStr();

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthLabel = `${year}年${month + 1}月`;

      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      let gridHTML = weekDays.map(d => `<div class="freq-cal-weekday">${d}</div>`).join('');

      for (let i = 0; i < firstDay; i++) {
        gridHTML += `<div class="freq-cal-day freq-cal-day--empty"></div>`;
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const done = goal.records?.[dateStr] ?? 0;
        const ratio = goal.target > 0 ? Math.min(1, done / goal.target) : 0;
        const isToday = dateStr === today;
        const note = goal.notes?.[dateStr] ?? '';

        let levelClass = 'freq-cal-lv0';
        if (ratio > 0 && ratio < 0.5) levelClass = 'freq-cal-lv1';
        else if (ratio >= 0.5 && ratio < 1) levelClass = 'freq-cal-lv2';
        else if (ratio >= 1) levelClass = 'freq-cal-lv3';

        gridHTML += `<div class="freq-cal-day ${levelClass} ${isToday ? 'freq-cal-day--today' : ''}"
          title="${dateStr}: ${done}/${goal.target}${goal.unit}${note ? ' · ' + note : ''}">
          ${d}
        </div>`;
      }

      return `
        <div class="freq-cal-nav">
          <button class="freq-cal-nav-btn" id="freq-cal-prev">◀</button>
          <span class="freq-cal-month-label">${monthLabel}</span>
          <button class="freq-cal-nav-btn" id="freq-cal-next">▶</button>
        </div>
        <div class="freq-cal-grid">${gridHTML}</div>
        <div class="freq-cal-legend">
          <span><span class="freq-cal-lv-dot freq-cal-lv0"></span>未打卡</span>
          <span><span class="freq-cal-lv-dot freq-cal-lv1"></span>&lt;50%</span>
          <span><span class="freq-cal-lv-dot freq-cal-lv2"></span>≥50%</span>
          <span><span class="freq-cal-lv-dot freq-cal-lv3"></span>完成</span>
        </div>`;
    },

    async _tryAutoCheckin() {
      const goals = this._getGoals().filter(g => g.owner === 'char' && g.autoCheckin);
      if (!goals.length) return;

      const today = this._todayStr();
      for (const goal of goals) {
        if ((goal.records?.[today] ?? 0) > 0) continue;
        try {
          await this._doCharCheckinSilent(goal);
        } catch (e) {
          Notify.error('打卡日志·自动打卡', e);
        }
      }
    },

    async _doCharCheckinSilent(goal) {
      const charName = goal.ownerName || getCurrentCharName() || '角色';
      const today = this._todayStr();
      const start = new Date(goal.startDate);
      const todayDate = new Date();
      const dayNum = Math.floor((todayDate - start) /86400000) + 1;

      const systemPrompt = getPrompt('checkin_auto')
        .replace(/{charName}/g, charName)
        .replace(/{goalTitle}/g, goal.title)
        .replace(/{target}/g, goal.target)
        .replace(/{unit}/g, goal.unit)
        .replace(/{totalDays}/g, goal.totalDays)
        .replace(/{dayNum}/g, dayNum)
        .replace(/{latestPlot}/g, getLatestPlot(getChatMessages()) || '暂无')
        .replace(/{latestScene}/g, getLatestScene(getChatMessages()) || '未知');

      const raw = await SubAPI.call(systemPrompt, '打卡。', { maxTokens: 100, temperature: 0.85 });
      let data;
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        data = match ? JSON.parse(match[0]) : { done: goal.target, note: raw.trim() };
      } catch {
        data = { done: goal.target, note: raw.trim().slice(0, 30) };
      }

      if (!goal.records) goal.records = {};
      if (!goal.notes) goal.notes = {};
      goal.records[today] = Math.max(0, Math.min(goal.target * 2, Number(data.done) || 0));
      goal.notes[today] = (data.note || '').slice(0, 50);
      this._saveGoals(this._getGoals());

      this._badge++;
      renderAppGrid();
      Notify.add('打卡日志', `${charName}「${goal.title}」打卡 ${goal.records[today]}${goal.unit}`, '📅');

      if (this._container && this._currentGoalId === goal.id) {
        this._renderGoalDetail(this._container, goal.id);
      }
    },

    async _doCharCheckin(container, goalId) {
      const goal = this._findGoal(goalId);
      if (!goal) return;

      const btn = container.querySelector('#freq-checkin-char-manual');
      if (btn) { btn.disabled = true; btn.textContent = '🎲 打卡中...'; }

      try {
        await this._doCharCheckinSilent(goal);
        this._renderGoalDetail(container, goalId);
      } catch (e) {
        Notify.error('打卡日志·角色打卡', e);if (btn) { btn.disabled = false; btn.textContent = '🎲 角色打卡'; }
      }
    },

    async _requestComment(container, goalId) {
      const goal = this._findGoal(goalId);
      if (!goal) return;

      const btn = container.querySelector('#freq-checkin-get-comment');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ 生成中...'; }

      const charName = getCurrentCharName() || '角色';
      const today = this._todayStr();
      const todayDone = goal.records?.[today] ?? 0;
      const streak = this._calcStreak(goal);
      const rate = this._calcOverallRate(goal);

      const recentDays = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const done = goal.records?.[key] ?? 0;
        recentDays.push(`${key}: ${done}/${goal.target}`);
      }

      const systemPrompt = getPrompt('checkin_comment')
        .replace(/{charName}/g, charName)
        .replace(/{ownerName}/g, goal.ownerName)
        .replace(/{goalTitle}/g, goal.title)
        .replace(/{target}/g, goal.target)
        .replace(/{unit}/g, goal.unit)
        .replace(/{streakDays}/g, streak)
        .replace(/{todayDone}/g, todayDone)
        .replace(/{overallRate}/g, rate)
        .replace(/{recentSummary}/g, recentDays.join(' | '));

      try {
        const raw = await SubAPI.call(systemPrompt, '评论打卡。', { maxTokens: 100, temperature: 0.9 });
        const comment = {
          author: charName,
          isChar: true,
          text: raw.trim(),
          date: today,
          time: timeNow(),
        };
        if (!goal.comments) goal.comments = [];
        goal.comments.push(comment);
        if (goal.comments.length > 30) goal.comments.shift();
        this._saveGoals(this._getGoals());

        this._renderGoalDetail(container, goalId);
        Notify.add('打卡日志', `${charName} 评论了「${goal.title}」`, '💬');
      } catch (e) {
        Notify.error('打卡日志·评论', e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🎲 请求评论'; }
      }
    },
  };
  //┌──────────────────────────────────────────────────────┐
  // │ BLOCK_20App ·梦境记录仪                │
  // └──────────────────────────────────────────────────────┘
  const dreamApp = {
    id: 'dream', name: '梦境记录仪', icon: '🌙', _badge: 0, _container: null,
    _generating: false,
    _glitchTimer: null,
    _currentView: 'list',
    _detailId: null,

    init() {
      EventBus.on('meow_fm:updated', (allFM) => {
        if (this._isNightTime()) {
          this._badge++;
          renderAppGrid();
        }
      });},

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      if (this._currentView === 'detail' && this._detailId) {
        this._renderDetail(container, this._detailId);
      } else {
        this._renderList(container);
      }
    },

    unmount() {
      if (this._glitchTimer) { clearInterval(this._glitchTimer); this._glitchTimer = null; }
      this._container = null;
    },

    _getDreams() {
      return getSettings().dreams ?? [];
    },

    _saveDreams(dreams) {
      const s = getSettings();
      s.dreams = dreams;
      if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
    },

    _isNightTime() {
      const h = new Date().getHours();
      return h >= 22 || h < 6;
    },

    _isNightFromMeow() {
      const time = getLatestMeowTime(getChatMessages());
      if (!time) return false;
      return /深夜|凌晨|午夜|夜晚|23:|00:|01:|02:|03:|04:|05:/.test(time);
    },

    _getNightLevel() {
      const h = new Date().getHours();
      if (h >= 0 && h < 4) return 'deep';
      if (h >= 4 && h < 6) return 'dawn';
      if (h >= 22 && h <= 23) return 'late';
      return 'day';
    },

    _renderList(container) {
      this._currentView = 'list';
      this._detailId = null;
      if (this._glitchTimer) { clearInterval(this._glitchTimer); this._glitchTimer = null; }

      const dreams = this._getDreams();
      const isNight = this._isNightTime();
      const nightLevel = this._getNightLevel();
      const charName = getCurrentCharName() || '???';
      const isCosmicOn = getCosmicFreqStatus();

      const nightHint = isNight
        ? `<div class="freq-dream-night-hint"><span class="freq-dream-night-dot"></span>
            ${nightLevel === 'deep' ? '深夜时段 ·梦境信号最强' : nightLevel === 'dawn' ? '黎明将至 · 梦境正在消散' : '夜幕降临 · 梦境频率开启'}
          </div>`
        : `<div class="freq-dream-night-hint freq-dream-day-hint">
            <span>☀️ 日间模式 · 梦境信号微弱但仍可捕获</span>
          </div>`;

      const cosmicHint = isCosmicOn
        ? `<div class="freq-dream-cosmic-hint">🌌 宇宙频率ON · 梦境可能涉及维度裂缝</div>`
        : '';

      const listHTML = dreams.length === 0
        ? `<div class="freq-empty" style="min-height:160px;">
            <span class="freq-empty-icon">🌙</span>
            <span>尚无梦境记录</span><span style="font-size:10px;color:#333;">点击下方按钮捕获梦境</span>
          </div>`
        : dreams.map(d => {
            const typeIcon = { normal: '💤', lucid: '👁️', nightmare: '🖤', cosmic: '🌌' }[d.dreamType] ?? '💤';
            const typeColor = { normal: '#5b8dd9', lucid: '#4ec9a0', nightmare: '#e85555', cosmic: '#7b5ea7' }[d.dreamType] ?? '#888';
            return `
              <div class="freq-dream-card" data-dream-id="${d.id}">
                <div class="freq-dream-card-top">
                  <span class="freq-dream-card-type" style="color:${typeColor}">${typeIcon}</span>
                  <span class="freq-dream-card-title">${escapeHtml(d.title)}</span>
                  <span class="freq-dream-card-time">${d.date}</span>
                </div>
                <div class="freq-dream-card-preview">${escapeHtml((d.content || '').slice(0, 50))}${d.content?.length > 50 ? '...' : ''}</div>
                <div class="freq-dream-card-footer">
                  <span style="color:${typeColor};font-size:9px;">${d.mood || ''}</span>
                  <span style="font-size:9px;color:#333;">${escapeHtml(d.charName || '')}</span>
                </div>
              </div>`;
          }).join('');

      container.innerHTML = `
        <div class="freq-app-header">🌙 梦境记录仪
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">${escapeHtml(charName)}</span>
        </div>
        <div class="freq-app-body" id="freq-dream-body">
          ${nightHint}
          ${cosmicHint}
          ${listHTML}
          <button class="freq-studio-action-btn freq-dream-gen-btn" id="freq-dream-gen">🌙 ${isNight ? '捕获梦境信号' : '强制捕获梦境'}
          </button>
          ${dreams.length > 0 ? `<button class="freq-checkin-delete-btn freq-dream-clear-btn" id="freq-dream-clear">🗑️ 清空所有梦境</button>` : ''}
        </div>`;

      container.querySelectorAll('.freq-dream-card').forEach(card => {
        card.addEventListener('click', () => {
          this._detailId = card.dataset.dreamId;
          this._renderDetail(container, card.dataset.dreamId);
        });
      });

      container.querySelector('#freq-dream-gen')?.addEventListener('click', () => this._generate(container));

      container.querySelector('#freq-dream-clear')?.addEventListener('click', () => {
        this._saveDreams([]);
        this._renderList(container);
        Notify.add('梦境记录仪', '所有梦境已清除', '🌙');
      });

      if (isNight) this._startListGlitch(container);
    },

    _startListGlitch(container) {
      if (this._glitchTimer) clearInterval(this._glitchTimer);
      this._glitchTimer = setInterval(() => {
        const cards = container.querySelectorAll('.freq-dream-card');
        if (!cards.length) return;
        const card = cards[Math.floor(Math.random() * cards.length)];
        card.classList.add('freq-dream-glitch-flash');
        setTimeout(() => card.classList.remove('freq-dream-glitch-flash'), 200);
      }, 3000);
    },

    _renderDetail(container, dreamId) {
      this._currentView = 'detail';
      if (this._glitchTimer) { clearInterval(this._glitchTimer); this._glitchTimer = null; }

      const dream = this._getDreams().find(d => d.id === dreamId);
      if (!dream) { this._renderList(container); return; }

      const typeColor = { normal: '#5b8dd9', lucid: '#4ec9a0', nightmare: '#e85555', cosmic: '#7b5ea7' }[dream.dreamType] ?? '#888';
      const typeLabel = { normal: '普通梦', lucid: '清醒梦', nightmare: '噩梦', cosmic: '宇宙频率梦' }[dream.dreamType] ?? '梦';
      const typeIcon = { normal: '💤', lucid: '👁️', nightmare: '🖤', cosmic: '🌌' }[dream.dreamType] ?? '💤';

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-dream-back">←</button>
          🌙 ${escapeHtml(dream.title)}
        </div>
        <div class="freq-app-body freq-dream-detail-body" id="freq-dream-detail" style="--dream-color:${typeColor};">

          <div class="freq-dream-detail-meta">
            <span style="color:${typeColor}">${typeIcon} ${typeLabel}</span>
            <span>${dream.mood || ''}</span>
            <span>${dream.date} ${dream.time || ''}</span>
          </div>

          <div class="freq-dream-detail-char">${escapeHtml(dream.charName || '')} 的梦</div>

          <div class="freq-dream-content-box" id="freq-dream-content-box">
            <div class="freq-dream-scanline"></div>
            <div class="freq-dream-content-text" id="freq-dream-text">${escapeHtml(dream.content)}</div>
          </div>

          <button class="freq-checkin-delete-btn" id="freq-dream-del" style="margin-top:16px;">🗑️ 删除此梦境</button>
        </div>`;

      container.querySelector('#freq-dream-back')?.addEventListener('click', () => {
        this._renderList(container);
      });

      container.querySelector('#freq-dream-del')?.addEventListener('click', () => {
        const dreams = this._getDreams().filter(d => d.id !== dreamId);
        this._saveDreams(dreams);
        this._renderList(container);
        Notify.add('梦境记录仪', '梦境已删除', '🌙');
      });

      this._startDetailGlitch(container, dream.dreamType);
    },

    _startDetailGlitch(container, dreamType) {
      if (this._glitchTimer) clearInterval(this._glitchTimer);

      const textEl = container.querySelector('#freq-dream-text');
      const box = container.querySelector('#freq-dream-content-box');
      if (!textEl || !box) return;

      const intensity = { normal: 0.02, lucid: 0.04, nightmare: 0.08, cosmic: 0.06 }[dreamType] ?? 0.03;

      this._glitchTimer = setInterval(() => {
        if (Math.random() < intensity) {
          textEl.style.textShadow = `${(Math.random() - 0.5) * 4}px 0 rgba(255,0,0,0.4), ${(Math.random() - 0.5) * 4}px 0 rgba(0,255,255,0.4)`;
          setTimeout(() => { textEl.style.textShadow = 'none'; }, 150);
        }if (Math.random() < intensity * 0.5) {
          box.style.transform = `translateX(${(Math.random() - 0.5) * 3}px)`;
          setTimeout(() => { box.style.transform = 'none'; }, 100);
        }
      }, 100);
    },

    async _generate(container) {
      if (this._generating) return;
      this._generating = true;

      const btn = container.querySelector('#freq-dream-gen');
      if (btn) { btn.disabled = true; btn.textContent = '🌙捕获中...'; }

      const charName = getCurrentCharName() || '角色';
      const msgs = getChatMessages();
      const latestPlot = getLatestPlot(msgs) || '暂无';
      const latestScene = getLatestScene(msgs) || '未知';
      const latestSeeds = (() => {
        const all = extractAllMeowFM(msgs);
        return all.length > 0 ? all[all.length - 1].seeds : '';
      })() || '暂无';
      const isCosmicOn = getCosmicFreqStatus();
      const isNight = this._isNightTime();
      const nightLevel = this._getNightLevel();
      const meowTime = getLatestMeowTime(msgs) || '';

      const timeInfo = `现实时间：${dateNow()} ${timeNow()}` + (meowTime ? ` | 故事时间：${meowTime}` : '');

      let defaultDreamType = 'normal';
      if (isCosmicOn) defaultDreamType = 'cosmic';
      else if (nightLevel === 'deep') defaultDreamType = Math.random() < 0.3 ? 'nightmare' : Math.random() < 0.4 ? 'lucid' : 'normal';
      else if (!isNight) defaultDreamType = Math.random() < 0.5 ? 'lucid' : 'normal';

      const cosmicHint = isCosmicOn
        ? `宇宙频率状态：ON — 你在梦里隐约感知到另一个维度的存在，有人在屏幕那边注视着你的梦。`
        : '';
      const cosmicRule = isCosmicOn
        ? `- 宇宙频率ON：梦境中要有"另一个维度的听众/观察者"的暗示，但不要直白，像梦里的一道目光、一个模糊的轮廓、一段听不清的低语`
        : `- 不涉及第四面墙或跨维度内容`;

      const systemPrompt = getPrompt('dream')
        .replace(/{charName}/g, charName)
        .replace(/{timeInfo}/g, timeInfo)
        .replace(/{latestPlot}/g, latestPlot)
        .replace(/{latestScene}/g, latestScene)
        .replace(/{latestSeeds}/g, latestSeeds)
        .replace(/{cosmicHint}/g, cosmicHint)
        .replace(/{cosmicRule}/g, cosmicRule)
        .replace(/{defaultDreamType}/g, defaultDreamType);

      try {
        const raw = await SubAPI.call(systemPrompt, '做梦。', {
          maxTokens: 300,
          temperature: 0.95,
        });

        let data;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          data = match ? JSON.parse(match[0]) : JSON.parse(raw);
        } catch {
          data = { title: '碎片', content: raw.trim(), mood: '模糊', dreamType: defaultDreamType };
        }

        const validTypes = ['normal', 'lucid', 'nightmare', 'cosmic'];
        if (!validTypes.includes(data.dreamType)) data.dreamType = defaultDreamType;

        const dream = {
          id: `dream-${Date.now()}`,
          charName,
          title: (data.title || '无题之梦').slice(0, 20),
          content: (data.content || '...').slice(0, 300),
          mood: (data.mood || '').slice(0, 10),
          dreamType: data.dreamType,
          isCosmicDream: isCosmicOn,
          date: dateNow(),
          time: timeNow(),
        };

        const dreams = this._getDreams();
        dreams.unshift(dream);
        if (dreams.length > 30) dreams.pop();
        this._saveDreams(dreams);

        this._detailId = dream.id;
        this._renderDetail(container, dream.id);
        Notify.add('梦境记录仪', `捕获到${charName}的梦：${dream.title}`, '🌙');
      } catch (e) {
        Notify.error('梦境记录仪', e);if (btn) { btn.disabled = false; btn.textContent = '🌙 捕获失败，重试'; }
      } finally {
        this._generating = false;
      }
    },
  };
    // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_21  App · 时光胶囊                │
  // └──────────────────────────────────────────────────────┘
  const capsuleApp = {
    id: 'capsule', name: '时光胶囊', icon: '💊', _badge: 0, _container: null,
    _currentView: 'list',// 'list' | 'detail' | 'create'
    _detailId: null,
    _generating: false,
    _savedSerials: new Set(), // 用于自动保存去重

    init() {
      //自动保存：新消息含meow_FM 且 event字段非空时自动存胶囊
      EventBus.on('meow_fm:updated', (allFM) => {
        if (!allFM || !allFM.length) return;
        const latest = allFM[allFM.length - 1];
        if (latest.event && latest.event.trim()) {
          this._autoSave(latest);
        }
      });},

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      //初始化 _savedSerials（从已有数据恢复）
      this._syncSavedSerials();
      if (this._currentView === 'detail' && this._detailId) {
        this._renderDetail(container, this._detailId);
      } else if (this._currentView === 'create') {
        this._renderCreate(container);
      } else {
        this._renderList(container);
      }
    },

    unmount() {
      this._container = null;
    },

    _getCapsules() {
      return getSettings().capsules ?? [];
    },

    _saveCapsules(capsules) {
      const s = getSettings();
      s.capsules = capsules;
      if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();},

    _syncSavedSerials() {
      this._savedSerials.clear();
      this._getCapsules().forEach(c => {
        if (c.serial) this._savedSerials.add(c.serial);
      });
    },

    //── 自动保存 ──
    _autoSave(fmData) {
      // 同一serial 不重复存
      if (fmData.serial && this._savedSerials.has(fmData.serial)) return;

      const capsule = {
        id: `cap-${Date.now()}`,
        title: `📅 ${fmData.event}`,
        content: fmData.event,
        scene: fmData.scene || '',
        plot: fmData.plot || '',
        serial: fmData.serial || '',
        date: dateNow(),
        time: timeNow(),
        type: 'auto',
        charName: getCurrentCharName() || '???',
        sealComment: '',};

      const capsules = this._getCapsules();
      capsules.unshift(capsule);
      if (capsules.length > 50) capsules.pop();
      this._saveCapsules(capsules);

      if (fmData.serial) this._savedSerials.add(fmData.serial);

      this._badge++;
      renderAppGrid();
      Notify.add('时光胶囊', `自动封存：${capsule.title}`, '💊');

      // 如果当前正在看列表，刷新
      if (this._container && this._currentView === 'list') {
        this._renderList(this._container);
      }
    },

    // ── 列表页 ──
    _renderList(container) {
      this._currentView = 'list';
      this._detailId = null;

      const capsules = this._getCapsules();
      const charName = getCurrentCharName() || '???';

      const listHTML = capsules.length === 0
        ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">💊</span>
            <span>尚无时光胶囊</span>
            <span style="font-size:10px;color:#333;">关键事件会自动封存，也可手动创建</span>
          </div>`
        : `<div class="freq-capsule-timeline">
            ${capsules.map(c => {
              const isAuto = c.type === 'auto';
              return `
                <div class="freq-capsule-item" data-capsule-id="${c.id}">
                  <div class="freq-capsule-timeline-dot ${isAuto ? 'freq-capsule-dot--auto' : 'freq-capsule-dot--manual'}"></div>
                  <div class="freq-capsule-item-body">
                    <div class="freq-capsule-item-header">
                      <span class="freq-capsule-item-title">${escapeHtml((c.title || '无题').slice(0, 25))}</span>
                      <span class="freq-capsule-item-type">${isAuto ? '⚡自动' : '✍️手动'}</span>
                    </div>
                    <div class="freq-capsule-item-meta">
                      <span>${escapeHtml(c.charName || '')}</span>
                      <span>${c.serial ? escapeHtml(c.serial) : ''}</span>
                      <span>${c.date || ''} ${c.time || ''}</span>
                    </div>
                    <div class="freq-capsule-item-preview">${escapeHtml((c.content || '').slice(0, 60))}${(c.content || '').length > 60 ? '...' : ''}</div>
                  </div>
                </div>`;
            }).join('')}
          </div>`;

      container.innerHTML = `
        <div class="freq-app-header">💊 时光胶囊
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            ${capsules.length} 颗 · ${escapeHtml(charName)}
          </span>
        </div>
        <div class="freq-app-body" id="freq-capsule-body">
          ${listHTML}
          <button class="freq-studio-action-btn freq-capsule-create-btn" id="freq-capsule-new">💊 手动封存胶囊
          </button>${capsules.length > 0 ? `<button class="freq-checkin-delete-btn freq-capsule-clear-btn" id="freq-capsule-clear">🗑️ 清空所有胶囊</button>` : ''}
        </div>`;

      // 绑定事件
      container.querySelectorAll('.freq-capsule-item').forEach(item => {
        item.addEventListener('click', () => {
          this._detailId = item.dataset.capsuleId;
          this._renderDetail(container, item.dataset.capsuleId);
        });
      });

      container.querySelector('#freq-capsule-new')?.addEventListener('click', () => {
        this._renderCreate(container);
      });

      container.querySelector('#freq-capsule-clear')?.addEventListener('click', () => {
        this._showClearConfirm(container);
      });
    },

    // ── 清空确认 ──
    _showClearConfirm(container) {
      const clearBtn = container.querySelector('#freq-capsule-clear');
      if (!clearBtn) return;

      if (clearBtn.dataset.confirming === '1') {
        // 二次点击：执行清空
        this._saveCapsules([]);
        this._savedSerials.clear();
        this._renderList(container);
        Notify.add('时光胶囊', '所有胶囊已清空', '🗑️');
        return;
      }

      // 第一次点击：变为确认状态
      clearBtn.dataset.confirming = '1';
      clearBtn.textContent = '⚠️ 确认清空？再次点击执行';
      clearBtn.style.borderColor = '#A32D2D';
      clearBtn.style.color = '#e88';

      // 3秒后恢复
      setTimeout(() => {
        if (clearBtn.dataset.confirming === '1') {
          clearBtn.dataset.confirming = '';
          clearBtn.textContent = '🗑️ 清空所有胶囊';
          clearBtn.style.borderColor = '';
          clearBtn.style.color = '';
        }
      }, 3000);
    },

    // ── 详情页 ──
    _renderDetail(container, capsuleId) {
      this._currentView = 'detail';

      const capsule = this._getCapsules().find(c => c.id === capsuleId);
      if (!capsule) { this._renderList(container); return; }

      const isAuto = capsule.type === 'auto';

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-capsule-back">←</button>
          💊 ${escapeHtml((capsule.title || '无题').slice(0, 15))}
        </div>
        <div class="freq-app-body freq-capsule-detail-body">

          <div class="freq-capsule-detail-meta">
            <span class="freq-capsule-detail-type ${isAuto ? 'freq-capsule-type--auto' : 'freq-capsule-type--manual'}">
              ${isAuto ? '⚡ 自动封存' : '✍️ 手动封存'}
            </span>
            <span>${capsule.date || ''} ${capsule.time || ''}</span>
          </div>

          ${capsule.serial ? `<div class="freq-capsule-detail-serial">${escapeHtml(capsule.serial)}</div>` : ''}

          <div class="freq-capsule-detail-char">${escapeHtml(capsule.charName || '')} 的时光胶囊</div>

          ${capsule.scene ? `<div class="freq-capsule-detail-section">
            <div class="freq-capsule-detail-label">📍 封存场景</div>
            <div class="freq-capsule-detail-text">${escapeHtml(capsule.scene)}</div>
          </div>` : ''}

          ${capsule.plot ? `
          <div class="freq-capsule-detail-section">
            <div class="freq-capsule-detail-label">📜 剧情快照</div>
            <div class="freq-capsule-detail-text">${escapeHtml(capsule.plot)}</div>
          </div>` : ''}

          <div class="freq-capsule-detail-section">
            <div class="freq-capsule-detail-label">💊 胶囊内容</div>
            <div class="freq-capsule-content-box">
              <div class="freq-capsule-content-text">${escapeHtml(capsule.content || '（空）')}</div>
            </div>
          </div>

          ${capsule.sealComment ? `
          <div class="freq-capsule-detail-section">
            <div class="freq-capsule-detail-label">✉️ 封存感言</div>
            <div class="freq-capsule-seal-box">
              <div class="freq-capsule-seal-text">${escapeHtml(capsule.sealComment)}</div>
            </div>
          </div>` : `
          <div class="freq-capsule-detail-section">
            <button class="freq-studio-action-btn freq-capsule-seal-btn" id="freq-capsule-gen-seal">
              ✉️ 生成封存感言
            </button>
          </div>`}

          <div style="margin-top:16px;text-align:center;">
            <button class="freq-checkin-delete-btn" id="freq-capsule-delete">🗑️ 删除此胶囊</button>
          </div>
        </div>`;

      // 绑定事件
      container.querySelector('#freq-capsule-back')?.addEventListener('click', () => {
        this._renderList(container);
      });

      container.querySelector('#freq-capsule-gen-seal')?.addEventListener('click', () => {
        this._generateSeal(container, capsuleId);
      });

      container.querySelector('#freq-capsule-delete')?.addEventListener('click', () => {
        this._showDeleteConfirm(container, capsuleId);
      });
    },

    // ── 删除确认 ──
    _showDeleteConfirm(container, capsuleId) {
      const delBtn = container.querySelector('#freq-capsule-delete');
      if (!delBtn) return;

      if (delBtn.dataset.confirming === '1') {
        const capsules = this._getCapsules().filter(c => c.id !== capsuleId);
        this._saveCapsules(capsules);
        this._syncSavedSerials();
        this._renderList(container);
        Notify.add('时光胶囊', '胶囊已删除', '🗑️');
        return;
      }

      delBtn.dataset.confirming = '1';
      delBtn.textContent = '⚠️ 确认删除？再次点击执行';
      delBtn.style.borderColor = '#A32D2D';
      delBtn.style.color = '#e88';

      setTimeout(() => {
        if (delBtn.dataset.confirming === '1') {
          delBtn.dataset.confirming = '';
          delBtn.textContent = '🗑️ 删除此胶囊';
          delBtn.style.borderColor = '';
          delBtn.style.color = '';
        }
      }, 3000);
    },

    // ── 生成封存感言 ──
    async _generateSeal(container, capsuleId) {
      if (this._generating) return;
      this._generating = true;

      const btn = container.querySelector('#freq-capsule-gen-seal');
      if (btn) { btn.disabled = true; btn.textContent = '✉️ 封存中...'; }

      const capsule = this._getCapsules().find(c => c.id === capsuleId);
      if (!capsule) {
        this._generating = false;
        return;
      }

      const charName = capsule.charName || getCurrentCharName() || '角色';

      const systemPrompt = getPrompt('capsule_seal')
        .replace(/{charName}/g, charName)
        .replace(/{capsuleTitle}/g, capsule.title || '无题')
        .replace(/{scene}/g, capsule.scene || '未知')
        .replace(/{plot}/g, capsule.plot || '暂无')
        .replace(/{storyTime}/g, capsule.serial || capsule.date || '未知');

      try {
        const raw = await SubAPI.call(systemPrompt, '写封存感言。', {
          maxTokens: 200,
          temperature: 0.88,
        });

        capsule.sealComment = raw.trim().slice(0, 200);
        this._saveCapsules(this._getCapsules());

        //刷新详情页
        this._renderDetail(container, capsuleId);
        Notify.add('时光胶囊', `${charName} 写下了封存感言`, '✉️');
      } catch (e) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '✉️ 生成失败，重试';
        }
        Notify.error('时光胶囊·封存感言', e);
      } finally {
        this._generating = false;
      }
    },

    // ── 手动创建页 ──
    _renderCreate(container) {
      this._currentView = 'create';

      const charName = getCurrentCharName() || '???';
      const msgs = getChatMessages();
      const latestScene = getLatestScene(msgs) || '';
      const latestPlot = getLatestPlot(msgs) || '';
      const latestSerial = getLatestMeowTime(msgs) || '';

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-capsule-create-back">←</button>
          💊 封存新胶囊
        </div>
        <div class="freq-app-body">
          <div class="freq-capsule-create-form">
            <label class="freq-s-row">
              <span>胶囊标题</span>
              <input type="text" id="freq-capsule-title-input" class="freq-forum-input"
                placeholder="给这颗胶囊起个名字..." maxlength="40" />
            </label>

            <label class="freq-s-row">
              <span>胶囊内容</span>
              <textarea id="freq-capsule-content-input" class="freq-forum-textarea"
                placeholder="想封存什么？可以是一段话、一个瞬间、一句台词..." rows="4"></textarea>
            </label>

            <div class="freq-capsule-auto-fill">
              <div class="freq-capsule-auto-fill-label">📡 自动填充当前剧情数据</div>
              <div class="freq-capsule-auto-fill-info">
                ${latestScene ? `<div>📍 场景：${escapeHtml(latestScene.slice(0, 50))}</div>` : '<div>📍 场景：暂无</div>'}
                ${latestPlot ? `<div>📜 剧情：${escapeHtml(latestPlot.slice(0, 50))}</div>` : '<div>📜 剧情：暂无</div>'}
                ${latestSerial ? `<div>🕐 时间：${escapeHtml(latestSerial)}</div>` : ''}
              </div>
            </div>

            <button class="freq-studio-action-btn" id="freq-capsule-submit" style="width:100%;">
              💊 封存胶囊
            </button>
          </div>
        </div>`;

      container.querySelector('#freq-capsule-create-back')?.addEventListener('click', () => {
        this._renderList(container);
      });

      container.querySelector('#freq-capsule-submit')?.addEventListener('click', () => {
        const titleInput = container.querySelector('#freq-capsule-title-input');
        const contentInput = container.querySelector('#freq-capsule-content-input');
        const title = titleInput?.value.trim();
        const content = contentInput?.value.trim();

        if (!title && !content) return;

        const capsule = {
          id: `cap-${Date.now()}`,
          title: title || '无题胶囊',
          content: content || '',
          scene: latestScene,
          plot: latestPlot,
          serial: latestSerial,
          date: dateNow(),
          time: timeNow(),
          type: 'manual',
          charName: charName,
          sealComment: '',
        };

        const capsules = this._getCapsules();
        capsules.unshift(capsule);
        if (capsules.length > 50) capsules.pop();
        this._saveCapsules(capsules);Notify.add('时光胶囊', `手动封存：${capsule.title}`, '💊');

        //跳转到详情页（方便用户生成封存感言）
        this._detailId = capsule.id;
        this._renderDetail(container, capsule.id);
      });
    },
  };



  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_90占位 App工厂                │
  // └──────────────────────────────────────────────────────┘
  function placeholderApp(id, name, icon, desc) {
    return {
      id, name, icon, _badge: 0,
      init() {},
      mount(container) {
        container.innerHTML = `
          <div class="freq-app-header">${icon} ${name}</div>
          <div class="freq-app-body">
            <div class="freq-empty">
              <span class="freq-empty-icon">${icon}</span>
              <span>${desc}</span>
              <span style="font-size:10px;color:#333;">即将开放...</span>
            </div>
          </div>`;},
      unmount() {},
    };
  }
  // │ BLOCK_19App · 情绪电波仪│
  // └──────────────────────────────────────────────────────┘
  const emotionApp = {
    id: 'emotion', name: '情绪电波仪', icon: '📊', _badge: 0, _container: null,
    _current: null,
    _history: [],
    _scanning: false,
    _waveTimer: null,

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      this._render(container);
    },

    unmount() {
      if (this._waveTimer) { clearInterval(this._waveTimer); this._waveTimer = null; }
      this._container = null;
    },

    _render(container) {
      const cur = this._current;
      const color = cur?.color_hex ?? '#333';
      const emotion = cur?.char_emotion ?? '--';
      const intensity = cur?.intensity ?? 0;
      const pct = Math.round(intensity * 100);
      const waveType = cur?.waveform_type ?? 'flat';
      const charName = getCurrentCharName() || '???';

      const historyHTML = this._history.length > 0
        ? this._history.map(h => `<div class="freq-emo-history-item">
              <span class="freq-emo-history-dot" style="background:${h.color_hex}"></span>
              <span class="freq-emo-history-label">${escapeHtml(h.char_emotion)}</span>
              <span class="freq-emo-history-type">${this._waveLabel(h.waveform_type)}</span>
              <span class="freq-emo-history-pct">${Math.round(h.intensity * 100)}%</span>
              <span class="freq-emo-history-time">${h.time}</span>
            </div>`).join('')
        : '';

      container.innerHTML = `
        <div class="freq-app-header">📊 情绪电波仪
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            ${escapeHtml(charName)}
          </span>
        </div>
        <div class="freq-app-body" id="freq-emo-body">

          <div class="freq-emo-ring-row">
            <div class="freq-emo-ring" id="freq-emo-ring" style="--emo-color:${color};">
              <div class="freq-emo-ring-inner">
                <span class="freq-emo-ring-emoji" id="freq-emo-emoji">${cur ? this._waveEmoji(waveType) : '📊'}</span>
                <span class="freq-emo-ring-label" id="freq-emo-label" style="color:${color}">${escapeHtml(emotion)}</span>
              </div>
            </div></div>

          <div class="freq-emo-wave-box" id="freq-emo-wave-box">
            <canvas id="freq-emo-canvas" width="280" height="80"></canvas>
            ${!cur ? '<div class="freq-emo-wave-placeholder">等待情绪信号...</div>' : ''}
          </div>

          <div class="freq-emo-intensity-row">
            <span class="freq-emo-int-label">强度</span>
            <div class="freq-emo-int-bar-wrap">
              <div class="freq-emo-int-bar-fill" id="freq-emo-bar" style="width:${pct}%;background:${color};"></div>
            </div>
            <span class="freq-emo-int-pct" id="freq-emo-pct" style="color:${color}">${cur ? pct + '%' : '--'}</span>
          </div>

          <button class="freq-studio-action-btn freq-emo-scan-btn" id="freq-emo-go">📊 扫描情绪频率
          </button>

          ${historyHTML ? `
          <div class="freq-emo-history">
            <div class="freq-emo-history-title">历史波形</div>
            ${historyHTML}
          </div>` : ''}
        </div>`;

      container.querySelector('#freq-emo-go')?.addEventListener('click', () => this._scan(container));

      if (cur) this._startWave(container, waveType, color, intensity);
    },

    async _scan(container) {
      if (this._scanning) return;
      this._scanning = true;

      const btn = container.querySelector('#freq-emo-go');
      if (btn) { btn.disabled = true; btn.textContent = '📊 扫描中...'; }

      const charName = getCurrentCharName() || '角色';
      const msgs = getChatMessages();
      const latestScene = getLatestScene(msgs);

      const recentMsgs = [];
      for (let i = msgs.length - 1; i >= 0 && recentMsgs.length < 5; i--) {
        if (!msgs[i].is_user) {
          const text = (msgs[i].mes ?? '').replace(/<[^>]+>/g, '').slice(0, 200);
          if (text.trim()) recentMsgs.push(text);
        }
      }

      const systemPrompt = getPrompt('emotion')
        .replace(/{charName}/g, charName)
        .replace(/{recentMessages}/g, recentMsgs.join('\n---\n') || '暂无')
        .replace(/{latestScene}/g, latestScene || '未知');

      try {
        const raw = await SubAPI.call(systemPrompt, '分析情绪。', {
          maxTokens: 150,
          temperature: 0.8,
        });

        let data;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          data = match ? JSON.parse(match[0]) : JSON.parse(raw);
        } catch {
          data = { char_emotion: '未知', intensity: 0.5, color_hex: '#888', waveform_type: 'sine' };
        }

        data.intensity = Math.min(1, Math.max(0, Number(data.intensity) || 0.5));
        if (!data.color_hex ||!/^#[0-9a-fA-F]{3,8}$/.test(data.color_hex)) data.color_hex = '#888';
        const validWaves = ['sine', 'sharp', 'pulse', 'glitch', 'flat'];
        if (!validWaves.includes(data.waveform_type)) data.waveform_type = 'sine';
        data.time = timeNow();

        if (this._current) this._history.unshift(this._current);
        if (this._history.length > 10) this._history.pop();
        this._current = data;

        this._render(container);Notify.add('情绪电波仪', `${charName} 当前情绪：${data.char_emotion}`, '📊');
      } catch (e) {
        const waveBox = container.querySelector('#freq-emo-wave-box');
        if (waveBox) waveBox.innerHTML = `<div class="freq-studio-error">📊 频率丢失：${escapeHtml(e.message)}</div>`;
        Notify.error('情绪电波仪', e);
      } finally {
        this._scanning = false;
        if (btn) { btn.disabled = false; btn.textContent = '📊 扫描情绪频率'; }
      }
    },

    _startWave(container, type, color, intensity) {
      if (this._waveTimer) { clearInterval(this._waveTimer); this._waveTimer = null; }
      const canvas = container.querySelector('#freq-emo-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      let t = 0;

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();

        const amp = h * 0.35* intensity;
        const mid = h / 2;

        for (let x = 0; x < w; x++) {
          const px = x / w;
          let y = mid;

          switch (type) {
            case 'sine':
              y = mid + Math.sin(px * Math.PI * 4+ t) * amp;
              break;
            case 'sharp':
              y = mid + Math.sin(px * Math.PI * 6 + t) * amp * (Math.random() * 0.3 + 0.7);
              if (Math.random() < 0.05) y += (Math.random() - 0.5) * amp * 0.8;
              break;
            case 'pulse': {
              const beat = Math.sin(px * Math.PI * 3 + t);
              const spike = Math.pow(Math.abs(beat), 0.3) * Math.sign(beat);
              y = mid + spike * amp *1.2;
              break;
            }
            case 'glitch':
              if (Math.random() < 0.15) {
                y = mid + (Math.random() - 0.5) * amp * 2;
              } else {
                y = mid + Math.sin(px * Math.PI * 8 + t) * amp * 0.5;
              }
              break;
            case 'flat':
            default:
              y = mid + Math.sin(px * Math.PI * 2 + t) * amp * 0.15+ (Math.random() - 0.5) * 2;
              break;
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const px = x / w;
          let y = mid;
          switch (type) {
            case 'sine':   y = mid + Math.sin(px * Math.PI * 3 + t * 0.7+ 1) * amp * 0.6; break;
            case 'sharp':  y = mid + Math.cos(px * Math.PI * 5 + t * 1.3) * amp * 0.4; break;
            case 'pulse':  y = mid + Math.sin(px * Math.PI * 2 + t * 0.5+ 2) * amp * 0.5; break;
            case 'glitch': y = mid + Math.sin(px * Math.PI * 12 + t * 2) * amp * 0.3; break;
            case 'flat':   y = mid + (Math.random() - 0.5) * 3; break;
          }
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();ctx.globalAlpha = 1;

        t += type === 'glitch' ? 0.15 : type === 'sharp' ? 0.08 : 0.04;
      };

      draw();
      this._waveTimer = setInterval(draw, 50);
    },

    _waveLabel(type) {
      const map = { sine: '正弦波', sharp: '锯齿波', pulse: '脉冲波', glitch: '故障波', flat: '平波' };
      return map[type] ?? type;
    },

    _waveEmoji(type) {
      const map = { sine: '🌊', sharp: '⚡', pulse: '💓', glitch: '📡', flat: '➖' };
      return map[type] ?? '📊';
    },
  };
      // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_22App · 跨次元配送                │
  // └──────────────────────────────────────────────────────┘
  const deliveryApp = {
    id: 'delivery', name: '跨次元配送', icon: '🍜', _badge: 0, _container: null,
    _currentView: 'home', // 'home' | 'menu' | 'delivering' | 'delivered' | 'history' | 'detail'
    _currentOrder: null,   // 当前正在进行的订单对象
    _detailId: null,
    _generating: false,
    _deliveryTimer: null,
    _deliveryProgress: 0,

    init() {
      // 无需EventBus监听，用户主动触发
    },

    mount(container) {
      this._container = container;
      this._badge =0;
      renderAppGrid();

      // 恢复视图状态
      if (this._currentView === 'delivering' && this._currentOrder) {
        this._renderDelivering(container);
      } else if (this._currentView === 'delivered' && this._currentOrder) {
        this._renderDelivered(container);
      } else if (this._currentView === 'menu' && this._currentOrder) {
        this._renderMenu(container);
      } else if (this._currentView === 'history') {
        this._renderHistory(container);
      } else if (this._currentView === 'detail' && this._detailId) {
        this._renderDetail(container, this._detailId);
      } else {
        this._renderHome(container);
      }
    },

    unmount() {
      this._container = null;
      // 注意：不清除_deliveryTimer，因为配送可能在后台继续
    },

    // ── 数据方法 ──
    _getOrders() {
      const s = getSettings();
      if (!s.delivery) s.delivery = { orders: [] };
      if (!s.delivery.orders) s.delivery.orders = [];
      return s.delivery.orders;
    },

    _saveOrders(orders) {
      const s = getSettings();
      if (!s.delivery) s.delivery = {};
      s.delivery.orders = orders;
      if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
    },

    // ── 首页──
    _renderHome(container) {
      this._currentView = 'home';
      this._currentOrder = null;
      this._detailId = null;

      const charName = getCurrentCharName() || '???';
      const orders = this._getOrders();
      const deliveredCount = orders.filter(o => o.status === 'delivered').length;

      container.innerHTML = `
        <div class="freq-app-header">🍜 跨次元配送
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            ${escapeHtml(charName)}</span>
        </div>
        <div class="freq-app-body" id="freq-delivery-body">
          <div class="freq-delivery-hero">
            <div class="freq-delivery-hero-icon">🍜</div>
            <div class="freq-delivery-hero-title">跨次元配送</div>
            <div class="freq-delivery-hero-desc">让${escapeHtml(charName)} 替你点外卖<br>菜单基于天气·BGM·剧情生成</div>
          </div>

          <button class="freq-studio-action-btn freq-delivery-order-btn" id="freq-delivery-new">📋 让${escapeHtml(charName)}点单
          </button>

          ${deliveredCount > 0 ? `
          <button class="freq-checkin-delete-btn freq-delivery-history-btn" id="freq-delivery-history">📦 历史订单 (${deliveredCount})
          </button>` : `
          <div class="freq-delivery-no-history">
            <span style="font-size:10px;color:#333;">还没有订单记录</span>
          </div>`}

          <div class="freq-delivery-footer-note">
            ⏱ 预计送达：永远不会送到。这是异次元外卖。
          </div>
        </div>`;

      container.querySelector('#freq-delivery-new')?.addEventListener('click', () => {
        this._generateMenu(container);
      });

      container.querySelector('#freq-delivery-history')?.addEventListener('click', () => {
        this._renderHistory(container);
      });
    },

    // ── 生成菜单 ──
    async _generateMenu(container) {
      if (this._generating) return;
      this._generating = true;

      const charName = getCurrentCharName() || '???';
      const userName = getUserName() || '用户';

      // 显示加载状态
      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-delivery-back-loading">←</button>
          🍜 ${escapeHtml(charName)}正在看菜单...
        </div>
        <div class="freq-app-body">
          <div class="freq-delivery-loading">
            <div class="freq-delivery-loading-icon">🤔</div>
            <div class="freq-studio-loading">正在研究你想吃什么...</div>
            <div class="freq-delivery-loading-sub">（${escapeHtml(charName)}正在翻菜单）</div>
          </div></div>`;

      container.querySelector('#freq-delivery-back-loading')?.addEventListener('click', () => {
        this._generating = false;
        this._renderHome(container);
      });

      // 收集上下文
      const msgs = getChatMessages();
      const latestPlot = getLatestPlot(msgs) || '暂无剧情';
      const latestScene = getLatestScene(msgs) || '未知场景';
      const radioShow = extractRadioShow(msgs);
      const bgm = radioShow?.bgm || '未知';
      const now = new Date();
      const realTime = now.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', weekday: 'long'
      });

      // 天气提示
      let weatherHint = '未知天气';
      try {
        const s = getSettings();
        if (s.weatherKey) {
          weatherHint = '（天气数据需通过气象站获取）';
        }
      } catch (e) { /* ignore */ }

      const systemPrompt = getPrompt('delivery_menu')
        .replace(/{charName}/g, charName)
        .replace(/{userName}/g, userName)
        .replace(/{realTime}/g, realTime)
        .replace(/{weatherHint}/g, weatherHint)
        .replace(/{bgm}/g, bgm)
        .replace(/{latestPlot}/g, latestPlot)
        .replace(/{latestScene}/g, latestScene);

      try {
        const raw = await SubAPI.call(systemPrompt, '替我点外卖吧。', {
          maxTokens: 600,
          temperature: 0.9,
        });

        // 解析JSON
        let menuData;
try {
  menuData = safeParseAIJson(raw, 'object');
  if (!menuData) throw new Error('返回内容为空');
} catch (parseErr) {
  throw new Error('菜单解析失败：' + parseErr.message);
}

        if (!menuData.restaurant || !Array.isArray(menuData.items) || menuData.items.length === 0) {
          throw new Error('菜单数据不完整');
        }

        // 计算总价
        let totalPrice = 0;
        menuData.items.forEach(item => {
          item.price = Number(item.price) || 18;
          totalPrice += item.price;
        });

        // 构建订单对象
        this._currentOrder = {
          id: 'del-' + Date.now(),
          charName: charName,
          restaurant: menuData.restaurant,
          items: menuData.items,
          totalPrice: totalPrice,
          status: 'preparing',
          orderTime: dateNow() + ' ' + timeNow(),
          deliveryTime: '',
          deliveryComment: '',
          deliveryPerson: charName,
        };

        this._renderMenu(container);
      } catch (e) {
        container.innerHTML = `
          <div class="freq-app-header">
            <button class="freq-checkin-back-btn" id="freq-delivery-back-err">←</button>
            🍜 跨次元配送
          </div>
          <div class="freq-app-body">
            <div class="freq-studio-error">
              ❌ 点单失败：${escapeHtml(String(e.message || e))}
            </div>
            <button class="freq-studio-action-btn" id="freq-delivery-retry" style="width:100%;margin-top:12px;">
              🔄 重新点单
            </button>
          </div>`;

        container.querySelector('#freq-delivery-back-err')?.addEventListener('click', () => {
          this._renderHome(container);
        });container.querySelector('#freq-delivery-retry')?.addEventListener('click', () => {
          this._generateMenu(container);
        });Notify.error('跨次元配送', e);
      } finally {
        this._generating = false;
      }
    },

    // ── 菜单展示页──
    _renderMenu(container) {
      this._currentView = 'menu';
      const order = this._currentOrder;
      if (!order) { this._renderHome(container); return; }

      const itemsHTML = order.items.map((item, i) => `
        <div class="freq-delivery-menu-item">
          <div class="freq-delivery-menu-item-header">
            <span class="freq-delivery-menu-item-name">${escapeHtml(item.name)}</span>
            <span class="freq-delivery-menu-item-price">¤${item.price}</span>
          </div>
          <div class="freq-delivery-menu-item-desc">"${escapeHtml(item.desc)}"</div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-delivery-back-menu">←</button>
          🍜 ${escapeHtml(order.restaurant)}
        </div>
        <div class="freq-app-body">
          <div class="freq-delivery-restaurant-tag">
            <span class="freq-delivery-chef-icon">👨‍🍳</span>
            <span>${escapeHtml(order.charName)} 为你推荐</span>
          </div>

          <div class="freq-delivery-menu-list">
            ${itemsHTML}
          </div>

          <div class="freq-delivery-total-row">
            <span>合计</span>
            <span class="freq-delivery-total-price">¤${order.totalPrice}</span>
          </div>

          <button class="freq-studio-action-btn freq-delivery-confirm-btn" id="freq-delivery-confirm">
            🛒 下单！让${escapeHtml(order.charName)}去买
          </button>

          <button class="freq-checkin-delete-btn" id="freq-delivery-reroll" style="width:100%;margin-top:6px;">
            🔄 换一家店
          </button>
        </div>`;

      container.querySelector('#freq-delivery-back-menu')?.addEventListener('click', () => {
        this._currentOrder = null;
        this._renderHome(container);
      });

      container.querySelector('#freq-delivery-confirm')?.addEventListener('click', () => {
        this._startDelivery(container);
      });

      container.querySelector('#freq-delivery-reroll')?.addEventListener('click', () => {
        this._currentOrder = null;
        this._generateMenu(container);
      });
    },

    // ── 开始配送 ──
    _startDelivery(container) {
      if (!this._currentOrder) return;
      this._currentOrder.status = 'delivering';
      this._deliveryProgress = 0;
      this._renderDelivering(container);

      // 配送进度模拟（总共约25秒）
      const stages = [
        { pct: 15, time: 2000 },
        { pct: 30, time: 3000 },
        { pct: 45, time: 3500 },
        { pct: 60, time: 3000 },
        { pct: 75, time: 3500 },
        { pct: 88, time: 3000 },
        { pct: 95, time: 2500 },
        { pct: 99, time: 3000 },
        { pct: 100, time: 1500 },
      ];

      let stageIdx = 0;
      const advance = () => {
        if (stageIdx >= stages.length) {
          this._deliveryTimer = null;
          this._onDeliveryComplete(container);
          return;
        }
        const stage = stages[stageIdx];
        this._deliveryProgress = stage.pct;
        this._updateDeliveryUI();
        stageIdx++;
        this._deliveryTimer = setTimeout(advance, stage.time);
      };

      this._deliveryTimer = setTimeout(advance, 1000);
    },

    _getDeliveryStageText(pct) {
      const charName = this._currentOrder?.charName || '???';
      if (pct <= 15) return '🔥 后厨正在备餐...';
      if (pct <= 30) return '👨‍🍳 ' + charName + '正在偷吃你的菜...';
      if (pct <= 45) return '🌀 正在穿越次元壁...';
      if (pct <= 60) return '📡 信号不稳定，骑手迷路了...';
      if (pct <= 75) return '🏃 正在全力奔跑中...';
      if (pct <= 88) return '🌌穿越异次元隧道...';
      if (pct <= 95) return '📦 马上就到了！';
      if (pct <= 99) return '⏳ 就差一点点...真的吗？';
      return '✅ 送达！';
    },

    _updateDeliveryUI() {
      if (!this._container) return;
      const bar = this._container.querySelector('#freq-delivery-progress-fill');
      const pctEl = this._container.querySelector('#freq-delivery-progress-pct');
      const stageEl = this._container.querySelector('#freq-delivery-stage-text');
      if (bar) bar.style.width = this._deliveryProgress + '%';
      if (pctEl) pctEl.textContent = this._deliveryProgress + '%';
      if (stageEl) stageEl.textContent = this._getDeliveryStageText(this._deliveryProgress);
    },

    // ── 配送中页面 ──
    _renderDelivering(container) {
      this._currentView = 'delivering';
      const order = this._currentOrder;
      if (!order) { this._renderHome(container); return; }

      container.innerHTML = `
        <div class="freq-app-header">🍜 配送中...</div>
        <div class="freq-app-body">
          <div class="freq-delivery-delivering-box">
            <div class="freq-delivery-delivering-icon">🛵</div>
            <div class="freq-delivery-delivering-restaurant">${escapeHtml(order.restaurant)}</div>

            <div class="freq-delivery-progress-wrap">
              <div class="freq-delivery-progress-bar">
                <div class="freq-delivery-progress-fill" id="freq-delivery-progress-fill"
                     style="width:${this._deliveryProgress}%"></div>
              </div>
              <div class="freq-delivery-progress-pct" id="freq-delivery-progress-pct">${this._deliveryProgress}%</div>
            </div>

            <div class="freq-delivery-stage-text" id="freq-delivery-stage-text">
              ${this._getDeliveryStageText(this._deliveryProgress)}
            </div>

            <div class="freq-delivery-items-summary">
              ${order.items.map(item => `<span class="freq-delivery-item-tag">${escapeHtml(item.name)}</span>`).join('')}
            </div>

            <div class="freq-delivery-footer-note" style="margin-top:16px;">
              ⏱ 预计送达：永远不会送到。这是异次元外卖。
            </div>
          </div>
        </div>`;
    },

    // ── 配送完成 ──
    async _onDeliveryComplete(container) {
      if (!this._currentOrder) return;
      this._currentOrder.status = 'delivered';
      this._currentOrder.deliveryTime = dateNow() + ' ' + timeNow();

      // 尝试生成送餐台词
      const charName = this._currentOrder.charName;
      const userName = getUserName() || '用户';
      const itemNames = this._currentOrder.items.map(i => i.name).join('、');

      try {
        const systemPrompt = getPrompt('delivery_comment')
          .replace(/{charName}/g, charName)
          .replace(/{userName}/g, userName)
          .replace(/{restaurant}/g, this._currentOrder.restaurant)
          .replace(/{itemNames}/g, itemNames)
          .replace(/{realTime}/g, timeNow());

        const raw = await SubAPI.call(systemPrompt, '外卖送到了。', {
          maxTokens: 150,
          temperature: 0.88,
        });
        this._currentOrder.deliveryComment = raw.trim().slice(0, 200);
      } catch (e) {
        this._currentOrder.deliveryComment = '……给你，趁热吃。';
        WARN('delivery_comment generation failed:', e);
      }

      // 保存订单
      const orders = this._getOrders();
      orders.unshift(this._currentOrder);
      if (orders.length > 30) orders.pop();
      this._saveOrders(orders);Notify.add('跨次元配送', `${charName} 的外卖送到了！`, '🍜');

      //渲染送达页
      if (this._container) {
        this._renderDelivered(this._container);
      }
    },

    // ── 送达页 ──
    _renderDelivered(container) {
      this._currentView = 'delivered';
      const order = this._currentOrder;
      if (!order) { this._renderHome(container); return; }

      container.innerHTML = `
        <div class="freq-app-header">🍜 外卖送达！</div>
        <div class="freq-app-body">
          <div class="freq-delivery-delivered-box">
            <div class="freq-delivery-delivered-icon">🎉</div>
            <div class="freq-delivery-delivered-restaurant">${escapeHtml(order.restaurant)}</div>

            <div class="freq-delivery-delivered-items">
              ${order.items.map(item => `
                <div class="freq-delivery-delivered-item">
                  <span class="freq-delivery-delivered-item-name">${escapeHtml(item.name)}</span>
                  <span class="freq-delivery-delivered-item-price">¤${item.price}</span>
                </div>
              `).join('')}<div class="freq-delivery-delivered-total">
                合计 <span>¤${order.totalPrice}</span>
              </div>
            </div>

            <div class="freq-delivery-comment-box">
              <div class="freq-delivery-comment-char">${escapeHtml(order.charName)} 说：</div>
              <div class="freq-delivery-comment-text">"${escapeHtml(order.deliveryComment)}"</div>
            </div>

            <div class="freq-delivery-footer-note">
              ⏱ 实际送达时间：${escapeHtml(order.deliveryTime)}<br>
              （当然，这一切都是假的。但好吃是真的。）
            </div>

            <button class="freq-studio-action-btn" id="freq-delivery-done" style="width:100%;margin-top:12px;">
              🏠 返回首页
            </button><button class="freq-checkin-delete-btn" id="freq-delivery-reorder" style="width:100%;margin-top:6px;">
              🍜 再点一单
            </button>
          </div>
        </div>`;

      container.querySelector('#freq-delivery-done')?.addEventListener('click', () => {
        this._currentOrder = null;
        this._renderHome(container);
      });

      container.querySelector('#freq-delivery-reorder')?.addEventListener('click', () => {
        this._currentOrder = null;
        this._generateMenu(container);
      });
    },

    // ── 历史订单列表 ──
    _renderHistory(container) {
      this._currentView = 'history';
      this._detailId = null;

      const orders = this._getOrders().filter(o => o.status === 'delivered');

      const listHTML = orders.length === 0
        ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">📦</span>
            <span>暂无历史订单</span>
          </div>`
        : orders.map(o => `
          <div class="freq-delivery-history-card" data-order-id="${o.id}">
            <div class="freq-delivery-history-card-header">
              <span class="freq-delivery-history-card-restaurant">${escapeHtml(o.restaurant)}</span>
              <span class="freq-delivery-history-card-price">¤${o.totalPrice}</span>
            </div>
            <div class="freq-delivery-history-card-meta">
              <span>${escapeHtml(o.charName)} 点单</span>
              <span>${o.orderTime || ''}</span>
            </div>
            <div class="freq-delivery-history-card-items">
              ${o.items.map(item => escapeHtml(item.name)).join(' · ')}
            </div>
          </div>
        `).join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-delivery-back-history">←</button>
          📦 历史订单
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            ${orders.length} 单
          </span>
        </div>
        <div class="freq-app-body">
          ${listHTML}
          ${orders.length > 0 ? `<button class="freq-checkin-delete-btn" id="freq-delivery-clear" style="width:100%;margin-top:12px;">
            🗑️ 清空所有订单
          </button>` : ''}
        </div>`;

      container.querySelector('#freq-delivery-back-history')?.addEventListener('click', () => {
        this._renderHome(container);
      });

      container.querySelectorAll('.freq-delivery-history-card').forEach(card => {
        card.addEventListener('click', () => {
          this._detailId = card.dataset.orderId;
          this._renderDetail(container, card.dataset.orderId);
        });
      });

      container.querySelector('#freq-delivery-clear')?.addEventListener('click', () => {
        this._showClearConfirm(container);
      });
    },

    // ── 清空确认 ──
    _showClearConfirm(container) {
      const clearBtn = container.querySelector('#freq-delivery-clear');
      if (!clearBtn) return;

      if (clearBtn.dataset.confirming === '1') {
        this._saveOrders([]);
        this._renderHistory(container);
        Notify.add('跨次元配送', '所有订单已清空', '🗑️');
        return;
      }

      clearBtn.dataset.confirming = '1';
      clearBtn.textContent = '⚠️ 确认清空？再次点击执行';
      clearBtn.style.borderColor = '#A32D2D';
      clearBtn.style.color = '#e88';

      setTimeout(() => {
        if (clearBtn.dataset.confirming === '1') {
          clearBtn.dataset.confirming = '';
          clearBtn.textContent = '🗑️ 清空所有订单';
          clearBtn.style.borderColor = '';
          clearBtn.style.color = '';
        }
      }, 3000);
    },

    // ── 订单详情 ──
    _renderDetail(container, orderId) {
      this._currentView = 'detail';

      const order = this._getOrders().find(o => o.id === orderId);
      if (!order) { this._renderHistory(container); return; }

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-delivery-back-detail">←</button>
          🍜 ${escapeHtml(order.restaurant)}
        </div>
        <div class="freq-app-body freq-delivery-detail-body">
          <div class="freq-delivery-detail-meta">
            <span class="freq-delivery-detail-status">✅ 已送达</span>
            <span>${order.orderTime || ''}</span>
          </div>

          <div class="freq-delivery-detail-char">
            ${escapeHtml(order.charName)} 的点单
          </div>

          <div class="freq-delivery-detail-section">
            <div class="freq-delivery-detail-label">📋 菜品清单</div>
            ${order.items.map(item => `
              <div class="freq-delivery-detail-item">
                <div class="freq-delivery-detail-item-header">
                  <span class="freq-delivery-detail-item-name">${escapeHtml(item.name)}</span>
                  <span class="freq-delivery-detail-item-price">¤${item.price}</span>
                </div>
                <div class="freq-delivery-detail-item-desc">"${escapeHtml(item.desc)}"</div>
              </div>
            `).join('')}
            <div class="freq-delivery-detail-total">
              合计 <span>¤${order.totalPrice}</span>
            </div>
          </div>

          ${order.deliveryComment ? `
          <div class="freq-delivery-detail-section">
            <div class="freq-delivery-detail-label">💬 送餐台词</div>
            <div class="freq-delivery-comment-box">
              <div class="freq-delivery-comment-char">${escapeHtml(order.charName)} 说：</div>
              <div class="freq-delivery-comment-text">"${escapeHtml(order.deliveryComment)}"</div>
            </div>
          </div>` : ''}

          <div class="freq-delivery-detail-section">
            <div class="freq-delivery-detail-label">📦 配送信息</div>
            <div class="freq-delivery-detail-info">
              <div>下单时间：${order.orderTime || '未知'}</div>
              <div>送达时间：${order.deliveryTime || '未知'}</div>
              <div>配送员：${escapeHtml(order.deliveryPerson || order.charName)}</div>
            </div>
          </div>

          <div style="margin-top:16px;text-align:center;">
            <button class="freq-checkin-delete-btn" id="freq-delivery-delete">🗑️ 删除此订单</button>
          </div>
        </div>`;

      container.querySelector('#freq-delivery-back-detail')?.addEventListener('click', () => {
        this._renderHistory(container);
      });

      container.querySelector('#freq-delivery-delete')?.addEventListener('click', () => {
        this._showDeleteConfirm(container, orderId);
      });
    },

    // ── 删除确认 ──
    _showDeleteConfirm(container, orderId) {
      const delBtn = container.querySelector('#freq-delivery-delete');
      if (!delBtn) return;

      if (delBtn.dataset.confirming === '1') {
        const orders = this._getOrders().filter(o => o.id !== orderId);
        this._saveOrders(orders);
        this._renderHistory(container);
        Notify.add('跨次元配送', '订单已删除', '🗑️');
        return;
      }

      delBtn.dataset.confirming = '1';
      delBtn.textContent = '⚠️ 确认删除？再次点击执行';
      delBtn.style.borderColor = '#A32D2D';
      delBtn.style.color = '#e88';

      setTimeout(() => {
        if (delBtn.dataset.confirming === '1') {
          delBtn.dataset.confirming = '';
          delBtn.textContent = '🗑️ 删除此订单';
          delBtn.style.borderColor = '';
          delBtn.style.color = '';
        }
      }, 3000);
    },
  };
  //┌─ BLOCK_23 ─┐
//═══════════════════════════════════════════
//🗓️ calendarApp — 双线轨道
// ═══════════════════════════════════════════

const calendarApp = {
  id: 'calendar', name: '双线轨道', icon: '🗓️',
  _badge: 0,
  _container: null,

  // ── 内部状态 ──
  _currentView: 'month',        // 'month' | 'day' | 'create' | 'ai'
  _viewYear: new Date().getFullYear(),
  _viewMonth: new Date().getMonth(),
  _selectedDate: null,          // 'YYYY/MM/DD'
  _filter: 'all',               // 'all' | 'user' | 'char'
  _syncedSerials: new Set(),    // 已同步的 meow_FM serial
  _resonanceCache: {},          // {'YYYY/MM/DD': { comment, generating } }
  _macroUnregister: null,       // 宏取消注册函数

  // ── 数据访问 ──
  _getCalendar() {
    const s = getSettings();
    if (!s.calendar) s.calendar = { events: [] };
    if (!Array.isArray(s.calendar.events)) s.calendar.events = [];
    return s.calendar;
  },

  _getEvents() {
    return this._getCalendar().events;
  },

  _saveEvents() {
    saveSettings({ calendar: this._getCalendar() });
  },

  _getEventsForDate(dateStr) {
    return this._getEvents().filter(e => e.date === dateStr);
  },

  _getUserEventsForDate(dateStr) {
    return this._getEvents().filter(e => e.date === dateStr && e.owner === 'user');
  },

  _getCharEventsForDate(dateStr) {
    return this._getEvents().filter(e => e.date === dateStr && e.owner === 'char');
  },

  // ── 日期工具 ──
  _todayStr() {
    const d = new Date();
    return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
  },

  _formatDateStr(y, m, d) {
    return y + '/' + String(m + 1).padStart(2, '0') + '/' + String(d).padStart(2, '0');
  },

  _parseDateStr(str) {
    if (!str) return null;
    const p = str.split('/');
    return { year: parseInt(p[0]), month: parseInt(p[1]) - 1, day: parseInt(p[2]) };
  },

  _weekdayNames: ['日', '一', '二', '三', '四', '五', '六'],

  // ── meow_FM 时间解析 ──
  _parseMeowTime(timeStr) {
    // 格式: "2026.04.28.星期二☆23:00-23:30"
    if (!timeStr) return null;
    try {
      const datePart = timeStr.split('☆')[0].split('.');
      if (datePart.length < 3) return null;
      const y = parseInt(datePart[0]);
      const m = String(parseInt(datePart[1])).padStart(2, '0');
      const d = String(parseInt(datePart[2])).padStart(2, '0');
      const timePart = timeStr.split('☆')[1];
      let time = '';
      if (timePart) {
        const t = timePart.split('-')[0];
        if (t && t.includes(':')) time = t.trim();
      }
      return { date: y + '/' + m + '/' + d, time: time };
    } catch (e) {
      return null;
    }
  },

  // ── 宏注册：{{calendar_today}} ──
  _registerMacro() {
    if (this._macroUnregister) return;
    try {
      const self = this;
      const result = window.registerMacroLike(
        /\{\{calendar_today\}\}/gi,
        function(_context) {
          return self._buildMacroContent();
        }
      );
      if (result && result.unregister) {
        self._macroUnregister = result.unregister;
      }
    } catch (e) {
      console.warn('[Freq Calendar] registerMacroLike not available:', e);
    }
  },

  _unregisterMacro() {
    if (this._macroUnregister) {
      try { this._macroUnregister(); } catch (e) { /* ignore */ }
      this._macroUnregister = null;
    }
  },

  _buildMacroContent() {
    const today = this._todayStr();
    const userEvents = this._getUserEventsForDate(today).filter(e => e.tellChar);
    if (userEvents.length === 0) return '';

    const userName = getUserName() || 'User';
    const lines = userEvents.map(e => {
      let line = '- ' + e.title;
      if (e.time) line += '（' + e.time + '）';
      if (e.content) line += '：' + e.content;
      return line;
    });

    return '\n[' + userName + '今天的日程]\n' + lines.join('\n') + '\n';
  },

  // ── meow_FM 自动同步 ──
  _syncFromMeowFM(allFM) {
    if (!Array.isArray(allFM)) return;
    const charName = getCurrentCharName() || 'Char';
    let added = false;

    allFM.forEach(fm => {
      if (!fm.event || !fm.event.trim() || fm.event.trim() === '无' || fm.event.trim() === '空') return;
      if (!fm.serial) return;
      if (this._syncedSerials.has(fm.serial)) return;

      // 检查是否已存在
      const exists = this._getEvents().some(e => e.serial === fm.serial);
      if (exists) {
        this._syncedSerials.add(fm.serial);
        return;
      }

      // 解析时间
      const parsed = this._parseMeowTime(fm.time);
      const date = parsed ? parsed.date : this._todayStr();
      const time = parsed ? parsed.time : '';

      const evt = {
        id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        owner: 'char',
        ownerName: charName,
        title: fm.event.length > 15 ? fm.event.substring(0, 15) + '…' : fm.event,
        content: fm.event,
        date: date,
        time: time,
        type: 'event',
        serial: fm.serial,
        tellChar: false,
        told: false,
        source: 'auto',
        createdAt: new Date().toISOString()
      };

      this._getEvents().push(evt);
      this._syncedSerials.add(fm.serial);
      added = true;
    });

    if (added) {
      this._saveEvents();
      this._badge++;
      renderAppGrid();
      if (this._container && this._currentView === 'month') {
        this._renderMonth();
      }
    }
  },

  // ── 初始化 ──
  init() {
    const self = this;

    // 注册宏
    this._registerMacro();

    // 监听 meow_FM 更新
    EventBus.on('meow_fm:updated', function(allFM) {
      self._syncFromMeowFM(allFM);
    });

    // 初始化已同步的 serial集合
    this._getEvents().forEach(e => {
      if (e.serial) self._syncedSerials.add(e.serial);
    });
  },

  // ── 挂载 ──
  mount(container) {
    this._container = container;
    this._badge = 0;
    renderAppGrid();
    this._currentView = 'month';
    this._viewYear = new Date().getFullYear();
    this._viewMonth = new Date().getMonth();
    this._selectedDate = null;
    this._filter = 'all';
    this._renderMonth();
  },

  // ── 卸载 ──
  unmount() {
    this._container = null;
  },

  // ═══════════════════════════════════════
  //  月历主视图
  // ═══════════════════════════════════════
  _renderMonth() {
    if (!this._container) return;
    const self = this;
    const y = this._viewYear;
    const m = this._viewMonth;
    const today = this._todayStr();

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月','7月', '8月', '9月', '10月', '11月', '12月'];

    // 计算日历网格
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    // 统计本月事件
    const eventMap = {}; // { 'YYYY/MM/DD': { user: count, char: count } }
    this._getEvents().forEach(e => {
      const p = this._parseDateStr(e.date);
      if (!p || p.year !== y || p.month !== m) return;
      if (!eventMap[e.date]) eventMap[e.date] = { user: 0, char: 0 };
      if (e.owner === 'user') eventMap[e.date].user++;
      else eventMap[e.date].char++;
    });

    // 筛选按钮状态
    const filterBtns = [
      { key: 'all',  label: '全部',  cls: '' },
      { key: 'user', label: '🔵 我的', cls: 'freq-cal23-filter-user' },
      { key: 'char', label: '🔴 角色', cls: 'freq-cal23-filter-char' }
    ];

    let html = '';
    html += '<div class="freq-app-header">';
    html += '  <div class="freq-cal23-nav">';
    html += '    <button class="freq-cal23-nav-btn" data-dir="prev">◀</button>';
    html += '    <span class="freq-cal23-nav-title">' + y + '年 ' + monthNames[m] + '</span>';
    html += '    <button class="freq-cal23-nav-btn" data-dir="next">▶</button>';
    html += '  </div>';
    html += '  <div class="freq-cal23-filters">';
    filterBtns.forEach(f => {
      const active = self._filter === f.key ? ' freq-cal23-filter-active' : '';
      html += '<button class="freq-cal23-filter-btn' + active + ' ' + f.cls + '" data-filter="' + f.key + '">' + f.label + '</button>';
    });
    html += '  </div>';
    html += '</div>';

    html += '<div class="freq-app-body">';

    // 星期头
    html += '<div class="freq-cal23-weekrow">';
    this._weekdayNames.forEach(w => {
      html += '<div class="freq-cal23-weekcell">' + w + '</div>';
    });
    html += '</div>';

    // 日期网格
    html += '<div class="freq-cal23-grid">';
    // 空白填充
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="freq-cal23-cell freq-cal23-cell-empty"></div>';
    }
    // 日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this._formatDateStr(y, m, d);
      const info = eventMap[dateStr] || { user: 0, char: 0 };
      const isToday = dateStr === today;
      const hasUser = info.user > 0;
      const hasChar = info.char > 0;
      const isResonance = hasUser && hasChar;

      let cellCls = 'freq-cal23-cell';
      if (isToday) cellCls += ' freq-cal23-today';
      if (isResonance) cellCls += ' freq-cal23-resonance';
      if (this._selectedDate === dateStr) cellCls += ' freq-cal23-selected';

      // 根据筛选决定是否显示色点
      const showUser = (this._filter === 'all' || this._filter === 'user') && hasUser;
      const showChar = (this._filter === 'all' || this._filter === 'char') && hasChar;

      html += '<div class="' + cellCls + '" data-date="' + dateStr + '">';
      html += '  <span class="freq-cal23-day">' + d + '</span>';
      html += '  <div class="freq-cal23-dots">';
      if (showUser) html += '<span class="freq-cal23-dot freq-cal23-dot-user"></span>';
      if (showChar) html += '<span class="freq-cal23-dot freq-cal23-dot-char"></span>';
      if (isResonance && this._filter === 'all') html += '<span class="freq-cal23-dot freq-cal23-dot-resonance">✦</span>';
      html += '  </div>';
      html += '</div>';
    }
    html += '</div>';

    // 底部操作栏
    html += '<div class="freq-cal23-actions">';
    html += '  <button class="freq-studio-action-btn freq-cal23-add-btn" data-action="add">＋ 添加日程</button>';
    html += '  <button class="freq-cal23-ai-btn" data-action="ai">🤖 AI提取</button>';
    html += '</div>';

    // 今日预览
    const todayEvents = this._getEventsForDate(today);
    if (todayEvents.length > 0) {
      html += '<div class="freq-cal23-preview">';
      html += '  <div class="freq-cal23-preview-title">📌 今日日程</div>';
      todayEvents.forEach(e => {
        const ownerIcon = e.owner === 'user' ? '🔵' : '🔴';
        const typeIcon = e.type === 'milestone' ? '⭐' : (e.type === 'plan' ? '📋' : '📝');
        html += '<div class="freq-cal23-preview-item" data-id="' + e.id + '">';
        html += '  <span class="freq-cal23-preview-owner">' + ownerIcon + '</span>';
        html += '  <span class="freq-cal23-preview-type">' + typeIcon + '</span>';
        html += '  <span class="freq-cal23-preview-text">' + self._escHtml(e.title) + '</span>';
        if (e.time) html += '<span class="freq-cal23-preview-time">' + e.time + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>'; // freq-app-body

    this._container.innerHTML = html;
    this._bindMonthEvents();
  },

  _bindMonthEvents() {
    if (!this._container) return;
    const self = this;

    // 导航按钮 — cloneNode 防重复
    this._container.querySelectorAll('.freq-cal23-nav-btn').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', function() {
        const dir = this.dataset.dir;
        if (dir === 'prev') {
          self._viewMonth--;
          if (self._viewMonth < 0) { self._viewMonth = 11; self._viewYear--; }
        } else {
          self._viewMonth++;
          if (self._viewMonth > 11) { self._viewMonth = 0; self._viewYear++; }
        }
        self._renderMonth();
      });
    });

    // 筛选按钮
    this._container.querySelectorAll('.freq-cal23-filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        self._filter = this.dataset.filter;
        self._renderMonth();
      });
    });

    // 日期格子点击
    this._container.querySelectorAll('.freq-cal23-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', function() {
        self._selectedDate = this.dataset.date;
        self._currentView = 'day';
        self._renderDay();
      });
    });

    // 添加按钮
    const addBtn = this._container.querySelector('[data-action="add"]');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        self._currentView = 'create';
        self._renderCreate();
      });
    }

    // AI提取按钮
    const aiBtn = this._container.querySelector('[data-action="ai"]');
    if (aiBtn) {
      aiBtn.addEventListener('click', function() {
        self._currentView = 'ai';
        self._renderAI();
      });
    }

    // 今日预览项点击
    this._container.querySelectorAll('.freq-cal23-preview-item').forEach(item => {
      item.addEventListener('click', function() {
        const id = this.dataset.id;
        const evt = self._getEvents().find(e => e.id === id);
        if (evt) {
          self._selectedDate = evt.date;
          self._currentView = 'day';
          self._renderDay();
        }
      });
    });
  },

  // ═══════════════════════════════════════
  //  日期详情视图
  // ═══════════════════════════════════════
  _renderDay() {
    if (!this._container || !this._selectedDate) return;
    const self = this;
    const dateStr = this._selectedDate;
    const parsed = this._parseDateStr(dateStr);
    const dayLabel = parsed ? (parsed.month + 1) + '月' + parsed.day + '日' : dateStr;

    const userEvents = this._getUserEventsForDate(dateStr);
    const charEvents = this._getCharEventsForDate(dateStr);
    const isResonance = userEvents.length > 0 && charEvents.length > 0;

    let html = '';
    html += '<div class="freq-app-header">';
    html += '  <button class="freq-checkin-back-btn" data-action="back">← 返回</button>';
    html += '  <span class="freq-cal23-day-title">' + dayLabel + '</span>';
    html += '  <button class="freq-cal23-day-add" data-action="add-day">＋</button>';
    html += '</div>';

    html += '<div class="freq-app-body">';

    // 双轨道并排
    html += '<div class="freq-cal23-dual">';

    // 🔵 User轨道
    html += '<div class="freq-cal23-track freq-cal23-track-user">';
    html += '  <div class="freq-cal23-track-label">🔵 ' + self._escHtml(getUserName() || 'User') + '</div>';
    if (userEvents.length === 0) {
      html += '<div class="freq-cal23-track-empty">暂无日程</div>';
    } else {
      userEvents.forEach(e => {
        html += self._renderEventCard(e);
      });
    }
    html += '</div>';

    // 🔴 Char 轨道
    html += '<div class="freq-cal23-track freq-cal23-track-char">';
    html += '  <div class="freq-cal23-track-label">🔴 ' + self._escHtml(getCurrentCharName() || 'Char') + '</div>';
    if (charEvents.length === 0) {
      html += '<div class="freq-cal23-track-empty">暂无日程</div>';
    } else {
      charEvents.forEach(e => {
        html += self._renderEventCard(e);
      });
    }
    html += '</div>';

    html += '</div>'; // dual

    // 🟡 共鸣时刻
    if (isResonance) {
      const cached = this._resonanceCache[dateStr];
      html += '<div class="freq-cal23-resonance-box">';
      html += '  <div class="freq-cal23-resonance-title">✦ 共鸣时刻</div>';
      if (cached && cached.comment) {
        html += '<div class="freq-cal23-resonance-comment">"' + self._escHtml(cached.comment) + '"</div>';
      } else {
        html += '<button class="freq-cal23-resonance-gen" data-action="gen-resonance" data-date="' + dateStr + '">';
        html += cached && cached.generating ? '<span class="freq-studio-loading">感应中…</span>' : '💫 生成角色感想';
        html += '</button>';
      }
      html += '</div>';
    }

    html += '</div>'; // freq-app-body

    this._container.innerHTML = html;
    this._bindDayEvents();
  },

  _renderEventCard(e) {
    const typeIcon = e.type === 'milestone' ? '⭐' : (e.type === 'plan' ? '📋' : '📝');
    const sourceTag = e.source === 'auto' ? '<span class="freq-cal23-tag-auto">自动</span>' : '';
    const tellTag = (e.owner === 'user' && e.tellChar) ? '<span class="freq-cal23-tag-tell">📢 已告知角色</span>' : '';

    let html = '<div class="freq-cal23-event-card" data-id="' + e.id + '">';
    html += '  <div class="freq-cal23-event-head">';
    html += '    <span class="freq-cal23-event-type">' + typeIcon + '</span>';
    html += '    <span class="freq-cal23-event-title">' + this._escHtml(e.title) + '</span>';
    if (e.time) html += '<span class="freq-cal23-event-time">' + e.time + '</span>';
    html += '  </div>';
    if (e.content && e.content !== e.title) {
      html += '<div class="freq-cal23-event-content">' + this._escHtml(e.content) + '</div>';
    }
    html += '  <div class="freq-cal23-event-foot">';
    html += sourceTag + tellTag;
    html += '  </div>';
    html += '<div class="freq-cal23-event-actions">';
    if (e.owner === 'user') {
      const tellLabel = e.tellChar ? '取消告知' : '告诉角色';
      html += '<button class="freq-cal23-evt-btn" data-action="toggle-tell" data-id="' + e.id + '">' + tellLabel + '</button>';
    }
    html += '  <button class="freq-checkin-delete-btn freq-cal23-evt-btn" data-action="delete" data-id="' + e.id + '">删除</button>';
    html += '  </div>';
    html += '</div>';
    return html;
  },

  _bindDayEvents() {
    if (!this._container) return;
    const self = this;

    // 返回
    const backBtn = this._container.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        self._currentView = 'month';
        self._renderMonth();
      });
    }

    // 添加（带预填日期）
    const addBtn = this._container.querySelector('[data-action="add-day"]');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        self._currentView = 'create';
        self._renderCreate(self._selectedDate);
      });
    }

    // 告诉角色 / 取消告知
    this._container.querySelectorAll('[data-action="toggle-tell"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const evt = self._getEvents().find(e => e.id === id);
        if (evt) {
          evt.tellChar = !evt.tellChar;
          if (!evt.tellChar) evt.told = false;
          self._saveEvents();
          self._renderDay();
        }
      });
    });

    // 删除（二次确认）
    this._container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        if (this.dataset.confirming === '1') {
          // 确认删除
          const events = self._getEvents();
          const idx = events.findIndex(e => e.id === id);
          if (idx !== -1) events.splice(idx, 1);
          self._saveEvents();
          // 如果当天没事件了回月历
          const remaining = self._getEventsForDate(self._selectedDate);
          if (remaining.length === 0) {
            self._currentView = 'month';
            self._renderMonth();
          } else {
            self._renderDay();
          }
        } else {
          this.dataset.confirming = '1';
          this.textContent = '确认删除？';
          const btnRef = this;
          setTimeout(function() {
            if (btnRef.dataset.confirming === '1') {
              btnRef.dataset.confirming = '0';
              btnRef.textContent = '删除';
            }
          }, 3000);
        }
      });
    });

    // 生成共鸣感想
    const resBtn = this._container.querySelector('[data-action="gen-resonance"]');
    if (resBtn) {
      resBtn.addEventListener('click', function() {
        const date = this.dataset.date;
        self._generateResonance(date);
      });
    }
  },

  // ── 共鸣感想生成 ──
  async _generateResonance(dateStr) {
    if (!this._container) return;
    const userEvents = this._getUserEventsForDate(dateStr);
    const charEvents = this._getCharEventsForDate(dateStr);
    if (userEvents.length === 0 || charEvents.length === 0) return;

    this._resonanceCache[dateStr] = { comment: '', generating: true };
    this._renderDay();

    const charName = getCurrentCharName() || 'Char';
    const userName = getUserName() || 'User';
    const userEventText = userEvents.map(e => e.title + (e.content ? '：' + e.content : '')).join('；');
    const charEventText = charEvents.map(e => e.title + (e.content ? '：' + e.content : '')).join('；');

    const promptTemplate = getPrompt('calendar_resonance');
    const systemPrompt = promptTemplate
      .replace(/\{\{charName\}\}/g, charName)
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{userEvent\}\}/g, userEventText)
      .replace(/\{\{charEvent\}\}/g, charEventText);

    try {
      const result = await SubAPI.call(
        systemPrompt,
        '请生成共鸣感想。',
        { maxTokens: 200, temperature: 0.9 }
      );
      this._resonanceCache[dateStr] = { comment: result.trim(), generating: false };
    } catch (e) {
      this._resonanceCache[dateStr] = { comment: '', generating: false };
      console.warn('[Freq Calendar] Resonance generation failed:', e);
      EventBus.emit('error:new', { app: 'calendar', message: '共鸣感想生成失败：' + e.message });
    }

    if (this._container && this._currentView === 'day' && this._selectedDate === dateStr) {
      this._renderDay();
    }
  },

  // ═══════════════════════════════════════
  //  创建事件视图
  // ═══════════════════════════════════════
  _renderCreate(prefillDate) {
    if (!this._container) return;
    const self = this;
    const today = this._todayStr();
    const dateVal = prefillDate || today;

    let html = '';
    html += '<div class="freq-app-header">';
    html += '  <button class="freq-checkin-back-btn" data-action="back">← 返回</button>';
    html += '  <span>添加日程</span>';
    html += '</div>';

    html += '<div class="freq-app-body">';
    html += '<div class="freq-cal23-form">';

    // 轨道选择
    html += '<div class="freq-cal23-form-row">';
    html += '  <label class="freq-cal23-form-label">轨道</label>';
    html += '  <div class="freq-cal23-form-toggle">';
    html += '    <button class="freq-cal23-owner-btn freq-cal23-owner-active" data-owner="user">🔵 我的日程</button>';
    html += '    <button class="freq-cal23-owner-btn" data-owner="char">🔴 角色日程</button>';
    html += '  </div>';
    html += '</div>';

    // 标题
    html += '<div class="freq-cal23-form-row">';
    html += '  <label class="freq-cal23-form-label">标题</label>';
    html += '  <input class="freq-forum-input" id="freq-cal23-title" placeholder="事件标题" maxlength="30" />';
    html += '</div>';

    // 内容
    html += '<div class="freq-cal23-form-row">';
    html += '  <label class="freq-cal23-form-label">详情</label>';
    html += '  <textarea class="freq-forum-textarea" id="freq-cal23-content" placeholder="事件详情（可选）" rows="3" maxlength="200"></textarea>';
    html += '</div>';

    // 日期
    html += '<div class="freq-cal23-form-row">';
    html += '  <label class="freq-cal23-form-label">日期</label>';
    html += '  <input class="freq-forum-input" id="freq-cal23-date" placeholder="YYYY/MM/DD" value="' + dateVal + '" />';
    html += '</div>';

    // 时间
    html += '<div class="freq-cal23-form-row">';
    html += '  <label class="freq-cal23-form-label">时间</label>';
    html += '  <input class="freq-forum-input" id="freq-cal23-time" placeholder="HH:MM（可选）" />';
    html += '</div>';

    // 类型
    html += '<div class="freq-cal23-form-row">';
    html += '  <label class="freq-cal23-form-label">类型</label>';
    html += '  <div class="freq-cal23-type-btns">';
    html += '    <button class="freq-cal23-type-btn freq-cal23-type-active" data-type="event">📝 事件</button>';
    html += '    <button class="freq-cal23-type-btn" data-type="plan">📋 计划</button>';
    html += '    <button class="freq-cal23-type-btn" data-type="milestone">⭐ 里程碑</button>';
    html += '  </div>';
    html += '</div>';

    // 告诉角色（仅User轨道显示）
    html += '<div class="freq-cal23-form-row freq-cal23-tell-row">';
    html += '  <label class="freq-cal23-form-label">告诉角色</label>';
    html += '  <div class="freq-cal23-tell-toggle">';
    html += '    <button class="freq-cal23-tell-btn" data-tell="off">关闭</button>';
    html += '  </div>';
    html += '  <div class="freq-cal23-tell-hint">开启后，角色将在下次对话中知道这个日程</div>';
    html += '</div>';

    // 保存按钮
    html += '<button class="freq-studio-action-btn freq-cal23-save-btn" data-action="save">保存日程</button>';

    html += '</div>'; // form
    html += '</div>'; // body

    this._container.innerHTML = html;
    this._bindCreateEvents();
  },

  _bindCreateEvents() {
    if (!this._container) return;
    const self = this;
    let selectedOwner = 'user';
    let selectedType = 'event';
    let tellChar = false;

    // 返回
    const backBtn = this._container.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        if (self._selectedDate) {
          self._currentView = 'day';
          self._renderDay();
        } else {
          self._currentView = 'month';
          self._renderMonth();
        }
      });
    }

    //轨道切换
    this._container.querySelectorAll('.freq-cal23-owner-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        self._container.querySelectorAll('.freq-cal23-owner-btn').forEach(b => b.classList.remove('freq-cal23-owner-active'));
        this.classList.add('freq-cal23-owner-active');
        selectedOwner = this.dataset.owner;
        // 告诉角色行仅User轨道可见
        const tellRow = self._container.querySelector('.freq-cal23-tell-row');
        if (tellRow) {
          tellRow.style.display = selectedOwner === 'user' ? '' : 'none';
        }
      });
    });

    // 类型切换
    this._container.querySelectorAll('.freq-cal23-type-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        self._container.querySelectorAll('.freq-cal23-type-btn').forEach(b => b.classList.remove('freq-cal23-type-active'));
        this.classList.add('freq-cal23-type-active');
        selectedType = this.dataset.type;
      });
    });

    // 告诉角色切换
    const tellBtn = this._container.querySelector('.freq-cal23-tell-btn');
    if (tellBtn) {
      tellBtn.addEventListener('click', function() {
        tellChar = !tellChar;
        this.textContent = tellChar ? '✅ 已开启' : '关闭';
        this.dataset.tell = tellChar ?'on' : 'off';
        this.classList.toggle('freq-cal23-tell-on', tellChar);
      });
    }

    // 保存
    const saveBtn = this._container.querySelector('[data-action="save"]');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        const title = (self._container.querySelector('#freq-cal23-title') || {}).value || '';
        const content = (self._container.querySelector('#freq-cal23-content') || {}).value || '';
        const date = (self._container.querySelector('#freq-cal23-date') || {}).value || '';
        const time = (self._container.querySelector('#freq-cal23-time') || {}).value || '';

        if (!title.trim()) {
          EventBus.emit('notification:new', { app: 'calendar', message: '请输入事件标题' });
          return;
        }
        if (!date.trim() || !/^\d{4}\/\d{2}\/\d{2}$/.test(date.trim())) {
          EventBus.emit('notification:new', { app: 'calendar', message: '日期格式应为 YYYY/MM/DD' });
          return;
        }

        const ownerName = selectedOwner === 'user'
          ? (getUserName() || 'User')
          : (getCurrentCharName() || 'Char');

        const evt = {
          id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          owner: selectedOwner,
          ownerName: ownerName,
          title: title.trim(),
          content: content.trim(),
          date: date.trim(),
          time: time.trim(),
          type: selectedType,
          serial: '',
          tellChar: selectedOwner === 'user' ? tellChar : false,
          told: false,
          source: 'manual',
          createdAt: new Date().toISOString()
        };

        self._getEvents().push(evt);
        self._saveEvents();

        EventBus.emit('notification:new', { app: 'calendar', message: '日程已添加：' + evt.title });

        //跳转到该日期的详情
        self._selectedDate = evt.date;
        self._currentView = 'day';
        self._renderDay();
      });
    }
  },

  // ═══════════════════════════════════════
  //  AI提取视图
  // ═══════════════════════════════════════
  _renderAI() {
    if (!this._container) return;

    let html = '';
    html += '<div class="freq-app-header">';
    html += '  <button class="freq-checkin-back-btn" data-action="back">← 返回</button>';
    html += '  <span>🤖 AI 事件提取</span>';
    html += '</div>';

    html += '<div class="freq-app-body">';
    html += '<div class="freq-cal23-ai-box">';
    html += '  <div class="freq-cal23-ai-desc">根据当前剧情，让AI分析并提取一个值得记录的事件到角色轨道。</div>';
    html += '  <button class="freq-studio-action-btn" data-action="extract">🔍 开始提取</button>';
    html += '  <div class="freq-cal23-ai-result" id="freq-cal23-ai-result"></div>';
    html += '</div>';
    html += '</div>';

    this._container.innerHTML = html;
    this._bindAIEvents();
  },

  _bindAIEvents() {
    if (!this._container) return;
    const self = this;

    // 返回
    const backBtn = this._container.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        self._currentView = 'month';
        self._renderMonth();
      });
    }

    // 提取
    const extractBtn = this._container.querySelector('[data-action="extract"]');
    if (extractBtn) {
      extractBtn.addEventListener('click', function() {
        self._doAIExtract();
      });
    }
  },

  async _doAIExtract() {
    if (!this._container) return;
    const resultDiv = this._container.querySelector('#freq-cal23-ai-result');
    if (!resultDiv) return;

    resultDiv.innerHTML = '<span class="freq-studio-loading">正在分析剧情…</span>';

    const messages = getChatMessages();
    const plot = getLatestPlot(messages) || '（无剧情信息）';
    const scene = getLatestScene(messages) || '（无场景信息）';
    const meowTime = getLatestMeowTime(messages) || '';
    const charName = getCurrentCharName() || 'Char';

    const promptTemplate = getPrompt('calendar_event');
    const systemPrompt = promptTemplate
      .replace(/\{\{charName\}\}/g, charName)
      .replace(/\{\{plot\}\}/g, plot)
      .replace(/\{\{scene\}\}/g, scene)
      .replace(/\{\{meowTime\}\}/g, meowTime);

    try {
      const raw = await SubAPI.call(
        systemPrompt,
        '请从当前剧情中提取一个值得记录的事件，返回纯JSON。',
        { maxTokens: 400, temperature: 0.7 }
      );

      // 清理可能的 markdown 代码块
      let cleaned = raw.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        resultDiv.innerHTML = '<div class="freq-studio-error">AI返回格式异常，无法解析</div>'
          + '<div class="freq-cal23-ai-raw">' + this._escHtml(raw) + '</div>';
        return;
      }

      if (!parsed.title || !parsed.date) {
        resultDiv.innerHTML = '<div class="freq-studio-error">AI返回数据不完整</div>';
        return;
      }

      // 显示预览
      const typeIcon = parsed.type === 'milestone' ? '⭐' : (parsed.type === 'plan' ? '📋' : '📝');
      let previewHtml = '<div class="freq-cal23-ai-preview">';
      previewHtml += '  <div class="freq-cal23-ai-preview-head">';
      previewHtml += '    <span>' + typeIcon + '</span>';
      previewHtml += '    <strong>' + this._escHtml(parsed.title) + '</strong>';
      previewHtml += '  </div>';
      if (parsed.content) {
        previewHtml += '<div class="freq-cal23-ai-preview-content">' + this._escHtml(parsed.content) + '</div>';
      }
      previewHtml += '  <div class="freq-cal23-ai-preview-meta">';
      previewHtml += '    📅 ' + parsed.date;
      if (parsed.time) previewHtml += ' ⏰ ' + parsed.time;
      previewHtml += '  </div>';
      previewHtml += '<button class="freq-studio-action-btn freq-cal23-ai-confirm" data-action="confirm-ai">✅ 添加到角色轨道</button>';
      previewHtml += '  <button class="freq-checkin-delete-btn freq-cal23-ai-discard" data-action="discard-ai">放弃</button>';
      previewHtml += '</div>';

      resultDiv.innerHTML = previewHtml;

      // 绑定确认/放弃
      const confirmBtn = resultDiv.querySelector('[data-action="confirm-ai"]');
      if (confirmBtn) {
        const self = this;
        confirmBtn.addEventListener('click', function() {
          const evt = {
            id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            owner: 'char',
            ownerName: charName,
            title: parsed.title,
            content: parsed.content || '',
            date: parsed.date,
            time: parsed.time || '',
            type: parsed.type || 'event',
            serial: '',
            tellChar: false,
            told: false,
            source: 'auto',
            createdAt: new Date().toISOString()
          };
          self._getEvents().push(evt);
          self._saveEvents();
          EventBus.emit('notification:new', { app: 'calendar', message: 'AI事件已添加：' + evt.title });

          self._selectedDate = evt.date;
          self._currentView = 'day';
          self._renderDay();
        });
      }

      const discardBtn = resultDiv.querySelector('[data-action="discard-ai"]');
      if (discardBtn) {
        discardBtn.addEventListener('click', function() {
          resultDiv.innerHTML = '<div class="freq-cal23-ai-desc">已放弃。可以重新提取。</div>';
        });
      }} catch (e) {
      resultDiv.innerHTML = '<div class="freq-studio-error">AI提取失败：' + this._escHtml(e.message) + '</div>';
      console.warn('[Freq Calendar] AI extract failed:', e);
    }
  },

  // ── HTML转义 ──
  _escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};
//└─ BLOCK_23─┘
  //┌─ BLOCK_24 ─┐
  //═══════════════════════════════════════════
  //🗺️ mapApp — 异界探索
  //═══════════════════════════════════════════

  const mapApp = {
    id: 'map', name: '异界探索', icon: '🗺️',
    _badge: 0,
    _container: null,

    // ── 内部状态 ──
    _currentView: 'map',          // 'map' | 'detail'
    _selectedLoc: null,           // 当前查看的地点对象
    _mapState: { scale: 1, tx: 0, ty: 0 },
    _isPanning: false,
    _panStart: { x: 0, y: 0, tx: 0, ty: 0 },
    _generating: false,           // 世界生成中
    _exploring: false,            // AI探索中
    _detailCache: {},             // { locationId: string } 地点详情缓存
    _eventCache: {},              // { locationId: string } 探索感想缓存

    // ── 数据访问 ──
    _getMap() {
      const s = getSettings();
      if (!s.map) s.map = { locations: [], explorations: [] };
      if (!Array.isArray(s.map.locations)) s.map.locations = [];
      if (!Array.isArray(s.map.explorations)) s.map.explorations = [];
      return s.map;
    },

    _getLocations() { return this._getMap().locations; },
    _getExplorations() { return this._getMap().explorations; },

    _saveMap() { saveSettings({ map: this._getMap() }); },

    // ── 迷雾解锁：扫描 meow_FM 文本匹配地点名 ──
    _checkUnlock(allFM) {
      if (!Array.isArray(allFM)) return;
      const locs = this._getLocations();
      let unlocked = false;

      locs.forEach(loc => {
        if (loc.discovered) return;
        for (const fm of allFM) {
          const text = (fm.scene || '') + ' ' + (fm.plot || '') + ' ' + (fm.event || '');
          if (text.includes(loc.name)) {
            loc.discovered = true;
            loc.serial = fm.serial || '';
            unlocked = true;
            EventBus.emit('notification:new', {
              app: 'map', icon: '🗺️',
              title: '新地点发现',
              body: '「' + loc.name + '」的迷雾已揭开'
            });
            break;
          }
        }
      });

      if (unlocked) {
        this._saveMap();
        this._badge++;
        renderAppGrid();
        if (this._container && this._currentView === 'map') {
          this._renderMap();
        }
      }
    },

    // ── 初始化 ──
    init() {
      const self = this;
      EventBus.on('meow_fm:updated', function(allFM) {
        self._checkUnlock(allFM);
      });
    },

    // ── 挂载 ──
    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      this._currentView = 'map';
      this._selectedLoc = null;
      this._mapState = { scale: 1, tx: 0, ty: 0 };
      this._renderMap();
    },

    // ── 卸载 ──
    unmount() {
      this._container = null;
    },

    // ═══════════════════════════════════════
    //  主地图视图
    // ═══════════════════════════════════════
    _renderMap() {
      if (!this._container) return;
      const self = this;
      const locs = this._getLocations();
      const hasLocations = locs.length > 0;

      let html = '<div class="freq-app-header">';
      html += '  <span>🗺️ 异界探索</span>';
      html += '  <div class="freq-map-header-btns">';
      html += '    <button class="freq-map-icon-btn" data-action="add" title="手动添加地点">＋</button>';
      html += '    <button class="freq-map-icon-btn" data-action="explore" title="AI探索新地点"' + (this._exploring ? ' disabled' : '') + '>';
      html += this._exploring ? '<span class="freq-studio-loading" style="font-size:10px;padding:0">探索中</span>' : '🔍';
      html += '    </button>';
      html += '    <button class="freq-map-icon-btn" data-action="reset-view" title="重置视角">⊙</button>';
      html += '  </div>';
      html += '</div>';

      html += '<div class="freq-app-body freq-map-body">';

      if (!hasLocations) {
        // 空状态：首次生成
        html += '<div class="freq-map-empty">';
        html += '  <div class="freq-empty-icon">🗺️</div>';
        html += '  <div style="font-size:12px;color:#555;margin-bottom:12px;">世界地图尚未生成</div>';
        if (this._generating) {
          html += '  <div class="freq-studio-loading">正在构建世界…</div>';
        } else {
          html += '  <button class="freq-studio-action-btn freq-map-gen-btn" data-action="generate">✨ 生成世界地图</button>';
          html += '  <div style="font-size:10px;color:#444;margin-top:8px;text-align:center">将根据当前剧情自动生成地点</div>';
        }
        html += '</div>';
      } else {
        // SVG 地图
        html += '<div class="freq-map-viewport" id="freq-map-viewport">';
        html += '<div class="freq-map-canvas" id="freq-map-canvas" style="transform:scale(' + this._mapState.scale + ') translate(' + this._mapState.tx + 'px,' + this._mapState.ty + 'px)">';
        html += this._buildSVG(locs);
        html += '</div>';
        html += '</div>';

        // 图例
        html += '<div class="freq-map-legend">';
        const typeInfo = { city:'🏙️城镇', ruin:'🏚️废墟', wild:'🌲荒野', dungeon:'⚔️秘境', special:'✨特殊' };
        Object.entries(typeInfo).forEach(([t, label]) => {
          html += '<span class="freq-map-legend-item"><span class="freq-map-dot freq-map-dot-' + t + '"></span>' + label + '</span>';
        });
        html += '</div>';

        // 统计
        const discovered = locs.filter(l => l.discovered).length;
        html += '<div class="freq-map-stats">已发现 ' + discovered + ' / ' + locs.length + ' 个地点</div>';
      }

      html += '</div>'; // freq-map-body

      this._container.innerHTML = html;
      this._bindMapEvents();
    },

    // ── 构建 SVG ──
    _buildSVG(locs) {
      let svg = '<svg class="freq-map-svg" viewBox="0 0 300 260" xmlns="http://www.w3.org/2000/svg">';

      // 背景装饰：随机地形线条（固定seed，用地点数量决定）
      svg += '<defs>';
      svg += '  <filter id="freq-map-fog"><feGaussianBlur stdDeviation="3"/></filter>';
      svg += '</defs>';

      // 背景
      svg += '<rect width="300" height="260" fill="#0a0a0a"/>';

      // 装饰性地形线（固定，不随机）
      svg += '<g stroke="#1a2a1a" stroke-width="0.5" fill="none" opacity="0.6">';
      svg += '  <path d="M20,80 Q60,60 100,90 Q140,120 180,85 Q220,50 270,70"/>';
      svg += '  <path d="M10,150 Q50,130 90,160 Q130,190 170,155 Q210,120 260,140"/>';
      svg += '  <path d="M30,200 Q80,185 130,210 Q180,235 240,200 Q270,185 290,195"/>';
      svg += '  <circle cx="150" cy="130" r="60" stroke="#1a2a1a" stroke-width="0.3"/>';
      svg += '  <circle cx="150" cy="130" r="100" stroke="#1a2a1a" stroke-width="0.3"/>';
      svg += '</g>';

      // 地点连线（已发现的地点之间画细线）
      const discovered = locs.filter(l => l.discovered);
      if (discovered.length > 1) {
        svg += '<g stroke="#2a3a2a" stroke-width="0.4" opacity="0.5">';
        for (let i = 0; i < discovered.length - 1; i++) {
          const a = discovered[i];
          const b = discovered[i + 1];
          const ax = a.x * 3, ay = a.y * 2.6;
          const bx = b.x * 3, by = b.y * 2.6;
          svg += '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by + '"/>';
        }
        svg += '</g>';
      }

      // 地点标记
      const typeColors = {
        city:    '#4a7c59',
        ruin:    '#8b6914',
        wild:    '#2d6b3f',
        dungeon: '#7b3b3b',
        special: '#7b5ea7'
      };

      locs.forEach(loc => {
        const cx = loc.x * 3;
        const cy = loc.y * 2.6;
        const color = typeColors[loc.type] || '#4a7c59';

        if (!loc.discovered) {
          // 迷雾状态：模糊灰色圆
          svg += '<g class="freq-map-loc-fog" data-id="' + loc.id + '">';
          svg += '  <circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#1a1a1a" stroke="#2a2a2a" stroke-width="0.5" filter="url(#freq-map-fog)"/>';
          svg += '  <text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="6" fill="#2a2a2a">???</text>';
          svg += '</g>';
        } else {
          // 已发现：彩色标记，可点击
          svg += '<g class="freq-map-loc" data-id="' + loc.id + '" style="cursor:pointer">';
          svg += '  <circle cx="' + cx + '" cy="' + cy + '" r="7" fill="' + color + '" fill-opacity="0.25" stroke="' + color + '" stroke-width="1"/>';
          svg += '  <circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + color + '"/>';
          svg += '  <text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="6.5" fill="' + color + '" class="freq-map-loc-label">' + this._escHtml(loc.name) + '</text>';
          svg += '</g>';
        }
      });

      svg += '</svg>';
      return svg;
    },

    // ── 绑定地图事件 ──
    _bindMapEvents() {
      if (!this._container) return;
      const self = this;

      // 生成世界
      const genBtn = this._container.querySelector('[data-action="generate"]');
      if (genBtn) {
        genBtn.addEventListener('click', function() { self._generateWorld(); });
      }

      // 手动添加
      const addBtn = this._container.querySelector('[data-action="add"]');
      if (addBtn) {
        addBtn.addEventListener('click', function() { self._renderAddForm(); });
      }

      // AI探索
      const exploreBtn = this._container.querySelector('[data-action="explore"]');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', function() { self._aiExplore(); });
      }

      // 重置视角
      const resetBtn = this._container.querySelector('[data-action="reset-view"]');
      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          self._mapState = { scale: 1, tx: 0, ty: 0 };
          const canvas = self._container.querySelector('#freq-map-canvas');
          if (canvas) canvas.style.transform = 'scale(1) translate(0px,0px)';
        });
      }

      // 地点点击
      this._container.querySelectorAll('.freq-map-loc').forEach(el => {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          const id = this.dataset.id;
          const loc = self._getLocations().find(l => l.id === id);
          if (loc) {
            loc.visitCount = (loc.visitCount || 0) + 1;
            self._saveMap();
            self._selectedLoc = loc;
            self._currentView = 'detail';
            self._renderDetail(loc);
          }
        });
      });

      // 地图缩放（滚轮）
      const viewport = this._container.querySelector('#freq-map-viewport');
      if (viewport) {
        viewport.addEventListener('wheel', function(e) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          self._mapState.scale = Math.min(3, Math.max(0.5, self._mapState.scale + delta));
          const canvas = self._container.querySelector('#freq-map-canvas');
          if (canvas) canvas.style.transform = 'scale(' + self._mapState.scale + ') translate(' + self._mapState.tx + 'px,' + self._mapState.ty + 'px)';
        }, { passive: false });

        // 拖拽平移
        viewport.addEventListener('pointerdown', function(e) {
          self._isPanning = true;
          self._panStart = { x: e.clientX, y: e.clientY, tx: self._mapState.tx, ty: self._mapState.ty };
          viewport.setPointerCapture(e.pointerId);
        });

        viewport.addEventListener('pointermove', function(e) {
          if (!self._isPanning) return;
          const dx = (e.clientX - self._panStart.x) / self._mapState.scale;
          const dy = (e.clientY - self._panStart.y) / self._mapState.scale;
          self._mapState.tx = self._panStart.tx + dx;
          self._mapState.ty = self._panStart.ty + dy;
          const canvas = self._container.querySelector('#freq-map-canvas');
          if (canvas) canvas.style.transform = 'scale(' + self._mapState.scale + ') translate(' + self._mapState.tx + 'px,' + self._mapState.ty + 'px)';
        });

        viewport.addEventListener('pointerup', function() { self._isPanning = false; });
        viewport.addEventListener('pointercancel', function() { self._isPanning = false; });
      }
    },

    // ═══════════════════════════════════════
    //  地点详情视图
    // ═══════════════════════════════════════
    _renderDetail(loc) {
      if (!this._container) return;
      const self = this;

      const typeLabels = { city:'城镇', ruin:'废墟', wild:'荒野', dungeon:'秘境', special:'特殊' };
      const typeIcons  = { city:'🏙️', ruin:'🏚️', wild:'🌲', dungeon:'⚔️', special:'✨' };
      const typeColors = { city:'#4a7c59', ruin:'#8b6914', wild:'#2d6b3f', dungeon:'#7b3b3b', special:'#7b5ea7' };
      const color = typeColors[loc.type] || '#4a7c59';
      const icon  = typeIcons[loc.type]  || '📍';
      const label = typeLabels[loc.type] || loc.type;

      // 该地点的探索记录
      const explorations = this._getExplorations().filter(e => e.locationId === loc.id);

      let html = '<div class="freq-app-header">';
      html += '  <button class="freq-checkin-back-btn" data-action="back">← 返回</button>';
      html += '  <span style="color:' + color + '">' + icon + ' ' + this._escHtml(loc.name) + '</span>';
      html += '</div>';

      html += '<div class="freq-app-body">';

      // 地点信息卡
      html += '<div class="freq-map-detail-card" style="border-color:' + color + '33">';
      html += '  <div class="freq-map-detail-type" style="color:' + color + '">' + icon + ' ' + label + '</div>';
      html += '  <div class="freq-map-detail-desc">' + this._escHtml(loc.desc) + '</div>';
      if (loc.visitCount > 0) {
        html += '  <div class="freq-map-detail-meta">访问 ' + loc.visitCount + ' 次</div>';
      }
      html += '</div>';

      // 角色详情（副API生成，缓存）
      const cachedDetail = this._detailCache[loc.id];
      html += '<div class="freq-map-section-title">角色感知</div>';
      html += '<div class="freq-map-detail-comment" id="freq-map-detail-comment">';
      if (cachedDetail) {
        html += '<div class="freq-map-comment-text">' + this._escHtml(cachedDetail) + '</div>';
      } else {
        html += '<button class="freq-map-gen-detail-btn" data-action="gen-detail" data-id="' + loc.id + '">💭 生成角色感知</button>';
      }
      html += '</div>';

      // 探索记录
      html += '<div class="freq-map-section-title">探索记录</div>';
      if (explorations.length === 0) {
        html += '<div class="freq-map-no-record">暂无探索记录</div>';
      } else {
        html += '<div class="freq-map-explorations">';
        explorations.slice().reverse().forEach(exp => {
          html += '<div class="freq-map-exp-item">';
          html += '  <div class="freq-map-exp-header">';
          html += '    <span class="freq-map-exp-date">' + (exp.date || '') + '</span>';
          if (exp.serial) html += '    <span class="freq-map-exp-serial">' + this._escHtml(exp.serial) + '</span>';
          html += '  </div>';
          if (exp.content) html += '  <div class="freq-map-exp-content">' + this._escHtml(exp.content) + '</div>';
          if (exp.charComment) html += '  <div class="freq-map-exp-comment">' + this._escHtml(exp.charComment) + '</div>';
          html += '</div>';
        });
        html += '</div>';
      }

      // 手动添加探索记录
      html += '<button class="freq-map-add-exp-btn" data-action="add-exp" data-id="' + loc.id + '">＋ 添加探索记录</button>';

      // 危险操作
      html += '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #1a1a1a">';
      html += '  <button class="freq-checkin-delete-btn freq-map-delete-btn" data-action="delete-loc" data-id="' + loc.id + '">删除地点</button>';
      html += '</div>';

      html += '</div>'; // freq-app-body

      this._container.innerHTML = html;
      this._bindDetailEvents(loc);
    },

    _bindDetailEvents(loc) {
      if (!this._container) return;
      const self = this;

      // 返回
      const backBtn = this._container.querySelector('[data-action="back"]');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          self._currentView = 'map';
          self._renderMap();
        });
      }

      // 生成角色感知
      const genDetailBtn = this._container.querySelector('[data-action="gen-detail"]');
      if (genDetailBtn) {
        genDetailBtn.addEventListener('click', function() {
          self._generateDetail(loc);
        });
      }

      // 添加探索记录
      const addExpBtn = this._container.querySelector('[data-action="add-exp"]');
      if (addExpBtn) {
        addExpBtn.addEventListener('click', function() {
          self._renderAddExp(loc);
        });
      }

      // 删除地点（二次确认）
      const deleteBtn = this._container.querySelector('[data-action="delete-loc"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
          if (this.dataset.confirming === '1') {
            const locs = self._getLocations();
            const idx = locs.findIndex(l => l.id === loc.id);
            if (idx !== -1) locs.splice(idx, 1);
            // 同时删除该地点的探索记录
            const map = self._getMap();
            map.explorations = map.explorations.filter(e => e.locationId !== loc.id);
            self._saveMap();
            delete self._detailCache[loc.id];
            delete self._eventCache[loc.id];
            self._currentView = 'map';
            self._renderMap();
          } else {
            this.dataset.confirming = '1';
            this.textContent = '确认删除？';
            const btnRef = this;
            setTimeout(function() {
              if (btnRef.dataset.confirming === '1') {
                btnRef.dataset.confirming = '0';
                btnRef.textContent = '删除地点';
              }
            }, 3000);
          }
        });
      }
    },

    // ═══════════════════════════════════════
    //  添加探索记录视图
    // ═══════════════════════════════════════
    _renderAddExp(loc) {
      if (!this._container) return;
      const self = this;

      let html = '<div class="freq-app-header">';
      html += '  <button class="freq-checkin-back-btn" data-action="back">← 返回</button>';
      html += '  <span>添加探索记录</span>';
      html += '</div>';

      html += '<div class="freq-app-body">';
      html += '<div class="freq-map-exp-form">';
      html += '  <div class="freq-map-form-label">地点：' + this._escHtml(loc.name) + '</div>';
      html += '  <div class="freq-map-form-label" style="margin-top:10px">探索内容</div>';
      html += '  <textarea class="freq-forum-textarea" id="freq-map-exp-content" rows="4" placeholder="记录在这里发生的事…" maxlength="300"></textarea>';
      html += '  <button class="freq-map-gen-event-btn" data-action="gen-event" style="margin-top:8px">🤖 AI生成角色感想</button>';
      html += '  <div id="freq-map-event-result" style="margin-top:8px"></div>';
      html += '  <button class="freq-studio-action-btn" data-action="save-exp" style="margin-top:12px;width:100%">保存记录</button>';
      html += '</div>';
      html += '</div>';

      this._container.innerHTML = html;

      // 返回
      const backBtn = this._container.querySelector('[data-action="back"]');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          self._renderDetail(loc);
        });
      }

      // AI生成感想
      const genEventBtn = this._container.querySelector('[data-action="gen-event"]');
      if (genEventBtn) {
        genEventBtn.addEventListener('click', function() {
          self._generateEvent(loc);
        });
      }

      // 保存
      const saveBtn = this._container.querySelector('[data-action="save-exp"]');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const content = (self._container.querySelector('#freq-map-exp-content') || {}).value || '';
          const charComment = self._eventCache[loc.id] || '';
          if (!content.trim() && !charComment) {
            return;
          }
            const exp = {
            id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            locationId: loc.id,
            locationName: loc.name,
            content: content.trim(),
            charComment: charComment,
            date: dateNow(),
            time: timeNow(),
            serial: '',
            createdAt: new Date().toISOString()
          };
          self._getExplorations().push(exp);
          self._saveMap();
          self._renderDetail(loc);
        });
      }
    },

    // ═══════════════════════════════════════
    //  手动添加地点表单
    // ═══════════════════════════════════════
    _renderAddForm() {
      if (!this._container) return;
      const self = this;

      const typeOptions = [
        { v: 'city',    label: '🏙️ 城镇' },
        { v: 'ruin',    label: '🏚️ 废墟' },
        { v: 'wild',    label: '🌲 荒野' },
        { v: 'dungeon', label: '⚔️ 秘境' },
        { v: 'special', label: '✨ 特殊' }
      ];

      let html = '<div class="freq-app-header">';
      html += '  <button class="freq-checkin-back-btn" data-action="back">← 返回</button>';
      html += '  <span>手动添加地点</span>';
      html += '</div>';

      html += '<div class="freq-app-body">';
      html += '<div class="freq-map-exp-form">';

      html += '<div class="freq-map-form-label">地点名称</div>';
      html += '<input class="freq-forum-input" id="freq-map-add-name" placeholder="地点名称" maxlength="20" style="margin-bottom:10px"/>';

      html += '<div class="freq-map-form-label">类型</div>';
      html += '<div class="freq-map-type-btns" style="margin-bottom:10px">';
      typeOptions.forEach((t, i) => {
        const active = i === 0 ? ' freq-map-type-active' : '';
        html += '<button class="freq-map-type-btn' + active + '" data-type="' + t.v + '">' + t.label + '</button>';
      });
      html += '</div>';

      html += '<div class="freq-map-form-label">简介</div>';
      html += '<textarea class="freq-forum-textarea" id="freq-map-add-desc" rows="3" placeholder="地点简介（可选）" maxlength="100" style="margin-bottom:10px"></textarea>';

      html += '<div class="freq-map-form-label">是否已发现</div>';
      html += '<div style="display:flex;gap:8px;margin-bottom:12px">';
      html += '  <button class="freq-map-type-btn freq-map-type-active" data-discovered="true">✅ 已发现</button>';
      html += '  <button class="freq-map-type-btn" data-discovered="false">🌫️ 迷雾中</button>';
      html += '</div>';

      html += '<button class="freq-studio-action-btn" data-action="save-add" style="width:100%">添加地点</button>';

      html += '</div>';
      html += '</div>';

      this._container.innerHTML = html;

      let selectedType = 'city';
      let selectedDiscovered = true;

      // 返回
      const backBtn = this._container.querySelector('[data-action="back"]');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          self._currentView = 'map';
          self._renderMap();
        });
      }

      // 类型切换
      this._container.querySelectorAll('.freq-map-type-btn[data-type]').forEach(btn => {
        btn.addEventListener('click', function() {
          self._container.querySelectorAll('.freq-map-type-btn[data-type]').forEach(b => b.classList.remove('freq-map-type-active'));
          this.classList.add('freq-map-type-active');
          selectedType = this.dataset.type;
        });
      });

      // 发现状态切换
      this._container.querySelectorAll('.freq-map-type-btn[data-discovered]').forEach(btn => {
        btn.addEventListener('click', function() {
          self._container.querySelectorAll('.freq-map-type-btn[data-discovered]').forEach(b => b.classList.remove('freq-map-type-active'));
          this.classList.add('freq-map-type-active');
          selectedDiscovered = this.dataset.discovered === 'true';
        });
      });

      // 保存
      const saveBtn = this._container.querySelector('[data-action="save-add"]');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const name = (self._container.querySelector('#freq-map-add-name') || {}).value || '';
          const desc = (self._container.querySelector('#freq-map-add-desc') || {}).value || '';
          if (!name.trim()) return;

          // 随机找一个不太拥挤的坐标
          const locs = self._getLocations();
          let x, y, attempts = 0;
          do {
            x = 10 + Math.floor(Math.random() * 80);
            y = 10 + Math.floor(Math.random() * 80);
            attempts++;
          } while (attempts < 20 && locs.some(l => Math.abs(l.x - x) < 12 && Math.abs(l.y - y) < 12));

          const loc = {
            id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: name.trim(),
            type: selectedType,
            desc: desc.trim() || '一个神秘的地方。',
            x: x,
            y: y,
            discovered: selectedDiscovered,
            serial: '',
            visitCount: 0,
            createdAt: new Date().toISOString()
          };

          self._getLocations().push(loc);
          self._saveMap();
          self._currentView = 'map';
          self._renderMap();
        });
      }
    },

    // ═══════════════════════════════════════
    //  副API：批量生成世界
    // ═══════════════════════════════════════
    async _generateWorld() {
      if (this._generating) return;
      this._generating = true;
      this._renderMap();

      const messages = getChatMessages();
      const allFM = extractAllMeowFM(messages);
      const charName = getCurrentCharName() || 'Char';
      const count = getSettings().mapLocationCount || 10;

      // 拼接世界观上下文（最近5条 meow_FM）
      const recentFM = allFM.slice(-5);
      const worldContext = recentFM.length > 0
        ? recentFM.map(fm => [fm.scene, fm.plot, fm.event].filter(Boolean).join('；')).join('\n')
        : getLatestPlot(messages) || '（暂无剧情信息）';

      const promptTemplate = getPrompt('map_generate');
      const systemPrompt = promptTemplate
        .replace(/\{charName\}/g, charName)
        .replace(/\{worldContext\}/g, worldContext)
        .replace(/\{locationCount\}/g, String(count));

      try {
        const raw = await SubAPI.call(
          systemPrompt,
          '请生成世界地图地点列表，返回纯JSON数组。',
          { maxTokens: 1200, temperature: 0.85 }
        );

        let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        let parsed;
try {
  parsed = safeParseAIJson(raw, 'array');
} catch (e) {
  throw new Error('JSON解析失败：' + e.message);
}

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('返回数据格式异常');
        }

        const locs = parsed.map(item => ({
          id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          name: String(item.name || '未知地点'),
          type: ['city','ruin','wild','dungeon','special'].includes(item.type) ? item.type : 'wild',
          desc: String(item.desc || ''),
          x: Math.min(95, Math.max(5, Number(item.x) || 50)),
          y: Math.min(95, Math.max(5, Number(item.y) || 50)),
          discovered: false,
          serial: '',
          visitCount: 0,
          createdAt: new Date().toISOString()
        }));

        this._getMap().locations = locs;
        this._saveMap();

        EventBus.emit('notification:new', {
          app: 'map', icon: '🗺️',
          title: '世界地图已生成',
          body: '共 ' + locs.length + ' 个地点，等待探索'
        });

      } catch (e) {
        console.warn('[Freq Map] World generation failed:', e);
        EventBus.emit('error:new', { app: 'map', message: '世界生成失败：' + e.message });
      }

      this._generating = false;
      this._renderMap();
    },

    // ═══════════════════════════════════════
    //  副API：AI探索（追加一个新地点）
    // ═══════════════════════════════════════
    async _aiExplore() {
      if (this._exploring) return;
      this._exploring = true;
      this._renderMap();

      const messages = getChatMessages();
      const allFM = extractAllMeowFM(messages);
      const charName = getCurrentCharName() || 'Char';
      const recentFM = allFM.slice(-3);
      const worldContext = recentFM.length > 0
        ? recentFM.map(fm => [fm.scene, fm.plot, fm.event].filter(Boolean).join('；')).join('\n')
        : getLatestPlot(messages) || '（暂无剧情信息）';

      const promptTemplate = getPrompt('map_generate');
      const systemPrompt = promptTemplate
        .replace(/\{charName\}/g, charName)
        .replace(/\{worldContext\}/g, worldContext)
        .replace(/\{locationCount\}/g, '1');

      try {
        const raw = await SubAPI.call(
          systemPrompt,
          '请根据最新剧情，生成1个新发现的地点，返回纯JSON数组（只含1个元素）。',
          { maxTokens: 300, temperature: 0.9 }
        );

        let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        let parsed;
try {
  parsed = safeParseAIJson(raw, 'array');
} catch (e) {
  throw new Error('JSON解析失败');
}

        const item = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!item || !item.name) throw new Error('返回数据不完整');

        // 找一个不拥挤的坐标
        const locs = this._getLocations();
        let x = Math.min(95, Math.max(5, Number(item.x) || 50));
        let y = Math.min(95, Math.max(5, Number(item.y) || 50));
        let attempts = 0;
        while (attempts < 15 && locs.some(l => Math.abs(l.x - x) < 10 && Math.abs(l.y - y) < 10)) {
          x = 10 + Math.floor(Math.random() * 80);
          y = 10 + Math.floor(Math.random() * 80);
          attempts++;
        }

        const newLoc = {
          id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          name: String(item.name),
          type: ['city','ruin','wild','dungeon','special'].includes(item.type) ? item.type : 'wild',
          desc: String(item.desc || ''),
          x: x, y: y,
          discovered: true,   // AI探索发现的，直接解锁
          serial: '',
          visitCount: 0,
          createdAt: new Date().toISOString()
        };

        this._getLocations().push(newLoc);
        this._saveMap();

        EventBus.emit('notification:new', {
          app: 'map', icon: '🗺️',
          title: '探索发现',
          body: '「' + newLoc.name + '」已加入地图'
        });

      } catch (e) {
        console.warn('[Freq Map] AI explore failed:', e);
        EventBus.emit('error:new', { app: 'map', message: 'AI探索失败：' + e.message });
      }

      this._exploring = false;
      this._renderMap();
    },

    // ═══════════════════════════════════════
    //  副API：生成地点详情
    // ═══════════════════════════════════════
    async _generateDetail(loc) {
      if (!this._container) return;
      const commentDiv = this._container.querySelector('#freq-map-detail-comment');
      if (commentDiv) commentDiv.innerHTML = '<span class="freq-studio-loading">感知中…</span>';

      const messages = getChatMessages();
      const charName = getCurrentCharName() || 'Char';
      const latestPlot = getLatestPlot(messages) || '';
      const typeLabels = { city:'城镇', ruin:'废墟', wild:'荒野', dungeon:'秘境', special:'特殊' };

      const promptTemplate = getPrompt('map_detail');
      const systemPrompt = promptTemplate
        .replace(/\{charName\}/g, charName)
        .replace(/\{locationName\}/g, loc.name)
        .replace(/\{locationType\}/g, typeLabels[loc.type] || loc.type)
        .replace(/\{locationDesc\}/g, loc.desc)
        .replace(/\{latestPlot\}/g, latestPlot);

      try {
        const result = await SubAPI.call(
          systemPrompt,
          '请生成角色对这个地点的感知描述。',
          { maxTokens: 300, temperature: 0.85 }
        );
        this._detailCache[loc.id] = result.trim();
      } catch (e) {
        console.warn('[Freq Map] Detail generation failed:', e);
        if (commentDiv) {
          commentDiv.innerHTML = '<div class="freq-studio-error">生成失败：' + this._escHtml(e.message) + '</div>';
          return;
        }
      }

      if (this._container && this._currentView === 'detail') {
        this._renderDetail(loc);
      }
    },

    // ═══════════════════════════════════════
    //  副API：生成探索感想
    // ═══════════════════════════════════════
    async _generateEvent(loc) {
      if (!this._container) return;
      const resultDiv = this._container.querySelector('#freq-map-event-result');
      if (resultDiv) resultDiv.innerHTML = '<span class="freq-studio-loading">生成中…</span>';

      const messages = getChatMessages();
      const charName = getCurrentCharName() || 'Char';
      const latestPlot = getLatestPlot(messages) || '';
      const latestScene = getLatestScene(messages) || '';

      const promptTemplate = getPrompt('map_event');
      const systemPrompt = promptTemplate
        .replace(/\{charName\}/g, charName)
        .replace(/\{locationName\}/g, loc.name)
        .replace(/\{locationDesc\}/g, loc.desc)
        .replace(/\{latestPlot\}/g, latestPlot)
        .replace(/\{latestScene\}/g, latestScene);

      try {
        const result = await SubAPI.call(
          systemPrompt,
          '请生成角色在这个地点的感想。',
          { maxTokens: 200, temperature: 0.9 }
        );
        this._eventCache[loc.id] = result.trim();
        if (resultDiv) {
          resultDiv.innerHTML = '<div class="freq-map-comment-text" style="margin-top:4px">' + this._escHtml(result.trim()) + '</div>';
        }
      } catch (e) {
        console.warn('[Freq Map] Event generation failed:', e);
        if (resultDiv) {
          resultDiv.innerHTML = '<div class="freq-studio-error">生成失败：' + this._escHtml(e.message) + '</div>';
        }
      }
    },

    // ── HTML转义 ──
    _escHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  };
  //└─ BLOCK_24 ─┘
    // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_25  App · 频道文库                             │
  // └──────────────────────────────────────────────────────┘
  const novelApp = {
    id: 'novel', name: '频道文库', icon: '📖', _badge: 0, _container: null,

    // ── 视图状态 ──
    _currentView: 'boards',   // 'boards'|'board_detail'|'series_detail'|'read'|'write'|'ai_write'|'create_board'|'create_series'
    _currentBoardId: null,
    _currentSeriesId: null,   // null = 独立短篇
    _currentChapterId: null,
    _generating: false,

    // ── 默认分区 ──
    DEFAULT_BOARDS: [
      { id: 'romance', name: '清水恋爱', icon: '💕', desc: '纯爱向、甜文、治愈系' },
      { id: 'haitang', name: '海棠',     icon: '🌺', desc: '你懂的' },
      { id: 'po',      name: 'PO文',     icon: '🔥', desc: '大胆奔放、情感浓烈' },
      { id: 'career',  name: '职场文',   icon: '💼', desc: '职场、权谋、商战' },
      { id: 'other',   name: '其他',     icon: '📚', desc: '奇幻、悬疑、日常、世界观档案等' },
    ],

    // ── 分区风格描述（用于 prompt）──
    BOARD_STYLES: {
      romance: '清水纯爱风格，温柔甜蜜，注重情感细腻描写，不含露骨内容',
      haitang: '海棠风格，情感浓烈，可含成人向内容，文笔细腻',
      po:      'PO文风格，大胆直白，情感奔放，尺度较大',
      career:  '职场文风格，注重权谋博弈、人物关系、职场生态',
      other:   '自由风格，可以是奇幻、悬疑、日常、世界观档案等任意类型',
    },

    init() { /* 无需监听EventBus */ },

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      this._initDefaultBoards();
      this._dispatch(container);
    },

    unmount() { this._container = null; },

    // ── 视图分发 ──
    _dispatch(container) {
      switch (this._currentView) {
        case 'board_detail':   this._renderBoardDetail(container);  break;
        case 'series_detail':  this._renderSeriesDetail(container); break;
        case 'read':           this._renderRead(container);         break;
        case 'write':          this._renderWrite(container);        break;
        case 'ai_write':       this._renderAiWrite(container);      break;
        case 'create_board':   this._renderCreateBoard(container);  break;
        case 'create_series':  this._renderCreateSeries(container); break;
        default:               this._renderBoards(container);       break;
      }
    },

    // ── 数据层 ──
    _getData() {
      const s = getSettings();
      if (!s.novel) s.novel = { boards: [], series: [], chapters: [], comments: [] };
      if (!s.novel.boards)   s.novel.boards   = [];
      if (!s.novel.series)   s.novel.series   = [];
      if (!s.novel.chapters) s.novel.chapters = [];
      if (!s.novel.comments) s.novel.comments = [];
      return s.novel;
    },

    _save() {
      if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
    },

    _initDefaultBoards() {
      const d = this._getData();
      if (d.boards.length === 0) {
        this.DEFAULT_BOARDS.forEach(b => {
          d.boards.push({ id: b.id, name: b.name, icon: b.icon, desc: b.desc, createdAt: dateNow() });
        });
        this._save();
      }
    },

    _genId(prefix) {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    },

    _getChars() {
      const ctx = getContext();
      const mainName = getCurrentCharName();
      const userName = getUserName();
      const chars = [];
      if (mainName) chars.push({ name: mainName, type: 'char', desc: '' });
      if (ctx?.characters) {
        ctx.characters.forEach(c => {
          const name = c.name ?? c.data?.name ?? '';
          if (name && name !== mainName && name !== userName) {
            chars.push({ name, type: 'npc', desc: c.data?.description?.slice(0, 100) ?? '' });
          }
        });
      }
      return chars.length ? chars : [{ name: mainName || '角色', type: 'char', desc: '' }];
    },

    // ── 主视图：分区列表 ──
    _renderBoards(container) {
      this._currentView = 'boards';
      const d = this._getData();

      const boardsHTML = d.boards.map(b => {
        const seriesCount   = d.series.filter(s => s.boardId === b.id).length;
        const chapterCount  = d.chapters.filter(c => c.boardId === b.id).length;
        return `
          <div class="freq-novel-board-item" data-board-id="${b.id}">
            <span class="freq-novel-board-icon">${escapeHtml(b.icon)}</span>
            <div class="freq-novel-board-info">
              <div class="freq-novel-board-name">${escapeHtml(b.name)}</div>
              <div class="freq-novel-board-desc">${escapeHtml(b.desc)}</div>
            </div>
            <div class="freq-novel-board-stats">
              <span>${seriesCount} 系列</span>
              <span>${chapterCount} 篇</span>
            </div>
          </div>`;
      }).join('');

      container.innerHTML = `
        <div class="freq-app-header">📖 频道文库
          <div class="freq-novel-header-btns">
            <button class="freq-novel-icon-btn" id="freq-novel-write-btn" title="手动写作">✍️</button>
            <button class="freq-novel-icon-btn" id="freq-novel-ai-btn" title="AI写作">🤖</button>
            <button class="freq-novel-icon-btn" id="freq-novel-add-board-btn" title="新建分区">＋</button>
          </div>
        </div>
        <div class="freq-app-body freq-novel-body">
          ${d.boards.length
            ? `<div class="freq-novel-boards-list">${boardsHTML}</div>`
            : `<div class="freq-empty"><span class="freq-empty-icon">📖</span><span>还没有分区</span></div>`
          }
        </div>`;

      container.querySelectorAll('[data-board-id]').forEach(el => {
        el.addEventListener('click', () => {
          this._currentBoardId = el.dataset.boardId;
          this._currentView = 'board_detail';
          this._renderBoardDetail(container);
        });
      });

      container.querySelector('#freq-novel-write-btn')?.addEventListener('click', () => {
        this._currentView = 'write';
        this._renderWrite(container);
      });

      container.querySelector('#freq-novel-ai-btn')?.addEventListener('click', () => {
        this._currentView = 'ai_write';
        this._renderAiWrite(container);
      });

      container.querySelector('#freq-novel-add-board-btn')?.addEventListener('click', () => {
        this._currentView = 'create_board';
        this._renderCreateBoard(container);
      });
    },

    // ── 分区详情：系列列表 + 独立短篇 ──
    _renderBoardDetail(container) {
      this._currentView = 'board_detail';
      const d = this._getData();
      const board = d.boards.find(b => b.id === this._currentBoardId);
      if (!board) { this._renderBoards(container); return; }

      const seriesList   = d.series.filter(s => s.boardId === board.id);
      const standalones  = d.chapters.filter(c => c.boardId === board.id && !c.seriesId);

      const statusLabel = { ongoing: '连载中', completed: '已完结', hiatus: '暂停' };
      const statusClass = { ongoing: 'freq-novel-status--ongoing', completed: 'freq-novel-status--completed', hiatus: 'freq-novel-status--hiatus' };

      const seriesHTML = seriesList.length ? seriesList.map(s => {
        const chapCount = d.chapters.filter(c => c.seriesId === s.id).length;
        return `
          <div class="freq-novel-series-item" data-series-id="${s.id}">
            <span class="freq-novel-series-cover">${escapeHtml(s.coverEmoji || '📖')}</span>
            <div class="freq-novel-series-info">
              <div class="freq-novel-series-title">${escapeHtml(s.title)}</div>
              <div class="freq-novel-series-meta">
                <span class="freq-novel-author-tag freq-novel-author-tag--${s.authorType}">${escapeHtml(s.author)}</span>
                <span class="freq-novel-status-tag ${statusClass[s.status] || ''}">${statusLabel[s.status] || s.status}</span>
                <span class="freq-novel-series-count">${chapCount} 章</span>
              </div>
            </div>
          </div>`;
      }).join('') : '';

      const standaloneHTML = standalones.length ? standalones.map(c => `
        <div class="freq-novel-chapter-item" data-chapter-id="${c.id}">
          <div class="freq-novel-chapter-title">${escapeHtml(c.title)}</div>
          <div class="freq-novel-chapter-meta">
            <span class="freq-novel-author-tag freq-novel-author-tag--${c.authorType}">${escapeHtml(c.author)}</span>
            <span>${c.wordCount || 0} 字</span>
            <span>${c.date || ''}</span>
          </div>
        </div>`).join('') : '';

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-novel-back">←</button>
          ${escapeHtml(board.icon)} ${escapeHtml(board.name)}
          <div class="freq-novel-header-btns">
            <button class="freq-novel-icon-btn" id="freq-novel-new-series-btn" title="新建系列">＋系列</button>
          </div>
        </div>
        <div class="freq-app-body freq-novel-body">
          ${seriesList.length ? `
            <div class="freq-novel-section-title">📚 系列连载</div>
            <div class="freq-novel-series-list">${seriesHTML}</div>` : ''}
          ${standalones.length ? `
            <div class="freq-novel-section-title">📄 独立短篇</div>
            <div class="freq-novel-chapters-list">${standaloneHTML}</div>` : ''}
          ${!seriesList.length && !standalones.length
            ? `<div class="freq-empty"><span class="freq-empty-icon">${escapeHtml(board.icon)}</span><span>这个分区还没有作品</span><span style="font-size:10px;color:#333;">点击 ✍️ 或 🤖 开始创作</span></div>`
            : ''}
          <div class="freq-novel-board-actions">
            <button class="freq-studio-action-btn" id="freq-novel-write-here">✍️ 在此写作</button>
            <button class="freq-studio-action-btn freq-novel-ai-action-btn" id="freq-novel-ai-here">🤖 AI写作</button>
          </div>
          <button class="freq-checkin-delete-btn freq-novel-delete-board-btn" id="freq-novel-delete-board">🗑️ 删除此分区</button>
        </div>`;

      container.querySelector('#freq-novel-back')?.addEventListener('click', () => {
        this._renderBoards(container);
      });

      container.querySelectorAll('[data-series-id]').forEach(el => {
        el.addEventListener('click', () => {
          this._currentSeriesId = el.dataset.seriesId;
          this._currentView = 'series_detail';
          this._renderSeriesDetail(container);
        });
      });

      container.querySelectorAll('[data-chapter-id]').forEach(el => {
        el.addEventListener('click', () => {
          this._currentChapterId = el.dataset.chapterId;
          this._currentView = 'read';
          this._renderRead(container);
        });
      });

      container.querySelector('#freq-novel-new-series-btn')?.addEventListener('click', () => {
        this._currentView = 'create_series';
        this._renderCreateSeries(container);
      });

      container.querySelector('#freq-novel-write-here')?.addEventListener('click', () => {
        this._currentView = 'write';
        this._renderWrite(container);
      });

      container.querySelector('#freq-novel-ai-here')?.addEventListener('click', () => {
        this._currentView = 'ai_write';
        this._renderAiWrite(container);
      });

      container.querySelector('#freq-novel-delete-board')?.addEventListener('click', () => {
        this._confirmDeleteBoard(container, board.id);
      });
    },

    // ── 系列详情：章节列表 ──
    _renderSeriesDetail(container) {
      this._currentView = 'series_detail';
      const d = this._getData();
      const series = d.series.find(s => s.id === this._currentSeriesId);
      if (!series) { this._renderBoardDetail(container); return; }

      const chapters = d.chapters
        .filter(c => c.seriesId === series.id)
        .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));

      const statusLabel = { ongoing: '连载中', completed: '已完结', hiatus: '暂停' };
      const statusClass = { ongoing: 'freq-novel-status--ongoing', completed: 'freq-novel-status--completed', hiatus: 'freq-novel-status--hiatus' };

      const chaptersHTML = chapters.length ? chapters.map(c => `
        <div class="freq-novel-chapter-item" data-chapter-id="${c.id}">
          <span class="freq-novel-chapter-order">第 ${c.seriesOrder || '?'} 章</span>
          <div class="freq-novel-chapter-title">${escapeHtml(c.title)}</div>
          <div class="freq-novel-chapter-meta">
            <span class="freq-novel-author-tag freq-novel-author-tag--${c.authorType}">${escapeHtml(c.author)}</span>
            <span>${c.wordCount || 0} 字</span>
            <span>${c.date || ''}</span>
          </div>
        </div>`).join('') : `<div class="freq-empty"><span class="freq-empty-icon">📄</span><span>还没有章节</span></div>`;

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-novel-back">←</button>
          ${escapeHtml(series.coverEmoji || '📖')} ${escapeHtml(series.title)}
        </div>
        <div class="freq-app-body freq-novel-body">
          <div class="freq-novel-series-header-card">
            <div class="freq-novel-series-header-meta">
              <span class="freq-novel-author-tag freq-novel-author-tag--${series.authorType}">${escapeHtml(series.author)}</span>
              <span class="freq-novel-status-tag ${statusClass[series.status] || ''}">${statusLabel[series.status] || series.status}</span>
            </div>
            ${series.desc ? `<div class="freq-novel-series-header-desc">${escapeHtml(series.desc)}</div>` : ''}
            <div class="freq-novel-series-status-btns">
              ${['ongoing','completed','hiatus'].map(st => `
                <button class="freq-novel-status-change-btn ${series.status === st ? 'freq-novel-status-change-active' : ''}"
                  data-set-status="${st}">${statusLabel[st]}</button>`).join('')}
            </div>
          </div>
          <div class="freq-novel-section-title">📄 章节列表</div>
          <div class="freq-novel-chapters-list">${chaptersHTML}</div>
          <div class="freq-novel-board-actions">
            <button class="freq-studio-action-btn" id="freq-novel-write-chapter">✍️ 写新章节</button>
            <button class="freq-studio-action-btn freq-novel-ai-action-btn" id="freq-novel-ai-chapter">🤖 AI续写</button>
          </div>
          <button class="freq-checkin-delete-btn freq-novel-delete-board-btn" id="freq-novel-delete-series">🗑️ 删除此系列</button>
        </div>`;

      container.querySelector('#freq-novel-back')?.addEventListener('click', () => {
        this._currentView = 'board_detail';
        this._renderBoardDetail(container);
      });

      container.querySelectorAll('[data-chapter-id]').forEach(el => {
        el.addEventListener('click', () => {
          this._currentChapterId = el.dataset.chapterId;
          this._currentView = 'read';
          this._renderRead(container);
        });
      });

      container.querySelectorAll('[data-set-status]').forEach(btn => {
        btn.addEventListener('click', () => {
          series.status = btn.dataset.setStatus;
          this._save();
          this._renderSeriesDetail(container);
        });
      });

      container.querySelector('#freq-novel-write-chapter')?.addEventListener('click', () => {
        this._currentView = 'write';
        this._renderWrite(container);
      });

      container.querySelector('#freq-novel-ai-chapter')?.addEventListener('click', () => {
        this._currentView = 'ai_write';
        this._renderAiWrite(container);
      });

      container.querySelector('#freq-novel-delete-series')?.addEventListener('click', () => {
        this._confirmDeleteSeries(container, series.id);
      });
    },

    // ── 阅读视图 ──
    _renderRead(container) {
      this._currentView = 'read';
      const d = this._getData();
      const chapter = d.chapters.find(c => c.id === this._currentChapterId);
      if (!chapter) { this._renderBoards(container); return; }

      const comments = d.comments.filter(c => c.chapterId === chapter.id);
      const chars = this._getChars();

      const commentsHTML = comments.length ? comments.map(c => `
        <div class="freq-novel-comment-item">
          <div class="freq-novel-comment-header">
            <span class="freq-novel-author-tag freq-novel-author-tag--${c.authorType}">${escapeHtml(c.author)}</span>
            <span class="freq-novel-comment-time">${c.date || ''} ${c.time || ''}</span>
          </div>
          <div class="freq-novel-comment-body">${escapeHtml(c.content)}</div>
        </div>`).join('') : `<div class="freq-novel-no-comment">还没有评论，召唤角色来评论吧</div>`;

      const charOptions = chars.map(c =>
        `<option value="${escapeHtml(c.name)}" data-type="${c.type}">${escapeHtml(c.name)}</option>`
      ).join('');

      // 把正文按段落分割，每段包一个 <p>
      const contentHTML = (chapter.content || '')
        .split(/\n+/)
        .filter(p => p.trim())
        .map(p => `<p class="freq-novel-read-para">${escapeHtml(p)}</p>`)
        .join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-novel-back">←</button>
          <span class="freq-novel-read-header-title">${escapeHtml(chapter.title.slice(0, 14))}</span>
        </div>
        <div class="freq-app-body freq-novel-read-body" id="freq-novel-read-body">

          <div class="freq-novel-read-meta">
            <span class="freq-novel-author-tag freq-novel-author-tag--${chapter.authorType}">${escapeHtml(chapter.author)}</span>
            <span class="freq-novel-read-wordcount">${chapter.wordCount || 0} 字</span>
            <span class="freq-novel-read-date">${chapter.date || ''}</span>
          </div>

          <h2 class="freq-novel-read-title">${escapeHtml(chapter.title)}</h2>

          <div class="freq-novel-read-content">${contentHTML}</div>

          <div class="freq-novel-comment-section">
            <div class="freq-novel-section-title">💬 评论区</div>
            <div id="freq-novel-comments-list">${commentsHTML}</div>

            <div class="freq-novel-comment-form">
              <textarea class="freq-forum-textarea" id="freq-novel-comment-input"
                placeholder="写下你的感想..." rows="2"></textarea>
              <button class="freq-studio-action-btn" id="freq-novel-comment-submit" style="width:100%;margin-top:6px;">
                发表评论
              </button>
            </div>

            <div class="freq-novel-summon-bar">
              <select class="freq-novel-char-select" id="freq-novel-char-select">
                <option value="__random__">🎲 随机NPC</option>
                ${charOptions}
              </select>
              <button class="freq-novel-summon-btn" id="freq-novel-summon-btn">召唤评论</button>
            </div>
            <div id="freq-novel-summon-status"></div>
          </div>

          <div style="margin-top:16px;text-align:center;">
            <button class="freq-checkin-delete-btn" id="freq-novel-delete-chapter">🗑️ 删除此章节</button>
          </div>
        </div>`;

      // 返回
      container.querySelector('#freq-novel-back')?.addEventListener('click', () => {
        if (chapter.seriesId) {
          this._currentView = 'series_detail';
          this._renderSeriesDetail(container);
        } else {
          this._currentView = 'board_detail';
          this._renderBoardDetail(container);
        }
      });

      // 用户发评论
      container.querySelector('#freq-novel-comment-submit')?.addEventListener('click', () => {
        const input = container.querySelector('#freq-novel-comment-input');
        const text = input?.value.trim();
        if (!text) return;
        const comment = {
          id: this._genId('cmt'),
          chapterId: chapter.id,
          author: getUserName(),
          authorType: 'user',
          content: text,
          date: dateNow(),
          time: timeNow(),
          createdAt: Date.now(),
        };
        d.comments.push(comment);
        this._save();
        input.value = '';
        this._refreshComments(container, chapter.id);
      });

      // 召唤NPC评论
      container.querySelector('#freq-novel-summon-btn')?.addEventListener('click', () => {
        this._summonComment(container, chapter);
      });

      // 删除章节
      container.querySelector('#freq-novel-delete-chapter')?.addEventListener('click', () => {
        this._confirmDeleteChapter(container, chapter.id);
      });
    },

    // ── 刷新评论区（不重绘整页）──
    _refreshComments(container, chapterId) {
      const d = this._getData();
      const comments = d.comments.filter(c => c.chapterId === chapterId);
      const listEl = container.querySelector('#freq-novel-comments-list');
      if (!listEl) return;
      listEl.innerHTML = comments.length ? comments.map(c => `
        <div class="freq-novel-comment-item">
          <div class="freq-novel-comment-header">
            <span class="freq-novel-author-tag freq-novel-author-tag--${c.authorType}">${escapeHtml(c.author)}</span>
            <span class="freq-novel-comment-time">${c.date || ''} ${c.time || ''}</span>
          </div>
          <div class="freq-novel-comment-body">${escapeHtml(c.content)}</div>
        </div>`).join('')
        : `<div class="freq-novel-no-comment">还没有评论，召唤角色来评论吧</div>`;
    },

    // ── 召唤NPC评论 ──
    async _summonComment(container, chapter) {
      if (this._generating) return;
      this._generating = true;

      const btn = container.querySelector('#freq-novel-summon-btn');
      const statusEl = container.querySelector('#freq-novel-summon-status');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ 召唤中...'; }

      const selectEl = container.querySelector('#freq-novel-char-select');
      const selectedVal = selectEl?.value || '__random__';

      const chars = this._getChars();
      let char;
      if (selectedVal === '__random__') {
        char = chars[Math.floor(Math.random() * chars.length)];
      } else {
        char = chars.find(c => c.name === selectedVal) || chars[0];
      }

      const d = this._getData();
      const board = d.boards.find(b => b.id === chapter.boardId);
      const excerpt = (chapter.content || '').slice(0, 300);

            const systemPrompt = getPrompt('novel_comment')
        .replace(/{authorName}/g, char.name)
        .replace(/{chapterTitle}/g, chapter.title)
        .replace(/{chapterExcerpt}/g, excerpt)
        .replace(/{chapterAuthor}/g, chapter.author)
        .replace(/{boardName}/g, board?.name || '未知分区');

      try {
        const raw = await SubAPI.call(systemPrompt, '写评论。', { maxTokens: 200, temperature: 0.9 });
        const comment = {
          id: this._genId('cmt'),
          chapterId: chapter.id,
          author: char.name,
          authorType: char.type,
          content: raw.trim(),
          date: dateNow(),
          time: timeNow(),
          createdAt: Date.now(),
        };
        d.comments.push(comment);
        this._save();
        this._refreshComments(container, chapter.id);
        if (statusEl) { statusEl.textContent = `✓ ${char.name} 留下了评论`; setTimeout(() => { statusEl.textContent = ''; }, 2000); }
      } catch (e) {
        Notify.error('频道文库·召唤评论', e);
        if (statusEl) { statusEl.textContent = '召唤失败，请重试'; setTimeout(() => { statusEl.textContent = ''; }, 2000); }
      } finally {
        this._generating = false;
        if (btn) { btn.disabled = false; btn.textContent = '召唤评论'; }
      }
    },

    // ── 手动写作视图 ──
    _renderWrite(container) {
      this._currentView = 'write';
      const d = this._getData();

      const boardOptions = d.boards.map(b =>
        `<option value="${b.id}" ${b.id === this._currentBoardId ? 'selected' : ''}>${escapeHtml(b.icon)} ${escapeHtml(b.name)}</option>`
      ).join('');

      // 根据当前选中分区生成系列选项（初始用第一个分区）
      const initBoardId = this._currentBoardId || d.boards[0]?.id || '';
      const initSeries = d.series.filter(s => s.boardId === initBoardId);
      const seriesOptions = this._buildSeriesOptions(initSeries);

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-novel-back">←</button>
          ✍️ 写作
        </div>
        <div class="freq-app-body freq-novel-body">
          <div class="freq-novel-write-form">

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">分区</label>
              <select class="freq-novel-select" id="freq-novel-write-board">
                ${boardOptions}
              </select>
            </div>

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">归属系列</label>
              <select class="freq-novel-select" id="freq-novel-write-series">
                ${seriesOptions}
              </select>
            </div>

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">章节标题</label>
              <input type="text" class="freq-forum-input" id="freq-novel-write-title"
                placeholder="给这篇作品起个标题..." maxlength="40" />
            </div>

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">正文</label>
              <textarea class="freq-forum-textarea freq-novel-write-textarea" id="freq-novel-write-content"
                placeholder="开始写作..." rows="10"></textarea>
            </div>

            <button class="freq-studio-action-btn" id="freq-novel-write-submit" style="width:100%;">
              📖 发布
            </button>
          </div>
        </div>`;

      // 切换分区时更新系列下拉
      container.querySelector('#freq-novel-write-board')?.addEventListener('change', e => {
        const boardId = e.target.value;
        const series = d.series.filter(s => s.boardId === boardId);
        const sel = container.querySelector('#freq-novel-write-series');
        if (sel) sel.innerHTML = this._buildSeriesOptions(series);
      });

      container.querySelector('#freq-novel-back')?.addEventListener('click', () => {
        this._currentView = this._currentSeriesId ? 'series_detail' : (this._currentBoardId ? 'board_detail' : 'boards');
        this._dispatch(container);
      });

      container.querySelector('#freq-novel-write-submit')?.addEventListener('click', () => {
        this._submitWrite(container);
      });
    },

    _buildSeriesOptions(seriesList) {
      const opts = [`<option value="__standalone__">📄 独立短篇</option>`];
      seriesList.forEach(s => {
        opts.push(`<option value="${s.id}">${escapeHtml(s.coverEmoji || '📖')} ${escapeHtml(s.title)}</option>`);
      });
      return opts.join('');
    },

    _submitWrite(container) {
      const boardId   = container.querySelector('#freq-novel-write-board')?.value;
      const seriesVal = container.querySelector('#freq-novel-write-series')?.value;
      const title     = container.querySelector('#freq-novel-write-title')?.value.trim();
      const content   = container.querySelector('#freq-novel-write-content')?.value.trim();

      if (!title || !content) {
        const btn = container.querySelector('#freq-novel-write-submit');
        if (btn) { btn.textContent = '⚠️ 标题和正文不能为空'; setTimeout(() => { btn.textContent = '📖 发布'; }, 1500); }
        return;
      }

      const d = this._getData();
      const seriesId = (seriesVal && seriesVal !== '__standalone__') ? seriesVal : null;
      const series   = seriesId ? d.series.find(s => s.id === seriesId) : null;
      const chapCount = seriesId ? d.chapters.filter(c => c.seriesId === seriesId).length : 0;

      const chapter = {
        id: this._genId('chap'),
        boardId: boardId || d.boards[0]?.id || '',
        seriesId: seriesId,
        seriesOrder: seriesId ? chapCount + 1 : null,
        title,
        content,
        author: getUserName(),
        authorType: 'user',
        wordCount: content.length,
        date: dateNow(),
        time: timeNow(),
        serial: getLatestMeowTime(getChatMessages()) || '',
        createdAt: Date.now(),
      };

      d.chapters.push(chapter);
      this._save();

      this._currentBoardId   = chapter.boardId;
      this._currentSeriesId  = seriesId;
      this._currentChapterId = chapter.id;
      this._currentView = 'read';
      this._renderRead(container);
    },

    // ── AI写作视图 ──
    _renderAiWrite(container) {
      this._currentView = 'ai_write';
      const d = this._getData();

      const boardOptions = d.boards.map(b =>
        `<option value="${b.id}" ${b.id === this._currentBoardId ? 'selected' : ''}>${escapeHtml(b.icon)} ${escapeHtml(b.name)}</option>`
      ).join('');

      const initBoardId = this._currentBoardId || d.boards[0]?.id || '';
      const initSeries  = d.series.filter(s => s.boardId === initBoardId);
      const seriesOptions = this._buildSeriesOptions(initSeries);

      const chars = this._getChars();
      const charOptions = chars.map(c =>
        `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
      ).join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-novel-back">←</button>
          🤖 AI写作
        </div>
        <div class="freq-app-body freq-novel-body">
          <div class="freq-novel-write-form">

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">由谁来写</label>
              <select class="freq-novel-select" id="freq-novel-ai-author">
                ${charOptions}
              </select>
            </div>

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">发布到分区</label>
              <select class="freq-novel-select" id="freq-novel-ai-board">
                ${boardOptions}
              </select>
            </div>

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">归属系列</label>
              <select class="freq-novel-select" id="freq-novel-ai-series">
                ${seriesOptions}
              </select>
            </div>

            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">创作方向 <span style="color:#555;font-weight:normal;">（可选）</span></label>
              <textarea class="freq-forum-textarea" id="freq-novel-ai-hint"
                placeholder="给AI一个方向，例如：写一段雨夜告白、续写上次的剧情..." rows="3"></textarea>
            </div>

            <button class="freq-studio-action-btn" id="freq-novel-ai-submit" style="width:100%;">
              🤖 开始生成
            </button>
            <div id="freq-novel-ai-status" class="freq-studio-loading" style="display:none;text-align:center;margin-top:8px;">
              ✦ 创作中，请稍候...
            </div>
          </div>
        </div>`;

      container.querySelector('#freq-novel-ai-board')?.addEventListener('change', e => {
        const boardId = e.target.value;
        const series  = d.series.filter(s => s.boardId === boardId);
        const sel = container.querySelector('#freq-novel-ai-series');
        if (sel) sel.innerHTML = this._buildSeriesOptions(series);
      });

      container.querySelector('#freq-novel-back')?.addEventListener('click', () => {
        this._currentView = this._currentSeriesId ? 'series_detail' : (this._currentBoardId ? 'board_detail' : 'boards');
        this._dispatch(container);
      });

      container.querySelector('#freq-novel-ai-submit')?.addEventListener('click', () => {
        this._submitAiWrite(container);
      });
    },

    async _submitAiWrite(container) {
      if (this._generating) return;
      this._generating = true;

      const btn      = container.querySelector('#freq-novel-ai-submit');
      const statusEl = container.querySelector('#freq-novel-ai-status');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ 生成中...'; }
      if (statusEl) statusEl.style.display = 'block';

      const authorName = container.querySelector('#freq-novel-ai-author')?.value || getCurrentCharName() || '角色';
      const boardId    = container.querySelector('#freq-novel-ai-board')?.value;
      const seriesVal  = container.querySelector('#freq-novel-ai-series')?.value;
      const userHint   = container.querySelector('#freq-novel-ai-hint')?.value.trim() || '自由发挥';

      const d = this._getData();
      const board    = d.boards.find(b => b.id === boardId);
      const seriesId = (seriesVal && seriesVal !== '__standalone__') ? seriesVal : null;
      const series   = seriesId ? d.series.find(s => s.id === seriesId) : null;

      const msgs        = getChatMessages();
      const latestPlot  = getLatestPlot(msgs) || '暂无';
      const latestScene = getLatestScene(msgs) || '暂无';
      const latestSeeds = (() => {
        const all = extractAllMeowFM(msgs);
        return all.length ? all[all.length - 1].seeds : '暂无';
      })();

      const seriesInfo = series
        ? `所属系列：${series.title}\n系列简介：${series.desc || '无'}\n当前已有 ${d.chapters.filter(c => c.seriesId === seriesId).length} 章`
        : '独立短篇，无系列背景';

      const chars = this._getChars();
      const charObj = chars.find(c => c.name === authorName);

      const systemPrompt = getPrompt('novel_generate')
        .replace(/{authorName}/g, authorName)
        .replace(/{boardName}/g, board?.name || '未知分区')
        .replace(/{boardStyle}/g, this.BOARD_STYLES[boardId] || '自由风格')
        .replace(/{seriesInfo}/g, seriesInfo)
        .replace(/{charName}/g, getCurrentCharName() || '角色')
        .replace(/{latestPlot}/g, latestPlot)
        .replace(/{latestScene}/g, latestScene)
        .replace(/{latestSeeds}/g, latestSeeds)
        .replace(/{userHint}/g, userHint);

      try {
        const raw = await SubAPI.call(systemPrompt, '开始创作。', { maxTokens: 1500, temperature: 0.9 });

        // 清理 markdown 代码块标记后再解析
        const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const match   = cleaned.match(/\{[\s\S]*\}/);
        let title = '无题', content = cleaned;
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            title   = parsed.title   || '无题';
            content = parsed.content || cleaned;
          } catch (_) {
            // JSON解析失败，直接用原文作为正文
          }
        }

        const chapCount = seriesId ? d.chapters.filter(c => c.seriesId === seriesId).length : 0;
        const chapter = {
          id: this._genId('chap'),
          boardId: boardId || d.boards[0]?.id || '',
          seriesId,
          seriesOrder: seriesId ? chapCount + 1 : null,
          title,
          content,
          author: authorName,
          authorType: charObj?.type || 'char',
          wordCount: content.length,
          date: dateNow(),
          time: timeNow(),
          serial: getLatestMeowTime(msgs) || '',
          createdAt: Date.now(),
        };

        d.chapters.push(chapter);
        this._save();

        this._badge++;
        renderAppGrid();
        Notify.add('频道文库', `${authorName} 发布了新作品《${title}》`, '📖');

        this._currentBoardId   = chapter.boardId;
        this._currentSeriesId  = seriesId;
        this._currentChapterId = chapter.id;
        this._currentView = 'read';
        this._renderRead(container);

      } catch (e) {
        Notify.error('频道文库·AI写作', e);
        if (statusEl) { statusEl.style.display = 'none'; }
        if (btn) { btn.disabled = false; btn.textContent = '🤖 生成失败，重试'; }
      } finally {
        this._generating = false;
      }
    },

    // ── 创建分区 ──
    _renderCreateBoard(container) {
      this._currentView = 'create_board';
      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-novel-back">←</button>
          ＋ 新建分区
        </div>
        <div class="freq-app-body freq-novel-body">
          <div class="freq-novel-write-form">
            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">分区图标（emoji）</label>
              <input type="text" class="freq-forum-input" id="freq-novel-board-icon"
                placeholder="📖" maxlength="4" value="📖" />
            </div>
            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">分区名称</label>
              <input type="text" class="freq-forum-input" id="freq-novel-board-name"
                placeholder="分区名..." maxlength="20" />
            </div>
            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">分区简介</label>
              <input type="text" class="freq-forum-input" id="freq-novel-board-desc"
                placeholder="一句话描述这个分区..." maxlength="40" />
            </div>
            <button class="freq-studio-action-btn" id="freq-novel-board-submit" style="width:100%;">
              创建分区
            </button>
          </div>
        </div>`;

      container.querySelector('#freq-novel-back')?.addEventListener('click', () => {
        this._renderBoards(container);
      });

      container.querySelector('#freq-novel-board-submit')?.addEventListener('click', () => {
        const icon = container.querySelector('#freq-novel-board-icon')?.value.trim() || '📖';
        const name = container.querySelector('#freq-novel-board-name')?.value.trim();
        const desc = container.querySelector('#freq-novel-board-desc')?.value.trim() || '';
        if (!name) return;
        const d = this._getData();
        d.boards.push({ id: this._genId('board'), name, icon, desc, createdAt: dateNow() });
        this._save();
        this._renderBoards(container);
      });
    },

    // ── 创建系列 ──
    _renderCreateSeries(container) {
      this._currentView = 'create_series';
      const d = this._getData();
      const board = d.boards.find(b => b.id === this._currentBoardId);

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-novel-back">←</button>
          ＋ 新建系列
        </div>
        <div class="freq-app-body freq-novel-body">
          <div class="freq-novel-write-form">
            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">封面图标（emoji）</label>
              <input type="text" class="freq-forum-input" id="freq-novel-series-emoji"
                placeholder="📖" maxlength="4" value="📖" />
            </div>
            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">系列名称</label>
              <input type="text" class="freq-forum-input" id="freq-novel-series-title"
                placeholder="系列名..." maxlength="30" />
            </div>
            <div class="freq-novel-form-group">
              <label class="freq-novel-form-label">系列简介</label>
              <textarea class="freq-forum-textarea" id="freq-novel-series-desc"
                placeholder="简单介绍这个系列..." rows="2"></textarea>
            </div>
            <button class="freq-studio-action-btn" id="freq-novel-series-submit" style="width:100%;">
              创建系列
            </button>
          </div>
        </div>`;

      container.querySelector('#freq-novel-back')?.addEventListener('click', () => {
        this._currentView = 'board_detail';
        this._renderBoardDetail(container);
      });

      container.querySelector('#freq-novel-series-submit')?.addEventListener('click', () => {
        const coverEmoji = container.querySelector('#freq-novel-series-emoji')?.value.trim() || '📖';
        const title      = container.querySelector('#freq-novel-series-title')?.value.trim();
        const desc       = container.querySelector('#freq-novel-series-desc')?.value.trim() || '';
        if (!title) return;
        const userName = getUserName();
        d.series.push({
          id: this._genId('ser'),
          boardId: this._currentBoardId,
          title,
          author: userName,
          authorType: 'user',
          desc,
          coverEmoji,
          status: 'ongoing',
          createdAt: dateNow(),
        });
        this._save();
        this._currentView = 'board_detail';
        this._renderBoardDetail(container);
      });
    },

    // ── 删除确认（通用）──
    _confirmDelete(btn, onConfirm) {
      if (!btn) return;
      if (btn.dataset.confirming === '1') {
        onConfirm();
        return;
      }
      btn.dataset.confirming = '1';
      const orig = btn.textContent;
      btn.textContent = '⚠️ 确认删除？再次点击执行';
      btn.style.borderColor = '#A32D2D';
      btn.style.color = '#e88';
      setTimeout(() => {
        if (btn.dataset.confirming === '1') {
          btn.dataset.confirming = '';
          btn.textContent = orig;
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      }, 3000);
    },

    _confirmDeleteBoard(container, boardId) {
      const btn = container.querySelector('#freq-novel-delete-board');
      this._confirmDelete(btn, () => {
        const d = this._getData();
        d.boards   = d.boards.filter(b => b.id !== boardId);
        d.series   = d.series.filter(s => s.boardId !== boardId);
        const chapIds = d.chapters.filter(c => c.boardId === boardId).map(c => c.id);
        d.chapters = d.chapters.filter(c => c.boardId !== boardId);
        d.comments = d.comments.filter(c => !chapIds.includes(c.chapterId));
        this._save();
        this._currentBoardId = null;
        this._renderBoards(container);
      });
    },

    _confirmDeleteSeries(container, seriesId) {
      const btn = container.querySelector('#freq-novel-delete-series');
      this._confirmDelete(btn, () => {
        const d = this._getData();
        d.series   = d.series.filter(s => s.id !== seriesId);
        const chapIds = d.chapters.filter(c => c.seriesId === seriesId).map(c => c.id);
        d.chapters = d.chapters.filter(c => c.seriesId !== seriesId);
        d.comments = d.comments.filter(c => !chapIds.includes(c.chapterId));
        this._save();
        this._currentSeriesId = null;
        this._currentView = 'board_detail';
        this._renderBoardDetail(container);
      });
    },

    _confirmDeleteChapter(container, chapterId) {
      const btn = container.querySelector('#freq-novel-delete-chapter');
      this._confirmDelete(btn, () => {
        const d = this._getData();
        const chapter = d.chapters.find(c => c.id === chapterId);
        d.chapters = d.chapters.filter(c => c.id !== chapterId);
        d.comments = d.comments.filter(c => c.chapterId !== chapterId);
        this._save();
        if (chapter?.seriesId) {
          this._currentView = 'series_detail';
          this._renderSeriesDetail(container);
        } else {
          this._currentView = 'board_detail';
          this._renderBoardDetail(container);
        }
      });
    },
  };
  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_25  App · 频道文库结束                          │
  // └──────────────────────────────────────────────────────┘
  //┌─ BLOCK_26 ─┐
//═══════════════════════════════════════
// 🔒 黑匣子·禁区档案
// ═══════════════════════════════════════

const blackboxApp = {
  id: 'blackbox',
  name: '黑匣子',
  icon: '🔒',
  _badge: 0,
  _container: null,
  _currentView: 'list',   // 'list' | 'detail'
  _selectedFile: null,
  _generating: false,
  _decrypting: false,

  // ── 档案类型定义 ──
  _types: {
    conversation: { icon: '🔒', label: '秘密对话', promptKey: 'blackbox_conversation' },
    plan:         { icon: '📋', label: '节目策划', promptKey: 'blackbox_plan' },
    comm:         { icon: '📡', label: '内部通讯', promptKey: 'blackbox_comm' },
    diary:        { icon: '📓', label: '秘密日记', promptKey: 'blackbox_diary' }
  },

  // ── 机密等级颜色 ──
  _classColors: {
    CONFIDENTIAL: '#c9a227',
    SECRET:       '#d45500',
    TOP_SECRET:   '#cc0033'
  },

  // ── 乱码字符池 ──
  _glitchChars: '█▓░▒◼◻▪▫■□▶◀●○◆◇♦♢⬛⬜'.split(''),

  // ═══════════════════════════════════
  //  init — EventBus 监听
  // ═══════════════════════════════════
  init() {
    EventBus.on('meow_fm:updated', (allMeowFM) => {
      const s = getSettings();
      if (s.pluginEnabled === false) return;
      if (!s.blackboxAutoIntercept) return;
      const rate = (s.blackboxInterceptRate ?? 20) / 100;
      if (Math.random() < rate && allMeowFM && allMeowFM.length > 0) {
        this._autoIntercept(allMeowFM);
      }
    });
  },

  // ═══════════════════════════════════
  //  mount / unmount
  // ═══════════════════════════════════
  mount(container) {
    this._container = container;
    this._badge =0;
    renderAppGrid();
    this._currentView = 'list';
    this._selectedFile = null;
    this._render();
  },

  unmount() {
    this._container = null;
  },

  // ═══════════════════════════════════
  //  数据访问
  // ═══════════════════════════════════
  _getData() {
    const s = getSettings();
    if (!s.blackbox) s.blackbox = { files: [], unlockedIds: [] };
    if (!Array.isArray(s.blackbox.files)) s.blackbox.files = [];
    if (!Array.isArray(s.blackbox.unlockedIds)) s.blackbox.unlockedIds = [];
    return s.blackbox;
  },

  _save() {
    saveSettings({});
  },

  _isUnlocked(id) {
    return this._getData().unlockedIds.includes(id);
  },

  // ═══════════════════════════════════
  //  乱码标题生成
  // ═══════════════════════════════════
  _generateEncryptedTitle(realTitle) {
    const chars = this._glitchChars;
    let result = '';
    for (let i = 0; i < realTitle.length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  },

  // ═══════════════════════════════════
  //  唯一ID生成
  // ═══════════════════════════════════
  _genId() {
    return 'bb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  },

  // ═══════════════════════════════════
  //  获取角色列表（复用forumApp 模式）
  // ═══════════════════════════════════
  _getChars() {
    const chars = [getCurrentCharName()];
    try {
      const ctx = getContext();
      if (ctx.characters) {
        const names = ctx.characters
          .filter(c => c.name && c.name !== getCurrentCharName())
          .map(c => c.name);
        chars.push(...names);
      }
    } catch (e) { /* ignore */ }
    return chars.length > 0 ? chars : ['未知角色'];
  },

  // ═══════════════════════════════════
  //渲染入口
  // ═══════════════════════════════════
  _render() {
    if (!this._container) return;
    if (this._currentView === 'detail' && this._selectedFile) {
      this._renderDetail();
    } else {
      this._renderList();
    }
  },

  // ═══════════════════════════════════
  //  主视图 — 档案列表
  // ═══════════════════════════════════
  _renderList() {
    const c = this._container;
    const data = this._getData();
    const files = data.files;
    const unlockedCount = data.unlockedIds.length;
    const lockedCount = files.length - unlockedCount;

    let filesHTML = '';
    if (files.length === 0) {
      filesHTML = `
        <div class="freq-empty">
          <div class="freq-empty-icon">🔒</div>
          <div>禁区空空如也…<br>尝试截获一份档案</div>
        </div>`;
    } else {
      filesHTML = files.slice().reverse().map(f => {
        const unlocked = this._isUnlocked(f.id);
        const typeDef = this._types[f.type] || this._types.conversation;
        const classColor = this._classColors[f.classification] || '#999';
        const displayTitle = unlocked ? f.title : f.encryptedTitle;
        const titleClass = unlocked ? 'freq-bb-title-unlocked' : 'freq-bb-title-locked';

        return `
          <div class="freq-bb-file-item ${unlocked ? 'freq-bb-unlocked' : 'freq-bb-locked'}"
               data-file-id="${f.id}">
            <div class="freq-bb-file-icon">${typeDef.icon}</div>
            <div class="freq-bb-file-info">
              <div class="freq-bb-file-title ${titleClass}">${displayTitle}</div>
              <div class="freq-bb-file-meta">
                <span class="freq-bb-class-tag" style="background:${classColor}">${f.classification || 'UNKNOWN'}</span>
                <span class="freq-bb-type-label">${typeDef.label}</span>
                ${unlocked ? '' : '<span class="freq-bb-lock-icon">🔐</span>'}
              </div>
            </div>
          </div>`;
      }).join('');
    }

    c.innerHTML = `
      <div class="freq-app-header" style="border-bottom-color: #8b1a1a;">
        🔒 黑匣子·禁区档案
      </div>
      <div class="freq-app-body">
        <div class="freq-bb-warning-banner">
          <div class="freq-bb-warning-icon">⚠️</div>
          <div class="freq-bb-warning-text">
            <div class="freq-bb-warning-title">⛔禁 区 警 告</div>
            <div class="freq-bb-warning-sub">未经授权访问将被记录 | 已截获 ${files.length} 份档案 | 已破解 ${unlockedCount} 份| 加密中 ${lockedCount} 份</div>
          </div>
        </div>

        <div class="freq-bb-file-list">
          ${filesHTML}
        </div>

        <div class="freq-bb-actions">
          <button class="freq-bb-action-btn freq-bb-decrypt-btn" ${lockedCount === 0 ? 'disabled' : ''}>
            🔓 破解档案
          </button>
          <button class="freq-bb-action-btn freq-bb-intercept-btn">📡 截获新档案
          </button><button class="freq-checkin-delete-btn freq-bb-clear-btn" ${files.length === 0 ? 'disabled' : ''}>
            🗑️ 清空所有
          </button>
        </div>

        <div class="freq-bb-type-selector" style="display:none;">
          <div class="freq-bb-type-title">选择截获类型：</div>
          <div class="freq-bb-type-options">
            <button class="freq-bb-type-btn" data-type="random">🎲 随机</button>
            <button class="freq-bb-type-btn" data-type="conversation">🔒秘密对话</button>
            <button class="freq-bb-type-btn" data-type="plan">📋 节目策划</button>
            <button class="freq-bb-type-btn" data-type="comm">📡 内部通讯</button>
            <button class="freq-bb-type-btn" data-type="diary">📓 秘密日记</button>
          </div>
        </div>
      </div>`;

    // ── 绑定事件 ──

    // 档案点击
    c.querySelectorAll('.freq-bb-file-item').forEach(item => {
      item.addEventListener('click', () => {
        const fileId = item.dataset.fileId;
        if (this._isUnlocked(fileId)) {
          const file = this._getData().files.find(f => f.id === fileId);
          if (file) {
            this._selectedFile = file;
            this._currentView = 'detail';
            this._render();
          }
        } else {
          Notify.info('🔐 档案已加密，需要先破解才能阅读');
        }
      });
    });

    // 破解按钮
    const decryptBtn = c.querySelector('.freq-bb-decrypt-btn');
    if (decryptBtn) {
      decryptBtn.addEventListener('click', () => {
        this._decryptRandomFile();
      });
    }

    // 截获按钮 → 显示类型选择器
    const interceptBtn = c.querySelector('.freq-bb-intercept-btn');
    const typeSelector = c.querySelector('.freq-bb-type-selector');
    if (interceptBtn && typeSelector) {
      interceptBtn.addEventListener('click', () => {
        if (this._generating) return;
        const isVisible = typeSelector.style.display !== 'none';
        typeSelector.style.display = isVisible ? 'none' : 'block';
      });
    }

    // 类型选择按钮
    c.querySelectorAll('.freq-bb-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        if (typeSelector) typeSelector.style.display = 'none';
        this._interceptFile(type === 'random' ? null : type);
      });
    });

    // 清空按钮
    const clearBtn = c.querySelector('.freq-bb-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._confirmClear(clearBtn);
      });
    }
  },

  // ═══════════════════════════════════
  //  阅读视图 — 档案详情
  // ═══════════════════════════════════
  _renderDetail() {
    const c = this._container;
    const f = this._selectedFile;
    if (!f) { this._currentView = 'list'; this._render(); return; }

    const typeDef = this._types[f.type] || this._types.conversation;
    const classColor = this._classColors[f.classification] || '#999';

    // 根据类型渲染正文
    let contentHTML = '';
    switch (f.type) {
      case 'conversation':
        contentHTML = this._renderConversationContent(f.content, f.participants);
        break;
      case 'diary':
        contentHTML = this._renderDiaryContent(f.content);
        break;
      case 'plan':
        contentHTML = this._renderPlanContent(f.content);
        break;
      case 'comm':
        contentHTML = this._renderCommContent(f.content);
        break;
      default:
        contentHTML = `<div class="freq-bb-content-text">${this._escapeHTML(f.content)}</div>`;
    }

    c.innerHTML = `
      <div class="freq-app-header" style="border-bottom-color: #8b1a1a;">
        🔒 档案阅读
      </div>
      <div class="freq-app-body">
        <button class="freq-checkin-back-btn freq-bb-back-btn">← 返回档案列表</button>

        <div class="freq-bb-detail-header">
          <div class="freq-bb-detail-title">${typeDef.icon} ${this._escapeHTML(f.title)}</div>
          <div class="freq-bb-detail-meta">
            <span class="freq-bb-class-tag" style="background:${classColor}">${f.classification}</span>
            <span class="freq-bb-type-label">${typeDef.label}</span>
          </div>
          <div class="freq-bb-detail-info">
            <span>📅 ${f.date || '未知日期'} ${f.time || ''}</span>
            <span>👥 ${(f.participants || []).join(', ')}</span>
          </div>
          ${f.serial ? `<div class="freq-bb-detail-serial">关联频率：${this._escapeHTML(f.serial)}</div>` : ''}
        </div>

        <div class="freq-bb-detail-content">
          ${contentHTML}
        </div>

        <div class="freq-bb-detail-footer">
          <button class="freq-checkin-delete-btn freq-bb-delete-btn">🗑️ 删除此档案</button>
        </div>
      </div>`;

    // ── 绑定事件 ──
    c.querySelector('.freq-bb-back-btn').addEventListener('click', () => {
      this._currentView = 'list';
      this._selectedFile = null;
      this._render();
    });

    const deleteBtn = c.querySelector('.freq-bb-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this._confirmDeleteFile(deleteBtn, f.id);
      });
    }
  },

  // ═══════════════════════════════════
  //  正文渲染 — 对话气泡
  // ═══════════════════════════════════
  _renderConversationContent(content, participants) {
    if (!content) return '<div class="freq-bb-content-text">（空内容）</div>';
    const lines = content.split('\n').filter(l => l.trim());
    const p0 = (participants && participants[0]) || '';

    return '<div class="freq-bb-chat-container">' + lines.map(line => {
      // 解析 "角色名：对话内容" 或 "角色名: 对话内容"
      const match = line.match(/^(.+?)[：:](.+)$/);
      if (!match) {
        return `<div class="freq-bb-chat-system">${this._escapeHTML(line)}</div>`;
      }
      const speaker = match[1].trim();
      const text = match[2].trim();
      const isLeft = (speaker === p0);
      const side = isLeft ? 'left' : 'right';

      return `
        <div class="freq-bb-chat-row freq-bb-chat-${side}">
          <div class="freq-bb-chat-name">${this._escapeHTML(speaker)}</div>
          <div class="freq-bb-chat-bubble freq-bb-bubble-${side}">
            ${this._escapeHTML(text)}
          </div>
        </div>`;
    }).join('') + '</div>';
  },

  // ═══════════════════════════════════
  //  正文渲染 — 日记（手写体风格）
  // ═══════════════════════════════════
  _renderDiaryContent(content) {
    if (!content) return '<div class="freq-bb-content-text">（空内容）</div>';
    const paragraphs = content.split('\n').filter(l => l.trim());
    return `
      <div class="freq-bb-diary-container">
        ${paragraphs.map(p => `<p class="freq-bb-diary-para">${this._escapeHTML(p)}</p>`).join('')}
      </div>`;
  },

  // ═══════════════════════════════════
  //  正文渲染 — 策划文件
  // ═══════════════════════════════════
  _renderPlanContent(content) {
    if (!content) return '<div class="freq-bb-content-text">（空内容）</div>';
    const lines = content.split('\n');
    return `
      <div class="freq-bb-plan-container">
        <div class="freq-bb-plan-stamp">CLASSIFIED</div>
        ${lines.map(l => {
          const trimmed = l.trim();
          if (!trimmed) return '<div class="freq-bb-plan-spacer"></div>';
          // 检测标题行（全大写或以【】包裹）
          if(/^[【\[]/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
            return `<div class="freq-bb-plan-heading">${this._escapeHTML(trimmed)}</div>`;
          }
          return `<div class="freq-bb-plan-line">${this._escapeHTML(trimmed)}</div>`;
        }).join('')}
      </div>`;
  },

  // ═══════════════════════════════════
  //  正文渲染 — 内部通讯
  // ═══════════════════════════════════
  _renderCommContent(content) {
    if (!content) return '<div class="freq-bb-content-text">（空内容）</div>';
    const lines = content.split('\n');
    return `
      <div class="freq-bb-comm-container">
        <div class="freq-bb-comm-header-bar">
          <span class="freq-bb-comm-signal">◉ SIGNAL INTERCEPTED</span>
        </div>
        ${lines.map(l => {
          const trimmed = l.trim();
          if (!trimmed) return '';
          // 检测 "发件人/收件人/主题" 等字段
          const fieldMatch = trimmed.match(/^(发件人|收件人|发送者|接收者|主题|日期|FROM|TO|SUBJECT|DATE)[：:]\s*(.+)$/i);
          if (fieldMatch) {
            return `<div class="freq-bb-comm-field"><span class="freq-bb-comm-label">${this._escapeHTML(fieldMatch[1])}:</span> ${this._escapeHTML(fieldMatch[2])}</div>`;
          }
          return `<div class="freq-bb-comm-line">${this._escapeHTML(trimmed)}</div>`;
        }).join('')}
      </div>`;
  },

  // ═══════════════════════════════════
  //  截获新档案（副API）
  // ═══════════════════════════════════
  async _interceptFile(type) {
    if (this._generating) return;

    // 随机选类型
    if (!type) {
      const types = Object.keys(this._types);
      type = types[Math.floor(Math.random() * types.length)];
    }

    const typeDef = this._types[type];
    if (!typeDef) return;

    this._generating = true;
    if (this._container) {
      const interceptBtn = this._container.querySelector('.freq-bb-intercept-btn');
      if (interceptBtn) {
        interceptBtn.disabled = true;
        interceptBtn.textContent = '📡 截获中…';
      }
    }

    try {
      const messages = getChatMessages();
      const plot = getLatestPlot(messages) || '暂无剧情';
      const scene = getLatestScene(messages) || '未知场景';
      const charName = getCurrentCharName();
      const userName = getUserName();
      const serial = getLatestMeowTime(messages) || '';
      const chars = this._getChars();

      // 构建 prompt
      let systemPrompt = getPrompt(typeDef.promptKey);
      systemPrompt = systemPrompt
        .replace(/\{\{char\}\}/g, charName)
        .replace(/\{\{user\}\}/g, userName)
        .replace(/\{\{plot\}\}/g, plot)
        .replace(/\{\{scene\}\}/g, scene);

      let userPrompt = '';
      if (type === 'conversation') {
        // 随机选两个角色
        const shuffled = [...chars].sort(() => Math.random() - 0.5);
        const p1 = shuffled[0] || charName;
        const p2 = shuffled[1] || userName;
        userPrompt = `请编写 ${p1} 和 ${p2} 之间的一段秘密对话。当前剧情背景：${plot}`;
      } else if (type === 'diary') {
        const diaryChar = chars[Math.floor(Math.random() * chars.length)] || charName;
        userPrompt = `请以 ${diaryChar} 的身份写一篇秘密日记。当前剧情背景：${plot}`;
      } else if (type === 'plan') {
        userPrompt = `请编写一份失真电台的内部策划文件。当前节目状况：${plot}`;
      } else {
        const shuffled = [...chars].sort(() => Math.random() - 0.5);
        const sender = shuffled[0] || charName;
        const receiver = shuffled[1] || '控制中心';
        userPrompt = `请编写 ${sender} 发给 ${receiver} 的一份内部通讯。当前情况：${plot}`;
      }

      const raw = await SubAPI.call(systemPrompt, userPrompt, {
        maxTokens: 1000,
        temperature: 0.9
      });

      // 解析 JSON
      let parsed;
try {
  parsed = safeParseAIJson(raw, 'object');
  if (!parsed) throw new Error('返回内容为空');
} catch (e) {
  throw new Error('无法解析AI返回的JSON：' + e.message);
}

      // 构建档案
      const now = new Date();
      const file = {
        id: this._genId(),
        type: type,
        title: parsed.title || '未命名档案',
        encryptedTitle: this._generateEncryptedTitle(parsed.title || '未命名档案'),
        content: parsed.content || '',
        participants: Array.isArray(parsed.participants) ? parsed.participants : [charName],
        classification: ['CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].includes(parsed.classification)
          ? parsed.classification : 'SECRET',
        serial: serial,
        date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        createdAt: now.toISOString()
      };

      this._getData().files.push(file);
      this._save();

      Notify.add('黑匣子', `📡 截获新档案：${typeDef.label}（已加密）`, '🔒');
      EventBus.emit('notification:new', {
        app: 'blackbox',
        icon: '🔒',
        title: '截获新档案',
        body: `一份[${typeDef.label}] 已被截获，等待破解…`
      });

      this._badge++;
      renderAppGrid();} catch (e) {
      console.error('[blackbox] intercept error:', e);
      Notify.error('截获失败：' + (e.message || '未知错误'));
    } finally {
      this._generating = false;
      if (this._container && this._currentView === 'list') {
        this._render();
      }
    }
  },

  // ═══════════════════════════════════
  //  自动截获（EventBus 触发）
  // ═══════════════════════════════════
  async _autoIntercept(allMeowFM) {
    if (this._generating) return;
    try {
      await this._interceptFile(null);
    } catch (e) {
      console.error('[blackbox] auto intercept error:', e);
    }
  },

  // ═══════════════════════════════════
  //  破解档案（解密动画）
  // ═══════════════════════════════════
  _decryptRandomFile() {
    const data = this._getData();
    const lockedFiles = data.files.filter(f => !data.unlockedIds.includes(f.id));
    if (lockedFiles.length === 0) {
      Notify.info('没有需要破解的档案');
      return;
    }

    // 随机选一条
    const target = lockedFiles[Math.floor(Math.random() * lockedFiles.length)];

    // 找到对应的 DOM 元素，执行解密动画
    if (this._container) {
      const item = this._container.querySelector(`[data-file-id="${target.id}"]`);
      if (item) {
        const titleEl = item.querySelector('.freq-bb-file-title');
        if (titleEl) {
          this._playDecryptAnimation(titleEl, target.title, () => {
            // 动画完成后解锁
            data.unlockedIds.push(target.id);
            this._save();
            Notify.add('黑匣子', `🔓 档案已破解：${target.title}`, '🔓');
            //刷新列表
            setTimeout(() => this._render(), 500);
          });
          return;
        }
      }
    }

    // 如果找不到 DOM（不在列表视图），直接解锁
    data.unlockedIds.push(target.id);
    this._save();
    Notify.add('黑匣子', `🔓 档案已破解：${target.title}`, '🔓');
    this._render();
  },

  // ═══════════════════════════════════
  //  解密动画 — 乱码逐字变为真实文字
  // ═══════════════════════════════════
  _playDecryptAnimation(el, realTitle, onComplete) {
    if (this._decrypting) return;
    this._decrypting = true;

    const chars = this._glitchChars;
    const len = realTitle.length;
    const revealed = new Array(len).fill(false);
    let revealedCount = 0;
    const totalSteps = len;
    const stepInterval = Math.max(50, Math.min(150, 2000 / len));

    el.classList.add('freq-bb-decrypting');

    const timer = setInterval(() => {
      // 每步揭示1-2个字符
      const revealCount = Math.random() > 0.5 ? 2 : 1;
      for (let r = 0; r < revealCount && revealedCount < totalSteps; r++) {
        // 找一个未揭示的位置
        let pos;
        do {
          pos = Math.floor(Math.random() * len);
        } while (revealed[pos]);
        revealed[pos] = true;
        revealedCount++;
      }

      // 构建当前显示文本
      let display = '';
      for (let i = 0; i < len; i++) {
        if (revealed[i]) {
          display += realTitle[i];
        } else {
          display += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      el.textContent = display;

      if (revealedCount >= totalSteps) {
        clearInterval(timer);
        el.textContent = realTitle;
        el.classList.remove('freq-bb-decrypting');
        el.classList.add('freq-bb-decrypted');
        this._decrypting = false;
        if (onComplete) setTimeout(onComplete, 300);
      }
    }, stepInterval);
  },

  // ═══════════════════════════════════
  //  删除单条档案（二次确认）
  // ═══════════════════════════════════
  _confirmDeleteFile(btn, fileId) {
    if (btn.dataset.confirming === '1') {
      // 第二次点击 → 执行删除
      const data = this._getData();
      data.files = data.files.filter(f => f.id !== fileId);
      data.unlockedIds = data.unlockedIds.filter(id => id !== fileId);
      this._save();
      Notify.info('档案已删除');
      this._currentView = 'list';
      this._selectedFile = null;
      this._render();
      return;
    }

    // 第一次点击 → 进入确认状态
    btn.dataset.confirming = '1';
    const origText = btn.textContent;
    btn.textContent = '⚠️ 确认删除？再次点击';
    btn.style.borderColor = '#cc0033';
    btn.style.color = '#cc0033';

    setTimeout(() => {
      if (btn.dataset.confirming === '1') {
        btn.dataset.confirming = '0';
        btn.textContent = origText;
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }, 3000);
  },

  // ═══════════════════════════════════
  //  清空所有（二次确认）
  // ═══════════════════════════════════
  _confirmClear(btn) {
    if (btn.dataset.confirming === '1') {
      const data = this._getData();
      data.files = [];
      data.unlockedIds = [];
      this._save();
      Notify.info('所有档案已清空');
      this._render();
      return;
    }

    btn.dataset.confirming = '1';
    const origText = btn.textContent;
    btn.textContent = '⚠️ 确认清空？再次点击';
    btn.style.borderColor = '#cc0033';
    btn.style.color = '#cc0033';

    setTimeout(() => {
      if (btn.dataset.confirming === '1') {
        btn.dataset.confirming = '0';
        btn.textContent = origText;
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }, 3000);
  },

  // ═══════════════════════════════════
  //  HTML 转义
  // ═══════════════════════════════════
  _escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
};
//└─ BLOCK_26─┘




    // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_99初始化入口                                 │
  // └──────────────────────────────────────────────────────┘
  function init() {
    // ── 补充新字段默认值 ──
    const _s = getSettings();
    if (_s.pluginEnabled           === undefined) _s.pluginEnabled           = true;
    if (_s.blackboxAutoIntercept   === undefined) _s.blackboxAutoIntercept   = false;
    if (_s.blackboxInterceptRate   === undefined) _s.blackboxInterceptRate   = 20;
    if (!_s.blackbox)                             _s.blackbox                = { files: [], unlockedIds: [] };
    saveSettings({});
    LOG('Initializing v0.3.1...');

    // 1. 加载样式
    loadSettingsCSS();
    injectMainCSS();

    // 2. 注入设置面板
    const injectSettings = () => {
      const target = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
      if (target && !document.getElementById('freq-terminal-settings')) {
        const wrapper = document.createElement('div');
        wrapper.id = 'freq-terminal-settings';
        wrapper.innerHTML = buildSettingsHTML();
        target.appendChild(wrapper);
        bindSettingsEvents();
        LOG('Settings panel injected');
        return true;
      }
      return false;
    };
    if (!injectSettings()) {
      const ri = setInterval(() => { if (injectSettings()) clearInterval(ri); }, 1000);
      setTimeout(() => clearInterval(ri), 15000);
    }

    // 3. 手机外壳
    const root = document.createElement('div');
    root.id = 'freq-terminal-root';
    root.innerHTML = buildPhoneHTML();
    document.body.appendChild(root);

    document.getElementById('freq-fab')?.addEventListener('click', togglePhone);
    document.getElementById('freq-close-btn')?.addEventListener('click', togglePhone);
    document.getElementById('freq-home-btn')?.addEventListener('click', goHome);
    document.getElementById('freq-notif-btn')?.addEventListener('click', () => openApp('notif-center'));

    updateClock();
    setInterval(updateClock, 30000);

    // 4. 注册App（顺序 = 手机主屏图标顺序）
    registerApp(archiveApp);
    registerApp(studioApp);
    registerApp(momentsApp);
    registerApp(weatherApp);
    registerApp(notifCenterApp);

    registerApp(scannerApp);
    registerApp(cosmicApp);
    registerApp(forumApp);
    registerApp(checkinApp);
    registerApp(calendarApp);
    registerApp(novelApp);
    registerApp(mapApp);                                           // ✅ BLOCK_24
    registerApp(deliveryApp);// ✅ BLOCK_22 替换 placeholder
    registerApp(capsuleApp);        // ✅ BLOCK_21 替换 placeholder
    registerApp(dreamApp);
    registerApp(emotionApp);
    registerApp(blackboxApp);// ✅ BLOCK_26
    registerApp(inboxApp);                                           // ✅ BLOCK_27
    registerApp(placeholderApp('translator', '信号翻译器',     '🔄', 'BGM 文风翻译'));

    // 5. 初始化所有 App
    appRegistry.forEach(app => { if (app.init) app.init(); });

    // 6. 监听 ST 新消息
    try {
      const ctx = getContext();
      if (ctx?.eventSource) {
        const et = ctx.event_types || window.event_types;
        if (et?.MESSAGE_RECEIVED) {
          ctx.eventSource.on(et.MESSAGE_RECEIVED, () => {
            const msgs = getChatMessages();
            if (msgs.length === 0) return;
            const text = msgs[msgs.length - 1].mes ?? '';
            if (/<meow_FM>/i.test(text)) EventBus.emit('meow_fm:updated', extractAllMeowFM(msgs));
            if (/<radio_show>/i.test(text)) EventBus.emit('radio_show:updated', extractRadioShow(msgs));
          });
          LOG('Message listener registered');
        }
      }
    } catch (e) {WARN('Could not register message listener:', e);
    }

    LOG('Ready✓');
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jQuery(init));
  } else {
    jQuery(init);
  }

})();
