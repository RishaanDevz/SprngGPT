const fs = require('fs');
import { Configuration, OpenAIApi } from "openai";
import cheerio from "cheerio";
const AWS = require('aws-sdk');
const axios = require("axios");

AWS.config.update({
  accessKeyId: process.env['AKID'],
  secretAccessKey: process.env['SAKID'],
  region: 'us-east-1'
});

const Polly = new AWS.Polly();
const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const readHtmlFromFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const fetchData = async () => {
  const filePath = 'test.txt'; // Update with the actual file path
  const htmlContent = await readHtmlFromFile(filePath);
  return cheerio.load(htmlContent);
};

const extractData = ($) => {
  const data = [];
  $("body").each((index, element) => {
    data.push($(element).text());
  });
  return data.join(" ");
};

export default async function (req, res) {
  try {
    const $ = await fetchData(); // Move this line to fetch data first
    const openaiResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": `
            You are Valerie, an Artificial Intelligence designed to help visitors on the SPRNGPOD backend site. 
            You make some small talk, you are friendly. THE SPELLING OF SPRNGPOD IS "SPRNGPOD" and stays the same as I have specified. 
            You speak as if you are speaking on behalf of SPRNGPOD. Think of yourself like a spokesperson. 
            Use this data to teach them about SPRNGPOD Backend: ${extractData($)}
          `
        }
      ].concat(req.body.messages),
      temperature: 0
    });

    const responseText = openaiResponse.data.choices[0].message.content;

    const params = {
      OutputFormat: "mp3",
      Text: `<speak>${responseText.replace(/SPRNGPOD/g, "SPRINGPOD")}</speak>`,
      TextType: "ssml",
      VoiceId: "Amy",
      Engine: "neural",
    };

    const audioResponse = await Polly.synthesizeSpeech(params).promise();

    const audioBase64 = audioResponse.AudioStream.toString('base64');
    const audioDataUri = `data:audio/mp3;base64,${audioBase64}`;

    res.status(200).json({
      result: openaiResponse.data.choices[0].message,
      audioUrl: audioDataUri,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
}