/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsappGreen: '#25D366', // WhatsApp green for buttons
        chatBg: '#ECE5DD', // WhatsApp chat background
        messageSent: '#DCF8C6', // Sent message bubble
        messageReceived: '#FFFFFF', // Received message bubble
      },
    },
  },
  plugins: [],
}