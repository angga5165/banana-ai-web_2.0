import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client/+esm";

// ELEMENTS
const predictBtn = document.getElementById("predictBtn");
const resultDiv = document.getElementById("result");
const previewImg = document.getElementById("preview");
const clearBtn = document.getElementById("clearBtn");

// INPUT ELEMENTS
const imageInput = document.getElementById("imageInput");
const captureBtn = document.getElementById("captureBtn");
const videoFeed = document.getElementById("video-feed");
const cameraCanvas = document.getElementById("camera-canvas");

// TABS
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// STATE
let client;
let currentFile = null; // Bisa berupa File object atau Blob
let stream = null;

// --- INITIALIZATION ---
// Connect to Hugging Face
(async () => {
  predictBtn.disabled = true;
  predictBtn.innerText = "⏳ Menghubungkan ke Server...";

  try {
    client = await Client.connect("Yogssss/Projek-Akhir");
    predictBtn.disabled = false;
    predictBtn.innerText = "Prediksi";
    console.log("Terhubung ke Hugging Face Space!");
  } catch (error) {
    console.error("Gagal connect:", error);
    predictBtn.innerText = "❌ Gagal Terhubung";
    resultDiv.innerHTML = `<p style="color:red">Gagal terhubung. Refresh halaman.</p>`;
  }
})();

// --- TAB SWITCHING LOGIC ---
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active class from all
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => {
      c.classList.remove("active");
      c.style.display = ""; // Reset inline display from setPreview/clearBtn
    });

    // Add active to clicked
    btn.classList.add("active");
    const tabId = btn.getAttribute("data-tab");
    document.getElementById(`mode-${tabId}`).classList.add("active");

    // Handle Camera Tab
    if (tabId === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
  });
});

// --- CAMERA LOGIC ---
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoFeed.srcObject = stream;
  } catch (err) {
    console.error("Gagal akses kamera:", err);
    alert("Gagal membuka kamera. Pastikan izin diberikan.");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

captureBtn.addEventListener("click", () => {
  // Draw video frame to canvas
  const ctx = cameraCanvas.getContext("2d");
  cameraCanvas.width = videoFeed.videoWidth;
  cameraCanvas.height = videoFeed.videoHeight;
  ctx.drawImage(videoFeed, 0, 0);

  // Convert to Blob
  cameraCanvas.toBlob(blob => {
    setPreview(blob);
  }, "image/jpeg");
});

// --- UPLOAD LOGIC ---
imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    setPreview(imageInput.files[0]);
  }
});

// --- PASTE LOGIC ---
document.addEventListener("paste", (e) => {
  // Only handle paste if we are in paste tab
  const activeTab = document.querySelector(".tab-btn.active").getAttribute("data-tab");
  if (activeTab !== "paste") return;

  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  for (const item of items) {
    if (item.type.indexOf("image") !== -1) {
      const blob = item.getAsFile();
      setPreview(blob);
      break;
    }
  }
});

// --- COMMON PREVIEW LOGIC ---
function setPreview(fileOrBlob) {
  currentFile = fileOrBlob;
  previewImg.src = URL.createObjectURL(fileOrBlob);
  previewImg.style.display = "block";
  clearBtn.style.display = "block"; // Block helps with margin: auto centering

  // Hide Tabs & Input Areas
  const tabs = document.querySelector(".tabs");
  if (tabs) tabs.style.display = "none";

  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");

  // Auto scroll to preview
  previewImg.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

clearBtn.addEventListener("click", () => {
  currentFile = null;
  previewImg.src = "";
  previewImg.style.display = "none";
  clearBtn.style.display = "none";
  resultDiv.innerHTML = "";
  imageInput.value = "";

  // Show Tabs
  const tabs = document.querySelector(".tabs");
  if (tabs) tabs.style.display = "inline-flex";

  // Restore Active Input
  const activeBtn = document.querySelector(".tab-btn.active");
  if (activeBtn) {
    const tabId = activeBtn.getAttribute("data-tab");
    const activeContent = document.getElementById(`mode-${tabId}`);
    if (activeContent) activeContent.style.display = "block";
  }
});

// --- PREDICTION LOGIC ---
predictBtn.onclick = async () => {
  if (!currentFile) {
    alert("Pilih atau ambil gambar dulu!");
    return;
  }

  resultDiv.innerHTML = "⏳ Memproses...";

  try {
    const result = await client.predict("/classify_image", [
      currentFile
    ]);

    // PARSE HASIL & RENDER (Logic sebelumnya)
    const outputObject = result.data[1];
    const confidences = outputObject.confidences;

    let healthyScore = 0;
    let rottenScore = 0;

    confidences.forEach(item => {
      const lbl = item.label.toLowerCase();
      if (lbl.includes("healthy")) {
        healthyScore = item.confidence;
      } else if (lbl.includes("rotten")) {
        rottenScore = item.confidence;
      }
    });

    const isHealthy = healthyScore > rottenScore;
    const healthyPercent = (healthyScore * 100).toFixed(1);
    const rottenPercent = (rottenScore * 100).toFixed(1);

    let statusConfig = {
      className: isHealthy ? "verdict-safe" : "verdict-rotten",
      icon: isHealthy ? "✨" : "🦠",
      title: isHealthy ? "Pisang Sehat & Segar" : "Pisang Busuk / Tak Layak",
      desc: isHealthy
        ? "Aman dan bergizi untuk dikonsumsi anak-anak."
        : "Sebaiknya dibuang, berisiko bagi kesehatan."
    };

    // DATA DARI PPT

    const nutritionInfo = isHealthy
      ? `<strong>✅ Kualitas Standar MBG</strong>
           Mengandung Kalium tinggi & Vitamin B6. Sumber energi instan yang higienis untuk pertumbuhan anak.`
      : `<strong>⚠️ Bahaya Keamanan Pangan</strong>
           Potensi kontaminasi bakteri & jamur. Kualitas gizi menurun drastis. Tidak memenuhi syarat MBG.`;

    resultDiv.innerHTML = `
      <div class="result-card">


        <div class="main-verdict ${statusConfig.className}">
            <div class="icon">${statusConfig.icon}</div>
            <div class="text">
                <h3>${statusConfig.title}</h3>
                <p>${statusConfig.desc}</p>
            </div>
        </div>

        <div class="confidence-list">
            <h4>Analisis AI:</h4>
            <div class="confidence-item">
                <div class="bar-label">
                    <span>🍌 Pisang Sehat</span>
                    <span>${healthyPercent}%</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: ${healthyPercent}%; background-color: #10b981;"></div>
                </div>
            </div>
            <div class="confidence-item">
                 <div class="bar-label">
                    <span>🦠 Pisang Busuk</span>
                    <span>${rottenPercent}%</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: ${rottenPercent}%; background-color: #ef4444;"></div>
                </div>
            </div>
            
            <!-- Nutrition Info Box -->
            <div class="qc-info">
               ${nutritionInfo}
            </div>
        </div>
      </div>
    `;

  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = "❌ Gagal memproses gambar";
  }
};

// --- VIDEO TUTORIAL LOGIC ---
const videoOverlay = document.getElementById("videoOverlay");
const tutorialVideo = document.getElementById("tutorial-video");

if (videoOverlay && tutorialVideo) {
  videoOverlay.addEventListener("click", () => {
    videoOverlay.style.display = "none";
    tutorialVideo.play();
  });

  tutorialVideo.addEventListener("ended", () => {
    videoOverlay.style.display = "flex";
    tutorialVideo.currentTime = 0;
  });
}
