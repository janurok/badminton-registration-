document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const addShuttlecockBtn = document.getElementById('add-shuttlecock');
    const shuttlecockContainer = document.getElementById('shuttlecock-container');
    
    let shuttlecockCount = 1; // เริ่มต้นมี 1 รายการลูกแบดแล้ว
    
    // ฟังก์ชันสำหรับคำนวณค่าใช้จ่าย
    function calculateCosts() {
        // คำนวณค่าคอร์ท
        const courtCount = parseInt(document.getElementById('court-count').value) || 0;
        const courtPrice = parseFloat(document.getElementById('court-price').value) || 0;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        
        // คำนวณจำนวนชั่วโมง
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const hours = endHour - startHour;
        
        const courtCost = courtCount * courtPrice * hours;
        
        // คำนวณค่าลูกแบด
        let shuttlecockCost = 0;
        for (let i = 0; i < shuttlecockCount; i++) {
            const shuttlecockPrice = parseFloat(document.getElementById(`shuttlecock-price-${i}`).value) || 0;
            const shuttlecockNum = parseInt(document.getElementById(`shuttlecock-count-${i}`).value) || 0;
            const itemTotal = shuttlecockPrice * shuttlecockNum;
            
            // อัปเดตยอดรวมสำหรับแต่ละรายการ
            const totalElem = document.getElementById(`shuttlecock-total-${i}`);
            if (totalElem) {
                totalElem.textContent = `รวม: ${itemTotal.toFixed(0)} บาท`;
            }
            
            shuttlecockCost += itemTotal;
        }
        
        // คำนวณค่า BBQ
        const bbqCost = parseFloat(document.getElementById('bbq-cost').value) || 0;
        
        // อัปเดตสรุปค่าใช้จ่าย
        document.getElementById('court-cost').textContent = `${courtCost.toFixed(0)} บาท`;
        document.getElementById('shuttlecock-cost').textContent = `${shuttlecockCost.toFixed(0)} บาท`;
        document.getElementById('bbq-cost-display').textContent = `${bbqCost.toFixed(0)} บาท`;
        
        // คำนวณยอดรวมทั้งหมด
        const totalCost = courtCost + shuttlecockCost + bbqCost;
        document.getElementById('total-cost').textContent = `${totalCost.toFixed(0)} บาท`;
    }
    
    // เพิ่มรายการลูกแบด
    addShuttlecockBtn.addEventListener('click', function() {
        const newItem = document.createElement('div');
        newItem.className = 'shuttlecock-item';
        newItem.dataset.index = shuttlecockCount;
        newItem.innerHTML = `
            <div style="border-top: 1px dashed #ddd; margin: 20px 0; padding-top: 20px;"></div>
            <div class="form-row">
                <div class="form-group">
                    <label for="shuttlecock-type-${shuttlecockCount}">ประเภทลูกแบด</label>
                    <select id="shuttlecock-type-${shuttlecockCount}" name="shuttlecock-type-${shuttlecockCount}" required>
                        <option value="Victor No.3">Victor No.3</option>
                        <option value="Excella-77" selected>Excella-77</option>
                        <option value="Lingmei-90 Pro">Lingmei-90 Pro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="shuttlecock-price-${shuttlecockCount}">ราคาต่อลูก (บาท)</label>
                    <input type="number" id="shuttlecock-price-${shuttlecockCount}" name="shuttlecock-price-${shuttlecockCount}" value="65" min="1" required>
                </div>
            </div>
            <div class="form-group">
                <label for="shuttlecock-count-${shuttlecockCount}">จำนวนลูก</label>
                <input type="number" id="shuttlecock-count-${shuttlecockCount}" name="shuttlecock-count-${shuttlecockCount}" value="2" min="1" required>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <div id="shuttlecock-total-${shuttlecockCount}" style="font-weight: 500;">รวม: 130 บาท</div>
                <button type="button" class="btn-remove" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">ลบ</button>
            </div>
        `;
        
        shuttlecockContainer.appendChild(newItem);
        
        // แสดงปุ่มลบสำหรับรายการแรกถ้ามีมากกว่า 1 รายการ
        if (shuttlecockCount === 1) {
            document.querySelector('.shuttlecock-item[data-index="0"] .btn-remove').style.display = 'block';
        }
        
        // เพิ่ม event listener สำหรับปุ่มลบ
        newItem.querySelector('.btn-remove').addEventListener('click', function() {
            newItem.remove();
            calculateCosts();
            
            // ซ่อนปุ่มลบสำหรับรายการเดียวที่เหลือ
            if (document.querySelectorAll('.shuttlecock-item').length === 1) {
                document.querySelector('.shuttlecock-item .btn-remove').style.display = 'none';
            }
        });
        
        // เพิ่มการคำนวณอัตโนมัติเมื่อมีการเปลี่ยนแปลงข้อมูล
        newItem.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', calculateCosts);
            input.addEventListener('input', calculateCosts);
        });
        
        shuttlecockCount++;
        calculateCosts();
    });
    
    // Event listener สำหรับการเปลี่ยนแปลงข้อมูลในฟอร์ม
    const inputs = bookingForm.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', calculateCosts);
        input.addEventListener('input', calculateCosts);
    });
    
    // เพิ่ม event listener สำหรับปุ่มลบของรายการแรก
    document.querySelector('.shuttlecock-item[data-index="0"] .btn-remove').addEventListener('click', function() {
        if (document.querySelectorAll('.shuttlecock-item').length > 1) {
            document.querySelector('.shuttlecock-item[data-index="0"]').remove();
            calculateCosts();
        }
    });
    
    // จัดการการส่งฟอร์ม
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // รวบรวมข้อมูลจากฟอร์ม
        const formData = {
            playDate: document.getElementById('play-date').value,
            venue: document.getElementById('venue').value,
            startTime: document.getElementById('start-time').value,
            endTime: document.getElementById('end-time').value,
            courtCount: document.getElementById('court-count').value,
            courtPrice: document.getElementById('court-price').value,
            shuttlecocks: [],
            bbqCost: document.getElementById('bbq-cost').value,
            bbqCount: document.getElementById('bbq-count').value
        };
        
        // เก็บข้อมูลลูกแบดทุกรายการ
        document.querySelectorAll('.shuttlecock-item').forEach((item, index) => {
            formData.shuttlecocks.push({
                type: document.getElementById(`shuttlecock-type-${item.dataset.index}`).value,
                price: document.getElementById(`shuttlecock-price-${item.dataset.index}`).value,
                count: document.getElementById(`shuttlecock-count-${item.dataset.index}`).value
            });
        });
        
        // ในเวอร์ชันถัดไปจะเชื่อมต่อกับ Google Sheets API
        console.log('ข้อมูลการจองสนาม:', formData);
        
        // แสดงข้อความแจ้งสำเร็จชั่วคราว
        alert('บันทึกการจองสนามสำเร็จ!');
        // bookingForm.reset();
    });
    
    // คำนวณค่าใช้จ่ายเมื่อโหลดหน้าเสร็จ
    calculateCosts();
});
