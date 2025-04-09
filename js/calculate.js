document.addEventListener('DOMContentLoaded', function() {
    const selectBooking = document.getElementById('select-booking');
    const calculationResults = document.getElementById('calculation-results');
    const generateBillBtn = document.getElementById('generate-bill');
    
    // กำหนดข้อมูลตัวอย่างสำหรับการจองสนาม
    const sampleBookings = {
        sample1: {
            venue: 'KN Complex',
            date: 'วันอาทิตย์ที่ 15 เม.ย. 68',
            time: '17:00-20:00 น.',
            hours: 3,
            courtCount: 2,
            courtRate: 180,
            playerCount: 14,
            bbqPlayers: 8,
            bbqCost: 1800,
            shuttlecocks: [
                { type: 'Victor No.3', count: 6, price: 75 }
            ],
            bbqPlayerNames: ['แจน', 'พี่เต็ม', 'พี่ต่าย', 'ปอนด์', 'ฟ้า', 'ป๋า', 'แบงค์กี้', 'นุโด'],
            nonBBQPlayerNames: ['ชาย', 'พี่กิ๊ฟ', 'พี่พงษ์', 'พ่อแจน', 'ฝ้าย', 'นัท']
        },
        sample2: {
            venue: 'My House',
            date: 'วันอาทิตย์ที่ 8 เม.ย. 68',
            time: '17:00-20:00 น.',
            hours: 3,
            courtCount: 2,
            courtRate: 210,
            playerCount: 12,
            bbqPlayers: 6,
            bbqCost: 1500,
            shuttlecocks: [
                { type: 'Excella-77', count: 8, price: 65 }
            ],
            bbqPlayerNames: ['แจน', 'โด', 'พี่ต่าย', 'พี่เต็ม', 'ปอนด์', 'แบงค์กี้'],
            nonBBQPlayerNames: ['ชาย', 'โต๋', 'ฝ้าย', 'นัท', 'น้องฟ้า', 'ป๋า']
        },
        sample3: {
            venue: 'SCG Court',
            date: 'วันอาทิตย์ที่ 1 เม.ย. 68',
            time: '12:00-15:00 น.',
            hours: 3,
            courtCount: 3,
            courtRate: 170,
            playerCount: 20,
            bbqPlayers: 0,
            bbqCost: 0,
            shuttlecocks: [
                { type: 'Lingmei-70', count: 19, price: 62 }
            ],
            bbqPlayerNames: [],
            nonBBQPlayerNames: ['แจน', 'ชาย', 'ฟ้า', 'ป๋า', 'โต๋', 'พี่เต็ม', 'ปอนด์', 'พี่แบงค์', 'แบงค์กี้', 'พี่กิ๊ฟ', 'พี่พงษ์', 'พ่อแจน', 'เพลง', 'ภูมิ', 'ฝ้าย', 'นัท', 'พี่ต่าย', 'พี่ป๋อง', 'มุก', 'แบงค์ก้า']
        }
    };
    
    // คำนวณค่าใช้จ่ายและแสดงผล
    function calculateExpenses(bookingData) {
        if (!bookingData) return;
        
        // แสดงข้อมูลการจองสนาม
        document.getElementById('venue-display').textContent = bookingData.venue;
        document.getElementById('date-display').textContent = bookingData.date;
        document.getElementById('time-display').textContent = `${bookingData.time} (${bookingData.hours} ชม.)`;
        document.getElementById('player-count-display').textContent = `${bookingData.playerCount} คน`;
        
        // คำนวณค่าใช้จ่าย
        const courtCost = bookingData.courtCount * bookingData.courtRate * bookingData.hours;
        
        let shuttlecockCost = 0;
        bookingData.shuttlecocks.forEach(shuttle => {
            shuttlecockCost += shuttle.count * shuttle.price;
        });
        
        const totalCost = courtCost + shuttlecockCost + bookingData.bbqCost;
        
        // คำนวณค่าใช้จ่ายต่อคน
        const courtAndShuttleCostPerPlayer = (courtCost + shuttlecockCost) / bookingData.playerCount;
        const bbqCostPerPlayer = bookingData.bbqPlayers > 0 ? bookingData.bbqCost / bookingData.bbqPlayers : 0;
        const totalCostWithBBQ = courtAndShuttleCostPerPlayer + bbqCostPerPlayer;
        
        // สร้างรายการค่าใช้จ่าย
        let expenseHTML = `
            <tr>
                <td>ค่าคอร์ท (${bookingData.hours} ชม.)</td>
                <td style="text-align: center;">${bookingData.courtCount} คอร์ท</td>
                <td style="text-align: right;">${bookingData.courtRate} / ชม.</td>
                <td style="text-align: right;">${courtCost.toLocaleString()}</td>
            </tr>
        `;
        
        bookingData.shuttlecocks.forEach(shuttle => {
            const shuttleCost = shuttle.count * shuttle.price;
            expenseHTML += `
                <tr>
                    <td>ลูกแบด ${shuttle.type}</td>
                    <td style="text-align: center;">${shuttle.count} ลูก</td>
                    <td style="text-align: right;">${shuttle.price} / ลูก</td>
                    <td style="text-align: right;">${shuttleCost.toLocaleString()}</td>
                </tr>
            `;
        });
        
        if (bookingData.bbqCost > 0) {
            expenseHTML += `
                <tr>
                    <td>ค่า Lucky BBQ</td>
                    <td style="text-align: center;">${bookingData.bbqPlayers} คน</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">${bookingData.bbqCost.toLocaleString()}</td>
                </tr>
            `;
        }
        
        expenseHTML += `
            <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">รวมทั้งหมด</td>
                <td style="text-align: right; font-weight: bold;">${totalCost.toLocaleString()}</td>
            </tr>
        `;
        
        document.getElementById('expense-items').innerHTML = expenseHTML;
        
        // แสดงค่าใช้จ่ายต่อคน
        document.querySelector('.data-table tbody tr:nth-child(1) td:nth-child(2)').textContent = bookingData.playerCount;
        document.querySelector('.data-table tbody tr:nth-child(1) td:nth-child(3)').textContent = courtAndShuttleCostPerPlayer.toFixed(2);
        
        if (bookingData.bbqCost > 0) {
            document.querySelector('.data-table tbody tr:nth-child(2)').style.display = '';
            document.querySelector('.data-table tbody tr:nth-child(3)').style.display = '';
            document.querySelector('.data-table tbody tr:nth-child(2) td:nth-child(2)').textContent = bookingData.bbqPlayers;
            document.querySelector('.data-table tbody tr:nth-child(2) td:nth-child(3)').textContent = bbqCostPerPlayer.toFixed(2);
            document.querySelector('.data-table tbody tr:nth-child(3) td:nth-child(2)').textContent = bookingData.bbqPlayers;
            document.querySelector('.data-table tbody tr:nth-child(3) td:nth-child(3)').textContent = totalCostWithBBQ.toFixed(2);
        } else {
            document.querySelector('.data-table tbody tr:nth-child(2)').style.display = 'none';
            document.querySelector('.data-table tbody tr:nth-child(3)').style.display = 'none';
        }
        
        // แสดงรายชื่อผู้เล่น
        let bbqPlayersHTML = '';
        bookingData.bbqPlayerNames.forEach(name => {
            bbqPlayersHTML += `<li>${name}</li>`;
        });
        document.getElementById('bbq-players').innerHTML = bbqPlayersHTML;
        
        let nonBBQPlayersHTML = '';
        bookingData.nonBBQPlayerNames.forEach(name => {
            nonBBQPlayersHTML += `<li>${name}</li>`;
        });
        document.getElementById('non-bbq-players').innerHTML = nonBBQPlayersHTML;
        
        // แสดงหรือซ่อนส่วนผู้เล่นที่ร่วมกิน BBQ
        const bbqPlayersSection = document.querySelector('.player-costs');
        if (bookingData.bbqCost > 0) {
            bbqPlayersSection.style.display = 'block';
            document.querySelector('.player-cost-list:first-child h4').textContent = 
                `ผู้เล่นที่ร่วมกิน BBQ (${totalCostWithBBQ.toFixed(2)} บาท/คน)`;
            document.querySelector('.player-cost-list:last-child h4').textContent = 
                `ผู้เล่นที่ไม่ได้กิน BBQ (${courtAndShuttleCostPerPlayer.toFixed(2)} บาท/คน)`;
        } else {
            bbqPlayersSection.style.display = 'none';
        }
    }
    
    // สร้างบิลค่าใช้จ่าย
    function generateBill() {
        alert('กำลังสร้างบิลค่าใช้จ่าย...\n\nในเวอร์ชันเต็ม จะมีการสร้างไฟล์ HTML ที่สามารถดาวน์โหลดหรือแชร์ได้');
    }
    
    // เพิ่ม Event Listeners
    if (selectBooking) {
        selectBooking.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue && sampleBookings[selectedValue]) {
                calculationResults.style.display = 'block';
                calculateExpenses(sampleBookings[selectedValue]);
            } else {
                calculationResults.style.display = 'none';
            }
        });
    }
    
    if (generateBillBtn) {
        generateBillBtn.addEventListener('click', generateBill);
    }
});
