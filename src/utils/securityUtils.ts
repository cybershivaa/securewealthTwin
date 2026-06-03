export const detectRoot = async (): Promise<boolean> => {
  // placeholder: use native modules for real checks
  return false;
};

export const detectEmulator = async (): Promise<boolean> => {
  return false;
};

export const isDeviceSafe = async (): Promise<boolean> => {
  const root = await detectRoot();
  const emu = await detectEmulator();
  return !(root || emu);
};
