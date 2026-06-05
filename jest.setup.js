jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1111-2222-3333',
}));