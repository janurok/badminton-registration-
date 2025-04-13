// sheets-api.js - ใช้สำหรับเชื่อมต่อกับ Google Sheets API

// ใช้ App Script URL ของคุณ
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrZUJApsYtB6Rkw1aYPEYREgEiEsWVwgkKbdr_FCpAsHItolinwhKMfJbZ-4y2tn7w/exec';

// ฟังก์ชันสำหรับอ่านข้อมูลจากชีท Players
async function fetchPlayers() {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getPlayers`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // รับข้อความ response ก่อนแล้วค่อยแปลงเป็น JSON
    const text = await response.text();
    console.log("Response from getPlayers:", text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('ไม่สามารถแปลงข้อมูลเป็น JSON ได้:', text);
      return [];
    }
    
    // ถ้าไม่มีข้อมูล ให้ส่งอาร์เรย์ว่างกลับ
    if (!data.players || data.players.length === 0) {
      return [];
    }
    
    return data.players;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    return [];
  }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลผู้เล่นใหม่
async function addPlayer(playerData) {
  try {
    console.log("Sending player data:", playerData);
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'addPlayer',
        data: playerData
      })
    });
    
    // รับข้อความ response ก่อนแล้วค่อยแปลงเป็น JSON
    const text = await response.text();
    console.log("Response from addPlayer:", text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('ไม่สามารถแปลงข้อมูลเป็น JSON ได้:', text);
      return { success: false, message: 'รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง' };
    }
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
    return { success: false, message: error.toString() };
  }
}

// ฟังก์ชันสำหรับดึงข้อมูลการจองสนาม
async function fetchBookings() {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getBookings`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // รับข้อความ response ก่อนแล้วค่อยแปลงเป็น JSON
    const text = await response.text();
    console.log("Response from getBookings:", text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('ไม่สามารถแปลงข้อมูลเป็น JSON ได้:', text);
      return [];
    }
    
    if (!data.bookings || data.bookings.length === 0) {
      return [];
    }
    
    return data.bookings;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    return [];
  }
}

// ฟังก์ชันสำหรับบันทึกการชำระเงิน
async function recordPayment(paymentData) {
  try {
    console.log("Sending payment data:", paymentData);
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'recordPayment',
        data: paymentData
      })
    });
    
    // รับข้อความ response ก่อนแล้วค่อยแปลงเป็น JSON
    const text = await response.text();
    console.log("Response from recordPayment:", text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('ไม่สามารถแปลงข้อมูลเป็น JSON ได้:', text);
      return { success: false, message: 'รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง' };
    }
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
    return { success: false, message: error.toString() };
  }
}

// ฟังก์ชันเก็บข้อมูลใน Local Storage (สำรอง)
function saveToLocalStorage(playerData) {
  try {
    // ดึงข้อมูลเดิม
    const existing = JSON.parse(localStorage.getItem('badmintonPlayers') || '[]');
    
    // เพิ่มข้อมูลใหม่
    existing.push({
      ...playerData,
      id: Date.now(), // สร้าง ID ชั่วคราว
      created: new Date().toISOString(),
      status: 'pending'
    });
    
    // บันทึกกลับ
    localStorage.setItem('badmintonPlayers', JSON.stringify(existing));
    
    return { success: true, message: 'บันทึกข้อมูลลงในเครื่องสำเร็จ' };
  } catch (error) {
    console.error('ไม่สามารถบันทึกลง localStorage ได้:', error);
    return { success: false, message: error.toString() };
  }
}

// ส่งออกฟังก์ชันเพื่อให้ไฟล์อื่นใช้งาน
export { fetchPlayers, addPlayer, fetchBookings, recordPayment, saveToLocalStorage };
