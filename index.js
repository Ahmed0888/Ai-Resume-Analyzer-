const express = require("express");
const fileUpload = require("express-fileupload");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const port = 3000;

app.use("/", express.static("public"));
app.use(fileUpload());
app.use(express.json());

// PDF Upload & Analyze Route
app.post("/upload", async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send({ success: false, message: "No file uploaded" });
    }

    try {
        // 1️⃣ Extract text from PDF
        const data = new Uint8Array(req.files.file.data);
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(i => i.str).join(" ") + "\n\n";
        }

        // 2️⃣ Send extracted text to Gemini API
        if (!process.env.GEMINI_KEY) {
            return res.status(500).send({ success: false, message: "GEMINI_KEY not set in env" });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

        const prompt = `
You are an AI resume expert.
Analyze the resume text below and return JSON with:
1. Resume Score (out of 100)
2. ATS Score
3. Match Percentage (with respect to the job description: ${req.body.jobDesc || "N/A"})
4. Missing Skills
5. Suggestions
6. Improved Resume Text

Resume:
${text}
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: prompt }]
        });

        const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No AI response";

        // 3️⃣ Send AI response to client
        res.send({ success: true, extractedText: text, aiAnalysis: aiText });

    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Error processing PDF or AI", details: err.message });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
