export interface UgandaDistrict {
  name: string;
  region: 'Central' | 'Eastern' | 'Western' | 'South Western' | 'Northern / West Nile';
  coffeeType: 'Robusta' | 'Arabica' | 'Both';
  defaultCoordinates: { lat: number; lng: number };
  majorSubcounties: string[];
}

export const UGANDA_COFFEE_DISTRICTS: UgandaDistrict[] = [
  {
    name: 'Masaka',
    region: 'Central',
    coffeeType: 'Robusta',
    defaultCoordinates: { lat: -0.3411, lng: 31.7361 },
    majorSubcounties: ['Kyanamukaka', 'Bukakata', 'Kabonera', 'Buwunga', 'Nyendo-Mukungwe']
  },
  {
    name: 'Luweero',
    region: 'Central',
    coffeeType: 'Robusta',
    defaultCoordinates: { lat: 0.8333, lng: 32.5000 },
    majorSubcounties: ['Zirobwe', 'Kikyusa', 'Wobulenzi', 'Luwero Town Council', 'Butuntumula']
  },
  {
    name: 'Mityana',
    region: 'Central',
    coffeeType: 'Robusta',
    defaultCoordinates: { lat: 0.4042, lng: 32.0229 },
    majorSubcounties: ['Busujju', 'Kakindu', 'Maanyi', 'Ssekanyonyi', 'Mityana Municipality']
  },
  {
    name: 'Mukono',
    region: 'Central',
    coffeeType: 'Robusta',
    defaultCoordinates: { lat: 0.3544, lng: 32.7553 },
    majorSubcounties: ['Ntenjeru', 'Nakifuma', 'Nagojje', 'Kyampisi', 'Nama']
  },
  {
    name: 'Mbale',
    region: 'Eastern',
    coffeeType: 'Arabica',
    defaultCoordinates: { lat: 1.0784, lng: 34.1755 },
    majorSubcounties: ['Wanale', 'Bungokho', 'Bufumbo', 'Busoba', 'Nakaloke']
  },
  {
    name: 'Kapchorwa',
    region: 'Eastern',
    coffeeType: 'Arabica',
    defaultCoordinates: { lat: 1.3934, lng: 34.4504 },
    majorSubcounties: ['Kween', 'Tingey', 'Kapchekweta', 'Kapsinda', 'Kwoti']
  },
  {
    name: 'Sironko',
    region: 'Eastern',
    coffeeType: 'Arabica',
    defaultCoordinates: { lat: 1.2319, lng: 34.2504 },
    majorSubcounties: ['Budadiri', 'Bumasifwa', 'Buteza', 'Masaba', 'Buyobo']
  },
  {
    name: 'Kasese',
    region: 'Western',
    coffeeType: 'Arabica',
    defaultCoordinates: { lat: 0.1833, lng: 30.0833 },
    majorSubcounties: ['Bwera', 'Kyondo', 'Mahango', 'Kisinga', 'Maliba', 'Karambi']
  },
  {
    name: 'Bushenyi',
    region: 'Western',
    coffeeType: 'Robusta',
    defaultCoordinates: { lat: -0.5401, lng: 30.1873 },
    majorSubcounties: ['Kyamuhunga', 'Bumbaire', 'Ibaare', 'Kakanju', 'Ruhumuro']
  },
  {
    name: 'Kanungu',
    region: 'South Western',
    coffeeType: 'Arabica',
    defaultCoordinates: { lat: -0.9000, lng: 29.7833 },
    majorSubcounties: ['Kayonza', 'Rugyeyo', 'Kambuga', 'Kihihi', 'Mpungu']
  },
  {
    name: 'Nebbi / Zombo',
    region: 'Northern / West Nile',
    coffeeType: 'Arabica',
    defaultCoordinates: { lat: 2.5167, lng: 30.9167 },
    majorSubcounties: ['Paidha', 'Zombo', 'Warr', 'Erussi', 'Kango']
  }
];

export const UGANDA_COOPERATIVES = [
  'Ankole Coffee Producers Cooperative Union (ACPCU)',
  'Bugisu Cooperative Union (BCU)',
  'Banyankole Kweterana Cooperative Union',
  'Bukonzo Joint Cooperative Union (Kasese)',
  'Kagadi District Coffee Farmers Union',
  'Great Lakes Smallholder Farmers Network',
  'Mount Elgon Agroforestry Coffee Association',
  'Masaka Organic Coffee Growers Co-op'
];

export const INTERNATIONAL_BUYERS = [
  { name: 'Neumann Kaffee Gruppe (NKG)', country: 'Germany', port: 'Hamburg' },
  { name: 'Volcafe Specialty Coffee', country: 'Switzerland', port: 'Antwerp' },
  { name: 'Sucafina Europe S.A.', country: 'Belgium', port: 'Antwerp' },
  { name: 'Luigi Lavazza S.p.A.', country: 'Italy', port: 'Genoa' },
  { name: 'Ecom Agroindustrial Corp.', country: 'Netherlands', port: 'Rotterdam' },
  { name: 'Olam Coffee International', country: 'United Kingdom', port: 'Felixstowe' }
];

export function isUgandaCoordinates(lat: number, lng: number): boolean {
  // Uganda geographic boundaries roughly:
  // Lat: -1.5° (South) to 4.3° (North)
  // Lng: 29.5° (West) to 35.1° (East)
  return lat >= -1.5 && lat <= 4.3 && lng >= 29.5 && lng <= 35.1;
}

export const UGANDA_DISTRICTS = UGANDA_COFFEE_DISTRICTS;

