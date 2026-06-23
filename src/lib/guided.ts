// Guided meditation sessions — Thai-first, text-guided.
//
// Each session drives the existing building blocks (breathing visual + ambient
// sound) plus timed on-screen prompts, so it delivers a "follow-along"
// experience without any pre-recorded audio. Steps are shown when the elapsed
// time reaches `at` (seconds); the last step's text holds until the bell.
//
// To add narrated audio later, attach an `audio` URL per session and play it in
// the player alongside (or instead of) the timed text.

export type GuidedStep = {
    at: number; // seconds from start when this prompt appears
    th: string;
    en: string;
};

export type GuidedSession = {
    id: string;
    emoji: string;
    durationMinutes: number;
    /** Recommended breathing pattern id (see timer breathPatterns), or null for free breathing. */
    breath: 'box' | '478' | 'calm' | null;
    /** Ambient sound id matching the timer's musicOptions. */
    music: 'none' | 'relaxing' | 'forest' | 'rain' | 'ocean';
    /** Session type stored on the logged meditation. */
    type: string;
    accent: string; // tailwind gradient classes for the card
    title: { th: string; en: string };
    subtitle: { th: string; en: string };
    steps: GuidedStep[];
};

export const GUIDED_SESSIONS: GuidedSession[] = [
    {
        id: 'sleep',
        emoji: '🌙',
        durationMinutes: 6,
        breath: 'calm',
        music: 'ocean',
        type: 'Body Scan',
        accent: 'from-indigo-500/15 to-blue-400/10 border-indigo-300/30',
        title: { th: 'ก่อนนอน — คลายสู่นิทรา', en: 'Wind Down to Sleep' },
        subtitle: {
            th: 'ผ่อนคลายร่างกายทีละส่วน ปล่อยวันนี้ไว้ข้างหลัง',
            en: 'Release the body part by part and let the day go'
        },
        steps: [
            { at: 0, th: 'หลับตาลงเบา ๆ แล้วหายใจเข้าลึก ๆ ทางจมูก', en: 'Gently close your eyes and breathe in slowly through your nose' },
            { at: 30, th: 'ผ่อนลมหายใจออกยาว ๆ รู้สึกถึงไหล่ที่หย่อนลง', en: 'Let the breath out long and feel your shoulders soften' },
            { at: 70, th: 'สังเกตใบหน้าและกราม ปล่อยให้มันคลายออก', en: 'Notice your face and jaw — let them unclench' },
            { at: 120, th: 'ไล่ความผ่อนคลายลงสู่อก หน้าท้อง และแขนทั้งสองข้าง', en: 'Let the ease flow down to your chest, belly, and both arms' },
            { at: 180, th: 'ปล่อยขาทั้งสองข้างให้หนักและจมลงกับที่นอน', en: 'Allow both legs to grow heavy and sink into the bed' },
            { at: 240, th: 'ไม่ต้องทำอะไรอีก แค่ตามลมหายใจที่นุ่มนวล', en: 'Nothing left to do — just follow the soft rhythm of your breath' },
            { at: 310, th: 'ปล่อยให้ความเงียบโอบกอดคุณไว้จนหลับไป', en: 'Let the stillness hold you as you drift toward sleep' }
        ]
    },
    {
        id: 'calm',
        emoji: '🌧️',
        durationMinutes: 5,
        breath: '478',
        music: 'rain',
        type: 'Breath',
        accent: 'from-sky-500/15 to-cyan-400/10 border-sky-300/30',
        title: { th: 'คลายกังวล', en: 'Ease Anxiety' },
        subtitle: {
            th: 'จังหวะหายใจ 4·7·8 ช่วยให้ระบบประสาทสงบลง',
            en: 'The 4·7·8 breath calms an anxious nervous system'
        },
        steps: [
            { at: 0, th: 'นั่งให้สบาย วางมือบนหน้าตัก แล้วหายใจเข้าช้า ๆ', en: 'Settle in, rest your hands, and breathe in slowly' },
            { at: 30, th: 'หายใจเข้านับ 4 — กลั้นไว้ 7 — ผ่อนออกยาวนับ 8', en: 'Inhale for 4 — hold for 7 — exhale long for 8' },
            { at: 80, th: 'ทุกครั้งที่หายใจออก ปล่อยความตึงเครียดออกไปด้วย', en: 'With every exhale, let a little tension leave with it' },
            { at: 140, th: 'ความคิดวิ่งเข้ามาได้ — เพียงรับรู้แล้วกลับมาที่ลมหายใจ', en: 'Thoughts may come — just notice them and return to the breath' },
            { at: 210, th: 'รู้สึกถึงพื้นที่รองรับร่างกายคุณไว้อย่างมั่นคง', en: 'Feel the ground holding you, steady and safe' },
            { at: 270, th: 'หายใจตามปกติ สังเกตว่าตอนนี้ใจเบาลงแค่ไหน', en: 'Let the breath return to normal — notice how much lighter you feel' }
        ]
    },
    {
        id: 'focus',
        emoji: '🎯',
        durationMinutes: 5,
        breath: 'box',
        music: 'forest',
        type: 'Open Awareness',
        accent: 'from-emerald-500/15 to-teal-400/10 border-emerald-300/30',
        title: { th: 'รีเซ็ตโฟกัส', en: 'Focus Reset' },
        subtitle: {
            th: 'Box breathing เคลียร์หัวก่อนงานสำคัญ',
            en: 'Box breathing to clear your head before deep work'
        },
        steps: [
            { at: 0, th: 'นั่งหลังตรง รู้สึกถึงลมหายใจที่ปลายจมูก', en: 'Sit tall and feel the breath at the tip of your nose' },
            { at: 30, th: 'หายใจเป็นสี่เหลี่ยม: เข้า 4 — กลั้น 4 — ออก 4 — กลั้น 4', en: 'Breathe in a box: in 4 — hold 4 — out 4 — hold 4' },
            { at: 90, th: 'ให้ความสนใจอยู่ที่การนับ ไม่ต้องไปไหน', en: 'Keep your attention on the count — nowhere else to be' },
            { at: 160, th: 'เมื่อใจลอย ค่อย ๆ พามันกลับมาอย่างอ่อนโยน', en: 'When the mind wanders, gently guide it back' },
            { at: 230, th: 'รู้สึกถึงความตื่นตัวที่สงบนิ่ง พร้อมสำหรับสิ่งถัดไป', en: 'Feel a calm alertness settle in — ready for what is next' }
        ]
    },
    {
        id: 'bodyscan',
        emoji: '🌿',
        durationMinutes: 8,
        breath: null,
        music: 'relaxing',
        type: 'Body Scan',
        accent: 'from-amber-500/15 to-orange-400/10 border-amber-300/30',
        title: { th: 'สแกนร่างกาย', en: 'Full Body Scan' },
        subtitle: {
            th: 'พาความรู้สึกตัวเดินทางจากหัวจรดเท้า',
            en: 'Travel awareness slowly from head to toe'
        },
        steps: [
            { at: 0, th: 'หายใจตามธรรมชาติ นำความสนใจมาที่ศีรษะ', en: 'Breathe naturally and bring attention to the crown of your head' },
            { at: 60, th: 'สังเกตใบหน้า ดวงตา และกราม ปล่อยให้คลายลง', en: 'Notice your face, eyes, and jaw — let them release' },
            { at: 140, th: 'เลื่อนลงสู่คอและไหล่ ปล่อยน้ำหนักที่แบกไว้', en: 'Move down to your neck and shoulders — drop the weight you carry' },
            { at: 230, th: 'รับรู้แขน มือ และปลายนิ้วทุกนิ้ว', en: 'Feel your arms, hands, and every fingertip' },
            { at: 320, th: 'สังเกตหน้าอกและท้องที่ขยายและยุบตามลมหายใจ', en: 'Notice your chest and belly rising and falling with the breath' },
            { at: 400, th: 'เลื่อนลงสู่สะโพก ขา และเท้า รู้สึกถึงทุกการสัมผัส', en: 'Move down through hips, legs, and feet — feel every point of contact' },
            { at: 450, th: 'รับรู้ทั้งร่างกายพร้อมกัน หายใจเข้าสู่ความเต็มเปี่ยมนี้', en: 'Sense the whole body at once and breathe into this wholeness' }
        ]
    }
];

export function getGuidedSession(id: string): GuidedSession | undefined {
    return GUIDED_SESSIONS.find((s) => s.id === id);
}
