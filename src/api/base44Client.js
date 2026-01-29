// Mock Base44 Client to disconnect from external dependency
console.log("Mock Base44 Client Initialized (Disconnected Mode)");

export const base44 = {
  auth: {
    me: async () => ({ id: 'mock-user', name: 'Mock User' }),
    login: async () => {},
    logout: async () => {},
  },
  entities: {
    Resume: {
      list: async () => [],
      get: async () => ({}),
      create: async () => {},
      update: async () => {},
      delete: async () => {},
    },
    JobApplication: {
      list: async () => [],
      get: async () => ({}),
      create: async () => {},
      update: async () => {},
    },
  },
  integrations: {
    Core: {
      InvokeLLM: async () => ({ output: "Mock LLM Output" }),
    }
  }
};