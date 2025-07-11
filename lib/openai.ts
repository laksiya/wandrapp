import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedActivity {
  name: string;
  description: string;
  activityType: string;
}

export async function parseScreenshot(imageInput: string | File): Promise<ParsedActivity> {
  try {
    let imageUrl: string;
    
    if (typeof imageInput === 'string') {
      // If it's already a URL string, use it directly
      imageUrl = imageInput;
    } else {
      // If it's a File object, convert to base64 data URL
      const bytes = await imageInput.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      imageUrl = `data:${imageInput.type};base64,${base64}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this travel-related screenshot and extract activity information. Return JSON with:
              - name: A concise activity name (e.g., "Louvre Museum Visit")
              - description: Brief description of what this activity involves
              - activityType: Category like "museum", "restaurant", "attraction", "hotel", "transport", "activity", "shopping", "entertainment"
              
              Keep responses travel-focused and practical for itinerary planning.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      name: parsed.name || 'Untitled Activity',
      description: parsed.description || 'No description available',
      activityType: parsed.activityType || 'activity'
    };
  } catch (error) {
    console.error('Error parsing screenshot with OpenAI:', error);
    // Fallback response
    return {
      name: 'Travel Activity',
      description: 'Activity details could not be extracted',
      activityType: 'activity'
    };
  }
}
