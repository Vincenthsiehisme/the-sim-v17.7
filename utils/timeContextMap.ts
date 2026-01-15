
import { DigitalTwinPersona } from '../types';

type LifeRole = 'student' | 'parent' | 'freelancer' | 'night_owl' | 'worker';

interface TimeContext {
  label: string;
  icon: 'briefcase' | 'coffee' | 'moon' | 'sun' | 'zap' | 'home' | 'book';
  mindset: 'Fragmented' | 'Deep_Focus' | 'Leisure_Flow'; // NEW
  mindsetLabel: string; // NEW
}

// === 1. Time Parser (Helper) ===
export const parseTimeStr = (timeStr: string): number => {
  const t = timeStr.toLowerCase();
  
  // HH:MM format
  const match = t.match(/(\d{1,2}):/);
  if (match) return parseInt(match[1], 10);

  // Semantic fallback
  if (t.includes('morning') || t.includes('晨') || t.includes('早') || t.includes('上午')) return 8;
  if (t.includes('noon') || t.includes('lunch') || t.includes('午')) return 12;
  if (t.includes('afternoon') || t.includes('work') || t.includes('工作') || t.includes('下午')) return 15;
  if (t.includes('evening') || t.includes('dinner') || t.includes('晚')) return 19;
  if (t.includes('night') || t.includes('sleep') || t.includes('深夜') || t.includes('睡')) return 23;
  if (t.includes('midnight') || t.includes('凌晨')) return 1;
  
  return 12; // Default
};

// === 2. Role Detection Logic ===
const detectLifeRole = (persona: DigitalTwinPersona): LifeRole => {
  const stage = (persona.context_profile?.life_stage || "").toLowerCase();
  const timePrefs = persona.behavioral_pattern?.time_pattern?.preferred_time_slots || [];
  
  // 1. Feature Extraction
  const hours = timePrefs.map(parseTimeStr);
  
  // Define Windows
  // Morning: 05:00 - 10:00 (Commute, Start work)
  const hasMorning = hours.some(h => h >= 5 && h <= 10);
  
  // Late Night: 23:00 - 04:00 (Late activity)
  const hasLateNight = hours.some(h => h >= 23 || h <= 4);

  // 2. Priority Roles (Identity based - Strongest constraints)
  if (stage.includes("學生") || stage.includes("student") || stage.includes("大學")) return 'student';
  if (stage.includes("父母") || stage.includes("家長") || stage.includes("媽") || stage.includes("爸") || stage.includes("parent")) return 'parent';
  if (stage.includes("自由") || stage.includes("freelance") || stage.includes("soho") || stage.includes("接案")) return 'freelancer';
  
  // 3. Schedule Roles (Behavior based)
  // Strict Night Owl: Late night activity AND NO morning activity.
  // This prevents workers who stay up late from being misclassified.
  if (hasLateNight && !hasMorning) {
      return 'night_owl';
  }

  // 4. Default
  return 'worker';
};

// === 3. Context Matrix ===
const getContextForRole = (hour: number, role: LifeRole): TimeContext => {
  // Normalize hour just in case
  const h = Math.floor(hour) % 24;

  const ctx: Partial<TimeContext> = {};

  // BASE LOGIC
  switch (role) {
    case 'student':
      if (h >= 6 && h < 9) Object.assign(ctx, { label: "趕車/補眠", icon: 'zap', mindset: 'Fragmented' });
      else if (h >= 9 && h < 12) Object.assign(ctx, { label: "上課/偷閒", icon: 'book', mindset: 'Fragmented' }); // Often multi-tasking
      else if (h >= 12 && h < 14) Object.assign(ctx, { label: "午休/社群", icon: 'coffee', mindset: 'Leisure_Flow' });
      else if (h >= 14 && h < 18) Object.assign(ctx, { label: "社團/打工", icon: 'zap', mindset: 'Fragmented' });
      else if (h >= 18 && h < 23) Object.assign(ctx, { label: "娛樂/作業", icon: 'moon', mindset: 'Leisure_Flow' });
      else if (h >= 23 || h < 2) Object.assign(ctx, { label: "夜衝/沉浸", icon: 'zap', mindset: 'Deep_Focus' }); // Late active = Deep focus for students
      else Object.assign(ctx, { label: "夢鄉", icon: 'moon', mindset: 'Deep_Focus' });
      break;

    case 'parent':
      if (h >= 6 && h < 9) Object.assign(ctx, { label: "戰鬥時段(送托)", icon: 'zap', mindset: 'Fragmented' }); // High Noise
      else if (h >= 9 && h < 12) Object.assign(ctx, { label: "家務/採買", icon: 'home', mindset: 'Fragmented' });
      else if (h >= 12 && h < 14) Object.assign(ctx, { label: "放風時間", icon: 'coffee', mindset: 'Leisure_Flow' });
      else if (h >= 14 && h < 17) Object.assign(ctx, { label: "待命/備餐", icon: 'home', mindset: 'Fragmented' });
      else if (h >= 17 && h < 21) Object.assign(ctx, { label: "戰鬥時段(家庭)", icon: 'home', mindset: 'Fragmented' }); // No bandwidth
      else if (h >= 21 && h < 24) Object.assign(ctx, { label: "Me Time", icon: 'moon', mindset: 'Deep_Focus' }); // Revenge bedtime
      else Object.assign(ctx, { label: "休息", icon: 'moon', mindset: 'Deep_Focus' });
      break;

    case 'freelancer':
      if (h >= 9 && h < 12) Object.assign(ctx, { label: "暖機/行政", icon: 'coffee', mindset: 'Fragmented' });
      else if (h >= 13 && h < 18) Object.assign(ctx, { label: "深度工作", icon: 'briefcase', mindset: 'Deep_Focus' });
      else if (h >= 18 && h < 22) Object.assign(ctx, { label: "彈性休息", icon: 'coffee', mindset: 'Leisure_Flow' });
      else if (h >= 22 || h < 2) Object.assign(ctx, { label: "靈感爆發", icon: 'zap', mindset: 'Deep_Focus' });
      else Object.assign(ctx, { label: "休息", icon: 'moon', mindset: 'Deep_Focus' });
      break;

    case 'night_owl':
      if (h >= 10 && h < 18) Object.assign(ctx, { label: "補眠中", icon: 'moon', mindset: 'Fragmented' });
      else if (h >= 18 && h < 22) Object.assign(ctx, { label: "夜間啟動", icon: 'zap', mindset: 'Leisure_Flow' });
      else if (h >= 22 || h < 4) Object.assign(ctx, { label: "黃金活躍期", icon: 'zap', mindset: 'Deep_Focus' });
      else Object.assign(ctx, { label: "深層睡眠", icon: 'moon', mindset: 'Deep_Focus' });
      break;

    case 'worker':
    default:
      if (h >= 7 && h < 9) Object.assign(ctx, { label: "通勤閱讀", icon: 'coffee', mindset: 'Fragmented' });
      else if (h >= 9 && h < 12) Object.assign(ctx, { label: "工作專注", icon: 'briefcase', mindset: 'Deep_Focus' }); // Professional focus
      else if (h >= 12 && h < 14) Object.assign(ctx, { label: "午休外食", icon: 'coffee', mindset: 'Leisure_Flow' });
      else if (h >= 14 && h < 18) Object.assign(ctx, { label: "工作/會議", icon: 'briefcase', mindset: 'Fragmented' }); // Often busy/distracted
      else if (h >= 18 && h < 20) Object.assign(ctx, { label: "通勤/晚餐", icon: 'home', mindset: 'Fragmented' });
      else if (h >= 20 && h < 23) Object.assign(ctx, { label: "下班放鬆", icon: 'moon', mindset: 'Leisure_Flow' });
      else Object.assign(ctx, { label: "休息", icon: 'moon', mindset: 'Deep_Focus' });
      break;
  }

  // Label Mapping
  const mindsetLabels: Record<string, string> = {
      'Fragmented': '⚡️ 碎片掃描 (Scanning)',
      'Deep_Focus': '🧠 深度沉浸 (Deep Focus)',
      'Leisure_Flow': '☕️ 休閒瀏覽 (Leisure)'
  };

  return {
      ...ctx as TimeContext,
      mindsetLabel: mindsetLabels[ctx.mindset || 'Fragmented']
  };
};

// === 4. Main Export ===
export const getTimeLabel = (timeStr: string, persona: DigitalTwinPersona) => {
  const hour = parseTimeStr(timeStr);
  const role = detectLifeRole(persona);
  const context = getContextForRole(hour, role);
  
  // Device Inference
  let device = "Mobile";
  const devicePref = persona.context_profile?.device_pref?.[0] || "Mobile";
  
  // Logic: Desktop usually for Work hours (Worker/Freelancer)
  if ((role === 'worker' || role === 'freelancer') && context.icon === 'briefcase') {
      device = devicePref.toLowerCase().includes('desktop') ? "Desktop" : "Mobile"; 
  } else {
      device = "Mobile"; // Relax/Commute is mostly mobile
  }

  return {
    ...context,
    channel: device
  };
};
