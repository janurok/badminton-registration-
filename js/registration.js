// เพิ่มการ import ฟังก์ชันจาก sheets-api.js
import { fetchPlayers, addPlayer } from './sheets-api.js';

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registration-form');
    const playerListDiv = document.getElementById('player-list');
    
    // ฟังก์ชันสำหรับบันทึกข้อมูลไปยัง Google Sheets
    async function submitToGoogleSheets(formData) {
        try {
            // แสดงข้อความกำลังดำเนินการ
            const submitButton = registrationForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'กำลังบันทึก...';
            submitButton.disabled = true;
            
            const result = await addPlayer({
                date: formData.playDate,
                time: `${formData.startTime}-${formData.endTime}`,
                venue: formData.venue,
                name: formData.playerName,
                lineId: formData.lineId,
                status: 'pending'
            });
            
            // คืนค่าปุ่มกลับเป็นปกติ
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            
            if (result.success) {
                alert('ลงทะเบียนสำเร็จ!');
                registrationForm.reset();
                // รีโหลดรายชื่อผู้เล่น
                fetchPlayerList();
            } else {
                alert(`เกิดข้อผิดพลาด: ${result.message || 'ไม่สามารถบันทึกข้อมูลได้'}`);
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
            alert('เกิดข้อผิดพลาด: ไม่สามารถบันทึกข้อมูลได้');
            
            // คืนค่าปุ่มกลับเป็นปกติในกรณีเกิดข้อผิดพลาด
            const submitButton = registrationForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'ลงทะเบียน';
            submitButton.disabled = false;
        }
    }
    
    // จัดการการส่งฟอร์ม
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                playDate: document.getElementById('play-date').value,
                venue: document.getElementById('venue').value,
                startTime: document.getElementById('start-time').value,
                endTime: document.getElementById('end-time').value,
                playerName: document.getElementById('player-name').value,
                lineId: document.getElementById('line-id').value
            };
            
            // ตรวจสอบข้อมูลเบื้องต้น
            if (!formData.playerName.trim()) {
                alert('กรุณากรอกชื่อเล่น');
                return;
            }
            
            submitToGoogleSheets(formData);
        });
    }
    
    // ฟังก์ชันดึงข้อมูลรายชื่อผู้เล่น
    async function fetchPlayerList() {
        try {
            // แสดงข้อความกำลังโหลด
            playerListDiv.innerHTML = '<h3>รายชื่อผู้ลงทะเบียน</h3><p>กำลังโหลดข้อมูล...</p>';
            
            const players = await fetchPlayers();
            renderPlayerList(players);
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
            // แสดงข้อความแจ้งเตือน
            playerListDiv.innerHTML = '<h3>รายชื่อผู้ลงทะเบียน</h3><p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        }
    }
    
    // แสดงรายชื่อผู้เล่น
    function renderPlayerList(players) {
        if (!playerListDiv) return;
        
        if (!players || players.length === 0) {
            playerListDiv.innerHTML = '<h3>รายชื่อผู้ลงทะเบียน</h3><p>ยังไม่มีผู้ลงทะเบียน</p>';
            return;
        }
        
        let html = `
            <h3>รายชื่อผู้ลงทะเบียน (${players.length} คน)</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 15px;">
        `;
        
        players.forEach(player => {
            const statusColor = player.status === 'confirmed' ? '#2ecc71' : '#f39c12';
            html += `
                <div style="background-color: white; padding: 10px; border-radius: 5px; display: flex; align-items: center;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColor}; margin-right: 10px;"></span>
                    <span>${player.name}</span>
                </div>
            `;
        });
        
        html += '</div>';
        playerListDiv.innerHTML = html;
    }
    
    // โหลดรายชื่อผู้เล่นเมื่อเปิดหน้า
    fetchPlayerList();
});
