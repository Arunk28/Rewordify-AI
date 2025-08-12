// index.js

const API_KEY = process.env.OPENROUTER_API_KEY; // Store securely in Lambda ENV vars, not hardcoded

// AI Mode prompt templates
const PROMPT_TEMPLATES = {
  rewrite: {
    system: "Polish and professionally rewrite the user's text. Improve clarity, grammar, and flow while maintaining the original meaning and tone.",
    user: (text) => text
  },
  tone: {
    professional: {
      system: "Rewrite the text in a professional tone suitable for business communication. Make it formal, clear, and respectful.",
      user: (text) => text
    },
    casual: {
      system: "Rewrite the text in a casual, friendly tone. Make it conversational and approachable while keeping it clear.",
      user: (text) => text
    },
    friendly: {
      system: "Rewrite the text in a warm, friendly tone. Make it welcoming and personable while maintaining professionalism.",
      user: (text) => text
    },
    formal: {
      system: "Rewrite the text in a formal, academic tone. Use proper grammar, sophisticated vocabulary, and structured sentences.",
      user: (text) => text
    }
  },
  length: {
    expand: {
      system: "Expand the text by adding more detail, examples, and elaboration. Make it more comprehensive while keeping it engaging.",
      user: (text) => text
    },
    condense: {
      system: "Condense the text to be more concise while preserving all key information and meaning.",
      user: (text) => text
    },
    bullets: {
      system: "Convert the text into clear, well-organized bullet points. Each point should be concise and actionable.",
      user: (text) => text
    }
  },
  style: {
    academic: {
      system: "Rewrite the text in academic style. Use scholarly language, proper citations format, and formal structure.",
      user: (text) => text
    },
    creative: {
      system: "Rewrite the text in a creative, engaging style. Use vivid language, storytelling elements, and compelling imagery.",
      user: (text) => text
    },
    technical: {
      system: "Rewrite the text in technical style. Use precise terminology, clear explanations, and logical structure.",
      user: (text) => text
    },
    marketing: {
      system: "Rewrite the text in marketing style. Make it persuasive, engaging, and action-oriented with compelling benefits.",
      user: (text) => text
    }
  },
  translate: {
    spanish: {
      system: "Translate the text to Spanish. Ensure natural, fluent translation that captures the original meaning and tone.",
      user: (text) => text
    },
    french: {
      system: "Translate the text to French. Ensure natural, fluent translation that captures the original meaning and tone.",
      user: (text) => text
    },
    german: {
      system: "Translate the text to German. Ensure natural, fluent translation that captures the original meaning and tone.",
      user: (text) => text
    },
    italian: {
      system: "Translate the text to Italian. Ensure natural, fluent translation that captures the original meaning and tone.",
      user: (text) => text
    },
    portuguese: {
      system: "Translate the text to Portuguese. Ensure natural, fluent translation that captures the original meaning and tone.",
      user: (text) => text
    },
    chinese: {
      system: "Translate the text to Chinese (Simplified). Ensure natural, fluent translation that captures the original meaning and tone.",
      user: (text) => text
    },
    japanese: {
      system: "Translate the text to Japanese. Ensure natural, fluent translation that captures the original meaning and tone.",
      user: (text) => text
    }
  },
  summarize: {
    system: "Create a concise, well-structured summary of the text. Capture the main points and key information.",
    user: (text) => text
  },
  grammar: {
    system: "Fix grammar, spelling, and punctuation errors in the text. Maintain the original style and tone.",
    user: (text) => text
  },
  clarity: {
    system: "Improve the clarity and readability of the text. Make complex ideas easier to understand while preserving meaning.",
    user: (text) => text
  }
};

// Get prompt template based on mode and submode
function getPromptTemplate(mode, submode) {
  if (!mode || mode === 'rewrite') {
    return PROMPT_TEMPLATES.rewrite;
  }
  
  const modeTemplates = PROMPT_TEMPLATES[mode];
  if (!modeTemplates) {
    return PROMPT_TEMPLATES.rewrite;
  }
  
  if (submode && modeTemplates[submode]) {
    return modeTemplates[submode];
  }
  
  // If no submode but mode has nested structure, return first available
  if (typeof modeTemplates === 'object' && !modeTemplates.system) {
    const firstSubmode = Object.keys(modeTemplates)[0];
    return modeTemplates[firstSubmode];
  }
  
  return modeTemplates;
}

export async function handler(event) {
  const EXPECTED_KEY = process.env.PRESHARED_KEY; // set this in Lambda env
  

  const headers = event.headers || {};
  const providedKey = headers['x-pre-shared-key'] || headers['X-Pre-Shared-Key'];
  
  if (providedKey !== EXPECTED_KEY) {
    return {
      statusCode: 401,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }
  
  try {

    let body;
    if (event.body) {
      body = JSON.parse(event.body);
    } else if (event.text) {
      body = { text: event.text }; // For Lambda console test
    } else {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing request body" })
      };
    }
    


    const userText = body.text;
    const mode = body.mode || 'rewrite';
    const submode = body.submode;
    
    if (!userText || userText.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Text is required" })
      };
    }
    
    // Get appropriate prompt template
    const promptTemplate = getPromptTemplate(mode, submode);
    const systemPrompt = promptTemplate.system;
    const userPrompt = promptTemplate.user(userText);
    
    
    const MODEL = process.env.WHICH_MODEL || 'openai/gpt-3.5-turbo';
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: mode === 'creative' ? 0.8 : 0.3,
        max_tokens: mode === 'expand' ? 2000 : mode === 'condense' ? 500 : 1000
      })
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`OpenRouter API failed: ${res.status}`);
    }
    
    const data = await res.json();
    
    const polishedText = data.choices?.[0]?.message?.content?.trim();
    
    if (!polishedText) {
      throw new Error('No content received from AI model');
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ 
        polishedText,
        mode,
        submode,
        originalLength: userText.length,
        processedLength: polishedText.length
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
