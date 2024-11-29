import express from "express";
import { rateLimit } from "express-rate-limit";
import { body, validationResult } from "express-validator";
import nodemailer from "nodemailer";
import cors from "cors";
import "dotenv/config";

const app = express();

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  message: { error: "You can only submit one contact request per day." },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters.")
    .escape(),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format.")
    .normalizeEmail()
    .isLength({ min: 3, max: 320 }),
  body("message")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be between 10 and 1000 characters.")
    .escape(),
];

const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] Request from ${req.ip} to ${req.url}, method: ${req.method}`
  );
  next();
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: "Endpoint not found." });
};

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  res.status(500).json({ error: "Internal Server Error." });
};

app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV !== "development"
        ? process.env.CLIENT_URL
        : `http://localhost:${process.env.CLIENT_PORT}`,
  })
);
app.use(requestLogger);
app.use(limiter);

app.post("/contact", contactValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, message } = req.body;

  console.log(`[${new Date().toISOString()}] Contact form submitted:`, {
    name,
    email,
    message,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          padding: 20px;
        }
        h1 {
          color: #444;
          font-size: 1.5rem;
          margin-bottom: 20px;
        }
        p {
          margin: 10px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 0.9rem;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>New Contact Request</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <div class="footer">
          <p>Sent on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `New Contact Request from ${name}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `[${new Date().toISOString()}] Email sent to ${
        process.env.RECIPIENT_EMAIL
      }`
    );
    res.json({ message: "Message received! We'll get back to you soon." });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Email error:`, error);
    res
      .status(500)
      .json({ error: "Failed to send message. Please try again later." });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(
    `[${new Date().toISOString()}] Server running on ${
      process.env.NODE_ENV === "development"
        ? `http://localhost:${port}`
        : `port ${port}`
    }`
  );
});
