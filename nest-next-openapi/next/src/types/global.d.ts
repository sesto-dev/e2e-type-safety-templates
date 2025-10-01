export {}; // Ensure this file is treated as a module

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (...args: any[]) => Promise<any>;
      // You can add other properties you use, e.g.:
      // on: (eventName: string, callback: (...args: any[]) => void) => void;
      // removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
    };
  }
}
