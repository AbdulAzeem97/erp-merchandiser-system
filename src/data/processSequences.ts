
import { ProcessSequence, ProcessStep } from '../types/erp';

const createStep = (name: string, isCompulsory: boolean, order: number): ProcessStep => ({
  id: `${name.toLowerCase().replace(/\s+/g, '-')}-${order}`,
  name,
  isCompulsory,
  isSelected: isCompulsory,
  order
});

export const PROCESS_SEQUENCES: ProcessSequence[] = [
  {
    productType: 'Offset',
    steps: [
      createStep('Prepress', true, 1),
      createStep('Material Procurment', true, 2),
      createStep('Material Issuance', true, 3),
      createStep('Paper Cutting', false, 4),
      createStep('Offset Printing', false, 5),
      createStep('Digital Printing', false, 6),
      createStep('Varnish Matt', false, 7),
      createStep('Varnish Gloss', false, 8),
      createStep('Varnish Soft Touch', false, 9),
      createStep('Inlay Pasting', false, 10),
      createStep('Lamination Matte', false, 11),
      createStep('Lamination Gloss', false, 12),
      createStep('Lamination Soft Touch', false, 13),
      createStep('UV', false, 14),
      createStep('Foil Matte', false, 15),
      createStep('Foil Gloss', false, 16),
      createStep('Screen Printing', false, 17),
      createStep('Embossing', false, 18),
      createStep('Debossing', false, 19),
      createStep('Pasting', false, 20),
      createStep('Two way tape', false, 21),
      createStep('Die Cutting', false, 22),
      createStep('Breaking', false, 23),
      createStep('Piggy Sticker', false, 24),
      createStep('RFID', false, 25),
      createStep('Eyelet', false, 26),
      createStep('Out Source', false, 27),
      createStep('Packing', false, 28),
      createStep('Ready', false, 29),
      createStep('Dispatch', false, 30),
      createStep('Excess', false, 31)
    ]
  },
  {
    productType: 'Heat Transfer Label',
    steps: [
      createStep('Prepress', true, 1),
      createStep('Material Procurement', true, 2),
      createStep('Material Issuance', true, 3),
      createStep('Paper Cutting', false, 4),
      createStep('Exposing', false, 5),
      createStep('Printing', false, 6),
      createStep('Die Cutting', false, 7),
      createStep('Breaking', false, 8),
      createStep('Packing', false, 9),
      createStep('Ready', false, 10),
      createStep('Dispatch', false, 11),
      createStep('Excess', false, 12)
    ]
  },
  {
    productType: 'PFL',
    steps: [
      createStep('Prepress', true, 1),
      createStep('Material Procurement', true, 2),
      createStep('Material Issuance', true, 3),
      createStep('Block Making', false, 4),
      createStep('Printing', false, 5),
      createStep('RFID', false, 6),
      createStep('Cut & Fold', false, 7),
      createStep('Curring', false, 8),
      createStep('Packing', false, 9),
      createStep('Ready', false, 10),
      createStep('Dispatch', false, 11),
      createStep('Excess', false, 12)
    ]
  },
  {
    productType: 'Woven',
    steps: [
      createStep('Prepress', true, 1),
      createStep('Material Procurement', true, 2),
      createStep('Material Issuance', true, 3),
      createStep('Dying', false, 4),
      createStep('Printing', false, 5),
      createStep('Weaving', false, 6),
      createStep('Screen Printing', false, 7),
      createStep('Sliting', false, 8),
      createStep('RFID', false, 9),
      createStep('Cut & Fold', false, 10),
      createStep('Packing', false, 11),
      createStep('Ready', false, 12),
      createStep('Dispatch', false, 13),
      createStep('Excess', false, 14)
    ]
  },
  {
    productType: 'Thermal',
    steps: [
      createStep('Prepress', true, 1),
      createStep('Material Procurement', true, 2),
      createStep('Material Issuance', true, 3),
      createStep('Printing', false, 4),
      createStep('RFID', false, 5),
      createStep('Ready', false, 6),
      createStep('Dispatch', false, 7),
      createStep('Excess', false, 8)
    ]
  },
  {
    productType: 'Leather Patch',
    steps: [
      createStep('Prepress', true, 1),
      createStep('Material Procurement', true, 2),
      createStep('Material Issuance', true, 3),
      createStep('Block Making', false, 4),
      createStep('Offset Printing', false, 5),
      createStep('RFID', false, 6),
      createStep('Screen Printing', false, 7),
      createStep('Embossing', false, 8),
      createStep('Debossing', false, 9),
      createStep('Die Cutting', false, 10),
      createStep('Breaking', false, 11),
      createStep('Crushing', false, 12),
      createStep('Packing', false, 13),
      createStep('Ready', false, 14),
      createStep('Dispatch', false, 15),
      createStep('Excess', false, 16)
    ]
  },
  {
    productType: 'Digital',
    steps: [
      createStep('Prepress', true, 1),
      createStep('Material Procurement', true, 2),
      createStep('Material Issuance', true, 3),
      createStep('Printing', false, 4),
      createStep('Die Cutting', false, 5),
      createStep('Breaking', false, 6),
      createStep('Packing', false, 7),
      createStep('Ready', false, 8),
      createStep('Dispatch', false, 9),
      createStep('Excess', false, 10)
    ]
  }
];

export const getProcessSequence = (productType: string) => {
  return PROCESS_SEQUENCES.find(seq => seq.productType === productType);
};
