import { LanguageData } from '../types';

import { commonTranslations } from './common';
import { homeTranslations } from './home';
import { registerTranslations } from './register';
import { coursesTranslations } from './courses';
import { ijazahTranslations } from './ijazah';
import { quizTranslations } from './quiz';
import { tasmiTranslations } from './tasmi';
import { tajwidTranslations } from './tajwid';
import { thanksTranslations } from './thanks';
import { ijazahPreviewTranslations } from './ijazahPreview';
import { aboutTranslations } from './about';
import { teachersTranslations } from './teachers';
import { feedbackTranslations } from './feedback';
import { joinClassTranslations } from './joinClass';
import { widgetTranslations } from './widget';
import { ihyaTranslations } from './ihya';

const mergeTranslations = (...translations: LanguageData[]): LanguageData => {
  const result: LanguageData = { en: {}, ar: {}, id: {} };
  for (const t of translations) {
    (Object.keys(t) as Array<keyof LanguageData>).forEach(lang => {
      Object.assign(result[lang], t[lang]);
    });
  }
  return result;
};

export const LANGUAGE_DATA: LanguageData = mergeTranslations(
    commonTranslations,
    homeTranslations,
    registerTranslations,
    coursesTranslations,
    ijazahTranslations,
    quizTranslations,
    tasmiTranslations,
    tajwidTranslations,
    thanksTranslations,
    ijazahPreviewTranslations,
    aboutTranslations,
    teachersTranslations,
    feedbackTranslations,
    joinClassTranslations,
    widgetTranslations,
    ihyaTranslations
);