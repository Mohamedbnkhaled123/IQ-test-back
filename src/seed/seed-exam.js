const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');
const Settings = require('../models/settings.model');
const Question = require('../models/question.model');

const S1_TITLE = 'المهارات والتركيز والذاكرة البصرية';
const S2_TITLE = 'الذكاء التخيلي والتفكير المنطقي';
const S3_TITLE = 'الحسابات الذهنية';
const S4_TITLE = 'تحليل الشخصية';

const DEFAULT_SETTINGS = {
  singletonKey: 'GLOBAL_SETTINGS',
  examTitle: 'اختبار الذكاء وتحليل الشخصية (من عمر 25 لما فوق 40 عام)',
  baseExamPrice: 250,
  retakeMultiplier: 2,
  iqScaleMin: 70,
  iqScaleMax: 145,
  iqBands: { lowMax: 89, averageMax: 115 }
};

function makeQuestion(item) {
  return {
    imageUrl: null,
    inputConstraint: 'any',
    points: 0,
    acceptedAnswers: [],
    options: [],
    gridConfig: { rows: 2, cols: 3, correctCellIndex: null },
    canvasConfig: { colors: [], requiredPairs: 4 },
    isActive: true,
    adminNote: '',
    ...item
  };
}

const SECTION_1_QUESTIONS = [
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 1,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 7,
    points: 2,
    imageUrl: '/exam-images/s1_q1_sequence.jpg',
    prompt: 'ما هو العدد التالي؟',
    acceptedAnswers: ['12']
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 2,
    questionType: 'memory_preview',
    inputConstraint: 'any',
    timeLimitSeconds: 15,
    points: 0,
    imageUrl: '/exam-images/s1_q2_memory_preview.jpg',
    prompt: 'تذكر الأماكن جيداً... لديك 15 ثانية لحفظ مواقع الأشكال'
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 3,
    questionType: 'memory_grid',
    inputConstraint: 'any',
    timeLimitSeconds: 7,
    points: 2,
    prompt: 'أين كانت النظارة؟ اختر المربع الصحيح',
    gridConfig: { rows: 2, cols: 3, correctCellIndex: 1 }
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 4,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 7,
    points: 2,
    prompt: 'ما كان بجانب النظارة؟',
    acceptedAnswers: [
      'المفاتيح',
      'مفاتيح',
      'مفتاح',
      'المفتاح',
      'المحفظة',
      'محفظة',
      'المفاتيح والمحفظة',
      'المحفظة والمفاتيح'
    ]
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 5,
    questionType: 'text',
    inputConstraint: 'any',
    timeLimitSeconds: 20,
    points: 2,
    imageUrl: '/exam-images/s1_q3_letter_grid.jpg',
    prompt: 'في أي صف من الأعلى يقع الحرف المختلف؟',
    acceptedAnswers: ['6', 'السادس', 'الصف السادس', 'سادس', 'صف سادس', 'الصف 6', 'صف 6']
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 6,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 15,
    points: 2,
    imageUrl: '/exam-images/s1_q4_triangles.jpg',
    prompt: 'كم عدد المثلثات في الشكل؟',
    acceptedAnswers: ['13']
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 7,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 10,
    points: 2,
    imageUrl: '/exam-images/s1_q5_memory_recall.jpg',
    prompt: 'ماذا كان يوجد هنا؟',
    acceptedAnswers: ['القلم', 'قلم', 'قلم ازرق', 'القلم الازرق', 'قلم جاف']
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 8,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 20,
    points: 2,
    imageUrl: '/exam-images/s1_q6_animals.jpg',
    prompt: 'كم حيوان في الصورة؟',
    acceptedAnswers: ['12']
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 9,
    questionType: 'text',
    inputConstraint: 'any',
    timeLimitSeconds: 15,
    points: 2,
    imageUrl: '/exam-images/s1_q7_overlapping_numbers.jpg',
    prompt: 'اكتب عدد الأرقام أو الأرقام التي تستطيع أن تراها في الصورة؟',
    acceptedAnswers: ['10', '10 ارقام', 'عشرة', 'عشر ارقام', '0123456789', '0 1 2 3 4 5 6 7 8 9']
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 10,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 10,
    points: 2,
    imageUrl: '/exam-images/s1_q8_dots.jpg',
    prompt: 'كم نقطة في الصورة؟',
    acceptedAnswers: ['19']
  }),
  makeQuestion({
    section: 1,
    sectionTitle: S1_TITLE,
    order: 11,
    questionType: 'canvas_connect',
    inputConstraint: 'any',
    timeLimitSeconds: 20,
    points: 2,
    prompt: 'صل الألوان المتشابهة بدون أن تتلامس الخطوط',
    canvasConfig: { colors: ['blue', 'yellow', 'red', 'green'], requiredPairs: 4 }
  })
];

const SECTION_2_QUESTIONS = [
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 1,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 42,
    points: 2,
    prompt:
      'شخصان سقطا داخل مدخنة وعندما خرجا من المدخنة أحدهما اتسخ وجهه والآخر لم يتسخ وجهه. من منهم سيذهب ليغسل وجهه أولاً؟',
    acceptedAnswers: [
      'النظيف',
      'الشخص النظيف',
      'الذي لم يتسخ وجهه',
      'لم يتسخ وجهه',
      'الغير متسخ',
      'اللي وشه نضيف',
      'نظيف'
    ]
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 2,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 42,
    points: 2,
    prompt:
      'إذا دخلت غرفة مظلمة ولديك عود ثقاب وكان هناك انقطاع في التيار الكهربائي في ذلك الوقت وكان هناك شمعة ولمبة كهربائية وحطب، فماذا ستشعل أولاً؟',
    acceptedAnswers: ['عود الثقاب', 'الثقاب', 'عود الكبريت', 'الكبريت', 'كبريت', 'عود ثقاب']
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 3,
    questionType: 'mcq',
    inputConstraint: 'any',
    timeLimitSeconds: 42,
    points: 2,
    prompt:
      'إذا كنت محتجزاً داخل غرفة بها ثلاثة أبواب وقيل لك لديك فرصة للنجاة باختيارك باب واحد فقط من تلك الأبواب، فأي الأبواب ستختار؟',
    options: [
      { key: 'a', label: 'باب من وراءه نار هائلة', isCorrect: false, traitImpacts: [] },
      { key: 'b', label: 'باب من وراءه أسود لم تأكل من سنة', isCorrect: true, traitImpacts: [] },
      { key: 'c', label: 'باب من وراءه قتلة محترفين', isCorrect: false, traitImpacts: [] }
    ]
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 4,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 42,
    points: 2,
    prompt: 'السارق هرب قبل يومين من قبل يوم أمس وغداً هو يوم الخميس، في أي يوم هرب السارق؟',
    acceptedAnswers: ['السبت', 'يوم السبت', 'سبت']
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 5,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 42,
    points: 2,
    prompt:
      'ليس لدي إخوة ولا أخوات ولكن هذا الرجل الموجود في الصورة هو ابن والدي، فمن يكون في الصورة؟',
    acceptedAnswers: [
      'انا',
      'نفسي',
      'نفس الشخص',
      'المتحدث',
      'نفسه',
      'الشخص نفسه',
      'نفس الشخص الذي ينظر للصورة'
    ]
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 6,
    questionType: 'text',
    inputConstraint: 'any',
    timeLimitSeconds: 42,
    points: 2,
    prompt:
      'لدينا 6 بيضات وكنا ثلاثة وكل منا أخذ بيضتين ولكن بقيت بيضتين داخل السلة، فكيف حدث ذلك؟',
    acceptedAnswers: [
      'احدهم اخذ بيضتين في السلة',
      'اخذ السلة',
      'اخذ بيضتين في السلة',
      'الثالث اخذ السلة',
      'الاخير اخذ السلة بالبيضتين',
      'اخذ البيضتين بالسلة',
      'واحد اخد السلة بالبيضتين',
      'اخد بيضتين في السلة'
    ]
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 7,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 42,
    points: 2,
    prompt: 'بيت ليس به أبواب ولا نوافذ، فما هو؟',
    acceptedAnswers: ['بيت الشعر', 'الشعر', 'بيت شعر']
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 8,
    questionType: 'text',
    inputConstraint: 'letters_only',
    timeLimitSeconds: 42,
    points: 2,
    prompt: 'شيء لديه أربع عيون ولا يرى وأربع أرجل ولا يمشي، فما هو؟',
    acceptedAnswers: ['البوتجاز', 'البوتاجاز', 'بوتجاز', 'بوتاجاز', 'الموقد', 'الفرن']
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 9,
    questionType: 'text',
    inputConstraint: 'any',
    timeLimitSeconds: 42,
    points: 2,
    prompt:
      'حارس ليلي ذهب مسرعاً إلى الملك وأبلغه أن لا يسافر غداً بالسفينة لأنه حلم بأن السفينة غرقت وبالفعل صدق الحارس وغرقت السفينة.. فشكر الملك الحارس ثم طرده من العمل... لماذا؟',
    acceptedAnswers: [
      'لانه كان نائما وقت عمله الليلي',
      'لانه نام',
      'نام اثناء العمل',
      'نام في العمل',
      'كان نائم',
      'نائم',
      'لانه كان نائم',
      'نومه اثناء العمل',
      'كان نايم'
    ]
  }),
  makeQuestion({
    section: 2,
    sectionTitle: S2_TITLE,
    order: 10,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 42,
    points: 2,
    prompt: 'لديك 6 بيضات أكلت اثنان وكسرت اثنان وطبخت اثنان، فكم بيضة لديك الآن؟',
    acceptedAnswers: ['4']
  })
];

const SECTION_3_QUESTIONS = [
  makeQuestion({
    section: 3,
    sectionTitle: S3_TITLE,
    order: 1,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 20,
    points: 3,
    imageUrl: '/exam-images/s3_q1_equation.jpg',
    prompt: 'ما هو ناتج العملية الحسابية الآتية؟',
    acceptedAnswers: ['24']
  }),
  makeQuestion({
    section: 3,
    sectionTitle: S3_TITLE,
    order: 2,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 20,
    points: 3,
    prompt: 'خمس آلات تستغرق 5 دقائق لإنتاج 5 قمصان، فكم دقيقة تحتاج 100 آلة لإنتاج 100 قميص؟',
    acceptedAnswers: ['5']
  }),
  makeQuestion({
    section: 3,
    sectionTitle: S3_TITLE,
    order: 3,
    questionType: 'mcq',
    inputConstraint: 'any',
    timeLimitSeconds: 15,
    points: 3,
    prompt: 'كم مرة تكرر رقم 9 في الأرقام من 1 - 100؟',
    options: [
      { key: 'a', label: '10', isCorrect: false, traitImpacts: [] },
      { key: 'b', label: '19', isCorrect: false, traitImpacts: [] },
      { key: 'c', label: '20', isCorrect: true, traitImpacts: [] }
    ]
  }),
  makeQuestion({
    section: 3,
    sectionTitle: S3_TITLE,
    order: 4,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 15,
    points: 3,
    prompt: 'مضرب وكرة ثمنهم 110 ج.. المضرب يزيد عن الكرة بمقدار 100 ج.. فكم ثمن الكرة؟',
    acceptedAnswers: ['5'],
    adminNote: 'مضبوط رياضياً على 5 ويمكن تعديله من لوحة الأدمن'
  }),
  makeQuestion({
    section: 3,
    sectionTitle: S3_TITLE,
    order: 5,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 30,
    points: 3,
    prompt:
      'زهرة نبتت على سطح بحيرة وكانت تتضاعف مساحتها كل يوم لتغطي في النهاية سطح البحيرة بالكامل في 40 يوم. فكم تحتاج من الأيام لتغطي نصف البحيرة؟',
    acceptedAnswers: ['39']
  }),
  makeQuestion({
    section: 3,
    sectionTitle: S3_TITLE,
    order: 6,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 10,
    points: 3,
    prompt: 'ولد عمره 4 سنوات وأخته عمرها نصف عمر أخوها. كم سيكون عمر الأخت عندما يتم أخوها الـ 60 عام؟',
    acceptedAnswers: ['58']
  }),
  makeQuestion({
    section: 3,
    sectionTitle: S3_TITLE,
    order: 7,
    questionType: 'text',
    inputConstraint: 'numbers_only',
    timeLimitSeconds: 120,
    points: 3,
    imageUrl: '/exam-images/s3_q7_lock.jpg',
    prompt: 'أجب عن اللغز الآتي (ما هو الرقم السري للقفل؟)',
    acceptedAnswers: ['093']
  })
];

const SECTION_4_QUESTIONS = [
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 1,
    questionType: 'mcq',
    timeLimitSeconds: 15,
    points: 0,
    prompt:
      'لو كنت مدير لفريق عمل مكون من 5 أشخاص واثنان من أعضاء الفريق سرقوا شيئاً ما، أحدهم سرق والآخر كان يساعده. فالمشكلة تقع في المرتبة الأولى على من؟ ولماذا؟',
    options: [
      {
        key: 'a',
        label: 'على المدير (عليّ أنا) — لأنه لم يضع خطة أو نظاماً للتأمين والرقابة',
        isCorrect: false,
        traitImpacts: [{ traitName: 'المسئولية', traitValue: 'عالية', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'على الأعضاء الآخرين أو السارق ومساعده فقط',
        isCorrect: false,
        traitImpacts: [{ traitName: 'المسئولية', traitValue: 'منخفضة', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 2,
    questionType: 'mcq',
    timeLimitSeconds: 10,
    points: 0,
    prompt:
      'لو كنت صاحب القرار في موضوع ما خاص بك فقط وكان رأيك هو الصواب بناءً على خبرتك وجاء أحدهم أصغر في العمر يقترح عليك رأياً آخر.. ماذا ستفعل معه؟',
    options: [
      {
        key: 'a',
        label: 'سأستمع إليه باهتمام — فإما أن أستفيد منه أو أفيده',
        isCorrect: false,
        traitImpacts: [
          { traitName: 'اتخاذ القرار', traitValue: 'يستمع للآخرين', priority: 'primary' },
          { traitName: 'التمركز حول الذات', traitValue: 'منخفض', priority: 'fallback' }
        ]
      },
      {
        key: 'b',
        label: 'سأنهره أو أرفض رأيه لأنني صاحب القرار والخبرة',
        isCorrect: false,
        traitImpacts: [
          { traitName: 'اتخاذ القرار', traitValue: 'فردي', priority: 'primary' },
          { traitName: 'التمركز حول الذات', traitValue: 'عالي', priority: 'fallback' }
        ]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 3,
    questionType: 'mcq',
    timeLimitSeconds: 5,
    points: 0,
    isActive: false,
    adminNote: 'سؤال حركي — معطل افتراضياً',
    prompt: 'ارسم حرف Q على جبينك ثم ارسم حرف L (في أي اتجاه ترسمه ليُقرأ صحيحاً؟)',
    options: [
      {
        key: 'a',
        label: 'في اتجاه الشخص المقابل لي (الفاحص) ليتمكن من قراءته',
        isCorrect: false,
        traitImpacts: [{ traitName: 'التمركز حول الذات', traitValue: 'منخفض', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'في اتجاهي أنا (لأقرأه بنفسي)',
        isCorrect: false,
        traitImpacts: [{ traitName: 'التمركز حول الذات', traitValue: 'عالي', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 4,
    questionType: 'mcq',
    timeLimitSeconds: 10,
    points: 0,
    prompt:
      'لو كنت تمشي في أحد الشوارع وجاء شخص يعرض عليك أن تختار: تأخذ 100 دولار وعدوك 10 دولارات، أو أن تأخذ 1000 دولار وعدوك مليون دولار؟',
    options: [
      {
        key: 'a',
        label: 'أختار 1000 دولار وعدوي مليون دولار (المهم مصلحتي الأكبر)',
        isCorrect: false,
        traitImpacts: [{ traitName: 'المسيطر على الشخصية', traitValue: 'العقل', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'أختار 100 دولار وعدوي 10 دولارات (حتى لا يستفيد عدوي)',
        isCorrect: false,
        traitImpacts: [{ traitName: 'المسيطر على الشخصية', traitValue: 'المشاعر', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 5,
    questionType: 'mcq',
    timeLimitSeconds: 20,
    points: 0,
    isActive: false,
    adminNote: 'سؤال حركي — معطل افتراضياً',
    prompt: 'أوجد حل تلك المسألة الحسابية ثم اشرح كيف أجبتها: 6 + 6 - 8 + 32 =',
    options: [
      {
        key: 'a',
        label: 'الناتج 36 — وأشرح خطوات الحل في اتجاه المستمع لتوضيحها له',
        isCorrect: false,
        traitImpacts: [{ traitName: 'التمركز حول الذات', traitValue: 'منخفض', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'الناتج 36 — وأشرح خطوات الحل لنفسي أو أركز على طريقتي الخاصة فقط',
        isCorrect: false,
        traitImpacts: [{ traitName: 'التمركز حول الذات', traitValue: 'عالي', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 6,
    questionType: 'mcq',
    timeLimitSeconds: 20,
    points: 0,
    prompt: 'كيف تشرح طبيعة عملك لطفل في عمر الـ 6 سنوات؟',
    options: [
      {
        key: 'a',
        label: 'أستخدم التبسيط والأمثلة القريبة من عالم الطفل (مثل لعبة أو قصة بسيطة)',
        isCorrect: false,
        traitImpacts: [{ traitName: 'التعبير الكتابي', traitValue: 'عالي', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'أشرحه بالمصطلحات المهنية المعتادة أو أرى أنه لن يفهمه في هذا العمر',
        isCorrect: false,
        traitImpacts: [{ traitName: 'التعبير الكتابي', traitValue: 'منخفض', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 7,
    questionType: 'mcq',
    timeLimitSeconds: 15,
    points: 0,
    prompt: 'هل تفضل الهدوء أم التجمعات؟ وماذا ستفعل لو فُرض عليك عكس ما تفضل؟',
    options: [
      {
        key: 'a',
        label: 'أفضل الهدوء — ولو فُرض عليّ التجمع سأتأقلم وأبقى وأندمج',
        isCorrect: false,
        traitImpacts: [{ traitName: 'الذكاء', traitValue: 'اجتماعي', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'أفضل الهدوء — ولو فُرض عليّ التجمع سأغادر المكان',
        isCorrect: false,
        traitImpacts: [{ traitName: 'الذكاء', traitValue: 'شخصي', priority: 'primary' }]
      },
      {
        key: 'c',
        label: 'أفضل التجمعات — ولو فُرض عليّ الهدوء سأتأقلم وأبقى',
        isCorrect: false,
        traitImpacts: [{ traitName: 'الذكاء', traitValue: 'اجتماعي', priority: 'primary' }]
      },
      {
        key: 'd',
        label: 'أفضل التجمعات — ولو فُرض عليّ الهدوء سأغادر المكان',
        isCorrect: false,
        traitImpacts: [{ traitName: 'الذكاء', traitValue: 'شخصي', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 8,
    questionType: 'mcq',
    timeLimitSeconds: 15,
    points: 0,
    prompt: 'ماذا ستفعل إن اضطررت أن تنتظر شخصاً ما ساعة زائدة عن ميعاده الأصلي؟',
    options: [
      {
        key: 'a',
        label: 'أجلس وأستغل الوقت في إنجاز شيء مفيد أو قراءة أو متابعة عملي',
        isCorrect: false,
        traitImpacts: [{ traitName: 'المواقف الطارئة', traitValue: 'استغلال الفرص', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'أغادر فوراً لأنني ملتزم بوقتي ومواعيدي المحددة',
        isCorrect: false,
        traitImpacts: [{ traitName: 'المواقف الطارئة', traitValue: 'محدد', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 9,
    questionType: 'mcq',
    timeLimitSeconds: 15,
    points: 0,
    prompt: 'اوصف نفسك في 3 كلمات:',
    options: [
      {
        key: 'a',
        label: 'أذكر صفات متوازنة وأعترف بوجود عيب أو نقطة أعمل على تطويرها (صريح ومتواضع)',
        isCorrect: false,
        traitImpacts: [{ traitName: 'نوع الشخصية', traitValue: 'متواضعة', priority: 'primary' }]
      },
      {
        key: 'b',
        label: 'أذكر 3 صفات مثالية وقوية تبرز تفوقي التام بدون أي عيوب',
        isCorrect: false,
        traitImpacts: [{ traitName: 'نوع الشخصية', traitValue: 'مغرورة', priority: 'primary' }]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 10,
    questionType: 'mcq',
    timeLimitSeconds: 15,
    points: 0,
    prompt: 'إذا كنت مدعواً في حفل زفاف لابنة مديرك وطفل سكب على ملابسك مشروب فراولة، فماذا ستفعل؟',
    options: [
      {
        key: 'a',
        label: 'لن أنزعج وسأتعامل بهدوء وابتسامة مع الموقف وأنظف ملابسي',
        isCorrect: false,
        traitImpacts: [
          { traitName: 'الثبات الانفعالي', traitValue: 'عالي', priority: 'primary' },
          { traitName: 'المسيطر على الشخصية', traitValue: 'العقل', priority: 'primary' }
        ]
      },
      {
        key: 'b',
        label: 'سأنزعج وأغضب من الطفل أو أهله وقد أفسد مزاجي أو أغادر',
        isCorrect: false,
        traitImpacts: [
          { traitName: 'الثبات الانفعالي', traitValue: 'منخفض', priority: 'primary' },
          { traitName: 'المسيطر على الشخصية', traitValue: 'المشاعر', priority: 'primary' }
        ]
      }
    ]
  }),
  makeQuestion({
    section: 4,
    sectionTitle: S4_TITLE,
    order: 11,
    questionType: 'mcq',
    timeLimitSeconds: 20,
    points: 0,
    prompt:
      'إذا كنت تناقش شخصاً عزيزاً عليك واحتد بينكما النقاش وكنت على الحق، فهل ستنهي النقاش أم ستكمل معه النقاش لإثبات وجهة نظرك؟',
    options: [
      {
        key: 'a',
        label: 'أنهي النقاش باحترام حفاظاً على علاقتي بالشخص العزيز',
        isCorrect: false,
        traitImpacts: [
          { traitName: 'تقدير الآخرين', traitValue: 'عالي', priority: 'primary' },
          { traitName: 'المسيطر على الشخصية', traitValue: 'العقل', priority: 'primary' },
          { traitName: 'التمركز حول الذات', traitValue: 'منخفض', priority: 'fallback' }
        ]
      },
      {
        key: 'b',
        label: 'أواصل النقاش حتى أثبت أن وجهة نظري هي الصحيحة',
        isCorrect: false,
        traitImpacts: [
          { traitName: 'تقدير الآخرين', traitValue: 'منخفض', priority: 'primary' },
          { traitName: 'المسيطر على الشخصية', traitValue: 'المشاعر', priority: 'primary' },
          { traitName: 'التمركز حول الذات', traitValue: 'عالي', priority: 'fallback' }
        ]
      }
    ]
  })
];

const EXAM_QUESTIONS = [
  ...SECTION_1_QUESTIONS,
  ...SECTION_2_QUESTIONS,
  ...SECTION_3_QUESTIONS,
  ...SECTION_4_QUESTIONS
];

async function seedExam() {
  const settings = await Settings.findOneAndUpdate(
    { singletonKey: DEFAULT_SETTINGS.singletonKey },
    { $set: DEFAULT_SETTINGS },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const ops = EXAM_QUESTIONS.map((q) => ({
    updateOne: {
      filter: { section: q.section, order: q.order },
      update: { $set: q },
      upsert: true
    }
  }));

  await Question.bulkWrite(ops);
  const validKeys = EXAM_QUESTIONS.map((q) => ({ section: q.section, order: q.order }));
  await Question.deleteMany({ $nor: validKeys });

  return { settings, questionsCount: EXAM_QUESTIONS.length };
}

async function runCli() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  await connectDB();
  try {
    const result = await seedExam();
    console.log(
      `Seed completed: settings=${result.settings.singletonKey}, questions=${result.questionsCount}`
    );
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { DEFAULT_SETTINGS, EXAM_QUESTIONS, seedExam };
