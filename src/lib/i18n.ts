import { writable, derived } from 'svelte/store';

export const locale = writable<'en' | 'th'>('th');

const translations = {
    en: {
        nav: {
            tree: 'Meditation Tree',
            community: 'Community',
            sleep: 'Sleep',
            stats: 'Stats',
            chat: 'Chat',
            hello: 'Hello',
            logout: 'Logout'
        },
        dashboard: {
            streak: 'Day Streak',
            totalMinutes: 'Total Minutes',
            sessions: 'Sessions',
            meditate: 'Meditate',
            startTimer: 'Start Timer',
            recentHistory: 'Recent History',
            activityMap: 'Activity Map',
            less: 'Less',
            more: 'More',
            noSessions: 'No sessions yet. Start your journey today!',
            maxLevel: 'You have reached the highest level!',
            untilNext: 'minutes until',
            delete: 'Delete Session'
        },
        timer: {
            ready: 'Ready to Meditate?',
            duration: 'Duration (minutes)',
            start: 'Start Session',
            complete: 'Session Complete',
            notice: 'Take a moment to notice how you feel.',
            log: 'Log This Session',
            back: 'Back to Timer',
            paused: 'Paused',
            breathing: 'Breathing...',
            finishEarly: 'Finish Early & Log',
            quickStart: 'Quick Start',
            minutes: 'min'
        },
        stats: {
            progress: 'Your Progress',
            history: 'History',
            meditationTypes: 'Meditation Types',
            back: 'Back to Dashboard',
            less: 'Less',
            more: 'More',
            minutes: 'minutes',
            sessions: 'sessions'
        },
        community: {
            title: 'Community Forest',
            subtitle: 'Growing together in silence.',
            empty: 'The forest is empty. Be the first seed! 🌱',
            nudge: 'Nudge',
            checkin: 'Daily Check-in',
            post: 'Post Check-in',
            posting: 'Posting...',
            placeholder: 'Add a caption...',
            mood: 'How are you feeling?',
            photo: 'Take a photo',
            justNow: 'Just now'
        },
        sleep: {
            title: 'Sleep Valley',
            subtitle: 'Rest well, let the light return.',
            fireflies: 'Fireflies Collected',
            avgSleep: 'Avg. Sleep',
            calendar: 'Calendar',
            logLastNight: 'Log Last Night',
            bedtime: 'Bedtime',
            wakeTime: 'Wake Time',
            save: 'Save Sleep Log',
            saving: 'Saving...',
            recentNights: 'Recent Nights',
            noLogs: 'No sleep logs yet. Start tonight!',
            quality: 'Quality',
            delete: 'Delete Log'
        },
        badges: {
            title: 'Achievements',
            subtitle: 'Collect badges as your practice grows.',
            unlocked: 'Unlocked',
            locked: 'Locked',
            next: 'Next badge',
            toGo: 'to go',
            days: 'days',
            minutes: 'minutes',
            sessions: 'sessions',
            streak_3: { name: 'Spark', desc: '3 day streak' },
            streak_7: { name: 'Flame', desc: '7 day streak' },
            streak_14: { name: 'Blaze', desc: '14 day streak' },
            streak_30: { name: 'Eternal Fire', desc: '30 day streak' },
            time_60: { name: 'Beginner', desc: '1 hour of meditation' },
            time_300: { name: 'Seeker', desc: '5 hours of meditation' },
            time_1000: { name: 'Monk', desc: 'About 17 hours of meditation' },
            time_5000: { name: 'Master', desc: 'More than 80 hours of meditation' },
            sessions_10: { name: 'Seed Planter', desc: '10 sessions completed' },
            sessions_50: { name: 'Gardener', desc: '50 sessions completed' },
            sessions_100: { name: 'Forest Keeper', desc: '100 sessions completed' }
        },
        tree: {
            seed: { name: 'Seed', desc: 'A potential waiting to unfold.' },
            germinating: { name: 'Germinating', desc: 'Life begins to emerge.' },
            seedling: { name: 'Seedling', desc: 'Tiny leaves start to appear.' },
            sprout: { name: 'Sprout', desc: 'The stem grows stronger.' },
            sapling: { name: 'Sapling', desc: 'Roots dig deep into the earth.' },
            young: { name: 'Young Tree', desc: 'Standing firm and tall.' },
            growing: { name: 'Growing Tree', desc: 'Branches spread wide.' },
            mature: { name: 'Mature Tree', desc: 'Strong, stable, and providing shade.' },
            strong: { name: 'Strong Tree', desc: 'Resilient through all conditions.' },
            blossoming: { name: 'Blossoming Tree', desc: 'Radiating beauty.' },
            flowering: { name: 'Flowering Tree', desc: 'Perfect beauty in full bloom.' },
            fruitful: { name: 'Fruitful Tree', desc: 'Giving fruits to others.' },
            ancient: { name: 'Ancient Tree', desc: 'Wisdom of ages.' },
            sacred: { name: 'Sacred Tree', desc: 'A symbol of deep wisdom and connection.' }
        },
        reminder: {
            title: 'Daily Reminder',
            enable: 'Enable Reminders',
            turnOff: 'Turn Off',
            save: 'Save',
            setFor: 'Reminder set for',
            note: 'Note: On mobile, ensure the app is added to home screen for best results.',
            blocked: 'Notifications are blocked. Please enable them in browser settings.',
            testTitle: 'Reminder Set!',
            testBody: 'You will be reminded daily at'
        }
    },
    th: {
        nav: {
            tree: 'ต้นไม้แห่งสมาธิ',
            community: 'ชุมชน',
            sleep: 'นอนหลับ',
            stats: 'สถิติ',
            chat: 'แชท',
            hello: 'สวัสดี',
            logout: 'ออกจากระบบ'
        },
        dashboard: {
            streak: 'วันที่ทำต่อเนื่อง',
            totalMinutes: 'นาทีทั้งหมด',
            sessions: 'ครั้ง',
            meditate: 'ทำสมาธิ',
            startTimer: 'เริ่มจับเวลา',
            recentHistory: 'ประวัติล่าสุด',
            activityMap: 'แผนที่กิจกรรม',
            less: 'น้อย',
            more: 'มาก',
            noSessions: 'ยังไม่มีประวัติ เริ่มต้นวันนี้เลย!',
            maxLevel: 'คุณมาถึงระดับสูงสุดแล้ว!',
            untilNext: 'นาที จนถึง',
            delete: 'ลบเซสชัน'
        },
        timer: {
            ready: 'พร้อมทำสมาธิหรือยัง?',
            duration: 'ระยะเวลา (นาที)',
            start: 'เริ่มเซสชัน',
            complete: 'เซสชันเสร็จสิ้น',
            notice: 'ใช้เวลาสักครู่สังเกตความรู้สึกของคุณ',
            log: 'บันทึกเซสชันนี้',
            back: 'กลับไปที่ตัวจับเวลา',
            paused: 'หยุดชั่วคราว',
            breathing: 'กำลังหายใจ...',
            finishEarly: 'เสร็จก่อนเวลา & บันทึก',
            quickStart: 'เริ่มด่วน',
            minutes: 'นาที'
        },
        stats: {
            progress: 'ความก้าวหน้าของคุณ',
            history: 'ประวัติ',
            meditationTypes: 'ประเภทการทำสมาธิ',
            back: 'กลับไปหน้าหลัก',
            less: 'น้อย',
            more: 'มาก',
            minutes: 'นาที',
            sessions: 'ครั้ง'
        },
        community: {
            title: 'ป่าชุมชน',
            subtitle: 'เติบโตไปด้วยกันในความเงียบสงบ',
            empty: 'ป่ายังว่างเปล่า มาเป็นเมล็ดพันธุ์แรกกันเถอะ! 🌱',
            nudge: 'สะกิด',
            checkin: 'เช็คอินประจำวัน',
            post: 'โพสต์เช็คอิน',
            posting: 'กำลังโพสต์...',
            placeholder: 'เขียนข้อความ...',
            mood: 'คุณรู้สึกอย่างไร?',
            photo: 'ถ่ายรูป',
            justNow: 'เมื่อสักครู่'
        },
        sleep: {
            title: 'หุบเขานิทรา',
            subtitle: 'พักผ่อนให้เพียงพอ ให้แสงสว่างกลับคืนมา',
            fireflies: 'หิ่งห้อยที่รวบรวมได้',
            avgSleep: 'เวลานอนเฉลี่ย',
            calendar: 'ปฏิทิน',
            logLastNight: 'บันทึกการนอนเมื่อคืน',
            bedtime: 'เข้านอน',
            wakeTime: 'ตื่นนอน',
            save: 'บันทึก',
            saving: 'กำลังบันทึก...',
            recentNights: 'คืนล่าสุด',
            noLogs: 'ยังไม่มีบันทึกการนอน เริ่มคืนนี้เลย!',
            quality: 'คุณภาพ',
            delete: 'ลบบันทึก'
        },
        badges: {
            title: 'ตราแห่งความสำเร็จ',
            subtitle: 'สะสมตราให้การฝึกสนุกขึ้น',
            unlocked: 'ปลดล็อกแล้ว',
            locked: 'ยังไม่ปลดล็อก',
            next: 'ตราถัดไป',
            toGo: 'อีก',
            days: 'วัน',
            minutes: 'นาที',
            sessions: 'ครั้ง',
            streak_3: { name: 'ประกายไฟ', desc: 'ต่อเนื่อง 3 วัน' },
            streak_7: { name: 'เปลวไฟ', desc: 'ต่อเนื่อง 7 วัน' },
            streak_14: { name: 'กองเพลิง', desc: 'ต่อเนื่อง 14 วัน' },
            streak_30: { name: 'ไฟนิรันดร์', desc: 'ต่อเนื่อง 30 วัน' },
            time_60: { name: 'ผู้เริ่มต้น', desc: 'ทำสมาธิครบ 1 ชั่วโมง' },
            time_300: { name: 'ผู้แสวงหา', desc: 'ทำสมาธิครบ 5 ชั่วโมง' },
            time_1000: { name: 'ผู้ตั้งมั่น', desc: 'ทำสมาธิครบเกือบ 17 ชั่วโมง' },
            time_5000: { name: 'ปรมาจารย์', desc: 'ทำสมาธิครบกว่า 80 ชั่วโมง' },
            sessions_10: { name: 'ผู้หว่านเมล็ด', desc: 'ทำครบ 10 ครั้ง' },
            sessions_50: { name: 'คนสวน', desc: 'ทำครบ 50 ครั้ง' },
            sessions_100: { name: 'ผู้ดูแลป่า', desc: 'ทำครบ 100 ครั้ง' }
        },
        tree: {
            seed: { name: 'เมล็ดพันธุ์', desc: 'ศักยภาพที่รอการเติบโต' },
            germinating: { name: 'งอกงาม', desc: 'ชีวิตเริ่มต้นขึ้น' },
            seedling: { name: 'ต้นกล้าอ่อน', desc: 'ใบเล็กๆ เริ่มผลิ' },
            sprout: { name: 'ต้นกล้า', desc: 'ลำต้นแข็งแรงขึ้น' },
            sapling: { name: 'ต้นอ่อน', desc: 'เริ่มหยั่งรากลงดิน' },
            young: { name: 'ต้นไม้วัยเยาว์', desc: 'ยืนต้นอย่างมั่นคง' },
            growing: { name: 'ต้นไม้กำลังเติบโต', desc: 'กิ่งก้านแผ่กว้าง' },
            mature: { name: 'ต้นไม้ใหญ่', desc: 'แข็งแรง มั่นคง และให้ร่มเงา' },
            strong: { name: 'ต้นไม้แกร่ง', desc: 'ทนทานต่อทุกสภาวะ' },
            blossoming: { name: 'ต้นไม้ผลิดอก', desc: 'เปล่งประกายความงาม' },
            flowering: { name: 'ต้นไม้บานสะพรั่ง', desc: 'ความงามที่สมบูรณ์แบบ' },
            fruitful: { name: 'ต้นไม้ติดผล', desc: 'ให้ผลแก่ผู้อื่น' },
            ancient: { name: 'ต้นไม้โบราณ', desc: 'ภูมิปัญญาแห่งกาลเวลา' },
            sacred: { name: 'ต้นไม้ศักดิ์สิทธิ์', desc: 'สัญลักษณ์แห่งปัญญาและการเชื่อมโยงอันลึกซึ้ง' }
        },
        reminder: {
            title: 'แจ้งเตือนรายวัน',
            enable: 'เปิดการแจ้งเตือน',
            turnOff: 'ปิดการแจ้งเตือน',
            save: 'บันทึก',
            setFor: 'ตั้งเวลาแจ้งเตือนไว้ที่',
            note: 'หมายเหตุ: บนมือถือ ควรเพิ่มแอพลงในหน้าจอหลักเพื่อผลลัพธ์ที่ดีที่สุด',
            blocked: 'การแจ้งเตือนถูกปิดกั้น โปรดเปิดในตั้งค่าเบราว์เซอร์',
            testTitle: 'ตั้งค่าแจ้งเตือนแล้ว!',
            testBody: 'คุณจะได้รับการแจ้งเตือนทุกวันเวลา'
        }
    }
};

export const t = derived(locale, ($locale) => (key: string) => {
    const keys = key.split('.');
    let result: any = translations[$locale];
    for (const k of keys) {
        if (result && result[k]) {
            result = result[k];
        } else {
            return key;
        }
    }
    return result;
});
