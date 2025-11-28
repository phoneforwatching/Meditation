export type TreeStage = {
    id: string;
    name: string;
    minMinutes: number;
    maxMinutes: number;
    symbol: string;
    description: string;
};

export const TREE_STAGES: TreeStage[] = [
    { id: 'seed', name: 'เมล็ดพันธุ์', minMinutes: 0, maxMinutes: 29, symbol: '⚫', description: 'ศักยภาพที่รอการเติบโต' },
    { id: 'germinating', name: 'งอกงาม', minMinutes: 30, maxMinutes: 59, symbol: '🌱', description: 'ชีวิตเริ่มต้นขึ้น' },
    { id: 'seedling', name: 'ต้นกล้าอ่อน', minMinutes: 60, maxMinutes: 99, symbol: '🌿', description: 'ใบเล็กๆ เริ่มผลิ' },
    { id: 'sprout', name: 'ต้นกล้า', minMinutes: 100, maxMinutes: 199, symbol: '🌾', description: 'ลำต้นแข็งแรงขึ้น' },
    { id: 'sapling', name: 'ต้นอ่อน', minMinutes: 200, maxMinutes: 399, symbol: '🪴', description: 'เริ่มหยั่งรากลงดิน' },
    { id: 'young', name: 'ต้นไม้วัยเยาว์', minMinutes: 400, maxMinutes: 699, symbol: '🌲', description: 'ยืนต้นอย่างมั่นคง' },
    { id: 'growing', name: 'ต้นไม้กำลังเติบโต', minMinutes: 700, maxMinutes: 999, symbol: '🌳', description: 'กิ่งก้านแผ่กว้าง' },
    { id: 'mature', name: 'ต้นไม้ใหญ่', minMinutes: 1000, maxMinutes: 1499, symbol: '🌴', description: 'แข็งแรง มั่นคง และให้ร่มเงา' },
    { id: 'strong', name: 'ต้นไม้แกร่ง', minMinutes: 1500, maxMinutes: 1999, symbol: '🎋', description: 'ทนทานต่อทุกสภาวะ' },
    { id: 'blossoming', name: 'ต้นไม้ผลิดอก', minMinutes: 2000, maxMinutes: 2499, symbol: '🌸', description: 'เปล่งประกายความงาม' },
    { id: 'flowering', name: 'ต้นไม้บานสะพรั่ง', minMinutes: 2500, maxMinutes: 2999, symbol: '🌺', description: 'ความงามที่สมบูรณ์แบบ' },
    { id: 'fruitful', name: 'ต้นไม้ติดผล', minMinutes: 3000, maxMinutes: 3999, symbol: '🍎', description: 'ให้ผลแก่ผู้อื่น' },
    { id: 'ancient', name: 'ต้นไม้โบราณ', minMinutes: 4000, maxMinutes: 5999, symbol: '🌳🏔️', description: 'ภูมิปัญญาแห่งกาลเวลา' },
    { id: 'sacred', name: 'ต้นไม้ศักดิ์สิทธิ์', minMinutes: 6000, maxMinutes: Infinity, symbol: '✨🌳✨', description: 'สัญลักษณ์แห่งปัญญาและการเชื่อมโยงอันลึกซึ้ง' },
];

export function getTreeStage(totalMinutes: number): TreeStage {
    return TREE_STAGES.find(stage => totalMinutes >= stage.minMinutes && totalMinutes <= stage.maxMinutes) || TREE_STAGES[TREE_STAGES.length - 1];
}
