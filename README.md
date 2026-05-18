# Chess Pro - Online Multiplayer with Native OPay Staking 🇳🇬 ♟️

Chess Pro is a lightweight, high-performance real-time multiplayer chess application tailored for mobile-first web browsers. It features standard player-versus-computer matching alongside an online room matchmaking infrastructure that integrates peer-to-peer match staking using **OPay Checkout and Disbursement APIs** for the Nigerian market.

🔗 **Live Link:** [https://chess-s7d8.onrender.com/](https://chess-s7d8.onrender.com/)

---

## 🚀 Features

- **Real-Time Multiplayer:** Built over WebSocket layers using Socket.io for instantaneous, low-latency move streaming.
- **Local AI Match:** Play offline or practice moves against a simulated headless processing chess bot.
- **Customizable Assets:** In-game visual customization panel allowing players to modify color profiles dynamically.
- **Native OPay Staking Engine:**
  - **Secure Deposit Invoices:** Automatically initializes an active merchant link using OPay checkout when a staked room is established.
  - **Instant Automated Payouts:** Automatically routes the accumulated prize pool straight to the winner's 10-digit OPay wallet number upon a verified checkmate.
- **Anti-Cache Delivery:** Configured backend caching filters to force immediate UI assets update distribution on remote deployment.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 Variables, JavaScript ES6 (Custom Canvas-free DOM Board engine)
- **Backend:** Node.js, Express.js
- **Real-Time Layer:** Socket.io
- **HTTP Gateway Client:** Axios (for secure communication with OPay Checkout servers)

---

## ⚙️ Installation & Local Setup

To run this repository locally on your machine or inside **Termux** on Android:

### 1. Clone the repository
```bash
git clone [https://github.com/trackbeatz/chess.git](https://github.com/trackbeatz/chess.git)
cd chess
