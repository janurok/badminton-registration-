// sheets-api.js - ใช้สำหรับเชื่อมต่อกับ Google Sheets API

const API_KEY = 'AIzaSyCkSSrumZo14SwR2HRJhLl-dseWH09GyX0'; // นำ API Key ที่ได้มาใส่ตรงนี้
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ID ของ Google Sheets ที่คุณสร้าง

// ฟังก์ชันสำหรับอ่านข้อมูลจากชีท Players
async function fetchPlayers() {
  try {
    const range = 'Players!A2:F'; // ตำแหน่งข้อมูลที่ต้องการอ่าน (ไม่รวมหัวตาราง)
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('การเชื่อมต่อกับ Google Sheets API ล้มเหลว');
    }
    
    const data = await response.json();
    
    // ถ้าไม่มีข้อมูล ให้ส่งอาร์เรย์ว่างกลับ
    if (!data.values || data.values.length === 0) {
      return [];
    }
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานง่าย
    const players = data.values.map(row => ({
      date: row[0] || '', // วันที่
      time: row[1] || '', // เวลา
      venue: row[2] || '', // สถานที่
      name: row[3] || '', // ชื่อเล่น
      lineId: row[4] || '', // Line ID
      status: row[5] || 'pending' // สถานะ
    }));
    
    return players;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    return [];
  }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลผู้เล่นใหม่
async function addPlayer(playerData) {
  try {
    // ใช้ Google Sheets API ผ่าน Apps Script ที่เราจะสร้างในขั้นตอนถัดไป
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbwXecQuNlbabMF3s_RALykgu6eSNZ8cZx22_uaAiTccpL0IEsDYRWwUJn0lQJEgHD2Zfg

/exec`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addPlayer',
          data: playerData
        })
      }
    );
    
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
    const range = 'Bookings!A2:Z'; // ตำแหน่งข้อมูลที่ต้องการอ่าน
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('การเชื่อมต่อกับ Google Sheets API ล้มเหลว');
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      return [];
    }
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานง่าย
    const bookings = data.values.map(row => ({
      id: row[0] || '',
      date: row[1] || '',
      venue: row[2] || '',
      startTime: row[3] || '',
      endTime: row[4] || '',
      courtCount: row[5] || '',
      courtRate: row[6] || '',
      bbqCost: row[7] || '',
      bbqPeople: row[8] || '',
      totalCost: row[9] || ''
    }));
    
    return bookings;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    return [];
  }
}

// ส่งออกฟังก์ชันเพื่อให้ไฟล์อื่นใช้งาน
export { fetchPlayers, addPlayer, fetchBookings };
