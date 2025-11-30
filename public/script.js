const btnUpload = document.getElementById("btnUpload");
const fileInput = document.getElementById("fileInput");
// const jobDesc = document.getElementById("jobDesc");
const jobDesc = document.getElementById("jobDesc");


const resultBox = document.getElementById("result");

// Loader
const loader = document.createElement("div");
loader.id = "loading";
loader.style.textAlign = "center";
loader.style.fontWeight = "bold";
loader.style.color = "#4f46e5";
loader.style.margin = "10px 0";
loader.innerText = "Analyzing Resume... Please wait...";
resultBox.parentNode.insertBefore(loader, resultBox);

btnUpload.addEventListener("click", async () => {
    if (!fileInput.files[0]) return alert("Please select a PDF file");
    
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("jobDesc", jobDesc.value || "");

    loader.style.display = "block";
    resultBox.innerHTML = "";

    try {
        const res = await fetch("/upload", { method: "POST", body: formData });
        const data = await res.json();

        loader.style.display = "none";

        if (!data.success) return alert("Error: " + data.message);

        let ai;
        try {
            // Sometimes AI sends JSON wrapped in text, so we extract JSON block
            // Regex code to find JSON object in the AI response
            const jsonMatch = data.aiAnalysis.match(/\{[\s\S]*\}/);
            ai = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
            ai = null;
        }

        if (ai) {
            resultBox.innerHTML = `
                <div class="card mb-3 p-3">
                    <h4>Extracted Resume Text</h4>
                    <pre style="white-space: pre-wrap;">${data.extractedText}</pre>
                </div>

                <div class="d-flex flex-wrap gap-3 mb-3">
                    <div class="card p-3 flex-grow-1" style="min-width: 200px;">
                        <h5>Resume Score</h5>
                        <p>${ai["Resume Score"] || "N/A"}/100</p>
                    </div>
                    <div class="card p-3 flex-grow-1" style="min-width: 200px;">
                        <h5>ATS Score</h5>
                        <p>${ai["ATS Score"] || "N/A"}</p>
                    </div>
                    <div class="card p-3 flex-grow-1" style="min-width: 200px;">
                        <h5>Match Percentage</h5>
                        <p>${ai["Match Percentage"] || "N/A"}%</p>
                    </div>
                </div>

                <div class="card mb-3 p-3">
                    <h5>Missing Skills</h5>
                    <ul>${(ai["Missing Skills"] || []).map(skill => `<li>${skill}</li>`).join("")}</ul>
                </div>

                <div class="card mb-3 p-3">
                    <h5>Suggestions</h5>
                    <ul>${(ai["Suggestions"] || []).map(s => `<li>${s}</li>`).join("")}</ul>
                </div>

                <div class="card mb-3 p-3">
                    <h5>Improved Resume</h5>
                    <pre style="white-space: pre-wrap;">${ai["Improved Resume Text"] || ""}</pre>
                </div>
            `;
        } else {
            // fallback: show raw AI text
            resultBox.innerHTML = `
                <div class="card p-3 mb-3">
                    <h4>Extracted Resume Text</h4>
                    <pre style="white-space: pre-wrap;">${data.extractedText}</pre>
                </div>
                <div class="card p-3">
                    <h4>AI Analysis (Raw Text)</h4>
                    <pre style="white-space: pre-wrap;">${data.aiAnalysis}</pre>
                </div>
            `;
        }

    } catch (err) {
        loader.style.display = "none";
        console.error(err);
        alert("Error analyzing resume. Check console for details.");
    }
});
