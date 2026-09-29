import { GoogleGenAI } from '@google/genai';
import { 
  FrameType, 
  AluminumBrand, 
  AluminumProfile, 
  AluminumColor, 
  GlassType, 
  DoorInfillType, 
  DoorHandleType, 
  DoorHandlePosition, 
  DoorHandleColor 
} from '../types';

export interface ParsedDesignResult {
  name: string;
  type: FrameType;
  widthMm: number;
  heightMm: number;
  quantity: number;
  brand: AluminumBrand;
  profileSize: AluminumProfile;
  color: AluminumColor;
  glassType: GlassType;
  hasTopBoven: boolean;
  topBovenHeightMm: number;
  doorInfillType: DoorInfillType;
  handleType: DoorHandleType;
  handlePosition: DoorHandlePosition;
  handleColor: DoorHandleColor;
  handleHeightMm: number;
  doorWidthMm?: number;
  windowHeightMm?: number;
  windowCount?: number;
  aiExplanation?: string;
}

// Fallback smart rule-based parser when offline or without API key
export function parseDesignRuleBased(prompt: string): ParsedDesignResult {
  const p = prompt.toLowerCase();

  let type: FrameType = 'kusen_pintu_swing';
  if (p.includes('pj') || (p.includes('pintu') && p.includes('jendela')) || p.includes('gabungan') || p.includes('kombinasi')) {
    type = 'kusen_pintu_jendela_gabungan';
  } else if (p.includes('sliding') && p.includes('jendela')) {
    type = 'kusen_jendela_sliding';
  } else if (p.includes('casement') || (p.includes('jendela') && !p.includes('pintu'))) {
    type = 'kusen_jendela_casement';
  } else if (p.includes('sliding') && p.includes('pintu')) {
    type = 'kusen_pintu_sliding';
  } else if (p.includes('lipat') || p.includes('folding')) {
    type = 'kusen_pintu_lipat';
  } else if (p.includes('kaca mati') || p.includes('fixed') || p.includes('facade')) {
    type = 'kusen_mati_kaca';
  } else if (p.includes('boven') || p.includes('ventilasi') || p.includes('jalusi')) {
    type = 'boven_ventilasi';
  }

  // Dimension extraction (e.g. 160x220 cm or 1600x2200 mm or 90 x 210)
  let widthMm = 900;
  let heightMm = 2100;

  const dimMatch = p.match(/(\d{2,4})\s*(?:x|\*|kali|by)\s*(\d{2,4})/i);
  if (dimMatch) {
    let w = parseInt(dimMatch[1], 10);
    let h = parseInt(dimMatch[2], 10);
    // If under 300, it's in cm
    if (w < 400) w *= 10;
    if (h < 400) h *= 10;
    widthMm = w;
    heightMm = h;
  } else if (type === 'kusen_pintu_jendela_gabungan') {
    widthMm = 2300;
    heightMm = 2200;
  } else if (type.includes('jendela')) {
    widthMm = 1200;
    heightMm = 1500;
  }

  // Brand
  let brand: AluminumBrand = 'Alexindo';
  if (p.includes('ykk')) brand = 'YKK AP';
  else if (p.includes('forta')) brand = 'Forta';
  else if (p.includes('dacon')) brand = 'Dacon';
  else if (p.includes('incalum')) brand = 'Incalum';

  // Profile Size
  let profileSize: AluminumProfile = '4 Inch';
  if (p.includes('3 inch') || p.includes('3"') || p.includes('3 in')) {
    profileSize = '3 Inch';
  }

  // Color
  let color: AluminumColor = 'Black (Hitam)';
  if (p.includes('putih') || p.includes('white')) color = 'White (Putih)';
  else if (p.includes('cokelat') || p.includes('brown')) color = 'Brown (Cokelat)';
  else if (p.includes('silver') || p.includes('anodized') || p.includes('abu')) color = 'Anodized Silver';
  else if (p.includes('urat kayu') || p.includes('kayu')) color = 'Urat Kayu (Wood)';

  // Glass Type
  let glassType: GlassType = 'Polos 5mm';
  if (p.includes('rayban') || p.includes('riben') || p.includes('gelap') || p.includes('hitam')) glassType = 'Rayban 5mm';
  else if (p.includes('es') || p.includes('buram') || p.includes('frosted')) glassType = 'Es / Frosted 5mm';
  else if (p.includes('tempered 8') || p.includes('8mm')) glassType = 'Tempered 8mm';
  else if (p.includes('tempered 10') || p.includes('10mm')) glassType = 'Tempered 10mm';
  else if (p.includes('tanpa kaca') || p.includes('acp full')) glassType = 'Tanpa Kaca';

  // Door Infill Type (ACP Wood Grain / Solid / Glass)
  let doorInfillType: DoorInfillType = 'acp_kayu_jati';
  if (p.includes('walnut') || p.includes('kayu gelap')) {
    doorInfillType = 'acp_kayu_walnut';
  } else if (p.includes('oak') || p.includes('kayu terang') || p.includes('natural')) {
    doorInfillType = 'acp_kayu_oak';
  } else if (p.includes('jati') || p.includes('acp kayu') || p.includes('motif kayu')) {
    doorInfillType = 'acp_kayu_jati';
  } else if (p.includes('acp putih') || p.includes('acp white')) {
    doorInfillType = 'acp_solid_white';
  } else if (p.includes('acp hitam') || p.includes('acp black')) {
    doorInfillType = 'acp_solid_black';
  } else if (p.includes('acp abu') || p.includes('acp grey')) {
    doorInfillType = 'acp_solid_grey';
  } else if (p.includes('spandrel')) {
    doorInfillType = 'spandrel_alumunium';
  } else if (p.includes('jalusi') || p.includes('louver')) {
    doorInfillType = 'jalusi_louver';
  } else if (p.includes('kaca full') || p.includes('pintu kaca')) {
    doorInfillType = 'kaca';
  }

  // Handle Type
  let handleType: DoorHandleType = 'pull_80';
  if (p.includes('smart lock') || p.includes('digital') || p.includes('fingerprint') || p.includes('pin')) {
    handleType = 'smart_lock';
  } else if (p.includes('pull 120') || p.includes('120 cm') || p.includes('120cm')) {
    handleType = 'pull_120';
  } else if (p.includes('pull 100') || p.includes('100 cm') || p.includes('100cm') || p.includes('1 meter')) {
    handleType = 'pull_100';
  } else if (p.includes('pull 80') || p.includes('80 cm') || p.includes('80cm')) {
    handleType = 'pull_80';
  } else if (p.includes('pull 60') || p.includes('60 cm') || p.includes('60cm')) {
    handleType = 'pull_60';
  } else if (p.includes('lever') || p.includes('engkol') || p.includes('standar')) {
    handleType = 'lever';
  } else if (p.includes('flush') || p.includes('tanam') || type.includes('sliding')) {
    handleType = 'flush';
  } else if (p.includes('knob') || p.includes('bulat')) {
    handleType = 'knob';
  }

  // Handle Position
  let handlePosition: DoorHandlePosition = 'right';
  if (p.includes('kupu tarung') || p.includes('2 daun') || p.includes('ganda') || p.includes('sepasang') || p.includes('tengah')) {
    handlePosition = 'center_pair';
  } else if (p.includes('kiri') || p.includes('buka kanan')) {
    handlePosition = 'left';
  }

  // Handle Color
  let handleColor: DoorHandleColor = 'stainless';
  if (p.includes('handle hitam') || p.includes('black handle') || (color.includes('Black') && p.includes('hitam'))) {
    handleColor = 'black';
  } else if (p.includes('gold') || p.includes('emas')) {
    handleColor = 'gold';
  }

  // Top Boven
  const hasTopBoven = p.includes('boven') || p.includes('ventilasi') || p.includes('kaca mati atas') || type === 'kusen_pintu_jendela_gabungan';
  const topBovenHeightMm = hasTopBoven ? 140 : 0;

  // Name
  let name = 'Unit Desain AI';
  if (type === 'kusen_pintu_jendela_gabungan') name = 'Pintu & Jendela Kombinasi (PJ)';
  else if (type === 'kusen_pintu_swing') name = handlePosition === 'center_pair' ? 'Pintu Utama Swing Ganda' : 'Pintu Swing Alumunium';
  else if (type === 'kusen_pintu_sliding') name = 'Pintu Sliding Geser';
  else if (type === 'kusen_jendela_casement') name = 'Jendela Casement Jungkit';
  else if (type === 'kusen_jendela_sliding') name = 'Jendela Geser Sliding';

  return {
    name,
    type,
    widthMm,
    heightMm,
    quantity: 1,
    brand,
    profileSize,
    color,
    glassType,
    hasTopBoven,
    topBovenHeightMm,
    doorInfillType,
    handleType,
    handlePosition,
    handleColor,
    handleHeightMm: 1000,
    doorWidthMm: type === 'kusen_pintu_jendela_gabungan' ? 900 : undefined,
    windowHeightMm: type === 'kusen_pintu_jendela_gabungan' ? 1350 : undefined,
    windowCount: type === 'kusen_pintu_jendela_gabungan' ? 2 : undefined,
    aiExplanation: `Berhasil mengonfigurasi otomatis berdasarkan instruksi: "${prompt}".`,
  };
}

// AI-powered natural language prompt parser using Google Gemini
export async function parseDesignWithAi(prompt: string): Promise<ParsedDesignResult> {
  try {
    const ai = new GoogleGenAI();
    const systemInstruction = `Anda adalah asisten AI estimator bengkel arsitektur aluminium profesional "Gudang Kreasi Alumunium".
Tugas Anda adalah membaca instruksi permintaan desain pintu/jendela kusen aluminium dari user dan mengubahnya menjadi JSON terstruktur presisi.

Kembalikan HANYA format JSON murni tanpa markdown wrapper (\`\`\`json) dengan schema:
{
  "name": string,
  "type": "kusen_pintu_jendela_gabungan" | "kusen_jendela_casement" | "kusen_jendela_sliding" | "kusen_pintu_swing" | "kusen_pintu_sliding" | "kusen_pintu_lipat" | "kusen_mati_kaca" | "boven_ventilasi",
  "widthMm": number,
  "heightMm": number,
  "quantity": number,
  "brand": "Alexindo" | "YKK AP" | "Forta" | "Dacon" | "Incalum",
  "profileSize": "3 Inch" | "4 Inch",
  "color": "White (Putih)" | "Black (Hitam)" | "Brown (Cokelat)" | "Anodized Silver" | "Urat Kayu (Wood)",
  "glassType": "Polos 5mm" | "Polos 6mm" | "Rayban 5mm" | "Es / Frosted 5mm" | "Tempered 8mm" | "Tempered 10mm" | "Tanpa Kaca",
  "hasTopBoven": boolean,
  "topBovenHeightMm": number,
  "doorInfillType": "kaca" | "acp_kayu_jati" | "acp_kayu_walnut" | "acp_kayu_oak" | "acp_solid_white" | "acp_solid_black" | "acp_solid_grey" | "acp_solid_brown" | "spandrel_alumunium" | "jalusi_louver",
  "handleType": "lever" | "pull_60" | "pull_80" | "pull_100" | "pull_120" | "flush" | "smart_lock" | "knob",
  "handlePosition": "right" | "left" | "center_pair",
  "handleColor": "stainless" | "black" | "gold",
  "handleHeightMm": number,
  "doorWidthMm": number (opsional),
  "windowHeightMm": number (opsional),
  "windowCount": number (opsional),
  "aiExplanation": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Permintaan desain: "${prompt}"` }],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson) as ParsedDesignResult;
    return { ...parsed, aiExplanation: parsed.aiExplanation || 'Dikonfigurasi otomatis oleh Gemini AI.' };
  } catch (err) {
    console.warn('Gemini API call skipped or fallback used:', err);
    return parseDesignRuleBased(prompt);
  }
}
