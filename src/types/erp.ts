export interface ProductMaster {
  id: string;
  product_item_code: string;
  brand: string;
  material_id?: string;
  material_name?: string;
  material_code?: string;
  gsm: number;
  product_type: ProductType;
  category_id?: string;
  category_name?: string;
  fsc?: string;
  fsc_claim?: string;
  color_specifications?: string;
  color?: string; // Alias for color_specifications
  remarks?: string;
  is_active: boolean;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  processSequence?: ProcessSequence; // Add process sequence for PDF generation
}

export type ProductType = 'Offset' | 'Heat Transfer Label' | 'PFL' | 'Woven' | 'Thermal' | 'Leather Patch' | 'Digital' | 'Screen Print' | 'Embroidery';

export interface ProcessStep {
  id: string;
  name: string;
  isCompulsory: boolean;
  isSelected: boolean;
  is_compulsory?: boolean; // Database field name
  is_selected?: boolean; // Database field name
  order: number;
  step_order?: number; // Database field name
}

export interface ProcessSequence {
  productType: ProductType;
  steps: ProcessStep[];
}

export const PRODUCT_TYPES: ProductType[] = [
  'Offset',
  'Heat Transfer Label', 
  'PFL',
  'Woven',
  'Thermal',
  'Leather Patch',
  'Digital',
  'Screen Print',
  'Embroidery'
];

export const BRANDS = [
  '47 HANGTAG',
  'AEO',
  'Aeropostale',
  'AHLENS',
  'ALCOTT',
  'Amazon',
  'Aprel',
  'ASOS/TOPSHOP',
  'AUCHAN',
  'BASS PRO SHOPS',
  'BERNE',
  'BERSHKA',
  'BIG STAR',
  'BLEND',
  'BLUE 84',
  'BR',
  'CAMEL ACTIVE',
  'CARHARTT',
  'CARREFOUR',
  'CECIL',
  'CHAMPION',
  'CONBIPEL',
  'COPPEL',
  'CORTEFIEL',
  'COSTCO',
  'CRO',
  'CROPP',
  'CTFM',
  'CTFW',
  'DOOA',
  'Easy Wear / Elcorte',
  'ELCORTE',
  'ENCUENTRO',
  'FANATICS',
  'FFM',
  'FFW',
  'GALERIA',
  'GAP',
  'GAS',
  'GASP',
  'GEORGE',
  'GOOD AMERICAN',
  'GREEN COAST',
  'H&M',
  'HAMAKI HO',
  'High Spirits',
  'Hummel',
  'INICIO',
  'IXS',
  'JACK&JONES',
  'JCP',
  'JOMO FASHION',
  'JULES',
  'KARLOWSKY',
  'KAUFLAND',
  'KEECO',
  'KNIGHT APPAREL',
  'KONTOOR',
  'LAND MARK',
  'LAY VINTAGE',
  'LEE',
  'LEFTIES',
  'LEVIS',
  'LOCAL',
  'LUCKY BRAND',
  'M&S',
  'MACYS',
  'MANGO',
  'MAYORAL',
  'MCNEAL',
  'MISTER LADY',
  'MITCHELL',
  'MODATEX',
  'MODYF',
  'MOTEL',
  'NEXT',
  'Nike',
  'ONLY',
  'ONLY & SONS',
  'OOTO',
  'OVS',
  'PDH',
  'PDHM',
  'PDHW',
  'PEPCO',
  'PEPE',
  'POPKEN',
  'PRODUKT',
  'PULL & BEAR',
  'PUMA',
  'PUNT O ROMA',
  'PUNT ROMA',
  'RAITH',
  'RALPH LAUREN',
  'REFORMATION',
  'RETRO',
  'RVCA',
  'S.OLIVER',
  'SANTA BARBARA',
  'SFERA',
  'SILVER JEANS',
  'SINSAY',
  'SLOW LOVE',
  'SONNY BONO',
  'SORBINO',
  'SPF KIDS',
  'SPFM',
  'SPFW',
  'SPORTSGIRL',
  'SPRINGFIELD',
  'STIFFENER CARD',
  'STIFFENER PLAIN CARD',
  'STOOKER',
  'STRADIVARIUS',
  'TAKKO',
  'TARGET',
  'TENDAM',
  'TOM TAILOR',
  'TRACTOR SUPPLY',
  'TRIARCHY',
  'TRU BLU',
  'TRUE TIMBER',
  'UNIT',
  'VBD',
  'Volcom',
  'WALMART',
  'Women Secret',
  'ZARA',
  'ZARA HOME'
];
export const MATERIALS = [
  'FREE CENTO PW',
  'FREE CENTO PW BLACK',
  'SYM FREE MATT PLUS',
  'FABRIANO LIFE PT',
  'ECO LIFE PT 100',
  'ECO LIFE 100 WHITE',
  'AREENA WHITE ROUGH',
  'AREENA NATURAL ROUGH',
  'AREENA NATURAL SMOOTH',
  'AREENA EW SMOOTH',
  'AREENA WHITE SMOOTH',
  'WOOD STOCK CAMOSCIO',
  'OLD MILL BIANCO',
  'SIRIO BLACK',
  'SML ECRU FANCY CARD',
  'LEVIS FANCY ART CARD',
  'BIANCO FLASH MASTER',
  'LEVIS M.B MONADNOCK',
  'ECO KRAFT',
  'MATERICA ACQUA',
  'MATERICA CLAY',
  'MATERICA QUARZ',
  'SIRIO PIETRA',
  'SIRIO SABBAIA',
  'SIRIO PERLA',
  'Fasson Transcode White',
  'Fasson Transparent',
  'C2S Art Card',
  'C1S Bleach Card',
  'U2S Un Coated Card',
  'Kraft Card',
  'CCNB Bux Board Card',
  'CCWB Bux Board Card',
  'Fancy Card',
  'Fancy Black Card',
  'Tyvek Paper',
  'Yupo Paper',
  'Art Paper White',
  'Offset Paper News',
  'Fasson Sticker Matt',
  'Lintec Sticker Gloss',
  'Transparent Sticker',
  'Tearable Taffeta Paper',
  'Tearabel Naylon Taffeta',
  'Non-tearable Taffeta Paper',
  'Non-tearabel Naylon Taffeta',
  // Legacy materials (keeping for backward compatibility)
  'C1S',
  'C2S',
  'Kraft',
  'Art Paper',
  'Duplex',
  'Corrugated',
  'Coated Paper'
];