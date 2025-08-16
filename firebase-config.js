// Firebase 설정 파일
const firebaseConfig = {
  apiKey: "AIzaSyBLrW-StPK5tvgPTov6SJiIeBvO7tOMD9g",
  authDomain: "chukssul-ec0da.firebaseapp.com",
  databaseURL: "https://chukssul-ec0da-default-rtdb.asia-southeast1.firebasedatabase.app", // 이 줄 추가 필요
  projectId: "chukssul-ec0da",
  storageBucket: "chukssul-ec0da.firebasestorage.app",
  messagingSenderId: "122622106851",
  appId: "1:122622106851:web:e8c4e574eee88033aeb9d6",
  measurementId: "G-JQSVDYWKXV"
};

// Firebase 초기화 (v8 호환 방식)
firebase.initializeApp(firebaseConfig);

// Realtime Database 참조
const database = firebase.database();