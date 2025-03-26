// Browser-compatible crypto implementation
const getWebCrypto = () => {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof global !== 'undefined' && global.crypto) {
    return global.crypto;
  }
  // Fallback for Node.js environments when bundled
  return {
    getRandomValues: (buffer: Uint8Array) => {
      // Using crypto-browserify's implementation
      const cryptoModule = require('crypto-browserify');
      const randomBytes = cryptoModule.randomBytes(buffer.length);
      buffer.set(new Uint8Array(randomBytes));
      return buffer;
    },
    subtle: {
      async digest(_algorithm: string, data: Uint8Array) {
        // Using crypto-browserify's implementation
        const cryptoModule = require('crypto-browserify');
        const hash = cryptoModule.createHash('sha256');
        hash.update(Buffer.from(data));
        return hash.digest();
      }
    }
  };
};

export const webcrypto = getWebCrypto();

export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  webcrypto.getRandomValues(bytes);
  return bytes;
}

export function createHash(_algorithm: string): {
  update(data: string | Uint8Array): void;
  digest(encoding?: string): Promise<string | Uint8Array>;
} {
  let buffer = new Uint8Array(0);

  return {
    update(data: string | Uint8Array) {
      const newData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      const combined = new Uint8Array(buffer.length + newData.length);
      combined.set(buffer);
      combined.set(newData, buffer.length);
      buffer = combined;
    },
    async digest(encoding?: string) {
      const hashBuffer = await webcrypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (encoding === 'hex') {
        return hashHex;
      }
      return new Uint8Array(hashBuffer);
    }
  };
}

export default {
  webcrypto,
  randomBytes,
  createHash
};