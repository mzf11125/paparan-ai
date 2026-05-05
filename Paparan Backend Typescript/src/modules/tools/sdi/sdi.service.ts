import { Injectable, Logger } from '@nestjs/common';
import { TavilyService } from '@modules/tools/tavily/tavily.service';
import { HttpClientService } from '@modules/tools/http/http-client.service';

/**
 * K/L Code Mappings (Kementrian/Lembaga codes)
 * Based on Satu Data Indonesia standard
 */
const KL_CODE_MAPPING: Record<string, string> = {
  // Kementrian (Ministries)
  'Kementrian Dalam Negeri': '001',
  'Kementrian Luar Negeri': '002',
  'Kementrian Pertahanan': '003',
  'Kementrian Hukum dan Hak Asasi Manusia': '004',
  'Kementrian Keuangan': '005',
  'Kementrian Pendidikan Dasar dan Menengah': '006',
  'Kementrian Pendidikan, Kebudayaan, Riset, dan Teknologi': '006',
  'Kementrian Kesehatan': '007',
  'Kementrian Sosial': '008',
  'Kementrian Tenaga Kerja': '009',
  'Kementrian Pariwisata dan Ekonomi Kreatif': '010',
  'Kementrian Perdagangan': '011',
  'Kementrian Pertanian': '012',
  'Kementrian Kelautan dan Perikanan': '013',
  'Kementrian Energi dan Sumber Daya Mineral': '014',
  'Kementrian Perindustrian': '015',
  'Kementrian Perhubungan': '016',
  'Kementrian Komunikasi dan Informatika': '017',
  'Kementrian Badan Usaha Milik Negara': '018',
  'Kementrian Agraria dan Tata Ruang': '019',
  'Kementrian Lingkungan Hidup dan Kehutanan': '020',
  'Kementrian Koperasi dan UKM': '021',
  'Kementrian Pemberdayaan Perempuan dan Perlindungan Anak': '022',
  'Kementrian Pemberdayaan Aparatur Negara dan Reformasi Birokrasi': '023',
  'Kementrian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi': '024',
  'Kementrian Agama': '025',
  'Kementrian Koordinator Bidang Politik, Hukum, dan Keamanan': '026',
  'Kementrian Koordinator Bidang Ekonomi': '027',
  'Kementrian Koordinator Bidang Pembangunan Manusia dan Kebudayaan': '028',
  'Kementrian Koordinator Bidang Kemaritiman dan Investasi': '029',
  'Kementrian Investasi/BKPM': '030',
  // Common abbreviations
  'Kemendagri': '001',
  'Kemenlu': '002',
  'Kemenhan': '003',
  'Kemenkumham': '004',
  'Kemenkeu': '005',
  'Kemdikbud': '006',
  'Kemendikbudristek': '006',
  'Kemenkes': '007',
  'Kemensos': '008',
  'Kemenaker': '009',
  'Kemenparekraf': '010',
  'Kemendag': '011',
  'Kementan': '012',
  'KKP': '013',
  'ESDM': '014',
  'Kemendik': '015',
  'Kemenhub': '016',
  'Kominfo': '017',
  'Kemen BUMN': '018',
  'Kementerian ATR': '019',
  'LHK': '020',
  'Kemenkop UKM': '021',
  'PPPA': '022',
  'PAN RB': '023',
  'Kemendesa': '024',
  'Kemenag': '025',
  'Kemenko Polhukam': '026',
  'Kemenko Perekonomian': '027',
  'Kemenko PMK': '028',
  'Kemenko Marves': '029',
  'BKPM': '030',
  'PUPR': '031',
  'Kemenristek': '034',
  'Kemenkopmk': '035',
  // Lembaga (Agencies)
  'Bappenas': '101',
  'Badan Perencanaan Pembangunan Nasional': '101',
  'Badan Pusat Statistik': '102',
  'BPS': '102',
  'Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah': '103',
  'LKPP': '103',
  'Badan Pengelola Keuangan Haji': '104',
  'BPKH': '104',
  'Badan Pengawas Perdagangan Berjangka Komoditi': '105',
  'Bappebti': '105',
  'Badan Pengawas Tenaga Nuklir': '106',
  'BAPETEN': '106',
  'Badan Tenaga Nuklir Nasional': '107',
  'BATAN': '107',
  'Badan Pengkajian dan Penerapan Teknologi': '108',
  'BPPT': '108',
  'BRIN': '108',
  'Badan Riset dan Inovasi Nasional': '109',
  'BRIN': '109',
  'Badan Informasi Geospasial': '110',
  'BIG': '110',
  'Badan Pengawas Pemilihan Umum': '111',
  'Bawaslu': '111',
  'Komisi Pemilihan Umum': '112',
  'KPU': '112',
  'Badan Pengawasan Keuangan dan Pembangunan': '113',
  'BPKP': '113',
  'Badan Pemeriksa Keuangan': '114',
  'BPK': '114',
  'Badan Nasional Penanggulangan Bencana': '115',
  'BNPB': '115',
  'Badan Narkotika Nasional': '116',
  'BNN': '116',
  'Otoritas Jasa Keuangan': '117',
  'OJK': '117',
  'Lembaga Penjamin Simpanan': '118',
  'LPS': '118',
  'Badan Pengelola Transportasi Jabodetabek': '119',
  'BPTJ': '119',
  'Lembaga Penyiaran Publik RRI': '120',
  'LPP RRI': '120',
  'Lembaga Penyiaran Publik TVRI': '121',
  'LPP TVRI': '121',
  'Badan Standardisasi dan Kebijakan Jasa Industri': '122',
  'BSN': '122',
  'Badan Pengawas Obat dan Makanan': '123',
  'BPOM': '123',
  'Komisi Pengawas Persaingan Usaha': '124',
  'KPPU': '124',
  'Komisi Pemberantasan Korupsi': '125',
  'KPK': '125',
  'Komisi Nasional Hak Asasi Manusia': '126',
  'Komnas HAM': '126',
  'Komisi Informasi': '127',
  'KI': '127',
  'Komisi Pengawas Persaingan Usaha Daerah': '128',
  'KPPU Daerah': '128',
  'Ombudsman Republik Indonesia': '129',
  'ORI': '129',
  'Komisi Aparatur Sipil Negara': '130',
  'KASN': '130',
  'Komisi Nasional Lanjut Usia': '131',
  'Komnas LU': '131',
  'Komisi Nasional Disabilitas': '132',
  'Komnas Disabilitas': '132',
  'Komisi Nasional Anti Kekerasan terhadap Perempuan': '133',
  'Komnas Perempuan': '133',
  'Komisi Nasional Kekekerasan Anak': '134',
  'Komnas Anak': '134',
  'Komisi Pengawas Persaingan Usaha': '135',
  'Arsip Nasional Republik Indonesia': '136',
  'ANRI': '136',
  'Perpustakaan Nasional': '137',
  'Perpusnas': '137',
  'Badan Meteorologi, Klimatologi, dan Geofisika': '138',
  'BMKG': '138',
  'Badan Standardisasi Nasional': '139',
  'BSN': '139',
  'Badan Ketahanan Pangan': '140',
  'BKP': '140',
  'Badan Nasional Pengelola Perbatasan': '141',
  'BNPP': '141',
  'Komisi Nasional Anti Kekerasan terhadap Perempuan': '143',
  'Badan Pembinaan Ideologi Pancasila': '145',
  'BPIP': '145',
  'Badan Intelijen Negara': '146',
  'BIN': '146',
  'Badan Siber dan Sandi Negara': '147',
  'BSSN': '147',
  'Lembaga Nasional Singapura': '148',
  'LNS': '148',
};

/**
 * SDI Goal codes based on Perpres 195/2024
 */
const SDI_GOAL_MAPPING: Record<string, string> = {
  'SDI 1': 'Memperkuat data untuk pembangunan SDGs',
  'SDI 2': 'Memperkuat data untuk pembangunan berkelanjutan',
  'SDI 3': 'Memperkuat data untuk pembangunan inklusif',
  'SDI 4': 'Memperkuat data untuk pembangunan berbasis wilayah',
  'SDI 5': 'Memperkuat data untuk pemerintahan berbasis data',
};

/**
 * Sector mapping based on Perpres 195/2024
 */
const SECTOR_MAPPING: Record<string, string[]> = {
  'Ekonomi': ['01', 'Ekonomi Makro', 'Pembangunan Ekonomi'],
  'Sosial': ['02', 'Kesejahteraan Sosial', 'Pemberdayaan Masyarakat'],
  'Politik': ['03', 'Politik Hukum dan Keamanan', 'Demokrasi'],
  'Pertahanan': ['04', 'Pertahanan', 'Keamanan'],
  'Hukum': ['05', 'Hukum', 'Hak Asasi Manusia'],
  'Pendidikan': ['06', 'Pendidikan', 'Kebudayaan'],
  'Kesehatan': ['07', 'Kesehatan', 'Pelayanan Kesehatan'],
  'Pembangunan': ['08', 'Pembangunan', 'Perumahan'],
  'Lingkungan': ['09', 'Lingkungan Hidup', 'Kehutanan'],
  'Pertanian': ['10', 'Pertanian', 'Ketahanan Pangan'],
  'Kelautan': ['11', 'Kelautan', 'Perikanan'],
  'Energi': ['12', 'Energi', 'Sumber Daya Mineral'],
  'Industri': ['13', 'Industri', 'Perdagangan'],
  'Perhubungan': ['14', 'Perhubungan', 'Transportasi'],
  'Komunikasi': ['15', 'Komunikasi', 'Informatika'],
  'Pariwisata': ['16', 'Pariwisata', 'Ekonomi Kreatif'],
  'Keuangan': ['17', 'Keuangan', 'Perbankan'],
  'Tenaga Kerja': ['18', 'Tenaga Kerja', 'Ketenagakerjaan'],
  'Pemberdayaan': ['19', 'Pemberdayaan', 'Koperasi UKM'],
};

/**
 * Unit type enum
 */
const UNIT_TYPE_ENUM = [
  'nominal',
  'ratio',
  'index',
  'count',
  'percentage',
  'rate',
  'duration',
  'currency',
] as const;

/**
 * Temporal resolution enum
 */
const TEMPORAL_RESOLUTION_ENUM = [
  'realtime',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
  'biennial',
  'quinary',
] as const;

/**
 * Availability status enum
 */
const AVAILABILITY_STATUS_ENUM = [
  'available',
  'partial',
  'scheduled',
  'discontinued',
] as const;

/**
 * Indonesian government abbreviation mappings
 */
const ABBREVIATION_MAPPING: Record<string, string> = {
  'K/L': 'Kementrian/Lembaga',
  'K/L-': 'Kementrian/Lembaga-',
  'BPS': 'Badan Pusat Statistik',
  'Bappenas': 'Badan Perencanaan Pembangunan Nasional',
  'Kemenkes': 'Kementrian Kesehatan',
  'Kemdikbud': 'Kementrian Pendidikan, Kebudayaan, Riset, dan Teknologi',
  'Kemendikbudristek': 'Kementrian Pendidikan, Kebudayaan, Riset, dan Teknologi',
  'Kemenkeu': 'Kementrian Keuangan',
  'Kemenlu': 'Kementrian Luar Negeri',
  'Kemenag': 'Kementrian Agama',
  'Kemenhub': 'Kementrian Perhubungan',
  'Kemendagri': 'Kementrian Dalam Negeri',
  'Kemenparekraf': 'Kementrian Pariwisata dan Ekonomi Kreatif',
  'Kemendag': 'Kementrian Perdagangan',
  'Kemendik': 'Kementrian Perindustrian',
  'Kementan': 'Kementrian Pertanian',
  'Kemendesa': 'Kementrian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi',
  'Kemenkop UKM': 'Kementrian Koperasi dan UKM',
  'PPPA': 'Kementrian Pemberdayaan Perempuan dan Perlindungan Anak',
  'PAN RB': 'Kementrian Pemberdayaan Aparatur Negara dan Reformasi Birokrasi',
  'PUPR': 'Kementrian Pekerjaan Umum dan Perumahan Rakyat',
  'ESDM': 'Kementrian Energi dan Sumber Daya Mineral',
  'LHK': 'Kementrian Lingkungan Hidup dan Kehutanan',
  'KKP': 'Kementrian Kelautan dan Perikanan',
  'Kominfo': 'Kementrian Komunikasi dan Informatika',
  'BPJS': 'Badan Penyelenggara Jaminan Sosial',
  'OJK': 'Otoritas Jasa Keuangan',
  'LPS': 'Lembaga Penjamin Simpanan',
  'BPK': 'Badan Pemeriksa Keuangan',
  'BPKP': 'Badan Pengawas Keuangan dan Pembangunan',
  'KPK': 'Komisi Pemberantasan Korupsi',
  'KI': 'Komisi Informasi',
  'Bappebti': 'Badan Pengawas Perdagangan Berjangka Komoditi',
  'BAPETEN': 'Badan Pengawas Tenaga Nuklir',
  'BATAN': 'Badan Tenaga Nuklir Nasional',
  'BPPT': 'Badan Pengkajian dan Penerapan Teknologi',
  'BRIN': 'Badan Riset dan Inovasi Nasional',
  'BIG': 'Badan Informasi Geospasial',
  'Bawaslu': 'Badan Pengawas Pemilihan Umum',
  'BPKH': 'Badan Pengelola Keuangan Haji',
  'LKPP': 'Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah',
  'BNPB': 'Badan Nasional Penanggulangan Bencana',
  'BNN': 'Badan Narkotika Nasional',
  'BPIP': 'Badan Pembinaan Ideologi Pancasila',
  'BIN': 'Badan Intelijen Negara',
  'BSSN': 'Badan Siber dan Sandi Negara',
  'KSN': 'Kementrian Keamanan Nasional',
  'ANRI': 'Arsip Nasional Republik Indonesia',
  'Perpusnas': 'Perpustakaan Nasional',
  'BMKG': 'Badan Meteorologi, Klimatologi, dan Geofisika',
  'BSN': 'Badan Standardisasi Nasional',
  'BKP': 'Badan Ketahanan Pangan',
  'BNPP': 'Badan Nasional Pengelola Perbatasan',
  'LNS': 'Lembaga Nasional Singapura',
  'PUPR': 'Kementrian Pekerjaan Umum dan Perumahan Rakyat',
  'Kemenristek': 'Kementrian Riset dan Teknologi',
  'Kemenkopmk': 'Kementrian Pemberdayaan Masyarakat dan Koperasi',
  'Kemendagri': 'Kementrian Dalam Negeri',
};

export interface KLCodeInfo {
  code: string;
  name: string;
  type: 'kementrian' | 'lembaga';
  abbreviation?: string;
}

export interface SDIGoalInfo {
  code: string;
  description: string;
}

export interface SectorInfo {
  code: string;
  name: string;
  alternatives: string[];
}

export interface SDIIndicator {
  code: string;
  name: string;
  definition: string;
  sector: string;
  klCode: string;
  unit: string;
  temporalResolution: string;
  availability: string;
}

/**
 * SDI Service - Provides SDI code mappings and validation
 */
@Injectable()
export class SdiService {
  private readonly logger = new Logger(SdiService.name);

  constructor(
    private tavily: TavilyService,
    private httpClient: HttpClientService,
  ) {}

  /**
   * Get K/L code from Kementrian/Lembaga name
   */
  getKLCode(klName: string): string {
    // Try exact match first
    if (KL_CODE_MAPPING[klName]) {
      return KL_CODE_MAPPING[klName];
    }

    // Try case-insensitive partial match
    const klNameLower = klName.toLowerCase();
    for (const [name, code] of Object.entries(KL_CODE_MAPPING)) {
      if (klNameLower === name.toLowerCase() || name.toLowerCase().includes(klNameLower) || klNameLower.includes(name.toLowerCase())) {
        return code;
      }
    }

    return '999'; // Unknown code
  }

  /**
   * Get K/L name from code
   */
  getKLName(klCode: string): string {
    for (const [name, code] of Object.entries(KL_CODE_MAPPING)) {
      if (code === klCode) {
        return name;
      }
    }
    return 'Unknown';
  }

  /**
   * Get all K/L codes
   */
  getAllKLCodes(): KLCodeInfo[] {
    const result: KLCodeInfo[] = [];

    for (const [name, code] of Object.entries(KL_CODE_MAPPING)) {
      const type: 'kementrian' | 'lembaga' = parseInt(code) < 100 ? 'kementrian' : 'lembaga';
      result.push({
        code,
        name,
        type,
      });
    }

    return result.sort((a, b) => parseInt(a.code) - parseInt(b.code));
  }

  /**
   * Get K/L codes by type
   */
  getKLCodesByType(type: 'kementrian' | 'lembaga'): KLCodeInfo[] {
    return this.getAllKLCodes().filter(kl => kl.type === type);
  }

  /**
   * Search K/L codes by name
   */
  searchKLCodes(query: string): KLCodeInfo[] {
    const queryLower = query.toLowerCase();
    return this.getAllKLCodes().filter(kl =>
      kl.name.toLowerCase().includes(queryLower) ||
      kl.code.includes(queryLower)
    );
  }

  /**
   * Get sector code from sector name
   */
  getSectorCode(sectorName: string): string {
    for (const [sector, codes] of Object.entries(SECTOR_MAPPING)) {
      if (sectorName.toLowerCase() === sector.toLowerCase()) {
        return codes[0];
      }
      // Check alternatives
      for (const alt of codes) {
        if (alt.toLowerCase() === sectorName.toLowerCase()) {
          return codes[0];
        }
      }
    }
    return '00';
  }

  /**
   * Get all sectors
   */
  getAllSectors(): SectorInfo[] {
    return Object.entries(SECTOR_MAPPING).map(([name, codes]) => ({
      code: codes[0],
      name,
      alternatives: codes.slice(1),
    }));
  }

  /**
   * Get SDI goal code from goal description
   */
  getSDIGoalCode(goalName: string): string {
    const goalLower = goalName.toLowerCase();
    for (const [code, desc] of Object.entries(SDI_GOAL_MAPPING)) {
      if (goalLower.includes(desc.toLowerCase()) || desc.toLowerCase().includes(goalLower)) {
        return code;
      }
    }
    return '';
  }

  /**
   * Get all SDI goals
   */
  getAllSDIGoals(): SDIGoalInfo[] {
    return Object.entries(SDI_GOAL_MAPPING).map(([code, description]) => ({
      code,
      description,
    }));
  }

  /**
   * Validate K/L code
   */
  validateKLCode(klCode: string): boolean {
    return Object.values(KL_CODE_MAPPING).includes(klCode);
  }

  /**
   * Validate unit type
   */
  validateUnitType(unitType: string): boolean {
    return UNIT_TYPE_ENUM.includes(unitType.toLowerCase() as any);
  }

  /**
   * Validate temporal resolution
   */
  validateTemporalResolution(temporalResolution: string): boolean {
    return TEMPORAL_RESOLUTION_ENUM.includes(temporalResolution.toLowerCase() as any);
  }

  /**
   * Get all unit types
   */
  getUnitTypes(): readonly string[] {
    return UNIT_TYPE_ENUM;
  }

  /**
   * Get all temporal resolutions
   */
  getTemporalResolutions(): readonly string[] {
    return TEMPORAL_RESOLUTION_ENUM;
  }

  /**
   * Get all availability statuses
   */
  getAvailabilityStatuses(): readonly string[] {
    return AVAILABILITY_STATUS_ENUM;
  }

  /**
   * Resolve Indonesian government abbreviations
   */
  resolveAbbreviation(text: string): string {
    let result = text;

    // Sort by length (longest first) to avoid partial replacements
    const sortedAbbrevs = Object.entries(ABBREVIATION_MAPPING)
      .sort((a, b) => b[0].length - a[0].length);

    for (const [abbrev, full] of sortedAbbrevs) {
      // Use word boundaries for replacement
      const regex = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, full);
    }

    return result;
  }

  /**
   * Look up indicator by K/L code
   */
  async lookupIndicator(klCode: string): Promise<{
    code: string;
    name?: string;
    sector?: string;
    definition?: string;
    unit?: string;
  }> {
    // This would typically query a database of SDI indicators
    // For now, return basic info
    const klName = this.getKLName(klCode);

    return {
      code: klCode,
      name: klName,
      sector: this.getKLCodeSector(klCode),
    };
  }

  /**
   * Get sector for a K/L code
   */
  private getKLCodeSector(klCode: string): string {
    const code = parseInt(klCode);
    if (code >= 1 && code <= 5) return 'Ekonomi';
    if (code === 6) return 'Pendidikan';
    if (code === 7) return 'Kesehatan';
    if (code === 8) return 'Sosial';
    if (code === 9) return 'Lingkungan';
    if (code >= 10 && code <= 13) return 'Pembangunan';
    if (code === 14) return 'Perhubungan';
    if (code === 15) return 'Komunikasi';
    if (code === 16) return 'Pariwisata';
    if (code === 17) return 'Keuangan';
    if (code === 18) return 'Tenaga Kerja';
    if (code === 19) return 'Pemberdayaan';
    return 'Lainnya';
  }

  /**
   * Format indicator code (K##L##)
   */
  formatIndicatorCode(klCode: string, indicatorNumber: string): string {
    const formattedKL = klCode.padStart(2, '0');
    const formattedL = indicatorNumber.padStart(2, '0');
    return `${formattedKL}${formattedL}`;
  }

  /**
   * Parse indicator code
   */
  parseIndicatorCode(code: string): {
    klCode: string;
    indicatorNumber: string;
  } | null {
    const match = code.match(/^(\d{2,3})(\d{2,3})$/);
    if (!match) return null;

    return {
      klCode: match[1],
      indicatorNumber: match[2],
    };
  }

  /**
   * Get RPJMN pillar for K/L code
   */
  getRPJMNPillar(klCode: string): string {
    const sector = this.getKLCodeSector(klCode);
    const pillarMap: Record<string, string> = {
      'Ekonomi': 'Pembangunan Berkelanjutan',
      'Sosial': 'Pembangunan Inklusif',
      'Politik': 'Penguatan Pemerintahan',
      'Pendidikan': 'Peningkatan Pendidikan',
      'Kesehatan': 'Peningkatan Kesehatan',
      'Lingkungan': 'Pembangunan Berkelanjutan',
      'Pembangunan': 'Pembangunan Infrastruktur',
      'Perhubungan': 'Pembangunan Infrastruktur',
      'Komunikasi': 'Penguatan Pemerintahan',
      'Keuangan': 'Penguatan Pemerintahan',
      'Tenaga Kerja': 'Pembangunan Ekonomi',
      'Pemberdayaan': 'Pembangunan Inklusif',
    };

    return pillarMap[sector] || 'Lainnya';
  }

  /**
   * Validate indicator structure
   */
  async validateIndicator(indicator: any): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check required fields
    if (!indicator.code) {
      errors.push('Indicator code is required');
    } else if (!this.validateKLCode(indicator.klCode)) {
      errors.push(`Invalid K/L code: ${indicator.klCode}`);
    }

    if (!indicator.name) {
      errors.push('Indicator name is required');
    }

    if (!indicator.definition) {
      errors.push('Indicator definition is required');
    }

    if (!indicator.sector) {
      errors.push('Sector is required');
    }

    // Validate unit type
    if (indicator.unitType && !this.validateUnitType(indicator.unitType)) {
      errors.push(`Invalid unit type: ${indicator.unitType}`);
    }

    // Validate temporal resolution
    if (indicator.temporalResolution && !this.validateTemporalResolution(indicator.temporalResolution)) {
      errors.push(`Invalid temporal resolution: ${indicator.temporalResolution}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get sector definitions
   */
  getSectorDefinitions(): Record<string, {
    name: string;
    klCodes: string[];
    description: string;
  }> {
    return {
      'Ekonomi': {
        name: 'Ekonomi',
        klCodes: ['001', '002', '005', '011', '015', '030'],
        description: 'Economic policy, finance, trade, and development',
      },
      'Sosial': {
        name: 'Sosial',
        klCodes: ['008', '021', '022', '024', '035'],
        description: 'Social welfare, empowerment, and community development',
      },
      'Politik': {
        name: 'Politik, Hukum, dan Keamanan',
        klCodes: ['003', '004', '026'],
        description: 'Political, legal, and security affairs',
      },
      'Pendidikan': {
        name: 'Pendidikan',
        klCodes: ['006', '028'],
        description: 'Education, culture, research, and technology',
      },
      'Kesehatan': {
        name: 'Kesehatan',
        klCodes: ['007'],
        description: 'Health services and public health',
      },
      'Pembangunan': {
        name: 'Pembangunan',
        klCodes: ['008', '014', '016', '031'],
        description: 'Infrastructure and regional development',
      },
      'Lingkungan': {
        name: 'Lingkungan Hidup',
        klCodes: ['009', '020'],
        description: 'Environmental protection and forestry',
      },
    };
  }
}
