import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini SDK with User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to extract clean JSON from LLM responses even if wrapped in markdown
function extractJsonFromText(rawText: string): any {
  if (!rawText) return {};
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e2) {}
    }
    return {};
  }
}

// Resilient Multimodal Vision Model Cascade with automatic fallback and fast retry
async function generateMultimodalVisionWithCascade(
  aiClient: GoogleGenAI,
  mimeType: string,
  base64Data: string,
  promptText: string
): Promise<{ text: string; modelName: string }> {
  // Ultra-available and fast candidates
  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
        });

        if (response && response.text) {
          return { text: response.text, modelName: model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`Vision model [${model}] attempt ${attempt + 1} issue:`, msg.slice(0, 120));
        if (msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED')) {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
        }
        break; // Advance to next model in cascade
      }
    }
  }

  throw lastError || new Error('Vision services are busy. Please tap Retry.');
}

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    gemini_vision_active: Boolean(ai),
    model_name: ai ? 'Gemini Flash-Lite Cascade (High-Precision Vision & OCR)' : 'Local Fallback Active',
    detector_ready: true,
    ocr_ready: true,
    supported_classes_count: 'Universal Open-Vocabulary (Doors, Windows, Fans, Gestures, Phones, Glasses & Campus Items)',
    version: '3.2.0-resilient',
  });
});

// Helper to determine natural human directional cues
function estimateNaturalDirection(xmin: number, xmax: number, ymin: number, ymax: number, invertLR: boolean = false) {
  let cx = (xmin + xmax) / 2;
  if (invertLR) {
    cx = 1000 - cx;
  }
  const cy = (ymin + ymax) / 2;

  let side = 'in the center';
  if (cx < 380) {
    side = cx < 180 ? 'to your far left side' : 'on your left side';
  } else if (cx > 620) {
    side = cx > 820 ? 'to your far right side' : 'on your right side';
  }

  let elevation = 'at eye level';
  if (cy < 280) {
    elevation = 'up near the ceiling';
  } else if (cy > 720) {
    elevation = 'down near the floor';
  } else if (cy > 520) {
    elevation = 'at waist level';
  }

  const area = ((xmax - xmin) * (ymax - ymin)) / 10000;
  let prominence: 'foreground' | 'midground' | 'background' = 'midground';
  if (area > 20) prominence = 'foreground';
  else if (area < 5) prominence = 'background';

  return { side, elevation, prominence };
}

// Vision Analysis Endpoint (Ultra High Accuracy with Architectural Detection & Activity Understanding)
app.post('/api/analyze-vision', async (req, res) => {
  const startTime = Date.now();
  try {
    const { image, requestedObject, confidence = 0.20, imgWidth = 640, imgHeight = 480, invertLeftRight = false } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini Vision API key is not configured on the server. Please check GEMINI_API_KEY.',
      });
    }

    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.includes(',')) {
      const parts = image.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    const targetThreshold = typeof confidence === 'number' && !isNaN(confidence)
      ? Math.max(0.08, Math.min(0.95, confidence))
      : 0.20;

    const targetFocus = requestedObject
      ? `\nSPECIAL TARGET SEARCH: The user is specifically looking for "${requestedObject}".
COMPREHENSIVE SYNONYM AND CATEGORY RESOLUTION:
- If looking for "cellphone", "mobile phone", "phone", "mobile", "smartphone", "cell phone", "iphone", "android", or "handphone": Return it under label "cell phone" or "mobile phone". Also check if any person is holding, carrying, or interacting with a phone/smartphone.
- If looking for "glasses", "spectacles", "specs", "reading glasses", "sunglasses", "eyewear": Return it accurately (whether on a face or lying on a desk/table).
- If looking for "door", "handle", "latch": Return closed/open doors, door frames, door handles, and door latches.
- If looking for "window": Return windows, grills, glass panes, curtains, or blinds.
- If looking for "fan": Return ceiling fans, table fans, or exhaust fans.
- If looking for "bottle": Return water bottles, flasks, tumblers, or thermos.
- If looking for "cup": Return mugs, tea cups, coffee cups, or tumblers.
- If looking for "table" or "desk": Return study desks, dining tables, or workbenches.
- If looking for "cookie packet", "snack packet", "biscuit packet": Return any food packets or snack wrappers.

DETECTION SENSITIVITY AND HONEST CONFIDENCE:
The user has requested detection sensitivity threshold at ${targetThreshold}.
Return ALL candidate matches with confidence >= ${Math.max(0.08, targetThreshold - 0.05)}.
Do NOT silently drop small, handheld, partially occluded, or distant objects. Provide an honest, uninflated confidence score between 0.10 and 1.0 for every detected item.\n`
      : `\nDETECTION SENSITIVITY: Return all clearly visible or candidate objects with honest confidence >= ${targetThreshold}.\n`;

    const mirrorNotice = invertLeftRight
      ? `\nCRITICAL SPATIAL PERSPECTIVE NOTICE (LAPTOP WEBCAM / MIRROR PERSPECTIVE ACTIVE):
The user is viewing through a front-facing laptop camera where left and right in the captured image are reversed from the user's real-world point of view.
INVERT ALL LEFT AND RIGHT DIRECTIONS in navigation_guidance, scene_description, and side_direction:
- What appears on the LEFT of this photo is on the user's physical RIGHT! Report it as "on your right side" or "to your far right".
- What appears on the RIGHT of this photo is on the user's physical LEFT! Report it as "on your left side" or "to your far left".\n`
      : '';

    const promptText = `
You are the primary computer vision and accessibility intelligence engine for EverydayEyes AI (OmniLens), an assistive visual system for blind and low-vision individuals.
Analyze this camera image with maximum accuracy, exhaustiveness, and honest visual clarity.${targetFocus}${mirrorNotice}

MANDATORY OBJECT DETECTION CATEGORIES:
1. HELD ITEMS, PERSONAL ACCESSORIES & DEVICES:
   - Smartphones, mobile phones, cell phones (e.g. held upright in hand facing camera or on desk).
   - Eyeglasses, spectacles, sunglasses, eyewear worn on person's face.
   - Bottles, cups, food/cookie/snack packets (read any visible brand text), pens, notebooks.
2. PEOPLE & VISIBLE HUMAN ACTIONS (CRITICAL):
   - For every person: detect one tight enclosing bounding box ('person').
   - Identify what they are wearing (e.g. eyeglasses, clothing style and color) and doing (e.g. "looking into camera while holding a black smartphone upright in front of them", "sitting in room").
   - Position: "on your left side", "in the center", "on your right side".
3. ROOM FIXTURES & ARCHITECTURAL ELEMENTS:
   - Ceiling fans, table fans (overhead or on desk).
   - Ceiling lights, tube lights, illuminated bulbs, ceiling glare / lighting fixtures.
   - Doors (state: open or closed, latch, frame, handle).
   - Windows (glass, metal grills/bars, curtains).
   - Furniture (study desk, chair, bed, shelves, walls, switchboards).

4. ACCESSIBLE DIRECTION CONVENTIONS FOR BLIND USERS:
   - NO clock directions (never use "12 o'clock", "3 o'clock").
   - ONLY natural directions: "on your left side", "in the center", "on your right side", "to your far left", "to your far right".
   - Vertical cues: "up near the ceiling", "at eye level", "at waist level", "down near the floor".

Return valid JSON with this exact structure:
{
  "detections": [
    {
      "label": "string",
      "activity_or_details": "string describing what it is or what the person is doing",
      "box_2d": [ymin, xmin, ymax, xmax],
      "confidence": 0.95,
      "side_direction": "on your left side" | "in the center" | "on your right side",
      "vertical_position": "up near the ceiling" | "at eye level" | "at waist level" | "down near the floor",
      "prominence": "foreground" | "midground" | "background"
    }
  ],
  "human_activities": "Rich, detailed sentence explaining exactly what every person in the view is doing, their gestures, clothing, and items held.",
  "navigation_guidance": "Clear, helpful description for a blind user summarizing the surroundings: what is in the center, on the left, on the right, and overhead.",
  "scene_description": "Natural summary of the room, lighting, architecture, person, and visible objects.",
  "visible_text": "Any readable text or brand labels seen in the image, or empty string.",
  "lighting_level": "Bright & Clear" | "Moderate Light" | "Dim / Low Light",
  "lighting_advice": "Practical suggestion (e.g. 'Bright indoor lighting with slight overhead ceiling light glare.')"
}
Ensure box_2d coordinates are tightly bound [0-1000].
`;

    const { text: responseText, modelName } = await generateMultimodalVisionWithCascade(
      ai,
      mimeType,
      base64Data,
      promptText
    );

    const parsed = extractJsonFromText(responseText);
    const rawDets = Array.isArray(parsed.detections) ? parsed.detections : [];
    
    // NMS Deduplication: Remove overlapping duplicate boxes with same label
    const filteredRaw: any[] = [];
    for (const d of rawDets) {
      const [ymin, xmin, ymax, xmax] = d.box_2d || [0, 0, 1000, 1000];
      const area = Math.max(1, (xmax - xmin) * (ymax - ymin));
      let isDuplicate = false;

      for (const existing of filteredRaw) {
        if (existing.label?.toLowerCase() === d.label?.toLowerCase()) {
          const [eymin, exmin, eymax, exmax] = existing.box_2d || [0, 0, 1000, 1000];
          const ix = Math.max(0, Math.min(xmax, exmax) - Math.max(xmin, exmin));
          const iy = Math.max(0, Math.min(ymax, eymax) - Math.max(ymin, eymin));
          const interArea = ix * iy;
          const unionArea = area + Math.max(1, (exmax - exmin) * (eymax - eymin)) - interArea;
          if (interArea / unionArea > 0.45) {
            isDuplicate = true;
            break;
          }
        }
      }
      if (!isDuplicate) {
        filteredRaw.push(d);
      }
    }

    const detections = filteredRaw.map((det: any, idx: number) => {
      const [ymin, xmin, ymax, xmax] = det.box_2d || [0, 0, 1000, 1000];
      const x = Math.max(0, Math.round((xmin / 1000) * imgWidth));
      const y = Math.max(0, Math.round((ymin / 1000) * imgHeight));
      const width = Math.max(10, Math.round(((xmax - xmin) / 1000) * imgWidth));
      const height = Math.max(10, Math.round(((ymax - ymin) / 1000) * imgHeight));

      const naturalInfo = estimateNaturalDirection(xmin, xmax, ymin, ymax, invertLeftRight);
      const sideDirection = det.side_direction || naturalInfo.side;
      const verticalPosition = det.vertical_position || naturalInfo.elevation;
      const prominence = det.prominence || naturalInfo.prominence;

      const rawCx = (xmin + xmax) / 2;
      const cx = invertLeftRight ? (1000 - rawCx) : rawCx;
      const position = cx < 380 ? 'left' : cx > 620 ? 'right' : 'center';

      const rawConf = typeof det.confidence === 'number' && !isNaN(det.confidence)
        ? det.confidence
        : (requestedObject && (det.label || '').toLowerCase().includes(requestedObject.toLowerCase()) ? 0.88 : 0.75);
      const honestConfidence = Math.round(Math.min(1.0, Math.max(0.08, rawConf)) * 100) / 100;

      return {
        id: `det-${idx}-${det.label || 'object'}`,
        label: (det.label || 'object').toLowerCase(),
        confidence: honestConfidence,
        box: { x, y, width, height },
        position,
        sideDirection,
        verticalPosition,
        prominence,
        activityOrDetails: det.activity_or_details || '',
        normalizedBox: {
          x: xmin / 1000,
          y: ymin / 1000,
          width: (xmax - xmin) / 1000,
          height: (ymax - ymin) / 1000,
        },
      };
    });

    const elapsed = Date.now() - startTime;
    const spokenGuidance = parsed.navigation_guidance || parsed.scene_description || 'Scene analyzed successfully.';

    res.json({
      success: true,
      detections,
      all_candidates: detections,
      threshold_used: targetThreshold,
      scene_description: parsed.scene_description || spokenGuidance,
      navigation_guidance: spokenGuidance,
      human_activities: parsed.human_activities || '',
      visible_text: parsed.visible_text || '',
      lighting_level: parsed.lighting_level || 'Moderate Light',
      lighting_advice: parsed.lighting_advice || 'Lighting is balanced.',
      total_objects_count: detections.length,
      processing_time_ms: elapsed,
      model_status: `${modelName} (Resilient Vision Cascade)`,
    });
  } catch (error: any) {
    console.error('Gemini vision analysis error:', error);
    let cleanMessage = error?.message || 'Vision analysis failed.';
    try {
      if (cleanMessage.includes('{') && cleanMessage.includes('}')) {
        const parsedErr = JSON.parse(cleanMessage.replace(/^[^{]*(\{[\s\S]*\})[^}]*$/, '$1'));
        if (parsedErr?.error?.message) {
          cleanMessage = parsedErr.error.message;
        }
      }
    } catch (e) {}

    if (cleanMessage.includes('high demand') || cleanMessage.includes('503') || cleanMessage.includes('UNAVAILABLE')) {
      cleanMessage = 'The vision model is experiencing temporary peak demand. Please click Retry.';
    } else if (cleanMessage.includes('quota') || cleanMessage.includes('429')) {
      cleanMessage = 'API quota limit reached. Please retry in a few moments.';
    }

    res.status(500).json({
      error: cleanMessage,
      processing_time_ms: Date.now() - startTime,
    });
  }
});

// High-Accuracy OCR Vision Endpoint (Gemini Neural OCR)
app.post('/api/ocr-vision', async (req, res) => {
  const startTime = Date.now();
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini OCR not configured. Check GEMINI_API_KEY.' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.includes(',')) {
      const parts = image.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    const promptText = `
You are a precision Optical Character Recognition (OCR) engine for blind and low-vision assistance.
Read ALL visible text, labels, badges, logos, headings, signs, door plaques, and packaging text in this image with 100% exact character and word accuracy.

CRITICAL ACCURACY INSTRUCTIONS:
- Transcribe EXACT text without typos or spelling errors.
- Preserve natural reading order and line breaks.
- If there is branding, certification titles, door numbers, or packaging, accurately extract every word.
- Ignore meaningless background noise or artifacts.
- If no text is visible, set extracted_text to empty string.

Return valid JSON:
{
  "extracted_text": "Exact full text with natural line breaks",
  "lines": [
    { "text": "Exact line text", "confidence": 0.99 }
  ],
  "summary": "Brief 1-sentence spoken summary of what the text is"
}
`;

    const { text: responseText, modelName } = await generateMultimodalVisionWithCascade(
      ai,
      mimeType,
      base64Data,
      promptText
    );

    const parsed = extractJsonFromText(responseText);
    const extractedText = (parsed.extracted_text || '').trim();
    let lines = (parsed.lines || []).map((l: any) => ({
      text: typeof l === 'string' ? l.trim() : (l.text || '').trim(),
      confidence: typeof l === 'object' && l.confidence ? l.confidence : 0.95,
    })).filter((l: any) => l.text.length > 0);

    if (lines.length === 0 && extractedText) {
      lines = extractedText.split('\n').map((t: string) => ({ text: t.trim(), confidence: 0.95 })).filter((l: any) => l.text.length > 0);
    }

    const wordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;
    const elapsed = Date.now() - startTime;

    res.json({
      success: true,
      message: wordCount > 0 ? `Read ${wordCount} words with high precision.` : 'No text visible in image.',
      extracted_text: extractedText,
      lines,
      summary: parsed.summary || extractedText || 'No readable text visible in this view.',
      word_count: wordCount,
      processing_time_ms: elapsed,
      engine_ready: true,
      model_status: `${modelName} Neural OCR (Resilient Cascade)`,
    });
  } catch (error: any) {
    console.error('OCR vision error:', error);
    let cleanMessage = error?.message || 'OCR extraction failed.';
    try {
      if (cleanMessage.includes('{') && cleanMessage.includes('}')) {
        const parsedErr = JSON.parse(cleanMessage.replace(/^[^{]*(\{[\s\S]*\})[^}]*$/, '$1'));
        if (parsedErr?.error?.message) {
          cleanMessage = parsedErr.error.message;
        }
      }
    } catch (e) {}

    if (cleanMessage.includes('high demand') || cleanMessage.includes('503') || cleanMessage.includes('UNAVAILABLE')) {
      cleanMessage = 'The OCR service is experiencing temporary peak demand. Please click Retry.';
    }

    res.status(500).json({ error: cleanMessage });
  }
});

// Gemini TTS Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini TTS not configured.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: 'Clear, warm, accessible assistive vision assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        success: true,
        audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
      });
    } else {
      res.status(500).json({ error: 'No audio generated by TTS model.' });
    }
  } catch (err: any) {
    console.warn('Gemini TTS error:', err);
    res.status(500).json({ error: err?.message || 'TTS generation failed.' });
  }
});

// Vite middleware mounting in development mode
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniLens Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
