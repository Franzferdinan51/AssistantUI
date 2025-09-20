import { GoogleGenAI, Type } from "@google/genai";
import type { GameAction, AppSettings, AiModel, Objective, MapData } from '../types';

export interface AIResponse {
  reasoning: string;
  action: GameAction;
}

const VALID_ACTIONS: ReadonlySet<GameAction> = new Set(['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B', 'START', 'SELECT']);

/**
 * Converts a Blob to a base64 string.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // result is "data:image/jpeg;base64,..." -> we need to split and take the 2nd part
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read blob as base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// --- Model Fetching Logic ---
async function fetchGoogleModels(apiKey: string): Promise<AiModel[]> {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to fetch Google models:", error.error.message);
            return [];
        }
        const data = await response.json();
        return data.models
            .filter((m: any) => m.supportedGenerationMethods.includes("generateContent") && m.name.includes("gemini-2.5-flash"))
            .map((m: any) => ({ id: m.name, name: m.displayName }))
            .sort((a: AiModel, b: AiModel) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching Google models:", error);
        return [];
    }
}

async function fetchOpenRouterModels(): Promise<AiModel[]> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) {
            console.error("Failed to fetch OpenRouter models:", response.statusText);
            return [];
        }
        const data = await response.json();
        return data.data
            .map((m: any) => ({ id: m.id, name: m.name }))
            .sort((a: AiModel, b: AiModel) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching OpenRouter models:", error);
        return [];
    }
}

async function fetchLmStudioModels(baseUrl: string): Promise<AiModel[]> {
    if (!baseUrl) return [];
    try {
        const response = await fetch(`${baseUrl}/v1/models`);
        if (!response.ok) {
            console.error("Failed to fetch LM Studio models:", response.statusText);
            return [];
        }
        const data = await response.json();
        return data.data
            .map((m: any) => ({ id: m.id, name: m.id }))
            .sort((a: AiModel, b: AiModel) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching LM Studio models:", error);
        return [];
    }
}

export async function fetchAvailableModels(settings: AppSettings): Promise<AiModel[]> {
    switch (settings.aiProvider) {
        case 'google':
            if (!settings.googleApiKey) return [];
            return fetchGoogleModels(settings.googleApiKey);
        case 'openrouter':
            return fetchOpenRouterModels();
        case 'lmstudio':
            return fetchLmStudioModels(settings.lmStudioUrl);
        default:
            return [];
    }
}


// --- AI Action Generation Logic ---

const generatePrompt = (
    goal: string,
    objectives: Objective[],
    history: GameAction[],
    mapInfo: MapData,
    dialogue: string | undefined,
): string => {
    const formattedObjectives = objectives.length > 0
        ? `Here is your prioritized list of tasks. Focus on the first uncompleted task.\n${objectives.map((obj, i) => `${i + 1}. [${obj.completed ? 'X' : ' '}] ${obj.text}`).join('\n')}`
        : 'There are no specific tasks right now. Focus on the main objective.';
    
    const formattedPois = mapInfo.pointsOfInterest.length > 0
        ? `Nearby points of interest: ${mapInfo.pointsOfInterest.map(p => `${p.name} (${p.type}) at [${p.coords.join(', ')}]`).join('; ')}.`
        : 'There are no known points of interest nearby.';
    
    const onScreenText = dialogue
        ? `**On-Screen Text**: A dialogue box or menu is open. The text says: "${dialogue}". Use this text to understand conversations, make choices, and navigate menus.`
        : `**On-Screen Text**: No dialogue box or menu text is detected on screen.`;

    return `You are an expert AI playing a retro role-playing game (RPG).
**High-Level Objective**: "${goal}".
**Current Location**: You are in ${mapInfo.name} at coordinates [${mapInfo.coords.join(', ')}]. ${formattedPois} A map of explored areas is being tracked; prioritize visiting new places if it aligns with your tasks.
${onScreenText}
**Prioritized Tasks**:
${formattedObjectives}
**Recent Actions**: The last 5 actions taken were: ${history.slice(-5).join(', ') || 'None'}.

**Your Task**:
Based on the provided game screenshot and your current location, provide detailed reasoning for your next action to advance the highest-priority uncompleted task.
- **Navigation**: If the task is a navigation goal (e.g., 'Go to...', 'Find...', 'Explore...'), your primary focus is to determine the correct direction of travel. Use the map, your coordinates, and points of interest to plan your route.
- **Interaction**: If the task requires interacting with an object or person (e.g., 'Talk to...', 'Battle...', 'Pick up...'), analyze the screen to identify the target and choose the appropriate action (e.g., 'A' button).
- **Menuing**: If you are in a menu or dialogue, read the on-screen text and choose the action that progresses the task.

Structure your thoughts with headings. Then, determine the single next button press.
Your response must be a valid JSON object.`;
};


async function getActionFromGoogle(
  apiKey: string,
  model: string,
  imageBlob: Blob,
  goal: string,
  objectives: Objective[],
  history: GameAction[],
  mapInfo: MapData,
  dialogue: string | undefined
): Promise<AIResponse> {
  const prompt = generatePrompt(goal, objectives, history, mapInfo, dialogue);
  const imageBase64 = await blobToBase64(imageBlob);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageBlob.type || 'image/png',
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: {
              type: Type.STRING,
              description: "A detailed, structured explanation of why you are choosing this action, considering the map and objectives. Use headings (e.g. 'Navigating Menu') and newlines for clarity.",
            },
            action: {
              type: Type.STRING,
              description: "The single next game action to take.",
              enum: [...VALID_ACTIONS],
            },
          },
          required: ["reasoning", "action"]
        }
      }
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);

    if (result.action && VALID_ACTIONS.has(result.action)) {
      return result as AIResponse;
    } else {
      console.warn(`AI returned an invalid action: "${result.action}". Defaulting to SELECT.`);
      return {
        reasoning: "Received an invalid action from the model, taking a safe action instead.",
        action: 'SELECT',
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
        reasoning: `An error occurred while communicating with the Gemini API: ${errorMessage}`,
        action: 'SELECT',
    };
  }
}

async function getActionFromOpenAICompatible(
    apiUrl: string,
    apiKey: string,
    model: string,
    imageBlob: Blob,
    goal: string,
    objectives: Objective[],
    history: GameAction[],
    mapInfo: MapData,
    dialogue: string | undefined,
): Promise<AIResponse> {
    const imageBase64 = await blobToBase64(imageBlob);
    const dataUrl = `data:${imageBlob.type || 'image/png'};base64,${imageBase64}`;
    
    // Slightly modified prompt for generic models
    const basePrompt = generatePrompt(goal, objectives, history, mapInfo, dialogue);
    const prompt = `${basePrompt}\nYour response MUST be a valid JSON object with two keys: "reasoning" (a string) and "action" (one of ${[...VALID_ACTIONS].join(', ')}).`

    const body = {
        model,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: dataUrl, detail: "low" } }
                ]
            }
        ],
        max_tokens: 1000,
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);
        
        if (result.action && VALID_ACTIONS.has(result.action)) {
            return result as AIResponse;
        } else {
             console.warn(`AI returned an invalid action: "${result.action}". Defaulting to SELECT.`);
            return { reasoning: "Received an invalid action from the model, taking a safe action instead.", action: 'SELECT' };
        }
    } catch (error) {
        console.error("Error calling OpenAI-compatible API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { reasoning: `An error occurred while communicating with the AI model: ${errorMessage}`, action: 'SELECT' };
    }
}

export async function getAIThoughtAndAction(
  settings: AppSettings,
  imageBlob: Blob,
  goal: string,
  objectives: Objective[],
  history: GameAction[],
  mapInfo: MapData,
  dialogue: string | undefined,
): Promise<AIResponse> {
    switch (settings.aiProvider) {
        case 'google':
            if (!settings.googleApiKey || !settings.selectedModel) {
                return { reasoning: "Google AI provider is not configured. Please set API Key and select a model in settings.", action: 'SELECT' };
            }
            return getActionFromGoogle(settings.googleApiKey, settings.selectedModel, imageBlob, goal, objectives, history, mapInfo, dialogue);
        case 'openrouter':
            if (!settings.openrouterApiKey || !settings.selectedModel) {
                 return { reasoning: "OpenRouter is not configured. Please set API Key and select a model in settings.", action: 'SELECT' };
            }
            return getActionFromOpenAICompatible('https://openrouter.ai/api/v1/chat/completions', settings.openrouterApiKey, settings.selectedModel, imageBlob, goal, objectives, history, mapInfo, dialogue);
        case 'lmstudio':
            if (!settings.lmStudioUrl || !settings.selectedModel) {
                 return { reasoning: "LM Studio is not configured. Please set the server URL and select a model in settings.", action: 'SELECT' };
            }
            return getActionFromOpenAICompatible(`${settings.lmStudioUrl}/v1/chat/completions`, 'lmstudio-key', settings.selectedModel, imageBlob, goal, objectives, history, mapInfo, dialogue); // LM Studio key is often ignored
        default:
            return { reasoning: "No AI provider selected. Please check settings.", action: 'SELECT' };
    }
}

/**
 * Gets a conversational response from the AI.
 * @param {string} prompt The user's message.
 * @returns {Promise<string>} The AI's text response.
 */
export async function getChatResponse(settings: AppSettings, prompt: string): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant for a user who is watching another AI play a retro RPG. Keep your answers concise and relevant to the game. User's question: "${prompt}"`;
    
    try {
        switch (settings.aiProvider) {
            case 'google':
                if (!settings.googleApiKey || !settings.selectedModel) return "Google AI provider is not configured for chat.";
                const ai = new GoogleGenAI({ apiKey: settings.googleApiKey });
                const response = await ai.models.generateContent({ model: settings.selectedModel, contents: systemPrompt });
                return response.text;
            
            case 'openrouter':
            case 'lmstudio':
                const apiKey = settings.aiProvider === 'openrouter' ? settings.openrouterApiKey : 'lmstudio-key';
                const baseUrl = settings.aiProvider === 'openrouter' ? 'https://openrouter.ai/api/v1' : settings.lmStudioUrl;

                if (!apiKey || !baseUrl || !settings.selectedModel) return "AI provider not configured for chat.";

                const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                     body: JSON.stringify({
                         model: settings.selectedModel,
                         messages: [{ role: "system", content: "You are a helpful AI assistant for a user who is watching another AI play a retro RPG. Keep your answers concise and relevant to the game." }, { role: "user", content: prompt }]
                     })
                });
                if (!chatResponse.ok) {
                    const errorText = await chatResponse.text();
                    throw new Error(`API Error: ${chatResponse.status} - ${errorText}`);
                }
                const data = await chatResponse.json();
                return data.choices[0].message.content;

            default:
                return "No AI provider selected. Please configure one in settings.";
        }
    } catch (error) {
        console.error("Error calling AI for chat:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return `Sorry, I couldn't process that request: ${errorMessage}`;
    }
}