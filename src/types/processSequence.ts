export interface ProcessSequence {
  product_type: string;
  description: string;
  steps: ProcessStep[];
}

export interface ProcessStep {
  id: string;
  name: string;
  isCompulsory: boolean;
  order: number;
}
