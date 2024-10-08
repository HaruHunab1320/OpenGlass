import axios from "axios";
import { keys } from "../keys";
import fs from "fs";

export async function transcribeAudio(audioData: Blob) {
  const formData = new FormData();
  formData.append("file", audioData, "audio.wav");
  formData.append("model", "whisper-1");

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

// Helper function to convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  return audioContext;
}

let audioStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
const audioChunks: Blob[] = [];

export async function startAudio(onChunkRecorded: (chunk: Blob) => void) {
  try {
    audioContext = new AudioContext();
    console.log("Audio context initialized successfully");

    // Request microphone access
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone access granted");

    // Create a MediaRecorder instance with WebM/Opus encoding
    mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm;codecs=opus",
    });
    console.log("MediaRecorder created");

    // Set up event listeners
    mediaRecorder.ondataavailable = (event) => {
      const chunk = event.data;
      audioChunks.push(chunk);
      console.log(
        `Audio chunk received: ${chunk.size} bytes, type: ${chunk.type}`
      );
      onChunkRecorded(chunk); // Emit the chunk
    };

    mediaRecorder.onstart = () => {
      console.log("MediaRecorder started");
    };

    mediaRecorder.onstop = () => {
      console.log("MediaRecorder stopped");
      const audioBlob = new Blob(audioChunks, {
        type: "audio/webm;codecs=opus",
      });
      console.log(`Total audio size: ${audioBlob.size} bytes`);
    };

    // Start recording and emit chunks every 1 second
    mediaRecorder.start(1000);
    console.log("Audio recording started");
  } catch (error) {
    console.error("Error initializing audio:", error);
    throw error;
  }
}

export function stopAudio() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    console.log("Audio recording stopped");
  }
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
    console.log("Audio stream tracks stopped");
  }
  audioChunks.length = 0; // Clear the audio chunks
  console.log("Audio chunks cleared");
}

export async function textToSpeech(text: string) {
  try {
    console.log(`Sending text to speech: "${text}"`);
    const response = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        input: text, // Use 'input' instead of 'text'
        voice: "nova",
        model: "tts-1",
      },
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`, // Replace YOUR_API_KEY with your actual OpenAI API key
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // This will handle the binary data correctly
      }
    );
    console.log("Received audio response from OpenAI");

    const context = getAudioContext();

    // Decode the audio data asynchronously
    const audioBuffer = await context.decodeAudioData(response.data);
    console.log(
      `Decoded audio buffer: duration ${audioBuffer.duration} seconds`
    );

    // Create an audio source
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start(); // Play the audio immediately
    console.log("Started playing audio");

    return response.data;
  } catch (error) {
    console.error("Error in textToSpeech:", error);
    return null; // or handle error differently
  }
}

// Function to convert image to base64
function imageToBase64(path: string) {
  const image = fs.readFileSync(path, { encoding: "base64" });
  return `data:image/jpeg;base64,${image}`; // Adjust the MIME type if necessary (e.g., image/png)
}

export async function describeImage(imagePath: string) {
  const imageBase64 = imageToBase64(imagePath);
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/descriptions",
      {
        image: imageBase64,
      },
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`, // Replace YOUR_API_KEY with your actual OpenAI API key
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error in describeImage:", error);
    return null; // or handle error differently
  }
}

export async function gptRequest(systemPrompt: string, userPrompt: string) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`, // Replace YOUR_API_KEY with your actual OpenAI API key
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error in gptRequest:", error);
    return null; // or handle error differently
  }
}

textToSpeech("Hello I am an agent");
console.info(
  gptRequest(
    `
                You are a smart AI that need to read through description of a images and answer user's questions.

                This are the provided images:
                The image features a woman standing in an open space with a metal roof, possibly at a train station or another large building.
                She is wearing a hat and appears to be looking up towards the sky.
                The scene captures her attention as she gazes upwards, perhaps admiring something above her or simply enjoying the view from this elevated position.

                DO NOT mention the images, scenes or descriptions in your answer, just answer the question.
                DO NOT try to generalize or provide possible scenarios.
                ONLY use the information in the description of the images to answer the question.
                BE concise and specific.
            `,
    "where is the person?"
  )
);
