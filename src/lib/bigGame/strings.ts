// The Wilderness: Big Game — feature-local translations.
//
// The site's shared dictionary (src/lib/languages.ts) is a single 1000-line
// typed interface. Adding a one-off event's strings to it would mean editing a
// file every other feature depends on, and would leave dead keys behind when
// the game is deleted. Keeping the dictionary here means the whole feature is
// still one folder to remove.
//
// Only the tribe-leader screen is translated: it is the one surface campers
// read. The director dashboard, setup screen and moderator cards stay English —
// they are operated by staff, and the printed cards and 72 codes are English.

import type { Language } from '../languages';

export interface BigGameStrings {
  gameTitle: string;
  tribeLabel: string;
  roundLabel: string;
  ofRounds: string;

  joinTitle: string;
  joinIntro: string;
  joinPlaceholder: string;
  joinButton: string;
  joinInvalid: string;
  joinThrottled: string;

  waitingTitle: string;
  waitingBody: string;

  stationLabel: string;
  currentDestination: string;
  stationInstructionsHint: string;
  codePlaceholder: string;
  submitButton: string;
  submitting: string;

  completeTitle: string;
  completeBody: string;
  clearedSuffix: string;
  nextDestination: string;

  pausedTitle: string;
  pausedBody: string;

  finishedTitle: string;
  finishedBody: string;
  stationsCompleted: string;
  finishedAt: string;

  incorrect: string;
  roundMovedOn: string;
  notStarted: string;
  throttled: string;
  offlineQueued: string;
  reconnecting: string;
  offline: string;
  leaveTribe: string;
  missedNotice: string;
}

const en: BigGameStrings = {
  gameTitle: 'Wilderness Big Game',
  tribeLabel: 'Tribe',
  roundLabel: 'Round',
  ofRounds: 'of',

  joinTitle: 'Enter your tribe code',
  joinIntro: 'Your tribe leader was given a code on paper. Enter it to begin.',
  joinPlaceholder: 'Tribe code',
  joinButton: 'Join',
  joinInvalid:
    "That code doesn't match a tribe. Check the paper and try again.",
  joinThrottled: 'Too many tries. Wait a moment and try again.',

  waitingTitle: 'The journey has not begun',
  waitingBody: 'Wait for the signal.',

  stationLabel: 'Station',
  currentDestination: 'Current destination',
  stationInstructionsHint:
    'Complete the physical challenge first, then ask your station moderator for the code.',
  codePlaceholder: 'Enter station code',
  submitButton: 'Submit',
  submitting: 'Checking…',

  completeTitle: 'Station complete',
  completeBody: 'Wait here for the signal to move.',
  clearedSuffix: 'cleared.',
  nextDestination: 'Next destination',

  pausedTitle: 'The game is paused',
  pausedBody: 'Stay where you are.',

  finishedTitle: 'Journey complete',
  finishedBody: 'You have crossed the wilderness.',
  stationsCompleted: 'Stations completed',
  finishedAt: 'Finished at',

  incorrect:
    "That's not the right code. Check with your moderator and try again.",
  roundMovedOn: 'The round has moved on — here is your new destination.',
  notStarted: 'The game has not started yet.',
  throttled: 'Slow down a moment, then try again.',
  offlineQueued: "Saved — will submit when you're back online.",
  reconnecting: 'Reconnecting…',
  offline: 'No connection',
  leaveTribe: 'Leave tribe',
  missedNotice: 'This round was marked missed. Keep going with your tribe.',
};

const ar: BigGameStrings = {
  gameTitle: 'لعبة البرية الكبرى',
  tribeLabel: 'السبط',
  roundLabel: 'الجولة',
  ofRounds: 'من',

  joinTitle: 'أدخل رمز سبطك',
  joinIntro: 'قائد سبطك حصل على رمز مطبوع. أدخله للبدء.',
  joinPlaceholder: 'رمز السبط',
  joinButton: 'انضمام',
  joinInvalid: 'هذا الرمز لا يطابق أي سبط. راجع الورقة وحاول مرة أخرى.',
  joinThrottled: 'محاولات كثيرة. انتظر لحظة ثم حاول مرة أخرى.',

  waitingTitle: 'الرحلة لم تبدأ بعد',
  waitingBody: 'انتظر الإشارة.',

  stationLabel: 'محطة',
  currentDestination: 'وجهتك الحالية',
  stationInstructionsHint:
    'أكملوا التحدي أولاً، ثم اطلبوا الرمز من مشرف المحطة.',
  codePlaceholder: 'أدخل رمز المحطة',
  submitButton: 'إرسال',
  submitting: 'جارٍ التحقق…',

  completeTitle: 'تم إنجاز المحطة',
  completeBody: 'انتظروا هنا حتى تأتي إشارة التحرك.',
  clearedSuffix: 'تم إنجازها.',
  nextDestination: 'الوجهة التالية',

  pausedTitle: 'اللعبة متوقفة مؤقتاً',
  pausedBody: 'ابقوا في مكانكم.',

  finishedTitle: 'اكتملت الرحلة',
  finishedBody: 'لقد عبرتم البرية.',
  stationsCompleted: 'المحطات المكتملة',
  finishedAt: 'انتهت في',

  incorrect: 'هذا ليس الرمز الصحيح. راجع المشرف وحاول مرة أخرى.',
  roundMovedOn: 'انتقلت الجولة — هذه وجهتكم الجديدة.',
  notStarted: 'اللعبة لم تبدأ بعد.',
  throttled: 'تمهّل قليلاً ثم حاول مرة أخرى.',
  offlineQueued: 'تم الحفظ — سيتم الإرسال عند عودة الاتصال.',
  reconnecting: 'جارٍ إعادة الاتصال…',
  offline: 'لا يوجد اتصال',
  leaveTribe: 'مغادرة السبط',
  missedNotice: 'تم تسجيل هذه الجولة كفائتة. تابعوا مع سبطكم.',
};

export function bigGameStrings(language: Language): BigGameStrings {
  return language === 'ar' ? ar : en;
}
