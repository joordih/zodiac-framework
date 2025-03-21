
export const webcrypto = typeof window !== 'undefined' 
  ? window.crypto 
  : (typeof global !== 'undefined' && global.crypto) 
    ? global.crypto 
    : require('crypto').webcrypto;

export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  
  if (typeof webcrypto.getRandomValues === 'function') {
    webcrypto.getRandomValues(bytes);
  } else {
    
    const nodeRandomBytes = require('crypto').randomBytes;
    const randomBytesBuffer = nodeRandomBytes(size);
    bytes.set(new Uint8Array(randomBytesBuffer.buffer, randomBytesBuffer.byteOffset, randomBytesBuffer.byteLength));
  }
  
  return bytes;
}

export function createHash(_algorithm: string): {
  update(data: string | Uint8Array): void;
  digest(encoding?: string): Promise<string | Uint8Array>;
} {
  if (typeof webcrypto.subtle === 'object') {
    
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
  } else {
    
    const nodeHash = require('crypto').createHash('sha256');
    
    return {
      update(data: string | Uint8Array) {
        if (typeof data === 'string') {
          nodeHash.update(data);
        } else {
          nodeHash.update(Buffer.from(data));
        }
      },
      async digest(encoding?: string) {
        if (encoding === 'hex') {
          return nodeHash.digest('hex');
        }
        return new Uint8Array(nodeHash.digest());
      }
    };
  }
}

export default {
  webcrypto,
  randomBytes,
  createHash
}; 