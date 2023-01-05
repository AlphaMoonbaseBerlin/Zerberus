export abstract class Enum {
 
    // private to disallow creating other instances of this type
    constructor(private readonly key: string, public readonly value: any) {
    }
  
    toString() {
      return this.key;
    }
  }