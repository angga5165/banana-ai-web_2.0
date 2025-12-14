async function predict() {
  const input = document.getElementById("imageInput");
  const resultDiv = document.getElementById("result");

  if (!input.files.length) {
    alert("Upload gambar dulu!");
    return;
  }

  resultDiv.innerHTML = "⏳ Memproses...";

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = async () => {
    const base64Image = reader.result.split(",")[1];

    try {
      const response = await fetch(
        "https://yogssss-projek-akhir.hf.space/run/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            data: [
              `data:image/jpeg;base64,${base64Image}`
            ]
          })
        }
      );

      const data = await response.json();

      // Gradio output → data.data
      const predictionText = data.data[0];
      const confidence = data.data[1];

      resultDiv.innerHTML = `
        <h3>✅ Hasil Prediksi</h3>
        <p><b>${predictionText}</b></p>
        <pre>${JSON.stringify(confidence, null, 2)}</pre>
      `;
    } catch (error) {
      console.error(error);
      resultDiv.innerHTML = "❌ Gagal memproses gambar";
    }
  };

  reader.readAsDataURL(file);
}
