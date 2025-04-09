document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registration-form');
    const playerListDiv = document.getElementById('player-list');
    
    // ฟังก์ชันสำหรับบันทึกข้อมูลไปยัง Google Sheets
    async function submitToGoogleSheets(formData) {
        // จะใส่โค้ดเชื่อมต่อกับ Google Sheets API ในส่วนถัดไป
        console.log('บันทึกข้อมูล:', formData);
        
        // ตัวอย่างการแสดงผลชั่วคราว (ในขั้นตอนถัดไปจะเชื่อมต่อกับ API จริง)
        alert('ลงทะเบียนสำเร็จ!');
        registrationForm.reset();
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
            
            submitToGoogleSheets(formData);
        });
    }
    
    // ฟังก์ชันดึงข้อมูลรายชื่อผู้เล่น
    async function fetchPlayerList() {
        // จะใส่โค้ดดึงข้อมูลจาก Google Sheets ในส่วนถัดไป
        
        // ตัวอย่างข้อมูลชั่วคราว
        const samplePlayers = [
            { name: 'แจน', status: 'confirmed' },
            { name: 'พี่เต็ม', status: 'confirmed' },
            { name: 'พี่ต่าย', status: 'confirmed' },
            { name: 'ชาย', status: 'pending' },
            { name: 'ปอนด์', status: 'pending' }
        ];
        
        renderPlayerList(samplePlayers);
    }
    
    // แสดงรายชื่อผู้เล่น
    function renderPlayerList(players) {
        if (!playerListDiv) return;
        
        if (players.length === 0) {
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
