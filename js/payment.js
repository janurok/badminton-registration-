document.addEventListener('DOMContentLoaded', function() {
    const selectBooking = document.getElementById('select-booking');
    const paymentDashboard = document.getElementById('payment-dashboard');
    const paymentForm = document.getElementById('payment-form');
    const recordPaymentBtn = document.querySelector('.record-payment-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const recordPaymentForm = document.getElementById('record-payment-form');
    const playerSelect = document.getElementById('player-select');
    const paymentAmount = document.getElementById('payment-amount');
    
    // กำหนดข้อมูลตัวอย่างสำหรับการจองสนาม
    const sampleBookings = {
        sample1: {
            venue: 'KN Complex',
            date: 'วันอาทิตย์ที่ 15 เม.ย. 68',
            time: '17:00-20:00 น.',
            hours: 3,
            playerCount: 14,
            totalAmount: 3330,
            payments: [
                { id: 1, name: 'แจน', status: 'paid', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: '15/04/2568 19:23' },
                { id: 2, name: 'พี่เต็ม', status: 'paid', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: '15/04/2568 18:45' },
                { id: 3, name: 'พี่ต่าย', status: 'paid', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: '15/04/2568 20:10' },
                { id: 4, name: 'ชาย', status: 'paid', type: 'ไม่ได้กิน BBQ', amount: 109.29, timestamp: '15/04/2568 17:30' },
                { id: 5, name: 'ปอนด์', status: 'paid', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: '15/04/2568 18:15' },
                { id: 6, name: 'พี่กิ๊ฟ', status: 'pending', type: 'ไม่ได้กิน BBQ', amount: 109.29, timestamp: null },
                { id: 7, name: 'พี่พงษ์', status: 'pending', type: 'ไม่ได้กิน BBQ', amount: 109.29, timestamp: null },
                { id: 8, name: 'พ่อแจน', status: 'paid', type: 'ไม่ได้กิน BBQ', amount: 109.29, timestamp: '15/04/2568 19:23' },
                { id: 9, name: 'นุโด', status: 'pending', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: null },
                { id: 10, name: 'ฝ้าย', status: 'paid', type: 'ไม่ได้กิน BBQ', amount: 109.29, timestamp: '15/04/2568 21:05' },
                { id: 11, name: 'นัท', status: 'paid', type: 'ไม่ได้กิน BBQ', amount: 109.29, timestamp: '15/04/2568 21:05' },
                { id: 12, name: 'ฟ้า', status: 'paid', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: '15/04/2568 18:30' },
                { id: 13, name: 'ป๋า', status: 'paid', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: '15/04/2568 18:30' },
                { id: 14, name: 'แบงค์กี้', status: 'pending', type: 'ร่วมกิน BBQ', amount: 334.29, timestamp: null }
            ]
        },
        sample2: {
            venue: 'My House',
            date: 'วันอาทิตย์ที่ 8 เม.ย. 68',
            time: '17:00-20:00 น.',
            hours: 3,
            playerCount: 12,
            totalAmount: 2130,
            payments: [
                { id: 1, name: 'แจน', status: 'paid', type: 'ร่วมกิน BBQ', amount: 327.50, timestamp: '08/04/2568 19:45' },
                { id: 2, name: 'โด', status: 'paid', type: 'ร่วมกิน BBQ', amount: 327.50, timestamp: '08/04/2568 18:30' },
                { id: 3, name: 'พี่ต่าย', status: 'paid', type: 'ร่วมกิน BBQ', amount: 327.50, timestamp: '08/04/2568 17:15' },
                { id: 4, name: 'พี่เต็ม', status: 'paid', type: 'ร่วมกิน BBQ', amount: 327.50, timestamp: '08/04/2568 18:10' },
                { id: 5, name: 'ปอนด์', status: 'pending', type: 'ร่วมกิน BBQ', amount: 327.50, timestamp: null },
                { id: 6, name: 'แบงค์กี้', status: 'paid', type: 'ร่วมกิน BBQ', amount: 327.50, timestamp: '08/04/2568 20:05' },
                { id: 7, name: 'ชาย', status: 'pending', type: 'ไม่ได้กิน BBQ', amount: 77.50, timestamp: null },
                { id: 8, name: 'โต๋', status: 'paid', type: 'ไม่ได้กิน BBQ', amount: 77.50, timestamp: '08/04/2568 19:30' },
                { id: 9, name: 'ฝ้าย', status: 'paid', type: 'ไม่ได้กิน BBQ', amount: 77.50, timestamp: '08/04/2568 20:15' },
                { id: 10, name: 'นัท', status: 'paid', type: 'ไม่ได้กิน BBQ', amount: 77.50, timestamp: '08/04/2568 20:15' },
                { id: 11, name: 'น้องฟ้า', status: 'pending', type: 'ไม่ได้กิน BBQ', amount: 77.50, timestamp: null },
                { id: 12, name: 'ป๋า', status: 'pending', type: 'ไม่ได้กิน BBQ', amount: 77.50, timestamp: null }
            ]
        },
        sample3: {
            venue: 'SCG Court',
            date: 'วันอาทิตย์ที่ 1 เม.ย. 68',
            time: '12:00-15:00 น.',
            hours: 3,
            playerCount: 20,
            totalAmount: 2708,
            payments: [
                { id: 1, name: 'แจน', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 15:20' },
                { id: 2, name: 'ชาย', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 14:45' },
                { id: 3, name: 'ฟ้า', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 15:05' },
                { id: 4, name: 'ป๋า', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 15:05' },
                { id: 5, name: 'โต๋', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 14:30' },
                { id: 6, name: 'พี่เต็ม', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 14:15' },
                { id: 7, name: 'ปอนด์', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 15:30' },
                { id: 8, name: 'พี่แบงค์', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 16:10' },
                { id: 9, name: 'แบงค์กี้', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 16:20' },
                { id: 10, name: 'พี่กิ๊ฟ', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 17:05' },
                { id: 11, name: 'พี่พงษ์', status: 'pending', type: 'ไม่มี BBQ', amount: 135.40, timestamp: null },
                { id: 12, name: 'พ่อแจน', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 15:20' },
                { id: 13, name: 'เพลง', status: 'pending', type: 'ไม่มี BBQ', amount: 135.40, timestamp: null },
                { id: 14, name: 'ภูมิ', status: 'pending', type: 'ไม่มี BBQ', amount: 135.40, timestamp: null },
                { id: 15, name: 'ฝ้าย', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 14:50' },
                { id: 16, name: 'นัท', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 14:50' },
                { id: 17, name: 'พี่ต่าย', status: 'paid', type: 'ไม่มี BBQ', amount: 135.40, timestamp: '01/04/2568 15:45' },
                { id: 18, name: 'พี่ป๋อง', status: 'pending', type: 'ไม่มี BBQ', amount: 135.40, timestamp: null },
                { id: 19, name: 'มุก', status: 'pending', type: 'ไม่มี BBQ', amount: 135.40, timestamp: null },
                { id: 20, name: 'แบงค์ก้า', status: 'pending', type: 'ไม่มี BBQ', amount: 135.40, timestamp: null }
            ]
        }
    };
    
    let currentBookingData = null;
    
    // แสดงข้อมูลการชำระเงิน
    function displayPaymentDashboard(bookingData) {
        if (!bookingData) return;
        
        currentBookingData = bookingData;
        
        // แสดงข้อมูลการจองสนาม
        document.getElementById('venue-display').textContent = bookingData.venue;
        document.getElementById('date-display').textContent = bookingData.date;
        document.getElementById('time-display').textContent = `${bookingData.time} (${bookingData.hours} ชม.)`;
        document.getElementById('player-count-display').textContent = `${bookingData.playerCount} คน`;
        
        // คำนวณสถิติการชำระเงิน
        const paidPayments = bookingData.payments.filter(p => p.status === 'paid');
        const pendingPayments = bookingData.payments.filter(p => p.status === 'pending');
        
        const paidAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // แสดงข้อมูลสถิติ
        document.getElementById('total-amount').textContent = `${bookingData.totalAmount.toLocaleString()} บาท`;
        document.getElementById('player-count-stat').textContent = `จากผู้เล่น ${bookingData.playerCount} คน`;
        
        document.getElementById('paid-amount').textContent = `${paidAmount.toLocaleString()} บาท`;
        document.getElementById('paid-players').textContent = `${paidPayments.length} คน (${(paidPayments.length / bookingData.playerCount * 100).toFixed(1)}%)`;
        
        document.getElementById('pending-amount').textContent = `${pendingAmount.toLocaleString()} บาท`;
        document.getElementById('pending-players').textContent = `${pendingPayments.length} คน (${(pendingPayments.length / bookingData.playerCount * 100).toFixed(1)}%)`;
        
        // แสดงรายการชำระเงิน
        displayPaymentList(bookingData.payments, 'all');
        
        // แสดง Dashboard
        paymentDashboard.style.display = 'block';
    }
    
    // แสดงรายการชำระเงิน
    function displayPaymentList(payments, filter) {
        const paymentList = document.getElementById('payment-list');
        
        if (!payments || payments.length === 0) {
            paymentList.innerHTML = `<tr><td colspan="7" style="text-align: center;">ไม่พบข้อมูลการชำระเงิน</td></tr>`;
            return;
        }
        
        let filteredPayments = payments;
        if (filter !== 'all') {
            filteredPayments = payments.filter(p => p.status === filter);
        }
        
        let html = '';
        filteredPayments.forEach(payment => {
            const statusClass = payment.status === 'paid' ? 'paid' : 'pending';
            const statusText = payment.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ';
            const actionText = payment.status === 'paid' ? 'ดูสลิป' : 'บันทึกการชำระ';
            
            html += `
                <tr>
                    <td>${payment.id}</td>
                    <td>${payment.name}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${payment.type}</td>
                    <td style="text-align: right;">${payment.amount.toFixed(2)}</td>
                    <td>${payment.timestamp || '-'}</td>
                    <td style="text-align: center;">
                        <button class="action-btn" data-id="${payment.id}" data-action="${payment.status === 'paid' ? 'view' : 'record'}">${actionText}</button>
                    </td>
                </tr>
            `;
        });
        
        paymentList.innerHTML = html;
        
        // เพิ่ม Event Listeners สำหรับปุ่มการดำเนินการ
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const paymentId = parseInt(this.getAttribute('data-id'));
                const action = this.getAttribute('data-action');
                
                if (action === 'record') {
                    showPaymentForm(paymentId);
                } else if (action === 'view') {
                    viewPaymentSlip(paymentId);
                }
            });
        });
    }
    
    // แสดงฟอร์มบันทึกการชำระเงิน
    function showPaymentForm(paymentId = null) {
        if (!currentBookingData) return;
        
        // รีเซ็ตฟอร์ม
        recordPaymentForm.reset();
        
        // ตั้งค่าวันที่และเวลาปัจจุบัน
        const now = new Date();
        document.getElementById('payment-date').value = formatDate(now);
        document.getElementById('payment-time').value = formatTime(now);
        
        // ล้างตัวเลือกผู้เล่น
        playerSelect.innerHTML = '<option value="">-- เลือกผู้เล่น --</option>';
        
        // เพิ่มตัวเลือกผู้เล่นที่ยังไม่ชำระเงิน
        const pendingPayments = currentBookingData.payments.filter(p => p.status === 'pending');
        pendingPayments.forEach(payment => {
            const option = document.createElement('option');
            option.value = payment.id;
            option.text = `${payment.name} (${payment.amount.toFixed(2)} บาท)`;
            option.setAttribute('data-amount', payment.amount);
            playerSelect.appendChild(option);
        });
        
        // ถ้ามีการระบุ paymentId ให้เลือกผู้เล่นที่ตรงกัน
        if (paymentId) {
            playerSelect.value = paymentId;
            // อัพเดทจำนวนเงิน
            const selectedOption = playerSelect.options[playerSelect.selectedIndex];
            if (selectedOption) {
                paymentAmount.value = selectedOption.getAttribute('data-amount');
            }
        }
        
        // แสดงฟอร์ม
        paymentForm.style.display = 'block';
    }
    
    // ดูสลิปการชำระเงิน
    function viewPaymentSlip(paymentId) {
        alert(`ดูสลิปการชำระเงินของรายการที่ ${paymentId}\n\nในเวอร์ชันเต็ม จะมีการแสดงรูปภาพสลิปการโอนเงิน`);
    }
    
    // บันทึกการชำระเงิน
    function recordPayment(formData) {
        if (!currentBookingData) return;
        
        const paymentId = parseInt(formData.playerId);
        const payment = currentBookingData.payments.find(p => p.id === paymentId);
        
        if (!payment) return;
        
        // อัพเดทสถานะการชำระเงิน
        payment.status = 'paid';
        payment.timestamp = `${formData.paymentDate} ${formData.paymentTime}`;
        
        // แสดงข้อมูลใหม่
        displayPaymentDashboard(currentBookingData);
        
        // ซ่อนฟอร์ม
        paymentForm.style.display = 'none';
        
        alert('บันทึกการชำระเงินเรียบร้อย!');
    }
    
    // ฟอร์แมตวันที่
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // ฟอร์แมตเวลา
    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    // เพิ่ม Event Listeners
    if (selectBooking) {
        selectBooking.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue && sampleBookings[selectedValue]) {
                displayPaymentDashboard(sampleBookings[selectedValue]);
            } else {
                paymentDashboard.style.display = 'none';
                paymentForm.style.display = 'none';
            }
        });
    }
    
    // เพิ่ม Event Listeners สำหรับปุ่มกรอง
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // ยกเลิกการเลือกปุ่มอื่น
            filterBtns.forEach(b => b.classList.remove('active'));
            // เลือกปุ่มปัจจุบัน
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            if (currentBookingData) {
                displayPaymentList(currentBookingData.payments, filter);
            }
        });
    });
    
    // เพิ่ม Event Listeners สำหรับการบันทึกการชำระเงิน
    if (recordPaymentBtn) {
        recordPaymentBtn.addEventListener('click', function() {
            showPaymentForm();
        });
    }
    
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', function() {
            paymentForm.style.display = 'none';
        });
    }
    
    if (playerSelect) {
        playerSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.value) {
                paymentAmount.value = selectedOption.getAttribute('data-amount');
            } else {
                paymentAmount.value = '';
            }
        });
    }
    
    if (recordPaymentForm) {
        recordPaymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                playerId: playerSelect.value,
                paymentAmount: paymentAmount.value,
                paymentDate: document.getElementById('payment-date').value,
                paymentTime: document.getElementById('payment-time').value,
                // ในเวอร์ชันเต็ม จะมีการอัปโหลดไฟล์สลิปด้วย
            };
            
            recordPayment(formData);
        });
    }
    
    // เพิ่มสไตล์ CSS เพิ่มเติม
    const style = document.createElement('style');
    style.textContent = `
        .payment-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .stat-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-meta {
            font-size: 12px;
            color: #999;
        }
        
        .payment-filter {
            display: flex;
            margin-bottom: 20px;
            align-items: center;
        }
        
        .filter-btn {
            background-color: #eee;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            margin-right: 10px;
            cursor: pointer;
        }
        
        .filter-btn.active {
            background-color: #3498db;
            color: white;
        }
        
        .record-payment-btn {
            background-color: #2ecc71;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            margin-left: auto;
        }
        
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        
        .status-badge.paid {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status-badge.pending {
            background-color: #fff3cd;
            color: #856404;
        }
        
        .action-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .upload-area {
            border: 2px dashed #3498db;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            position: relative;
            cursor: pointer;
        }
        
        .upload-area input[type="file"] {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }
        
        .upload-placeholder {
            color: #666;
        }
        
        .info-item {
            margin-bottom: 10px;
        }
        
        .info-item label {
            font-weight: bold;
            color: #555;
            display: block;
            margin-bottom: 3px;
        }
        
        .player-cost-list {
            background-color: #f8f8f8;
            border-radius: 8px;
            padding: 15px;
            width: 48%;
        }
        
        .player-cost-list h4 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #3498db;
        }
        
        .player-cost-list ol {
            padding-left: 20px;
            margin: 0;
        }
        
        .player-cost-list li {
            margin-bottom: 5px;
        }
    `;
    document.head.appendChild(style);
});
