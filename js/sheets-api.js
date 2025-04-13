// sheets-api.js - ใช้สำหรับเชื่อมต่อกับ Google Sheets API

// ใช้ App Script URL ที่คุณมี
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrZUJApsYtB6Rkw1aYPEYREgEiEsWVwgkKbdr_FCpAsHItolinwhKMfJbZ-4y2tn7w/exec';

// ฟังก์ชันสำหรับอ่านข้อมูลจากชีท Players
async function fetchPlayers() {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getPlayers`);
    
    if (!response.ok) {
      throw new Error('การเชื่อมต่อกับ Google Apps Script ล้มเหลว');
    }
    
    const data = await response.json();
    
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
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addPlayer',
        data: playerData
      })
    });
    
    if (!response.ok) {
      throw new Error('การเชื่อมต่อกับ Google Apps Script ล้มเหลว');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
    throw error;
  }
}

// ฟังก์ชันสำหรับดึงข้อมูลการจองสนาม
async function fetchBookings() {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getBookings`);
    
    if (!response.ok) {
      throw new Error('การเชื่อมต่อกับ Google Apps Script ล้มเหลว');
    }
    
    const data = await response.json();
    
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
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'recordPayment',
        data: paymentData
      })
    });
    
    if (!response.ok) {
      throw new Error('การเชื่อมต่อกับ Google Apps Script ล้มเหลว');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
    throw error;
  }
}

// ส่งออกฟังก์ชันเพื่อให้ไฟล์อื่นใช้งาน
export { fetchPlayers, addPlayer, fetchBookings, recordPayment };
