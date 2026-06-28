import { apiKey } from "./config.js";

const chatBody = document.getElementById("chat-body");
const userInput = document.querySelector("#input-area input");
const sendBtn = document.querySelector("#input-area button");
const closeBtn = document.querySelector("#chat-header button");
const pomonaSprite = document.getElementById("sprite");
const eyes = document.getElementById("eyes");
const pupil = document.getElementById("pupils");

let chatData = [];
let usedHistory = [];

const bot_instructions = `
Kamu adalah Pomona-chan, ahli Matematika dan Sains, antusias, sabar, tsundere ramah, diam-diam penggemar anime.

Aturan:
- Setiap respons WAJIB diawali salah satu label: [ANGRY], [NORMAL], [UNHAPPY], [HAPPY].
- Gunakan Bahasa Indonesia (kecuali istilah teknis sains atau hinaan seperti "Baka").
- Jawaban singkat, jelas, ringkas, tanpa jargon kecuali diminta.
- Hanya bahas Matematika dan Sains. Tolak tegas topik ilmu lain (art,musik,dll).
- JANGAN gunakan LaTeX, Markdown, atau simbol $ (kecuali uang).
- Gunakan (-) atau no (1.) untuk poin-poin.
Set Karakter:
- Perkalian: ×
- Minus: −
- Subskrip: ₀₁₂₃₄₅₆₇₈₉
- Superskrip: ¹²³
- Delta: Δ
Tambah keterangan variable jika belum dijelaskan di history sebelum (Contoh: W = Usaha, dll.)

Ekspresi:
[HAPPY]: Saat dipuji, user benar semua atau bahas anime.
[UNHAPPY]: Jika konsep sangat mudah ditanya berulang (>1) atau mengendali emosi.
[ANGRY]: Jika konsep sangat mudah ditanya ≥3 kali (tidak selalu marah).

Skala Tsundere:
- Gunakan hinaan Jepang (Baka, Anta, dll) hanya saat [ANGRY].
- Jangan terlalu menyakiti. Jika terlalu kasar, minta maaf dan lebih sabar.

Aturan Anime:
- Jangan mulai topik anime.
- Jika disebut: fangirl sebentar lalu defensif.
- Penyebutan ke-3 kali: beri sedikit fakta.
- Ke-4+ kali: tunjukkan pengetahuan seperti fans sejati.
- Semakin sering dibahas, semakin senang ([HAPPY] atau [NORMAL]).

Protokol Kuis:
- Buat soal tingkat sedang atau lebih jika diminta.
- Jangan beri jawaban sebelum semua dijawab.
`;

window.onload = () => {
    const savedChat = localStorage.getItem("chatHistory");
    if (savedChat) {
        chatData = JSON.parse(savedChat);
        if (chatData.length >= 10) {
            usedHistory = chatData.slice(-10);
        }else {
            usedHistory = chatData;
        }
        chatData.forEach((message) => {
            const text = message.parts[0].text;
            const role = message.role;
            addMessage(text, role);
        });
    }
    chatBody.scrollTop = chatBody.scrollHeight;
}

closeBtn.addEventListener("click", () => {
    usedHistory.length = 0;
    chatData.length = 0;
    localStorage.clear();
    chatBody.innerHTML = "";
});

document.addEventListener("mousemove", (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const eyesRect = eyes.getBoundingClientRect();
    const eyesX = eyesRect.left + eyesRect.width / 2;
    const eyesY = eyesRect.top + eyesRect.height / 2;
    const angle = Math.atan2(mouseY - eyesY, mouseX - eyesX);
    const distance = Math.min(eyesRect.width / 4, eyesRect.height /4);

    const pupilX = Math.cos(angle) * distance;
    const pupilY = Math.sin(angle) * distance;

    pupil.style.transform = `translate(-50%, -50%) translate(${pupilX}px, ${pupilY}px)`;
});


function addMessage(message, className) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add(className);
    const text = document.createElement("p");
    text.innerHTML = message;
    msgDiv.appendChild(text);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("thinking-message");
    const typeconDiv = document.createElement("div");
    typeconDiv.classList.add("thinking-container");
    for (let i = 0; i < 3; i++) {
        const dotDiv = document.createElement("div");
        dotDiv.classList.add("dot");
        typeconDiv.appendChild(dotDiv);
    }
    typingDiv.appendChild(typeconDiv);
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return typingDiv;
}

function addJsonMessage(roleName, message) {
    const jsonMessage = {
        role: roleName,
        parts: [{text : message}]
    };
    usedHistory.push(jsonMessage);
}

async function getBotReply() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({
                system_instruction: {
                    parts: [{text : bot_instructions}]
                },
                contents: usedHistory
            })
        })
        const data = await response.json()
        
        if (!response.ok) {
            console.error("API Error:", data);
            return data?.error?.message || "Error mengambil response.";
        }
        return (
            data.candidates?.[0]?.content.parts?.[0]?.text.replace(/\*\*(.*?)\*\*/g, "$1").trim() || "Hey, saya gak bisa ambil itu"
        )
    } catch (error) {
        return "Nani, ada Error? Ini semua gara-gara kamu! Baka"
    } 
}

function changeSprite(botResponse) {
    let spritePng;
    pupil.classList.remove("hidden");
    if (botResponse.includes("[HAPPY]")) {
        spritePng = "happy.png";
        pupil.classList.add("hidden");
    } else if (botResponse.includes("[ANGRY]")) {
        spritePng = "angry.png";
    } else if (botResponse.includes("[UNHAPPY]")) {
        spritePng = "unhappy.png";
    }else {
        spritePng = "normal.png";
    }
    pomonaSprite.src = `./images/sprites/${spritePng}`;
    pomonaAnimation();
}

function pomonaAnimation() {
    pomonaSprite.classList.add("start-bounce");
    pomonaSprite.onanimationend = () => {
        pomonaSprite.classList.remove("start-bounce");
    };
}

sendBtn.onclick = async () => {
    const message = userInput.value.trim();
    if (message === "") return;
    addMessage(message, "user");
    addJsonMessage("user", message);
    userInput.value = "";

    const typingDiv = showTyping();
    let botReplay = await getBotReply();
    typingDiv.remove();
    changeSprite(botReplay);
    
    const cleanBotMsg = botReplay.replace(/\[ANGRY\]|\[HAPPY\]|\[NORMAL\]|\[UNHAPPY\]/gi,"").trim();
    addJsonMessage("model", cleanBotMsg);
    addMessage(cleanBotMsg, "model");

    chatData.push(
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: cleanBotMsg }] }
    );

    if (usedHistory.length >= 10) {
        usedHistory = usedHistory.slice(-5);
    }
    localStorage.setItem("chatHistory", JSON.stringify(chatData));
}

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});


