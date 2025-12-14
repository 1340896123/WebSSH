import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function sendChatMessage(
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string
): Promise<string> {
  if (!apiKey) {
      return "Error: API_KEY is missing in environment variables.";
  }

  try {
    const modelId = 'gemini-3-pro-preview';

    // We use generateContent to have stateless control or manage history manually if needed,
    // but here we can just reconstruct the chat or use the chat API. 
    // Given the prompt requirements for thinkingBudget, we will use generateContent to ensure config is applied correctly per request if needed, 
    // or use chat with config.
    
    // Constructing the chat history for the prompt context
    // Ideally we use ai.chats.create but for single turn with history we can also just prompt.
    // Let's use ai.chats.create for better multi-turn handling.

    const chat = ai.chats.create({
      model: modelId,
      config: {
        thinkingConfig: {
            thinkingBudget: 32768, // Max for gemini 3 pro
        },
        // IMPORTANT: Do NOT set maxOutputTokens when using thinkingBudget as requested
        systemInstruction: "You are an expert Linux System Administrator and DevOps engineer assistant. You are embedded in a web-based SSH client. You can help the user with shell commands, explaining file systems, debugging scripts, and general Linux knowledge. When asked complex questions, use your thinking capabilities thoroughly. If the user asks you to perform an action or run a command, strictly provide the command within a markdown code block (e.g., ```bash\ncommand\n```) so the user can execute it directly.",
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error: ${error.message || "Unknown error occurred"}`;
  }
}