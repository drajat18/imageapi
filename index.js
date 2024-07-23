const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const cors = require("cors"); // Import the cors middleware

dotenv.config();

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const app = express();
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // Set a file size limit of 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Enable CORS for all routes
app.use(cors());

// Converts image data to a GoogleGenerativeAI.Part object.
function imageToGenerativePart(imageData, mimeType) {
  return {
    inlineData: {
      data: imageData.toString("base64"),
      mimeType,
    },
  };
}

// API endpoint to receive image data
app.post("/extract-data", upload.single("image"), async (req, res) => {
  try {
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const prompt =
      "extract data in the image and send it to the Gemini API for organization in json format remove any \n or \ in the json, have the products related data in one object and rest of the data in another other object. add the total amount from the products object and send it in amount object";

    const imageParts = [
      imageToGenerativePart(req.file.buffer, req.file.mimetype),
    ];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    res.json({ data: text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
