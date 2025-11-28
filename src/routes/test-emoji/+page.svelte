<script>
  import { TREE_STAGES } from '$lib/tree';
</script>

<div class="max-w-2xl mx-auto p-8 space-y-6">
  <h1 class="text-3xl font-bold text-center mb-8">🧪 Emoji Test Page</h1>
  
  <div class="bg-white rounded-2xl shadow-lg p-6 space-y-4">
    <h2 class="text-xl font-bold text-sage mb-4">Tree Stage Emojis</h2>
    
    <div class="space-y-3">
      {#each TREE_STAGES as stage, index}
        <div class="flex items-center gap-4 p-3 bg-cream rounded-xl hover:shadow-md transition-shadow">
          <div class="text-5xl min-w-[80px] text-center bg-white rounded-xl p-2 shadow-sm">
            {stage.symbol}
          </div>
          <div class="flex-1">
            <div class="font-bold text-sage">{index + 1}. {stage.name}</div>
            <div class="text-sm text-slate/60">{stage.description}</div>
            <div class="text-xs text-slate/40 mt-1">
              {stage.minMinutes} - {stage.maxMinutes === Infinity ? '∞' : stage.maxMinutes} นาที
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
              {stage.id}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="bg-white rounded-2xl shadow-lg p-6 space-y-4">
    <h2 class="text-xl font-bold text-sage mb-4">การทดสอบ Emoji</h2>
    
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="p-4 bg-green-50 rounded-xl">
        <div class="font-bold text-green-700 mb-2">✅ ควรเห็น:</div>
        <ul class="space-y-1 text-green-600">
          <li>• Emoji ทุกตัวแสดงผลชัดเจน</li>
          <li>• ไม่มีตัวอักษรแปลกๆ หรือกล่อง �</li>
          <li>• ขนาดและสีของ emoji ถูกต้อง</li>
        </ul>
      </div>
      
      <div class="p-4 bg-red-50 rounded-xl">
        <div class="font-bold text-red-700 mb-2">❌ ถ้าเห็น:</div>
        <ul class="space-y-1 text-red-600">
          <li>• กล่องว่าง □ หรือ �</li>
          <li>• ตัวเลขแทน emoji</li>
          <li>• Emoji บิดเบี้ยว</li>
          <li>→ แสดงว่า emoji นั้นไม่รองรับ</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
    <h3 class="font-bold text-blue-900 mb-3">🔍 วิธีทดสอบเพิ่มเติม:</h3>
    <ol class="list-decimal list-inside space-y-2 text-blue-800">
      <li>เปิดหน้านี้บน <strong>iOS Safari</strong> และ <strong>Chrome</strong></li>
      <li>เช็คว่า emoji แสดงผลเหมือนกันหรือไม่</li>
      <li>ถ้า emoji ตัวไหนไม่แสดง → ควรเปลี่ยนเป็น emoji อื่น</li>
      <li>ทดสอบบน macOS, Windows, Android ด้วย</li>
    </ol>
  </div>

  <div class="text-center pt-4">
    <a href="/" class="text-sage hover:underline font-semibold">← กลับหน้าหลัก</a>
  </div>
</div>

<style>
  :global(body) {
    background: #F9F7F2;
  }
</style>
