interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private apiKey: string = "AIzaSyAi2AQXRFGimgYr0rfAzbAuoORXVHbqqNo";
  private apiUrl: string = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  async generateContent(prompt: string): Promise<string> {
    try {
      const requestBody: GeminiRequest = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Generate try-on prompt for a product
  generateTryOnPrompt(productName: string): string {
    return `Wear this ${productName} on me realistically.`;
  }

  // Generate product recommendations
  async generateRecommendations(productName: string, productDescription: string, availableProducts: string[]): Promise<string> {
    const prompt = `Based on the product "${productName}" with description "${productDescription}", recommend similar sustainable fashion items from this list: ${availableProducts.join(', ')}. Focus on sustainable fashion, eco-friendly materials, and style similarity. Return only product names separated by commas.`;
    return this.generateContent(prompt);
  }

  // Generate virtual try-on response
  async generateTryOnResponse(productName: string, userPrompt?: string): Promise<string> {
    const prompt = userPrompt || `Show user wearing ${productName} in a realistic way for a sustainable fashion e-commerce platform ReWeara. Describe how the item would look on them.`;
    return this.generateContent(prompt);
  }

  // Generate chat response
  async generateChatResponse(userMessage: string, context?: string): Promise<string> {
    const systemPrompt = `You are ReWeara's AI shopping assistant. ReWeara is a sustainable fashion e-commerce platform that sells both curated thrift finds and original eco-friendly designs. 

Key information:
- We focus on sustainability and reducing fashion waste
- We offer both pre-loved thrift items and new sustainable originals
- Free shipping on orders above ₹500
- 1-2 business days express shipping available
- Cash on delivery available for orders under ₹5000
- We ship across India
- 30-day return policy for original items, 15-day for thrift items

Please help customers with:
- Product recommendations based on their style preferences
- Information about sustainability and eco-fashion
- Shipping and return policies
- Size guidance
- Care instructions for thrift and sustainable items

Keep responses helpful, friendly, and focused on sustainable fashion.`;

    const prompt = `${systemPrompt}\n\nCustomer message: ${userMessage}${context ? `\nPrevious context: ${context}` : ''}`;
    return this.generateContent(prompt);
  }
}

export const geminiService = new GeminiService();