const { GoogleGenerativeAI } = require('@google/generative-ai');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Invalid Gemini response');
      }

      return text;

    } catch (error) {
      console.error(
        `Gemini API Error (attempt ${attempt}/${maxRetries}):`,
        error.message
      );

      // Retry only temporary server/rate-limit errors
      const isTemporaryError =
        error.message.includes('503') ||
        error.message.includes('429') ||
        error.message.includes('Service Unavailable') ||
        error.message.includes('high demand');

      if (!isTemporaryError || attempt === maxRetries) {
        throw error;
      }

      // 2s → 4s → 8s
      const delay = 2000 * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
};

module.exports = {
  callGemini,
};
