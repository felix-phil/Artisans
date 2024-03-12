export const emailWrapper = {
  client: {
    send: jest.fn().mockImplementation((options: any) => {
      console.log('Sent to:', options.message.to);
    }),
  },
};
