import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class AiService {
  private readonly groqApiKey: string;
  private readonly aiModel: string;
  private readonly groqApiUrl =
    'https://api.groq.com/openai/v1/chat/completions';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    this.aiModel = this.configService.get<string>('AI_MODEL') || '';
  }

  async chat(prompt: string): Promise<string> {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    try {
      const requestData = {
        model: this.aiModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      };

      console.log(
        'Sending request to Groq API with prompt:',
        prompt.substring(0, 100) + '...',
      );

      const response = await firstValueFrom(
        this.httpService.post<GroqResponse>(this.groqApiUrl, requestData, {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const content =
        response.data.choices[0]?.message?.content || 'No response generated';

      // Remove surrounding quotes if present
      return content.replace(/^["']|["']$/g, '').trim();
    } catch (error) {
      console.error('AI service error:', error);

      if (error instanceof AxiosError) {
        if (error.response?.data) {
          console.error('Groq API error response:', error.response.data);
        }

        if (error.response?.status === 500) {
          throw new Error('Groq API server error - please try again later');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        } else if (error.response?.status === 401) {
          throw new Error('Invalid API key');
        }
      }

      throw new Error('Failed to generate AI response');
    }
  }
}
