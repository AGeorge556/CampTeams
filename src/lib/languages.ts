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

  // Rules & Agreement
  rulesAndAgreement: string
  aboutPlatform: string
  teamSwitchingConcept: string
  teamSwitchingLimitations: string
  teamBalanceLimits: string
  generalCampRules: string
  respectForOthers: string
  teamworkAndFairPlay: string
  additionalGuidelines: string
  agreeToRules: string
  continueToCamp: string
  agreementRequired: string
  mustAgreeToRules: string
  readAndAgreeToRules: string
  platformDescription: string
  teamSwitchingDescription: string
  teamSwitchingDeadlineDescription: string
  teamBalanceDescription: string
  respectRule1: string
  respectRule2: string
  respectRule3: string
  respectRule4: string
  respectRule5: string
  teamworkRule1: string
  teamworkRule2: string
  teamworkRule3: string
  teamworkRule4: string
  teamworkRule5: string
  additionalRule1: string
  additionalRule2: string
  additionalRule3: string
  additionalRule4: string
  additionalRule5: string
  additionalRule6: string
  agreementDescription: string

  settings: string
  hideSchedule: string
  showSchedule: string
  scheduleVisibility: string
  scheduleMakingInProgress: string
  oilExtractionVisibility: string
  hideOilExtraction: string
  showOilExtraction: string
  oilExtractionHidden: string
  oilExtractionVisible: string
  galleryVisibility: string
  hideGallery: string
  showGallery: string
  galleryHidden: string
  galleryVisible: string

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
  genderBalanced: string
  genderUnbalanced: string
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
  genderBalanceLimitReached: string
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

  // Gallery
  gallery: string
  uploadPhotos: string
  mySubmissions: string
  publicGallery: string
  photoModeration: string
  uploadPhoto: string
  selectPhotos: string
  addCaption: string
  submitPhotos: string
  photoUploaded: string
  photoApproved: string
  photoRejected: string
  photoDeleted: string
  pendingApproval: string
  approvedPhotos: string
  rejectedPhotos: string
  allPhotos: string
  approvePhoto: string
  rejectPhoto: string
  deletePhoto: string
  downloadPhoto: string
  noPhotosYet: string
  noPhotosFound: string
  uploadLimitReached: string
  fileTooLarge: string
  invalidFileType: string
  uploadSuccess: string
  uploadError: string
  moderationSuccess: string
  moderationError: string
  photoDetails: string
  uploadedBy: string
  submittedOn: string
  reviewedBy: string
  reviewedOn: string
  filterByStatus: string
  filterByTeam: string
  filterByUser: string
  clearFilters: string
  galleryStats: string
  totalPhotos: string
  pendingCount: string
  approvedCount: string
  rejectedCount: string
  totalUsers: string
  dailyUploadLimit: string
  uploadsRemaining: string
  photoPreview: string
  closePreview: string
  nextPhoto: string
  previousPhoto: string
  confirmDelete: string
  deletePhotoConfirm: string
  deletePhotoWarning: string
  cancelDelete: string
  confirmDeletePhoto: string
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

    // Rules & Agreement
    rulesAndAgreement: 'Camp Rules & Agreement',
    aboutPlatform: 'About This Platform',
    teamSwitchingConcept: 'Team Switching Concept',
    teamSwitchingLimitations: 'Team Switching Deadline',
    teamBalanceLimits: 'Team Balance Limits',
    generalCampRules: 'General Camp Rules',
    respectForOthers: 'Respect for Others',
    teamworkAndFairPlay: 'Teamwork & Fair Play',
    additionalGuidelines: 'Additional Guidelines',
    agreeToRules: 'I have read and agree to follow the camp rules',
    continueToCamp: 'Continue to Camp',
    agreementRequired: 'Agreement Required',
    mustAgreeToRules: 'You must read and agree to the camp rules before you can continue to the platform.',
    readAndAgreeToRules: 'Please read and agree to the following rules before joining the camp',
    platformDescription: 'Welcome to CampTeams - our summer camp team management platform! This website is designed to help organize and manage team assignments for our summer camp activities.',
    teamSwitchingDescription: 'We understand that friendships and preferences may change during camp. That\'s why we allow each camper to switch teams up to 3 times during the camp session. This flexibility helps ensure everyone can enjoy their camp experience with their preferred group.',
    teamSwitchingDeadlineDescription: 'You have 3 team switches available until one week before camp starts. After that, teams will be finalized and no switching will be allowed. This ensures proper planning and team stability for the camp experience.',
    teamBalanceDescription: 'To maintain fair and balanced teams, we have specific limits in place: maximum 4 players per grade per team, and we strive to maintain equal gender distribution across all teams. These limits help ensure everyone has a great experience and teams remain competitive and inclusive.',
    respectRule1: 'Treat all campers and staff with kindness and respect',
    respectRule2: 'Use appropriate language and behavior at all times',
    respectRule3: 'Respect personal space and boundaries',
    respectRule4: 'Listen when others are speaking',
    respectRule5: 'Be inclusive and welcoming to everyone',
    teamworkRule1: 'Work together as a team during all activities',
    teamworkRule2: 'Follow the rules of all games and competitions',
    teamworkRule3: 'Accept wins and losses with good sportsmanship',
    teamworkRule4: 'Support and encourage your teammates',
    teamworkRule5: 'Participate actively in team activities',
    additionalRule1: 'Follow all safety instructions and camp procedures',
    additionalRule2: 'Keep your personal belongings organized and secure',
    additionalRule3: 'Report any concerns or issues to camp staff immediately',
    additionalRule4: 'Be on time for all scheduled activities and meals',
    additionalRule5: 'Help keep camp facilities clean and tidy',
    additionalRule6: 'Use technology responsibly and follow camp device policies',
    agreementDescription: 'By checking this box, I acknowledge that I have read, understood, and agree to follow all the camp rules and guidelines outlined above. I understand that failure to follow these rules may result in appropriate consequences as determined by camp staff.',
    settings: 'Settings',
    hideSchedule: 'Hide Schedule',
    showSchedule: 'Show Schedule',
    scheduleVisibility: 'Schedule Visibility',
    scheduleMakingInProgress: 'Schedule making in progress...',
    oilExtractionVisibility: 'Oil Extraction Visibility',
    hideOilExtraction: 'Hide Oil Extraction',
    showOilExtraction: 'Show Oil Extraction',
    oilExtractionHidden: 'Oil extraction tab is hidden from campers',
    oilExtractionVisible: 'Oil extraction tab is visible to campers',
    galleryVisibility: 'Gallery Visibility',
    hideGallery: 'Hide Gallery',
    showGallery: 'Show Gallery',
    galleryHidden: 'Gallery tab is hidden from campers',
    galleryVisible: 'Gallery tab is visible to campers',

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
    genderBalanced: 'Balanced',
    genderUnbalanced: 'Unbalanced',
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
    genderBalanceLimitReached: 'Gender balance limit reached. Teams must maintain equal gender distribution.',
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
    warningWithAttention: 'Attention! Please check the details.',

    // Gallery
    gallery: 'Gallery',
    uploadPhotos: 'Upload Photos',
    mySubmissions: 'My Submissions',
    publicGallery: 'Public Gallery',
    photoModeration: 'Photo Moderation',
    uploadPhoto: 'Upload Photo',
    selectPhotos: 'Select Photos',
    addCaption: 'Add Caption (Optional)',
    submitPhotos: 'Submit Photos',
    photoUploaded: 'Photo uploaded successfully!',
    photoApproved: 'Photo approved successfully!',
    photoRejected: 'Photo rejected successfully!',
    photoDeleted: 'Photo deleted successfully!',
    pendingApproval: 'Pending Approval',
    approvedPhotos: 'Approved Photos',
    rejectedPhotos: 'Rejected Photos',
    allPhotos: 'All Photos',
    approvePhoto: 'Approve Photo',
    rejectPhoto: 'Reject Photo',
    deletePhoto: 'Delete Photo',
    downloadPhoto: 'Download Photo',
    noPhotosYet: 'No photos uploaded yet',
    noPhotosFound: 'No photos found',
    uploadLimitReached: 'Daily upload limit reached (10 photos per day)',
    fileTooLarge: 'File size must be less than 5MB',
    invalidFileType: 'Only image files are allowed (JPEG, PNG, GIF, WebP)',
    uploadSuccess: 'Photos uploaded successfully!',
    uploadError: 'Failed to upload photos',
    moderationSuccess: 'Photo moderated successfully!',
    moderationError: 'Failed to moderate photo',
    photoDetails: 'Photo Details',
    uploadedBy: 'Uploaded by',
    submittedOn: 'Submitted on',
    reviewedBy: 'Reviewed by',
    reviewedOn: 'Reviewed on',
    filterByStatus: 'Filter by Status',
    filterByTeam: 'Filter by Team',
    filterByUser: 'Filter by User',
    clearFilters: 'Clear Filters',
    galleryStats: 'Gallery Statistics',
    totalPhotos: 'Total Photos',
    pendingCount: 'Pending',
    approvedCount: 'Approved',
    rejectedCount: 'Rejected',
    totalUsers: 'Total Users',
    dailyUploadLimit: 'Daily Upload Limit',
    uploadsRemaining: 'uploads remaining',
    photoPreview: 'Photo Preview',
    closePreview: 'Close Preview',
    nextPhoto: 'Next Photo',
    previousPhoto: 'Previous Photo',
    confirmDelete: 'Confirm Delete',
    deletePhotoConfirm: 'Are you sure you want to delete this photo?',
    deletePhotoWarning: 'This action cannot be undone.',
    cancelDelete: 'Cancel',
    confirmDeletePhoto: 'Delete Photo'
  },
  ar: {
    // Navigation
    dashboard: 'اللوحة الرئيسية',
    attendance: 'الحضور',
    schedule: 'البرنامج',
    teams: 'الرياضة',
    admin: 'الإدارة',
    profile: 'البروفايل',
    logout: 'تسجيل خروج',

    // Common Actions
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    create: 'إنشاء',
    update: 'تحديث',
    loading: 'جاري التحميل...',
    error: 'عذراً! في مشكلة حصلت',
    success: 'ممتاز! تم بنجاح',
    warning: 'تنبيه! خلي بالك',

    // Auth
    login: 'دخول',
    signup: 'حساب جديد',
    email: 'الإيميل',
    password: 'الباسورد',
    forgotPassword: 'نسيت الباسورد؟',
    welcomeBack: 'أهلاً وسهلاً يا حبيبي!',
    createAccount: 'حساب جديد',

    // Dashboard
    welcomeMessage: 'أهلاً وسهلاً يا بطل! جاهز ليوم حلو؟',
    welcomeMessageWithName: 'أهلاً وسهلاً يا {name}! جاهز ليوم حلو؟',
    todaySessions: 'فعاليات النهاردة',
    myAttendance: 'حضوري',
    teamStatus: 'حالة الفريق',
    quickActions: 'أعمال سريعة',

    // Attendance
    checkIn: 'تسجيل حضور',
    checkOut: 'تسجيل انصراف',
    attendanceStatus: 'حالة الحضور',
    present: 'حاضر',
    absent: 'غايب',
    late: 'متأخر',
    excused: 'معذور',
    attendanceHistory: 'سجل الحضور',

    // Schedule
    campSchedule: 'جدول المؤتمر',
    sessionDetails: 'تفاصيل الجلسة',
    startTime: 'وقت البداية',
    endTime: 'وقت النهاية',
    location: 'المكان',
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
    userManagement: 'إدارة الناس',
    sessionManagement: 'إدارة الجلسات',
    reports: 'التقارير',

    // Rules & Agreement
    rulesAndAgreement: 'قواعد المؤتمر والاتفاقية',
    aboutPlatform: 'عن البرنامج ده',
    teamSwitchingConcept: 'فكرة تبديل الفرق',
    teamSwitchingLimitations: 'آخر موعد لتبديل الفرق',
    teamBalanceLimits: 'حدود توازن الفرق',
    generalCampRules: 'قواعد المؤتمر العامة',
    respectForOthers: 'احترام الناس',
    teamworkAndFairPlay: 'العمل الجماعي واللعب العادل',
    additionalGuidelines: 'إرشادات إضافية',
    agreeToRules: 'قرأت وموافق على قواعد المؤتمر',
    continueToCamp: 'كمل للمؤتمر',
    agreementRequired: 'الاتفاقية مطلوبة',
    mustAgreeToRules: 'لازم تقرأ وتوافق على قواعد المؤتمر قبل ما تكمل للمؤتمر.',
    readAndAgreeToRules: 'اقرأ ووافق على القواعد دي قبل ما تنضم للمؤتمر',
    platformDescription: 'أهلاً وسهلاً في كامبتيمز - منصة إدارة فرق المؤتمر الصيفي! البرنامج ده مصمم لتنظيم وإدارة تعيينات الفرق لأنشطة المؤتمر الصيفي.',
    teamSwitchingDescription: 'فاهمين إن الصداقات والتفضيلات ممكن تتغير خلال المؤتمر. عشان كده بنسمح لكل مشارك يبدل الفرق لحد 3 مرات خلال فترة المؤتمر. المرونة دي بتساعد إن الكل يستمتع بتجربة المؤتمر مع المجموعة المفضلة.',
    teamSwitchingDeadlineDescription: 'عندك 3 تبديلات فرق متاحة لحد أسبوع قبل ما المؤتمر يبدأ. بعد كده الفرق هتتثبت ومش هيبقى في تبديل. ده بيضمن التخطيط السليم واستقرار الفرق لتجربة المؤتمر.',
    teamBalanceDescription: 'للمحافظة على فرق عادلة ومتوازنة، عندنا حدود محددة: أقصى 4 لاعبين لكل صف في كل فريق، وبنحاول نحافظ على توزيع متساوي للجنس في كل الفرق. الحدود دي بتساعد إن الكل ياخد تجربة حلوة والفرق تفضل تنافسية وشاملة.',
    respectRule1: 'عامل كل المشاركين والقادة باللطف والاحترام',
    respectRule2: 'استخدم لغة وسلوك مناسب في كل الأوقات',
    respectRule3: 'احترم المساحة الشخصية والحدود',
    respectRule4: 'اسمع لما حد تاني بيتكلم',
    respectRule5: 'كن شامل ومرحب بالكل',
    teamworkRule1: 'اعمل مع الفريق في كل الأنشطة',
    teamworkRule2: 'اتبع قواعد كل الألعاب والمسابقات',
    teamworkRule3: 'تقبل الفوز والخسارة بروح رياضية',
    teamworkRule4: 'ساند وشجع زمايلك في الفريق',
    teamworkRule5: 'شارك بنشاط في أنشطة الفريق',
    additionalRule1: 'اتبع كل تعليمات الأمان وإجراءات المؤتمر',
    additionalRule2: 'حافظ على ممتلكاتك الشخصية منظمة وآمنة',
    additionalRule3: 'بلغ عن أي مخاوف أو مشاكل لقادة المؤتمر فوراً',
    additionalRule4: 'كون في الموعد لكل الأنشطة والوجبات المجدولة',
    additionalRule5: 'ساعد في الحفاظ على مرافق المؤتمر نظيفة ومنظمة',
    additionalRule6: 'استخدم التكنولوجيا بمسؤولية واتبع سياسات الأجهزة',
    agreementDescription: 'بالتأكيد على الصندوق ده، أنا أقر وأفهم وأوافق على اتباع كل قواعد وإرشادات المؤتمر المذكورة أعلاه. أفهم إن عدم اتباع هذه القواعد قد يؤدي إلى عواقب مناسبة حسب تقدير قادة المؤتمر.',

    settings: 'الإعدادات',
    hideSchedule: 'إخفاء البرنامج',
    showSchedule: 'إظهار البرنامج',
    scheduleVisibility: 'رؤية البرنامج',
    scheduleMakingInProgress: 'جاري إعداد البرنامج...',
    oilExtractionVisibility: 'رؤية استخراج النفط',
    hideOilExtraction: 'إخفاء استخراج النفط',
    showOilExtraction: 'إظهار استخراج النفط',
    oilExtractionHidden: 'تبويب استخراج النفط مخفي من المشاركين',
    oilExtractionVisible: 'تبويب استخراج النفط مرئي للمشاركين',
    galleryVisibility: 'رؤية المعرض',
    hideGallery: 'إخفاء المعرض',
    showGallery: 'إظهار المعرض',
    galleryHidden: 'تبويب المعرض مخفي من المشاركين',
    galleryVisible: 'تبويب المعرض مرئي للمشاركين',

    // Fun Messages
    awesome: 'جامد!',
    greatJob: 'عمل حلو!',
    keepItUp: 'كمل!',
    youRock: 'أنت جامد!',
    amazing: 'مذهل!',
    fantastic: 'فانتاستيك!',
    brilliant: 'ذكي جداً!',
    outstanding: 'متفوق!',

    // Dashboard Specific
    male: 'ولد',
    female: 'بنت',
    teamSwitchesRemaining: 'تبديلات الفريق المتبقية',

    dailyInspiration: 'الإلهام اليومي',
    motivationalBibleVerse: 'آية من الكتاب المقدس لتحفيز يومك',
    newVerse: 'آية جديدة',
    download: 'تحميل',
    teamBalanceOverview: 'نظرة عامة على توازن الفرق',

    // Sports Selection
    sportsSelection: 'اختيار الرياضة',
    chooseSportsToParticipate: 'اختر الرياضة اللي عايز تلعبها',
    howItWorks: 'كيفية العمل:',
    clickToJoinOrLeave: 'اضغط على أي رياضة للانضمام أو المغادرة',
    participateInMultipleSports: 'تقدر تلعب رياضات كتير',
    changesSavedAutomatically: 'التغييرات بتتسجل تلقائياً',
    participants: 'مشاركين',
    youreParticipating: 'أنت مشارك!',
    clickToJoin: 'اضغط للانضمام',
    yourSports: 'رياضتك',
    participatingInSports: 'أنت مشارك في',
    noSportsSelectedYet: 'مفيش رياضة مختارة لسه',
    clickOnAnySportToStart: 'اضغط على أي رياضة فوق للبدء في المشاركة!',

    // Sport Names and Descriptions
    soccer: 'كرة القدم',
    soccerDescription: 'مباريات كرة القدم الجماعية في الملعب',
    dodgeball: 'كرة الطائرة',
    dodgeballDescription: 'ألعاب كرة الطائرة السريعة في الجيم',
    chairball: 'كرة الكرسي',
    chairballDescription: 'لعبة كرة فريدة بالكراسي لجميع المستويات',
    bigGame: 'اللعبة الكبيرة',
    bigGameDescription: 'ألعاب جماعية كبيرة وأنشطة برة',
    poolTime: 'وقت السباحة',
    poolTimeDescription: 'أنشطة السباحة والألعاب المائية',

    // Bible Verses and Countdown
    dailyInspirationTitle: 'الإلهام اليومي',
    countdownToCamp: 'العد التنازلي للمؤتمر',
    daysRemaining: 'أيام',
    hoursRemaining: 'ساعات',
    minutesRemaining: 'دقائق',
    secondsRemaining: 'ثواني',
    campStartsIn: 'المؤتمر هيبدأ في',

    // Team Rosters and Player Lists
    teamRosters: 'قوائم الفرق',
    players: 'لاعبين',
    yourCurrentTeam: 'فريقك دلوقتي',
    joinTeam: 'انضم للفريق',
    noPlayersAssigned: 'مفيش لاعبين مسجلين',
    genderBalance: 'توازن الجنس:',
    genderBalanced: 'متوازن',
    genderUnbalanced: 'غير متوازن',
    gradeRange: 'نطاق الصف:',
    avgGrade: 'متوسط الصف:',
    gradeDistribution: 'توزيع الصفوف:',
    gradeLimitReached: '* تم الوصول للحد الأقصى للصف',
    switchesRemaining: 'تبديلات متبقية',
    loadingTeamRosters: 'جاري تحميل قوائم الفرق...',
    teamSwitchSuccessful: 'تم تبديل الفريق بنجاح',
    successfullyJoinedTeam: 'انضممت بنجاح لفريق',
    cannotSwitchTeams: 'مش تقدر تبدل الفرق',
    teamSwitchNotAllowed: 'مش مسموح تبديل الفريق. ممكن ميكونش عندك تبديلات متبقية، أو الفرق مقفلة، أو الفريق ممتلئ.',
    genderBalanceLimitReached: 'تم الوصول للحد الأقصى لتوازن الجنس. الفرق لازم تحافظ على توزيع متساوي للجنس.',
    failedToSwitchTeams: 'فشل في تبديل الفرق. حاول تاني.',

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
    bibleVerseDownloaded: 'تم تحميل صورة الآية بنجاح!',

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
    welcomeBackAdmin: 'أهلاً وسهلاً يا مدير! كل حاجة تحت السيطرة؟',
    morningGreeting: 'صباح الخير! جاهز ليوم حلو؟',
    afternoonGreeting: 'مساء الخير! إزاي يومك؟',
    eveningGreeting: 'مساء الخير! نختتم يوم حلو؟',
    teamSwitchSuccessMale: 'جامد! انضممت بنجاح للفريق يا بطل!',
    teamSwitchSuccessFemale: 'فانتاستيك! انضممت بنجاح للفريق يا نجمة!',
    participantsCount: '{count} مشارك',
    participantsCountOne: 'مشارك واحد',
    participantsCountMany: '{count} مشاركين',
    switchesRemainingCount: '{count} تبديل متبقي',
    switchesRemainingCountOne: 'تبديل واحد متبقي',
    switchesRemainingCountMany: '{count} تبديلات متبقية',
    loadingWithDots: 'جاري التحميل...',
    errorWithRetry: 'عذراً! في مشكلة حصلت. حاول تاني.',
    successWithExclamation: 'نجح! تم بنجاح!',
    warningWithAttention: 'تنبيه! راجع التفاصيل.',

    // Gallery
    gallery: 'المعرض',
    uploadPhotos: 'رفع الصور',
    mySubmissions: 'صوري المرفوعة',
    publicGallery: 'المعرض العام',
    photoModeration: 'مراجعة الصور',
    uploadPhoto: 'رفع صورة',
    selectPhotos: 'اختر الصور',
    addCaption: 'أضف وصف (اختياري)',
    submitPhotos: 'إرسال الصور',
    photoUploaded: 'تم رفع الصورة بنجاح!',
    photoApproved: 'تمت الموافقة على الصورة!',
    photoRejected: 'تم رفض الصورة!',
    photoDeleted: 'تم حذف الصورة!',
    pendingApproval: 'في انتظار الموافقة',
    approvedPhotos: 'الصور المعتمدة',
    rejectedPhotos: 'الصور المرفوضة',
    allPhotos: 'كل الصور',
    approvePhoto: 'الموافقة على الصورة',
    rejectPhoto: 'رفض الصورة',
    deletePhoto: 'حذف الصورة',
    downloadPhoto: 'تحميل الصورة',
    noPhotosYet: 'لم يتم رفع صور بعد',
    noPhotosFound: 'لم يتم العثور على صور',
    uploadLimitReached: 'تم الوصول للحد الأقصى اليومي (10 صور في اليوم)',
    fileTooLarge: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت',
    invalidFileType: 'يُسمح فقط بملفات الصور (JPEG, PNG, GIF, WebP)',
    uploadSuccess: 'تم رفع الصور بنجاح!',
    uploadError: 'فشل في رفع الصور',
    moderationSuccess: 'تمت مراجعة الصورة بنجاح!',
    moderationError: 'فشل في مراجعة الصورة',
    photoDetails: 'تفاصيل الصورة',
    uploadedBy: 'رفع بواسطة',
    submittedOn: 'تم الإرسال في',
    reviewedBy: 'راجع بواسطة',
    reviewedOn: 'تمت المراجعة في',
    filterByStatus: 'تصفية حسب الحالة',
    filterByTeam: 'تصفية حسب الفريق',
    filterByUser: 'تصفية حسب المستخدم',
    clearFilters: 'مسح التصفية',
    galleryStats: 'إحصائيات المعرض',
    totalPhotos: 'إجمالي الصور',
    pendingCount: 'في الانتظار',
    approvedCount: 'معتمد',
    rejectedCount: 'مرفوض',
    totalUsers: 'إجمالي المستخدمين',
    dailyUploadLimit: 'الحد الأقصى اليومي للرفع',
    uploadsRemaining: 'رفع متبقي',
    photoPreview: 'معاينة الصورة',
    closePreview: 'إغلاق المعاينة',
    nextPhoto: 'الصورة التالية',
    previousPhoto: 'الصورة السابقة',
    confirmDelete: 'تأكيد الحذف',
    deletePhotoConfirm: 'هل أنت متأكد من حذف هذه الصورة؟',
    deletePhotoWarning: 'لا يمكن التراجع عن هذا الإجراء.',
    cancelDelete: 'إلغاء',
    confirmDeletePhoto: 'حذف الصورة'
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