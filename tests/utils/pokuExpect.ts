import { assert } from 'poku';

export const expectToReject = async (
  operation: () => Promise<unknown>,
  message: string,
): Promise<unknown> => {
  try {
    await operation();
    assert.fail(message);
  } catch (error) {
    return error;
  }
};
