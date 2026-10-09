import type { HomeSpaConfig } from './homeSpaData';
import type { OriaCareConfig } from './oriaCareData';

export function mergeHomeCareIntroduction(home: HomeSpaConfig, care: OriaCareConfig): HomeSpaConfig {
  if (home.careIntroductionMerged || !home.sections[0] || !care.sections[0]) return home;
  const [opening, ...remaining] = home.sections[0].paragraphs;
  return {
    ...home,
    careIntroductionMerged: true,
    sections: home.sections.map((section, index) => index === 0 ? {
      ...section,
      paragraphs: [...(opening ? [opening] : []), ...care.sections[0].paragraphs, ...remaining],
    } : section),
  };
}
