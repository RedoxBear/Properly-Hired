import { base44 } from './base44Client';

export const Core = base44.integrations.Core;

export const InvokeLLM = async (params) => {
  console.log("Mocked InvokeLLM called with params:", params);
  // a mock response that fakes a call to the LLM
  const mockResponse = {
    answers: [
      {
        question: "What is your greatest strength?",
        answer: "My greatest strength is my ability to learn quickly and adapt to new situations. I am also a great team player and I am always willing to help others.",
        character_count: 170,
        optimization_tips: "Try to be more specific about your accomplishments."
      }
    ]
  };
  return Promise.resolve(mockResponse);
};

export const SendEmail = base44.integrations.Core.SendEmail;

export const UploadFile = base44.integrations.Core.UploadFile;

export const GenerateImage = base44.integrations.Core.GenerateImage;

export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;

export const CreateFileSignedUrl = base44.integrations.Core.CreateFileSignedUrl;

export const UploadPrivateFile = base44.integrations.Core.UploadPrivateFile;