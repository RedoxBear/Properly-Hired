/**
 * LLM Client - Unified interface for OpenAI and Gemini
 */

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMClient {
  constructor(provider = 'openai', config = {}) {
    this.provider = provider;
    this.config = config;
    
    if (provider === 'openai') {
      this.client = new OpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY
      });
      this.model = config.model || 'gpt-4-turbo-preview';
    } else if (provider === 'gemini') {
      this.client = new GoogleGenerativeAI(
        config.apiKey || process.env.GEMINI_API_KEY
      );
      this.model = config.model || 'gemini-pro';
    } else {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  async chat(systemPrompt, userPrompt, options = {}) {
    try {
      if (this.provider === 'openai') {
        return await this.chatOpenAI(systemPrompt, userPrompt, options);
      } else if (this.provider === 'gemini') {
        return await this.chatGemini(systemPrompt, userPrompt, options);
      }
    } catch (error) {
      console.error(`LLM ${this.provider} error:`, error);
      throw error;
    }
  }

  async chatOpenAI(systemPrompt, userPrompt, options = {}) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined
    });

    return response.choices[0].message.content;
  }

  async chatGemini(systemPrompt, userPrompt, options = {}) {
    const model = this.client.getGenerativeModel({ model: this.model });
    
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2000
      }
    });

    return result.response.text();
  }

  async streamChat(systemPrompt, userPrompt, onChunk, options = {}) {
    try {
      if (this.provider === 'openai') {
        return await this.streamOpenAI(systemPrompt, userPrompt, onChunk, options);
      } else if (this.provider === 'gemini') {
        return await this.streamGemini(systemPrompt, userPrompt, onChunk, options);
      }
    } catch (error) {
      console.error(`LLM ${this.provider} streaming error:`, error);
      throw error;
    }
  }

  async streamOpenAI(systemPrompt, userPrompt, onChunk, options = {}) {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      stream: true
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    return fullResponse;
  }

  async streamGemini(systemPrompt, userPrompt, onChunk, options = {}) {
    const model = this.client.getGenerativeModel({ model: this.model });
    
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2000
      }
    });

    let fullResponse = '';
    for await (const chunk of result.stream) {
      const content = chunk.text();
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    return fullResponse;
  }
}

module.exports = LLMClient;
