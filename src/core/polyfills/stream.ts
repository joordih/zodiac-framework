export class Transform {
  private transformCallback: (chunk: any) => any;
  private chunks: any[] = [];

  constructor(options: { transform?: (chunk: any) => any } = {}) {
    this.transformCallback = options.transform || ((chunk) => chunk);
  }

  write(chunk: any) {
    const transformed = this.transformCallback(chunk);
    if (transformed !== null) {
      this.chunks.push(transformed);
    }
  }

  end() {
    return this.chunks;
  }
}

export default {
  Transform
}; 