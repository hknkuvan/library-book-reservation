# Library Book Reservation System

Kullanıcıların kitap arayabildiği, görüntüleyebildiği ve rezerve edebildiği çevrimiçi kütüphane sistemi.

**Teknolojiler:** React + Vite (Frontend) | Node.js + Express (Backend) | SQLite (Database)

---

## 🚀 Kurulum (Setup)

### Gereksinimler (Prerequisites)

- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- [Git](https://git-scm.com/)

> **Not:** Veritabanı olarak SQLite kullanılmaktadır. Herhangi bir veritabanı kurulumu gerekmez!

---

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/KULLANICI_ADINIZ/library-book-reservation.git
cd library-book-reservation
```

---

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

#### Backend'i Başlatın

```bash
npm start
```

> Backend `http://localhost:5000` adresinde çalışacaktır.
> İlk çalıştırmada veritabanı otomatik oluşturulur ve admin kullanıcı seed edilir.

---

### 3. Frontend Kurulumu

Yeni bir terminal açın:

```bash
cd frontend
npm install
```

#### Frontend'i Başlatın

```bash
npm run dev
```

> Frontend `http://localhost:5173` adresinde çalışacaktır.

---

### 4. Uygulamayı Açın

Tarayıcınızda şu adresi açın: **http://localhost:5173**

---

## 🔑 Varsayılan Admin Hesabı

| Alan | Değer |
|------|-------|
| Email | `admin@library.com` |
| Şifre | `admin123` |

---

## 📋 Sprint 1/3 - Tamamlanan Özellikler (Security Epic)

| # | User Story | Durum |
|---|------------|-------|
| 1 | Administrator Login - Admin giriş ve dashboard yönlendirme | ✅ |
| 2 | Logout - Oturum kapatma ve session yok etme | ✅ |
| 3 | Create Account - Kullanıcı kayıt (validasyon ile) | ✅ |
| 4 | End User Login - Kullanıcı girişi ve hata mesajları | ✅ |
| 5 | Delete Account - Hesap silme (onay modal'ı ile) | ✅ |
| 6 | Edit Account - Profil düzenleme (isim, email, şifre, telefon) | ✅ |

---

## 🏗️ Proje Yapısı

```
library-book-reservation/
├── backend/                  # Node.js + Express API
│   ├── config/db.js          # SQLite bağlantısı
│   ├── controllers/          # İş mantığı
│   ├── middleware/            # Auth & validation
│   ├── models/                # Veritabanı modelleri
│   ├── routes/                # API route'ları
│   ├── utils/                 # DB başlatma & seed
│   └── server.js              # Uygulama giriş noktası
├── frontend/                 # React + Vite
│   └── src/
│       ├── components/        # Header, Modal, ProtectedRoute
│       ├── context/           # AuthContext (state yönetimi)
│       ├── pages/             # Login, Register, Home, Profile, AdminDashboard
│       └── index.css          # Tasarım sistemi
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/register` | Yeni hesap oluştur | ❌ |
| POST | `/api/auth/login` | Giriş yap | ❌ |
| POST | `/api/auth/logout` | Çıkış yap | ✅ |
| GET | `/api/auth/profile` | Profil bilgilerini getir | ✅ |
| PUT | `/api/auth/profile` | Profil güncelle | ✅ |
| DELETE | `/api/auth/profile` | Hesap sil | ✅ |

---

## 👥 Takım

**Product:** Library Book Reservation System  
**Sprint:** 1/3 - Security Epic

---

## 📝 Lisans

Bu proje eğitim amaçlıdır.
