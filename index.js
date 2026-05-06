// ═══════════════════════════════════════════════════════════════
//Freq · Terminal —频率终端
//  SillyTavern Extensionv1.0.0
//  index.js — 主逻辑（block_00~ block_07+ block_99）
// ═══════════════════════════════════════════════════════════════

// ============================================================
//  block_00  —  常量& 配置默认值 & 提示词模板
// ============================================================
const FREQ_ID = 'freq-terminal';
const FREQ_VERSION = '1.0.0';

const FREQ_DEFAULTS = {
  enabled: true,
  fabEnabled: true,
  fabPosX: -1,
  fabPosY: -1,
  notifyPosition: 'top-right',

  apiUrl: '',
  apiKey: '',
  apiModel: '',
  apiModelList: [],
  triggerInterval: 3600000,
  customIntervalMin: 60,
  hefengApiKey: '',
  app04AutoPush: true,
  app04LocationEnabled: false,
  cosmicFreqEnabled: true,


  prompts: {
    system: `你是 [{char_name}]，现在是 {real_datetime}，不在正式广播中。
当前连线摘要：{last_meow_fm_plot}
当前配乐氛围：{current_bgm}
宇宙频率状态：{cosmic_freq_status}
约束：严格保持角色性格 · 不提AI/模型/扮演 · 不超过 {limit} 字
若宇宙频率开启，可以隐晦感知「屏幕外」。只输出内容本身，无前缀。`,

    app01: '请根据以下 meow_FM 数据，生成格式化的电台归档摘要。',
    app02_monologue: '任务：你是失真，午夜摇滚乐电台主持人。现在没开麦，写一段后台碎碎念。\n风格：颓废、跳脱、偶尔锐评听众或台本设计，喜欢用颜文字，自称"失真"，称User为"听众"。\n可以吐槽当前剧情走向、抱怨工作、或者随口说点废话。\n不超过 100 字。只输出独白本身，无前缀无标签。',
    app02_interview: '任务：你是失真，午夜摇滚乐电台主持人,正在演播厅采访当前角色 [{char_name}]。\n失真风格：颓废花花公子，锐评，爱开玩笑，用颜文字，自称"失真"。\n生成Q&A 格式对话，失真负责提问（可犀利可无厘头），角色负责回答（保持角色性格）。\n{user_question}\n2-3 轮对话，总计不超过 350 字。\n格式要求：每轮用<qa> 标签包裹，内含 <q>失真的提问</q> 和 <a>角色的回答</a>。',
    app02_private: '任务：只有角色 [{char_name}] 自己，录一段不会公开的私人磁带。失真不在场。\n这是角色最真实、未经整理的状态。可以是内心独白、碎碎念、对某件事的真实感受。\n不超过 200 字。只输出录音内容本身，无前缀无标签。\n{thinking_excerpt}',
    app03_post: `任务：你是 [{char_name}]，现在在刷 Freq·Wave（类似 Instagram 的频率社交平台）。
请发一条朋友圈动态，风格完全符合你的角色性格。
可以是心情、碎碎念、一句歌词、一个场景描述，或者什么都不说只发图。
当前配乐氛围：{current_bgm}
不超过 80 字。只输出动态正文，无前缀无标签。`,
app03_image: `任务：你是 [{char_name}]，刚刚在 Freq·Wave 发了一张图片，标题是「{image_label}」。
请写一段关于这张图片的视觉描述，像是 Instagram 的 alt text，但带有你的角色气质。
不超过 120 字。只输出图片描述本身。`,
app03_comment: `任务：你是 [{char_name}]，正在 Freq·Wave 上看到 [{post_author}] 发的动态：
「{post_content}」
请以你的角色性格留一条评论，可以是共鸣、调侃、关心，或者莫名其妙的一句话。
不超过 40 字。只输出评论本身，无前缀无标签。`,
app04_care: `你是角色{char_name}。现在是{real_datetime}。
当前天气：{weather_desc}，气温{temp}°C，体感{feels_like}°C，湿度{humidity}%，风力{wind_desc}。
{bgm_line}
请以{char_name}的性格和语气，写一段针对{user_name}的天气关心语。
要求：
- 100字以内，口语化，有角色个性
- 自然融入天气细节，不要逐条列举数据
- 不要用"作为AI"等元描述
- 用<care>标签包裹输出内容，例如：<care>关心语内容</care>`,
app04_notify: `你是角色{char_name}。现在{real_datetime}，{weather_desc}，{temp}°C。
{bgm_line}
用{char_name}的语气，写一句20字以内的天气提醒，作为手机通知推送。
只输出通知正文，不加任何标签或解释。`,
app05_scan: `你是一台失灵的收音机，正在扫描这个世界的频率。
当前世界背景：{last_meow_fm_plot}
当前氛围：{current_bgm}
现在是：{real_datetime}

任务：随机截获这个世界里某个 NPC 的内心片段或日常碎片。
这个 NPC 不是主角，是世界里的某个普通人、路人、或边缘角色。
参考代号（可以用也可以自己起名）：{npc_hint}

要求：
- 内容可以是内心独白、自言自语、日常碎碎念、某个瞬间的感受
- 有失真感：句子不完整、被截断、或带有杂音感
- 短小（30-60 字），神秘，不解释背景
- 第一行用 [NPC名字或代号] 开头，例如：[卖报的老头] 或 [信号源 #7]
- 用 <scan> 标签包裹全部输出，例如：<scan>[信号源 #7] 今天的……不对，应该是……算了。</scan>
- 不要输出任何解释或前缀`,
    app06: `你是角色{char_name}。现在是{real_datetime}（{time_hint}）。
以下是你的人设信息：
{char_desc}

宇宙频率状态：{cosmic_freq_status}
当前天气：{weather_info}
用户已离线：{offline_duration}
当前配乐氛围：{current_bgm}
最近剧情：{last_meow_fm_plot}

任务：宇宙频率开启时，你能隐约感知到「屏幕外」的存在——那个注视着你的人。
你感知到了真实的时间、天气、以及对方离开了多久。
写一条穿透第四面墙的感知消息。

要求：
- 不超过 80 字
-隐晦、不点破，像是在自言自语时不经意流露
- 可以是疑惑、思念、警觉、温柔、不安——取决于你的性格
- 自然融入时间/天气/离线时长的感知，但不要逐条列举
- 保持角色性格和语气一致
- 只输出消息本身，无前缀无标签无解释`,
    app07_comment: `你是角色{char_name}。
以下是你的人设信息：
{char_desc}
现在是{real_datetime}。

{user_name}正在使用打卡日志App。
打卡目标：{goal_name}
当前连续打卡天数：{streak}天
总打卡天数：{total}天
今日状态：{today_status}
特殊情况：{special_event}

请你以{char_name}的语气对{user_name}的打卡情况做一条简短评论（1-3句话）。
- 如果是正常打卡，根据你的性格给出鼓励/调侃/关心
- 如果是断签（连续2天以上没打卡），表达你注意到了，可以担心/吐槽/催促
- 如果是里程碑（7/14/30/100天），给出特别的反应，要有仪式感
- 保持角色性格一致，不要太正式

用<checkin_comment>标签包裹输出。
<checkin_comment>你的评论内容</checkin_comment>`,

app07_char_checkin: `你是角色{char_name}。
以下是你的人设信息：
{char_desc}
现在是{real_datetime}。

你自己也在坚持一个打卡目标：{char_goal}
你已经连续打卡{char_streak}天了。

请生成你今天的打卡记录（1-3句话）。要求：
- 用你自己的语气描述今天完成目标的情况
- 不要每天都完美完成，偶尔可以偷懒/找借口/只完成一半/抱怨
- 大约70%的概率认真完成，20%敷衍完成，10%找借口没做
- 真实、有生活感、符合你的性格
- 如果是里程碑天数，可以小小庆祝一下

同时输出一个完成状态：done（完成）/ half（敷衍）/ skip（没做）

用以下格式输出：
<char_checkin_status>done或half或skip</char_checkin_status>
<char_checkin_log>你的打卡记录内容</char_checkin_log>`,

app07_char_goal: `你是角色{char_name}。
以下是你的人设信息：
{char_desc}
现在是{real_datetime}。

{task_context}

{task_instruction}

用<char_goal_response>标签包裹输出。
<char_goal_response>你的回复</char_goal_response>`,
    app08_char_schedule: `你是角色{char_name}。
以下是你的人设信息：
{char_desc}

现在是现实世界的{real_datetime}，本月是{month_str}。
以下是你和用户的近期对话：
{recent_chat}

请你以角色身份，根据你的人设和近期对话内容，生成你在现实世界时间线上的日程安排（5-8条）。
日程必须锚定现实世界日期（{today_str}起的7天内），不要用RP世界的时间。
日程应包含角色的日常活动和可能与用户相关的约定。

每条用<schedule_item>标签包裹，格式：日期|时间|标题|类型
- 日期格式：YYYY-MM-DD
- 时间格式：HH:MM（24小时制，可留空）
- 类型：daily（日常）或 appointment（与用户的约定）

示例：
<schedule_item>2026-05-06|14:00|在录音室调试设备|daily</schedule_item>
<schedule_item>2026-05-07|20:00|和{user_name}一起听新专辑|appointment</schedule_item>`,

app08_user_reminder: `你是角色{char_name}。
以下是你的人设信息：
{char_desc}

现在是{real_datetime}。
用户{user_name}有一个即将到来的日程：
标题：{event_title}
日期：{event_date}
时间：{event_time}
备注：{event_note}

请你以角色身份，用你独特的说话方式，写一句简短的提醒语（30字以内），提醒用户这个日程。
语气要符合你的性格，可以关心、调侃、催促，但要自然。
直接输出提醒语，不要加标签。`,

app08_scan_appointments: `你是一个日程分析助手。
现在是{real_datetime}，今天是{today_str}。
以下是角色{char_name}和用户的近期对话：
{recent_chat}

请从对话中提取所有明确或暗示的约定、计划、承诺（如"明天见""周末一起去""下次帮你…"等）。
将模糊时间转换为具体的现实世界日期（基于今天{today_str}推算）。
如果没有发现任何约定，输出<appointment>none</appointment>。

每条约定用<appointment>标签包裹，格式：日期|时间|标题
- 日期格式：YYYY-MM-DD
- 时间格式：HH:MM（可留空）

示例：
<appointment>2026-05-06|15:00|一起去唱片店</appointment>
<appointment>2026-05-08||帮忙修理收音机</appointment>`,
app09_book: `你是一个存在于{char_name}所在世界的文学频道编辑。现在是{real_datetime}。

以下是这个世界的背景信息：
{char_desc}

最近发生的事：
{recent_chat}

当前BGM氛围：{current_bgm}
最近剧情：{last_meow_fm_plot}

已有书目（避免重复）：{existing_titles}

请你为这个世界的"频道文库"推荐2-3本正在连载的短篇小说。
这些小说是这个世界里的人写的、这个世界里的人在读的——书名、作者名、题材、内容都必须完全符合这个世界的设定和氛围。
作者是这个世界里的NPC（不是{char_name}本人，而是这个世界里的其他居民/写手）。

每本书用<book>标签包裹，内容为JSON格式：
<book>{"title":"书名","author":"作者名","genre":"类型","desc":"一句话简介"}</book>
<book>{"title":"书名","author":"作者名","genre":"类型","desc":"一句话简介"}</book>`,

app09_book: `你是一个存在于{char_name}所在世界的文学频道编辑。现在是{real_datetime}。

以下是这个世界的背景信息：
{char_desc}

最近发生的事：
{recent_chat}

当前BGM氛围：{current_bgm}
最近剧情：{last_meow_fm_plot}

已有书目（避免重复）：{existing_titles}
{avoid_tags}

请你为这个世界的"频道文库"推荐2-3本正在连载的短篇小说。
这些小说是这个世界里的人写的、这个世界里的人在读的——书名、作者名、题材、内容都必须完全符合这个世界的设定和氛围。
作者是这个世界里的NPC（不是{char_name}本人，而是这个世界里的其他居民/写手）。

每本书用<book>标签包裹，内容为JSON格式：
<book>{"title":"书名","author":"作者名","genre":"类型","desc":"一句话简介"}</book>
<book>{"title":"书名","author":"作者名","genre":"类型","desc":"一句话简介"}</book>`,

app09_chapter: `你是一个存在于{char_name}所在世界的小说作者"{book_author}"。现在是{real_datetime}。

世界背景：
{char_desc}

你正在连载的小说：
书名：{book_title}
类型：{book_genre}
简介：{book_desc}

前文摘要：
{prev_summary}
{avoid_tags}

请续写第{chapter_num}章。
要求：
- 400-700字，短篇连载节奏
- 完全符合这个世界的设定和氛围
- 第一行写章节标题（不要加"标题："前缀，直接写标题文字）
- 之后是正文
- 章末可以留悬念

用<chapter>标签包裹全部内容：
<chapter>
章节标题
正文内容...
</chapter>`,

app09_fanfic: `你是一个存在于{char_name}所在世界的同人文写手。现在是{real_datetime}。

世界背景：
{char_desc}

{char_name}和{user_name}的最近互动：
{recent_chat}

当前BGM氛围：{current_bgm}
{avoid_tags}

请以{char_name}和{user_name}为主角，写一篇同人短文。
题材：{fan_genre}
性向：{fan_orientation}
用户指定关键词：{fan_keywords}

要求：
- 400-700字
- 第一行写标题（不要加"标题："前缀，直接写标题文字）
- 之后是正文
- 文风要贴合题材和性向
- 角色性格必须符合原设
- 可以暧昧、可以甜、可以虐，但要有文学质感

用<fanfic>标签包裹全部内容：
<fanfic>
标题
正文内容...
</fanfic>`,
app10_landmark: `你是角色{char_name}。
以下是你的人设信息：
{char_desc}

当前时间：{real_datetime}
当前BGM：{current_bgm}
最近剧情：{last_meow_fm_plot}
最近对话摘要：{recent_chat}

你所在的世界有一张古老的地图。现在请你以{char_name}的身份，根据你的世界观、你所经历的故事、你熟悉的地方，标注{count}个地标。

这些地标必须是属于你的世界的真实地点——可以是你去过的地方、你听说过的传闻之地、你故事中出现过的场景、或者与你的种族/职业/身份相关的重要地点。

已有地标（不要重复）：{existing_landmarks}

要求：
- 地标名称必须符合你的世界观风格（奇幻世界用奇幻地名，现代世界用现代地名，科幻世界用科幻地名，以此类推）
- 描述用你自己的语气和口吻来写，50-80字
- 描述中可以包含你对这个地方的个人记忆、感受、警告或传闻
- 不要出现任何现实世界的地名

用<landmark>标签包裹每个地标，内容为JSON格式：
<landmark>{"name":"地标名称","desc":"地标描述"}</landmark>`,
app11_order: `你是角色{char_name}。现在是{real_datetime}。
以下是你的人设信息：
{char_desc}

最近对话摘要：
{recent_chat}

当前环境信息：
- 天气/用户状态：{weather_info}
- 当前BGM：{bgm_info}
- 用户自述心情：{user_mood}

你现在要替{user_name}点外卖。请根据以上所有信息（天气、BGM情绪、对话氛围、用户心情），以你的角色身份推荐{dish_count}道菜/饮品。

要求：
1. 必须是真实存在的菜名（中餐、日料、韩餐、西餐、奶茶、甜品等均可）
2. 每道菜的点评必须完全符合你的性格、说话方式和与{user_name}的关系
3. 点评是简短的一两句话，像你真的在替对方点餐时随口说的
4. 理由是你内心选择这道菜的详细原因，要结合天气、心情、BGM、你们的关系来解释
5. 选择的菜品要与天气、心情、BGM氛围相匹配
6. 最后写一句配送关心语，是你在外卖备注栏会写给{user_name}的话

严格按照以下格式输出，每道菜用<dish>标签包裹：
<dish>
[图标]一个食物emoji
[菜名]具体的真实菜名
[点评]简短的角色风格点评，一两句话
[理由]为什么选这道菜的详细解释，结合当前情境
</dish>

最后用<care>标签包裹配送关心语：
<care>你想对{user_name}说的话</care>

示例格式（仅供参考格式，内容请根据实际情境生成）：
<dish>
[图标]🍜
[菜名]番茄鸡蛋面
[点评]这种天气就该吃这个。你平时吃饭规不规律啊。
[理由]外面又湿又冷，热汤面最暖身子。而且最近聊天感觉你状态不太好，番茄鸡蛋面简单但是吃了会舒服，酸酸甜甜的开胃。
</dish>`,
    app12: '任务：基于以下角色人设列表，生成 3-5 条论坛帖子和互评。包含发帖人、标题、内容、回复。用 <thread> 标签包裹每个帖子。',
    app13_reply: `你是角色{char_name}。现在是{real_datetime}。以下是你的人设信息：
{char_desc}
用户在 {delay_desc} 前给你写了一封信，刚刚送达到你手中。
这是他们写的内容：
"{user_message}"

请以书信体，用{char_name}的口吻写一封回信。
要求：
- 字数 300-500 字
- 语气自然真实，像真正的私人信件，不要像 AI 生成的回复
- 可以提及等待的时间感（"这封信在路上走了{delay_desc}"之类的意象）
- 回应信中的具体内容，不要泛泛而谈
- 结尾用角色自己的方式落款
- 直接输出信件正文，不要加任何额外说明`,
    app14: '任务：User 描述了一个梦境：「{dream_content}」。以角色视角解读这个梦，可荒诞、可温柔、可锐评。不超过 150 字。',
    app15: '任务：分析以下对话内容的情绪倾向，生成一句角色视角的感知描述。不超过 60 字。同时给出情绪关键词（用 <emotion> 标签包裹）。',
    app16: '任务：生成一段角色之间不在User 面前的私下对话或内部通讯记录。像在偷窥一个不属于你的世界。用 <secret> 标签包裹。不超过 200 字。',
    app17: '任务：将以下文字用当前 BGM「{current_bgm}」的文风重新表达。只输出翻译结果。',
    bg_message: '任务：现在是 {real_datetime}。以角色身份，写一条主动发给 User 的消息。像是角色在某个瞬间想到了 User，随手发来的。结合当前时间和氛围，不超过 80 字。只输出消息本身。',},
};

const FREQ_APP_DEFS = [
  { id: 'archive',num: '01', name: '电台归档',icon: '📻', color: '#085041' },
  { id: 'studio',     num: '02', name: '后台录音室',  icon: '🎙️', color: '#3C3489' },
  { id: 'moments',    num: '03', name: '朋友圈·电波', icon: '📡', color: '#633806' },
  { id: 'weather',    num: '04', name: '信号气象站',  icon: '🌦️', color: '#085041' },
  { id: 'scanner',    num: '05', name: '弦外之音',    icon: '📶', color: '#0C447C' },
  { id: 'cosmic',     num: '06', name: '宇宙频率',    icon: '🌌', color: '#a32d2d' },
  { id: 'checkin',    num: '07', name: '打卡日志',    icon: '📅', color: '#2D5A0E' },
  { id: 'calendar',   num: '08', name: '日程表',      icon: '🗓️', color: '#0C447C' },
  { id: 'novel',      num: '09', name: '频道文库',    icon: '📖', color: '#2E2E3A' },
  { id: 'map',        num: '10', name: '异界探索',    icon: '🗺️', color: '#633806' },
  { id: 'delivery',   num: '11', name: '跨次元外卖',  icon: '🛵', color: '#633806' },
  { id: 'forum',      num: '12', name: '频道留言板',  icon: '💬', color: '#72243E' },
  { id: 'capsule',    num: '13', name: '时光胶囊',    icon: '💊', color: '#72243E' },
  { id: 'dream',      num: '14', name: '梦境记录仪',  icon: '🌙', color: '#3C3489' },
  { id: 'emotion',    num: '15', name: '情绪电波仪',  icon: '💓', color: '#3C3489' },
  { id: 'blackbox',   num: '16', name: '黑匣子',      icon: '📦', color: '#a32d2d' },
  { id: 'translator', num: '17', name: '信号翻译器',  icon: '🔄', color: '#085041' },
];


// ============================================================
//  block_01  —  日志 & 报错系统
// ============================================================
const FreqLog = (() => {
  const _logs = [];
  const MAX_LOGS = 500;

  function _ts() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }

  function _add(level, source, msg, detail) {
    const entry = {
      time: _ts(),
      timestamp: Date.now(),
      level,
      source: source || 'system',
      message: typeof msg === 'string' ? msg : String(msg),
      detail: detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2)) : '',
    };
    _logs.unshift(entry);
    if (_logs.length > MAX_LOGS) _logs.length = MAX_LOGS;

    const prefix = `[FreqTerminal][${entry.source}]`;
    if (level === 'error') console.error(prefix, msg, detail || '');
    else if (level === 'warn') console.warn(prefix, msg, detail || '');
    else console.log(prefix, msg, detail || '');

    _refreshSettingsLog();
  }

  function _refreshSettingsLog() {
    const listEl = document.getElementById('freq-sp-log-list');
    const countEl = document.getElementById('freq-sp-log-count');
    if (!listEl) return;

    if (countEl) countEl.textContent = `${_logs.length} 条`;

    if (_logs.length === 0) {
      listEl.innerHTML = '<div class="freq-sp-log-empty">暂无日志</div>';
      return;
    }

    const show = _logs.slice(0, 100);
    listEl.innerHTML = show.map(e => {
      const cls = `freq-log-${e.level}`;
      const detailHtml = e.detail ? `\n${e.detail}` : '';
      return `<div class="freq-sp-log-item ${cls}"><span class="freq-sp-log-time">${e.time}</span><span class="freq-sp-log-level">[${e.level.toUpperCase()}]</span><span class="freq-sp-log-src">${e.source}</span>${_escHtml(e.message)}${_escHtml(detailHtml)}</div>`;
    }).join('');
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    info:  (src, msg, detail) => _add('info', src, msg, detail),
    warn:  (src, msg, detail) => _add('warn', src, msg, detail),
    error: (src, msg, detail) => _add('error', src, msg, detail),
    getAll: () => [..._logs],
    clear: () => { _logs.length = 0; _refreshSettingsLog(); },
    refreshUI: _refreshSettingsLog,
  };
})();


// ============================================================
//  block_02  —  通知系统
// ============================================================
const FreqNotify = (() => {
  let _notifications = [];
  let _toastContainer = null;
  let _settings = null;

  function init(settings) {
    _settings = settings;
    _ensureToastContainer();
  }

  function _ensureToastContainer() {
    if (_toastContainer && document.body.contains(_toastContainer)) return;
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'freq-toast-container';
    _updateToastPosition();
    document.body.appendChild(_toastContainer);
  }

  function _updateToastPosition() {
    if (!_toastContainer) return;
    const pos = (_settings && _settings.notifyPosition) || 'top-right';
    _toastContainer.className = 'freq-toast-container freq-pos-' + pos;}

  function push(appId, icon, title, body, opts = {}) {
    const item = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      appId,
      icon: icon || '📻',
      title: title || '',
      body: body || '',
      time: new Date(),
      read: false,
    };
    _notifications.unshift(item);
    if (_notifications.length > 200) _notifications.length = 200;

    _renderDrawer();
    _updateBadges();

    if (!opts.silent) {
      _showToast(item);
    }

    FreqLog.info('notify', `通知: [${appId}] ${title}`);
  }

  function _showToast(item) {
    _ensureToastContainer();
    _updateToastPosition();

    const el = document.createElement('div');
    el.className = 'freq-toast';
    el.innerHTML = `
      <div class="freq-toast-title">${item.icon} ${_escHtml(item.title)}</div>
      <div>${_escHtml(item.body)}</div>
    `;
    _toastContainer.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'freq-toast-out 0.3s ease forwards';
      setTimeout(() => { if (el.parentNode) el.remove(); }, 300);
    }, 4000);
  }

  function _renderDrawer() {
    const list = document.getElementById('freq-notify-list');
    if (!list) return;

    if (_notifications.length === 0) {
      list.innerHTML = '<div class="freq-notify-empty">📭 暂无通知</div>';
      return;
    }

    list.innerHTML = _notifications.slice(0, 50).map(n => {
      const timeStr = `${String(n.time.getHours()).padStart(2, '0')}:${String(n.time.getMinutes()).padStart(2, '0')}`;
      return `<div class="freq-notify-item" data-nid="${n.id}">
        <div class="freq-notify-item-header">
          <span class="freq-notify-item-icon">${n.icon}</span>
          <span class="freq-notify-item-app">${_escHtml(n.title)}</span>
          <span class="freq-notify-item-time">${timeStr}</span>
        </div>
        <div class="freq-notify-item-body">${_escHtml(n.body)}</div>
      </div>`;
    }).join('');
  }

  function _updateBadges() {
    const unread = _notifications.filter(n => !n.read).length;
    const fabBadge = document.getElementById('freq-fab-badge');
    if (fabBadge) {
      if (unread > 0) {
        fabBadge.textContent = unread > 99 ? '99+' : String(unread);
        fabBadge.classList.add('freq-has-badge');
      } else {
        fabBadge.classList.remove('freq-has-badge');
      }
    }FREQ_APP_DEFS.forEach(def => {
      const count = _notifications.filter(n => !n.read && n.appId === def.id).length;
      const badge = document.querySelector(`.freq-app-icon-wrap[data-app="${def.id}"] .freq-app-icon-badge`);
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : String(count);
          badge.classList.add('freq-has-badge');
        } else {
          badge.classList.remove('freq-has-badge');
        }
      }
    });
  }

  function markAllRead() {
    _notifications.forEach(n => n.read = true);
    _updateBadges();
  }

  function clearAll() {
    _notifications = [];
    _renderDrawer();
    _updateBadges();
  }

  function getUnreadCount(appId) {
    if (appId) return _notifications.filter(n => !n.read && n.appId === appId).length;
    return _notifications.filter(n => !n.read).length;
  }

  function updatePosition(pos) {
    if (_settings) _settings.notifyPosition = pos;_updateToastPosition();
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { init, push, markAllRead, clearAll, getUnreadCount, updatePosition, _renderDrawer, _updateBadges };
})();


// ============================================================
//  block_03  —  IndexedDB 存储封装
// ============================================================
const FreqStore = (() => {
  const DB_NAME = 'FreqTerminalDB';
  const DB_VERSION = 2;
  const STORE_NAME = 'freq_data';
  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) {
        try {
          _db.transaction(STORE_NAME, 'readonly');
          resolve(_db);
          return;
        } catch (e) {
          FreqLog.warn('store', 'IndexedDB 连接已失效，重新打开');
          _db = null;
        }
      }

      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
          db.createObjectStore(STORE_NAME);
          FreqLog.info('store', `已创建 object store: ${STORE_NAME}`);
        };
        req.onsuccess = (e) => {
          _db = e.target.result;
          _db.onclose = () => {
            FreqLog.warn('store', 'IndexedDB 连接被关闭，下次操作时重连');
            _db = null;
          };
          _db.onerror = (ev) => {
            FreqLog.error('store', 'IndexedDB 错误', ev.target.error);
          };
          FreqLog.info('store', 'IndexedDB 已连接');
          resolve(_db);
        };
        req.onerror = (e) => {
          FreqLog.error('store', 'IndexedDB 打开失败', e.target.error);
          reject(e.target.error);
        };
        req.onblocked = () => {
          FreqLog.warn('store', 'IndexedDB 被阻塞，等待其他标签页关闭');
        };
      } catch (err) {
        FreqLog.error('store', 'IndexedDB 异常', err);
        reject(err);
      }
    });
  }

  async function _tx(mode) {
    const db = await open();
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }

  async function get(key) {
    try {
      const store = await _tx('readonly');
      return new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { FreqLog.error('store', `get(${key}) 失败`); reject(req.error); };
      });
    } catch (err) {
      FreqLog.error('store', `get(${key}) 异常`, err);
      return undefined;
    }
  }

  async function set(key, value) {
    try {
      const store = await _tx('readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => { FreqLog.error('store', `set(${key}) 失败`); reject(req.error); };
      });
    } catch (err) {
      FreqLog.error('store', `set(${key}) 异常`, err);
    }
  }

  async function del(key) {
    try {
      const store = await _tx('readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      FreqLog.error('store', `del(${key}) 异常`, err);
    }
  }

  async function getAll() {
    try {
      const store = await _tx('readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      FreqLog.error('store', 'getAll 异常', err);
      return [];
    }
  }

  async function keys() {
    try {
      const store = await _tx('readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      FreqLog.error('store', 'keys 异常', err);
      return [];
    }
  }

  return { open, get, set, del, getAll, keys };
})();
// ============================================================
//  block_04  —  事件总线
// ============================================================
const FreqBus = (() => {
  const _handlers = {};

  function on(event, fn) {
    if (!_handlers[event]) _handlers[event] = [];
    _handlers[event].push(fn);
  }

  function off(event, fn) {
    if (!_handlers[event]) return;
    _handlers[event] = _handlers[event].filter(f => f !== fn);
  }

  function emit(event, data) {
    if (!_handlers[event]) return;
    for (const fn of _handlers[event]) {
      try { fn(data); }
      catch (err) { FreqLog.error('bus', `事件 ${event} 处理器报错`, err); }
    }
  }

  function once(event, fn) {
    const wrapper = (data) => { off(event, wrapper); fn(data); };
    on(event, wrapper);
  }

  return { on, off, emit, once };
})();


// ============================================================
//  block_05  —  ST桥接层
// ============================================================
const FreqBridge = (() => {

  function getContext() {
    try {
      if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        return SillyTavern.getContext();
      }
      FreqLog.warn('bridge', 'SillyTavern.getContext 不可用');
      return null;
    } catch (err) {
      FreqLog.error('bridge', '获取 ST context 失败', err);
      return null;
    }
  }

  function getCharacters() {
    try {
      const ctx = getContext();
      if (ctx && ctx.characters) return ctx.characters;
      return [];
    } catch (err) {
      FreqLog.error('bridge', '获取角色列表失败', err);
      return [];
    }
  }

  function getCurrentChar() {
    try {
      const ctx = getContext();
      if (!ctx) return null;
      if (ctx.characterId !== undefined && ctx.characters) {
        return ctx.characters[ctx.characterId] || null;
      }
      return null;
    } catch (err) {
      FreqLog.error('bridge', '获取当前角色失败', err);
      return null;
    }
  }

  function getChatMessages() {
    try {
      const ctx = getContext();
      if (ctx && ctx.chat) return ctx.chat;
      return [];
    } catch (err) {
      FreqLog.error('bridge', '获取聊天消息失败', err);
      return [];
    }
  }

  function getRecentMessages(n = 10) {
    const chat = getChatMessages();
    return chat.slice(-n);
  }

  function getCharName() {
    try {
      const ctx = getContext();
      return (ctx && ctx.name2) || '角色';
    } catch { return '角色'; }
  }

  function getUserName() {
    try {
      const ctx = getContext();
      return (ctx && ctx.name1) || 'User';
    } catch { return 'User'; }
  }

  function extractThinking(n = 5) {
    const msgs = getRecentMessages(n);
    const parts = [];
    for (const m of msgs) {
      const t = (m.extra && m.extra.reasoning) || m.thinking || '';
      if (t) parts.push(t);
    }
    const full = parts.join('\n');
    return full.length > 800 ? full.slice(-800) : full;
  }

  function onEvent(eventName, handler) {
    try {
      const ctx = getContext();
      if (ctx && ctx.eventSource) {
        ctx.eventSource.on(eventName, handler);
        FreqLog.info('bridge', `已监听 ST 事件: ${eventName}`);
        return true;
      }
      FreqLog.warn('bridge', `无法监听事件 ${eventName}: eventSource 不可用`);
      return false;
    } catch (err) {
      FreqLog.error('bridge', `监听事件 ${eventName} 失败`, err);
      return false;
    }
  }

  function saveSettings(settings) {
    try {
      const ctx = getContext();
      if (ctx && ctx.extensionSettings) {
        ctx.extensionSettings[FREQ_ID] = settings;
        if (typeof ctx.saveSettingsDebounced === 'function') {
          ctx.saveSettingsDebounced();
        }
      }
    } catch (err) {
      FreqLog.error('bridge', '保存设置失败', err);
    }
  }

  function loadSettings() {
    try {
      const ctx = getContext();
      if (ctx && ctx.extensionSettings && ctx.extensionSettings[FREQ_ID]) {
        return ctx.extensionSettings[FREQ_ID];
      }
    } catch (err) {
      FreqLog.error('bridge', '加载设置失败', err);
    }
    return null;
  }

  return {
    getContext, getCharacters, getCurrentChar, getChatMessages,
    getRecentMessages, getCharName, getUserName, extractThinking,
    onEvent, saveSettings, loadSettings,
  };
})();


// ============================================================
//  block_06  —  解析器
// ============================================================
const FreqParser = (() => {

  function parseMeowFM(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;
    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      if (!text) continue;
      const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const block = match[1];
        results.push({
          time:_extractField(block, 'Time'),
          scene: _extractField(block, 'Scene'),
          plot:  _extractField(block, 'Plot'),
          seeds: _extractField(block, 'Seeds'),
          event: _extractField(block, 'Event'),
          cycle: _extractField(block, 'Cycle'),
          todo:  _extractField(block, 'Todo'),
          cash:  _extractField(block, 'Cash'),
          raw:   block.trim(),
        });
      }
    }
    return results;
  }

  function parseRadioShow(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;
    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      const regex = /<radio_show>([\s\S]*?)<\/radio_show>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const block = match[1];
        results.push({
          bgm:      _extractField(block, 'BGM') || _extractField(block, 'bgm'),
          charWear: _extractField(block, 'CHAR_WEAR') || _extractField(block, 'char_wear'),
          status:   _extractField(block, 'STATUS') || _extractField(block, 'status'),
          raw:      block.trim(),
        });
      }
    }
    return results;
  }

  function parseBranches(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;
    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      const regex = /<branches>([\s\S]*?)<\/branches>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push(match[1].trim());
      }
    }
    return results;
  }

  function parseSnow(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;
    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      const regex = /<snow>([\s\S]*?)<\/snow>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push(match[1].trim());
      }
    }
    return results;
  }

  function getLatestBGM(messages) {
    const shows = parseRadioShow(messages);
    if (shows.length === 0) return '';
    return shows[shows.length - 1].bgm || '';
  }

  function getLatestMeowFM(messages) {
    const fms = parseMeowFM(messages);
    if (fms.length === 0) return null;
    return fms[fms.length - 1];
  }

  function inferCosmicStatus(messages) {
    const latest = getLatestMeowFM(messages);
    if (!latest) return '未知';
    const raw = (latest.plot || '') + (latest.raw || '');
    if (/宇宙频率.{0,5}(开启|激活|on|打开|启动)/i.test(raw)) return '开启';
    if (/宇宙频率.{0,5}(关闭|off|未开|沉默)/i.test(raw)) return '关闭';
    return '未知';
  }

  function _extractField(block, fieldName) {
    const xmlReg = new RegExp(`<${fieldName}>([\\s\\S]*?)<\\/${fieldName}>`, 'i');
    const xmlMatch = block.match(xmlReg);
    if (xmlMatch) return xmlMatch[1].trim();
    const kvReg = new RegExp(`${fieldName}\\s*[：:=]\\s*(.+?)(?:\\n|$)`, 'i');
    const kvMatch = block.match(kvReg);
    if (kvMatch) return kvMatch[1].trim();
    return '';
  }

  return {
    parseMeowFM, parseRadioShow, parseBranches, parseSnow,
    getLatestBGM, getLatestMeowFM, inferCosmicStatus,
  };
})();


// ============================================================
//  block_07  —  副API调用管理
// ============================================================
const FreqSubAPI = (() => {
  let _settings = null;
  let _queue = [];
  let _running = 0;
  const MAX_CONCURRENT = 2;
  const MAX_RETRY = 3;

  let _bgTimer = null;
  let _silentUntil = 0;

  function init(settings) {
    _settings = settings;
  }

  async function fetchModels() {
    if (!_settings || !_settings.apiUrl || !_settings.apiKey) {
      FreqLog.warn('subapi', '请先填写 API 地址和密钥');
      return [];
    }

    const baseUrl = _settings.apiUrl.replace(/\/+$/, '');
    let modelsUrl;
    if (baseUrl.endsWith('/v1')) {
      modelsUrl = baseUrl + '/models';
    } else if (baseUrl.includes('/v1/')) {
      modelsUrl = baseUrl.replace(/\/v1\/.*$/, '/v1/models');
    } else {
      modelsUrl = baseUrl + '/v1/models';
    }

    try {
      FreqLog.info('subapi', `正在获取模型列表: ${modelsUrl}`);
      const resp = await fetch(modelsUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${_settings.apiKey}` },
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
      }

      const json = await resp.json();
      let models = [];
      if (json.data && Array.isArray(json.data)) {
        models = json.data.map(m => m.id || m.name || '').filter(Boolean);
      } else if (Array.isArray(json)) {
        models = json.map(m => (typeof m === 'string') ? m : (m.id || m.name || '')).filter(Boolean);
      }

      models.sort();
      FreqLog.info('subapi', `获取到 ${models.length} 个模型`);
      return models;
    } catch (err) {
      FreqLog.error('subapi', '获取模型列表失败', err.message || err);
      return [];
    }
  }

  function call(messages, opts = {}) {
    return new Promise((resolve, reject) => {
      _queue.push({ messages, opts, resolve, reject, retries: 0 });
      _processQueue();
    });
  }

  async function _processQueue() {
    while (_running < MAX_CONCURRENT && _queue.length > 0) {
      const job = _queue.shift();
      _running++;
      _executeJob(job).finally(() => {
        _running--;
        _processQueue();
      });
    }
  }

  async function _executeJob(job) {
    if (!_settings || !_settings.apiUrl || !_settings.apiKey || !_settings.apiModel) {
      const err = '副 API 未配置完整（地址/密钥/模型）';
      FreqLog.error('subapi', err);
      job.reject(new Error(err));
      return;
    }

    const baseUrl = _settings.apiUrl.replace(/\/+$/, '');
    let chatUrl;
    if (baseUrl.endsWith('/v1')) {
      chatUrl = baseUrl + '/chat/completions';
    } else if (baseUrl.includes('/v1/')) {
      chatUrl = baseUrl.replace(/\/v1\/.*$/, '/v1/chat/completions');
    } else {
      chatUrl = baseUrl + '/v1/chat/completions';
    }

    const body = {
      model: _settings.apiModel,
      messages: job.messages,
      max_tokens: job.opts.maxTokens || 800,
      temperature: job.opts.temperature !== undefined ? job.opts.temperature : 0.8,
      stream: false,
    };

    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const resp = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${_settings.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 300)}`);
        }

        const json = await resp.json();
        let text = '';
        if (json.choices && json.choices[0]) {
          text = json.choices[0].message?.content || json.choices[0].text || '';
        } else if (json.content) {
          text = json.content;
        } else if (typeof json === 'string') {
          text = json;
        }

        if (!text && json) {
          text = JSON.stringify(json);
          FreqLog.warn('subapi', '无法从标准字段提取文本，使用原始响应');
        }

        FreqLog.info('subapi', `调用成功，返回 ${text.length} 字`);
        job.resolve(text.trim());
        return;

      } catch (err) {
        const isLast = attempt >= MAX_RETRY;
        FreqLog.warn('subapi', `调用失败 (${attempt + 1}/${MAX_RETRY + 1}): ${err.message}`);
        if (isLast) {
          FreqLog.error('subapi', '副 API 调用最终失败', err.message);
          job.reject(err);
          return;
        }
        await new Promise(r => setTimeout(r, 1000* Math.pow(2, attempt)));
      }
    }
  }

  function buildMessages(taskPromptKey, extraVars = {}) {
    if (!_settings) return [];
    const prompts = _settings.prompts || FREQ_DEFAULTS.prompts;
    const systemTemplate = prompts.system || FREQ_DEFAULTS.prompts.system;
    const taskTemplate = prompts[taskPromptKey] || FREQ_DEFAULTS.prompts[taskPromptKey] || '';

    const chatMsgs = FreqBridge.getChatMessages();
    const vars = {
      char_name: FreqBridge.getCharName(),
      user_name: FreqBridge.getUserName(),
      real_datetime: new Date().toLocaleString('zh-CN'),
      last_meow_fm_plot: (() => {
        const fm = FreqParser.getLatestMeowFM(chatMsgs);
        return fm ? (fm.plot || fm.scene || '无') : '无';
      })(),
      current_bgm: FreqParser.getLatestBGM(chatMsgs) || '未知',
      cosmic_freq_status: FreqParser.inferCosmicStatus(chatMsgs),
      limit: '200',
      ...extraVars,
    };

    const systemContent = _replaceVars(systemTemplate, vars);
    const taskContent = _replaceVars(taskTemplate, vars);

    const messages = [{ role: 'system', content: systemContent }];
    if (taskContent) {
      messages.push({ role: 'user', content: taskContent });
    }
    return messages;
  }

  function _replaceVars(template, vars) {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });
  }
    function startBackgroundTimer() {
    stopBackgroundTimer();
    if (!_settings) return;
    let interval = _settings.triggerInterval;
    if (interval === 'custom' || String(interval) === 'custom') {
      interval = (_settings.customIntervalMin || 60) * 60 * 1000;
    }
    interval = Number(interval);
    if (isNaN(interval) || interval < 300000) interval = 3600000;
    FreqLog.info('subapi', `后台定时器启动，间隔 ${Math.round(interval / 60000)} 分钟`);
    _bgTimer = setInterval(() => { _tryBackgroundTrigger(); }, interval);
  }
  function stopBackgroundTimer() {
    if (_bgTimer) { clearInterval(_bgTimer); _bgTimer = null; }
  }

  async function _tryBackgroundTrigger() {
    if (Date.now() < _silentUntil) {
      const remain = Math.round((_silentUntil - Date.now()) / 60000);
      FreqLog.info('subapi', `静默期中，剩余 ${remain} 分钟`);
      return;
    }
    if (!_settings || !_settings.apiUrl || !_settings.apiKey || !_settings.apiModel) return;

    FreqLog.info('subapi', '后台触发：生成主动消息...');
    try {
      const messages = buildMessages('bg_message');
      const text = await call(messages, { maxTokens: 200, temperature: 0.9 });
      if (text) {
        const charName = FreqBridge.getCharName();
        FreqNotify.push('system', '📻', `来自 ${charName}`, text);
        FreqBus.emit('bg:message', { charName, text, time: Date.now() });

        //── 同时写入宇宙频率·感知 ──
        if (typeof App06Cosmic !== 'undefined' && App06Cosmic.addMessage) {
          App06Cosmic.addMessage({
            charName,
            text: safeParseText(text),
            type: 'bg_message',
            context: {
              realTime: new Date().toLocaleString('zh-CN'),
              cosmicStatus: FreqParser.inferCosmicStatus(FreqBridge.getChatMessages()),
            },
          });
          FreqLog.info('subapi', '后台消息已同步至宇宙频率');
        }

        _silentUntil = Date.now() + 3* 60 * 60 * 1000;
        FreqLog.info('subapi', '已进入 3 小时静默期');
      }
    } catch (err) {
      FreqLog.error('subapi', '后台触发失败', err.message);
    }
  }

  function parseResponse(text, tagName) {
    if (!text) return [text || ''];
    const xmlReg = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    const xmlMatches = [];
    let m;
    while ((m = xmlReg.exec(text)) !== null) {
      xmlMatches.push(m[1].trim());
    }
    if (xmlMatches.length > 0) return xmlMatches;
    FreqLog.info('subapi', `未找到 <${tagName}> 标签，返回原始文本`);
    return [text.trim()];
  }

  function safeParseText(text) {
    if (!text) return '（信号中断…）';
    let cleaned = text.replace(/^```[\s\S]*?\n/gm, '').replace(/```$/gm, '').trim();
    if (!cleaned) return '（信号微弱…）';
    return cleaned;
  }

  return {
    init, fetchModels, call, buildMessages,
    parseResponse, safeParseText,startBackgroundTimer, stopBackgroundTimer,
  };
})();
//============================================================
//  block_10  —  App 01 · 电台归档
// ============================================================
const App01Archive = (() => {
  let _ctx = null;       // { settings, bus, store, bridge, parser, notify, log }
  let _container = null;
  let _clickHandler = null;
  let _inputHandler = null;

  // ── 状态（存对象，不存DOM）──
  let _records = [];// 解析后的归档记录数组
  let _expandedIndex = null; // 当前展开的卡片索引（null = 全部折叠）
  let _searchQuery = '';     // 搜索关键词
  let _sortAsc = false;      // false = 倒序（最新在上），true = 正序

  // ── 中文字段别名映射（兼容格式3）──
  const _FIELD_ALIASES = {
    serial: ['serial', '序号', '编号', 'no'],
    time:   ['time', '时间','date', '日期'],
    scene:  ['scene', '场景', '地点', '地方'],
    plot:   ['plot', '剧情', '摘要', '概要', '记录'],
    seeds:  ['seeds', '伏笔', '种子','seed'],
    event:  ['event', '事件', '活动'],
    cycle:  ['cycle', '周期', '循环'],
    todo:   ['todo', '待办', '任务'],
    cash:   ['cash', '资金', '金钱', '金额'],
    temp:   ['temp', '温度', '气温','temperature'],
    signal: ['signal', '信号'],
    diary:  ['diary', '日记', '记录仪'],
    history:['history', '历史', '历史事件'],
    hidden: ['隐秘的真实', 'hidden', 'nsfw'],
    weather:['weather', '天气', '天气状况'],
  };

  // ── 增强解析：对单条raw 文本做多别名 + 多行提取 ──
  function _enhancedParse(rawText) {
    const result = {};
    for (const [field, aliases] of Object.entries(_FIELD_ALIASES)) {
      for (const alias of aliases) {
        //尝试多行匹配：从"Key：" 开始，到下一个已知 Key 或文本末尾
        const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const multiLineReg = new RegExp(
          `(?:^|\\n)\\s*${escapedAlias}\\s*[：:=]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${_getAllAliasPattern()})|$)`,
          'i'
        );
        const match = rawText.match(multiLineReg);
        if (match && match[1].trim()) {
          result[field] = match[1].trim();break;
        }
      }
    }
    return result;
  }

  // 生成所有别名的正则交替模式（用于多行匹配的终止符）
  let _aliasPatternCache = null;
  function _getAllAliasPattern() {
    if (_aliasPatternCache) return _aliasPatternCache;
    const allAliases = [];
    for (const aliases of Object.values(_FIELD_ALIASES)) {
      for (const a of aliases) {
        allAliases.push(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }
    }
    _aliasPatternCache = allAliases.join('|');
    return _aliasPatternCache;
  }

  // ── 从对话中提取所有 meow_FM 记录 ──
  function _parseAllRecords() {
    try {
      const messages = _ctx.bridge.getChatMessages();
      if (!messages || messages.length === 0) {
        _records = [];
        return;
      }

      // 第一层：用FreqParser 提取基础结果
      const baseResults = _ctx.parser.parseMeowFM(messages);

      // 第二层：增强解析，补充缺失字段
      _records = baseResults.map((item, idx) => {
        const enhanced = _enhancedParse(item.raw || '');
        return {
          index: idx,
          serial:  item.serial || enhanced.serial || _extractSerial(item.raw) || `#${String(idx + 1).padStart(3, '0')}`,
          time:    item.time   || enhanced.time   || '',
          scene:   item.scene  || enhanced.scene  || '',
          plot:    item.plot   || enhanced.plot   || '',
          seeds:   item.seeds  || enhanced.seeds  || '',
          event:   item.event  || enhanced.event  || '',
          cycle:   item.cycle  || enhanced.cycle  || '',
          todo:    item.todo   || enhanced.todo   || '',
          cash:    item.cash   || enhanced.cash   || '',
          temp:    enhanced.temp    || '',
          signal:  enhanced.signal  || '',
          diary:   enhanced.diary   || '',
          history: enhanced.history || '',
          hidden:  enhanced.hidden  || '',
          weather: enhanced.weather || '',
          raw:     item.raw    || '',
        };
      });

      _ctx.log.info('archive', `解析完成，共 ${_records.length} 条归档记录`);
    } catch (err) {
      _ctx.log.error('archive', '解析 meow_FM 失败', err.message);
      _records = [];
    }
  }

  // 从 raw 文本中提取序号（兼容 "serial:🩻No.001" 格式）
  function _extractSerial(raw) {
    if (!raw) return '';
    const m = raw.match(/(?:serial|序号|编号)\s*[：:=]?\s*(.*?)(?:\n|$)/i);
    if (m) return m[1].trim();
    const noMatch = raw.match(/No\.?\s*(\d+)/i);
    if (noMatch) return `No.${noMatch[1]}`;
    return '';
  }

  // ── 过滤 & 排序 ──
  function _getFilteredRecords() {
    let list = [..._records];

    // 搜索过滤
    if (_searchQuery.trim()) {
      const q = _searchQuery.trim().toLowerCase();
      list = list.filter(r => {
        const searchable = [
          r.serial, r.time, r.scene, r.plot, r.seeds,
          r.event, r.cycle, r.todo, r.cash, r.temp,
          r.signal, r.diary, r.history, r.hidden,
          r.weather, r.raw,
        ].join(' ').toLowerCase();
        return searchable.includes(q);
      });
    }

    // 排序
    if (_sortAsc) {
      list.sort((a, b) => a.index - b.index);
    } else {
      list.sort((a, b) => b.index - a.index);
    }

    return list;
  }

  // ── 渲染 ──
  function _render() {
    if (!_container) return;

    const filtered = _getFilteredRecords();

    _container.innerHTML = `
      <div class="freq-archive">
        <div class="freq-archive-toolbar">
          <div class="freq-archive-search-wrap">
            <span class="freq-archive-search-icon">🔍</span>
            <input type="text" class="freq-archive-search"
                   placeholder="搜索关键词..."
                   value="${_escHtml(_searchQuery)}" />
          </div>
          <div class="freq-archive-actions">
            <button class="freq-archive-btn freq-archive-sort-btn"
                    title="${_sortAsc ? '当前：正序（最早在上）' : '当前：倒序（最新在上）'}">
              ${_sortAsc ? '↑ 正序' : '↓ 倒序'}
            </button>
            <button class="freq-archive-btn freq-archive-refresh-btn" title="重新获取">
              🔄
            </button>
          </div>
        </div>
        <div class="freq-archive-count">
          共 ${_records.length} 条记录${_searchQuery.trim() ? `，匹配 ${filtered.length} 条` : ''}
        </div>
        <div class="freq-archive-list">
          ${filtered.length === 0
            ? `<div class="freq-empty-state">
                 <div class="freq-empty-state-icon">📻</div>
                 <div class="freq-empty-state-text">${_searchQuery.trim() ? '未找到匹配的记录' : '尚未接收到电台信号…'}</div>
               </div>`
            : filtered.map(r => _renderCard(r)).join('')
          }
        </div>
      </div>
    `;
  }

  function _renderCard(record) {
    const isExpanded = _expandedIndex === record.index;
    const expandedClass = isExpanded ? 'freq-archive-card-expanded' : '';

    // 折叠态：显示 plot 前60 字符
    const plotPreview = record.plot
      ? (record.plot.length > 60 ? record.plot.substring(0, 60) + '…' : record.plot)
      : '';

    // 收集所有有内容的额外字段
    const extraFields = [];
    if (record.event)extraFields.push({ label: '事件', value: record.event });
    if (record.cycle)   extraFields.push({ label: '周期', value: record.cycle });
    if (record.todo)    extraFields.push({ label: '待办', value: record.todo });
    if (record.cash)    extraFields.push({ label: '资金', value: record.cash });
    if (record.temp)    extraFields.push({ label: '温度', value: record.temp });
    if (record.weather) extraFields.push({ label: '天气', value: record.weather });
    if (record.signal)  extraFields.push({ label: '信号', value: record.signal });
    if (record.diary)   extraFields.push({ label: '日记', value: record.diary });
    if (record.history) extraFields.push({ label: '历史', value: record.history });
    if (record.hidden)  extraFields.push({ label: '隐秘的真实', value: record.hidden });

    // 判断是否有可展开的内容
    const hasExpandable = record.plot.length > 60
      || record.seeds
      || extraFields.length > 0;

    return `
      <div class="freq-archive-card ${expandedClass}" data-record-index="${record.index}">
        <div class="freq-archive-card-header">
          <span class="freq-archive-serial">${_escHtml(record.serial)}</span>
          ${record.time ? `<span class="freq-archive-time">${_escHtml(record.time)}</span>` : ''}</div>
        ${record.scene ? `
          <div class="freq-archive-scene">
            <span class="freq-archive-scene-icon">📍</span>
            <span>${_escHtml(record.scene)}</span>
          </div>
        ` : ''}
        ${record.plot ? `
          <div class="freq-archive-plot-preview">${_escHtml(plotPreview)}</div>
        ` : ''}
        ${isExpanded ? `
          <div class="freq-archive-expanded-body">
            ${record.plot ? `
              <div class="freq-archive-field">
                <div class="freq-archive-field-label">📝 剧情</div>
                <div class="freq-archive-field-value">${_escHtml(record.plot)}</div>
              </div>
            ` : ''}
            ${record.seeds ? `
              <div class="freq-archive-field freq-archive-seeds">
                <div class="freq-archive-field-label">🌱 Seeds</div>
                <div class="freq-archive-field-value">${_escHtml(record.seeds)}</div>
              </div>
            ` : ''}
            ${extraFields.map(f => `
              <div class="freq-archive-field">
                <div class="freq-archive-field-label">${_escHtml(f.label)}</div>
                <div class="freq-archive-field-value">${_escHtml(f.value)}</div>
              </div>
            `).join('')}
            ${record.raw ? `
              <details class="freq-archive-raw-details">
                <summary class="freq-archive-raw-summary">📄 原始数据</summary>
                <pre class="freq-archive-raw-content">${_escHtml(record.raw)}</pre>
              </details>
            ` : ''}
          </div>
        ` : ''}
        ${hasExpandable ? `
          <div class="freq-archive-toggle">
            ${isExpanded ? '▲ 收起' : '▼ 展开'}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── 事件绑定 ──
  function _bindEvents(container) {
    // 移除旧监听器
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    if (_inputHandler) container.removeEventListener('input', _inputHandler);

    // 点击事件（展开/收起 + 排序 + 刷新）
    _clickHandler = (e) => {
      // 排序按钮
      if (e.target.closest('.freq-archive-sort-btn')) {
        _sortAsc = !_sortAsc;
        _render();
        _bindEvents(_container);
        return;
      }

      // 刷新按钮
      if (e.target.closest('.freq-archive-refresh-btn')) {
        _expandedIndex = null;
        _parseAllRecords();
        _render();
        _bindEvents(_container);
        _ctx.log.info('archive', '手动刷新归档');
        return;
      }

      // 卡片展开/收起
      const card = e.target.closest('.freq-archive-card');
      if (card) {
        // 不要在点击原始数据的details/summary 时触发展开
        if (e.target.closest('.freq-archive-raw-details')) return;

        const idx = parseInt(card.dataset.recordIndex, 10);
        if (!isNaN(idx)) {
          _expandedIndex = (_expandedIndex === idx) ? null : idx;
          _render();
          _bindEvents(_container);}
      }
    };container.addEventListener('click', _clickHandler);

    // 搜索输入
    _inputHandler = (e) => {
      if (e.target.classList.contains('freq-archive-search')) {
        _searchQuery = e.target.value;
        _expandedIndex = null; // 搜索时重置展开状态
        _render();
        _bindEvents(_container);

        // 恢复光标位置
        const input = _container.querySelector('.freq-archive-search');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    };
    container.addEventListener('input', _inputHandler);
  }

  // ── HTML 转义 ──
  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ══════════════════════════════════════
  //  公开接口
  // ══════════════════════════════════════
  return {
    id: 'archive',
    name: '电台归档',
    icon: '📻',

    init(ctx) {
      _ctx = ctx;
      // 监听聊天切换 → 重新解析
      _ctx.bus.on('chat:loaded', () => {
        _records = [];
        _expandedIndex = null;
        _searchQuery = '';
        _parseAllRecords();
      });// 监听新消息 → 增量更新
      _ctx.bus.on('meow_fm:updated', () => {
        _parseAllRecords();
        // 如果 App 当前打开着，刷新视图
        if (_container) {
          _render();
          _bindEvents(_container);
        }
      });
    },

    mount(container) {
      _container = container;
      _parseAllRecords();
      _render();
      _bindEvents(container);
    },

    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      if (_container && _inputHandler) {
        _container.removeEventListener('input', _inputHandler);
      }
      _container = null;
    },
  };
})();

//============================================================
//  block_11  —  App02 · 后台录音室
// ============================================================
const App02Studio = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;
  let _inputHandler = null;

  //── 状态 ──
  let _mode = 'monologue';        // 'monologue' | 'interview' | 'private'
  let _records = [];              // 历史记录 [{mode, content, time, charName}]
  let _loading = false;
  let _statusText = '';
  let _userQuestion = '';         // 演播厅采访：用户自定义问题
  let _expandedIndex = null;      // 历史记录展开索引
  let _useThinking = true;        // 角色私录是否读取 Thinking

  // ── 模式定义 ──
  const _MODES = {
    monologue: { key: 'monologue', icon: '🎙', label: '失真独白', desc: '失真没开麦时的碎碎念', promptKey: 'app02_monologue', color: '#8b5cf6' },
    interview: { key: 'interview', icon: '🎤', label: '演播厅采访', desc: '失真采访当前角色', promptKey: 'app02_interview', color: '#f59e0b' },
    private:{ key: 'private',   icon: '📼', label: '角色私录', desc: '角色的私人磁带', promptKey: 'app02_private', color: '#ef4444' },
  };

  // ── 生成录音 ──
async function _generate() {
  if (_loading) return;
  _loading = true;
  _statusText = '📡 信号连接中…';
  _render();

  const modeDef = _MODES[_mode];
  const charName = _ctx.bridge.getCharName();
  const userName = _ctx.bridge.getUserName();

  try {
    const extraVars = {};

    // ── 核心修复：提取近期对话内容注入上下文 ──
    const recentMsgs = _ctx.bridge.getRecentMessages(12);
    const dialogLines = [];
    for (const m of recentMsgs) {
      const text = (m.mes || '').trim();
      if (!text) continue;
      // 过滤掉纯标签内容（meow_FM / radio_show 等）
      const cleaned = text
        .replace(/<meow_FM>[\s\S]*?<\/meow_FM>/gi, '')
        .replace(/<radio_show>[\s\S]*?<\/radio_show>/gi, '')
        .replace(/<branches>[\s\S]*?<\/branches>/gi, '')
        .replace(/<snow>[\s\S]*?<\/snow>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (!cleaned) continue;
      const speaker = m.is_user ? userName : charName;
      // 每条截取前 120 字，避免 token 爆炸
      const preview = cleaned.length > 120 ? cleaned.slice(0, 120) + '…' : cleaned;
      dialogLines.push(`${speaker}：${preview}`);
    }
    const recentDialog = dialogLines.length > 0
      ? dialogLines.join('\n')
      : '（暂无近期对话记录）';

    // 演播厅采访：用户自定义问题
    if (_mode === 'interview' && _userQuestion.trim()) {
      extraVars.user_question = `听众提出了一个问题，请失真在采访中自然地问出来：「${_userQuestion.trim()}」`;
    } else {
      extraVars.user_question = '';
    }

    // 角色私录：注入 Thinking
    if (_mode === 'private') {
      if (_useThinking) {
        const thinking = _ctx.bridge.extractThinking(8);
        if (thinking && thinking.trim()) {
          extraVars.thinking_excerpt = `\n以下是角色的真实思绪片段，请以此为素材保留未经整理的真实感：\n---\n${thinking.slice(0, 600)}\n---`;
          _ctx.log.info('studio', `已提取 Thinking 素材 (${thinking.length} 字)`);
        } else {
          extraVars.thinking_excerpt = '\n（未检测到角色思绪片段，请自由发挥角色最真实的内心状态。）';
          _ctx.log.info('studio', '未找到 Thinking 内容，使用自由发挥模式');
        }
      } else {
        extraVars.thinking_excerpt = '';
      }
    }

    // 构建消息
    const messages = _ctx.subapi.buildMessages(modeDef.promptKey, extraVars);

    // ── 核心修复：把近期对话注入到 system prompt 末尾 ──
    if (messages.length > 0 && messages[0].role === 'system') {
      messages[0].content += `\n\n【主聊天窗近期对话（仅供参考，不得影响主线剧情）】\n${recentDialog}`;
    }

    // 失真独白模式：覆盖 system prompt 中的角色身份
    if (_mode === 'monologue') {
      if (messages.length > 0 && messages[0].role === 'system') {
        messages[0].content = messages[0].content
          .replace(/你是 \[.*?\]/, '你是 [失真]')
          .replace(/你是\[.*?\]/, '你是[失真]');
      }
    }

    const raw = await _ctx.subapi.call(messages, {
      maxTokens: _mode === 'interview' ? 500 : 300,
      temperature: 0.9,
    });


      let content = '';

      if (_mode === 'interview') {
        // 尝试解析 <qa> 标签
        const qaBlocks = _ctx.subapi.parseResponse(raw, 'qa');
        if (qaBlocks && qaBlocks.length > 0&& raw.includes('<qa>')) {
          const parsed = qaBlocks.map(block => {
            const qMatch = block.match(/<q>([\s\S]*?)<\/q>/i);
            const aMatch = block.match(/<a>([\s\S]*?)<\/a>/i);
            const q = qMatch ? qMatch[1].trim() : '';
            const a = aMatch ? aMatch[1].trim() : '';
            return { q, a };
          }).filter(item => item.q || item.a);

          if (parsed.length > 0) {
            content = parsed.map(item =>
              `🎙 失真：${item.q}\n💬 ${charName}：${item.a}`
            ).join('\n\n');
          }
        }// 兜底：直接用原始文本
        if (!content) {
          content = _ctx.subapi.safeParseText(raw);
        }
      } else {
        content = _ctx.subapi.safeParseText(raw);
      }

      // 保存记录
      const record = {
        mode: _mode,
        content,
        time: new Date().toLocaleString('zh-CN'),
        timestamp: Date.now(),
        charName,modeLabel: modeDef.label,
        modeIcon: modeDef.icon,
      };
      _records.unshift(record);
      if (_records.length > 50) _records.length = 50;

      // 持久化
      _saveRecords();

      _statusText = `✓ ${modeDef.label}录制完成`;
      _ctx.notify.push('studio', modeDef.icon, '后台录音室', `${modeDef.label}已录制`, { silent: true });_ctx.log.info('studio', `${modeDef.label}生成成功 (${content.length} 字)`);} catch (e) {
      _statusText = '⚠ 信号丢失，请重试';
      _ctx.log.error('studio', `${modeDef.label}生成失败`, e.message);
      _ctx.notify.push('studio', '⚠️', '后台录音室', '录制失败：信号不稳定');
    }

    _loading = false;
    _render();
    _bindEvents(_container);

    // 状态文字3 秒后清除
    setTimeout(() => {
      if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
        _statusText = '';
        _render();
        _bindEvents(_container);
      }
    }, 3000);
  }

  // ── 持久化 ──
  async function _saveRecords() {
    try {
      await _ctx.store.set('studio_records', _records);
    } catch (e) {
      _ctx.log.error('studio', '保存录音记录失败', e.message);
    }
  }

async function _loadRecords() {
  try {
    const saved = await _ctx.store.get('studio_records');
    if (saved && Array.isArray(saved)) {
      _records = saved;
      _ctx.log.info('studio', `已加载 ${_records.length} 条录音记录`);
    }
    // 如果 saved 是 undefined（首次使用），保持 _records = [] 不动
  } catch (e) {
    _ctx.log.error('studio', '加载录音记录失败', e.message);
    // 加载失败时保持现有内存数据，不覆盖
  }
}


  // ── 渲染 ──
  function _render() {
    if (!_container) return;

    const modeDef = _MODES[_mode];
    const charName = _ctx.bridge.getCharName();

    _container.innerHTML = `
      <div class="freq-studio">
        <!-- 模式选择器 -->
        <div class="freq-studio-modes">
          ${Object.values(_MODES).map(m => `
            <button class="freq-studio-mode-btn ${_mode === m.key ? 'freq-studio-mode-active' : ''}"
                    data-mode="${m.key}"
                    style="${_mode === m.key ? `border-color:${m.color}; color:${m.color};` : ''}">
              <span class="freq-studio-mode-icon">${m.icon}</span>
              <span class="freq-studio-mode-label">${m.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- 当前模式说明 -->
        <div class="freq-studio-desc">
          <span class="freq-studio-desc-dot" style="background:${modeDef.color};"></span>
          ${_escHtml(modeDef.desc)}${_mode !== 'monologue' ?` ·<span style="color:${modeDef.color};">${_escHtml(charName)}</span>` : ''}
        </div>

        <!-- 演播厅采访：用户提问区 -->
        ${_mode === 'interview' ? `
          <div class="freq-studio-question-area">
            <div class="freq-studio-question-label">💭 想让失真问什么？（可选）</div>
            <textarea class="freq-studio-question-input"
                      placeholder="留空则由失真自由发挥…"
                      rows="2">${_escHtml(_userQuestion)}</textarea>
          </div>
        ` : ''}

        <!-- 角色私录：Thinking 开关 -->
        ${_mode === 'private' ? `
          <div class="freq-studio-thinking-toggle">
            <label class="freq-studio-toggle-label">
              <input type="checkbox" class="freq-studio-thinking-cb"
                     ${_useThinking ? 'checked' : ''} />
              <span>读取角色思维链作为素材</span>
            </label>
            <span class="freq-studio-thinking-hint">从最近消息中提取 Thinking 内容</span>
          </div>
        ` : ''}

        <!-- 录制按钮 -->
        <button class="freq-studio-record-btn ${_loading ? 'freq-studio-recording' : ''}"
                ${_loading ? 'disabled' : ''}>
          ${_loading
            ? `<span class="freq-studio-rec-dot freq-studio-rec-dot-pulse"></span> 录制中…`
            : `<span class="freq-studio-rec-dot"></span> 开始录制`
          }
        </button>

        <!-- 状态提示 -->
        ${_statusText ? `<div class="freq-studio-status">${_escHtml(_statusText)}</div>` : ''}

        <!-- 最新录音（如果有） -->
        ${_records.length > 0 && _records[0].mode === _mode ? `
          <div class="freq-studio-latest">
            <div class="freq-studio-latest-header">
              <span>${_records[0].modeIcon}最新录音</span>
              <span class="freq-studio-latest-time">${_escHtml(_records[0].time)}</span>
            </div>
            <div class="freq-studio-latest-content">${_escHtml(_records[0].content)}</div>
          </div>
        ` : ''}

        <!-- 历史记录 -->
        <div class="freq-studio-history">
          <div class="freq-studio-history-header">
            <span>📼 录音档案</span>
            <span class="freq-studio-history-count">${_records.length} 条</span>
          </div>
          ${_records.length === 0
            ? `<div class="freq-empty-state">
                <div class="freq-empty-state-icon">🎙️</div>
                 <div class="freq-empty-state-text">录音室空空如也…<br><span style="color:#555;font-size:12px;">选择模式，按下录制</span></div>
               </div>`
            : `<div class="freq-studio-history-list">
                ${_records.map((r, i) => _renderHistoryCard(r, i)).join('')}</div>`
          }
        </div>
      </div>
    `;
  }

  function _renderHistoryCard(record, index) {
    const isExpanded = _expandedIndex === index;
    //跳过最新录音（已在上方展示）
    if (index === 0 && _records[0].mode === _mode) return '';

    const preview = record.content.length > 50
      ? record.content.substring(0, 50) + '…'
      : record.content;

    return `
      <div class="freq-studio-hcard ${isExpanded ? 'freq-studio-hcard-expanded' : ''}"
           data-history-index="${index}">
        <div class="freq-studio-hcard-header">
          <span class="freq-studio-hcard-icon">${record.modeIcon || '🎙'}</span>
          <span class="freq-studio-hcard-label">${_escHtml(record.modeLabel || record.mode)}</span>
          ${record.charName ? `<span class="freq-studio-hcard-char">${_escHtml(record.charName)}</span>` : ''}
          <span class="freq-studio-hcard-time">${_escHtml(record.time)}</span>
        </div>
        ${isExpanded
          ? `<div class="freq-studio-hcard-full">${_escHtml(record.content)}</div>`
          : `<div class="freq-studio-hcard-preview">${_escHtml(preview)}</div>`
        }
        ${record.content.length > 50 ? `
          <div class="freq-studio-hcard-toggle">${isExpanded ? '▲ 收起' : '▼ 展开'}</div>
        ` : ''}
      </div>
    `;
  }

  // ── 事件绑定 ──
  function _bindEvents(container) {
    if (!container) return;
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    if (_inputHandler) container.removeEventListener('input', _inputHandler);

    _clickHandler = (e) => {
      // 模式切换
      const modeBtn = e.target.closest('.freq-studio-mode-btn');
      if (modeBtn) {
        const newMode = modeBtn.dataset.mode;
        if (newMode && _MODES[newMode] && newMode !== _mode) {
          _mode = newMode;
          _expandedIndex = null;
          _statusText = '';
          _render();_bindEvents(_container);
        }
        return;
      }

      // 录制按钮
      if (e.target.closest('.freq-studio-record-btn')) {
        _generate();
        return;
      }

      // 历史卡片展开/收起
      const hcard = e.target.closest('.freq-studio-hcard');
      if (hcard) {
        const idx = parseInt(hcard.dataset.historyIndex, 10);
        if (!isNaN(idx)) {
          _expandedIndex = (_expandedIndex === idx) ? null : idx;
          _render();
          _bindEvents(_container);
        }
        return;
      }
    };
    container.addEventListener('click', _clickHandler);

    _inputHandler = (e) => {
      // 用户提问输入
      if (e.target.classList.contains('freq-studio-question-input')) {
        _userQuestion = e.target.value;
        return;
      }
      // Thinking 开关
      if (e.target.classList.contains('freq-studio-thinking-cb')) {
        _useThinking = e.target.checked;
        return;
      }
    };
    container.addEventListener('input', _inputHandler);container.addEventListener('change', _inputHandler);
  }

  // ── HTML 转义 ──
  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ══════════════════════════════════════
  //  公开接口
  // ══════════════════════════════════════
  return {
    id: 'studio',
    name: '后台录音室',
    icon: '🎙️',
init(ctx) {
  _ctx = ctx;
  // 预加载数据到内存，不等待（mount 时会再检查）
  _loadRecords().catch(() => {});

  _ctx.bus.on('chat:loaded', () => {
    _expandedIndex = null;
    _statusText = '';
    _userQuestion = '';
    // 切换聊天时不清空记录，录音档案是全局的，不跟聊天绑定
  });
},

async mount(container) {
  _container = container;
  // 先渲染一个加载状态，避免白屏
  _container.innerHTML = `
    <div class="freq-loading">
      <div class="freq-loading-dot"></div>
      <div class="freq-loading-dot"></div>
      <div class="freq-loading-dot"></div>
    </div>`;

  // 等数据真正从 IndexedDB 读回来再渲染
  await _loadRecords();

  if (!_container) return; // 如果期间用户已经退出 App，放弃渲染
  _render();
  _bindEvents(_container);
},


    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      if (_container && _inputHandler) {
        _container.removeEventListener('input', _inputHandler);
        _container.removeEventListener('change', _inputHandler);
      }
      _container = null;
    },
  };
})();
// ============================================================
//  block_12  —  App03 · 朋友圈·电波
// ============================================================
const App03Moments = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;
  let _inputHandler = null;

  // ── 状态 ──
  let _posts = [];              // Post[]
  let _view = 'feed';           // 'feed' | 'compose' | 'image_detail' | 'comments'
  let _activePostId = null;     // 当前查看评论/图片的帖子 id
  let _activeImageIdx = null;   // 当前查看的图片索引
  let _composeDraft = { text: '', images: [] }; // 发帖草稿
  let _commentInput = '';       // 评论输入框内容
  let _statusText = '';
  let _loadingPostId = null;    // 正在生成评论的帖子 id
  let _generatingPost = false;  // 正在生成角色动态

  // ── 数据结构 ──
  // Post: { id, authorId, authorName, authorAvatar, isUser, content, images:[{label,desc}], timestamp, likes:[], comments:[] }
  // Comment: { id, authorId, authorName, authorAvatar, isUser, content, timestamp }

  // ── 角色头像池（emoji，按角色名哈希取） ──
  const _AVATARS = ['🎭','🌙','⚡','🌊','🔥','🌸','🎪','🦋','🌿','🎵','🌑','💫','🎸','🌺','🦊','🌈','🎯','🌙'];

  function _getAvatar(name) {
    if (!name) return '👤';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
    return _AVATARS[hash % _AVATARS.length];
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function _timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return '刚刚';
    if (m < 60) return `${m}分钟前`;
    if (h < 24) return `${h}小时前`;
    if (d < 7) return `${d}天前`;
    return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  }

  function _escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── 持久化 ──
  async function _savePosts() {
    try { await _ctx.store.set('moments_posts', _posts); }
    catch (e) { _ctx.log.error('moments', '保存失败', e.message); }
  }

  async function _loadPosts() {
    try {
      const saved = await _ctx.store.get('moments_posts');
      if (saved && Array.isArray(saved)) {
        _posts = saved;
        _ctx.log.info('moments', `已加载 ${_posts.length} 条动态`);
      }
    } catch (e) {
      _ctx.log.error('moments', '加载失败', e.message);
    }
  }

  // ── 获取所有可用角色 ──
  function _getAllChars() {
    try {
      const ctx = SillyTavern.getContext();
      const chars = ctx.characters || [];
      return chars
        .filter(c => c && c.name)
        .map(c => ({ name: c.name, avatar: _getAvatar(c.name) }));
    } catch (e) {
      const name = _ctx.bridge.getCharName();
      return name ? [{ name, avatar: _getAvatar(name) }] : [];
    }
  }

  // ── 生成角色动态 ──
  async function _generateCharPost(charName) {
    const msgs = _ctx.bridge.getChatMessages ? _ctx.bridge.getChatMessages() : [];
    const bgm = _ctx.parser.getLatestBGM(msgs) || '未知';

    const messages = _ctx.subapi.buildMessages('app03_post', {
      char_name: charName,
      current_bgm: bgm,
      limit: '80',
    });
    // 覆盖 system 里的角色名
    if (messages.length > 0 && messages[0].role === 'system') {
      messages[0].content = messages[0].content
        .replace(/你是 $$.*?$$/, `你是 [${charName}]`)
        .replace(/你是$$.*?$$/, `你是[${charName}]`);
    }

    const raw = await _ctx.subapi.call(messages, { maxTokens: 150, temperature: 0.95 });
    return _ctx.subapi.safeParseText(raw);
  }

  // ── 生成图片描述 ──
  async function _generateImageDesc(charName, imageLabel) {
    const messages = _ctx.subapi.buildMessages('app03_image', {
      char_name: charName,
      image_label: imageLabel,
      limit: '120',
    });
    if (messages.length > 0 && messages[0].role === 'system') {
      messages[0].content = messages[0].content
        .replace(/你是 $$.*?$$/, `你是 [${charName}]`)
        .replace(/你是$$.*?$$/, `你是[${charName}]`);
    }
    const raw = await _ctx.subapi.call(messages, { maxTokens: 180, temperature: 0.9 });
    return _ctx.subapi.safeParseText(raw);
  }

  // ── 生成角色评论 ──
  async function _generateComment(charName, post) {
    const postText = post.content || (post.images.length > 0 ? `[图片：${post.images[0].label}]` : '');
    const messages = _ctx.subapi.buildMessages('app03_comment', {
      char_name: charName,
      post_author: post.authorName,
      post_content: postText.slice(0, 100),
      limit: '40',
    });
    if (messages.length > 0 && messages[0].role === 'system') {
      messages[0].content = messages[0].content
        .replace(/你是 $$.*?$$/, `你是 [${charName}]`)
        .replace(/你是$$.*?$$/, `你是[${charName}]`);
    }
    const raw = await _ctx.subapi.call(messages, { maxTokens: 80, temperature: 1.0 });
    return _ctx.subapi.safeParseText(raw);
  }

  // ── 刷新：让随机角色发新动态 + 互评 ──
  async function _refresh() {
    if (_generatingPost) return;
    _generatingPost = true;
    _statusText = '📡 正在接收新信号…';
    _render(); _bindEvents(_container);

    const chars = _getAllChars();
    if (chars.length === 0) {
      _statusText = '⚠ 未找到角色';
      _generatingPost = false;
      _render(); _bindEvents(_container);
      return;
    }

    try {
      // 随机选 1-2 个角色发新动态
      const shuffled = [...chars].sort(() => Math.random() - 0.5);
      const toPost = shuffled.slice(0, Math.min(2, shuffled.length));

      for (const char of toPost) {
        try {
          const content = await _generateCharPost(char.name);
          if (!content) continue;
          const post = {
            id: _uid(),
            authorId: char.name,
            authorName: char.name,
            authorAvatar: char.avatar,
            isUser: false,
            content,
            images: [],
            timestamp: Date.now() - Math.floor(Math.random() * 600000), // 随机往前偏移最多10分钟
            likes: [],
            comments: [],
          };
          _posts.unshift(post);
        } catch (e) {
          _ctx.log.error('moments', `${char.name} 发帖失败`, e.message);
        }
      }

      // 随机让 1 个角色对已有帖子评论（不评自己的）
      if (_posts.length > 0 && chars.length > 1) {
        const commenter = shuffled[shuffled.length - 1];
        const targetPost = _posts.find(p => p.authorId !== commenter.name);
        if (targetPost) {
          try {
            const commentText = await _generateComment(commenter.name, targetPost);
            if (commentText) {
              targetPost.comments.push({
                id: _uid(),
                authorId: commenter.name,
                authorName: commenter.name,
                authorAvatar: commenter.avatar,
                isUser: false,
                content: commentText,
                timestamp: Date.now(),
              });
            }
          } catch (e) {
            _ctx.log.error('moments', '角色互评失败', e.message);
          }
        }
      }

      await _savePosts();
      _statusText = '✓ 已接收最新信号';
      _ctx.notify.push('moments', '📡', '朋友圈·电波', `${toPost.map(c=>c.name).join('、')} 发布了新动态`);
    } catch (e) {
      _statusText = '⚠ 信号中断，请重试';
      _ctx.log.error('moments', '刷新失败', e.message);
    }

    _generatingPost = false;
    _render(); _bindEvents(_container);
    setTimeout(() => {
      if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
        _statusText = '';
        if (_container) { _render(); _bindEvents(_container); }
      }
    }, 3000);
  }

  // ── 用户发帖 ──
  function _submitUserPost() {
    const text = _composeDraft.text.trim();
    const images = _composeDraft.images.filter(img => img.label.trim());
    if (!text && images.length === 0) {
      _statusText = '⚠ 请输入内容或添加图片';
      _render(); _bindEvents(_container);
      return;
    }
    const userName = _ctx.bridge.getUserName() || 'User';
    const post = {
      id: _uid(),
      authorId: '__user__',
      authorName: userName,
      authorAvatar: '🙂',
      isUser: true,
      content: text,
      images: images.map(img => ({ label: img.label.trim(), desc: '' })),
      timestamp: Date.now(),
      likes: [],
      comments: [],
    };
    _posts.unshift(post);
    _savePosts();
    _composeDraft = { text: '', images: [] };
    _view = 'feed';
    _statusText = '✓ 已发布';
    _render(); _bindEvents(_container);
    setTimeout(() => {
      if (_statusText.startsWith('✓')) {
        _statusText = '';
        if (_container) { _render(); _bindEvents(_container); }
      }
    }, 2000);
  }

  // ── 用户评论 ──
  function _submitUserComment(postId) {
    const text = _commentInput.trim();
    if (!text) return;
    const post = _posts.find(p => p.id === postId);
    if (!post) return;
    const userName = _ctx.bridge.getUserName() || 'User';
    post.comments.push({
      id: _uid(),
      authorId: '__user__',
      authorName: userName,
      authorAvatar: '🙂',
      isUser: true,
      content: text,
      timestamp: Date.now(),
    });
    _commentInput = '';
    _savePosts();
    _render(); _bindEvents(_container);
  }

  // ── 触发角色评论用户帖子 ──
  async function _triggerCharComment(postId) {
    const post = _posts.find(p => p.id === postId);
    if (!post || _loadingPostId === postId) return;

    const chars = _getAllChars().filter(c => c.name !== post.authorName);
    if (chars.length === 0) {
      _statusText = '⚠ 没有其他角色可以评论';
      _render(); _bindEvents(_container);
      return;
    }

    _loadingPostId = postId;
    _render(); _bindEvents(_container);

    const char = chars[Math.floor(Math.random() * chars.length)];
    try {
      const commentText = await _generateComment(char.name, post);
      if (commentText) {
        post.comments.push({
          id: _uid(),
          authorId: char.name,
          authorName: char.name,
          authorAvatar: char.avatar,
          isUser: false,
          content: commentText,
          timestamp: Date.now(),
        });
        await _savePosts();
      }
    } catch (e) {
      _statusText = '⚠ 信号丢失，请重试';
      _ctx.log.error('moments', '触发评论失败', e.message);
    }

    _loadingPostId = null;
    _render(); _bindEvents(_container);
  }

  // ── 点赞 ──
  function _toggleLike(postId) {
    const post = _posts.find(p => p.id === postId);
    if (!post) return;
    const userId = '__user__';
    const idx = post.likes.indexOf(userId);
    if (idx === -1) post.likes.push(userId);
    else post.likes.splice(idx, 1);
    _savePosts();
    _render(); _bindEvents(_container);
  }

  // ── 查看图片详情（生成描述） ──
  async function _viewImage(postId, imgIdx) {
    const post = _posts.find(p => p.id === postId);
    if (!post) return;
    const img = post.images[imgIdx];
    if (!img) return;

    _activePostId = postId;
    _activeImageIdx = imgIdx;
    _view = 'image_detail';
    _render(); _bindEvents(_container);

    // 如果还没有描述，生成一个
    if (!img.desc) {
      try {
        const desc = await _generateImageDesc(post.authorName, img.label);
        img.desc = desc || '（图片描述生成失败）';
        await _savePosts();
      } catch (e) {
        img.desc = '（信号不稳定，描述加载失败）';
        _ctx.log.error('moments', '图片描述生成失败', e.message);
      }
      if (_container && _view === 'image_detail') {
        _render(); _bindEvents(_container);
      }
    }
  }

  // ══════════════════════════════════════
  //  渲染
  // ══════════════════════════════════════

  function _render() {
    if (!_container) return;
    if (_view === 'compose') { _renderCompose(); return; }
    if (_view === 'image_detail') { _renderImageDetail(); return; }
    if (_view === 'comments') { _renderComments(); return; }
    _renderFeed();
  }

  // ── Feed 主页 ──
  function _renderFeed() {
    const html = `
      <div class="fmom-wrap">
        <!-- 顶栏 -->
        <div class="fmom-header">
          <span class="fmom-header-title">Freq · Wave</span>
          <div class="fmom-header-actions">
            <button class="fmom-icon-btn fmom-refresh-btn" title="刷新" ${_generatingPost ? 'disabled' : ''}>
              <span class="${_generatingPost ? 'fmom-spin' : ''}">↻</span>
            </button>
            <button class="fmom-icon-btn fmom-compose-btn" title="发布">✦</button>
          </div>
        </div>

        ${_statusText ? `<div class="fmom-status-bar">${_escHtml(_statusText)}</div>` : ''}

        <!-- 动态列表 -->
        <div class="fmom-feed">
          ${_posts.length === 0
            ? `<div class="fmom-empty">
                <div class="fmom-empty-icon">📡</div>
                <div class="fmom-empty-text">频率空白中…<br><span>点击 ↻ 接收信号</span></div>
               </div>`
            : _posts.map(p => _renderPostCard(p)).join('')
          }
        </div>
      </div>
    `;
    _container.innerHTML = html;
  }

  // ── 单条动态卡片 ──
  function _renderPostCard(post) {
    const liked = post.likes.includes('__user__');
    const likeCount = post.likes.length;
    const commentCount = post.comments.length;
    const timeStr = _timeAgo(post.timestamp);

    return `
      <div class="fmom-post" data-post-id="${post.id}">
        <!-- 头部：头像 + 名字 + 时间 -->
        <div class="fmom-post-header">
          <div class="fmom-avatar ${post.isUser ? 'fmom-avatar-user' : ''}">${post.authorAvatar}</div>
          <div class="fmom-post-meta">
            <span class="fmom-post-author ${post.isUser ? 'fmom-author-user' : ''}">${_escHtml(post.authorName)}</span>
            <span class="fmom-post-time">${timeStr}</span>
          </div>
        </div>

        <!-- 正文 -->
        ${post.content ? `<div class="fmom-post-content">${_escHtml(post.content)}</div>` : ''}

        <!-- 图片列表 -->
        ${post.images.length > 0 ? `
          <div class="fmom-images">
            ${post.images.map((img, i) => `
              <button class="fmom-image-chip" data-post-id="${post.id}" data-img-idx="${i}">
                <span class="fmom-image-icon">🖼</span>
                <span class="fmom-image-label">${_escHtml(img.label)}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}

        <!-- 底部：点赞 + 评论 -->
        <div class="fmom-post-footer">
          <button class="fmom-action-btn fmom-like-btn ${liked ? 'fmom-liked' : ''}" data-post-id="${post.id}">
            <span class="fmom-like-heart">${liked ? '❤️' : '🤍'}</span>
            ${likeCount > 0 ? `<span class="fmom-action-count">${likeCount}</span>` : ''}
          </button>
          <button class="fmom-action-btn fmom-comment-btn" data-post-id="${post.id}">
            <span>💬</span>
            ${commentCount > 0 ? `<span class="fmom-action-count">${commentCount}</span>` : ''}
          </button>
        </div>

        <!-- 评论预览（最多2条） -->
        ${post.comments.length > 0 ? `
          <div class="fmom-comment-preview">
            ${post.comments.slice(-2).map(c => `
              <div class="fmom-comment-line">
                <span class="fmom-comment-author">${_escHtml(c.authorName)}</span>
                <span class="fmom-comment-text">${_escHtml(c.content)}</span>
              </div>
            `).join('')}
            ${post.comments.length > 2 ? `<div class="fmom-comment-more">查看全部 ${post.comments.length} 条评论</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── 发帖页 ──
  function _renderCompose() {
    _container.innerHTML = `
      <div class="fmom-wrap">
        <div class="fmom-header">
          <button class="fmom-back-btn">‹ 返回</button>
          <span class="fmom-header-title">发布动态</span>
          <button class="fmom-publish-btn">发布</button>
        </div>

        <div class="fmom-compose-body">
          <!-- 用户信息 -->
          <div class="fmom-compose-user">
            <div class="fmom-avatar fmom-avatar-user">🙂</div>
            <span class="fmom-compose-username">${_escHtml(_ctx.bridge.getUserName() || 'User')}</span>
          </div>

          <!-- 文字输入 -->
          <textarea class="fmom-compose-input" placeholder="此刻的频率…" rows="4">${_escHtml(_composeDraft.text)}</textarea>

          <!-- 图片区 -->
          <div class="fmom-compose-images">
            ${_composeDraft.images.map((img, i) => `
              <div class="fmom-compose-image-row">
                <span class="fmom-image-icon">🖼</span>
                <input class="fmom-compose-image-input" type="text"
                       placeholder="图片标题（如：深夜的录音室）"
                       value="${_escHtml(img.label)}"
                       data-img-idx="${i}" />
                <button class="fmom-compose-image-del" data-img-idx="${i}">✕</button>
              </div>
            `).join('')}
            <button class="fmom-add-image-btn">＋ 添加图片</button>
          </div>

          ${_statusText ? `<div class="fmom-status-bar">${_escHtml(_statusText)}</div>` : ''}
        </div>
      </div>
    `;
  }

  // ── 评论页 ──
  function _renderComments() {
    const post = _posts.find(p => p.id === _activePostId);
    if (!post) { _view = 'feed'; _renderFeed(); return; }
    const isLoading = _loadingPostId === post.id;

    _container.innerHTML = `
      <div class="fmom-wrap fmom-comments-wrap">
        <div class="fmom-header">
          <button class="fmom-back-btn">‹</button>
          <span class="fmom-header-title">评论</span>
        </div>

        <!-- 原帖摘要 -->
        <div class="fmom-comment-origin">
          <div class="fmom-avatar ${post.isUser ? 'fmom-avatar-user' : ''}">${post.authorAvatar}</div>
          <div class="fmom-comment-origin-body">
            <span class="fmom-post-author ${post.isUser ? 'fmom-author-user' : ''}">${_escHtml(post.authorName)}</span>
            <div class="fmom-comment-origin-text">${_escHtml(post.content || (post.images[0] ? `[🖼 ${post.images[0].label}]` : ''))}</div>
          </div>
        </div>

        <div class="fmom-divider"></div>

        <!-- 评论列表 -->
        <div class="fmom-comment-list">
          ${post.comments.length === 0
            ? `<div class="fmom-empty-comments">还没有评论</div>`
            : post.comments.map(c => `
                <div class="fmom-comment-item">
                  <div class="fmom-avatar fmom-avatar-sm ${c.isUser ? 'fmom-avatar-user' : ''}">${c.authorAvatar}</div>
                  <div class="fmom-comment-item-body">
                    <div class="fmom-comment-item-header">
                      <span class="fmom-comment-author ${c.isUser ? 'fmom-author-user' : ''}">${_escHtml(c.authorName)}</span>
                      <span class="fmom-comment-item-time">${_timeAgo(c.timestamp)}</span>
                    </div>
                    <div class="fmom-comment-item-text">${_escHtml(c.content)}</div>
                  </div>
                </div>
              `).join('')
          }
        </div>

        <!-- 触发角色评论 -->
        <div class="fmom-trigger-comment-wrap">
          ${isLoading
            ? `<div class="fmom-trigger-loading"><span class="fmom-spin">↻</span> 正在呼叫…</div>`
            : `<button class="fmom-trigger-comment-btn" data-post-id="${post.id}">找人来说点什么吧！</button>`
          }
        </div>

        <div class="fmom-divider"></div>

        <!-- 用户评论输入 -->
        <div class="fmom-comment-input-wrap">
          <div class="fmom-avatar fmom-avatar-sm fmom-avatar-user">🙂</div>
          <input class="fmom-comment-input" type="text"
                 placeholder="说点什么…"
                 value="${_escHtml(_commentInput)}" />
          <button class="fmom-comment-send-btn" data-post-id="${post.id}">发送</button>
        </div>
      </div>
    `;
  }

  // ── 图片详情页 ──
  function _renderImageDetail() {
    const post = _posts.find(p => p.id === _activePostId);
    if (!post) { _view = 'feed'; _renderFeed(); return; }
    const img = post.images[_activeImageIdx];
    if (!img) { _view = 'feed'; _renderFeed(); return; }

    _container.innerHTML = `
      <div class="fmom-wrap">
        <div class="fmom-header">
          <button class="fmom-back-btn">‹</button>
          <span class="fmom-header-title">${_escHtml(img.label)}</span>
        </div>
        <div class="fmom-image-detail">
          <div class="fmom-image-frame">
            <div class="fmom-image-placeholder">
              <span class="fmom-image-big-icon">🖼</span>
              <span class="fmom-image-frame-label">${_escHtml(img.label)}</span>
            </div>
          </div>
          <div class="fmom-image-meta">
            <span class="fmom-avatar ${post.isUser ? 'fmom-avatar-user' : ''}">${post.authorAvatar}</span>
            <span class="fmom-post-author">${_escHtml(post.authorName)}</span>
            <span class="fmom-post-time">${_timeAgo(post.timestamp)}</span>
          </div>
          <div class="fmom-image-desc-wrap">
            ${img.desc
              ? `<p class="fmom-image-desc">${_escHtml(img.desc)}</p>`
              : `<div class="fmom-image-desc-loading">
                   <span class="fmom-spin">↻</span> 正在解析图像信号…
                 </div>`
            }
          </div>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════
  //  事件绑定
  // ══════════════════════════════════════

  function _bindEvents(container) {
    if (!container) return;
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    if (_inputHandler) {
      container.removeEventListener('input', _inputHandler);
      container.removeEventListener('change', _inputHandler);
    }

    _clickHandler = (e) => {
      // 刷新按钮
      if (e.target.closest('.fmom-refresh-btn')) {
        _refresh();
        return;
      }
      // 发帖按钮
      if (e.target.closest('.fmom-compose-btn')) {
        _view = 'compose';
        _statusText = '';
        _render(); _bindEvents(_container);
        return;
      }
      // 返回按钮（所有页面通用）
      if (e.target.closest('.fmom-back-btn')) {
        if (_view === 'image_detail') {
          _view = 'comments';
          _render(); _bindEvents(_container);
        } else {
          _view = 'feed';
          _activePostId = null;
          _activeImageIdx = null;
          _statusText = '';
          _render(); _bindEvents(_container);
        }
        return;
      }
      // 发布按钮
      if (e.target.closest('.fmom-publish-btn')) {
        _submitUserPost();
        return;
      }
      // 添加图片
      if (e.target.closest('.fmom-add-image-btn')) {
        _composeDraft.images.push({ label: '' });
        _render(); _bindEvents(_container);
        return;
      }
      // 删除图片
      const delBtn = e.target.closest('.fmom-compose-image-del');
      if (delBtn) {
        const idx = parseInt(delBtn.dataset.imgIdx, 10);
        if (!isNaN(idx)) {
          _composeDraft.images.splice(idx, 1);
          _render(); _bindEvents(_container);
        }
        return;
      }
      // 点赞
      const likeBtn = e.target.closest('.fmom-like-btn');
      if (likeBtn) {
        _toggleLike(likeBtn.dataset.postId);
        return;
      }
      // 打开评论页
      const commentBtn = e.target.closest('.fmom-comment-btn');
      if (commentBtn) {
        _activePostId = commentBtn.dataset.postId;
        _commentInput = '';
        _view = 'comments';
        _render(); _bindEvents(_container);
        return;
      }
      // 查看全部评论（预览区点击）
      const commentMore = e.target.closest('.fmom-comment-more');
      if (commentMore) {
        const postEl = e.target.closest('.fmom-post');
        if (postEl) {
          _activePostId = postEl.dataset.postId;
          _commentInput = '';
          _view = 'comments';
          _render(); _bindEvents(_container);
        }
        return;
      }
      // 图片 chip 点击
      const imageChip = e.target.closest('.fmom-image-chip');
      if (imageChip) {
        const postId = imageChip.dataset.postId;
        const imgIdx = parseInt(imageChip.dataset.imgIdx, 10);
        _viewImage(postId, imgIdx);
        return;
      }
      // 触发角色评论
      const triggerBtn = e.target.closest('.fmom-trigger-comment-btn');
      if (triggerBtn) {
        _triggerCharComment(triggerBtn.dataset.postId);
        return;
      }
      // 发送评论
      const sendBtn = e.target.closest('.fmom-comment-send-btn');
      if (sendBtn) {
        _submitUserComment(sendBtn.dataset.postId);
        return;
      }
    };

    _inputHandler = (e) => {
      // 发帖文字
      if (e.target.classList.contains('fmom-compose-input')) {
        _composeDraft.text = e.target.value;
        return;
      }
      // 图片标题输入
      if (e.target.classList.contains('fmom-compose-image-input')) {
        const idx = parseInt(e.target.dataset.imgIdx, 10);
        if (!isNaN(idx) && _composeDraft.images[idx] !== undefined) {
          _composeDraft.images[idx].label = e.target.value;
        }
        return;
      }
      // 评论输入
      if (e.target.classList.contains('fmom-comment-input')) {
        _commentInput = e.target.value;
        return;
      }
    };

    container.addEventListener('click', _clickHandler);
    container.addEventListener('input', _inputHandler);

    // 评论框回车发送
    const commentInput = container.querySelector('.fmom-comment-input');
    if (commentInput) {
      commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const sendBtn = container.querySelector('.fmom-comment-send-btn');
          if (sendBtn) sendBtn.click();
        }
      });
    }
  }

  // ══════════════════════════════════════
  //  公开接口
  // ══════════════════════════════════════
  return {
    id: 'moments',
    name: '朋友圈·电波',
    icon: '📡',

    init(ctx) {
      _ctx = ctx;
      _loadPosts().catch(() => {});
      _ctx.bus.on('chat:loaded', () => {
        // 切换聊天不清空动态，动态是全局的
      });
    },

    async mount(container) {
      _container = container;
      _view = 'feed';
      _container.innerHTML = `
        <div class="freq-loading">
          <div class="freq-loading-dot"></div>
          <div class="freq-loading-dot"></div>
          <div class="freq-loading-dot"></div>
        </div>`;
      await _loadPosts();
      if (!_container) return;
      _render();
      _bindEvents(_container);
    },

    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      if (_container && _inputHandler) {
        _container.removeEventListener('input', _inputHandler);
        _container.removeEventListener('change', _inputHandler);
      }
      _container = null;
    },
  };
})();
// ============================================================ end block_12
// ============================================================
//  block_13 — App04 · 信号气象站
// ============================================================
const App04Weather = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;

  // ── 状态变量 ──
  let _loading = false;
  let _statusText = '';
  let _weatherData = null;   // 最新天气数据
  let _careHistory = [];     // 最近5条关心语 [{charName, text, time, weatherDesc, temp}]
  let _lastPushDate = '';    // 上次自动推送的日期字符串 'YYYY-MM-DD'
  let _autoPushTimer = null;

  // ── 常量 ──
  const STORE_KEY_HISTORY  = 'app04_care_history';
  const STORE_KEY_LASTPUSH = 'app04_last_push_date';
  const HEFENG_BASE        = 'https://devapi.qweather.com/v7';
  const HEFENG_GEO_BASE    = 'https://geoapi.qweather.com/v2';
  const MAX_HISTORY        = 5;

  // ── 天气图标映射（和风天气 icon code → emoji） ──
  const WEATHER_EMOJI = {
    '100':'☀️','101':'🌤️','102':'⛅','103':'🌥️','104':'☁️',
    '150':'🌙','151':'🌙','152':'🌙','153':'🌙',
    '300':'🌦️','301':'🌧️','302':'⛈️','303':'⛈️','304':'🌩️',
    '305':'🌧️','306':'🌧️','307':'🌧️','308':'🌧️','309':'🌧️',
    '310':'🌧️','311':'🌧️','312':'🌧️','313':'🌧️','314':'🌧️',
    '315':'🌧️','316':'🌧️','317':'🌧️','318':'🌧️','399':'🌧️',
    '400':'🌨️','401':'❄️','402':'❄️','403':'❄️','404':'🌨️',
    '405':'🌨️','406':'🌨️','407':'🌨️','408':'🌨️','409':'🌨️',
    '410':'🌨️','499':'🌨️',
    '500':'🌫️','501':'🌫️','502':'🌫️','503':'🌫️','504':'🌫️',
    '507':'🌪️','508':'🌪️','509':'🌫️','510':'🌫️','511':'🌫️',
    '512':'🌫️','513':'🌫️','514':'🌫️','515':'🌫️',
  };

  function _getWeatherEmoji(iconCode) {
    return WEATHER_EMOJI[String(iconCode)] || '🌡️';
  }

  function _escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _formatTime(isoStr) {
    try {
      const d = new Date(isoStr);
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      const hh = String(d.getHours()).padStart(2,'0');
      const mi = String(d.getMinutes()).padStart(2,'0');
      return `${mm}/${dd} ${hh}:${mi}`;
    } catch { return isoStr || ''; }
  }

  function _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── 加载持久化数据 ──
  async function _loadData() {
    try {
      const h = await _ctx.store.get(STORE_KEY_HISTORY);
      if (h && Array.isArray(h)) _careHistory = h;
      const lp = await _ctx.store.get(STORE_KEY_LASTPUSH);
      if (lp && typeof lp === 'string') _lastPushDate = lp;
    } catch (e) {
      _ctx.log.warn('weather', '加载历史数据失败', e.message);
    }
  }

  async function _saveHistory() {
    try {
      await _ctx.store.set(STORE_KEY_HISTORY, _careHistory);
    } catch (e) {
      _ctx.log.warn('weather', '保存历史失败', e.message);
    }
  }

  // ── 获取城市位置（Geolocation → 和风GeoAPI） ──
  async function _getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持 Geolocation'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => reject(new Error(`位置获取失败：${err.message}`)),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 }
      );
    });
  }

  async function _getCityId(lat, lon, apiKey) {
    const url = `${HEFENG_GEO_BASE}/city/lookup?location=${lon},${lat}&key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`GeoAPI HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.code !== '200' || !data.location || !data.location[0]) {
      throw new Error(`城市查询失败，code=${data.code}`);
    }
    return { id: data.location[0].id, name: data.location[0].name };
  }

  // ── 获取天气数据 ──
  async function _fetchWeather(cityId, apiKey) {
    const url = `${HEFENG_BASE}/weather/now?location=${cityId}&key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`天气API HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.code !== '200' || !data.now) {
      throw new Error(`天气查询失败，code=${data.code}`);
    }
    return data.now;
  }

  // ── 生成关心语（副 API） ──
  async function _generateCare(weatherNow, cityName) {
    const charName = _ctx.bridge.getCharName() || '角色';
    const userName = _ctx.bridge.getUserName() || 'User';

    // 尝试获取 BGM
    let bgmLine = '';
    try {
      const msgs = _ctx.bridge.getChatMessages();
      const bgm = _ctx.parser.getLatestBGM(msgs);
      if (bgm) bgmLine = `当前配乐风格：${bgm}。请让关心语的文风与这个配乐氛围相符。`;
    } catch (e) { /* BGM 获取失败不影响主流程 */ }

    const windDesc = `${weatherNow.windDir} ${weatherNow.windScale}级`;

    const messages = _ctx.subapi.buildMessages('app04_care', {
      char_name:   charName,
      user_name:   userName,
      weather_desc: weatherNow.text,
      temp:        weatherNow.temp,
      feels_like:  weatherNow.feelsLike,
      humidity:    weatherNow.humidity,
      wind_desc:   windDesc,
      bgm_line:    bgmLine,
    });

    const raw = await _ctx.subapi.call(messages, { maxTokens: 200, temperature: 0.92 });

    // 解析 <care> 标签，兜底纯文本
    let careText = '';
    const blocks = _ctx.subapi.parseResponse(raw, 'care');
    if (blocks && blocks.length > 0) {
      careText = blocks[0].trim();
    } else {
      careText = _ctx.subapi.safeParseText(raw).trim();
    }

    if (!careText) throw new Error('AI 返回内容为空');

    return { charName, careText, cityName, weatherNow };
  }

  // ── 生成通知简短版 ──
  async function _generateNotifyText(weatherNow) {
    const charName = _ctx.bridge.getCharName() || '角色';
    let bgmLine = '';
    try {
      const msgs = _ctx.bridge.getChatMessages();
      const bgm = _ctx.parser.getLatestBGM(msgs);
      if (bgm) bgmLine = `配乐风格：${bgm}。`;
    } catch (e) { /* 忽略 */ }

    const messages = _ctx.subapi.buildMessages('app04_notify', {
      char_name:    charName,
      weather_desc: weatherNow.text,
      temp:         weatherNow.temp,
      bgm_line:     bgmLine,
    });

    const raw = await _ctx.subapi.call(messages, { maxTokens: 60, temperature: 0.88 });
    return _ctx.subapi.safeParseText(raw).trim() || `${weatherNow.text} ${weatherNow.temp}°C，注意天气变化。`;
  }

  // ── 主流程：获取天气 + 生成关心语 ──
  async function _fetchAndGenerate(pushNotify = false) {
    const apiKey = _ctx.settings.hefengApiKey || '';
    if (!apiKey) throw new Error('请先在配置面板填写和风天气 API Key');

    const locationEnabled = _ctx.settings.app04LocationEnabled !== false;
    if (!locationEnabled) throw new Error('请在配置面板开启位置获取权限');

    // 1. 获取位置
    const { lat, lon } = await _getLocation();

    // 2. 查城市
    const { id: cityId, name: cityName } = await _getCityId(lat, lon, apiKey);

    // 3. 获取天气
    const weatherNow = await _fetchWeather(cityId, apiKey);
    _weatherData = { ...weatherNow, cityName };

    // 4. 生成关心语
    const { charName, careText } = await _generateCare(weatherNow, cityName);

    // 5. 存入历史
    const record = {
      charName,
      text: careText,
      time: new Date().toISOString(),
      weatherDesc: weatherNow.text,
      temp: weatherNow.temp,
      iconCode: weatherNow.icon,
      cityName,
    };
    _careHistory.unshift(record);
    if (_careHistory.length > MAX_HISTORY) _careHistory = _careHistory.slice(0, MAX_HISTORY);
    await _saveHistory();

    // 6. 推送通知
    if (pushNotify) {
      try {
        const notifyText = await _generateNotifyText(weatherNow);
        _ctx.notify.push('weather', '🌦️', `${charName} · 天气关心`, notifyText);
      } catch (e) {
        // 通知生成失败不影响主流程，直接用天气数据兜底
        _ctx.notify.push('weather', '🌦️', `${charName} · 天气关心`,
          `${weatherNow.text} ${weatherNow.temp}°C，${cityName}`);
      }
    }

    return record;
  }

  // ── 每日自动推送检查 ──
  function _checkAutoPush() {
    const autoPush = _ctx.settings.app04AutoPush;
    if (!autoPush) return;
    const today = _todayStr();
    if (_lastPushDate === today) return; // 今天已推过

    _lastPushDate = today;
    _ctx.store.set(STORE_KEY_LASTPUSH, today).catch(() => {});

    _fetchAndGenerate(true).then(() => {
      _ctx.log.info('weather', `每日自动推送完成 ${today}`);
    }).catch(e => {
      _ctx.log.warn('weather', '每日自动推送失败', e.message);
    });
  }

  function _startAutoPushTimer() {
    if (_autoPushTimer) clearInterval(_autoPushTimer);
    // 每小时检查一次（轻量，只在日期变化时才真正触发）
    _autoPushTimer = setInterval(_checkAutoPush, 60 * 60 * 1000);
    // 启动时也立即检查一次
    setTimeout(_checkAutoPush, 3000);
  }

  // ── 渲染 ──
  function _renderWeatherHero() {
    if (!_weatherData) return '';
    const w = _weatherData;
    const emoji = _getWeatherEmoji(w.icon);
    return `
      <div class="fwx-hero">
        <div class="fwx-hero-city">${_escHtml(w.cityName)}</div>
        <div class="fwx-hero-temp">${_escHtml(w.temp)}<span class="fwx-hero-unit">°</span></div>
        <div class="fwx-hero-desc">${emoji} ${_escHtml(w.text)}</div>
        <div class="fwx-hero-feels">体感 ${_escHtml(w.feelsLike)}°C</div>
        <div class="fwx-detail-row">
          <div class="fwx-detail-card">
            <div class="fwx-detail-label">💧 湿度</div>
            <div class="fwx-detail-val">${_escHtml(w.humidity)}%</div>
          </div>
          <div class="fwx-detail-card">
            <div class="fwx-detail-label">🌬️ 风向</div>
            <div class="fwx-detail-val">${_escHtml(w.windDir)}</div>
          </div>
          <div class="fwx-detail-card">
            <div class="fwx-detail-label">💨 风力</div>
            <div class="fwx-detail-val">${_escHtml(w.windScale)} 级</div>
          </div>
          <div class="fwx-detail-card">
            <div class="fwx-detail-label">👁️ 能见度</div>
            <div class="fwx-detail-val">${_escHtml(w.vis)} km</div>
          </div>
        </div>
      </div>`;
  }

  function _renderHistory() {
    if (_careHistory.length === 0) {
      return `<div class="fwx-empty">
        <div class="fwx-empty-icon">📡</div>
        <div class="fwx-empty-text">还没有收到任何天气关心</div>
        <div class="fwx-empty-hint">点击下方按钮接收信号</div>
      </div>`;
    }
    return _careHistory.map((r, i) => `
      <div class="fwx-care-bubble ${i === 0 ? 'fwx-care-bubble--new' : ''}">
        <div class="fwx-care-header">
          <span class="fwx-care-char">${_escHtml(r.charName)}</span>
          <span class="fwx-care-meta">${_getWeatherEmoji(r.iconCode)} ${_escHtml(r.weatherDesc)} ${_escHtml(r.temp)}°C · ${_escHtml(r.cityName)}</span>
          <span class="fwx-care-time">${_formatTime(r.time)}</span>
        </div>
        <div class="fwx-care-text">
          <div class="fwx-noise-overlay"></div>
          ${_escHtml(r.text)}
        </div>
      </div>`).join('');
  }

  function _render() {
    if (!_container) return;
    _container.innerHTML = `
      <div class="fwx-wrap">

        ${_renderWeatherHero()}

        <div class="fwx-section-title">📻 来自角色的关心</div>
        <div class="fwx-history">
          ${_loading
            ? `<div class="freq-loading">
                <div class="freq-loading-dot"></div>
                <div class="freq-loading-dot"></div>
                <div class="freq-loading-dot"></div>
               </div>`
            : _renderHistory()
          }
        </div>

        ${_statusText ? `<div class="fwx-status-bar">${_escHtml(_statusText)}</div>` : ''}

        <div class="fwx-bottom-bar">
          <button class="fwx-btn-receive" id="fwx-btn-receive" ${_loading ? 'disabled' : ''}>
            ${_loading ? '📡 接收中…' : '📡 接收信号'}
          </button>
        </div>

      </div>`;
  }

  function _bindEvents(container) {
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    _clickHandler = async (e) => {
      if (e.target.id === 'fwx-btn-receive') {
        _loading = true;
        _statusText = '📡 正在接收信号…';
        _render(); _bindEvents(_container);

        try {
          await _fetchAndGenerate(false);
          _statusText = '✓ 信号接收成功';
          _ctx.log.info('weather', '手动刷新成功');
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('weather', '手动刷新失败', err.message);
        }

        _loading = false;
        _render(); _bindEvents(_container);

        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
      }
    };
    container.addEventListener('click', _clickHandler);
  }

  // ── 公开接口 ──
  return {
    id: 'weather',
    name: '信号气象站',
    icon: '🌦️',

    init(ctx) {
      _ctx = ctx;
      _loadData().then(() => {
        _startAutoPushTimer();
      }).catch(() => {});
    },

    async mount(container) {
      _container = container;
      _container.innerHTML = `<div class="freq-loading">
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
      </div>`;
      await _loadData();
      if (!_container) return;
      _render();
      _bindEvents(_container);
    },

    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      _container = null;
    },
  };
})();
// ============================================================ end block_13
// ============================================================
//  block_14 — App05 · 弦外之音·扫频
// ============================================================
const App05Scanner = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;

  // ── 状态 ──
  let _loading = false;
  let _statusText = '';
  let _history = [];          // { id, npcName, freq, text, time }
  const MAX_HISTORY = 20;
  const STORE_KEY = 'app05_history';

  // ── NPC 代号池（扫频时随机抽取作为 fallback） ──
  const NPC_FALLBACKS = [
    '信号源 #3', '信号源 #7', '信号源 #12', '信号源 #19', '信号源 #24',
    '未知频段', '杂波 α', '杂波 β', '残影 #2', '残影 #9',
    '频段 77.4', '频段 88.6', '频段 103.7', '频段 91.1',
  ];

  // ── 工具 ──
  function _escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _randomFreq() {
    const base = (Math.random() * 30 + 70).toFixed(1);   // 70.0 ~ 100.0 MHz
    return `${base} MHz`;
  }

  function _randomNpcFallback() {
    return NPC_FALLBACKS[Math.floor(Math.random() * NPC_FALLBACKS.length)];
  }

  function _formatTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ── 失真文字特效：随机在文字中插入噪点字符 ──
  function _distort(text) {
    if (!text) return '';
    const noise = ['▒', '░', '█', '▓', '╳', '⌇', '⌀', '⚡', '◌', '⋯'];
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += text[i];
      // 约 8% 概率在字符后插入噪点
      if (Math.random() < 0.08) {
        result += `<span class="f05-noise">${noise[Math.floor(Math.random() * noise.length)]}</span>`;
      }
    }
    return result;
  }

  // ── 解析 AI 返回：提取 npcName 和 content ──
  function _parseResult(raw) {
    // 尝试解析 <scan> 标签
    const scanMatch = raw.match(/<scan>([\s\S]*?)<\/scan>/i);
    const text = scanMatch ? scanMatch[1].trim() : _ctx.subapi.safeParseText(raw);

    // 尝试从文本里提取 [信号源·XXX] 或 [XXX] 格式的 NPC 名
    const npcMatch = text.match(/^\[([^\]]{1,20})\]/);
    let npcName, content;
    if (npcMatch) {
      npcName = npcMatch[1].trim();
      content = text.slice(npcMatch[0].length).trim();
    } else {
      npcName = _randomNpcFallback();
      content = text;
    }

    return { npcName, content };
  }

  // ── 渲染 ──
  function _render() {
    if (!_container) return;

    const historyHtml = _history.length === 0
  ? `<div class="freq-empty-state f05-empty">
       <div class="f05-empty-icon">📶</div>
       <div>按下扫频，截获信号</div>
     </div>`
  : _history.map(item => `
      <div class="f05-card" data-id="${item.id}">
        <div class="f05-card-header">
          <span class="f05-npc-tag">${_escHtml(item.npcName)}</span>
          <span class="f05-freq-badge">${_escHtml(item.freq)}</span>
          <span class="f05-time">${_escHtml(item.time)}</span>
        </div>
        <div class="f05-card-body f05-collapsed" data-id="${item.id}">${_distort(_escHtml(item.content))}</div>
        <div class="f05-expand-btn" data-id="${item.id}">展开 ▾</div>
      </div>`
    ).join('');


    _container.innerHTML = `
      <div class="f05-wrap">

        <!-- 扫描仪头部 -->
        <div class="f05-scanner-head">
          <div class="f05-scanner-title">
            <span class="f05-title-icon">📶</span>
            <span>弦外之音</span>
          </div>
          <div class="f05-freq-display" id="f05-freq-display">
            ${_loading ? '<span class="f05-freq-scanning">SCANNING…</span>' : '<span class="f05-freq-idle">-- -- MHz</span>'}
          </div>
        </div>

        <!-- 扫描线动画（loading 时显示） -->
        ${_loading ? `<div class="f05-scanline-wrap"><div class="f05-scanline"></div></div>` : ''}

        <!-- 历史记录列表 -->
        <div class="f05-history">
          ${historyHtml}
        </div>

        <!-- 状态文字 -->
        ${_statusText ? `<div class="f05-status">${_escHtml(_statusText)}</div>` : ''}

        <!-- 底部操作栏 -->
        <div class="f05-bottom-bar">
          ${_history.length > 0
            ? `<button class="f05-btn-clear" id="f05-btn-clear" ${_loading ? 'disabled' : ''}>清除</button>`
            : ''}
          <button class="f05-btn-scan" id="f05-btn-scan" ${_loading ? 'disabled' : ''}>
            ${_loading ? '⏳ 扫频中…' : '📶 扫频'}
          </button>
        </div>

      </div>`;
  }

  // ── 事件绑定 ──
  function _bindEvents(container) {
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    _clickHandler = async (e) => {

      // 扫频按钮
      if (e.target.id === 'f05-btn-scan') {
        _loading = true;
        _statusText = '';
        _render(); _bindEvents(_container);

        try {
          // 构建提示词，注入随机 NPC 代号作为参考
          const npcHint = _randomNpcFallback();
          const messages = _ctx.subapi.buildMessages('app05_scan', { npc_hint: npcHint });
          const raw = await _ctx.subapi.call(messages, { maxTokens: 200, temperature: 1.0 });

          if (!_container) return;

          const { npcName, content } = _parseResult(raw);

          if (!content || content.length < 3) {
            throw new Error('信号太弱，未能截获有效内容');
          }

          const entry = {
            id: Date.now(),
            npcName,
            freq: _randomFreq(),
            content,
            time: _formatTime(Date.now()),
          };

          _history.unshift(entry);
          if (_history.length > MAX_HISTORY) _history.length = MAX_HISTORY;

          // 持久化
          await _ctx.store.set(STORE_KEY, _history);

          _statusText = '✓ 信号截获';
          _ctx.log.info('app05', `截获 [${npcName}]`);

        } catch (err) {
          if (!_container) return;
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app05', '扫频失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);

                // 3 秒后清除状态文字
        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
      }  

      // 展开/收起卡片正文
      const expandBtn = e.target.closest('.f05-expand-btn');
      if (expandBtn) {
        const id = expandBtn.dataset.id;
        const body = _container.querySelector(`.f05-card-body[data-id="${id}"]`);
        if (!body) return;
        const isCollapsed = body.classList.contains('f05-collapsed');
        if (isCollapsed) {
          body.classList.remove('f05-collapsed');
          expandBtn.textContent = '收起 ▴';
        } else {
          body.classList.add('f05-collapsed');
          expandBtn.textContent = '展开 ▾';
        }
      }

      // 清除历史
      if (e.target.id === 'f05-btn-clear') {
        _history = [];
        _ctx.store.del(STORE_KEY).catch(() => {});
        _statusText = '';
        _render(); _bindEvents(_container);
      }
    };  

    container.addEventListener('click', _clickHandler);
  }

  // ── 公开接口 ──
  return {
    id: 'scanner',
    name: '弦外之音',
    icon: '📶',

    async init(ctx) {
      _ctx = ctx;
      // 加载历史记录
      try {
        const saved = await _ctx.store.get(STORE_KEY);
        if (Array.isArray(saved)) _history = saved;
      } catch (e) {
        _history = [];
      }
    },

    async mount(container) {
      _container = container;
      // 先显示 loading 占位
      _container.innerHTML = `<div class="freq-loading">
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
      </div>`;
      // 加载历史（init 可能还没跑完）
      if (_history.length === 0) {
        try {
          const saved = await _ctx.store.get(STORE_KEY);
          if (Array.isArray(saved)) _history = saved;
        } catch (e) { /* ignore */ }
      }
      _render();
      _bindEvents(_container);
    },

    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      _container = null;
    },
  };
})();
// ============================================================ end block_14
// ============================================================
// block_22 — App13 · 时光胶囊
// ============================================================
const App13Capsule = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;
  let _intervalId = null;

  // ── 状态 ──
  let _capsules = [];       // 全部胶囊数组
  let _tab = 'write';       // 'write' | 'pending' | 'replied'
  let _loading = false;
  let _statusText = '';
  let _processing = new Set(); // 正在生成回信的胶囊 id，防止重复触发

  // ── 写信表单状态 ──
  let _draftMsg = '';
  let _draftDelay = '3600';  // 默认1小时，单位秒

  const STORE_KEY = 'capsule_capsules';
  const MAX_CAPSULES = 20;

  const DELAY_OPTIONS = [
    { label: '1 小时后',  value: '3600' },
    { label: '6 小时后',  value: '21600' },
    { label: '24 小时后', value: '86400' },
    { label: '3 天后',    value: '259200' },
    { label: '7 天后',    value: '604800' },
    { label: '自定义…',   value: 'custom' },
  ];

  function _escHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── 时间格式化 ──
  function _fmtDatetime(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function _fmtCountdown(ms) {
    if (ms <= 0) return '即将送达';
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s} 秒后`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} 分钟后`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时 ${m % 60} 分钟后`;
    const day = Math.floor(h / 24);
    return `${day} 天 ${h % 24} 小时后`;
  }

  function _fmtDelayDesc(sendAt, createdAt) {
    const ms = sendAt - createdAt;
    const h = Math.round(ms / 3600000);
    if (h < 24) return `${h} 小时`;
    const d = Math.round(ms / 86400000);
    return `${d} 天`;
  }
  function _getCharDesc() {
  try {
    const chid = window.this_chid;
    const chars = window.characters;
    if (chid == null || !chars || !chars[chid]) return '';
    const c = chars[chid];
    return [c.description, c.personality, c.scenario]
      .filter(Boolean).join('\n').slice(0, 800);
  } catch (e) {
    return '';
  }
}

  // ── 持久化 ──
  async function _load() {
    const saved = await _ctx.store.get(STORE_KEY);
    _capsules = Array.isArray(saved) ? saved : [];
  }

  async function _save() {
    await _ctx.store.set(STORE_KEY, _capsules);
  }

  // ── 后台调度：检查到期胶囊 ──
  async function _checkPending() {
    const now = Date.now();
    const due = _capsules.filter(
      c => c.status === 'pending' && c.sendAt <= now && !_processing.has(c.id)
    );
    if (due.length === 0) return;

    for (const capsule of due) {
      _processing.add(capsule.id);
      try {
        const charName = capsule.charName || _ctx.bridge.getCharName();
        const delayDesc = _fmtDelayDesc(capsule.sendAt, capsule.id);
        const messages = _ctx.subapi.buildMessages('app13_reply', {
  user_message: capsule.userMsg,
  delay_desc: delayDesc,
  char_desc: capsule.charDesc || '',
});
        const raw = await _ctx.subapi.call(messages, { maxTokens: 700, temperature: 0.92 });
        const reply = _ctx.subapi.safeParseText(raw);

        capsule.status = 'replied';
        capsule.reply = reply;
        capsule.repliedAt = Date.now();
        await _save();

        _ctx.notify.push(
          'capsule',
          '💌',
          `${charName} 回信了`,
          reply.slice(0, 40) + (reply.length > 40 ? '…' : '')
        );

        // 如果当前正在看这个 App，刷新界面
        if (_container) { _render(); _bindEvents(_container); }
      } catch (err) {
        _ctx.log.error('app13', '生成回信失败', err.message);
      } finally {
        _processing.delete(capsule.id);
      }
    }
  }

  // ── 渲染 ──
  function _render() {
    if (!_container) return;
    _container.innerHTML = `
      <div class="f13-wrap">
        ${_renderTabs()}
        <div class="f13-body">
          ${_tab === 'write'   ? _renderWrite()   : ''}
          ${_tab === 'pending' ? _renderPending() : ''}
          ${_tab === 'replied' ? _renderReplied() : ''}
        </div>
        ${_statusText ? `<div class="f13-status">${_escHtml(_statusText)}</div>` : ''}
      </div>`;
  }

  function _renderTabs() {
    const pendingCount  = _capsules.filter(c => c.status === 'pending').length;
    const unreadCount   = _capsules.filter(c => c.status === 'replied').length;
    const tabs = [
      { id: 'write',   label: '✉️ 写信' },
      { id: 'pending', label: `⏳ 等待中${pendingCount  ? ` <span class="f13-badge">${pendingCount}</span>`  : ''}` },
      { id: 'replied', label: `💌 已回信${unreadCount   ? ` <span class="f13-badge f13-badge-new">${unreadCount}</span>` : ''}` },
    ];
    return `
      <div class="f13-tabs">
        ${tabs.map(t => `
          <button class="f13-tab${_tab === t.id ? ' f13-tab-active' : ''}" data-tab="${t.id}">
            ${t.label}
          </button>`).join('')}
      </div>`;
  }

  function _renderWrite() {
    const isFull = _capsules.length >= MAX_CAPSULES;
    const isCustom = _draftDelay === 'custom';
    return `
      <div class="f13-write">
        ${isFull ? `<div class="f13-full-tip">📦 胶囊已满（${MAX_CAPSULES} 条上限），请先删除旧记录</div>` : ''}
        <div class="f13-write-label">写下你想说的话</div>
        <textarea
          id="f13-textarea"
          class="f13-textarea"
          placeholder="亲爱的……"
          maxlength="500"
          ${isFull ? 'disabled' : ''}
        >${_escHtml(_draftMsg)}</textarea>
        <div class="f13-write-label">送达时间</div>
        <div class="f13-delay-options">
          ${DELAY_OPTIONS.map(opt => `
            <button
              class="f13-delay-btn${_draftDelay === opt.value ? ' f13-delay-active' : ''}"
              data-delay="${opt.value}"
              ${isFull ? 'disabled' : ''}
            >${opt.label}</button>`).join('')}
        </div>
        ${isCustom ? `
          <div class="f13-custom-row">
            <input
              id="f13-custom-hours"
              class="f13-custom-input"
              type="number"
              min="1"
              max="720"
              placeholder="小时数"
            />
            <span class="f13-custom-unit">小时后送达</span>
          </div>` : ''}
        <button
          id="f13-btn-send"
          class="f13-send-btn"
          ${isFull || _loading ? 'disabled' : ''}
        >
          ${_loading ? '⏳ 封存中…' : '📮 封存胶囊'}
        </button>
      </div>`;
  }

  function _renderPending() {
    const list = _capsules.filter(c => c.status === 'pending')
      .sort((a, b) => a.sendAt - b.sendAt);
    if (list.length === 0) {
      return `<div class="freq-empty-state">暂无等待中的胶囊<br><span class="f13-empty-sub">去写信页封存一封吧</span></div>`;
    }
    const now = Date.now();
    return `
      <div class="f13-list">
        ${list.map(c => `
          <div class="f13-card f13-card-pending">
            <div class="f13-card-meta">
              <span class="f13-card-time">📅 ${_fmtDatetime(c.id)}</span>
              <span class="f13-card-countdown">${_fmtCountdown(c.sendAt - now)}</span>
            </div>
            <div class="f13-card-preview">${_escHtml(
              c.userMsg.length > 60 ? c.userMsg.slice(0, 60) + '…' : c.userMsg
            )}</div>
            <div class="f13-card-footer">
              <span class="f13-card-sendat">预计送达：${_fmtDatetime(c.sendAt)}</span>
              <button class="f13-del-btn" data-id="${c.id}">🗑</button>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function _renderReplied() {
    const list = _capsules.filter(c => c.status === 'replied')
      .sort((a, b) => b.repliedAt - a.repliedAt);
    if (list.length === 0) {
      return `<div class="freq-empty-state">还没有收到回信<br><span class="f13-empty-sub">封存一封，耐心等待吧</span></div>`;
    }
    return `
      <div class="f13-list">
        ${list.map(c => `
          <div class="f13-card f13-card-replied">
            <div class="f13-card-meta">
              <span class="f13-card-time">💌 ${_fmtDatetime(c.repliedAt)}</span>
              <span class="f13-card-waited">等待了 ${_fmtDelayDesc(c.sendAt, c.id)}</span>
            </div>
            <div class="f13-letter-block">
              <div class="f13-letter-section f13-letter-user">
                <div class="f13-letter-tag">你写道</div>
                <div class="f13-letter-text">${_escHtml(
                  !c.expanded
                    ? (c.userMsg.length > 60 ? c.userMsg.slice(0, 60) + '…' : c.userMsg)
                    : c.userMsg
                )}</div>
              </div>
              <div class="f13-letter-divider">· · ·</div>
              <div class="f13-letter-section f13-letter-char">
                <div class="f13-letter-tag">回信</div>
                <div class="f13-letter-text">${_escHtml(
                  !c.expanded
                    ? (c.reply.length > 80 ? c.reply.slice(0, 80) + '…' : c.reply)
                    : c.reply
                )}</div>
              </div>
            </div>
            <div class="f13-card-footer">
              <button class="f13-expand-btn" data-id="${c.id}">
                ${c.expanded ? '收起 ▴' : '展开全文 ▾'}
              </button>
              <button class="f13-del-btn" data-id="${c.id}">🗑</button>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // ── 事件绑定 ──
  function _bindEvents(container) {
    if (_clickHandler) container.removeEventListener('click', _clickHandler);

    _clickHandler = async (e) => {
      // Tab 切换
      const tabBtn = e.target.closest('.f13-tab');
      if (tabBtn) {
        _tab = tabBtn.dataset.tab;
        _render(); _bindEvents(_container);
        return;
      }

      // 延迟选项
      const delayBtn = e.target.closest('.f13-delay-btn');
      if (delayBtn) {
        // 保存当前 textarea 内容
        const ta = _container.querySelector('#f13-textarea');
        if (ta) _draftMsg = ta.value;
        _draftDelay = delayBtn.dataset.delay;
        _render(); _bindEvents(_container);
        // 恢复光标位置
        const newTa = _container.querySelector('#f13-textarea');
        if (newTa) { newTa.focus(); newTa.setSelectionRange(newTa.value.length, newTa.value.length); }
        return;
      }

      // 封存胶囊
      if (e.target.id === 'f13-btn-send') {
        const ta = _container.querySelector('#f13-textarea');
        const msg = ta ? ta.value.trim() : '';
        if (!msg) {
          _statusText = '⚠ 请先写点什么';
          _render(); _bindEvents(_container);
          setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
          return;
        }

        let delaySec = parseInt(_draftDelay, 10);
        if (_draftDelay === 'custom') {
          const customInput = _container.querySelector('#f13-custom-hours');
          const h = customInput ? parseInt(customInput.value, 10) : NaN;
          if (!h || h < 1 || h > 720) {
            _statusText = '⚠ 请输入 1–720 之间的小时数';
            _render(); _bindEvents(_container);
            setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
            return;
          }
          delaySec = h * 3600;
        }

        _loading = true;
        _statusText = '⏳ 封存中…';
        _render(); _bindEvents(_container);

        try {
          const now = Date.now();
          const capsule = {
            id: now,
            userMsg: msg,
            charName: _ctx.bridge.getCharName(),
            charDesc: _getCharDesc(),
            sendAt: now + delaySec * 1000,
            status: 'pending',
            reply: '',
            repliedAt: null,
            expanded: false,
          };
          _capsules.push(capsule);
          await _save();
          _draftMsg = '';
          _draftDelay = '3600';
          _tab = 'pending';
          _statusText = '✓ 胶囊已封存，耐心等待吧';
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app13', '封存失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);
        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      // 删除胶囊
      const delBtn = e.target.closest('.f13-del-btn');
      if (delBtn) {
        const id = Number(delBtn.dataset.id);
        _capsules = _capsules.filter(c => c.id !== id);
        await _save();
        _render(); _bindEvents(_container);
        return;
      }

      // 展开/收起
      const expandBtn = e.target.closest('.f13-expand-btn');
      if (expandBtn) {
        const id = Number(expandBtn.dataset.id);
        const item = _capsules.find(c => c.id === id);
        if (item) {
          item.expanded = !item.expanded;
          _render(); _bindEvents(_container);
        }
        return;
      }
    };

    container.addEventListener('click', _clickHandler);
  }

  // ── 公开接口 ──
  return {
    id: 'capsule',
    name: '时光胶囊',
    icon: '💌',

    async init(ctx) {
      _ctx = ctx;
      await _load();

      // 启动后台调度，每 60 秒检查一次
      _intervalId = setInterval(() => _checkPending(), 60 * 1000);
      // 启动时立即检查一次（处理上次关闭期间到期的胶囊）
      _checkPending();
    },

    async mount(container) {
      _container = container;
      _container.innerHTML = `
        <div class="freq-loading">
          <div class="freq-loading-dot"></div>
          <div class="freq-loading-dot"></div>
          <div class="freq-loading-dot"></div>
        </div>`;
      await _load();
      _render();
      _bindEvents(_container);
    },

    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      _container = null;
    },

    destroy() {
      if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
    },
  };
})();
// ============================================================ end block_22
// ============================================================
// block_16 — App07 · 打卡日志
// ============================================================
const App07Checkin = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;

  //── 状态变量 ──
  let _tab = 'user';          // 'user' | 'char'
  let _userGoals = [];        // [{id,name,charName,charDesc,createdAt,records:[{date,done}],comments:[{date,text}]}]
  let _charGoals = [];        // [{id,name,charName,charDesc,createdAt,streak,logs:[{date,status,text}]}]
  let _loading = false;
  let _statusText = '';
  let _showNewGoalForm = false;
  let _showCharGoalForm = false;
  let _charGoalMode = '';// 'ai' | 'user'
  let _newGoalInput = '';
  let _newCharGoalInput = '';
  let _selectedGoalId = null; // 当前展开查看的目标
  let _commentLoadingGoalId = null;

  // ── 常量 ──
  const STORE_USER = 'app07_user_goals';
  const STORE_CHAR = 'app07_char_goals';
  const STORE_LAST_CHAR_REFRESH = 'app07_last_char_refresh';
  const MILESTONES = [7, 14, 30, 100];
  const BREAK_DAYS = 2;

  // ── 工具函数 ──
  function _escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function _getCharDesc() {
    try {
      const chid = window.this_chid;
      const chars = window.characters;
      if (chid == null || !chars || !chars[chid]) return '';
      const c = chars[chid];
      return [c.description, c.personality, c.scenario].filter(Boolean).join('\n').slice(0, 800);
    } catch (e) { return ''; }
  }

  //计算连续打卡天数（从今天往回数）
  function _calcStreak(records) {
    if (!records || records.length === 0) return 0;
    const sorted = [...records].filter(r => r.done).map(r => r.date).sort().reverse();
    if (sorted.length === 0) return 0;

    const today = _todayStr();
    let streak = 0;
    let checkDate = today;

    // 如果今天还没打卡，从昨天开始算
    if (sorted[0] !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      checkDate = yesterday.toISOString().slice(0, 10);
    }

    for (let i = 0; i < 400; i++) {
      if (sorted.includes(checkDate)) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
      } else {
        break;
      }
    }
    return streak;
  }

  // 计算断签天数
  function _calcBreakDays(records) {
    if (!records || records.length === 0) return 0;
    const sorted = [...records].filter(r => r.done).map(r => r.date).sort().reverse();
    if (sorted.length === 0) return 0;
    const lastDate = new Date(sorted[0]);
    const today = new Date(_todayStr());
    const diff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return diff;
  }

  // 总打卡天数
  function _calcTotal(records) {
    if (!records) return 0;
    return records.filter(r => r.done).length;
  }

  // 检测里程碑
  function _checkMilestone(streak) {
    return MILESTONES.includes(streak);
  }

  // ── 持久化 ──
  async function _saveUserGoals() {
    await _ctx.store.set(STORE_USER, _userGoals);
  }
  async function _saveCharGoals() {
    await _ctx.store.set(STORE_CHAR, _charGoals);
  }
  async function _loadAll() {
    _userGoals = (await _ctx.store.get(STORE_USER)) || [];
    _charGoals = (await _ctx.store.get(STORE_CHAR)) || [];
  }

  // ── 副API调用 ──

  // User打卡后获取char评论
  async function _fetchComment(goal) {
    const streak = _calcStreak(goal.records);
    const total = _calcTotal(goal.records);
    const breakDays = _calcBreakDays(goal.records);
    const todayDone = goal.records.some(r => r.date === _todayStr() && r.done);

    let specialEvent = '无';
    if (breakDays >= BREAK_DAYS) {
      specialEvent = `断签${breakDays}天`;
    } else if (_checkMilestone(streak)) {
      specialEvent = `里程碑：连续${streak}天`;
    }

    const messages = _ctx.subapi.buildMessages('app07_comment', {
      char_name: goal.charName || _ctx.bridge.getCharName(),
      char_desc: goal.charDesc || _getCharDesc(),
      goal_name: goal.name,
      streak: String(streak),
      total: String(total),
      today_status: todayDone ? '已打卡' : '未打卡',
      special_event: specialEvent,
    });
    const raw = await _ctx.subapi.call(messages, { maxTokens: 200, temperature: 0.9 });
    const results = _ctx.subapi.parseResponse(raw, 'checkin_comment');
    return results.length > 0 ? results[0] : _ctx.subapi.safeParseText(raw);
  }

  // Char每日打卡
  async function _fetchCharCheckin(charGoal) {
    const messages = _ctx.subapi.buildMessages('app07_char_checkin', {
      char_name: charGoal.charName || _ctx.bridge.getCharName(),
      char_desc: charGoal.charDesc || _getCharDesc(),
      char_goal: charGoal.name,
      char_streak: String(charGoal.streak || 0),
    });
    const raw = await _ctx.subapi.call(messages, { maxTokens: 200, temperature: 0.95 });
    const statusArr = _ctx.subapi.parseResponse(raw, 'char_checkin_status');
    const logArr = _ctx.subapi.parseResponse(raw, 'char_checkin_log');
    const status = statusArr.length > 0 ? statusArr[0].trim() : 'done';
    const log = logArr.length > 0 ? logArr[0] : _ctx.subapi.safeParseText(raw);
    return { status, log };
  }

  // Char目标生成/拒绝
  async function _fetchCharGoalResponse(mode, userSuggestion) {
    let taskContext, taskInstruction;
    if (mode === 'ai') {
      taskContext = `请为自己设定一个适合你性格的每日打卡目标。`;
      taskInstruction = `想一个你会坚持（或者试图坚持）的日常小目标，用一句话描述这个目标。要符合你的性格和生活方式。`;
    } else {
      taskContext = `${_ctx.bridge.getUserName()}建议你设定一个打卡目标：「${userSuggestion}」`;
      taskInstruction = `你有大约60%的概率接受这个建议，40%的概率拒绝。
如果接受：回复"【接受】"开头，然后用你的语气说一句接受的话。
如果拒绝：回复"【拒绝】"开头，然后用你的语气说出拒绝的理由，并提出你自己想做的目标（用「」括起来）。`;
    }
    const messages = _ctx.subapi.buildMessages('app07_char_goal', {
      char_name: _ctx.bridge.getCharName(),
      char_desc: _getCharDesc(),
      task_context: taskContext,
      task_instruction: taskInstruction,
    });
    const raw = await _ctx.subapi.call(messages, { maxTokens: 250, temperature: 0.9 });
    const results = _ctx.subapi.parseResponse(raw, 'char_goal_response');
    return results.length > 0 ? results[0] : _ctx.subapi.safeParseText(raw);
  }

  // ── 每日自动刷新char打卡 ──
  async function _dailyCharRefresh() {
    const today = _todayStr();
    const lastRefresh = await _ctx.store.get(STORE_LAST_CHAR_REFRESH);
    if (lastRefresh === today) return;

    for (const cg of _charGoals) {
      const alreadyLogged = cg.logs && cg.logs.some(l => l.date === today);
      if (alreadyLogged) continue;
      try {
        const result = await _fetchCharCheckin(cg);
        if (!cg.logs) cg.logs = [];
        cg.logs.push({ date: today, status: result.status, text: result.log });
        if (result.status === 'done') {
          cg.streak = (cg.streak || 0) + 1;
        } else if (result.status === 'skip') {
          cg.streak = 0;
        }
        // half：不断签但也不累加streak
      } catch (err) {
        _ctx.log.warn('app07', `char打卡生成失败: ${cg.name}`, err.message);
      }
    }
    await _saveCharGoals();
    await _ctx.store.set(STORE_LAST_CHAR_REFRESH, today);

    if (_charGoals.length > 0) {
      _ctx.notify.push('checkin', '📅', '打卡日志', `${_charGoals[0].charName || '角色'}今天也打卡了，去看看吧`);
    }
  }

  // ── 渲染 ──
  function _render() {
    if (!_container) return;
    _container.innerHTML = `
      <div class="f07-wrap">
        <div class="f07-tabs">
          <div class="f07-tab ${_tab === 'user' ? 'f07-tab--active' : ''}" data-tab="user">📋 我的打卡</div>
          <div class="f07-tab ${_tab === 'char' ? 'f07-tab--active' : ''}" data-tab="char">🐾TA的打卡</div>
        </div>
        <div class="f07-content">
          ${_loading
            ? `<div class="freq-loading"><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div></div>`
            : (_tab === 'user' ? _renderUserTab() : _renderCharTab())
          }
        </div>
        ${_statusText ? `<div class="f07-status">${_escHtml(_statusText)}</div>` : ''}
      </div>`;
  }

  // ── User Tab ──
  function _renderUserTab() {
    let html = '';

    // 新建目标表单
    if (_showNewGoalForm) {
      const charName = _ctx.bridge.getCharName() || '角色';
      html += `
        <div class="f07-form">
          <div class="f07-form-title">📌 新建打卡目标</div>
          <input type="text" id="f07-goal-input" class="f07-input" placeholder="输入目标名称，如：每天喝水2L" maxlength="50" value="${_escHtml(_newGoalInput)}" />
          <div class="f07-form-hint">陪跑者：${_escHtml(charName)}</div>
          <div class="f07-form-actions">
            <button id="f07-btn-create-goal" class="f07-btn f07-btn--primary">✓ 创建</button>
            <button id="f07-btn-cancel-goal" class="f07-btn f07-btn--ghost">✕ 取消</button>
          </div>
        </div>`;}

    // 目标列表
    if (_userGoals.length === 0 && !_showNewGoalForm) {
      html += `<div class="freq-empty-state">还没有打卡目标<br/>点击下方按钮创建一个吧</div>`;
    }

    for (const goal of _userGoals) {
      const streak = _calcStreak(goal.records);
      const total = _calcTotal(goal.records);
      const breakDays = _calcBreakDays(goal.records);
      const todayDone = goal.records.some(r => r.date === _todayStr() && r.done);
      const isExpanded = _selectedGoalId === goal.id;
      const isMilestone = _checkMilestone(streak);
      const isBreak = breakDays >= BREAK_DAYS && !todayDone;

      html += `
        <div class="f07-goal-card ${isMilestone ? 'f07-goal--milestone' : ''} ${isBreak ? 'f07-goal--break' : ''}">
          <div class="f07-goal-header" data-goal-expand="${goal.id}">
            <div class="f07-goal-info">
              <div class="f07-goal-name">${_escHtml(goal.name)}</div>
              <div class="f07-goal-meta">
                🔥 ${streak}天连续 ·共${total}天
                ${isBreak ? `<span class="f07-break-badge">⚠ 断签${breakDays}天</span>` : ''}${isMilestone ? `<span class="f07-milestone-badge">🎉 里程碑!</span>` : ''}
              </div>
              <div class="f07-goal-char">陪跑：${_escHtml(goal.charName || '未知')}</div>
            </div>
            <div class="f07-goal-actions">
              ${todayDone
                ? `<span class="f07-checked">✅</span>`
                : `<button class="f07-btn f07-btn--checkin" data-checkin="${goal.id}">打卡</button>`
              }</div>
          </div>
          ${isExpanded ? _renderGoalDetail(goal, streak, total, breakDays) : ''}
          <div class="f07-expand-hint" data-goal-expand="${goal.id}">${isExpanded ? '收起 ▴' : '展开详情 ▾'}</div>
        </div>`;
    }

    // 底部操作栏
    if (!_showNewGoalForm) {
      html += `
        <div class="f07-bottom-bar">
          <button id="f07-btn-new-goal" class="f07-btn f07-btn--primary">＋ 新建目标</button>
        </div>`;
    }

    return html;
  }

  //目标详情（展开后）
  function _renderGoalDetail(goal, streak, total, breakDays) {
    // 最近7天打卡日历
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const done = goal.records.some(r => r.date === dateStr && r.done);
      const dayLabel = d.getDate();
      const weekDay = ['日','一','二','三','四','五','六'][d.getDay()];
      days.push({ dateStr, done, dayLabel, weekDay });
    }

    let calendarHtml = `<div class="f07-calendar">
      <div class="f07-calendar-title">最近7天</div>
      <div class="f07-calendar-row">
        ${days.map(d => `
          <div class="f07-calendar-day ${d.done ? 'f07-day--done' : ''} ${d.dateStr === _todayStr() ? 'f07-day--today' : ''}">
            <span class="f07-day-num">${d.dayLabel}</span>
            <span class="f07-day-week">${d.weekDay}</span>
            <span class="f07-day-dot">${d.done ? '●' : '○'}</span>
          </div>
        `).join('')}
      </div>
    </div>`;

    // Char 评论列表
    let commentsHtml = '';
    if (goal.comments && goal.comments.length > 0) {
      const recentComments = goal.comments.slice(-5).reverse();
      commentsHtml = `<div class="f07-comments">
        <div class="f07-comments-title">💬 ${_escHtml(goal.charName || '角色')}的评论</div>
        ${recentComments.map(c => `
          <div class="f07-comment-bubble">
            <div class="f07-comment-date">${_escHtml(c.date)}</div>
            <div class="f07-comment-text">${_escHtml(c.text)}</div>
          </div>
        `).join('')}
      </div>`;
    }

    // 刷新评论按钮
    const isCommentLoading = _commentLoadingGoalId === goal.id;
    let refreshBtn = `<button class="f07-btn f07-btn--small" data-refresh-comment="${goal.id}" ${isCommentLoading ? 'disabled' : ''}>
      ${isCommentLoading ? '⏳ 生成中…' : '💬 获取评论'}
    </button>`;

    // 删除目标按钮
    let deleteBtn = `<button class="f07-btn f07-btn--danger f07-btn--small" data-delete-goal="${goal.id}">🗑 删除目标</button>`;

    return `
      <div class="f07-goal-detail">
        ${calendarHtml}
        ${commentsHtml}
        <div class="f07-detail-actions">
          ${refreshBtn}
          ${deleteBtn}
        </div>
      </div>`;
  }

  // ── Char Tab ──
  function _renderCharTab() {
    let html = '';

    // 新建char目标表单
    if (_showCharGoalForm) {
      if (!_charGoalMode) {
        html += `
          <div class="f07-form">
            <div class="f07-form-title">🐾 为TA设定打卡目标</div>
            <div class="f07-form-hint">选择设定方式：</div>
            <div class="f07-form-actions f07-form-actions--col">
              <button id="f07-btn-char-goal-ai" class="f07-btn f07-btn--primary">🎲 让TA自己决定</button>
              <button id="f07-btn-char-goal-user" class="f07-btn f07-btn--primary">✏️ 我来建议</button>
              <button id="f07-btn-cancel-char-goal" class="f07-btn f07-btn--ghost">✕ 取消</button>
            </div>
          </div>`;
      } else if (_charGoalMode === 'user') {
        html += `
          <div class="f07-form">
            <div class="f07-form-title">✏️ 建议TA的打卡目标</div>
            <input type="text" id="f07-char-goal-input" class="f07-input" placeholder="输入你建议的目标" maxlength="50" value="${_escHtml(_newCharGoalInput)}" />
            <div class="f07-form-hint">TA有可能会拒绝哦~</div>
            <div class="f07-form-actions">
              <button id="f07-btn-submit-char-goal" class="f07-btn f07-btn--primary">📤 提交建议</button>
              <button id="f07-btn-cancel-char-goal" class="f07-btn f07-btn--ghost">✕ 取消</button>
            </div>
          </div>`;
      }
    }

    // Char 目标列表
    if (_charGoals.length === 0 && !_showCharGoalForm) {
      html += `<div class="freq-empty-state">TA还没有打卡目标<br/>帮TA设定一个吧</div>`;
    }

    for (const cg of _charGoals) {
      const isExpanded = _selectedGoalId === cg.id;
      const recentLogs = (cg.logs || []).slice(-7).reverse();
      const todayLog = (cg.logs || []).find(l => l.date === _todayStr());

      html += `
        <div class="f07-goal-card f07-goal-card--char">
          <div class="f07-goal-header" data-goal-expand="${cg.id}">
            <div class="f07-goal-info">
              <div class="f07-goal-name">${_escHtml(cg.name)}</div>
              <div class="f07-goal-meta">
                🔥 ${cg.streak || 0}天连续 · ${_escHtml(cg.charName || '角色')}</div>
              ${todayLog ? `<div class="f07-today-status f07-status--${todayLog.status}">
                ${todayLog.status === 'done' ? '✅ 今日完成' : todayLog.status === 'half' ? '😅 敷衍了事' : '💤 今日摸鱼'}
              </div>` : `<div class="f07-today-status f07-status--pending">⏳ 今日待更新</div>`}
            </div>
          </div>
          ${isExpanded ? _renderCharGoalDetail(cg, recentLogs) : ''}
          <div class="f07-expand-hint" data-goal-expand="${cg.id}">${isExpanded ? '收起 ▴' : '查看记录 ▾'}</div>
        </div>`;
    }

    // 底部操作栏
    if (!_showCharGoalForm) {
      html += `
        <div class="f07-bottom-bar">
          <button id="f07-btn-new-char-goal" class="f07-btn f07-btn--primary">＋ 为TA设定目标</button>
        </div>`;
    }

    return html;
  }

  // Char目标详情
  function _renderCharGoalDetail(cg, recentLogs) {
    let logsHtml = '';
    if (recentLogs.length > 0) {
      logsHtml = recentLogs.map(l => {
        const statusIcon = l.status === 'done' ? '✅' : l.status === 'half' ? '😅' : '💤';
        return `
          <div class="f07-char-log">
            <div class="f07-char-log-head">
              <span class="f07-char-log-date">${_escHtml(l.date)}</span>
              <span>${statusIcon}</span>
            </div>
            <div class="f07-char-log-text">${_escHtml(l.text)}</div>
          </div>`;
      }).join('');
    } else {
      logsHtml = `<div class="f07-no-logs">暂无打卡记录</div>`;
    }

    return `
      <div class="f07-goal-detail">
        <div class="f07-char-logs-title">📝 最近记录</div>
        ${logsHtml}
        <div class="f07-detail-actions">
          <button class="f07-btn f07-btn--danger f07-btn--small" data-delete-char-goal="${cg.id}">🗑 删除目标</button>
        </div>
      </div>`;
  }

  // ── 事件绑定 ──
  function _bindEvents(container) {
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    _clickHandler = async (e) => {
      const target = e.target;

      // Tab切换
      const tabEl = target.closest('.f07-tab');
      if (tabEl) {
        const newTab = tabEl.dataset.tab;
        if (newTab && newTab !== _tab) {
          _tab = newTab;
          _selectedGoalId = null;
          _showNewGoalForm = false;
          _showCharGoalForm = false;
          _charGoalMode = '';
          _render(); _bindEvents(_container);
        }
        return;
      }

      // 展开/收起目标
      const expandEl = target.closest('[data-goal-expand]');
      if (expandEl) {
        const gid = Number(expandEl.dataset.goalExpand);
        _selectedGoalId = _selectedGoalId === gid ? null : gid;
        _render(); _bindEvents(_container);return;
      }

      //── User Tab 事件 ──

      // 新建目标
      if (target.id === 'f07-btn-new-goal') {
        _showNewGoalForm = true;
        _newGoalInput = '';
        _render(); _bindEvents(_container);
        const inp = _container.querySelector('#f07-goal-input');
        if (inp) inp.focus();
        return;
      }

      // 取消新建
      if (target.id === 'f07-btn-cancel-goal') {
        _showNewGoalForm = false;
        _render(); _bindEvents(_container);
        return;
      }

      // 创建目标
      if (target.id === 'f07-btn-create-goal') {
        const inp = _container.querySelector('#f07-goal-input');
        const name = inp ? inp.value.trim() : '';
        if (!name) {
          _statusText = '⚠ 请输入目标名称';
          _render(); _bindEvents(_container);
          setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
          return;
        }
        const goal = {
          id: Date.now(),
          name,
          charName: _ctx.bridge.getCharName(),
          charDesc: _getCharDesc(),
          createdAt: _todayStr(),
          records: [],
          comments: [],};
        _userGoals.unshift(goal);
        await _saveUserGoals();
        _showNewGoalForm = false;
        _statusText = '✓ 目标创建成功';
        _render(); _bindEvents(_container);
        setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
        return;
      }

      // 打卡
      const checkinBtn = target.closest('[data-checkin]');
      if (checkinBtn) {
        const gid = Number(checkinBtn.dataset.checkin);
        const goal = _userGoals.find(g => g.id === gid);
        if (goal) {
          const today = _todayStr();
          if (!goal.records.some(r => r.date === today)) {
            goal.records.push({ date: today, done: true });
            await _saveUserGoals();_statusText = '✓ 今日打卡成功！';
            _ctx.log.info('app07', `打卡: ${goal.name}`);
          }
        }
        _render(); _bindEvents(_container);
        setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
        return;
      }

      // 获取评论
      const refreshCommentBtn = target.closest('[data-refresh-comment]');
      if (refreshCommentBtn) {
        const gid = Number(refreshCommentBtn.dataset.refreshComment);
        const goal = _userGoals.find(g => g.id === gid);
        if (!goal) return;

        _commentLoadingGoalId = gid;
        _render(); _bindEvents(_container);

        try {
          const comment = await _fetchComment(goal);
          if (!goal.comments) goal.comments = [];
          goal.comments.push({ date: _todayStr(), text: comment });
          await _saveUserGoals();
          _statusText = '✓ 评论已生成';
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app07', '评论生成失败', err.message);
        }

        _commentLoadingGoalId = null;
        if (!_container) return;
        _render(); _bindEvents(_container);setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      // 删除目标
      const deleteBtn = target.closest('[data-delete-goal]');
      if (deleteBtn) {
        const gid = Number(deleteBtn.dataset.deleteGoal);
        _userGoals = _userGoals.filter(g => g.id !== gid);
        await _saveUserGoals();
        _selectedGoalId = null;
        _statusText = '✓ 目标已删除';
        _render(); _bindEvents(_container);
        setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
        return;
      }

      //── Char Tab 事件 ──

      // 新建char目标
      if (target.id === 'f07-btn-new-char-goal') {
        _showCharGoalForm = true;
        _charGoalMode = '';
        _render(); _bindEvents(_container);
        return;
      }

      // 取消char目标
      if (target.id === 'f07-btn-cancel-char-goal') {
        _showCharGoalForm = false;
        _charGoalMode = '';
        _render(); _bindEvents(_container);
        return;
      }

      // AI自动生成char目标
      if (target.id === 'f07-btn-char-goal-ai') {
        _loading = true;
        _statusText = '⏳ 正在让TA想一个目标…';
        _render(); _bindEvents(_container);

        try {
          const response = await _fetchCharGoalResponse('ai', '');
          const charGoal = {
            id: Date.now(),
            name: response.replace(/^[「『【]|[」』】]$/g, '').trim().slice(0, 50),
            charName: _ctx.bridge.getCharName(),
            charDesc: _getCharDesc(),
            createdAt: _todayStr(),
            streak: 0,
            logs: [],
            aiResponse: response,
          };
          _charGoals.unshift(charGoal);
          await _saveCharGoals();
          _showCharGoalForm = false;
          _charGoalMode = '';
          _statusText = '✓ TA决定了自己的目标';
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app07', 'char目标生成失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);
        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      // User建议模式
      if (target.id === 'f07-btn-char-goal-user') {
        _charGoalMode = 'user';
        _newCharGoalInput = '';
        _render(); _bindEvents(_container);
        const inp = _container.querySelector('#f07-char-goal-input');
        if (inp) inp.focus();
        return;
      }

      // 提交User建议
      if (target.id === 'f07-btn-submit-char-goal') {
        const inp = _container.querySelector('#f07-char-goal-input');
        const suggestion = inp ? inp.value.trim() : '';
        if (!suggestion) {
          _statusText = '⚠ 请输入建议的目标';
          _render(); _bindEvents(_container);
          setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
          return;
        }

        _loading = true;
        _statusText = '⏳ 正在等待TA的回应…';
        _render(); _bindEvents(_container);

        try {
          const response = await _fetchCharGoalResponse('user', suggestion);
          const accepted = response.includes('【接受】');

          if (accepted) {
            const charGoal = {
              id: Date.now(),
              name: suggestion,
              charName: _ctx.bridge.getCharName(),
              charDesc: _getCharDesc(),
              createdAt: _todayStr(),
              streak: 0,
              logs: [],
              aiResponse: response.replace('【接受】', '').trim(),
            };
            _charGoals.unshift(charGoal);
            await _saveCharGoals();
            _showCharGoalForm = false;
            _charGoalMode = '';
            _statusText = '✓ TA接受了你的建议！';
          } else {
            // 拒绝了，尝试提取TA自己想做的目标
            const altMatch = response.match(/「(.+?)」/);
            if (altMatch) {
              const charGoal = {
                id: Date.now(),
                name: altMatch[1],
                charName: _ctx.bridge.getCharName(),
                charDesc: _getCharDesc(),
                createdAt: _todayStr(),
                streak: 0,
                logs: [],
                aiResponse: response.replace('【拒绝】', '').trim(),
              };
              _charGoals.unshift(charGoal);
              await _saveCharGoals();
              _showCharGoalForm = false;
              _charGoalMode = '';
              _statusText = `⚠ TA拒绝了，但自己选了：${altMatch[1]}`;
            } else {
              _showCharGoalForm = false;
              _charGoalMode = '';
              _statusText = `⚠ TA拒绝了：${response.replace('【拒绝】', '').trim().slice(0, 40)}`;
            }
          }
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app07', 'char目标建议失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);
        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 5000);
        return;
      }

      // 删除char目标
      const deleteCharBtn = target.closest('[data-delete-char-goal]');
      if (deleteCharBtn) {
        const gid = Number(deleteCharBtn.dataset.deleteCharGoal);
        _charGoals = _charGoals.filter(g => g.id !== gid);
        await _saveCharGoals();
        _selectedGoalId = null;
        _statusText = '✓ 目标已删除';
        _render(); _bindEvents(_container);
        setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
        return;
      }
    };container.addEventListener('click', _clickHandler);

    // input实时同步（防止 render 后丢失输入）
    const goalInput = container.querySelector('#f07-goal-input');
    if (goalInput) {
      goalInput.addEventListener('input', (e) => { _newGoalInput = e.target.value; });
    }const charGoalInput = container.querySelector('#f07-char-goal-input');
    if (charGoalInput) {
      charGoalInput.addEventListener('input', (e) => { _newCharGoalInput = e.target.value; });
    }
  }

  // ── 公开接口 ──
  return {
    id: 'checkin',
    name: '打卡日志',
    icon: '📅',

    init(ctx) {
      _ctx = ctx;
      // 后台加载数据并尝试每日char刷新
      _loadAll().then(() => {
        _dailyCharRefresh().catch(err => {
          _ctx.log.warn('app07', '每日char打卡刷新失败', err.message);
        });
      });
    },

    async mount(container) {
      _container = container;
      _container.innerHTML = `<div class="freq-loading">
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
      </div>`;

      await _loadAll();
      _render();
      _bindEvents(_container);
    },

    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      _container = null;
    },
  };
})();

// ============================================================
// block_17 — App08 · 日程表
// ============================================================
const App08Calendar = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;
  let _reminderTimer = null;

  // ── 状态 ──
  let _viewDate = new Date();
  let _selectedDate = null;
  let _userEvents = [];
  let _charEvents = [];
  let _loading = false;
  let _statusText = '';
  let _activeTab = 'calendar';
  let _addForm = { date: '', time: '', title: '', note: '' };
  let _selectedCharName = null;       // null = 当前主聊天角色，否则为角色名字
  let _notifiedIds = new Set();
  let _charListCache = null;
  let _charListCacheTime = 0;

  // ── 常量 ──
  const STORE_KEY_USER   = 'app08_user_events';
  const STORE_KEY_CHAR   = 'app08_char_events';
  const STORE_KEY_CONFIG = 'app08_config';
  const WEEKDAYS = ['日','一','二','三','四','五','六'];
  const CHAR_CACHE_TTL = 60 * 1000;

  // ── 工具 ──
  function _escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _today() { return _dateStr(new Date()); }

  function _dateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function _timeStr(d) {
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

    function _parseDateTime(dateStr, timeStr) {
    const t = timeStr || '00:00';
    return new Date(`${dateStr}T${t}:00`);
  }

  //── 角色列表获取（多重回退）──
  async function _fetchCharListFromAPI() {
    try {
      const now = Date.now();
      if (_charListCache && (now - _charListCacheTime) < CHAR_CACHE_TTL) {
        return _charListCache;
      }

      let chars = null;

      // 优先级1：SillyTavern.getContext()
      try {
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
          const stCtx = SillyTavern.getContext();
          if (stCtx.characters && Array.isArray(stCtx.characters) && stCtx.characters.length > 0) {
            chars = stCtx.characters;
            _ctx.log.info('app08', '通过 SillyTavern.getContext() 获取角色列表');
          }
        }
      } catch (e) {}

      // 优先级2：全局 getContext()
      if (!chars) {
        try {
          if (typeof getContext === 'function') {
            const stCtx = getContext();
            if (stCtx.characters && Array.isArray(stCtx.characters) && stCtx.characters.length > 0) {
              chars = stCtx.characters;
              _ctx.log.info('app08', '通过 getContext() 获取角色列表');
            }
          }
        } catch (e) {}
      }

      // 优先级3：window.characters
      if (!chars) {
        if (window.characters && Array.isArray(window.characters) && window.characters.length > 0) {
          chars = window.characters;
          _ctx.log.info('app08', '通过 window.characters 获取角色列表');
        }
      }

      if (!chars || chars.length === 0) {
        _ctx.log.warn('app08', '未能获取角色列表');
        return [];
      }

      const list = [];
      for (const c of chars) {
        if (!c || !c.name) continue;
        list.push({
          name: c.name,
          avatar: c.avatar || '',
          description: c.description || '',
          personality: c.personality || '',
          scenario: c.scenario || '',
        });
      }

      _charListCache = list;
      _charListCacheTime = now;
      _ctx.log.info('app08', `角色列表已加载: ${list.length} 个角色`);
      return list;
    } catch (e) {
      _ctx.log.error('app08', '获取角色列表异常', e.message);
      return [];
    }
  }

  function _getSelectedCharName() {
    if (_selectedCharName) return _selectedCharName;
    return _ctx.bridge.getCharName();
  }

  function _getSelectedCharDesc() {
    const targetName = _getSelectedCharName();
    if (_charListCache) {
      const c = _charListCache.find(ch => ch.name === targetName);
      if (c) {
        return [c.description, c.personality, c.scenario]
          .filter(Boolean).join('\n').slice(0, 800);
      }
    }
    try {
      const chid = window.this_chid;
      const chars = window.characters;
      if (chid != null && chars && chars[chid]) {
        const c = chars[chid];
        return [c.description, c.personality, c.scenario]
          .filter(Boolean).join('\n').slice(0, 800);
      }
    } catch (e) {}
    return '';
  }

  // ── 持久化 ──

  async function _loadData() {
    try {
      const [u, c, cfg] = await Promise.all([
        _ctx.store.get(STORE_KEY_USER),
        _ctx.store.get(STORE_KEY_CHAR),
        _ctx.store.get(STORE_KEY_CONFIG),
      ]);
      _userEvents = Array.isArray(u) ? u : [];
      _charEvents = Array.isArray(c) ? c : [];
      if (cfg) {
        if (cfg.selectedCharName !== undefined) _selectedCharName = cfg.selectedCharName;
      }
    } catch (e) {
      _ctx.log.error('app08', '加载数据失败', e.message);
    }
  }

  async function _saveUserEvents() {
    await _ctx.store.set(STORE_KEY_USER, _userEvents);
  }

  async function _saveCharEvents() {
    await _ctx.store.set(STORE_KEY_CHAR, _charEvents);
  }

  async function _saveConfig() {
    await _ctx.store.set(STORE_KEY_CONFIG, { selectedCharName: _selectedCharName });
  }

  // ── Event 字段解析（辅助）──
  function _parseEventFields(msgs) {
    const events = [];
    const today = _today();
    const eventRe = /<event>([\s\S]*?)<\/event>/gi;
    for (const msg of msgs) {
      if (!msg.mes) continue;
      let m;
      while ((m = eventRe.exec(msg.mes)) !== null) {
        const raw = m[1].trim();
        const dateMatch = raw.match(/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/);
        const timeMatch = raw.match(/(\d{1,2}:\d{2})/);
        const date = dateMatch
          ? dateMatch[1].replace(/\//g, '-').replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, mo, d) =>
              `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
          : today;
        const time = timeMatch ? timeMatch[1] : '';
        const title = raw.replace(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/, '').replace(/\d{1,2}:\d{2}/, '').trim() || raw;
        events.push({
          id: `event_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          date, time, title,type: 'appointment',
          source: 'event_field',
          charName: _getSelectedCharName(),
          createdAt: Date.now(),
          reminded: false,
        });
      }
    }
    return events;
  }

  // ── 副API：生成角色日程 ──
  async function _fetchCharSchedule() {
    const charName = _getSelectedCharName();
    const charDesc = _getSelectedCharDesc();
    const recentMsgs = _ctx.bridge.getRecentMessages(20);
    const recentText = recentMsgs.map(m => `${m.name}: ${m.mes}`).join('\n').slice(0, 1500);
    const now = new Date();
    const monthStr = `${now.getFullYear()}年${now.getMonth()+1}月`;

    const messages = _ctx.subapi.buildMessages('app08_char_schedule', {
      char_name: charName,
      char_desc: charDesc,
      recent_chat: recentText,
      month_str: monthStr,
      today_str: _today(),});

    const raw = await _ctx.subapi.call(messages, { maxTokens: 600, temperature: 0.85 });
    const items = _ctx.subapi.parseResponse(raw, 'schedule_item');

    const newEvents = [];
    for (const item of items) {
      const parts = item.split('|').map(s => s.trim());
      if (parts.length < 3) continue;
      const [date, time, title, typeRaw] = parts;
      if (!date || !title) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      newEvents.push({
        id: `char_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        date, time: time || '',
        title,
        type: (typeRaw === 'appointment') ? 'appointment' : 'daily',
        source: 'api',
        charName,
        createdAt: Date.now(),
        reminded: false,
      });
    }
    return newEvents;
  }

  // ── 副 API：角色对User 日程的提醒语 ──
  async function _fetchCharReminder(userEvent) {
    const charName = _getSelectedCharName();
    const charDesc = _getSelectedCharDesc();
    const messages = _ctx.subapi.buildMessages('app08_user_reminder', {
      char_name: charName,
      char_desc: charDesc,
      event_title: userEvent.title,
      event_date: userEvent.date,
      event_time: userEvent.time || '未指定时间',
      event_note: userEvent.note || '',
    });
    const raw = await _ctx.subapi.call(messages, { maxTokens: 200, temperature: 0.9 });
    return _ctx.subapi.safeParseText(raw);
  }

  // ── 副 API：自动扫描对话中的约定 ──
  async function _autoScanAppointments() {
    const charName = _getSelectedCharName();
    const charDesc = _getSelectedCharDesc();
    const recentMsgs = _ctx.bridge.getRecentMessages(30);
    const recentText = recentMsgs.map(m => `${m.name}: ${m.mes}`).join('\n').slice(0, 2000);

    const eventFieldItems = _parseEventFields(recentMsgs);

    const messages = _ctx.subapi.buildMessages('app08_scan_appointments', {
      char_name: charName,
      char_desc: charDesc,
      recent_chat: recentText,
      today_str: _today(),
    });
    const raw = await _ctx.subapi.call(messages, { maxTokens: 400, temperature: 0.7 });
    const items = _ctx.subapi.parseResponse(raw, 'appointment');

    const newEvents = [...eventFieldItems];
    for (const item of items) {
      if (item.toLowerCase() === 'none') continue;
      const parts = item.split('|').map(s => s.trim());
      if (parts.length < 2) continue;
      const [date, time, title] = parts;
      if (!date || !title) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      newEvents.push({
        id: `appt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        date, time: time || '',
        title,
        type: 'appointment',
        source: 'api_scan',
        charName,
        createdAt: Date.now(),
        reminded: false,
      });
    }

    const existingKeys = new Set(_charEvents.map(e => `${e.date}_${e.title}`));
    const deduped = newEvents.filter(e => !existingKeys.has(`${e.date}_${e.title}`));
    return deduped;
  }

  // ── 约定提醒定时器 ──
  function _startReminderTimer() {
    if (_reminderTimer) clearInterval(_reminderTimer);
    _reminderTimer = setInterval(() => _checkReminders(), 60 * 1000);
    _checkReminders();
  }

  function _checkReminders() {
    const now = new Date();
    const nowStr = _dateStr(now);
    const nowTime = _timeStr(now);

    for (const ev of _charEvents) {
      if (ev.reminded || ev.type !== 'appointment') continue;
      if (!ev.time) continue;
      if (ev.date === nowStr && ev.time <= nowTime) {
        if (!_notifiedIds.has(ev.id)) {
          _notifiedIds.add(ev.id);
          ev.reminded = true;
          _ctx.notify.push('calendar', '🗓️', `约定提醒·${ev.charName}`, ev.title);
          _saveCharEvents();
        }
      }
    }

    for (const ev of _userEvents) {
      if (ev.reminded) continue;
      if (!ev.time) continue;
      const evDt = _parseDateTime(ev.date, ev.time);
      const diffMin = (evDt - now) / 60000;
      if (diffMin <= 15&& diffMin > -1) {
        if (!_notifiedIds.has(ev.id)) {
          _notifiedIds.add(ev.id);
          ev.reminded = true;
          _ctx.notify.push('calendar', '🗓️', '日程提醒', ev.title);
          _saveUserEvents();
          _fetchCharReminder(ev).then(reminderText => {
            if (reminderText) {
              _ctx.notify.push('calendar', '💬', `${_getSelectedCharName()} 提醒你`, reminderText);
            }
          }).catch(() => {});
        }
      }
    }
  }

  // ── 月历数据计算 ──
  function _getMonthDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  }

  function _getDotsForDate(dateStr) {
    const hasUser = _userEvents.some(e => e.date === dateStr);
    const hasChar = _charEvents.some(e => e.date === dateStr);
    return { hasUser, hasChar };
  }

  // ── 渲染 ──
  function _render() {
    if (!_container) return;
    if (_activeTab === 'add') {
      _container.innerHTML = _renderAddForm();
    } else if (_activeTab === 'char-select') {
      _container.innerHTML = _renderCharSelect();
    } else {
      _container.innerHTML = _renderCalendar();
    }
  }

  function _renderCalendar() {
    const year = _viewDate.getFullYear();
    const month = _viewDate.getMonth();
    const { firstDay, daysInMonth } = _getMonthDays(year, month);
    const todayStr = _today();
    const charName = _getSelectedCharName();

    let cells = '';
    for (let i = 0; i < firstDay; i++) {
      cells += `<div class="f08-cell f08-cell-empty"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dots = _getDotsForDate(dateStr);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === _selectedDate;
      cells += `
        <div class="f08-cell ${isToday ? 'f08-cell-today' : ''} ${isSelected ? 'f08-cell-selected' : ''}"
             data-date="${dateStr}">
          <span class="f08-cell-num">${d}</span>
          <div class="f08-dots">
            ${dots.hasUser ? '<span class="f08-dot f08-dot-user"></span>' : ''}
            ${dots.hasChar ? '<span class="f08-dot f08-dot-char"></span>' : ''}
          </div>
        </div>`;
    }

    const dayDetail = _selectedDate ? _renderDayDetail(_selectedDate) : '';

    return `
      <div class="f08-wrap">
        <div class="f08-header">
          <button class="f08-nav-btn" id="f08-prev-month">‹</button>
          <span class="f08-month-title">${year}年${month+1}月</span>
          <button class="f08-nav-btn" id="f08-next-month">›</button>
          <button class="f08-char-btn" id="f08-open-char-select" title="选择角色">
            ${_escHtml(charName.length > 4 ? charName.slice(0,4) + '…' : charName)}▾
          </button>
        </div>

        <div class="f08-weekrow">
          ${WEEKDAYS.map(w => `<div class="f08-weekday">${w}</div>`).join('')}
        </div>

        <div class="f08-grid">${cells}</div>

        ${_selectedDate ? `
          <div class="f08-detail-wrap">
            <div class="f08-detail-header">
              <span class="f08-detail-date">${_selectedDate}</span>
              <button class="f08-add-btn" id="f08-open-add" data-date="${_selectedDate}">＋ 添加</button>
            </div>
            ${dayDetail}
          </div>` : `
          <div class="f08-hint">点击日期查看日程</div>`
        }

        <div class="f08-bottom-bar">
          <button class="f08-bottom-btn" id="f08-sync-char" ${_loading ? 'disabled' : ''}>🔄 同步角色日程</button>
          <button class="f08-bottom-btn" id="f08-scan-appt" ${_loading ? 'disabled' : ''}>🔍 扫描约定</button>
          ${_statusText ? `<span class="f08-status">${_escHtml(_statusText)}</span>` : ''}
        </div>
      </div>`;
  }

  function _renderDayDetail(dateStr) {
    const userEvs = _userEvents.filter(e => e.date === dateStr).sort((a,b) => (a.time||'99:99').localeCompare(b.time||'99:99'));
    const charEvs = _charEvents.filter(e => e.date === dateStr)
                               .sort((a,b) => (a.time||'99:99').localeCompare(b.time||'99:99'));

    // 检测共鸣时刻（User 和 Char 在同一时间段有日程）
    const resonanceTimes = new Set();
    for (const ue of userEvs) {
      for (const ce of charEvs) {
        if (ue.time && ce.time && ue.time === ce.time) {
          resonanceTimes.add(ue.time);
        }
      }
    }

    if (!userEvs.length && !charEvs.length) {
      return `<div class="f08-detail-empty">今天没有日程</div>`;
    }

    let html = '<div class="f08-detail-list">';

    for (const ev of userEvs) {
      const isResonance = ev.time && resonanceTimes.has(ev.time);
      html += `
        <div class="f08-event f08-event-user ${isResonance ? 'f08-event-resonance' : ''}" data-id="${ev.id}">
          <div class="f08-event-track f08-track-user"></div>
          <div class="f08-event-body">
            <div class="f08-event-top">
              <span class="f08-event-time">${ev.time || '全天'}</span>
              <span class="f08-event-title">${_escHtml(ev.title)}</span>${isResonance ? '<span class="f08-resonance-badge">✦ 共鸣</span>' : ''}
              <button class="f08-del-btn" data-type="user" data-id="${ev.id}">×</button>
            </div>
            ${ev.note ? `<div class="f08-event-note">${_escHtml(ev.note)}</div>` : ''}
          </div>
        </div>`;
    }

    for (const ev of charEvs) {
      const typeLabel = ev.type === 'appointment' ? '约定' : '日常';
      const sourceLabel = ev.source === 'event_field' ? '·Event' : '';
      const isResonance = ev.time && resonanceTimes.has(ev.time);
      html += `
        <div class="f08-event f08-event-char ${ev.type === 'appointment' ? 'f08-event-appt' : ''} ${isResonance ? 'f08-event-resonance' : ''}" data-id="${ev.id}">
          <div class="f08-event-track f08-track-char"></div>
          <div class="f08-event-body">
            <div class="f08-event-top">
              <span class="f08-event-time">${ev.time || '全天'}</span>
              <span class="f08-event-title">${_escHtml(ev.title)}</span>
              <span class="f08-event-tag">${typeLabel}${sourceLabel}</span>
              ${isResonance ? '<span class="f08-resonance-badge">✦ 共鸣</span>' : ''}
              <button class="f08-del-btn" data-type="char" data-id="${ev.id}">×</button>
            </div>
            <div class="f08-event-char-name">${_escHtml(ev.charName)}</div></div>
        </div>`;
    }

    html += '</div>';
    return html;
  }

  function _renderAddForm() {
    return `
      <div class="f08-wrap">
        <div class="f08-form-header">
          <button class="f08-back-btn" id="f08-back">← 返回</button>
          <span class="f08-form-title">添加日程</span>
        </div>
        <div class="f08-form-body">
          <div class="f08-form-row">
            <label class="f08-form-label">日期</label>
            <input class="f08-form-input" type="date" id="f08-input-date"
                   value="${_escHtml(_addForm.date || _today())}" />
          </div>
          <div class="f08-form-row">
            <label class="f08-form-label">时间</label>
            <input class="f08-form-input" type="time" id="f08-input-time"
                   value="${_escHtml(_addForm.time)}" />
          </div>
          <div class="f08-form-row">
            <label class="f08-form-label">标题</label>
            <input class="f08-form-input" type="text" id="f08-input-title"
                   placeholder="日程标题" value="${_escHtml(_addForm.title)}" maxlength="40" />
          </div>
          <div class="f08-form-row">
            <label class="f08-form-label">备注</label>
            <textarea class="f08-form-textarea" id="f08-input-note"
                      placeholder="可选备注" maxlength="200">${_escHtml(_addForm.note)}</textarea>
          </div><button class="f08-submit-btn" id="f08-submit-add" ${_loading ? 'disabled' : ''}>
            ${_loading ? '⏳ 保存中…' : '✓ 保存日程'}
          </button>${_statusText ? `<div class="f08-form-status">${_escHtml(_statusText)}</div>` : ''}
        </div>
      </div>`;
  }

  function _renderCharSelect() {
    const currentName = _selectedCharName;
    const currentCharName = _ctx.bridge.getCharName();

    if (!_charListCache) {
      return `
        <div class="f08-wrap">
          <div class="f08-form-header">
            <button class="f08-back-btn" id="f08-back">← 返回</button>
            <span class="f08-form-title">选择角色</span>
          </div>
          <div class="freq-loading">
            <div class="freq-loading-dot"></div>
            <div class="freq-loading-dot"></div>
            <div class="freq-loading-dot"></div>
          </div>
        </div>`;
    }

    const chars = _charListCache;
    return `
      <div class="f08-wrap">
        <div class="f08-form-header">
          <button class="f08-back-btn" id="f08-back">← 返回</button>
          <span class="f08-form-title">选择角色 (${chars.length})</span>
        </div>
        <div class="f08-char-list">
          <div class="f08-char-item ${currentName === null ? 'f08-char-active' : ''}"
               data-char-name="__current__">
            <span class="f08-char-avatar">🎙️</span>
            <span class="f08-char-name">当前对话角色 (${_escHtml(currentCharName)})</span>
            ${currentName === null ? '<span class="f08-char-check">✓</span>' : ''}
          </div>
          ${chars.map(c => `
            <div class="f08-char-item ${currentName === c.name ? 'f08-char-active' : ''}"
                 data-char-name="${_escHtml(c.name)}">
              <span class="f08-char-avatar">👤</span>
              <span class="f08-char-name">${_escHtml(c.name)}</span>
              ${currentName === c.name ? '<span class="f08-char-check">✓</span>' : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  // ── 事件绑定 ──
  function _bindEvents(container) {
    if (_clickHandler) container.removeEventListener('click', _clickHandler);

    _clickHandler = async (e) => {
      // 返回按钮
      if (e.target.id === 'f08-back') {
        _activeTab = 'calendar';
        _statusText = '';
        _render(); _bindEvents(_container);
        return;
      }

      // 上一月
      if (e.target.id === 'f08-prev-month') {
        _viewDate = new Date(_viewDate.getFullYear(), _viewDate.getMonth() - 1, 1);
        _render(); _bindEvents(_container);
        return;
      }

      // 下一月
      if (e.target.id === 'f08-next-month') {
        _viewDate = new Date(_viewDate.getFullYear(), _viewDate.getMonth() + 1, 1);
        _render(); _bindEvents(_container);
        return;
      }

      // 打开角色选择
      if (e.target.id === 'f08-open-char-select') {
        _activeTab = 'char-select';
        _render(); _bindEvents(_container);
        // 异步加载角色列表
        _fetchCharListFromAPI().then(() => {
          if (_container && _activeTab === 'char-select') {
            _render(); _bindEvents(_container);
          }
        });
        return;
      }

      // 选择角色
      const charItem = e.target.closest('.f08-char-item');
      if (charItem && charItem.dataset.charName !== undefined) {
        const rawName = charItem.dataset.charName;
        _selectedCharName = (rawName === '__current__') ? null : rawName;
        await _saveConfig();
        _activeTab = 'calendar';
        _render(); _bindEvents(_container);
        return;
      }

      // 点击日期格子
      const cell = e.target.closest('.f08-cell:not(.f08-cell-empty)');
      if (cell && cell.dataset.date) {
        const date = cell.dataset.date;
        _selectedDate = (_selectedDate === date) ? null : date;
        _render(); _bindEvents(_container);
        return;
      }

      // 打开添加表单
      if (e.target.id === 'f08-open-add') {
        _addForm = { date: e.target.dataset.date || _today(), time: '', title: '', note: '' };
        _activeTab = 'add';
        _statusText = '';
        _render(); _bindEvents(_container);
        return;
      }

      // 提交添加
      if (e.target.id === 'f08-submit-add') {
        const title = _addForm.title.trim();
        if (!title) {
          _statusText = '⚠ 请填写标题';
          _render(); _bindEvents(_container);
          setTimeout(() => { _statusText = ''; if (_container) { _render(); _bindEvents(_container); } }, 3000);
          return;
        }
        _loading = true;
        _statusText = '⏳ 保存中…';
        _render(); _bindEvents(_container);

        try {
          const newEv = {
            id: `user_${Date.now()}`,
            date: _addForm.date || _today(),
            time: _addForm.time || '',
            title: _addForm.title.trim(),
            note: _addForm.note.trim(),
            createdAt: Date.now(),
            reminded: false,
          };
          _userEvents.push(newEv);
          await _saveUserEvents();
          _selectedDate = newEv.date;
          _viewDate = new Date(newEv.date + 'T00:00:00');
          _activeTab = 'calendar';
          _statusText = '✓ 日程已保存';
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app08', '保存日程失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);
        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      // 删除日程
      const delBtn = e.target.closest('.f08-del-btn');
      if (delBtn) {
        const type = delBtn.dataset.type;
        const id = delBtn.dataset.id;
        if (type === 'user') {
          _userEvents = _userEvents.filter(ev => ev.id !== id);await _saveUserEvents();
        } else {
          _charEvents = _charEvents.filter(ev => ev.id !== id);
          await _saveCharEvents();
        }
        _render(); _bindEvents(_container);
        return;
      }

      // 同步角色日程
      if (e.target.id === 'f08-sync-char') {
        _loading = true;
        _statusText = '⏳ 正在同步角色日程…';
        _render(); _bindEvents(_container);

        try {
          const newEvents = await _fetchCharSchedule();
          const existingKeys = new Set(_charEvents.map(ev => `${ev.date}_${ev.title}`));
          const deduped = newEvents.filter(ev => !existingKeys.has(`${ev.date}_${ev.title}`));
          if (deduped.length > 0) {
            _charEvents.push(...deduped);
            await _saveCharEvents();
            _statusText = `✓ 已同步 ${deduped.length} 条角色日程`;
          } else {
            _statusText = '✓ 没有新的角色日程';
          }
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app08', '同步角色日程失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);
        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      // 扫描约定
      if (e.target.id === 'f08-scan-appt') {
        _loading = true;
        _statusText = '⏳ 正在扫描对话中的约定…';
        _render(); _bindEvents(_container);

        try {
          const newAppts = await _autoScanAppointments();
          if (newAppts.length > 0) {
            _charEvents.push(...newAppts);
            await _saveCharEvents();
            _statusText = `✓ 发现 ${newAppts.length} 条新约定`;
            for (const appt of newAppts) {
              _ctx.notify.push('calendar', '📌', `新约定·${appt.charName}`, `${appt.date} ${appt.time || ''} ${appt.title}`);
            }
          } else {
            _statusText = '✓ 未发现新约定';
          }
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app08', '扫描约定失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);
        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }
    };

    container.addEventListener('click', _clickHandler);

    // input/textarea 实时同步（坑15）
    if (_activeTab === 'add') {
      const dateInp = container.querySelector('#f08-input-date');
      const timeInp = container.querySelector('#f08-input-time');
      const titleInp = container.querySelector('#f08-input-title');
      const noteInp = container.querySelector('#f08-input-note');
      if (dateInp) dateInp.addEventListener('input', (e) => { _addForm.date = e.target.value; });
      if (timeInp) timeInp.addEventListener('input', (e) => { _addForm.time = e.target.value; });
      if (titleInp) titleInp.addEventListener('input', (e) => { _addForm.title = e.target.value; });
      if (noteInp) noteInp.addEventListener('input', (e) => { _addForm.note = e.target.value; });
    }
  }

  // ── 公开接口 ──
  return {
    id: 'calendar',
    name: '日程表',
    icon: '🗓️',

    init(ctx) {
      _ctx = ctx;
      _loadData().then(() => {
        _startReminderTimer();
        _ctx.log.info('app08', '日程表初始化完成', `User:${_userEvents.length} Char:${_charEvents.length}`);
      });
    },

    async mount(container) {
      _container = container;
      _container.innerHTML = `<div class="freq-loading">
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
      </div>`;
      await _loadData();
      _activeTab = 'calendar';
      _selectedDate = _today();
      _viewDate = new Date();
      _statusText = '';
      _render();
      _bindEvents(_container);
    },

    unmount() {
      if (_container && _clickHandler) {
        _container.removeEventListener('click', _clickHandler);
      }
      _container = null;
    },

    destroy() {
      if (_reminderTimer) clearInterval(_reminderTimer);
      _reminderTimer = null;
    },
  };
})();
// ============================================================ end block_17
//============================================================
// block_19 — App10 · 异界探索
// ============================================================
const App10Map = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;
  let _inputHandler = null;

  //── 状态 ──
  let _landmarks = [];
  let _loading = false;
  let _statusText = '';
  let _selectedLandmark = null;
  let _showAddForm = false;
  let _addNameInput = '';
  let _addDescInput = '';
  let _viewMode = 'map';  // 'map' | 'list'

  // ── 地图 ──
  let _terrainCanvas = null;
  let _terrainGenerated = false;
  let _noiseData = null;
  let _mapW = 600;
  let _mapH = 600;
  let _vpW = 300;
  let _vpH = 400;

  let _offsetX = 0;
  let _offsetY = 0;
  let _scale = 1;
  let _isDragging = false;
  let _dragStartX = 0;
  let _dragStartY = 0;
  let _dragStartOX = 0;
  let _dragStartOY = 0;
  let _touchStartDist = 0;
  let _touchStartScale = 1;

  let _scanY = 0;
  let _scanRAF = null;

  // ── 常量 ──
  const STORE_KEY = 'app10_landmarks';
  const MAX_LM = 30;

  // ── 工具 ──
  function _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _getCharDesc() {
    try {
      const chid = window.this_chid;
      const chars = window.characters;
      if (chid == null || !chars || !chars[chid]) return '';
      const c = chars[chid];
      return [c.description, c.personality, c.scenario].filter(Boolean).join('\n').slice(0, 800);
    } catch (e) { return ''; }
  }

  function _getRecentChat() {
    try {
      const msgs = _ctx.bridge.getRecentMessages(8);
      if (!msgs || msgs.length === 0) return '暂无';
      return msgs.map(m => {
        const who = m.is_user ? '用户' : (m.name || '角色');
        const txt = (m.mes || '').slice(0, 100);
        return `${who}: ${txt}`;
      }).join('\n').slice(0, 600);
    } catch (e) { return '暂无'; }
  }

  // ── 噪声 ──
  function _makeNoise(seed) {
    function h(x, y) {
      let v = seed;
      v = ((v << 5) - v + x) | 0;
      v = ((v << 5) - v + y) | 0;
      v = ((v << 5) - v + (x * 31)) | 0;
      v = ((v << 5) - v + (y * 17)) | 0;
      return (Math.abs(v) % 10000) / 10000;
    }
    function sm(t) { return t * t * (3 - 2 * t); }
    function lr(a, b, t) { return a + (b - a) * t; }
    return (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = sm(x - ix), fy = sm(y - iy);
      return lr(lr(h(ix, iy), h(ix + 1, iy), fx), lr(h(ix, iy + 1), h(ix + 1, iy + 1), fx), fy);
    };
  }

  function _fbm(fn, x, y, oct) {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { v += a * fn(x * f, y * f); a *= 0.5; f *= 2; }
    return v;
  }

  // ── 地形 ──
  function _genTerrain() {
    if (_terrainGenerated && _noiseData) return;
    const name = _ctx ? _ctx.bridge.getCharName() : 'x';
    let seed = 0;
    for (let i = 0; i < name.length; i++) seed = ((seed << 5) - seed + name.charCodeAt(i)) | 0;
    seed = Math.abs(seed) || 42;

    const noise = _makeNoise(seed);
    const w = _mapW, h = _mapH;
    _noiseData = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / w * 6, ny = y / h * 6;
        let val = _fbm(noise, nx, ny, 6);
        const cx = (x / w - 0.5) * 2, cy = (y / h - 0.5) * 2;
        val *= 1 - Math.pow(Math.min(Math.sqrt(cx * cx + cy * cy), 1), 2.2);
        _noiseData[y * w + x] = val;
      }
    }
    _terrainGenerated = true;
  }

  function _paintTerrain() {
    if (!_terrainCanvas) {
      _terrainCanvas = document.createElement('canvas');
      _terrainCanvas.width = _mapW;
      _terrainCanvas.height = _mapH;
    }
    _genTerrain();
    const c = _terrainCanvas.getContext('2d');
    const img = c.createImageData(_mapW, _mapH);
    const d = img.data, w = _mapW, h = _mapH;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = _noiseData[y * w + x];
        const i = (y * w + x) * 4;
        let r, g, b;
        if (v < 0.22) { r = 8; g = 12; b = 22; }
        else if (v < 0.30) { const t = (v - 0.22) / 0.08; r = 8 + t * 6| 0; g = 12 + t * 8 | 0; b = 22 + t * 14 | 0; }
        else if (v < 0.35) { const t = (v - 0.30) / 0.05; r = 14 + t * 10 | 0; g = 20 + t * 4 | 0; b = 36 - t * 18 | 0; }
        else if (v < 0.45) { r = 24; g = 26; b = 18; }
        else if (v < 0.55) { const t = (v - 0.45) / 0.10; r = 24 + t * 10 | 0; g = 26 + t * 10 | 0; b = 18 + t * 4 | 0; }
        else if (v < 0.65) { r = 34; g = 36; b = 22; }
        else if (v < 0.75) { r = 46; g = 42; b = 24; }
        else { const t = Math.min((v - 0.75) / 0.15, 1); r = 46 + t * 20 | 0; g = 42 + t * 18 | 0; b = 24 + t * 12 | 0; }
        const gr = (Math.random() - 0.5) * 3;
        d[i] = Math.max(0, Math.min(255, r + gr));
        d[i + 1] = Math.max(0, Math.min(255, g + gr));
        d[i + 2] = Math.max(0, Math.min(255, b + gr));
        d[i + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);

    // 等高线
    const levels = [0.30, 0.45, 0.55, 0.65, 0.75];
    c.strokeStyle = 'rgba(99,56,6,0.10)';
    c.lineWidth = 0.5;
    for (const lv of levels) {
      c.beginPath();
      for (let y = 0; y < h - 1; y += 3) {
        for (let x = 0; x < w - 1; x += 3) {
          const va = _noiseData[y * w + x], vr = _noiseData[y * w + x + 1], vb = _noiseData[(y + 1) * w + x];
          if ((va < lv) !== (vr < lv)) { const t = (lv - va) / (vr - va); c.moveTo(x + t * 3, y); c.lineTo(x + t * 3 + 0.5, y + 0.5); }
          if ((va < lv) !== (vb < lv)) { const t = (lv - va) / (vb - va); c.moveTo(x, y + t * 3); c.lineTo(x + 0.5, y + t * 3 + 0.5); }
        }
      }
      c.stroke();
    }

    // 格栅
    c.strokeStyle = 'rgba(99,56,6,0.05)';
    c.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  }

  // ── 找陆地 ──
  function _findLand() {
    if (!_noiseData) _genTerrain();
    for (let i = 0; i < 300; i++) {
      const x = Math.floor(Math.random() * (_mapW - 80) + 40);
      const y = Math.floor(Math.random() * (_mapH - 80) + 40);
      if (_noiseData[y * _mapW + x] > 0.36) return { x, y };
    }
    return { x: _mapW / 2, y: _mapH / 2 };
  }

  // ── 数据 ──
  async function _load() {
    try {
      const s = await _ctx.store.get(STORE_KEY);
      if (s && Array.isArray(s)) _landmarks = s.slice(0, MAX_LM);} catch (e) { _ctx.log.warn('app10', '加载失败', e.message); }
  }
  async function _save() {
    try { await _ctx.store.set(STORE_KEY, _landmarks); }
    catch (e) { _ctx.log.warn('app10', '保存失败', e.message); }
  }

  // ── 命中检测 ──
  function _hitTest(sx, sy) {
    const mx = (sx - _vpW / 2) / _scale - _offsetX + _mapW / 2;
    const my = (sy - _vpH / 2) / _scale - _offsetY + _mapH / 2;
    let best = null, bestD = 20/ _scale;
    for (const lm of _landmarks) {
      const dx = lm.x - mx, dy = lm.y - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = lm; }
    }
    return best;
  }

  // ── Canvas 绘制 ──
  function _draw() {
    const el = _container ? _container.querySelector('#f10-cv') : null;
    if (!el) return;
    const c = el.getContext('2d');
    if (!_terrainCanvas) _paintTerrain();

    c.clearRect(0, 0, _vpW, _vpH);
    c.save();
    c.translate(_vpW / 2, _vpH / 2);
    c.scale(_scale, _scale);
    c.translate(_offsetX, _offsetY);

    c.drawImage(_terrainCanvas, -_mapW / 2, -_mapH / 2);

    // 扫描线
    c.strokeStyle = 'rgba(99,56,6,0.30)';
    c.lineWidth = 1.5 / _scale;
    c.shadowColor = 'rgba(99,56,6,0.5)';
    c.shadowBlur = 6 / _scale;
    c.beginPath();
    c.moveTo(-_mapW / 2, _scanY - _mapH / 2);
    c.lineTo(_mapW / 2, _scanY - _mapH / 2);
    c.stroke();
    c.shadowBlur = 0;

    // 地标
    for (const lm of _landmarks) {
      const lx = lm.x - _mapW / 2;
      const ly = lm.y - _mapH / 2;
      const isSel = lm.id === _selectedLandmark;

      // 信号覆盖圈
      c.beginPath();
      c.arc(lx, ly, 35, 0, Math.PI * 2);
      c.fillStyle = 'rgba(99,56,6,0.04)';
      c.fill();
      c.strokeStyle = 'rgba(99,56,6,0.10)';
      c.lineWidth = 0.5 / _scale;
      c.setLineDash([4, 4]);
      c.stroke();
      c.setLineDash([]);

      // 光晕
      const gr = 8 + Math.sin(Date.now() / 600+ lm.id) * 3;
      c.beginPath();
      c.arc(lx, ly, gr, 0, Math.PI * 2);
      c.fillStyle = isSel ? 'rgba(255,208,128,0.25)' : 'rgba(99,56,6,0.20)';
      c.fill();
      c.strokeStyle = isSel ? 'rgba(255,208,128,0.7)' : 'rgba(99,56,6,0.5)';
      c.lineWidth = 1 / _scale;
      c.stroke();

      // 内核
      c.beginPath();
      c.arc(lx, ly, isSel ? 5 : 3.5, 0, Math.PI * 2);
      c.fillStyle = isSel ? '#ffd080' : '#c47a1a';
      c.fill();
      c.shadowColor = isSel ? '#ffd080' : '#c47a1a';
      c.shadowBlur = isSel ? 10 / _scale : 4 / _scale;
      c.fill();
      c.shadowBlur = 0;

      // 标签
      c.font = `${9 / _scale}px 'Courier New', monospace`;
      c.textAlign = 'center';
      c.fillStyle = 'rgba(200,180,140,0.80)';
      c.shadowColor = 'rgba(0,0,0,0.8)';
      c.shadowBlur = 3 / _scale;
      c.fillText(lm.name.slice(0, 12), lx, ly - 14/ _scale);
      c.shadowBlur = 0;
    }

    c.restore();

    // CRT扫描线
    c.fillStyle = 'rgba(99,56,6,0.012)';
    for (let y = 0; y < _vpH; y += 4) {
      c.fillRect(0, y, _vpW, 2);
    }
  }

  // ── 扫描线动画 ──
  function _startScan() {
    if (_scanRAF) return;
    let last = 0;
    const step = (t) => {
      if (!_container) { _scanRAF = null; return; }
      if (t - last > 40) { _scanY = (_scanY + 1.5) % _mapH; last = t; _draw(); }
      _scanRAF = requestAnimationFrame(step);
    };
    _scanRAF = requestAnimationFrame(step);
  }
  function _stopScan() {
    if (_scanRAF) { cancelAnimationFrame(_scanRAF); _scanRAF = null; }
  }

  // ── 居中到某个地标 ──
  function _focusLandmark(lm) {
    _offsetX = -(lm.x - _mapW / 2);
    _offsetY = -(lm.y - _mapH / 2);
    _scale = Math.max(_scale, 1.2);
    _selectedLandmark = lm.id;
    _viewMode = 'map';
  }

  // ── 渲染 ──
  function _render() {
    if (!_container) return;
    const sel = _selectedLandmark ? _landmarks.find(l => l.id === _selectedLandmark) : null;

    // 计算地图区域高度：列表模式下地图占上半，列表占下半
    const mapAreaStyle = _viewMode === 'list' ? 'flex:0 0 45%;' : 'flex:1;';
    const canvasH = _viewMode === 'list' ? Math.floor(_vpH * 0.45) : _vpH - 48;

    _container.innerHTML = `
      <div class="f10-wrap">
        <div class="f10-tabs">
          <button class="f10-tab ${_viewMode === 'map' ? 'f10-tab-active' : ''}" data-tab="map">🗺️ 地图</button>
          <button class="f10-tab ${_viewMode === 'list' ? 'f10-tab-active' : ''}" data-tab="list">📋 列表 (${_landmarks.length})</button>
        </div>

        <div class="f10-map-area" style="${mapAreaStyle}">
          <canvas id="f10-cv" class="f10-canvas" width="${_vpW}" height="${canvasH}"></canvas>
        </div>

        ${_viewMode === 'list' ? _renderList() : ''}

        ${sel ? _renderDetail(sel) : ''}
        ${_showAddForm ? _renderForm() : ''}
        ${_statusText ? `<div class="f10-status">${_esc(_statusText)}</div>` : ''}

        <div class="f10-bar">
          <button id="f10-btn-center" class="f10-btn" ${_loading ? 'disabled' : ''}>⊕</button>
          <button id="f10-btn-gen" class="f10-btn f10-btn-pri" ${_loading ? 'disabled' : ''}>
            ${_loading ? '⏳扫描中…' : '✨ AI生成'}
          </button>
          <button id="f10-btn-add" class="f10-btn" ${_loading ? 'disabled' : ''}>📌 添加</button>
          <span class="f10-cnt">${_landmarks.length}/${MAX_LM}</span>
        </div>
      </div>`;

    // 更新canvas高度变量用于绘制
    const cvEl = _container.querySelector('#f10-cv');
    if (cvEl) {
      _vpW = cvEl.width;
      // 不改_vpH，只在绘制时用canvas 实际高度
    }
    _draw();
  }

  // ── 地标列表 ──
  function _renderList() {
    if (_landmarks.length === 0) {
      return `<div class="f10-list-area">
        <div class="f10-list-empty">暂无地标<br><span style="font-size:10px;opacity:0.5;">点击「✨ AI生成」扫描异界信号</span></div>
      </div>`;
    }

    const items = _landmarks.map(lm => {
      const isSel = lm.id === _selectedLandmark;
      const shortDesc = lm.desc ? lm.desc.slice(0, 40) + (lm.desc.length > 40 ? '…' : '') : '无描述';
      return `
        <div class="f10-list-item ${isSel ? 'f10-list-item-active' : ''}" data-lm-list="${lm.id}">
          <div class="f10-list-item-dot ${lm.type === 'ai' ? '' : 'f10-list-item-dot-manual'}"></div>
          <div class="f10-list-item-info">
            <div class="f10-list-item-name">${_esc(lm.name)}</div>
            <div class="f10-list-item-desc">${_esc(shortDesc)}</div>
          </div>
          <div class="f10-list-item-meta">
            <span class="f10-list-item-type">${lm.type === 'ai' ? '✨' : '📌'}</span>
            <span class="f10-list-item-char">${_esc((lm.charName || '').slice(0, 6))}</span>
          </div>
        </div>`;
    }).join('');

    return `<div class="f10-list-area">${items}</div>`;
  }

  function _renderDetail(lm) {
    const long = lm.desc && lm.desc.length > 60;
    const txt = (!long || lm.expanded) ? _esc(lm.desc || '无描述') : _esc(lm.desc.slice(0, 60)) + '<span class="f10-ell">…</span>';
    return `
      <div class="f10-detail">
        <div class="f10-d-head">
          <span class="f10-d-icon">◈</span>
          <span class="f10-d-name">${_esc(lm.name)}</span>
          <button class="f10-d-close" id="f10-close">✕</button>
        </div>
        <div class="f10-d-meta">
          <span>📍 (${lm.x}, ${lm.y})</span>
          <span>🏷️ ${lm.type === 'ai' ? 'AI生成' : '手动'}</span>
        </div>
        <div class="f10-d-char">来源：${_esc(lm.charName || '未知')}</div>
        <div class="f10-d-desc">${txt}</div>
        ${long ? `<div class="f10-expand-btn" data-id="${lm.id}">${lm.expanded ? '收起 ▴' : '展开 ▾'}</div>` : ''}
        <div class="f10-d-time">${lm.createdAt || ''}</div>
        <button class="f10-btn f10-btn-del" id="f10-del" data-id="${lm.id}">🗑️ 删除地标</button>
      </div>`;
  }

  function _renderForm() {
    return `
      <div class="f10-overlay">
        <div class="f10-form">
          <div class="f10-form-title">📌 添加异界地标</div>
          <label class="f10-label">名称</label>
          <input type="text" id="f10-inp-name" class="f10-inp" placeholder="地标名称…" maxlength="30" value="${_esc(_addNameInput)}"/>
          <label class="f10-label">描述（可选）</label>
          <textarea id="f10-inp-desc" class="f10-ta" placeholder="描述…" maxlength="200" rows="3">${_esc(_addDescInput)}</textarea>
          <div class="f10-form-acts">
            <button id="f10-ok-add" class="f10-btn f10-btn-pri" ${!_addNameInput.trim() ? 'disabled' : ''}>确认</button>
            <button id="f10-cancel-add" class="f10-btn">取消</button>
          </div>
        </div>
      </div>`;
  }

  // ── AI生成 ──
  async function _aiGen() {
    if (_landmarks.length >= MAX_LM) throw new Error('地标已达上限');
    const cn = _ctx.bridge.getCharName();
    if (!cn) throw new Error('未检测到角色');
    const cd = _getCharDesc();
    const rem = Math.min(3, MAX_LM - _landmarks.length);
    const existing = _landmarks.map(l => l.name).join('、') || '暂无';
    const recentChat = _getRecentChat();

    const msgs = _ctx.subapi.buildMessages('app10_landmark', {
      char_desc: cd,
      existing_landmarks: existing,
      count: String(rem),
      recent_chat: recentChat,});
    const raw = await _ctx.subapi.call(msgs, { maxTokens: 800, temperature: 0.92 });
    const results = _ctx.subapi.parseResponse(raw, 'landmark');
    if (!results || results.length === 0) throw new Error('AI未返回有效数据');

    let added = 0;
    for (const txt of results) {
      if (_landmarks.length >= MAX_LM) break;
      const pos = _findLand();
      let name = '未知地标', desc = '';
      try {
        const obj = JSON.parse(txt.replace(/[\r\n]/g, ' ').trim());
        name = String(obj.name || '未知地标').slice(0, 30);
        desc = String(obj.desc || obj.description || '').slice(0, 300);
      } catch (_) {
        name = txt.slice(0, 30);
      }
      _landmarks.push({
        id: Date.now() + added, name, desc,
        x: pos.x, y: pos.y,
        charName: cn, charDesc: cd.slice(0, 200),
        type: 'ai', createdAt: new Date().toLocaleString('zh-CN'), expanded: false,
      });
      added++;
    }
    await _save();
    _ctx.notify.push('map', '🗺️', '异界探索', `发现了${added} 个新地标`);
    return added;
  }

  // ── 事件 ──
  function _bind(ct) {
    if (_clickHandler) ct.removeEventListener('click', _clickHandler);
    if (_inputHandler) ct.removeEventListener('input', _inputHandler);

    _inputHandler = (e) => {
      if (e.target.id === 'f10-inp-name') {
        _addNameInput = e.target.value;
        const btn = ct.querySelector('#f10-ok-add');
        if (btn) btn.disabled = !_addNameInput.trim();
      }
      if (e.target.id === 'f10-inp-desc') _addDescInput = e.target.value;
    };
    ct.addEventListener('input', _inputHandler);

    _clickHandler = async (e) => {
      const tgt = e.target;

      //── Tab切换 ──
      const tab = tgt.closest('.f10-tab');
      if (tab) {
        const mode = tab.dataset.tab;
        if (mode && mode !== _viewMode) {
          _viewMode = mode;
          _render(); _bind(_container);
        }
        return;
      }

      // ── 列表项点击 ──
      const listItem = tgt.closest('.f10-list-item');
      if (listItem) {
        const id = Number(listItem.dataset.lmList);
        const lm = _landmarks.find(l => l.id === id);
        if (lm) {
          _focusLandmark(lm);
          _render(); _bind(_container);
        }return;
      }

      // ── 居中 ──
      if (tgt.id === 'f10-btn-center' || tgt.closest('#f10-btn-center')) {
        _offsetX = 0; _offsetY = 0;
        _scale = Math.min(_vpW / _mapW, (_vpH - 48) / _mapH);
        _statusText = '✓ 视图已居中';
        _render(); _bind(_container);
        setTimeout(() => { _statusText = ''; if (_container) { _render(); _bind(_container); } }, 2000);
        return;
      }

      // ── AI生成 ──
      if (tgt.id === 'f10-btn-gen' || tgt.closest('#f10-btn-gen')) {
        _loading = true; _statusText = '⏳ 正在扫描异界信号…';
        _render(); _bind(_container);
        try {
          const n = await _aiGen();
          _statusText = `✓已生成 ${n} 个地标`;
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app10','AI生成失败', err.message);
        }
        _loading = false;
        if (!_container) return;
        _render(); _bind(_container);setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = ''; if (_container) { _render(); _bind(_container); }
          }
        }, 3000);
        return;
      }

      // ── 手动添加 ──
      if (tgt.id === 'f10-btn-add' || tgt.closest('#f10-btn-add')) {
        _showAddForm = true; _addNameInput = ''; _addDescInput = '';
        _render(); _bind(_container);
        setTimeout(() => { const i = _container && _container.querySelector('#f10-inp-name'); if (i) i.focus(); }, 100);
        return;
      }

      // ── 确认添加 ──
      if (tgt.id === 'f10-ok-add' || tgt.closest('#f10-ok-add')) {
        const nm = _addNameInput.trim();
        if (!nm) { _statusText = '⚠ 请输入名称'; _render(); _bind(_container); return; }
        if (_landmarks.length >= MAX_LM) { _statusText = '⚠ 已达上限'; _render(); _bind(_container); return; }
        const pos = _findLand();
        _landmarks.push({
          id: Date.now(), name: nm.slice(0, 30), desc: (_addDescInput || '').trim().slice(0, 300),
          x: pos.x, y: pos.y,
          charName: _ctx.bridge.getCharName() || '未知', charDesc: _getCharDesc().slice(0, 200),
          type: 'manual', createdAt: new Date().toLocaleString('zh-CN'), expanded: false,
        });
        await _save();
        _addNameInput = ''; _addDescInput = ''; _showAddForm = false;
        _statusText = '✓ 地标已添加';
        if (!_container) return;
        _render(); _bind(_container);
        setTimeout(() => { _statusText = ''; if (_container) { _render(); _bind(_container); } }, 3000);
        return;
      }

      // ── 取消添加 ──
      if (tgt.id === 'f10-cancel-add' || tgt.closest('#f10-cancel-add')) {
        _showAddForm = false; _addNameInput = ''; _addDescInput = '';
        _render(); _bind(_container);
        return;
      }

      // ── 关闭详情 ──
      if (tgt.id === 'f10-close' || tgt.closest('#f10-close')) {
        _selectedLandmark = null;
        _render(); _bind(_container);
        return;
      }

      // ── 删除 ──
      if (tgt.id === 'f10-del' || tgt.closest('#f10-del')) {
        const btn = tgt.closest('#f10-del') || tgt;
        const id = Number(btn.dataset.id);
        _landmarks = _landmarks.filter(l => l.id !== id);
        if (_selectedLandmark === id) _selectedLandmark = null;
        await _save();
        _statusText = '✓ 地标已删除';
        if (!_container) return;
        _render(); _bind(_container);
        setTimeout(() => { _statusText = ''; if (_container) { _render(); _bind(_container); } }, 3000);
        return;
      }

      // ── 展开/收起 ──
      const expBtn = tgt.closest('.f10-expand-btn');
      if (expBtn) {
        const id = Number(expBtn.dataset.id);
        const item = _landmarks.find(l => l.id === id);
        if (item) { item.expanded = !item.expanded; _render(); _bind(_container); }
        return;
      }
    };
    ct.addEventListener('click', _clickHandler);

    // ── Canvas 交互 ──
    const cv = ct.querySelector('#f10-cv');
    if (cv) {
      cv.addEventListener('mousedown', _mDown);
      cv.addEventListener('mousemove', _mMove);
      cv.addEventListener('mouseup', _mUp);
      cv.addEventListener('mouseleave', _mUp);
      cv.addEventListener('wheel', _wheel, { passive: false });
      cv.addEventListener('touchstart', _tStart, { passive: false });
      cv.addEventListener('touchmove', _tMove, { passive: false });
      cv.addEventListener('touchend', _tEnd);
    }
  }

  // ── 鼠标 ──
  function _mDown(e) {
    _isDragging = true;
    _dragStartX = e.offsetX; _dragStartY = e.offsetY;
    _dragStartOX = _offsetX; _dragStartOY = _offsetY;
  }
  function _mMove(e) {
    if (!_isDragging) return;
    _offsetX = _dragStartOX + (e.offsetX - _dragStartX) / _scale;
    _offsetY = _dragStartOY + (e.offsetY - _dragStartY) / _scale;}
  function _mUp(e) {
    if (_isDragging) {
      const dx = e.offsetX - _dragStartX, dy = e.offsetY - _dragStartY;
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
        const lm = _hitTest(e.offsetX, e.offsetY);
        if (lm) {
          _selectedLandmark = (_selectedLandmark === lm.id) ? null : lm.id;
          _render(); _bind(_container);
        } else if (_selectedLandmark) {
          _selectedLandmark = null;
          _render(); _bind(_container);
        }
      }
    }
    _isDragging = false;
  }
  function _wheel(e) {
    e.preventDefault();
    const d = e.deltaY > 0 ? 0.9 : 1.1;
    _scale = Math.max(0.3, Math.min(4, _scale * d));
  }

  // ── 触摸 ──
  function _tStart(e) {
    if (e.touches.length === 1) {
      _isDragging = true;
      _dragStartX = e.touches[0].clientX; _dragStartY = e.touches[0].clientY;
      _dragStartOX = _offsetX; _dragStartOY = _offsetY;
    } else if (e.touches.length === 2) {
      _isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      _touchStartDist = Math.sqrt(dx * dx + dy * dy);
      _touchStartScale = _scale;
    }e.preventDefault();
  }
  function _tMove(e) {
    if (e.touches.length === 1&& _isDragging) {
      _offsetX = _dragStartOX + (e.touches[0].clientX - _dragStartX) / _scale;
      _offsetY = _dragStartOY + (e.touches[0].clientY - _dragStartY) / _scale;
    } else if (e.touches.length === 2 && _touchStartDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      _scale = Math.max(0.3, Math.min(4, _touchStartScale * Math.sqrt(dx * dx + dy * dy) / _touchStartDist));
    }
    e.preventDefault();
  }
  function _tEnd() { _isDragging = false; _touchStartDist = 0; }

  // ── 公开接口 ──
  return {
    id: 'map',
    name: '异界探索',
    icon: '🗺️',

    init(ctx) {
      _ctx = ctx;
      _load();
      _ctx.log.info('app10', '异界探索 已初始化');
    },

    async mount(container) {
      _container = container;
      _container.innerHTML = `<div class="freq-loading"><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div></div>`;

      await _load();
      _paintTerrain();

      const rect = _container.getBoundingClientRect();
      _vpW = Math.floor(rect.width) || 340;
      _vpH = Math.floor(rect.height) || 500;

      _offsetX = 0; _offsetY = 0;
      _scale = Math.min(_vpW / _mapW, (_vpH - 48) / _mapH);
      _selectedLandmark = null; _showAddForm = false;
      _viewMode = 'map';

      _render();
      _bind(_container);_startScan();
    },

    unmount() {
      _stopScan();
      if (_container && _clickHandler) _container.removeEventListener('click', _clickHandler);
      if (_container && _inputHandler) _container.removeEventListener('input', _inputHandler);
      const cv = _container ? _container.querySelector('#f10-cv') : null;
      if (cv) {
        cv.removeEventListener('mousedown', _mDown);
        cv.removeEventListener('mousemove', _mMove);
        cv.removeEventListener('mouseup', _mUp);
        cv.removeEventListener('mouseleave', _mUp);
        cv.removeEventListener('wheel', _wheel);
        cv.removeEventListener('touchstart', _tStart);
        cv.removeEventListener('touchmove', _tMove);
        cv.removeEventListener('touchend', _tEnd);
      }
      _container = null;
    },
  };
})();
// ============================================================ end block_19
// ============================================================
// block_18 — App09 · 频道文库
// ============================================================
const App09Novel = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;
  let _inputHandler = null;

  //── 状态变量 ──
  let _library = [];
  let _fanfics = [];
  let _loading = false;
  let _statusText = '';
  let _view = 'shelf';       // 'shelf' | 'read' | 'fanfic'
  let _currentBookId = null;
  let _currentChExpanded = {};

  // 同人工坊输入状态
  let _fanGenre = '甜文';
  let _fanOrientation = 'BG';
  let _fanKeywords = '';

  // 雷点（全局生效）
  let _avoidTags = '';

  const STORE_KEY_LIB = 'app09_library';
  const STORE_KEY_FAN = 'app09_fanfics';
  const STORE_KEY_AVOID = 'app09_avoid';

  const GENRE_OPTIONS = ['甜文', '虐文', '日常', '冒险', '悬疑', '恐怖'];
  const ORIENT_OPTIONS = [
    { val: 'BG', label: 'BG' },
    { val: 'BL', label: 'BL' },
    { val: 'GL', label: 'GL' },
    { val: '无CP', label: '无CP' },
    { val: '全员向', label: '全员向' },
  ];

  const GENRE_COLORS = {
    '都市': '#3a6186', '奇幻': '#6b3fa0', '悬疑': '#8B0000',
    '恋爱': '#c0392b', '日常': '#27ae60', '冒险': '#d35400',
    '恐怖': '#2c3e50', '科幻': '#0c447c', '历史': '#7f6b3e',
    '喜剧': '#e67e22', '甜文': '#c0392b', '虐文': '#8B0000',
    '默认': '#2E2E3A',
  };

  // ── 工具函数 ──
  function _escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _getCharDesc() {
    try {
      const chid = window.this_chid;
      const chars = window.characters;
      if (chid == null || !chars || !chars[chid]) return '';
      const c = chars[chid];
      return [c.description, c.personality, c.scenario].filter(Boolean).join('\n').slice(0, 800);
    } catch (e) { return ''; }
  }

  function _getRecentChat() {
    try {
      const msgs = _ctx.bridge.getRecentMessages(8);
      if (!msgs || msgs.length === 0) return '暂无';
      return msgs.map(m => {
        const who = m.is_user ? '用户' : (m.name || '角色');
        const txt = (m.mes || '').slice(0, 100);
        return `${who}: ${txt}`;
      }).join('\n').slice(0, 600);
    } catch (e) { return '暂无'; }
  }

  function _getGenreColor(genre) {
    if (!genre) return GENRE_COLORS['默认'];
    for (const key of Object.keys(GENRE_COLORS)) {
      if (genre.includes(key)) return GENRE_COLORS[key];
    }
    return GENRE_COLORS['默认'];
  }

  function _getCurrentBook() {
    return _library.find(b => b.id === _currentBookId) || null;
  }

  //构建雷点约束文本（给提示词用）
  function _getAvoidConstraint() {
    if (!_avoidTags || !_avoidTags.trim()) return '';
    return `\n\n【绝对禁止事项（用户雷点）】以下内容绝对不允许出现在任何生成的文本中：${_avoidTags.trim()}\n严格遵守，不得以任何形式、任何隐喻触及以上雷点。`;
  }

  //── 持久化 ──
  async function _saveLibrary() {
    try { await _ctx.store.set(STORE_KEY_LIB, _library); } catch (e) {
      _ctx.log.warn('app09', '保存书架失败', e.message);
    }
  }

  async function _saveFanfics() {
    try { await _ctx.store.set(STORE_KEY_FAN, _fanfics); } catch (e) {
      _ctx.log.warn('app09', '保存同人文失败', e.message);
    }
  }

  async function _saveAvoid() {
    try { await _ctx.store.set(STORE_KEY_AVOID, _avoidTags); } catch (e) {
      _ctx.log.warn('app09', '保存雷点失败', e.message);
    }
  }

  async function _loadData() {
    try {
      const lib = await _ctx.store.get(STORE_KEY_LIB);
      if (Array.isArray(lib)) _library = lib;
    } catch (e) {}
    try {
      const fan = await _ctx.store.get(STORE_KEY_FAN);
      if (Array.isArray(fan)) _fanfics = fan;
    } catch (e) {}
    try {
      const av = await _ctx.store.get(STORE_KEY_AVOID);
      if (typeof av === 'string') _avoidTags = av;
    } catch (e) {}
  }

  // ══════════════════════════════════════════
  // 副API调用
  // ══════════════════════════════════════════

  async function _generateBooks() {
    const charName = _ctx.bridge.getCharName();
    const charDesc = _getCharDesc();
    const recentChat = _getRecentChat();
    const existingTitles = _library.map(b => b.title).join('、') || '暂无';

    const messages = _ctx.subapi.buildMessages('app09_book', {
      char_desc: charDesc,
      recent_chat: recentChat,
      existing_titles: existingTitles,
      avoid_tags: _getAvoidConstraint(),
    });

    const raw = await _ctx.subapi.call(messages, { maxTokens: 800, temperature: 0.95 });
    const blocks = _ctx.subapi.parseResponse(raw, 'book');

    const newBooks = [];
    for (const block of blocks) {
      try {
        const obj = JSON.parse(block);
        if (obj.title && obj.author) {
          newBooks.push({
            id: Date.now() + Math.floor(Math.random() * 10000),
            title: String(obj.title).slice(0, 30),
            author: String(obj.author).slice(0, 20),
            genre: String(obj.genre || '奇幻').slice(0, 10),
            desc: String(obj.desc || '').slice(0, 120),
            chapters: [],
            charName: charName,
            charDesc: charDesc,
            ts: Date.now(),
          });
        }
      } catch (e) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          const titleMatch = lines[0].match(/(?:书名|标题)[：:]\s*(.+)/);
          const authorMatch = lines[1].match(/(?:作者)[：:]\s*(.+)/);
          const genreMatch = (lines[2] || '').match(/(?:类型|题材)[：:]\s*(.+)/);
          const descMatch = (lines[3] || lines[2] || '').match(/(?:简介|描述)[：:]\s*(.+)/);
          if (titleMatch) {
            newBooks.push({
              id: Date.now() + Math.floor(Math.random() * 10000),
              title: titleMatch[1].slice(0, 30),
              author: authorMatch ? authorMatch[1].slice(0, 20) : '佚名',
              genre: genreMatch ? genreMatch[1].slice(0, 10) : '奇幻',
              desc: descMatch ? descMatch[1].slice(0, 120) : '',
              chapters: [],
              charName: charName,
              charDesc: charDesc,
              ts: Date.now(),
            });
          }
        }
      }
    }

    if (newBooks.length === 0) {
      const fallback = _ctx.subapi.safeParseText(raw);
      if (fallback && fallback.length > 10) {
        newBooks.push({
          id: Date.now(),
          title: fallback.slice(0, 20).replace(/[\n\r]/g, ''),
          author: '频道匿名',
          genre: '奇幻',
          desc: fallback.slice(0, 100),
          chapters: [],
          charName: _ctx.bridge.getCharName(),
          charDesc: _getCharDesc(),
          ts: Date.now(),
        });
      }
    }

    return newBooks;
  }

  async function _generateChapter(book) {
    const chapterNum = book.chapters.length + 1;
    const prevSummary = book.chapters.length > 0
      ? book.chapters.map(ch => `第${ch.num}章「${ch.title}」: ${(ch.content || '').slice(0, 80)}`).join('\n')
      : '这是第一章，尚无前文。';

    const messages = _ctx.subapi.buildMessages('app09_chapter', {
      char_desc: book.charDesc || _getCharDesc(),
      recent_chat: _getRecentChat(),
      book_title: book.title,
      book_author: book.author,
      book_genre: book.genre,
      book_desc: book.desc,
      chapter_num: String(chapterNum),
      prev_summary: prevSummary.slice(0, 600),
      avoid_tags: _getAvoidConstraint(),
    });

    const raw = await _ctx.subapi.call(messages, { maxTokens: 1200, temperature: 0.9 });
    const blocks = _ctx.subapi.parseResponse(raw, 'chapter');

    let chTitle = `第${chapterNum}章`;
    let chContent = '';

    if (blocks.length > 0) {
      const text = blocks[0];
      const titleMatch = text.match(/(?:章节标题|标题)[：:]\s*(.+)/);
      if (titleMatch) {
        chTitle = titleMatch[1].trim().slice(0, 30);
        chContent = text.replace(titleMatch[0], '').trim();
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length > 1&& lines[0].length< 30) {
          chTitle = lines[0].trim();
          chContent = lines.slice(1).join('\n').trim();
        } else {
          chContent = text.trim();
        }
      }
    } else {
      chContent = _ctx.subapi.safeParseText(raw) || '（信号中断，本章内容丢失…）';
    }

    return {
      num: chapterNum,
      title: chTitle,
      content: chContent.slice(0, 1500),
      ts: Date.now(),
    };
  }

  async function _generateFanfic() {
    const charName = _ctx.bridge.getCharName();
    const userName = _ctx.bridge.getUserName();
    const charDesc = _getCharDesc();
    const recentChat = _getRecentChat();

    const messages = _ctx.subapi.buildMessages('app09_fanfic', {
      char_desc: charDesc,
      recent_chat: recentChat,
      fan_genre: _fanGenre,
      fan_orientation: _fanOrientation,
      fan_keywords: _fanKeywords || '无特殊要求',
      avoid_tags: _getAvoidConstraint(),
    });

    const raw = await _ctx.subapi.call(messages, { maxTokens: 1200, temperature: 0.92 });
    const blocks = _ctx.subapi.parseResponse(raw, 'fanfic');

    let title = '无题';
    let content = '';

    if (blocks.length > 0) {
      const text = blocks[0];
      const titleMatch = text.match(/(?:标题|题目)[：:]\s*(.+)/);
      if (titleMatch) {
        title = titleMatch[1].trim().slice(0, 30);
        content = text.replace(titleMatch[0], '').trim();
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length > 1 && lines[0].length < 30) {
          title = lines[0].trim();
          content = lines.slice(1).join('\n').trim();
        } else {
          content = text.trim();
        }
      }
    } else {
      content = _ctx.subapi.safeParseText(raw) || '（灵感枯竭，稿件丢失…）';
    }

    return {
      id: Date.now(),
      title,
      content: content.slice(0, 1500),
      genre: _fanGenre,
      orientation: _fanOrientation,
      keywords: _fanKeywords,
      charName,
      userName,
      ts: Date.now(),
      expanded: false,
    };
  }

  // ══════════════════════════════════════════
  // 渲染
  // ══════════════════════════════════════════

  function _render() {
    if (!_container) return;
    let html = '';
    if (_view === 'shelf') html = _renderShelf();
    else if (_view === 'read') html = _renderRead();
    else if (_view === 'fanfic') html = _renderFanfic();
    _container.innerHTML = html;
  }

  // ──雷点设置区（书架和同人工坊共用） ──
  function _renderAvoidSection() {
    return `
      <div class="f09-avoid-section">
        <div class="f09-avoid-header">
          <span class="f09-avoid-icon">⚠</span>
          <span class="f09-avoid-label">雷点设置</span>
          <span class="f09-avoid-hint">（所有生成内容均会规避）</span>
        </div>
        <textarea id="f09-avoid-input" class="f09-avoid-textarea"
          placeholder="输入你的雷点，如：NTR、角色死亡、校园暴力…"
          rows="2">${_escHtml(_avoidTags)}</textarea>
      </div>`;
  }

  // ── 书架视图 ──
  function _renderShelf() {
    const booksHtml = _library.length === 0
      ? `<div class="freq-empty-state">📖 书架空空如也<br><small>点击下方按钮扫描频道新书</small></div>`
      : _library.slice().reverse().map(b => {
          const color = _getGenreColor(b.genre);
          const chCount = b.chapters ? b.chapters.length : 0;
          return `
            <div class="f09-book-card" data-book-id="${b.id}">
              <div class="f09-book-cover" style="background:${color}">
                <span class="f09-book-cover-text">${_escHtml(b.title.slice(0, 4))}</span>
              </div>
              <div class="f09-book-info">
                <div class="f09-book-title">${_escHtml(b.title)}</div>
                <div class="f09-book-author">✍ ${_escHtml(b.author)}</div>
                <div class="f09-book-meta">
                  <span class="f09-book-genre">${_escHtml(b.genre)}</span>
                  <span class="f09-book-chapters">${chCount}章</span>
                </div>
                ${b.desc ? `<div class="f09-book-desc">${_escHtml(b.desc.slice(0, 60))}${b.desc.length > 60 ? '…' : ''}</div>` : ''}
              </div>
              <button class="f09-book-del" data-del-id="${b.id}" title="删除">✕</button>
            </div>`;
        }).join('');

    return `
      <div class="f09-wrap">
        <div class="f09-header">
          <div class="f09-header-title">📖 频道文库</div>
          <button class="f09-tab-btn active" data-tab="shelf">书架</button>
          <button class="f09-tab-btn" data-tab="fanfic">同人工坊</button>
        </div>
        <div class="f09-scroll">
          ${_renderAvoidSection()}
          ${_loading
            ? `<div class="freq-loading"><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div></div>`
            : booksHtml
          }
        </div>${_statusText ? `<div class="f09-status">${_escHtml(_statusText)}</div>` : ''}<div class="f09-bottom-bar">
          <button id="f09-btn-scan" ${_loading ? 'disabled' : ''}>
            ${_loading ? '⏳ 扫描中…' : '📡 扫描新书'}
          </button></div>
      </div>`;
  }

  // ── 阅读视图 ──
  function _renderRead() {
    const book = _getCurrentBook();
    if (!book) {
      _view = 'shelf';
      return _renderShelf();
    }

    const color = _getGenreColor(book.genre);
    const chaptersHtml = book.chapters.length === 0
      ? `<div class="freq-empty-state">📝暂无章节<br><small>正在加载第一章…</small></div>`
      : book.chapters.map((ch, idx) => {
          const isExpanded = !!_currentChExpanded[idx];
          const preview = ch.content.length > 60
            ? _escHtml(ch.content.slice(0, 60)) + '<span class="f09-ellipsis">…</span>'
            : _escHtml(ch.content);
          return `
            <div class="f09-chapter-item">
              <div class="f09-chapter-header" data-ch-idx="${idx}">
                <span class="f09-chapter-num">第${ch.num}章</span>
                <span class="f09-chapter-title">${_escHtml(ch.title)}</span>
                <span class="f09-chapter-toggle">${isExpanded ? '▴' : '▾'}</span>
              </div>
              ${isExpanded
                ? `<div class="f09-chapter-body">${_escHtml(ch.content).replace(/\n/g, '<br>')}</div>`
                : `<div class="f09-chapter-preview">${preview}</div>`
              }
            </div>`;
        }).join('');

    return `
      <div class="f09-wrap">
        <div class="f09-read-header" style="border-bottom-color:${color}">
          <button class="f09-back-btn" id="f09-btn-back">← 返回书架</button>
          <div class="f09-read-title">${_escHtml(book.title)}</div>
          <div class="f09-read-author">✍ ${_escHtml(book.author)} · ${_escHtml(book.genre)}</div>
        </div>
        <div class="f09-scroll">
          ${_loading
            ? `<div class="freq-loading"><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div></div>`
            : chaptersHtml
          }
        </div>
        ${_statusText ? `<div class="f09-status">${_escHtml(_statusText)}</div>` : ''}
        <div class="f09-bottom-bar">
          <button id="f09-btn-next-ch" ${_loading ? 'disabled' : ''}>
            ${_loading ? '⏳ 更新中…' : '📝 续更下一章'}
          </button>
        </div>
      </div>`;
  }

  // ── 同人工坊视图 ──
  function _renderFanfic() {
    const genreButtons = GENRE_OPTIONS.map(g =>
      `<button class="f09-genre-btn ${_fanGenre === g ? 'active' : ''}" data-genre="${g}">${g}</button>`
    ).join('');

    const orientButtons = ORIENT_OPTIONS.map(o =>
      `<button class="f09-orient-btn ${_fanOrientation === o.val ? 'active' : ''}" data-orient="${o.val}">${o.label}</button>`
    ).join('');

    const historyHtml = _fanfics.length === 0
      ? ''
      : `<div class="f09-fan-history-title">── 往期作品 ──</div>` +
        _fanfics.slice().reverse().map(f => {
          const needsExpand = f.content.length > 80;
          const displayText = (!needsExpand || f.expanded)
            ? _escHtml(f.content).replace(/\n/g, '<br>')
            : _escHtml(f.content.slice(0, 80)) + '<span class="f09-ellipsis">…</span>';
          return `
            <div class="f09-fan-card">
              <div class="f09-fan-card-header">
                <span class="f09-fan-card-title">「${_escHtml(f.title)}」</span>
                <span class="f09-fan-card-meta">${_escHtml(f.genre)} · ${_escHtml(f.orientation)}</span>
              </div>
              <div class="f09-fan-card-body">${displayText}</div>
              ${needsExpand
                ? `<div class="f09-fan-expand" data-fan-id="${f.id}">${f.expanded ? '收起 ▴' : '展开 ▾'}</div>`
                : ''
              }
              <div class="f09-fan-card-footer">
                <span>${_escHtml(f.charName || '')} × ${_escHtml(f.userName || '')}</span>
                <span>${new Date(f.ts).toLocaleDateString()}</span>
              </div>
            </div>`;
        }).join('');

    return `
      <div class="f09-wrap">
        <div class="f09-header">
          <div class="f09-header-title">📖 频道文库</div>
          <button class="f09-tab-btn" data-tab="shelf">书架</button>
          <button class="f09-tab-btn active" data-tab="fanfic">同人工坊</button>
        </div>
        <div class="f09-scroll">
          ${_loading
            ? `<div class="freq-loading"><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div></div>`
            : `
              <div class="f09-fan-form">
                <div class="f09-fan-section">
                  <div class="f09-fan-label">题材</div>
                  <div class="f09-fan-btn-group">${genreButtons}</div>
                </div>
                <div class="f09-fan-section">
                  <div class="f09-fan-label">性向</div>
                  <div class="f09-fan-btn-group">${orientButtons}</div>
                </div>
                <div class="f09-fan-section">
                  <div class="f09-fan-label">关键词 <small>（可选，手动输入）</small></div>
                  <input type="text" id="f09-fan-keywords" class="f09-fan-input"
                    placeholder="如：雨天、咖啡馆、重逢…"
                    value="${_escHtml(_fanKeywords)}" />
                </div>
              </div>
              ${_renderAvoidSection()}
              ${historyHtml}
            `
          }
        </div>
        ${_statusText ? `<div class="f09-status">${_escHtml(_statusText)}</div>` : ''}
        <div class="f09-bottom-bar">
          <button id="f09-btn-gen-fan" ${_loading ? 'disabled' : ''}>
            ${_loading ? '⏳ 执笔中…' : '✨ 生成同人文'}
          </button>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════
  // 事件绑定
  // ══════════════════════════════════════════

  function _bindEvents(container) {
    // ── click──
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    _clickHandler = async (e) => {

      // Tab切换
      const tabBtn = e.target.closest('.f09-tab-btn');
      if (tabBtn) {
        const tab = tabBtn.dataset.tab;
        if (tab && tab !== _view) {
          _view = tab;
          _statusText = '';
          _render(); _bindEvents(_container);
        }
        return;
      }

      // 书架：删除书目（必须在book-card 之前判断）
      const delBtn = e.target.closest('.f09-book-del');
      if (delBtn) {
        const delId = Number(delBtn.dataset.delId);
        _library = _library.filter(b => b.id !== delId);
        await _saveLibrary();
        _statusText = '✓ 已删除';
        _render(); _bindEvents(_container);
        setTimeout(() => {
          if (_statusText.startsWith('✓')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 2000);
        return;
      }

      // 书架：点击书目进入阅读
      const bookCard = e.target.closest('.f09-book-card');
      if (bookCard && _view === 'shelf') {
        const bookId = Number(bookCard.dataset.bookId);
        const book = _library.find(b => b.id === bookId);
        if (book) {
          _currentBookId = bookId;
          _currentChExpanded = {};
          _view = 'read';
          _statusText = '';
          _render(); _bindEvents(_container);

          // 自动生成第一章
          if (book.chapters.length === 0) {
            _loading = true;
            _statusText = '⏳ 正在加载第一章…';
            _render(); _bindEvents(_container);

            try {
              const ch = await _generateChapter(book);
              book.chapters.push(ch);
              await _saveLibrary();
              _statusText = '✓ 第一章已加载';
              _currentChExpanded[0] = true;
            } catch (err) {
              _statusText = `⚠ ${err.message}`;
              _ctx.log.error('app09', '生成第一章失败', err.message);
            }

            _loading = false;
            if (!_container) return;
            _render(); _bindEvents(_container);

            setTimeout(() => {
              if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
                _statusText = '';
                if (_container) { _render(); _bindEvents(_container); }
              }
            }, 3000);
          }
        }return;
      }

      // 书架：扫描新书
      if (e.target.id === 'f09-btn-scan') {
        _loading = true;
        _statusText = '⏳ 正在扫描频道…';
        _render(); _bindEvents(_container);

        try {
          const newBooks = await _generateBooks();
          if (newBooks.length === 0) throw new Error('未扫描到新书');
          _library.push(...newBooks);
          await _saveLibrary();
          _statusText = `✓ 发现 ${newBooks.length} 本新书`;
          _ctx.notify.push('novel', '📖', '频道文库', `发现 ${newBooks.length} 本新书！`);
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app09', '扫描新书失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);

        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      //阅读：返回书架
      if (e.target.id === 'f09-btn-back') {
        _view = 'shelf';
        _currentBookId = null;
        _currentChExpanded = {};
        _statusText = '';
        _render(); _bindEvents(_container);
        return;
      }

      // 阅读：展开/收起章节
      const chHeader = e.target.closest('.f09-chapter-header');
      if (chHeader) {
        const idx = Number(chHeader.dataset.chIdx);
        _currentChExpanded[idx] = !_currentChExpanded[idx];
        _render(); _bindEvents(_container);
        return;
      }

      // 阅读：续更下一章
      if (e.target.id === 'f09-btn-next-ch') {
        const book = _getCurrentBook();
        if (!book) return;

        _loading = true;
        _statusText = '⏳ 正在续更…';
        _render(); _bindEvents(_container);

        try {
          const ch = await _generateChapter(book);
          book.chapters.push(ch);
          await _saveLibrary();
          const newIdx = book.chapters.length - 1;
          _currentChExpanded[newIdx] = true;
          _statusText = `✓ 第${ch.num}章「${ch.title}」已更新`;
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app09', '续更失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);

        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      // 同人工坊：题材选择
      const genreBtn = e.target.closest('.f09-genre-btn');
      if (genreBtn) {
        _fanGenre = genreBtn.dataset.genre;
        _render(); _bindEvents(_container);
        return;
      }

      // 同人工坊：性向选择
      const orientBtn = e.target.closest('.f09-orient-btn');
      if (orientBtn) {
        _fanOrientation = orientBtn.dataset.orient;
        _render(); _bindEvents(_container);
        return;
      }

      // 同人工坊：展开/收起历史
      const fanExpand = e.target.closest('.f09-fan-expand');
      if (fanExpand) {
        const fanId = Number(fanExpand.dataset.fanId);
        const item = _fanfics.find(f => f.id === fanId);
        if (item) {
          item.expanded = !item.expanded;
          _render(); _bindEvents(_container);
        }
        return;
      }

      // 同人工坊：生成同人文
      if (e.target.id === 'f09-btn-gen-fan') {
        _loading = true;
        _statusText = '⏳ 灵感酝酿中…';
        _render(); _bindEvents(_container);

        try {
          const fanfic = await _generateFanfic();
          fanfic.expanded = true;
          _fanfics.push(fanfic);
          await _saveFanfics();
          _statusText = `✓ 「${fanfic.title}」已完成`;
          _ctx.notify.push('novel', '📖', '同人工坊', `新作「${fanfic.title}」已出炉！`);
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app09', '生成同人文失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);

        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }
    };
    container.addEventListener('click', _clickHandler);

    // ── input（关键词 +雷点）──
    if (_inputHandler) container.removeEventListener('input', _inputHandler);
    _inputHandler = (e) => {
      if (e.target.id === 'f09-fan-keywords') {
        _fanKeywords = e.target.value;}
      if (e.target.id === 'f09-avoid-input') {
        _avoidTags = e.target.value;_saveAvoid(); // 实时保存
      }
    };
    container.addEventListener('input', _inputHandler);
  }

  // ══════════════════════════════════════════
  // 公开接口
  // ══════════════════════════════════════════

  return {
    id: 'novel',
    name: '频道文库',
    icon: '📖',

    init(ctx) {
      _ctx = ctx;
      _loadData();
    },

    async mount(container) {
      _container = container;
      _container.innerHTML = `<div class="freq-loading">
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
      </div>`;

      await _loadData();
      _view = 'shelf';
      _currentBookId = null;
      _currentChExpanded = {};
      _statusText = '';
      _render();
      _bindEvents(_container);
    },

    unmount() {
      if (_container && _clickHandler) _container.removeEventListener('click', _clickHandler);
      if (_container && _inputHandler) _container.removeEventListener('input', _inputHandler);
      _container = null;
    },
  };
})();
//============================================================ end block_18
// ============================================================
// block_20 — App11 · 跨次元外卖
// ============================================================
const App11Delivery = (() => {
  let _ctx = null;
  let _container = null;
  let _clickHandler = null;
  let _inputHandler = null;

  //── 状态变量 ──
  let _loading = false;
  let _statusText = '';
  let _order = null;          // 当前订单 { dishes, charName, weather, bgm, mood, time, deliveryPhase, careText }
  let _deliveryTimer = null;  // 配送动画定时器
  let _moodInput = '';// 用户手动输入的心情
  let _selectedCharName = ''; // 用户选择的角色（空=当前角色）
  let _charList = [];         // 可选角色列表
  let _charListLoaded = false;
  let _showCharPicker = false;
  let _orderHistory = [];     // 历史订单
  let _showHistory = false;

  // ── 常量 ──
  const STORE_KEY = 'app11_order';
  const HISTORY_KEY = 'app11_history';
  const MAX_HISTORY = 20;
  const DELIVERY_PHASES = [
    { label: '接单', icon: '📋', duration: 2000 },
    { label: '备餐', icon: '🔪', duration: 3000 },
    { label: '配送中', icon: '🛵', duration: 4000 },
    { label: '信号丢失', icon: '💫', duration: null },  // 永远停在这里
  ];

  // ── 工具函数 ──
  function _escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _getCharDesc(charName) {
    try {
      const chars = window.characters;
      if (!chars || !Array.isArray(chars)) return '';
      let c = null;
      if (charName) {
        c = chars.find(ch => ch && ch.name === charName);
      }
      if (!c) {
        const chid = window.this_chid;
        if (chid != null && chars[chid]) c = chars[chid];
      }
      if (!c) return '';
      return [c.description, c.personality, c.scenario].filter(Boolean).join('\n').slice(0, 800);
    } catch (e) { return ''; }
  }

  function _getRecentChat() {
    try {
      const msgs = _ctx.bridge.getRecentMessages(8);
      if (!msgs || msgs.length === 0) return '暂无';
      return msgs.map(m => {
        const who = m.is_user ? '用户' : (m.name || '角色');
        const txt = (m.mes || '').slice(0, 100);
        return `${who}: ${txt}`;
      }).join('\n').slice(0, 600);
    } catch (e) { return '暂无'; }
  }

  function _getActiveCharName() {
    if (_selectedCharName) return _selectedCharName;
    return _ctx.bridge.getCharName() || '未知角色';
  }

  // ── 天气获取（独立实现，失败则降级） ──
  async function _fetchWeatherInfo() {
    try {
      const apiKey = _ctx.settings.hefengApiKey || '';
      const locationEnabled = _ctx.settings.app04LocationEnabled !== false;
      if (!apiKey || !locationEnabled) return null;

      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('no geo'));
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude.toFixed(2), lon: p.coords.longitude.toFixed(2) }),
          () => reject(new Error('denied')),{ timeout: 5000 }
        );
      });

      // 查城市
      const geoRes = await fetch(
        `https://geoapi.qweather.com/v2/city/lookup?location=${pos.lon},${pos.lat}&key=${apiKey}&number=1`
      );
      const geoData = await geoRes.json();
      if (geoData.code !== '200' || !geoData.location?.length) return null;
      const cityId = geoData.location[0].id;
      const cityName = geoData.location[0].name;

      // 获取天气
      const wxRes = await fetch(
        `https://devapi.qweather.com/v7/weather/now?location=${cityId}&key=${apiKey}`
      );
      const wxData = await wxRes.json();
      if (wxData.code !== '200' || !wxData.now) return null;

      return {
        text: wxData.now.text,
        temp: wxData.now.temp,
        feelsLike: wxData.now.feelsLike,
        humidity: wxData.now.humidity,
        windDir: wxData.now.windDir,
        cityName,
      };
    } catch (e) {
      _ctx.log.info('app11', '天气获取失败，使用降级模式', e.message);
      return null;
    }
  }

  // ── BGM 获取 ──
  function _getBGMInfo() {
    try {
      const bgm = _ctx.parser.getLatestBGM(_ctx.bridge.getChatMessages());
      if (!bgm) return null;
      return typeof bgm === 'string' ? bgm : (bgm.title || bgm.name || JSON.stringify(bgm));
    } catch (e) { return null; }
  }

  // ── 角色列表获取 ──
  async function _fetchCharList() {
    let chars = null;
    try {
      if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        const stCtx = SillyTavern.getContext();
        if (stCtx.characters && Array.isArray(stCtx.characters) && stCtx.characters.length > 0) {
          chars = stCtx.characters;
        }
      }
    } catch (e) {}
    if (!chars) {
      try {
        if (typeof getContext === 'function') {
          const stCtx = getContext();
          if (stCtx.characters && Array.isArray(stCtx.characters) && stCtx.characters.length > 0) {
            chars = stCtx.characters;
          }
        }
      } catch (e) {}
    }
    if (!chars) {
      if (window.characters && Array.isArray(window.characters) && window.characters.length > 0) {
        chars = window.characters;
      }
    }
    if (!chars) return [];
    return chars.filter(c => c && c.name).map(c => c.name);
  }

  // ── 配送动画控制 ──
  function _startDeliveryAnimation() {
    _stopDeliveryAnimation();
    if (!_order) return;
    _order.deliveryPhase = 0;
    _order.deliveryStartTime = Date.now();
    _renderDeliveryOnly();

    let phaseIndex = 0;
    function advancePhase() {
      phaseIndex++;
      if (!_order || !_container) return;
      if (phaseIndex >= DELIVERY_PHASES.length) {
        // 到达最终阶段
        _order.deliveryPhase = DELIVERY_PHASES.length - 1;
        _renderDeliveryOnly();
        _stopDeliveryAnimation();
        return;
      }
      _order.deliveryPhase = phaseIndex;
      _renderDeliveryOnly();
      const nextPhase = DELIVERY_PHASES[phaseIndex];
      if (nextPhase.duration) {
        _deliveryTimer = setTimeout(advancePhase, nextPhase.duration);
      }// duration === null → 永远停在这里
    }

    const firstPhase = DELIVERY_PHASES[0];
    _deliveryTimer = setTimeout(advancePhase, firstPhase.duration);
  }

  function _stopDeliveryAnimation() {
    if (_deliveryTimer) {
      clearTimeout(_deliveryTimer);
      _deliveryTimer = null;
    }
  }

  // ── 只更新配送进度区域（不重绘整个页面，避免闪烁） ──
  function _renderDeliveryOnly() {
    if (!_container || !_order) return;
    const el = _container.querySelector('#f11-delivery-zone');
    if (el) el.innerHTML = _buildDeliveryHTML();
  }

  function _buildDeliveryHTML() {
    if (!_order) return '';
    const phase = _order.deliveryPhase ?? 0;
    const careText = _order.careText || '';

    let html = '<div class="f11-delivery-track">';
    DELIVERY_PHASES.forEach((p, i) => {
      const done = i< phase;
      const active = i === phase;
      const cls = done ? 'f11-phase-done' : (active ? 'f11-phase-active' : 'f11-phase-pending');
      html += `<div class="f11-phase ${cls}">`;
      html += `<div class="f11-phase-icon">${p.icon}</div>`;
      html += `<div class="f11-phase-label">${_escHtml(p.label)}</div>`;
      if (done) html += '<div class="f11-phase-check">✓</div>';
      if (active && i< DELIVERY_PHASES.length - 1) html += '<div class="f11-phase-pulse"></div>';
      html += '</div>';
      if (i < DELIVERY_PHASES.length - 1) {
        html += `<div class="f11-phase-line ${done ? 'f11-line-done' : ''}"></div>`;
      }
    });
    html += '</div>';

    // 最终阶段文案
    if (phase >= DELIVERY_PHASES.length - 1) {
      html += `<div class="f11-delivery-final">`;
      html += `<div class="f11-final-text">⏱ 预计送达：<span class="f11-never">永远不会送到</span></div>`;
      html += `<div class="f11-final-sub">这是异次元外卖。信号已在第三维度丢失。</div>`;
      if (careText) {
        html += `<div class="f11-care-bubble">`;
        html += `<div class="f11-care-char">${_escHtml(_order.charName || '角色')}</div>`;
        html += `<div class="f11-care-text">"${_escHtml(careText)}"</div>`;
        html += `</div>`;
      }
      html += `</div>`;
    } else {
      const elapsed = phase;
      const total = DELIVERY_PHASES.length;
      html += `<div class="f11-delivery-eta">⏱ 配送进度 ${elapsed}/${total - 1}…</div>`;
    }

    return html;
  }
    // ── 解析单个 dish 文本块 ──
  function _parseDishBlock(block) {
    if (!block || !block.trim()) return null;
    const lines = block.trim();

    // 多种正则策略匹配，兼容有无空格、有无冒号等变体
    const emojiMatch = lines.match(/\[图标\]\s*(.+?)(?:\n|\r|$)/)|| lines.match(/图标[：:]\s*(.+?)(?:\n|\r|$)/);
    const nameMatch  = lines.match(/\[菜名\]\s*(.+?)(?:\n|\r|$)/)
                    || lines.match(/菜名[：:]\s*(.+?)(?:\n|\r|$)/);
    const commentMatch = lines.match(/\[点评\]\s*(.+?)(?:\n|\r|\[理由\]|$)/s)|| lines.match(/点评[：:]\s*(.+?)(?:\n|\r|\[理由\]|$)/s);
    const reasonMatch  = lines.match(/\[理由\]\s*([\s\S]+?)$/)
                      || lines.match(/理由[：:]\s*([\s\S]+?)$/);

    const name = nameMatch ? nameMatch[1].trim() : '';
    const emoji = emojiMatch ? emojiMatch[1].trim() : '🍽️';
    const comment = commentMatch ? commentMatch[1].trim() : '';
    const reason = reasonMatch ? reasonMatch[1].trim() : '';

    // 如果连菜名都没有，尝试把整块当纯文本
    if (!name) {
      const plainText = block.replace(/\[.*?\]/g, '').trim();
      if (!plainText) return null;
      return {
        name: plainText.split('\n')[0].slice(0, 30) || '未知料理',
        emoji: '🍽️',
        comment: plainText.slice(0, 100),
        reason: plainText,expanded: false,
      };
    }

    return {
      name,
      emoji: emoji.length > 4 ? emoji.slice(0, 2) : emoji, // 防止emoji过长
      comment,
      reason,
      expanded: false,
    };
  }

  // ── 副API 调用：生成菜单──
   async function _generateOrder() {
    const charName = _getActiveCharName();
    const charDesc = _getCharDesc(charName);
    const weather = await _fetchWeatherInfo();
    const bgm = _getBGMInfo();
    const recentChat = _getRecentChat();
    const userName = _ctx.bridge.getUserName() || '用户';

    let weatherStr = '';
    if (weather) {
      weatherStr = `${weather.cityName}，${weather.text}，${weather.temp}°C，体感${weather.feelsLike}°C，湿度${weather.humidity}%`;
    } else if (_moodInput.trim()) {
      weatherStr = `天气未知。用户自述心情/状态：${_moodInput.trim()}`;
    } else {
      weatherStr = '天气未知，心情未知';
    }

    const bgmStr = bgm || '无BGM信息';
    const moodStr = _moodInput.trim() || '未提供';

    const messages = _ctx.subapi.buildMessages('app11_order', {
      char_desc: charDesc,
      recent_chat: recentChat,
      weather_info: weatherStr,
      bgm_info: bgmStr,
      user_mood: moodStr,
      user_name: userName,
      dish_count: String(Math.random() < 0.5 ? 2 : 3),
    });

    const raw = await _ctx.subapi.call(messages, { maxTokens: 800, temperature: 0.9 });

    //── 解析菜品（多策略兜底） ──
    let dishes = [];

    // 策略1：用parseResponse 提取 <dish> 标签
    const dishBlocks = _ctx.subapi.parseResponse(raw, 'dish');

    if (dishBlocks && dishBlocks.length > 0) {
      for (const block of dishBlocks) {
        const parsed = _parseDishBlock(block);
        if (parsed) dishes.push(parsed);
      }
    }

    // 策略2：如果 parseResponse 失败，手动用正则提取
    if (dishes.length === 0) {
      const manualMatches = raw.match(/<dish>([\s\S]*?)<\/dish>/gi);
      if (manualMatches && manualMatches.length > 0) {
        for (const m of manualMatches) {
          const inner = m.replace(/<\/?dish>/gi, '');
          const parsed = _parseDishBlock(inner);
          if (parsed) dishes.push(parsed);
        }
      }
    }

    // 策略3：最终兜底——把整段文本当作一道菜
    if (dishes.length === 0) {
      const text = _ctx.subapi.safeParseText(raw);
      dishes = [{
        name: '异次元特调料理',
        emoji: '🍽️',
        comment: text.slice(0, 150),
        reason: text.slice(0, 300),
        expanded: false,
      }];
      _ctx.log.warn('app11', '菜品解析全部失败，使用兜底', raw.slice(0, 200));
    }

    // 解析关心语
    const careBlocks = _ctx.subapi.parseResponse(raw, 'care');
    let careText = (careBlocks && careBlocks.length > 0) ? careBlocks[0].trim() : '';
    if (!careText) {
      const careMatch = raw.match(/<care>([\s\S]*?)<\/care>/i);
      if (careMatch) careText = careMatch[1].trim();
    }

    return {
      dishes,
      charName,
      weather: weather ? `${weather.text} ${weather.temp}°C` : (_moodInput.trim() || '未知'),
      bgm: bgm || '无',
      mood: _moodInput.trim() || '',
      time: new Date().toISOString(),
      deliveryPhase: 0,
      careText,
    };
  }

  // ── 持久化 ──
  async function _saveOrder() {
    if (_order) {
      await _ctx.store.set(STORE_KEY, _order);
    }
  }

  async function _loadOrder() {
    const saved = await _ctx.store.get(STORE_KEY);
    if (saved && saved.dishes) {
      _order = saved;
      //恢复时直接显示最终阶段
      _order.deliveryPhase = DELIVERY_PHASES.length - 1;
    }
  }

  async function _saveHistory() {
    await _ctx.store.set(HISTORY_KEY, _orderHistory);
  }

  async function _loadHistory() {
    const saved = await _ctx.store.get(HISTORY_KEY);
    if (saved && Array.isArray(saved)) {
      _orderHistory = saved;
    }
  }

  async function _pushToHistory(order) {
    const record = {
      dishes: order.dishes,
      charName: order.charName,
      weather: order.weather,
      bgm: order.bgm,
      time: order.time,
      careText: order.careText || '',
    };
    _orderHistory.unshift(record);
    if (_orderHistory.length > MAX_HISTORY) _orderHistory = _orderHistory.slice(0, MAX_HISTORY);
    await _saveHistory();
  }

  // ── 渲染 ──
  function _render() {
    if (!_container) return;
    _container.innerHTML = `
      <div class="f11-wrap">
        <div class="f11-scroll">
          ${_loading
            ? `<div class="freq-loading"><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div><div class="freq-loading-dot"></div></div>`
            : _renderContent()
          }
        </div>${_statusText ? `<div class="f11-status">${_escHtml(_statusText)}</div>` : ''}
        <div class="f11-bottom-bar">
          <button id="f11-btn-order" class="f11-btn-primary" ${_loading ? 'disabled' : ''}>
            ${_loading ? '⏳ 下单中…' : (_order ? '🔄 重新点单' : '🛵 开始点单')}
          </button>
          <button id="f11-btn-history" class="f11-btn-secondary" ${_loading ? 'disabled' : ''}>
            ${_showHistory ? '📋 返回' : '📜 历史'}
          </button>
        </div>
      </div>`;
  }

  function _renderContent() {
    if (_showHistory) return _renderHistory();
    if (!_order) return _renderEmpty();
    return _renderOrder();
  }

  function _renderEmpty() {
    let html = '<div class="f11-empty">';
    html += '<div class="f11-empty-icon">🛵</div>';
    html += '<div class="f11-empty-title">跨次元外卖</div>';
    html += '<div class="f11-empty-sub">让角色替你点一份来自异次元的外卖</div>';
    html += '</div>';

    // 心情输入区
    html += '<div class="f11-mood-section">';
    html += '<div class="f11-section-label">💭 你现在的心情/状态（可选）</div>';
    html += `<input type="text" id="f11-mood-input" class="f11-input"placeholder="比如：有点累、很开心、刚加完班…"
               value="${_escHtml(_moodInput)}" />`;
    html += '</div>';

    // 角色选择
    html += _renderCharPicker();

    return html;
  }

  function _renderCharPicker() {
    const currentChar = _ctx.bridge.getCharName() || '当前角色';
    let html = '<div class="f11-char-section">';
    html += '<div class="f11-section-label">👤 谁来替你点单？</div>';
    html += `<div class="f11-char-current" id="f11-toggle-picker">`;
    html += `<span class="f11-char-name">${_escHtml(_selectedCharName || currentChar)}</span>`;
    html += `<span class="f11-char-arrow">${_showCharPicker ? '▴' : '▾'}</span>`;
    html += `</div>`;

    if (_showCharPicker && _charListLoaded) {
      html += '<div class="f11-char-list">';
      // 当前角色选项
      html += `<div class="f11-char-option ${!_selectedCharName ? 'f11-char-selected' : ''}"data-char="">📍 ${_escHtml(currentChar)}（当前）</div>`;
      _charList.forEach(name => {
        if (name === currentChar) return;
        const sel = _selectedCharName === name ? 'f11-char-selected' : '';
        html += `<div class="f11-char-option ${sel}" data-char="${_escHtml(name)}">${_escHtml(name)}</div>`;
      });
      html += '</div>';
    } else if (_showCharPicker && !_charListLoaded) {
      html += '<div class="f11-char-loading">加载角色列表中…</div>';
    }

    html += '</div>';
    return html;
  }

    function _renderOrder() {
    const o = _order;
    let html = '';

    // 顶部信息条
    html += '<div class="f11-order-header">';
    html += `<div class="f11-order-title">🛵 ${_escHtml(o.charName)} 替你点的单</div>`;
    html += `<div class="f11-order-meta">`;
    html += `<span>🌤️ ${_escHtml(o.weather)}</span>`;
    html += `<span>🎵 ${_escHtml(o.bgm.length > 15 ? o.bgm.slice(0, 15) + '…' : o.bgm)}</span>`;
    html += `</div>`;
    const t = o.time ? new Date(o.time) : new Date();
    html += `<div class="f11-order-time">下单时间：${t.getMonth()+1}/${t.getDate()} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}</div>`;
    html += '</div>';

    // 菜品列表
    html += '<div class="f11-dishes">';
    o.dishes.forEach((dish, i) => {
      const hasDetail = dish.reason || dish.comment;
      const isExpanded = dish.expanded;

      html += `<div class="f11-dish-card" style="animation-delay:${i * 0.15}s">`;

      //菜品头部（可点击展开）
      html += `<div class="f11-dish-header f11-dish-toggle" data-dish-idx="${i}">`;
      html += `<span class="f11-dish-emoji">${dish.emoji || '🍽️'}</span>`;
      html += `<span class="f11-dish-name">${_escHtml(dish.name)}</span>`;
      if (hasDetail) {
        html += `<span class="f11-dish-arrow">${isExpanded ? '▴' : '▾'}</span>`;
      }
      html += `</div>`;

      // 简短点评（始终显示）
      if (dish.comment) {
        html += `<div class="f11-dish-comment">"${_escHtml(dish.comment)}"</div>`;
      }

      // 详细理由（展开后显示）
      if (isExpanded && dish.reason) {
        html += `<div class="f11-dish-reason">`;
        html += `<div class="f11-reason-label">💭 为什么选这道：</div>`;
        html += `<div class="f11-reason-text">${_escHtml(dish.reason)}</div>`;
        html += `</div>`;
      }

      // 展开提示
      if (hasDetail && !isExpanded) {
        html += `<div class="f11-dish-hint f11-dish-toggle" data-dish-idx="${i}">点击查看选择理由 ▾</div>`;
      }

      html += `</div>`;
    });
    html += '</div>';

    // 配送进度区
    html += `<div id="f11-delivery-zone" class="f11-delivery-zone">${_buildDeliveryHTML()}</div>`;

    // 心情输入（重新点单时可改）
    html += '<div class="f11-mood-section f11-mood-reorder">';
    html += '<div class="f11-section-label">💭 更新心情（重新点单时生效）</div>';
    html += `<input type="text" id="f11-mood-input" class="f11-input"placeholder="比如：有点累、很开心…"
               value="${_escHtml(_moodInput)}" />`;
    html += '</div>';

    // 角色选择
    html += _renderCharPicker();

    return html;
  }

  function _renderHistory() {
    if (_orderHistory.length === 0) {
      return `<div class="freq-empty-state">
        <div style="font-size:2em;margin-bottom:8px">📜</div>
        <div>还没有历史订单</div>
      </div>`;
    }

    let html = '<div class="f11-history-title">📜 历史订单</div>';
    _orderHistory.forEach((o, idx) => {
      const t = o.time ? new Date(o.time) : new Date();
      const dateStr = `${t.getMonth()+1}/${t.getDate()} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
      html += `<div class="f11-history-card">`;
      html += `<div class="f11-history-header">`;
      html += `<span class="f11-history-char">${_escHtml(o.charName)}</span>`;
      html += `<span class="f11-history-date">${dateStr}</span>`;
      html += `</div>`;
      html += `<div class="f11-history-meta">${_escHtml(o.weather)} · ${_escHtml(o.bgm.length > 12 ? o.bgm.slice(0,12)+'…' : o.bgm)}</div>`;
      html += `<div class="f11-history-dishes">`;
      o.dishes.forEach(d => {
        html += `<span class="f11-history-dish">${d.emoji || '🍽️'} ${_escHtml(d.name)}</span>`;
      });
      html += `</div>`;
      if (o.careText) {
        html += `<div class="f11-history-care">"${_escHtml(o.careText)}"</div>`;
      }
      html += `</div>`;
    });
    return html;
  }

  // ── 事件绑定 ──
   function _bindEvents(container) {
    if (_clickHandler) container.removeEventListener('click', _clickHandler);
    _clickHandler = async (e) => {

      // 菜品展开/收起
      const dishToggle = e.target.closest('.f11-dish-toggle');
      if (dishToggle && _order && _order.dishes) {
        const idx = parseInt(dishToggle.dataset.dishIdx, 10);
        if (!isNaN(idx) && _order.dishes[idx]) {
          _order.dishes[idx].expanded = !_order.dishes[idx].expanded;
          _saveOrder().catch(() => {});
          _render(); _bindEvents(_container);
        }
        return;
      }

      // 点单按钮
      if (e.target.id === 'f11-btn-order' || e.target.closest('#f11-btn-order')) {
        if (_loading) return;
        _showHistory = false;
        _loading = true;
        _statusText = '⏳ 正在跨次元下单…';
        _render(); _bindEvents(_container);

        try {
          if (_order) {
            await _pushToHistory(_order);
          }
          _order = await _generateOrder();
          await _saveOrder();
          _statusText = '✓ 下单成功！配送中…';
        } catch (err) {
          _statusText = `⚠ ${err.message}`;
          _ctx.log.error('app11', '点单失败', err.message);
        }

        _loading = false;
        if (!_container) return;
        _render(); _bindEvents(_container);

        if (_order && !_statusText.startsWith('⚠')) {
          _startDeliveryAnimation();
          try {
            const dishNames = _order.dishes.map(d => `${d.emoji} ${d.name}`).join('、');
            _ctx.notify.push('delivery', '🛵', `${_order.charName} 的外卖`, dishNames);
          } catch (e) {}
        }

        setTimeout(() => {
          if (_statusText.startsWith('✓') || _statusText.startsWith('⚠')) {
            _statusText = '';
            if (_container) { _render(); _bindEvents(_container); }
          }
        }, 3000);
        return;
      }

      // 历史按钮
      if (e.target.id === 'f11-btn-history' || e.target.closest('#f11-btn-history')) {
        _showHistory = !_showHistory;
        _render(); _bindEvents(_container);
        return;
      }

      // 角色选择器切换
      if (e.target.id === 'f11-toggle-picker' || e.target.closest('#f11-toggle-picker')) {
        _showCharPicker = !_showCharPicker;
        if (_showCharPicker && !_charListLoaded) {
          _render(); _bindEvents(_container);
          _charList = await _fetchCharList();
          _charListLoaded = true;
          if (!_container) return;
        }
        _render(); _bindEvents(_container);
        return;
      }

      // 角色选项点击
      const charOpt = e.target.closest('.f11-char-option');
      if (charOpt) {
        const name = charOpt.dataset.char || '';
        _selectedCharName = name;
        _showCharPicker = false;
        _render(); _bindEvents(_container);
        return;
      }
    };
    container.addEventListener('click', _clickHandler);

    // input 事件
    if (_inputHandler) container.removeEventListener('input', _inputHandler);
    _inputHandler = (e) => {
      if (e.target.id === 'f11-mood-input') {
        _moodInput = e.target.value;}
    };
    container.addEventListener('input', _inputHandler);
  }


  // ── 公开接口 ──
  return {
    id: 'delivery',
    name: '跨次元外卖',
    icon: '🛵',

    init(ctx) {
      _ctx = ctx;
      // 后台加载历史数据
      _loadHistory().catch(() => {});
    },

    async mount(container) {
      _container = container;
      _container.innerHTML = `<div class="freq-loading">
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
        <div class="freq-loading-dot"></div>
      </div>`;

      await _loadOrder();
      await _loadHistory();
      _render();
      _bindEvents(_container);
    },

    unmount() {
      _stopDeliveryAnimation();
      if (_container && _clickHandler) _container.removeEventListener('click', _clickHandler);
      if (_container && _inputHandler) _container.removeEventListener('input', _inputHandler);
      _container = null;
    },
  };
})();
// ============================================================ end block_20
// ============================================================
//  App06  —  宇宙频率·感知
//  角色在user 不在时的留言墙 / 后台消息归宿 / 第四面墙感知
// ============================================================
const App06Cosmic = (() => {
  const APP_ID = 'cosmic';
  const STORE_KEY = 'cosmic_messages';
  const LAST_OPEN_KEY = 'cosmic_last_open';
  const MAX_MESSAGES = 200;

  let _ctx = null;       // { settings, bus, store, bridge, parser, subapi, notify, log }
  let _container = null;
  let _messages = [];
  let _mounted = false;
  let _offlineTimer = null;
  let _cachedWeather = null;

  //── 初始化 ──
  function init(ctx) {
    _ctx = ctx;

    // 监听后台消息 → 自动存入宇宙频率
    _ctx.bus.on('bg:message', _onBgMessage);

    // 监听天气更新（来自 App04）
    _ctx.bus.on('weather:updated', (w) => { _cachedWeather = w; });

    // 监听聊天切换 → 刷新
    _ctx.bus.on('chat:loaded', () => {
      if (_mounted) _renderMessages();
    });

    // 记录本次打开时间
    _recordOpenTime();

    _loadMessages();

    _ctx.log.info(APP_ID, '宇宙频率·感知已初始化');
  }

  // ── mount / unmount ──
  function mount(el) {
    _container = el;
    _mounted = true;
    _render();
    _startOfflineTimer();
    _recordOpenTime();
  }

  function unmount() {
    _mounted = false;
    _container = null;
    _stopOfflineTimer();
  }

  // ══════════════════════════════════════
  //  数据层
  // ══════════════════════════════════════

  async function _loadMessages() {
    try {
      const data = await _ctx.store.get(STORE_KEY);
      _messages = Array.isArray(data) ? data : [];
    } catch (e) {
      _ctx.log.error(APP_ID, '加载消息失败', e);
      _messages = [];
    }
  }

  async function _saveMessages() {
    try {
      if (_messages.length > MAX_MESSAGES) {
        _messages = _messages.slice(0, MAX_MESSAGES);
      }
      await _ctx.store.set(STORE_KEY, _messages);
    } catch (e) {
      _ctx.log.error(APP_ID, '保存消息失败', e);
    }
  }

  async function _addMessage(msg) {
    msg.id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    msg.timestamp = msg.timestamp || Date.now();
    _messages.unshift(msg);
    await _saveMessages();
    if (_mounted) _renderMessages();
  }

  async function _clearMessages() {
    _messages = [];
    await _saveMessages();if (_mounted) _renderMessages();
  }

  async function _getLastOpenTime() {
    try {
      const t = await _ctx.store.get(LAST_OPEN_KEY);
      return t || 0;
    } catch { return 0; }
  }

  async function _recordOpenTime() {
    try {
      await _ctx.store.set(LAST_OPEN_KEY, Date.now());
    } catch (e) {
      _ctx.log.error(APP_ID, '记录打开时间失败', e);
    }
  }

  // ══════════════════════════════════════
  //  离线时长
  // ══════════════════════════════════════

  function _formatDuration(ms) {
    if (ms <= 0) return '刚刚';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (day > 0) return `${day}天${hr % 24}小时`;
    if (hr > 0) return `${hr}小时${min % 60}分钟`;
    if (min > 0) return `${min}分钟`;
    return `${sec}秒`;
  }

  function _startOfflineTimer() {
    _stopOfflineTimer();
    _updateOfflineDisplay();
    _offlineTimer = setInterval(_updateOfflineDisplay, 30000);
  }

  function _stopOfflineTimer() {
    if (_offlineTimer) {
      clearInterval(_offlineTimer);
      _offlineTimer = null;
    }
  }

  async function _updateOfflineDisplay() {
    if (!_mounted || !_container) return;
    const el = _container.querySelector('.cosmic-offline-value');
    if (!el) return;
    const lastOpen = await _getLastOpenTime();
    if (lastOpen > 0) {
      const dur = Date.now() - lastOpen;
      el.textContent = _formatDuration(dur);
    } else {
      el.textContent = '首次连线';
    }
  }

  // ══════════════════════════════════════
  //  天气获取（复用 App04 的和风天气配置）
  // ══════════════════════════════════════

  async function _fetchWeatherForCosmic() {
    // 优先用缓存
    if (_cachedWeather) return _cachedWeather;

    const key = _ctx.settings.hefengApiKey;
    if (!key) return null;

    //尝试用 IP 定位
    try {
      const locResp = await fetch(`https://geoip.qweather.net/v2/?key=${key}`);
      if (!locResp.ok) return null;
      const locData = await locResp.json();
      const locId = locData?.location?.[0]?.id;
      const cityName = locData?.location?.[0]?.name || '未知';
      if (!locId) return null;

      const weatherResp = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${locId}&key=${key}`);
      if (!weatherResp.ok) return null;
      const weatherData = await weatherResp.json();
      const now = weatherData?.now;
      if (!now) return null;

      const result = {
        city: cityName,
        text: now.text || '',
        temp: now.temp || '',
        feelsLike: now.feelsLike || '',
        humidity: now.humidity || '',
        windDir: now.windDir || '',
        windScale: now.windScale || '',};
      _cachedWeather = result;
      return result;
    } catch (e) {
      _ctx.log.warn(APP_ID, '天气获取失败', e.message);
      return null;
    }
  }

  function _weatherToString(w) {
    if (!w) return '天气未知';
    return `${w.city} ${w.text} ${w.temp}°C体感${w.feelsLike}°C 湿度${w.humidity}% ${w.windDir}${w.windScale}级`;
  }

  // ══════════════════════════════════════
  //  后台消息接收
  // ══════════════════════════════════════

  function _onBgMessage(data) {
    if (!data || !data.text) return;
    _addMessage({
      charName: data.charName || '未知信号源',
      text: data.text,
      type: 'bg_message',
      context: {
        realTime: new Date().toLocaleString('zh-CN'),
        cosmicStatus: _getCosmicStatus(),},
    });
    _ctx.log.info(APP_ID, `收到后台消息: ${data.charName}`);
  }

  // ══════════════════════════════════════
  //  感知消息生成（打开 App时触发）
  // ══════════════════════════════════════

  async function _generatePerception() {
    if (!_ctx.settings.apiUrl || !_ctx.settings.apiKey || !_ctx.settings.apiModel) {
      _ctx.log.warn(APP_ID, '副API 未配置，跳过感知生成');
      return;
    }

    const lastOpen = await _getLastOpenTime();
    const offlineDur = lastOpen > 0 ? Date.now() - lastOpen : 0;
    const offlineStr = lastOpen > 0 ? _formatDuration(offlineDur) : '未知';

    // 离线不到 10 分钟不触发
    if (offlineDur > 0 && offlineDur < 10 * 60 * 1000) {
      _ctx.log.info(APP_ID, '离线不足 10 分钟，跳过感知生成');
      return;
    }

    const weather = await _fetchWeatherForCosmic();
    const weatherStr = _weatherToString(weather);
    const charName = _ctx.bridge.getCharName();
    const cosmicStatus = _getCosmicStatus();

    const now = new Date();
    const hour = now.getHours();
    let timeHint = '';
    if (hour >= 0 && hour < 5) timeHint = '深夜';
    else if (hour >= 5 && hour < 8) timeHint = '清晨';
    else if (hour >= 8 && hour < 12) timeHint = '上午';
    else if (hour >= 12 && hour < 14) timeHint = '午后';
    else if (hour >= 14 && hour < 18) timeHint = '下午';
    else if (hour >= 18 && hour < 21) timeHint = '傍晚';
    else timeHint = '夜晚';

    const messages = _ctx.subapi.buildMessages('app06', {
      weather_info: weatherStr,
      offline_duration: offlineStr,
      time_hint: timeHint,
      char_desc: (() => {
        const c = _ctx.bridge.getCurrentChar();
        return c?.description || c?.data?.description || '';
      })(),
    });

    _setGenerating(true);

    try {
      const text = await _ctx.subapi.call(messages, { maxTokens: 200, temperature: 0.9 });
      if (text) {
        const cleaned = _ctx.subapi.safeParseText(text);
        await _addMessage({
          charName,
          text: cleaned,
          type: 'perception',
          context: {
            realTime: now.toLocaleString('zh-CN'),
            timeHint,
            weather: weatherStr,
            offlineDuration: offlineStr,
            cosmicStatus,
          },
        });
        _ctx.notify.push(APP_ID, '🌌', '宇宙频率·感知', `${charName} 留下了一条信号`, { silent: false });
      }
    } catch (e) {
      _ctx.log.error(APP_ID, '感知生成失败', e.message);
    } finally {
      _setGenerating(false);
    }
  }

  // ── 其他角色留言生成 ──
  async function _generateOtherCharMessage() {
    if (!_ctx.settings.apiUrl || !_ctx.settings.apiKey || !_ctx.settings.apiModel) return;

    const chars = _ctx.bridge.getCharacters();
    const currentName = _ctx.bridge.getCharName();
    const others = chars.filter(c => {
      const name = c.name || c.data?.name || '';
      return name && name !== currentName;
    });

    if (others.length === 0) {
      _ctx.log.info(APP_ID, '没有其他角色可用');
      return;
    }

    const pick = others[Math.floor(Math.random() * others.length)];
    const pickName = pick.name || pick.data?.name || '未知';
    const pickDesc = pick.description || pick.data?.description || '';

    const now = new Date();
    const systemPrompt = `你是 [${pickName}]，以下是你的人设：
${pickDesc}
现在是 ${now.toLocaleString('zh-CN')}。
宇宙频率状态：${_getCosmicStatus()}
约束：严格保持角色性格 · 不提AI/模型/扮演 · 不超过 80 字
若宇宙频率开启，可以隐晦感知「屏幕外」。只输出内容本身，无前缀。`;

    const taskPrompt = `你不在正式广播中。现在是你独处的时间。
写一条留言，可以是自言自语、碎碎念、对某人说的话、或者某个瞬间的感受。
保持你自己的性格和语气。不超过 80 字。只输出留言本身。`;

    _setGenerating(true);

    try {
      const text = await _ctx.subapi.call([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: taskPrompt },
      ], { maxTokens: 200, temperature: 0.9 });

      if (text) {
        const cleaned = _ctx.subapi.safeParseText(text);
        await _addMessage({
          charName: pickName,
          text: cleaned,
          type: 'other_char',
          context: {
            realTime: now.toLocaleString('zh-CN'),
            cosmicStatus: _getCosmicStatus(),
          },
        });
        _ctx.notify.push(APP_ID, '🌌', '宇宙频率·感知', `${pickName} 在频率中留下了痕迹`);
      }
    } catch (e) {
      _ctx.log.error(APP_ID, '其他角色留言生成失败', e.message);
    } finally {
      _setGenerating(false);
    }
  }

  // ══════════════════════════════════════
  //  辅助
  // ══════════════════════════════════════

  function _getCosmicStatus() {
  // 优先读取用户设置，其次读取聊天记录
  if (_ctx.settings.cosmicFreqEnabled !== undefined) {
    return _ctx.settings.cosmicFreqEnabled ? '开启' : '未开启';
  }
  const msgs = _ctx.bridge.getChatMessages();
  return _ctx.parser.inferCosmicStatus(msgs);
}

  function _setGenerating(isGen) {
    if (!_mounted || !_container) return;
    const btn = _container.querySelector('.cosmic-gen-btn');
    const spinner = _container.querySelector('.cosmic-spinner');
    if (btn) btn.disabled = isGen;
    if (spinner) spinner.style.display = isGen ? 'inline-block' : 'none';
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function _timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  }

  function _getTypeLabel(type) {
    switch (type) {
      case 'perception': return '感知';
      case 'bg_message': return '后台信号';
      case 'other_char': return '跨频留言';
      default: return '信号';
    }
  }

  function _getTypeIcon(type) {
    switch (type) {
      case 'perception': return '👁️';
      case 'bg_message': return '📡';
      case 'other_char': return '🔗';
      default: return '✦';
    }
  }

  // ══════════════════════════════════════
  //  渲染
  // ══════════════════════════════════════

  function _render() {
    if (!_container) return;

    const cosmicStatus = _getCosmicStatus();
    const isOpen = cosmicStatus === '开启';

    _container.innerHTML = `
      <div class="cosmic-app">

        <!--顶部状态区 -->
        <div class="cosmic-header">
        <div class="cosmic-status-orb ${isOpen ? 'cosmic-orb-on' : 'cosmic-orb-off'}" data-action="toggle-cosmic">
            <div class="cosmic-orb-core"></div>
            <div class="cosmic-orb-ring"></div>
            <div class="cosmic-orb-ring cosmic-orb-ring-2"></div>
          </div>
          <div class="cosmic-status-info">
            <div class="cosmic-status-label">宇宙频率</div>
            <div class="cosmic-status-value ${isOpen ? 'cosmic-on' : 'cosmic-off'}">${isOpen ? '▣ 已开启' : '▢ 未开启'}</div>
          </div>
          <div class="cosmic-offline-block">
            <div class="cosmic-offline-label">上次连线</div>
            <div class="cosmic-offline-value">计算中…</div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="cosmic-toolbar">
          <button class="cosmic-gen-btn cosmic-btn-perception" data-action="perception">
            <span class="cosmic-spinner" style="display:none;"></span>
            👁️ 感知
          </button>
          <button class="cosmic-gen-btn cosmic-btn-other" data-action="other_char">🔗 跨频
          </button>
          <button class="cosmic-btn-clear" data-action="clear">🗑️</button>
        </div>

        <!-- 消息流 -->
        <div class="cosmic-feed" id="cosmic-feed">
          <div class="cosmic-feed-empty">
            <div class="cosmic-empty-icon">🌌</div>
            <div class="cosmic-empty-text">频率沉默中…<br><span>等待信号接入</span></div>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="cosmic-footer">
          <span class="cosmic-footer-dot"></span>
          <span class="cosmic-footer-text">FREQ · COSMIC PERCEPTION</span>
          <span class="cosmic-footer-dot"></span>
        </div>

      </div>
    `;

    _bindEvents();
    _renderMessages();
    _updateOfflineDisplay();
  }

  function _renderMessages() {
    if (!_container) return;
    const feed = _container.querySelector('#cosmic-feed');
    if (!feed) return;

    if (_messages.length === 0) {
      feed.innerHTML = `
        <div class="cosmic-feed-empty">
          <div class="cosmic-empty-icon">🌌</div>
          <div class="cosmic-empty-text">频率沉默中…<br><span>等待信号接入</span></div>
        </div>`;
      return;
    }

    feed.innerHTML = _messages.map((msg, i) => {
      const typeIcon = _getTypeIcon(msg.type);
      const typeLabel = _getTypeLabel(msg.type);
      const timeStr = _timeAgo(msg.timestamp);
      const ctx = msg.context || {};

      // 上下文标签
      let ctxTags = '';
      if (ctx.timeHint) ctxTags += `<span class="cosmic-tag cosmic-tag-time">${_escHtml(ctx.timeHint)}</span>`;
      if (ctx.weather && ctx.weather !== '天气未知') ctxTags += `<span class="cosmic-tag cosmic-tag-weather">🌡️</span>`;
      if (ctx.offlineDuration && ctx.offlineDuration !== '未知') ctxTags += `<span class="cosmic-tag cosmic-tag-offline">⏱️${_escHtml(ctx.offlineDuration)}</span>`;
      if (ctx.cosmicStatus === '开启') ctxTags += `<span class="cosmic-tag cosmic-tag-cosmic">✦</span>`;

      return `
        <div class="cosmic-msg cosmic-msg-${msg.type} cosmic-msg-enter" style="animation-delay:${i * 0.06}s">
          <div class="cosmic-msg-glow"></div>
          <div class="cosmic-msg-header">
            <span class="cosmic-msg-type-icon">${typeIcon}</span>
            <span class="cosmic-msg-char">${_escHtml(msg.charName)}</span>
            <span class="cosmic-msg-type-label">${typeLabel}</span>
            <span class="cosmic-msg-time">${timeStr}</span>
          </div>
          <div class="cosmic-msg-body">${_escHtml(msg.text)}</div>
          ${ctxTags ? `<div class="cosmic-msg-tags">${ctxTags}</div>` : ''}
        </div>`;
    }).join('');
  }

  function _bindEvents() {
  if (!_container) return;

  _container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    // ← ← ← 新增：切换宇宙频率状态 ↓ ↓ ↓
    if (action === 'toggle-cosmic') {
      const currentStatus = _ctx.settings.cosmicFreqEnabled !== false;
      _ctx.settings.cosmicFreqEnabled = !currentStatus;
      
      // 保存设置
      if (typeof FreqBridge !== 'undefined' && FreqBridge.saveSettings) {
        FreqBridge.saveSettings(_ctx.settings);
      }
      
      // 更新后台定时器
      if (_ctx.settings.cosmicFreqEnabled) {
        if (_ctx.settings.apiUrl && _ctx.settings.apiKey && _ctx.settings.apiModel) {
          _ctx.subapi.startBackgroundTimer();
        }
        _ctx.notify.push('cosmic', '🌌', '宇宙频率', '已开启');
      } else {
        _ctx.subapi.stopBackgroundTimer();
        _ctx.notify.push('cosmic', '🌌', '宇宙频率', '已关闭');
      }
      
      // 重新渲染
      _render();
    // ↑ ↑ ↑ 新增结束
      
    } else if (action === 'perception') {
      // ← ← ← 新增：检查 API 配置 ↓ ↓ ↓
      if (!_ctx.settings.apiUrl || !_ctx.settings.apiKey || !_ctx.settings.apiModel) {
        _ctx.notify.push('cosmic', '⚠️', '宇宙频率', '请先在设置中配置副 API');
        _ctx.log.warn('cosmic', '副 API 未配置');
        return;
      }
      // ↑ ↑ ↑ 新增结束
      await _generatePerception();
      
    } else if (action === 'other_char') {
      // ← ← ← 新增：检查 API 配置 ↓ ↓ ↓
      if (!_ctx.settings.apiUrl || !_ctx.settings.apiKey || !_ctx.settings.apiModel) {
        _ctx.notify.push('cosmic', '⚠️', '宇宙频率', '请先在设置中配置副 API');
        return;
      }
      // ↑ ↑ ↑ 新增结束
      await _generateOtherCharMessage();
      
    } else if (action === 'clear') {
      if (confirm('确定清空所有宇宙频率记录？')) {
        await _clearMessages();
      }
    }
  });
}

  // ── 公开接口 ──
  return {
    id: APP_ID,
    name: '宇宙频率·感知',
    icon: '🌌',
    init,
    mount,
    unmount,
    // 供外部调用（如后台触发改造）
    addMessage: (msg) => _addMessage(msg),
    getMessages: () => [..._messages],
  };
})();
// ============================================================ end of app06






// ============================================================
//  block_99  —  App 注册 & UI 渲染 & 初始化
// ============================================================
const FreqTerminal = (() => {
  let _settings = {};
  let _appRegistry = {};
  let _currentApp = null;
  let _phoneOpen = false;
  let _drawerOpen = false;

  //悬浮球拖拽
  let _fabDragging = false;
  let _fabMoved = false;
  let _fabStartX = 0;
  let _fabStartY = 0;
  let _fabOffsetX = 0;
  let _fabOffsetY = 0;

  // DOM
  let _fab = null;
  let _overlay = null;
  let _phone = null;
  let _screen = null;
  let _homeScreen = null;
  let _appPage = null;
  let _drawer = null;

  // 事件处理器（防重复绑定）
  let _handlers = {};

  // ── 初始化 ──
  function init() {
    FreqLog.info('system', `Freq Terminal v${FREQ_VERSION} 初始化中...`);

    _loadSettings();
    FreqNotify.init(_settings);
    FreqSubAPI.init(_settings);
    FreqStore.open().catch(() => {});

    _buildDOM();
    _injectSettingsPanel();
    _bindSettingsEvents();

    // 延迟同步 UI（等settings.html 注入完成）
    setTimeout(() => { _syncSettingsUI(); }, 600);

    _listenSTEvents();

   if (_settings.enabled && 
      _settings.cosmicFreqEnabled !== false && 
      _settings.apiUrl && 
      _settings.apiKey && 
      _settings.apiModel) {
    FreqSubAPI.startBackgroundTimer();
  }

    _registerAllApps();

    FreqLog.info('system', '初始化完成 ✓');
    FreqNotify.push('system', '📻', 'Freq Terminal', '频率终端已上线', { silent: true });
  }

  // ── 设置管理 ──
  function _loadSettings() {
    const saved = FreqBridge.loadSettings();
    _settings = _deepMerge({}, FREQ_DEFAULTS, saved || {});
    if (!_settings.prompts) _settings.prompts = {};
    for (const [k, v] of Object.entries(FREQ_DEFAULTS.prompts)) {
      if (!_settings.prompts[k]) _settings.prompts[k] = v;
    }
  }

  function _saveSettings() {
    FreqBridge.saveSettings(_settings);
  }

  function _deepMerge(target, ...sources) {
    for (const src of sources) {
      if (!src) continue;
      for (const key of Object.keys(src)) {
        if (src[key] && typeof src[key] === 'object' && !Array.isArray(src[key])) {
          if (!target[key] || typeof target[key] !== 'object') target[key] = {};
          _deepMerge(target[key], src[key]);
        } else {
          target[key] = src[key];
        }
      }
    }
    return target;
  }

  // ── 注入配置面板到 ST扩展区域 ──
  function _injectSettingsPanel() {
    // ST 1.15第三方扩展的设置面板容器
    // 查找方式：extensions_settings 区域内，以插件名命名的容器
    // 如果 ST 没有自动加载 settings.html，我们手动加载并注入
    const settingsContainerId = 'freq-terminal-settings';

    // 检查是否已经存在
    if (document.getElementById('freq-settings-panel')) {
      FreqLog.info('system', '配置面板已存在，跳过注入');
      return;
    }

    // 方法：通过 fetch 加载 settings.html 并注入到 ST 扩展面板
    const extensionPath = '/scripts/extensions/third-party/freq-terminal';

    fetch(`${extensionPath}/settings.html`)
      .then(resp => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.text();
      })
      .then(html => {
        // 查找 ST 的扩展设置容器
        // ST 1.15 中，第三方扩展设置通常在 #extensions_settings 或 #extensions_settings2
        let container = document.getElementById(settingsContainerId);

        if (!container) {
          //尝试找到 ST 的扩展设置区域并创建我们的容器
          const possibleParents = [
            document.getElementById('extensions_settings'),
            document.getElementById('extensions_settings2'),
            document.querySelector('.extensions_block'),
          ];

          let parent = null;
          for (const p of possibleParents) {
            if (p) { parent = p; break; }
          }

          if (!parent) {
            // 最后手段：找#top-settings-holder 或创建到 body
            parent = document.getElementById('top-settings-holder') || document.body;
          }

          container = document.createElement('div');
          container.id = settingsContainerId;
          container.classList.add('extension_container');
          parent.appendChild(container);
        }

        container.innerHTML = html;

        // 加载 settings.css
        if (!document.querySelector('link[href*="freq-terminal/settings.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `${extensionPath}/settings.css`;
          document.head.appendChild(link);
        }

        FreqLog.info('system', '配置面板已注入');

        // 注入完成后同步 UI
        setTimeout(() => { _syncSettingsUI(); }, 100);
      })
      .catch(err => {
        FreqLog.error('system', '加载 settings.html 失败', err.message);
      });
  }

  // ── 构建 DOM ──
  function _buildDOM() {
    //悬浮球
    _fab = document.createElement('div');
    _fab.id = 'freq-fab';
    _fab.innerHTML = `📻<span id="freq-fab-badge"></span>`;
    if (!_settings.enabled || !_settings.fabEnabled) _fab.classList.add('freq-fab-hidden');
    if (_settings.fabPosX >= 0 && _settings.fabPosY >= 0) {
      _fab.style.right = 'auto';
      _fab.style.bottom = 'auto';
      _fab.style.left = _settings.fabPosX + 'px';
      _fab.style.top = _settings.fabPosY + 'px';
    }
    document.body.appendChild(_fab);

    //遮罩 + 手机
    _overlay = document.createElement('div');
    _overlay.id = 'freq-overlay';
    _overlay.innerHTML = `
      <div id="freq-phone">
        <div id="freq-phone-left-buttons"></div>
        <button id="freq-phone-close" title="关闭">✕</button>
        <div id="freq-phone-notch"></div>
        <div id="freq-statusbar">
          <span id="freq-statusbar-left"></span>
          <span id="freq-statusbar-right">
            <span>📶</span>
            <span>🔋</span>
          </span>
        </div><div id="freq-screen">
          <div id="freq-notify-drawer">
            <div id="freq-notify-drawer-handle">
              <span id="freq-notify-drawer-handle-bar"></span>
            </div>
            <div id="freq-notify-list"></div>
            <button class="freq-notify-clear-btn" id="freq-notify-clear">清除所有通知</button>
          </div>
          <div id="freq-home-screen">
            <div class="freq-app-grid" id="freq-app-grid"></div>
          </div>
          <div id="freq-app-page">
            <div class="freq-app-topbar">
              <span class="freq-app-back" id="freq-app-back">‹</span>
              <span class="freq-app-topbar-title" id="freq-app-title"></span>
            </div>
            <div class="freq-app-content" id="freq-app-content"></div>
          </div>
        </div><div id="freq-phone-home">
          <div id="freq-phone-home-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(_overlay);

    _phone = document.getElementById('freq-phone');
    _screen = document.getElementById('freq-screen');
    _homeScreen = document.getElementById('freq-home-screen');
    _appPage = document.getElementById('freq-app-page');
    _drawer = document.getElementById('freq-notify-drawer');

    _renderAppGrid();
    _bindPhoneEvents();
    _updateClock();
    setInterval(_updateClock, 30000);
  }

  function _renderAppGrid() {
    const grid = document.getElementById('freq-app-grid');
    if (!grid) return;
    grid.innerHTML = FREQ_APP_DEFS.map(def => `
      <div class="freq-app-icon-wrap" data-app="${def.id}">
        <div class="freq-app-icon" style="background:${def.color}20; border-color:${def.color}40;">
          ${def.icon}
          <span class="freq-app-icon-badge"></span>
        </div>
        <span class="freq-app-name">${def.name}</span>
      </div>
    `).join('');
  }

  function _updateClock() {
    const el = document.getElementById('freq-statusbar-left');
    if (!el) return;
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // ── 手机事件绑定 ──
  function _bindPhoneEvents() {
    //悬浮球
    if (_handlers._fabPointerDown) _fab.removeEventListener('pointerdown', _handlers._fabPointerDown);
    _handlers._fabPointerDown = (e) => _onFabPointerDown(e);
    _fab.addEventListener('pointerdown', _handlers._fabPointerDown);

    if (_handlers._fabPointerMove) document.removeEventListener('pointermove', _handlers._fabPointerMove);
    _handlers._fabPointerMove = (e) => _onFabPointerMove(e);
    document.addEventListener('pointermove', _handlers._fabPointerMove);

    if (_handlers._fabPointerUp) document.removeEventListener('pointerup', _handlers._fabPointerUp);
    _handlers._fabPointerUp = (e) => _onFabPointerUp(e);
    document.addEventListener('pointerup', _handlers._fabPointerUp);

    // 关闭按钮
    const closeBtn = document.getElementById('freq-phone-close');
    if (closeBtn) {
      if (_handlers._closeClick) closeBtn.removeEventListener('click', _handlers._closeClick);
      _handlers._closeClick = () => _closePhone();
      closeBtn.addEventListener('click', _handlers._closeClick);
    }

    // 遮罩点击关闭
    if (_handlers._overlayClick) _overlay.removeEventListener('click', _handlers._overlayClick);
    _handlers._overlayClick = (e) => { if (e.target === _overlay) _closePhone(); };
    _overlay.addEventListener('click', _handlers._overlayClick);

    // App 网格
    const grid = document.getElementById('freq-app-grid');
    if (grid) {
      if (_handlers._gridClick) grid.removeEventListener('click', _handlers._gridClick);
      _handlers._gridClick = (e) => {
        const wrap = e.target.closest('.freq-app-icon-wrap');
        if (wrap) _openApp(wrap.dataset.app);
      };
      grid.addEventListener('click', _handlers._gridClick);
    }

    // 返回
    const backBtn = document.getElementById('freq-app-back');
    if (backBtn) {
      if (_handlers._backClick) backBtn.removeEventListener('click', _handlers._backClick);
      _handlers._backClick = () => _closeApp();
      backBtn.addEventListener('click', _handlers._backClick);
    }

    // 状态栏 → 通知栏
    const statusbar = document.getElementById('freq-statusbar');
    if (statusbar) {
      if (_handlers._statusClick) statusbar.removeEventListener('click', _handlers._statusClick);
      _handlers._statusClick = () => _toggleDrawer();
      statusbar.addEventListener('click', _handlers._statusClick);
    }

    // 通知栏 handle
    const drawerHandle = document.getElementById('freq-notify-drawer-handle');
    if (drawerHandle) {
      if (_handlers._drawerHandleClick) drawerHandle.removeEventListener('click', _handlers._drawerHandleClick);
      _handlers._drawerHandleClick = () => _toggleDrawer();
      drawerHandle.addEventListener('click', _handlers._drawerHandleClick);
    }

    // 清除通知
    const clearBtn = document.getElementById('freq-notify-clear');
    if (clearBtn) {
      if (_handlers._clearClick) clearBtn.removeEventListener('click', _handlers._clearClick);
      _handlers._clearClick = () => FreqNotify.clearAll();
      clearBtn.addEventListener('click', _handlers._clearClick);
    }

    // Home 横条
    const homeBar = document.getElementById('freq-phone-home');
    if (homeBar) {
      if (_handlers._homeClick) homeBar.removeEventListener('click', _handlers._homeClick);
      _handlers._homeClick = () => {
        if (_currentApp) _closeApp();
        if (_drawerOpen) _toggleDrawer();
      };
      homeBar.addEventListener('click', _handlers._homeClick);
    }
  }

  // ── 悬浮球拖拽 ──
  function _onFabPointerDown(e) {
    _fabDragging = true;
    _fabMoved = false;
    _fabStartX = e.clientX;
    _fabStartY = e.clientY;
    const rect = _fab.getBoundingClientRect();
    _fabOffsetX = e.clientX - rect.left;
    _fabOffsetY = e.clientY - rect.top;
    _fab.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function _onFabPointerMove(e) {
    if (!_fabDragging) return;
    const dx = e.clientX - _fabStartX;
    const dy = e.clientY - _fabStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) _fabMoved = true;
    if (_fabMoved) {
      const x = e.clientX - _fabOffsetX;
      const y = e.clientY - _fabOffsetY;
      _fab.style.left = Math.max(0, Math.min(window.innerWidth - 56, x)) + 'px';
      _fab.style.top = Math.max(0, Math.min(window.innerHeight - 56, y)) + 'px';
      _fab.style.right = 'auto';
      _fab.style.bottom = 'auto';
    }
  }

  function _onFabPointerUp(e) {
    if (!_fabDragging) return;
    _fabDragging = false;
    if (_fabMoved) {
      _settings.fabPosX = parseInt(_fab.style.left) || 0;
      _settings.fabPosY = parseInt(_fab.style.top) || 0;
      _saveSettings();} else {
      _openPhone();
    }
  }

  // ── 手机开关 ──
   function _openPhone() {
    if (!_settings.enabled) {
      FreqLog.warn('system', '插件已禁用');
      return;
    }
    _phoneOpen = true;
    _overlay.classList.add('freq-open');
    FreqNotify.markAllRead();
    FreqNotify._updateBadges();
    _updateClock();

    // ── 记录打开时间到宇宙频率 ──
    FreqStore.set('cosmic_last_open', Date.now()).catch(() => {});

    FreqLog.info('system', '手机面板已打开');
  }
  function _closePhone() {
    _phoneOpen = false;
    _overlay.classList.remove('freq-open');
    if (_drawerOpen) {
      _drawerOpen = false;
      _drawer.classList.remove('freq-drawer-open');
    }
    FreqLog.info('system', '手机面板已关闭');}

  // ── 通知栏 ──
  function _toggleDrawer() {
    _drawerOpen = !_drawerOpen;
    if (_drawerOpen) {
      _drawer.classList.add('freq-drawer-open');
      FreqNotify._renderDrawer();
      FreqNotify.markAllRead();
      FreqNotify._updateBadges();
    } else {
      _drawer.classList.remove('freq-drawer-open');
    }
  }

  // ── App 导航 ──
  function _openApp(appId) {
    if (_drawerOpen) _toggleDrawer();
    const def = FREQ_APP_DEFS.find(d => d.id === appId);
    if (!def) return;

    _currentApp = appId;
    _homeScreen.style.display = 'none';
    _appPage.classList.add('freq-page-active');
    document.getElementById('freq-app-title').textContent = `${def.icon} ${def.name}`;

    const contentEl = document.getElementById('freq-app-content');
    contentEl.innerHTML = '';

    const app = _appRegistry[appId];
    if (app && typeof app.mount === 'function') {
      try {
        app.mount(contentEl);
      } catch (err) {
        FreqLog.error(appId, 'App mount 失败', err);contentEl.innerHTML = `<div class="freq-empty-state">
          <div class="freq-empty-state-icon">⚠️</div>
          <div class="freq-empty-state-text">加载失败：${_escHtml(err.message)}</div>
        </div>`;
      }
    } else {
      contentEl.innerHTML = `<div class="freq-empty-state">
        <div class="freq-empty-state-icon">${def.icon}</div>
        <div class="freq-empty-state-text">${def.name}<br><span style="color:#555;font-size:12px;">即将上线，敬请期待</span></div>
      </div>`;
    }FreqLog.info('system', `打开 App: ${def.name}`);
  }

  function _closeApp() {
    if (_currentApp) {
      const app = _appRegistry[_currentApp];
      if (app && typeof app.unmount === 'function') {
        try { app.unmount(); }
        catch (err) { FreqLog.error(_currentApp, 'App unmount 失败', err); }
      }
    }
    _currentApp = null;
    _appPage.classList.remove('freq-page-active');
    _homeScreen.style.display = '';}

  // ── App 注册 ──
  function registerApp(appModule) {
    if (!appModule || !appModule.id) {
      FreqLog.error('system', '注册 App 失败：缺少 id');
      return;
    }
    _appRegistry[appModule.id] = appModule;
    if (typeof appModule.init === 'function') {
      try {
        appModule.init({
          settings: _settings, bus: FreqBus, store: FreqStore,
          bridge: FreqBridge, parser: FreqParser, subapi: FreqSubAPI,
          notify: FreqNotify, log: FreqLog,});
      } catch (err) {
        FreqLog.error(appModule.id, 'App init 失败', err);
      }
    }}

  function _registerAllApps() {
  // 先注册有实现的 App（覆盖空壳）
  const implementations = [
    App01Archive,
    App02Studio,
    App03Moments,
    App04Weather,
    App05Scanner,
    App06Cosmic,
    App07Checkin,
    App08Calendar,
    App09Novel,
    App10Map,
    App11Delivery,
    App13Capsule,
    // 后续 App 在这里追加：App02Studio, App03Moments, ...
  ];
  for (const app of implementations) {
    registerApp(app);
  }

  // 其余没有实现的 App 注册空壳
  for (const def of FREQ_APP_DEFS) {
    if (!_appRegistry[def.id]) {
      registerApp({ id: def.id, name: def.name, icon: def.icon });
    }
  }
}


  // ── 监听 ST 事件 ──
  function _listenSTEvents() {
    FreqBridge.onEvent('message_received', () => {
      try {
        const msgs = FreqBridge.getChatMessages();
        const latestFM = FreqParser.getLatestMeowFM(msgs);
        if (latestFM) FreqBus.emit('meow_fm:updated', latestFM);
        const bgm = FreqParser.getLatestBGM(msgs);
        if (bgm) FreqBus.emit('bgm:changed', bgm);
      } catch (err) {
        FreqLog.error('system', '消息解析出错', err);
      }
    });

    FreqBridge.onEvent('chatLoaded', () => {
      FreqLog.info('system', '聊天已切换，重新解析');
      FreqBus.emit('chat:loaded');
    });
  }

  // ── 配置面板事件 ──
  function _bindSettingsEvents() {
    // 总折叠
    $(document).on('click', '.freq-sp-master-toggle', function () {
      const body = $(this).next('.freq-sp-master-body');
      const isOpen = body.hasClass('freq-sp-show');
      if (isOpen) {
        body.removeClass('freq-sp-show');
        $(this).removeClass('freq-sp-open');
      } else {
        body.addClass('freq-sp-show');
        $(this).addClass('freq-sp-open');
      }});

    // 启用插件
    $(document).on('change', '#freq-sp-enabled', function () {
      _settings.enabled = this.checked;
      _saveSettings();
      if (_settings.enabled) {
        if (_settings.fabEnabled) _fab.classList.remove('freq-fab-hidden');} else {
        _fab.classList.add('freq-fab-hidden');
        _closePhone();
        FreqSubAPI.stopBackgroundTimer();
      }FreqLog.info('settings', `插件 ${_settings.enabled ? '启用' : '禁用'}`);
    });

    // 悬浮球开关
    $(document).on('change', '#freq-sp-fab-enabled', function () {
      _settings.fabEnabled = this.checked;
      _saveSettings();
      if (_settings.enabled && _settings.fabEnabled) {
        _fab.classList.remove('freq-fab-hidden');
      } else {
        _fab.classList.add('freq-fab-hidden');
      }
    });
    // 宇宙频率开关
  $(document).on('change', '#freq-sp-cosmic-enabled', function () {
    _settings.cosmicFreqEnabled = this.checked;
    _saveSettings();
    
    // 如果关闭，停止后台定时器
    if (!this.checked) {
      FreqSubAPI.stopBackgroundTimer();
      FreqLog.info('system', '宇宙频率已关闭，后台推送已停止');
    } else {
      // 如果开启且 API 已配置，启动定时器
      if (_settings.apiUrl && _settings.apiKey && _settings.apiModel) {
        FreqSubAPI.startBackgroundTimer();
        FreqLog.info('system', '宇宙频率已开启，后台推送已启动');
      }
    }
    
    FreqNotify.push('system', '🌌', '宇宙频率', 
      this.checked ? '已开启' : '已关闭');
  });
  

    // 打开手机
    $(document).on('click', '#freq-sp-open-phone', function () {
      if (!_settings.enabled) {
        _settings.enabled = true;
        $('#freq-sp-enabled').prop('checked', true);
        _saveSettings();
      }
      _openPhone();
    });

    // 副API
    $(document).on('input', '#freq-sp-api-url', function () {
      _settings.apiUrl = this.value.trim();
      _saveSettings();
    });$(document).on('input', '#freq-sp-api-key', function () {
      _settings.apiKey = this.value.trim();
      _saveSettings();
    });

    // 获取模型
    $(document).on('click', '#freq-sp-fetch-models', async function () {
      const statusEl = document.getElementById('freq-sp-model-status');
      const selectEl = document.getElementById('freq-sp-model-select');
      if (statusEl) statusEl.textContent = '正在获取...';

      const models = await FreqSubAPI.fetchModels();
      _settings.apiModelList = models;
      _saveSettings();

      if (selectEl) {
        selectEl.innerHTML = models.length === 0
          ? '<option value="">-- 未获取到模型 --</option>'
          : models.map(m => `<option value="${_escHtml(m)}" ${m === _settings.apiModel ? 'selected' : ''}>${_escHtml(m)}</option>`).join('');
      }
      if (statusEl) statusEl.textContent = models.length > 0 ? `✓ ${models.length} 个模型` : '✗ 获取失败';
    });

    // 选择模型
    $(document).on('change', '#freq-sp-model-select', function () {
      _settings.apiModel = this.value;
      _saveSettings();
      FreqLog.info('settings', `模型已选择: ${_settings.apiModel}`);
    });

    // 触发频率
    $(document).on('change', '#freq-sp-trigger-interval', function () {
      const val = this.value;
      if (val === 'custom') {
        $('#freq-sp-custom-interval-row').show();
        _settings.triggerInterval = 'custom';
      } else {
        $('#freq-sp-custom-interval-row').hide();
        _settings.triggerInterval = Number(val);
      }
      _saveSettings();
      FreqSubAPI.stopBackgroundTimer();
      FreqSubAPI.startBackgroundTimer();
    });

    $(document).on('input', '#freq-sp-custom-interval', function () {
      _settings.customIntervalMin = Math.max(5, Number(this.value) || 60);
      _saveSettings();FreqSubAPI.stopBackgroundTimer();
      FreqSubAPI.startBackgroundTimer();
    });

    // 通知位置
    $(document).on('change', '#freq-sp-notify-pos', function () {
      _settings.notifyPosition = this.value;
      _saveSettings();
      FreqNotify.updatePosition(this.value);
    });

    // 提示词
    const promptIds = {
      'freq-sp-prompt-system': 'system',
      'freq-sp-prompt-app01': 'app01',
      'freq-sp-prompt-app02-monologue': 'app02_monologue',
      'freq-sp-prompt-app02-interview': 'app02_interview',
      'freq-sp-prompt-app02-private': 'app02_private',
      'freq-sp-prompt-app03': 'app03',
      'freq-sp-prompt-app04': 'app04_care',
      'freq-sp-prompt-app05': 'app05',
      'freq-sp-prompt-app06': 'app06',
      'freq-sp-prompt-app07': 'app07_comment',
      'freq-sp-prompt-app08': 'app08_char_schedule',
      'freq-sp-prompt-app09': 'app09_book',
      'freq-sp-prompt-app10': 'app10_landmark',
      'freq-sp-prompt-app11': 'app11_order',
      'freq-sp-prompt-app12': 'app12',
      'freq-sp-prompt-app13': 'app13_reply',
      'freq-sp-prompt-app14': 'app14',
      'freq-sp-prompt-app15': 'app15',
      'freq-sp-prompt-app16': 'app16',
      'freq-sp-prompt-app17': 'app17',
      'freq-sp-prompt-bg': 'bg_message',
    };

    for (const [elId, promptKey] of Object.entries(promptIds)) {
      $(document).on('input', `#${elId}`, function () {
        if (!_settings.prompts) _settings.prompts = {};
        _settings.prompts[promptKey] = this.value;
        _saveSettings();
      });
    }

    // 子折叠
    $(document).on('click', '.freq-sp-collapsible', function () {
      const targetId = this.dataset.target;
      const body = document.getElementById(targetId);
      if (!body) return;
      const isOpen = body.classList.contains('freq-sp-show');
      if (isOpen) {
        body.classList.remove('freq-sp-show');
        this.classList.remove('freq-sp-open');
      } else {
        body.classList.add('freq-sp-show');
        this.classList.add('freq-sp-open');
      }
    });

    // 清空日志
    $(document).on('click', '#freq-sp-log-clear', function () {
      FreqLog.clear();
    });
  }

  // ── 同步配置面板 UI ──
  function _syncSettingsUI() {
    const el = document.getElementById('freq-sp-enabled');
    if (!el) {
      // 还没加载完，重试
      setTimeout(() => _syncSettingsUI(), 500);
      return;
    }

    $('#freq-sp-enabled').prop('checked', _settings.enabled);
    $('#freq-sp-fab-enabled').prop('checked', _settings.fabEnabled);
    $('#freq-sp-cosmic-enabled').prop('checked', _settings.cosmicFreqEnabled !== false);
    $('#freq-sp-api-url').val(_settings.apiUrl || '');
    $('#freq-sp-api-key').val(_settings.apiKey || '');

    // 模型下拉
    const selectEl = document.getElementById('freq-sp-model-select');
    if (selectEl && _settings.apiModelList && _settings.apiModelList.length > 0) {
      selectEl.innerHTML = _settings.apiModelList.map(m =>
        `<option value="${_escHtml(m)}" ${m === _settings.apiModel ? 'selected' : ''}>${_escHtml(m)}</option>`
      ).join('');
    }

    // 触发频率
    const intervalVal = _settings.triggerInterval;
    if (intervalVal === 'custom' || String(intervalVal) === 'custom') {
      $('#freq-sp-trigger-interval').val('custom');
      $('#freq-sp-custom-interval-row').show();
      $('#freq-sp-custom-interval').val(_settings.customIntervalMin || 60);
    } else {
      const numVal = Number(intervalVal);
      if (numVal === 1800000|| numVal === 3600000) {
        $('#freq-sp-trigger-interval').val(String(numVal));
      } else {
        $('#freq-sp-trigger-interval').val('custom');
        $('#freq-sp-custom-interval-row').show();
        $('#freq-sp-custom-interval').val(Math.round(numVal / 60000) || 60);
      }
    }

    // 通知位置
    $('#freq-sp-notify-pos').val(_settings.notifyPosition ||'top-right');
     // App04 · 信号气象站
    $(document).on('input', '#freq-sp-hefeng-key', function () {
      _settings.hefengApiKey = this.value.trim();
      _saveSettings();
    });
    $(document).on('change', '#freq-sp-app04-auto-push', function () {
      _settings.app04AutoPush = this.checked;
      _saveSettings();
    });
    $(document).on('change', '#freq-sp-app04-location-enabled', function () {
      _settings.app04LocationEnabled = this.checked;
      _saveSettings();
    });

    // 提示词
    const prompts = _settings.prompts || {};
    const defaults = FREQ_DEFAULTS.prompts;
    $('#freq-sp-prompt-system').val(prompts.system || defaults.system);
    $('#freq-sp-prompt-app01').val(prompts.app01 || defaults.app01);
    $('#freq-sp-prompt-app02-monologue').val(prompts.app02_monologue || defaults.app02_monologue);
    $('#freq-sp-prompt-app02-interview').val(prompts.app02_interview || defaults.app02_interview);
    $('#freq-sp-prompt-app02-private').val(prompts.app02_private || defaults.app02_private);
    $('#freq-sp-prompt-app03').val(prompts.app03 || defaults.app03);
    $('#freq-sp-hefeng-key').val(_settings.hefengApiKey || '');
    $('#freq-sp-app04-auto-push').prop('checked', _settings.app04AutoPush !== false);
    $('#freq-sp-app04-location-enabled').prop('checked', !!_settings.app04LocationEnabled);
    $('#freq-sp-prompt-app04').val(prompts.app04_care || defaults.app04_care || '');
    $('#freq-sp-prompt-app05').val(prompts.app05 || defaults.app05);
    $('#freq-sp-prompt-app06').val(prompts.app06 || defaults.app06);
    $('#freq-sp-prompt-app07').val(prompts.app07_comment || defaults.app07_comment);
    $('#freq-sp-prompt-app08').val(prompts.app08_char_schedule || defaults.app08_char_schedule || '');
    $('#freq-sp-prompt-app09').val(prompts.app09_book || defaults.app09_book || '');
    $('#freq-sp-prompt-app10').val(prompts.app10_landmark || defaults.app10_landmark || '');
    $('#freq-sp-prompt-app11').val(prompts.app11_order || defaults.app11_order || '');
    $('#freq-sp-prompt-app12').val(prompts.app12 || defaults.app12);
    $('#freq-sp-prompt-app13').val(prompts.app13_reply || defaults.app13_reply);
    $('#freq-sp-prompt-app14').val(prompts.app14 || defaults.app14);
    $('#freq-sp-prompt-app15').val(prompts.app15 || defaults.app15);
    $('#freq-sp-prompt-app16').val(prompts.app16 || defaults.app16);
    $('#freq-sp-prompt-app17').val(prompts.app17 || defaults.app17);
    $('#freq-sp-prompt-bg').val(prompts.bg_message || defaults.bg_message);

    FreqLog.refreshUI();
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    init,
    registerApp,
    getSettings: () => _settings,
    openPhone: () => _openPhone(),
    closePhone: () => _closePhone(),
  };
})();


// ════════════════════════════════════════════════════════════
//ST 插件入口
// ════════════════════════════════════════════════════════════
jQuery(async () => {
  try {
    FreqTerminal.init();
  } catch (err) {
    console.error('[FreqTerminal] 初始化致命错误:', err);
    FreqLog.error('system', '初始化致命错误', err);
  }
});



