![презентация](https://github.com/user-attachments/assets/e05d1001-a1d5-442e-b407-1fdfb913f814)

## 📌 Project Description
**tg-scheduler** is the client-side (frontend) of a Telegram Mini App for managing specialists’ schedules and client bookings.  
The app is built with **React + Vite**, uses **Mantine UI**, and integrates with **Telegram Web Apps**.  

### Key Features:
- 👤 Two roles: *Specialist* and *Client*  
- 📅 Schedule management: create, edit, and delete slots  
- ✅ Approve or cancel requests, view archive  
- 👨‍💻 Specialist profile (name, description, contacts, location, photo)  
- 🔗 Generate link `https://t.me/{BOT_NAME}?startapp=specialist-{telegramId}` + QR code  
- 🖼 Generate schedule images for social media  
- 🤖 Deep integration with Telegram WebApp API (BackButton, themes, expand, etc.)  

---

![А3 Интерфейс программного средства  Плакат](https://github.com/user-attachments/assets/09f4b0ad-ca94-4fa0-8b8d-c9dddd6c2a7b)


---

## 🧰 Tech Stack
- **React 19**  
- **Vite 6**  
- **Mantine 7** (`@mantine/core`, `@mantine/dates`, `@mantine/hooks`)  
- **React Router 7**  
- **dayjs** (date/time handling)  
- **@tabler/icons-react** (icons)  
- **qrcode.react** (QR codes)  
- **query-string** (query parameter handling)  

---

## 📂 Project Structure
```

src/
│   App.jsx
│   AppRouter.jsx
│   Navbar.jsx
│   main.jsx
│   index.css
├── Pages/
│   ├── HomePage.jsx
│   ├── ArchivePage.jsx
│   ├── RoleSelectionPage.jsx
│   ├── Client/
│   │   BookAppointmentPage.jsx
│   └── Specialist/
│       SchedulePage.jsx
│       ProfilePage.jsx
│       ProfileLinkPage.jsx
│       SubscriptionPage.jsx
│       GenerateImagePage.jsx
└── assets/

````

📌 Main routes:  
- `/` — home page  
- `/change-role` — role selection  
- `/book-appointment` — client booking  
- `/archive` — archive of bookings  
- `/profile/:telegramId` — specialist profile  
- `/schedule/:telegramId` — specialist schedule  
- `/subscription` — subscription status  
- `/profile-link` — specialist link and QR code  
- `/generate-image` — generate schedule image  

---

## ⚙️ Installation & Running

### 1. Requirements
- **Node.js ≥ 18**  
- **npm ≥ 9**

### 2. Install dependencies
```bash
npm install
````

### 3. Environment Variables

Create a `.env.local` file in the project root:

```env
# Base API URL
VITE_API_BASE_URL=https://your-api.example.com

# Telegram bot name (as in BotFather)
VITE_TG_BOT_NAME=your_bot_name
```

### 4. Run in development mode

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build the project

```bash
npm run build
npm run preview
```

---

## 🚀 Telegram Integration

1. Configure WebApp in **BotFather**, specifying the deployment URL (e.g., on Vercel/Netlify).
2. The bot name must match `VITE_TG_BOT_NAME`.
3. Client/Specialist link:

   ```
   https://t.me/{BOT_NAME}?startapp=specialist-{telegramId}
   ```

   You can copy it from the **Profile Link** section along with the QR code.

