
import { GoogleGenerativeAI, Type, Modality } from "@google/generativeai";
import { WordData } from "../types";

// 가이드라인에 따라 process.env.API_KEY를 직접 사용합니다.
const ai = new GoogleGenerativeAI({ apiKey: "AIzaSyCIji11MtIuQ9ioEdmp3dGzQCclzmALBZI" });

export const lookupWord = async (word: string): Promise<WordData> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the English word "${word}" for elementary/middle school students. Provide its phonetic transcription, Korean meaning, English definition, a simple example sentence with its Korean translation, synonyms, antonyms, and its difficulty level.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          meaning_kr: { type: Type.STRING },
          meaning_en: { type: Type.STRING },
          example_en: { type: Type.STRING },
          example_kr: { type: Type.STRING },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          level: { type: Type.STRING, description: 'Beginner, Intermediate, or Advanced' }
        },
        required: ["word", "phonetic", "meaning_kr", "meaning_en", "example_en", "example_kr", "level"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const generateDailyWord = async (): Promise<WordData> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Pick a random, useful, and common English word for kids (level: Beginner or Intermediate) and provide full details in JSON.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          meaning_kr: { type: Type.STRING },
          meaning_en: { type: Type.STRING },
          example_en: { type: Type.STRING },
          example_kr: { type: Type.STRING },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          level: { type: Type.STRING }
        },
        required: ["word", "phonetic", "meaning_kr", "meaning_en", "example_en", "example_kr", "level"]
      }
    }
  });
  return JSON.parse(response.text.trim());
};

// TTS Helper functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playPronunciation = async (word: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly and slowly for kids: ${word}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error("TTS Error:", error);
  }
};
