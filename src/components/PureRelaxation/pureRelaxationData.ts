export type PureRelaxationMedia = {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  tag: string;
};

export type PureRelaxationDuration = {
  label: string;
  price: number;
  id?: string;
};

export type PureRelaxationPrivilege = {
  title: string;
  copy: string;
  image: string;
  time: string;
};

export type PureRelaxationVariant = {
  name: string;
  subtitle: string;
  media: PureRelaxationMedia;
  durations: PureRelaxationDuration[];
  privilege: PureRelaxationPrivilege;
};

export type PureRelaxationService = {
  name: string;
  description: string;
  media?: PureRelaxationMedia;
  durations?: PureRelaxationDuration[];
  privilege?: PureRelaxationPrivilege;
  variants?: PureRelaxationVariant[];
};

export type PureRelaxationSection = {
  id: string;
  index: string;
  title: string;
  icon: string;
  description: string;
  mediaLabel: string;
  services: PureRelaxationService[];
};

export const getPureRelaxationSections = (contentMedia: any = {}): PureRelaxationSection[] => {
  const spaVideo = contentMedia.spaVideo?.src || '/images/services/aroma-oil.png';
  const massageVideo = contentMedia.massageVideo?.src || '/images/services/aroma-oil.png';
  const headSpaVideo = contentMedia.headSpaVideo?.src || '/images/services/hairwash.png';
  const barberVideo = contentMedia.barberVideo?.src || '/images/services/barber.JPG';
  const footVideo = contentMedia.footVideo?.src || '/images/services/foot-massage.png';

  const fallbackImg = contentMedia.fallbackImg?.src || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80';
  const footImg = contentMedia.footImg?.src || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=80';
  const teaImg = contentMedia.teaImg?.src || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80';
  const herbalImg = contentMedia.herbalImg?.src || 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80';

  const type = (key: string, def: string) => contentMedia[key]?.type || def;


const herbalFootSoak: PureRelaxationPrivilege = {
  title: 'Herbal Foot Soak',
  copy: 'A quiet herbal foot soak is included before the body ritual begins.',
  image: herbalImg,
  time: '8-10 mins',
};

const warmTowel: PureRelaxationPrivilege = {
  title: 'Warm Towel Finish',
  copy: 'A warm towel finish helps the feet feel lighter before you leave.',
  image: footImg,
  time: '5 mins',
};

const cuticleCare: PureRelaxationPrivilege = {
  title: 'Cuticle Care Touch',
  copy: 'A small grooming touch is included with this practical foot care package.',
  image: footImg,
  time: '5-8 mins',
};

const eyePillow: PureRelaxationPrivilege = {
  title: 'Warm Eye Pillow',
  copy: 'A warm eye pillow is included while the ear-cleaning ritual settles in.',
  image: herbalImg,
  time: '5 mins',
};

const hotTowel: PureRelaxationPrivilege = {
  title: 'Hot Towel Finish',
  copy: 'A classic hot towel finish completes the grooming sequence.',
  image: fallbackImg,
  time: '5 mins',
};

const silkMask: PureRelaxationPrivilege = {
  title: 'Silk Eye Mask',
  copy: 'A soft silk eye mask is included to deepen relaxation during the package.',
  image: footImg,
  time: '5-10 mins',
};

const refreshingTea: PureRelaxationPrivilege = {
  title: 'Refreshing Tea',
  copy: 'Includes a small refreshing tea service after the treatment.',
  image: teaImg,
  time: '5-10 mins',
};

const signatureTea: PureRelaxationPrivilege = {
  title: 'Signature Herbal Tea',
  copy: 'Includes a signature herbal tea service to complete the full ritual.',
  image: teaImg,
  time: '5-10 mins',
};

const pureRelaxationSections: PureRelaxationSection[] = [
  {
    id: 'body-care',
    index: '01 / 07',
    title: 'Body Care',
    icon: '/category-icons-svg/body-massage.svg',
    mediaLabel: 'Body care',
    description: 'Four direct body rituals with clear duration choices, calm pricing, and a privilege included in each booking.',
    services: [
      {
        name: 'Mix',
        description: 'Balanced pressure and flowing relaxation techniques.',
        media: { type: type('massageVideo', 'image'), src: massageVideo, poster: fallbackImg, tag: 'Body massage' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS0040' },
          { label: "90'", price: 840000, id: 'NHS0041' },
          { label: "120'", price: 1050000, id: 'NHS0042' },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'Aroma Coconut',
        description: 'Warm coconut aroma with a smooth, slow-paced ritual.',
        media: { type: type('spaVideo', 'image'), src: spaVideo, poster: fallbackImg, tag: 'Aroma' },
        durations: [
          { label: "60'", price: 580000, id: 'NHS0008' },
          { label: "90'", price: 790000, id: 'NHS0010' },
          { label: "120'", price: 1050000, id: 'NHS0011' },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'Hotstone',
        description: 'Heat-supported relaxation for a deeper release.',
        media: { type: type('spaVideo', 'image'), src: spaVideo, poster: fallbackImg, tag: 'Hotstone' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS0022' },
          { label: "90'", price: 840000, id: 'NHS0023' },
          { label: "120'", price: 1050000, id: 'NHS0024' },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'No Oil',
        description: 'Dry technique for guests who prefer an oil-free treatment.',
        media: { type: type('massageVideo', 'image'), src: massageVideo, poster: fallbackImg, tag: 'No oil' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS0047' },
          { label: "90'", price: 840000, id: 'NHS0048' },
          { label: "120'", price: 1050000, id: 'NHS0049' },
        ],
        privilege: herbalFootSoak,
      },

    ],
  },
  {
    id: 'foot-care',
    index: '02 / 07',
    title: 'Foot Care',
    icon: '/category-icons-svg/foot-massage.svg',
    mediaLabel: 'Foot care',
    description: 'Compact foot care choices with duration only where the guest needs it.',
    services: [
      {
        name: 'Foot',
        description: 'Relax tired feet and lower legs with focused pressure and release.',
        media: { type: type('footVideo', 'image'), src: footVideo, poster: footImg, tag: 'Foot ritual' },
        durations: [
          { label: "45'", price: 315000, id: 'NHS0100' },
          { label: "60'", price: 395000, id: 'NHS0101' },
        ],
        privilege: warmTowel,
      },
      {
        name: 'Foot · Nail Cut · Heel Skin Shave',
        description: 'Mát-xa chân - Cắt móng - Chà gót.',
        media: { type: type('footImg', 'image'), src: footImg, tag: 'Heel care' },
        durations: [{ label: "90'", price: 790000, id: 'NHS1000' }],
        privilege: cuticleCare,
      },
    ],
  },
  {
    id: 'ear-clean',
    index: '03 / 07',
    title: 'Ear Clean',
    icon: '/category-icons-svg/ear-clean.svg',
    mediaLabel: 'Ear clean',
    description: 'Ear-cleaning services are grouped by the real combinations guests choose most often.',
    services: [
      {
        name: 'Ear',
        description: 'Focused ear-cleaning with a quiet, careful pace.',
        media: { type: type('herbalImg', 'image'), src: herbalImg, tag: 'Ear clean' },
        durations: [
          { label: "30'", price: 315000, id: 'NHS0600' },
          { label: "45'", price: 385000, id: 'NHS0601' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Hair Wash · Head Neck Shoulder',
        description: 'Ear care followed by a soothing hair wash and upper-body release.',
        media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, poster: fallbackImg, tag: 'Head spa' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS1001' },
          { label: "90'", price: 790000, id: 'NHS1002' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Head Neck Shoulder · Foot',
        description: 'A balanced sequence for ear care, shoulder comfort, and foot relaxation.',
        media: { type: type('footVideo', 'image'), src: footVideo, poster: footImg, tag: 'Foot add-on' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS1003' },
          { label: "90'", price: 790000, id: 'NHS1004' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Head Neck Shoulder · Body',
        description: 'Ear care extended into a fuller body relaxation session.',
        media: { type: type('massageVideo', 'image'), src: massageVideo, poster: fallbackImg, tag: 'Body add-on' },
        durations: [
          { label: "70'", price: 705000, id: 'NHS1005' },
          { label: "90'", price: 810000, id: 'NHS1006' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Body · Head Neck Shoulder · Hair Wash',
        description: 'A longer complete sequence for guests who want everything handled in one visit.',
        media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, poster: fallbackImg, tag: 'Complete' },
        durations: [{ label: "120'", price: 1105000, id: 'NHS1007' }],
        privilege: eyePillow,
      },
    ],
  },
  {
    id: 'barber',
    index: '04 / 07',
    title: 'Barber',
    icon: '/category-icons-svg/haircut.svg',
    mediaLabel: 'Barber',
    description: 'A minimal grooming section with direct selections and no crowded menu wall.',
    services: [
      { name: 'Shave', description: 'Clean facial grooming with a warm finish.', media: { type: type('barberVideo', 'image'), src: barberVideo, poster: fallbackImg, tag: 'Shave' }, durations: [{ label: "30'", price: 210000, id: 'NHS0700' }], privilege: hotTowel },
      { name: 'Hair Cut', description: 'A neat haircut service paced for everyday grooming.', media: { type: type('barberVideo', 'image'), src: barberVideo, poster: fallbackImg, tag: 'Hair cut' }, durations: [{ label: "45'", price: 265000, id: 'NHS0701' }], privilege: hotTowel },
      { name: 'Barber 1', description: 'A focused barber combination for a clean refresh.', media: { type: type('barberVideo', 'image'), src: barberVideo, poster: fallbackImg, tag: 'Barber 1' }, durations: [{ label: "45'", price: 370000, id: 'NHS0702' }], privilege: hotTowel },
      { name: 'Barber 2', description: 'A balanced grooming ritual.', media: { type: type('barberVideo', 'image'), src: barberVideo, poster: fallbackImg, tag: 'Barber 2' }, durations: [{ label: "60'", price: 570000, id: 'NHS0703' }], privilege: hotTowel },
      { name: 'Barber 3', description: 'A longer grooming ritual with extra finishing time.', media: { type: type('barberVideo', 'image'), src: barberVideo, poster: fallbackImg, tag: 'Barber 3' }, durations: [{ label: "90'", price: 915000, id: 'NHS0704' }], privilege: hotTowel },
      { name: 'Barber 4', description: 'A complete grooming session for a polished look.', media: { type: type('barberVideo', 'image'), src: barberVideo, poster: fallbackImg, tag: 'Barber 4' }, durations: [{ label: "90'", price: 630000, id: 'NHS0705' }], privilege: hotTowel },
      { name: 'Barber 5', description: 'The most complete barber sequence in this service family.', media: { type: type('barberVideo', 'image'), src: barberVideo, poster: fallbackImg, tag: 'Barber 5' }, durations: [{ label: "120'", price: 840000, id: 'NHS0706' }], privilege: hotTowel },
    ],
  },
  {
    id: 'package',
    index: '05 / 07',
    title: 'Package',
    icon: '/category-icons-svg/package.svg',
    mediaLabel: 'Package',
    description: 'Choose a package family first, then the specific ritual and duration.',
    services: [
      {
        name: 'Hair Wash & Facial',
        description: 'Choose a hair-wash package variation first. The preview and price both respond to the selected sub-package.',
        variants: [
          { name: 'Hair Wash · Head Neck Shoulder · Foot', subtitle: 'Gội đầu - Cổ vai gáy - Mát-xa chân', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, poster: fallbackImg, tag: 'Hair wash' }, durations: [{ label: "70'", price: 685000, id: 'NHS1009' }, { label: "90'", price: 790000, id: 'NHS1010' }] },
          { name: 'Hair Wash · Head Neck Shoulder · Body', subtitle: 'Gội đầu - Cổ vai gáy - Body', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, poster: fallbackImg, tag: 'Body' }, durations: [{ label: "70'", price: 705000, id: 'NHS1011' }, { label: "90'", price: 810000, id: 'NHS1012' }] },
          { name: 'Hair Wash · Facial · Head Neck Shoulder · Foot · Body', subtitle: 'Gội đầu - Facial - Cổ vai gáy - Chân - Body', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, poster: fallbackImg, tag: 'Complete' }, durations: [{ label: "120'", price: 1105000, id: 'NHS1013' }] },
          { name: 'Facial · Machine Shave · Head Neck Shoulder · Body · Quick Hair Wash', subtitle: 'Facial - Cạo râu - Cổ vai gáy - Body - Gội nhanh', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, poster: fallbackImg, tag: 'Facial' }, durations: [{ label: "90'", price: 840000, id: 'NHS1014' }, { label: "120'", price: 1105000, id: 'NHS1015' }] },
        ],
      },
      {
        name: 'Heel Care & Nail Cut',
        description: 'A smaller package family focused on grooming with foot or body add-ons.',
        variants: [
          { name: 'Heel · Nail Cut · Foot', subtitle: 'Chà gót - Cắt móng - Mát-xa chân', privilege: refreshingTea, media: { type: type('footImg', 'image'), src: footImg, tag: 'Foot' }, durations: [{ label: "90'", price: 790000, id: 'NHS1016' }, { label: "120'", price: 1085000, id: 'NHS1017' }] },
          { name: 'Heel · Nail Cut · Body', subtitle: 'Chà gót - Cắt móng - Body', privilege: refreshingTea, media: { type: type('massageVideo', 'image'), src: massageVideo, poster: fallbackImg, tag: 'Body' }, durations: [{ label: "90'", price: 810000, id: 'NHS1018' }, { label: "120'", price: 1105000, id: 'NHS1019' }] },
        ],
      },
      {
        name: 'King Combo',
        description: 'Razor Shave · Ear Clean · Facial · Heel Skin Shave · Hair Wash · 4-Hand Body Massage.',
        media: { type: type('spaVideo', 'image'), src: spaVideo, poster: fallbackImg, tag: 'Signature' },
        durations: [
          { label: "150'", price: 1575000, id: 'NHS1008' },
        ],
        privilege: signatureTea,
      },
    ],
  },
  {
    id: 'adds-on',
    index: '06 / 07',
    title: 'Add on',
    icon: '/category-icons-svg/adds-on.svg',
    mediaLabel: 'Add on',
    description: 'Enhance your experience with these additional services.',
    services: [
      {
        name: 'Private room',
        description: 'Enjoy your treatment in a private setting.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: 'Per session', price: 105000, id: 'NHS0900' }]
      },
      {
        name: 'Hairwash',
        description: 'Refreshing hair wash and scalp care.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "45'", price: 420000, id: 'NHS0910' }]
      },
      {
        name: 'Facial',
        description: 'Basic facial care.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "45'", price: 420000, id: 'NHS0904' }]
      },
      {
        name: 'Heel',
        description: 'Heel care and scrub.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 315000, id: 'NHS0905' }]
      },
      {
        name: 'Nailcut',
        description: 'Basic nail trimming and shaping.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 315000, id: 'NHS0906' }]
      },
      {
        name: 'Head, Neck, Shoulder, Arm',
        description: 'Targeted relaxation for upper body.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "45'", price: 370000, id: 'NHS0909' }]
      },
      {
        name: 'Back',
        description: 'Targeted back massage.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 315000, id: 'NHS0908' }]
      }
    ]
  },
  {
    id: 'vip-package',
    index: '07 / 07',
    title: 'VIP Package',
    icon: '/category-icons-svg/combo-king.svg',
    mediaLabel: 'VIP Package',
    description: 'Exclusive and premium VIP experiences tailored for ultimate relaxation.',
    services: [
      {
        name: 'VIP Experience',
        description: 'Premium massage and care in a private VIP setting.',
        media: { type: 'image', src: fallbackImg, tag: 'VIP' },
        durations: [
          { label: "90'", price: 1000000, id: 'NHP0003' },
          { label: "120'", price: 1300000, id: 'NHP0004' }
        ]
      }
    ]
  }
];
  return pureRelaxationSections;
};
