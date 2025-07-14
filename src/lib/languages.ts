export type Language = 'en' | 'ar'

// Enhanced translation interface with support for interpolation and context
export interface TranslationContext {
  name?: string
  count?: number
  gender?: 'male' | 'female'
  role?: 'admin' | 'user'
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
}

export interface Translations {
  // Navigation
  dashboard: string
  attendance: string
  schedule: string
  teams: string
  admin: string
  profile: string
  logout: string

  // Common Actions
  save: string
  cancel: string
  edit: string
  delete: string
  create: string
  update: string
  loading: string
  error: string
  success: string
  warning: string

  // Auth
  login: string
  signup: string
  email: string
  password: string
  forgotPassword: string
  welcomeBack: string
  createAccount: string

  // Dashboard
  welcomeMessage: string
  welcomeMessageWithName: string
  todaySessions: string
  myAttendance: string
  teamStatus: string
  quickActions: string

  // Attendance
  checkIn: string
  checkOut: string
  attendanceStatus: string
  present: string
  absent: string
  late: string
  excused: string
  attendanceHistory: string

  // Schedule
  campSchedule: string
  sessionDetails: string
  startTime: string
  endTime: string
  location: string
  activity: string
  description: string

  // Teams
  teamAssignment: string
  teamColor: string
  teamMembers: string
  switchTeam: string
  teamBalance: string

  // Admin
  adminPanel: string
  userManagement: string
  sessionManagement: string
  reports: string
  settings: string

  // Fun Messages
  awesome: string
  greatJob: string
  keepItUp: string
  youRock: string
  amazing: string
  fantastic: string
  brilliant: string
  outstanding: string

  // Dashboard Specific
  male: string
  female: string
  teamSwitchesRemaining: string
  friendRequests: string
  dailyInspiration: string
  motivationalBibleVerse: string
  newVerse: string
  download: string
  teamBalanceOverview: string

  // Sports Selection
  sportsSelection: string
  chooseSportsToParticipate: string
  howItWorks: string
  clickToJoinOrLeave: string
  participateInMultipleSports: string
  changesSavedAutomatically: string
  participants: string
  youreParticipating: string
  clickToJoin: string
  yourSports: string
  participatingInSports: string
  noSportsSelectedYet: string
  clickOnAnySportToStart: string

  // Sport Names and Descriptions
  soccer: string
  soccerDescription: string
  dodgeball: string
  dodgeballDescription: string
  chairball: string
  chairballDescription: string
  bigGame: string
  bigGameDescription: string
  poolTime: string
  poolTimeDescription: string

  // Bible Verses and Countdown
  dailyInspirationTitle: string
  countdownToCamp: string
  daysRemaining: string
  hoursRemaining: string
  minutesRemaining: string
  secondsRemaining: string
  campStartsIn: string

  // Team Rosters and Player Lists
  teamRosters: string
  players: string
  yourCurrentTeam: string
  joinTeam: string
  noPlayersAssigned: string
  genderBalance: string
  gradeRange: string
  avgGrade: string
  gradeDistribution: string
  gradeLimitReached: string
  switchesRemaining: string
  loadingTeamRosters: string
  teamSwitchSuccessful: string
  successfullyJoinedTeam: string
  cannotSwitchTeams: string
  teamSwitchNotAllowed: string
  failedToSwitchTeams: string

  // Bible Verse References
  philippians: string
  jeremiah: string
  joshua: string
  proverbs: string
  psalms: string
  isaiah: string
  matthew: string
  galatians: string
  romans: string
  niv: string
  esv: string
  nasb: string
  bibleVerseDownloaded: string

  // Bible Verse Text
  philippiansVerse: string
  jeremiahVerse: string
  joshuaVerse: string
  proverbsVerse: string
  psalmsVerse: string
  isaiahVerse: string
  matthewVerse: string
  galatiansVerse: string
  romansVerse: string
  psalms23Verse: string

  // Enhanced UI Messages
  welcomeBackMale: string
  welcomeBackFemale: string
  welcomeBackAdmin: string
  morningGreeting: string
  afternoonGreeting: string
  eveningGreeting: string
  teamSwitchSuccessMale: string
  teamSwitchSuccessFemale: string
  participantsCount: string
  participantsCountOne: string
  participantsCountMany: string
  switchesRemainingCount: string
  switchesRemainingCountOne: string
  switchesRemainingCountMany: string
  loadingWithDots: string
  errorWithRetry: string
  successWithExclamation: string
  warningWithAttention: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    attendance: 'Attendance',
    schedule: 'Schedule',
    teams: 'Sports',
    admin: 'Admin',
    profile: 'Profile',
    logout: 'Logout',

    // Common Actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    loading: 'Loading...',
    error: 'Oops! Something went wrong',
    success: 'Awesome! That worked perfectly!',
    warning: 'Hey there! Just a heads up',

    // Auth
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    welcomeBack: 'Welcome back, friend!',
    createAccount: 'Create Account',

    // Dashboard
    welcomeMessage: 'Hey there, superstar! Ready for an amazing day?',
    welcomeMessageWithName: 'Hey there, {name}! Ready for an amazing day?',
    todaySessions: "Today's Awesome Sessions",
    myAttendance: 'My Attendance',
    teamStatus: 'Team Status',
    quickActions: 'Quick Actions',

    // Attendance
    checkIn: 'Check In',
    checkOut: 'Check Out',
    attendanceStatus: 'Attendance Status',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    attendanceHistory: 'Attendance History',

    // Schedule
    campSchedule: 'Conference Schedule',
    sessionDetails: 'Session Details',
    startTime: 'Start Time',
    endTime: 'End Time',
    location: 'Location',
    activity: 'Activity',
    description: 'Description',

    // Teams
    teamAssignment: 'Team Assignment',
    teamColor: 'Team Color',
    teamMembers: 'Team Members',
    switchTeam: 'Switch Team',
    teamBalance: 'Team Balance',

    // Admin
    adminPanel: 'Admin Panel',
    userManagement: 'User Management',
    sessionManagement: 'Session Management',
    reports: 'Reports',
    settings: 'Settings',

    // Fun Messages
    awesome: 'Awesome!',
    greatJob: 'Great job!',
    keepItUp: 'Keep it up!',
    youRock: 'You rock!',
    amazing: 'Amazing!',
    fantastic: 'Fantastic!',
    brilliant: 'Brilliant!',
    outstanding: 'Outstanding!',

    // Dashboard Specific
    male: 'Male',
    female: 'Female',
    teamSwitchesRemaining: 'Team switches remaining',
    friendRequests: 'Friend Requests',
    dailyInspiration: 'Daily Inspiration',
    motivationalBibleVerse: 'A motivational Bible verse to start your day',
    newVerse: 'New Verse',
    download: 'Download',
    teamBalanceOverview: 'Team Balance Overview',

    // Sports Selection
    sportsSelection: 'Sports Selection',
    chooseSportsToParticipate: 'Choose which sports you want to participate in',
    howItWorks: 'How it works:',
    clickToJoinOrLeave: 'Click on any sport to join or leave',
    participateInMultipleSports: 'You can participate in multiple sports',
    changesSavedAutomatically: 'Changes are saved automatically',
    participants: 'participants',
    youreParticipating: 'You\'re participating!',
    clickToJoin: 'Click to join',
    yourSports: 'Your Sports',
    participatingInSports: 'You\'re participating in',
    noSportsSelectedYet: 'No sports selected yet',
    clickOnAnySportToStart: 'Click on any sport above to start participating!',

    // Sport Names and Descriptions
    soccer: 'Soccer',
    soccerDescription: 'Team football matches on the sports field',
    dodgeball: 'Dodgeball',
    dodgeballDescription: 'Fast-paced team dodgeball games in the gym',
    chairball: 'Chairball',
    chairballDescription: 'Unique chair-based ball game for all skill levels',
    bigGame: 'Big Game',
    bigGameDescription: 'Large-scale team games and outdoor activities',
    poolTime: 'Pool Time',
    poolTimeDescription: 'Swimming activities and water games',

    // Bible Verses and Countdown
    dailyInspirationTitle: 'Daily Inspiration',
    countdownToCamp: 'Countdown to Conference',
    daysRemaining: 'days',
    hoursRemaining: 'hours',
    minutesRemaining: 'minutes',
    secondsRemaining: 'seconds',
    campStartsIn: 'Conference starts in',

    // Team Rosters and Player Lists
    teamRosters: 'Team Rosters',
    players: 'players',
    yourCurrentTeam: 'Your Current Team',
    joinTeam: 'Join Team',
    noPlayersAssigned: 'No players assigned',
    genderBalance: 'Gender Balance:',
    gradeRange: 'Grade Range:',
    avgGrade: 'Avg Grade:',
    gradeDistribution: 'Grade Distribution:',
    gradeLimitReached: '* Grade limit reached',
    switchesRemaining: 'switches remaining',
    loadingTeamRosters: 'Loading team rosters...',
    teamSwitchSuccessful: 'Team Switch Successful',
    successfullyJoinedTeam: 'You have successfully joined the',
    cannotSwitchTeams: 'Cannot Switch Teams',
    teamSwitchNotAllowed: 'Team switch not allowed. You may have no switches remaining, teams are locked, or the team is full.',
    failedToSwitchTeams: 'Failed to switch teams. Please try again.',

    // Bible Verse References
    philippians: 'Philippians 4:13',
    jeremiah: 'Jeremiah 29:11',
    joshua: 'Joshua 1:9',
    proverbs: 'Proverbs 3:5-6',
    psalms: 'Psalm 28:7',
    isaiah: 'Isaiah 40:31',
    matthew: 'Matthew 11:28',
    galatians: 'Galatians 6:9',
    romans: 'Romans 8:28',
    niv: 'NIV',
    esv: 'ESV',
    nasb: 'NASB',
    bibleVerseDownloaded: 'Your Bible verse image has been downloaded!',

    // Bible Verse Text
    philippiansVerse: 'I can do all things through Christ who strengthens me.',
    jeremiahVerse: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
    joshuaVerse: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    proverbsVerse: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    psalmsVerse: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.',
    isaiahVerse: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    matthewVerse: 'Come to me, all you who are weary and burdened, and I will give you rest.',
    galatiansVerse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
    romansVerse: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    psalms23Verse: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',

    // Enhanced UI Messages
    welcomeBackMale: 'Welcome back, champ! Ready to rock?',
    welcomeBackFemale: 'Welcome back, superstar! Ready to shine?',
    welcomeBackAdmin: 'Welcome back, admin! Everything under control?',
    morningGreeting: 'Good morning! Ready for an amazing day?',
    afternoonGreeting: 'Good afternoon! How\'s your day going?',
    eveningGreeting: 'Good evening! Wrapping up a great day?',
    teamSwitchSuccessMale: 'Awesome! You\'ve successfully joined the team, champ!',
    teamSwitchSuccessFemale: 'Fantastic! You\'ve successfully joined the team, superstar!',
    participantsCount: '{count} participants',
    participantsCountOne: '1 participant',
    participantsCountMany: '{count} participants',
    switchesRemainingCount: '{count} switches remaining',
    switchesRemainingCountOne: '1 switch remaining',
    switchesRemainingCountMany: '{count} switches remaining',
    loadingWithDots: 'Loading...',
    errorWithRetry: 'Oops! Something went wrong. Please try again.',
    successWithExclamation: 'Success! That worked perfectly!',
    warningWithAttention: 'Attention! Please check the details.'
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    attendance: 'الحضور',
    schedule: 'الجدول',
    teams: 'الرياضات',
    admin: 'الإدارة',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',

    // Common Actions
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    create: 'إنشاء',
    update: 'تحديث',
    loading: 'جاري التحميل...',
    error: 'عذراً! حدث خطأ ما',
    success: 'ممتاز! تم الأمر بنجاح',
    warning: 'تنبيه! انتبه للتفاصيل',

    // Auth
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    welcomeBack: 'أهلاً وسهلاً بك يا صديقي!',
    createAccount: 'إنشاء حساب',

    // Dashboard
    welcomeMessage: 'أهلاً وسهلاً يا بطل! جاهز ليوم رائع؟',
    welcomeMessageWithName: 'أهلاً وسهلاً يا {name}! جاهز ليوم رائع؟',
    todaySessions: 'جلسات اليوم الرائعة',
    myAttendance: 'حضوري',
    teamStatus: 'حالة الفريق',
    quickActions: 'إجراءات سريعة',

    // Attendance
    checkIn: 'تسجيل الحضور',
    checkOut: 'تسجيل الانصراف',
    attendanceStatus: 'حالة الحضور',
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    excused: 'معذور',
    attendanceHistory: 'سجل الحضور',

    // Schedule
    campSchedule: 'جدول المؤتمر',
    sessionDetails: 'تفاصيل الجلسة',
    startTime: 'وقت البداية',
    endTime: 'وقت النهاية',
    location: 'الموقع',
    activity: 'النشاط',
    description: 'الوصف',

    // Teams
    teamAssignment: 'تعيين الفريق',
    teamColor: 'لون الفريق',
    teamMembers: 'أعضاء الفريق',
    switchTeam: 'تغيير الفريق',
    teamBalance: 'توازن الفريق',

    // Admin
    adminPanel: 'لوحة الإدارة',
    userManagement: 'إدارة المستخدمين',
    sessionManagement: 'إدارة الجلسات',
    reports: 'التقارير',
    settings: 'الإعدادات',

    // Fun Messages
    awesome: 'رائع!',
    greatJob: 'عمل ممتاز!',
    keepItUp: 'استمر!',
    youRock: 'أنت رائع!',
    amazing: 'مذهل!',
    fantastic: 'فانتاستيك!',
    brilliant: 'ذكي جداً!',
    outstanding: 'متفوق!',

    // Dashboard Specific
    male: 'ذكر',
    female: 'أنثى',
    teamSwitchesRemaining: 'تبديلات الفريق المتبقية',
    friendRequests: 'طلبات الأصدقاء',
    dailyInspiration: 'الإلهام اليومي',
    motivationalBibleVerse: 'آية من الكتاب المقدس لتحفيز يومك',
    newVerse: 'آية جديدة',
    download: 'تحميل',
    teamBalanceOverview: 'نظرة عامة على توازن الفرق',

    // Sports Selection
    sportsSelection: 'اختيار الرياضات',
    chooseSportsToParticipate: 'اختر الرياضات التي تريد المشاركة فيها',
    howItWorks: 'كيف يعمل:',
    clickToJoinOrLeave: 'انقر على أي رياضة للانضمام أو المغادرة',
    participateInMultipleSports: 'يمكنك المشاركة في رياضات متعددة',
    changesSavedAutomatically: 'يتم حفظ التغييرات تلقائياً',
    participants: 'مشاركين',
    youreParticipating: 'أنت تشارك!',
    clickToJoin: 'انقر للانضمام',
    yourSports: 'رياضاتك',
    participatingInSports: 'أنت تشارك في',
    noSportsSelectedYet: 'لم يتم اختيار رياضات بعد',
    clickOnAnySportToStart: 'انقر على أي رياضة أعلاه للبدء في المشاركة!',

    // Sport Names and Descriptions
    soccer: 'كرة القدم',
    soccerDescription: 'مباريات كرة القدم الجماعية في الملعب الرياضي',
    dodgeball: 'كرة الطائرة',
    dodgeballDescription: 'ألعاب كرة الطائرة السريعة في الصالة الرياضية',
    chairball: 'كرة الكرسي',
    chairballDescription: 'لعبة كرة فريدة قائمة على الكراسي لجميع المستويات',
    bigGame: 'اللعبة الكبيرة',
    bigGameDescription: 'ألعاب جماعية واسعة النطاق وأنشطة خارجية',
    poolTime: 'وقت السباحة',
    poolTimeDescription: 'أنشطة السباحة والألعاب المائية',

    // Bible Verses and Countdown
    dailyInspirationTitle: 'الإلهام اليومي',
    countdownToCamp: 'العد التنازلي للمؤتمر',
    daysRemaining: 'أيام',
    hoursRemaining: 'ساعات',
    minutesRemaining: 'دقائق',
    secondsRemaining: 'ثواني',
    campStartsIn: 'يبدأ المؤتمر في',

    // Team Rosters and Player Lists
    teamRosters: 'قوائم الفرق',
    players: 'لاعبين',
    yourCurrentTeam: 'فريقك الحالي',
    joinTeam: 'انضم للفريق',
    noPlayersAssigned: 'لا يوجد لاعبين مسجلين',
    genderBalance: 'توازن الجنس:',
    gradeRange: 'نطاق الصف:',
    avgGrade: 'متوسط الصف:',
    gradeDistribution: 'توزيع الصفوف:',
    gradeLimitReached: '* تم الوصول للحد الأقصى للصف',
    switchesRemaining: 'تبديلات متبقية',
    loadingTeamRosters: 'جاري تحميل قوائم الفرق...',
    teamSwitchSuccessful: 'تم تبديل الفريق بنجاح',
    successfullyJoinedTeam: 'لقد انضممت بنجاح لفريق',
    cannotSwitchTeams: 'لا يمكن تبديل الفرق',
    teamSwitchNotAllowed: 'لا يُسمح بتبديل الفريق. قد لا يكون لديك تبديلات متبقية، أو الفرق مقفلة، أو الفريق ممتلئ.',
    failedToSwitchTeams: 'فشل في تبديل الفرق. يرجى المحاولة مرة أخرى.',

    // Bible Verse References
    philippians: 'فيلبي 4: 13',
    jeremiah: 'إرميا 29: 11',
    joshua: 'يشوع 1: 9',
    proverbs: 'أمثال 3: 5-6',
    psalms: 'مزمور 28: 7',
    isaiah: 'إشعياء 40: 31',
    matthew: 'متى 11: 28',
    galatians: 'غلاطية 6: 9',
    romans: 'رومية 8: 28',
    niv: 'ترجمة الحياة الجديدة',
    esv: 'الترجمة الإنجليزية القياسية',
    nasb: 'الترجمة الأمريكية القياسية الجديدة',
    bibleVerseDownloaded: 'تم تحميل صورة الآية الكتابية بنجاح!',

    // Bible Verse Text
    philippiansVerse: 'أستطيع كل شيء في المسيح الذي يقويني.',
    jeremiahVerse: 'لأني أعرف الأفكار التي أنا مفتكر بها نحوكم يقول الرب أفكار سلام لا شر لأعطيكم آخرة ورجاء.',
    joshuaVerse: 'ألم أوصك. تشدد وتشجع. لا ترهب ولا ترتعب لأن الرب إلهك معك حيثما تذهب.',
    proverbsVerse: 'اتكل على الرب بكل قلبك وعلى فهمك لا تعتمد. في كل طرقك اعرفه وهو يمهد طرقك.',
    psalmsVerse: 'الرب قوتي وترسي عليه اتكلت فانصرت وقلبي يبتهج وبتسبيحي أحمده.',
    isaiahVerse: 'أما منتظرو الرب فيجددون قوة. يرفعون أجنحة كالنسور. يركضون ولا يتعبون يمشون ولا يعيون.',
    matthewVerse: 'تعالوا إلي يا جميع المتعبين والثقيلي الأحمال وأنا أريحكم.',
    galatiansVerse: 'فلا نفشل في عمل الخير لأننا سنحصد في وقته إن كنا لا نكل.',
    romansVerse: 'ونحن نعلم أن كل الأشياء تعمل معاً للخير للذين يحبون الله الذين هم مدعوون حسب قصده.',
    psalms23Verse: 'الرب راعيّ فلا يعوزني شيء. في مراع خضر يربضني. إلى مياه الراحة يوردني. يرد نفسي.',

    // Enhanced UI Messages
    welcomeBackMale: 'أهلاً وسهلاً يا بطل! جاهز للعب؟',
    welcomeBackFemale: 'أهلاً وسهلاً يا نجمة! جاهزة للتألق؟',
    welcomeBackAdmin: 'أهلاً وسهلاً يا مدير! كل شيء تحت السيطرة؟',
    morningGreeting: 'صباح الخير! جاهز ليوم رائع؟',
    afternoonGreeting: 'مساء الخير! كيف حال يومك؟',
    eveningGreeting: 'مساء الخير! نختتم يوماً رائعاً؟',
    teamSwitchSuccessMale: 'رائع! انضممت بنجاح للفريق يا بطل!',
    teamSwitchSuccessFemale: 'فانتاستيك! انضممت بنجاح للفريق يا نجمة!',
    participantsCount: '{count} مشارك',
    participantsCountOne: 'مشارك واحد',
    participantsCountMany: '{count} مشاركين',
    switchesRemainingCount: '{count} تبديل متبقي',
    switchesRemainingCountOne: 'تبديل واحد متبقي',
    switchesRemainingCountMany: '{count} تبديلات متبقية',
    loadingWithDots: 'جاري التحميل...',
    errorWithRetry: 'عذراً! حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    successWithExclamation: 'نجح! تم الأمر بنجاح!',
    warningWithAttention: 'تنبيه! يرجى مراجعة التفاصيل.'
  }
}

// Enhanced translation function with interpolation and context support
export const getTranslation = (
  language: Language, 
  key: keyof Translations, 
  context?: TranslationContext
): string => {
  const translation = translations[language][key] || key
  
  if (!context) {
    return translation
  }

  // Handle interpolation for dynamic values
  let result = translation
  
  // Replace {name} with actual name
  if (context.name && result.includes('{name}')) {
    result = result.replace(/{name}/g, context.name)
  }
  
  // Replace {count} with actual count
  if (context.count !== undefined && result.includes('{count}')) {
    result = result.replace(/{count}/g, context.count.toString())
  }

  // Handle gender-specific translations
  if (context.gender) {
    const genderKey = `${key}${context.gender === 'male' ? 'Male' : 'Female'}` as keyof Translations
    if (translations[language][genderKey]) {
      result = translations[language][genderKey]
    }
  }

  // Handle role-specific translations
  if (context.role) {
    const roleKey = `${key}${context.role === 'admin' ? 'Admin' : 'User'}` as keyof Translations
    if (translations[language][roleKey]) {
      result = translations[language][roleKey]
    }
  }

  // Handle time-specific greetings
  if (context.timeOfDay && key === 'welcomeMessage') {
    const timeKey = `${context.timeOfDay}Greeting` as keyof Translations
    if (translations[language][timeKey]) {
      result = translations[language][timeKey]
    }
  }

  return result
}

// Advanced translation function with pluralization support
export const getTranslationWithPlural = (
  language: Language,
  key: keyof Translations,
  count: number,
  context?: TranslationContext
): string => {
  if (count === 1) {
    const singularKey = `${key}One` as keyof Translations
    if (translations[language][singularKey]) {
      return getTranslation(language, singularKey, { ...context, count })
    }
  } else if (count > 1) {
    const pluralKey = `${key}Many` as keyof Translations
    if (translations[language][pluralKey]) {
      return getTranslation(language, pluralKey, { ...context, count })
    }
  }
  
  return getTranslation(language, key, { ...context, count })
}

// Context-aware translation function
export const getContextualTranslation = (
  language: Language,
  key: keyof Translations,
  context: TranslationContext
): string => {
  // Try role-specific translation first
  if (context.role) {
    const roleKey = `${key}${context.role === 'admin' ? 'Admin' : 'User'}` as keyof Translations
    if (translations[language][roleKey]) {
      return getTranslation(language, roleKey, context)
    }
  }

  // Try gender-specific translation
  if (context.gender) {
    const genderKey = `${key}${context.gender === 'male' ? 'Male' : 'Female'}` as keyof Translations
    if (translations[language][genderKey]) {
      return getTranslation(language, genderKey, context)
    }
  }

  // Fall back to base translation
  return getTranslation(language, key, context)
} 