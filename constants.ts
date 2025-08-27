

import { Language, IjazahPrices } from './types';
import { LANGUAGE_DATA } from './translations';

export { LANGUAGE_DATA };

export const LOCK_CHECK = true;
export const LANGUAGES: Language[] = ['en', 'ar', 'id'];

// IMPORTANT: Replace with your generated VAPID public key.
// You can generate one by running `npx web-push generate-vapid-keys` in your terminal.
export const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

export const IJAZAH_PRICES: IjazahPrices = {
    'Hafs \'an \'Asim':    { 1: 40000, 2: 80000, 3: 120000, 4: 160000, 5: 200000, 6: 240000, 7: 280000 },
    'The Ten Recitations': { 1: 48000, 2: 92000, 3: 140000, 4: 188000, 5: 232000, 6: 280000, 7: 328000 },
    'Different Qira\'ah': { 1: 48000, 2: 92000, 3: 140000, 4: 188000, 5: 232000, 6: 280000, 7: 328000 }
};

export const TAJWID_IMPROVEMENT_PRICES: { [days: number]: number } = {
    1: 40000, 2: 80000, 3: 120000, 4: 160000, 5: 200000, 6: 240000, 7: 280000
};

export const PATH_TRANSLATION_KEYS: { [key: string]: string } = {
    "Hafs 'an 'Asim": 'hafsButton',
    "The Ten Recitations": 'tenRecitationsButton',
    "Different Qira'ah": 'differentQiraahButton'
};

export const TIME_SLOTS = {
  morning: [
    { id: 'M_0510_0520', key: 'time_m_1', intId: 101 },
    { id: 'M_0520_0535', key: 'time_m_2', intId: 102 },
    { id: 'M_0535_0550', key: 'time_m_3', intId: 103 },
  ],
  evening: [
    { id: 'E_1820_1835', key: 'time_e_1', intId: 201 },
    { id: 'E_1835_1850', key: 'time_e_2', intId: 202 },
    { id: 'E_1850_1910', key: 'time_e_3', intId: 203 },
  ],
  afternoon: [
    { id: 'A_1410_1425', key: 'time_a_1', intId: 301 },
    { id: 'A_1425_1440', key: 'time_a_2', intId: 302 },
    { id: 'A_1440_1495', key: 'time_a_3', intId: 303 },
  ]
};

export const MAIN_TIME_BLOCKS = [
    {
        id: 'morning',
        key: 'timeBlockMorning',
        timeRangeKey: 'timeRangeMorning',
        slots: TIME_SLOTS.morning
    },
    {
        id: 'afternoon',
        key: 'timeBlockAfternoon',
        timeRangeKey: 'timeRangeAfternoon',
        slots: TIME_SLOTS.afternoon
    },
    {
        id: 'evening',
        key: 'timeBlockEvening',
        timeRangeKey: 'timeRangeEvening',
        slots: TIME_SLOTS.evening
    }
];