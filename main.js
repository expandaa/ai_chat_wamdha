const typing_input = document.querySelector(".typing_input");
const form = document.querySelector(".typing-form");
const chat_list = document.querySelector(".chat_list");


const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const genrateAPIResponse = async (div, usermessage) => {
  const textElement = div.querySelector(".text");
  const loadingElement = div.querySelector(".loading");

  try {
    const apiMessage =
      usermessage.toLowerCase().includes("send me websites") ||
      usermessage.toLowerCase().includes("give me sites")
        ? usermessage + " Please include relevant websites in your response."
        : usermessage;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: apiMessage,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    loadingElement.style.display = "none";
    textElement.style.display = "block";

    let formattedText = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");

    const links = formattedText.match(/(https?:\/\/[^\s]+)/g) || [];

    if (links.length > 0) {
      formattedText = formattedText.replace(/(https?:\/\/[^\s]+)/g, "");
    }

    formattedText = formattedText.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, language, code) => {
        return createCodeCard(language, code);
      }
    );

    if (links.length > 0) {
      formattedText +=
        '<div class="sources"><strong>المواقع المقترحة:</strong>';
      links.forEach((link, index) => {
        formattedText += `<a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>`;
      });
      formattedText += "</div>";
    }

    textElement.innerHTML = formattedText;
    div.style.opacity = "0";
    div.style.transform = "translateY(20px)";
    setTimeout(() => {
      div.style.opacity = "1";
      div.style.transform = "translateY(0)";
    }, 100);
    scrollToBottom();
  } catch (err) {
    console.error(err);
    loadingElement.style.display = "none";
    textElement.style.display = "block";
    textElement.innerText =
      "Sorry, an error occurred while generating the response.";
  }
};

function createCodeCard(language, code) {
  return `
    <div class="card">
      <div class="tools">
        <div class="circle">
          <span class="red box"></span>
        </div>
        <div class="circle">
          <span class="yellow box"></span>
        </div>
        <div class="circle">
          <span class="green box"></span>
        </div>
      </div>
      <div class="card__content">
        <pre><code class="language-${language || ""}">${escapeHtml(
    code.trim()
  )}</code></pre>
      </div>
    </div>
  `;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scrollToBottom() {
  const chatList = document.querySelector(".chat_list");
  chatList.scrollTo({
    top: chatList.scrollHeight,
    behavior: "smooth",
  });
}

function copyText(element) {
  const text = element.closest(".message").querySelector(".text").innerText;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalIcon = element.textContent;
      element.textContent = "check";
      element.style.color = "#4CAF50";

      setTimeout(() => {
        element.textContent = originalIcon;
        element.style.color = "";
      }, 1000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}

function showConfetti(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left / window.innerWidth;
  const y = rect.top / window.innerHeight;

  confetti({
    particleCount: 30,
    spread: 20,
    origin: { x, y },
    colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
    ticks: 100,
    scalar: 0.5,
    shapes: ["circle"],
    zIndex: 1000,
  });

  setTimeout(() => {
    confetti.reset();
  }, 1000);
}

chat_list.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("material-symbols-outlined") &&
    e.target.textContent === "copy_all"
  ) {
    copyText(e.target);
  }
});

const showloading = (usermessage) => {
  const html = `
        <div class="message_content">
            <img src="./bot.svg" alt="">
            <p class="text" style="display: none;"></p>
            <div class="loading">
                <div class="loading_bar"></div>
                <div class="loading_bar"></div>
                <div class="loading_bar"></div>
            </div>
        </div>
        <span class="material-symbols-outlined" onclick="copyText(this)">
            copy_all
        </span>
    `;

  const div = document.createElement("div");
  div.classList.add("message", "incoming");
  div.innerHTML = html;

  chat_list.appendChild(div);

  setTimeout(() => genrateAPIResponse(div, usermessage), 300);
};

const handleOutGoingChat = () => {
  hideWelcomeMessage();
  const usermessage = typing_input.value.trim();

  if (!usermessage) return;

  const html = `
    <div class="message outgoing">
      <div class="message_content">
        <img src="./user.jpg" alt="">
        <p class="text"></p>
      </div>
    </div>
  `;

  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelector(".text").innerText = usermessage;
  chat_list.appendChild(div);
  form.reset();

  div.style.opacity = "0";
  div.style.transform = "translateY(20px)";
  setTimeout(() => {
    div.style.opacity = "1";
    div.style.transform = "translateY(0)";
    scrollToBottom();
    showloading(usermessage);
  }, 300);

  typing_input.value = "";
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutGoingChat();
});

function showCustomAlert(message, element) {
  const alertElement = document.createElement("div");
  alertElement.className = "custom-alert";
  alertElement.textContent = message;

  const rect = element.getBoundingClientRect();
  alertElement.style.position = "absolute";
  alertElement.style.left = `${rect.left}px`;
  alertElement.style.top = `${rect.bottom + 5}px`;

  document.body.appendChild(alertElement);

  setTimeout(() => alertElement.classList.add("show"), 10);

  setTimeout(() => {
    alertElement.classList.remove("show");
    setTimeout(() => alertElement.remove(), 300);
  }, 1000);
}

function typeWelcomeMessage() {
  const welcomeText = "Hello sir, I'm Wamdha. How can I assist you?";
  const textElement = document.querySelector("#welcome-message .text");
  let index = 0;

  function typeNextChar() {
    if (index < welcomeText.length) {
      textElement.textContent += welcomeText.charAt(index);
      index++;
      setTimeout(typeNextChar, 50);
    }
  }

  typeNextChar();
}

document.addEventListener("DOMContentLoaded", typeWelcomeMessage);

function hideWelcomeMessage() {
  const welcomeMessage = document.getElementById("welcome-message");
  if (welcomeMessage) {
    welcomeMessage.style.display = "none";
  }
}
