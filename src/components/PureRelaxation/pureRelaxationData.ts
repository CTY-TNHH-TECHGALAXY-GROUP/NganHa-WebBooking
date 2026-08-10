export type PureRelaxationMedia = {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  tag: string;
};

export type PureRelaxationDuration = {
  label: string;
  price: number;
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

const spaVideo = 'https://assets.mixkit.co/videos/preview/mixkit-woman-relaxing-at-a-spa-7508-large.mp4';
const massageVideo = 'https://assets.mixkit.co/videos/preview/mixkit-woman-enjoying-a-relaxing-massage-1208-large.mp4';
const headSpaVideo = 'https://assets.mixkit.co/videos/preview/mixkit-spa-worker-massaging-the-head-of-a-woman-7492-large.mp4';
const barberVideo = 'https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-of-a-client-21641-large.mp4';
const footVideo = 'https://assets.mixkit.co/videos/preview/mixkit-womans-feet-in-a-spa-bath-1251-large.mp4';

const fallbackImg = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80';
const footImg = 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=80';
const teaImg = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80';
const herbalImg = 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80';

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

export const pureRelaxationSections: PureRelaxationSection[] = [
  {
    id: 'body-care',
    index: '01 / 06',
    title: 'Body Care',
    icon: '/category-icons-svg/body-massage.svg',
    mediaLabel: 'Body care',
    description: 'Four direct body rituals with clear duration choices, calm pricing, and a privilege included in each booking.',
    services: [
      {
        name: 'Mix',
        description: 'Balanced pressure and flowing relaxation techniques.',
        media: { type: 'video', src: massageVideo, poster: fallbackImg, tag: 'Body massage' },
        durations: [
          { label: "60'", price: 485000 },
          { label: "90'", price: 685000 },
          { label: "120'", price: 885000 },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'Aroma Coconut',
        description: 'Warm coconut aroma with a smooth, slow-paced ritual.',
        media: { type: 'video', src: spaVideo, poster: fallbackImg, tag: 'Aroma' },
        durations: [
          { label: "60'", price: 505000 },
          { label: "90'", price: 705000 },
          { label: "120'", price: 905000 },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'Hotstone',
        description: 'Heat-supported relaxation for a deeper release.',
        media: { type: 'video', src: spaVideo, poster: fallbackImg, tag: 'Hotstone' },
        durations: [
          { label: "60'", price: 585000 },
          { label: "90'", price: 785000 },
          { label: "120'", price: 985000 },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'No Oil',
        description: 'Dry technique for guests who prefer an oil-free treatment.',
        media: { type: 'video', src: massageVideo, poster: fallbackImg, tag: 'No oil' },
        durations: [
          { label: "60'", price: 465000 },
          { label: "90'", price: 665000 },
        ],
        privilege: herbalFootSoak,
      },
    ],
  },
  {
    id: 'foot-care',
    index: '02 / 06',
    title: 'Foot Care',
    icon: '/category-icons-svg/foot-massage.svg',
    mediaLabel: 'Foot care',
    description: 'Compact foot care choices with duration only where the guest needs it.',
    services: [
      {
        name: 'Foot',
        description: 'Relax tired feet and lower legs with focused pressure and release.',
        media: { type: 'video', src: footVideo, poster: footImg, tag: 'Foot ritual' },
        durations: [
          { label: "45'", price: 315000 },
          { label: "60'", price: 395000 },
        ],
        privilege: warmTowel,
      },
      {
        name: 'Foot · Nail Cut · Heel Skin Shave',
        description: 'Foot treatment paired with practical nail and heel grooming.',
        media: { type: 'image', src: footImg, tag: 'Heel care' },
        durations: [{ label: "90'", price: 595000 }],
        privilege: cuticleCare,
      },
    ],
  },
  {
    id: 'ear-clean',
    index: '03 / 06',
    title: 'Ear Clean',
    icon: '/category-icons-svg/ear-clean.svg',
    mediaLabel: 'Ear clean',
    description: 'Ear-cleaning services are grouped by the real combinations guests choose most often.',
    services: [
      {
        name: 'Ear',
        description: 'Focused ear-cleaning with a quiet, careful pace.',
        media: { type: 'image', src: herbalImg, tag: 'Ear clean' },
        durations: [
          { label: "30'", price: 315000 },
          { label: "45'", price: 385000 },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Hair Wash · Head Neck Shoulder',
        description: 'Ear care followed by a soothing hair wash and upper-body release.',
        media: { type: 'video', src: headSpaVideo, poster: fallbackImg, tag: 'Head spa' },
        durations: [
          { label: "70'", price: 535000 },
          { label: "90'", price: 665000 },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Head Neck Shoulder · Foot',
        description: 'A balanced sequence for ear care, shoulder comfort, and foot relaxation.',
        media: { type: 'video', src: footVideo, poster: footImg, tag: 'Foot add-on' },
        durations: [
          { label: "70'", price: 555000 },
          { label: "90'", price: 695000 },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Head Neck Shoulder · Body',
        description: 'Ear care extended into a fuller body relaxation session.',
        media: { type: 'video', src: massageVideo, poster: fallbackImg, tag: 'Body add-on' },
        durations: [
          { label: "70'", price: 635000 },
          { label: "90'", price: 795000 },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Body · Head Neck Shoulder · Hair Wash',
        description: 'A longer complete sequence for guests who want everything handled in one visit.',
        media: { type: 'video', src: headSpaVideo, poster: fallbackImg, tag: 'Complete' },
        durations: [{ label: "120'", price: 995000 }],
        privilege: eyePillow,
      },
    ],
  },
  {
    id: 'barber',
    index: '04 / 06',
    title: 'Barber',
    icon: '/category-icons-svg/haircut.svg',
    mediaLabel: 'Barber',
    description: 'A minimal grooming section with direct selections and no crowded menu wall.',
    services: [
      { name: 'Shave', description: 'Clean facial grooming with a warm finish.', media: { type: 'video', src: barberVideo, poster: fallbackImg, tag: 'Shave' }, durations: [{ label: "30'", price: 185000 }, { label: "45'", price: 265000 }], privilege: hotTowel },
      { name: 'Hair Cut', description: 'A neat haircut service paced for everyday grooming.', media: { type: 'video', src: barberVideo, poster: fallbackImg, tag: 'Hair cut' }, durations: [{ label: "45'", price: 285000 }, { label: "60'", price: 345000 }], privilege: hotTowel },
      { name: 'Barber 1', description: 'A focused barber combination for a clean refresh.', media: { type: 'video', src: barberVideo, poster: fallbackImg, tag: 'Barber 1' }, durations: [{ label: "45'", price: 365000 }], privilege: hotTowel },
      { name: 'Barber 3', description: 'A longer grooming ritual with extra finishing time.', media: { type: 'video', src: barberVideo, poster: fallbackImg, tag: 'Barber 3' }, durations: [{ label: "60'", price: 495000 }, { label: "90'", price: 655000 }], privilege: hotTowel },
      { name: 'Barber 4', description: 'A complete grooming session for a polished look.', media: { type: 'video', src: barberVideo, poster: fallbackImg, tag: 'Barber 4' }, durations: [{ label: "90'", price: 755000 }], privilege: hotTowel },
      { name: 'Barber 5', description: 'The most complete barber sequence in this service family.', media: { type: 'video', src: barberVideo, poster: fallbackImg, tag: 'Barber 5' }, durations: [{ label: "90'", price: 845000 }, { label: "120'", price: 1045000 }], privilege: hotTowel },
    ],
  },
  {
    id: 'package',
    index: '05 / 06',
    title: 'Package',
    icon: '/category-icons-svg/package.svg',
    mediaLabel: 'Package',
    description: 'Choose a package family first, then the specific ritual and duration.',
    services: [
      {
        name: 'Hair Wash & Facial',
        description: 'Choose a hair-wash package variation first. The preview and price both respond to the selected sub-package.',
        variants: [
          { name: 'Hair Wash · Head Neck Shoulder · Foot', subtitle: 'Scalp cleansing, upper-body release and focused foot care.', privilege: silkMask, media: { type: 'video', src: headSpaVideo, poster: fallbackImg, tag: 'Hair wash' }, durations: [{ label: "70'", price: 545000 }, { label: "90'", price: 675000 }] },
          { name: 'Hair Wash · Head Neck Shoulder · Body', subtitle: 'Hair wash paired with upper-body relief and body relaxation.', privilege: silkMask, media: { type: 'video', src: headSpaVideo, poster: fallbackImg, tag: 'Body' }, durations: [{ label: "70'", price: 625000 }, { label: "90'", price: 775000 }] },
          { name: 'Hair Wash · Facial · Head Neck Shoulder · Foot · Body', subtitle: 'A complete head-to-toe ritual with facial care and body relaxation.', privilege: silkMask, media: { type: 'video', src: headSpaVideo, poster: fallbackImg, tag: 'Complete' }, durations: [{ label: "120'", price: 1085000 }] },
          { name: 'Facial · Machine Shave · Head Neck Shoulder · Body · Quick Hair Wash', subtitle: 'Facial and grooming care wrapped into a balanced massage and quick hair wash.', privilege: silkMask, media: { type: 'video', src: headSpaVideo, poster: fallbackImg, tag: 'Facial' }, durations: [{ label: "90'", price: 835000 }, { label: "120'", price: 1025000 }] },
        ],
      },
      {
        name: 'Heel Care & Nail Cut',
        description: 'A smaller package family focused on grooming with foot or body add-ons.',
        variants: [
          { name: 'Heel · Nail Cut · Foot', subtitle: 'Detailed heel and nail grooming finished with foot relaxation.', privilege: refreshingTea, media: { type: 'image', src: footImg, tag: 'Foot' }, durations: [{ label: "90'", price: 655000 }, { label: "120'", price: 815000 }] },
          { name: 'Heel · Nail Cut · Body', subtitle: 'Heel and nail care combined with a longer full-body relaxation sequence.', privilege: refreshingTea, media: { type: 'video', src: massageVideo, poster: fallbackImg, tag: 'Body' }, durations: [{ label: "90'", price: 745000 }, { label: "120'", price: 925000 }] },
        ],
      },
      {
        name: 'King Combo',
        description: 'Razor Shave · Ear Clean · Facial · Heel Skin Shave · Hair Wash · 4-Hand Body Massage.',
        media: { type: 'video', src: spaVideo, poster: fallbackImg, tag: 'Signature' },
        durations: [
          { label: "150'", price: 1795000 },
          { label: "180'", price: 2095000 },
        ],
        privilege: signatureTea,
      },
    ],
  },
  {
    id: 'adds-on',
    index: '06 / 06',
    title: 'Add on',
    icon: '/category-icons-svg/adds-on.svg',
    mediaLabel: 'Add on',
    description: 'Enhance your experience with these additional services.',
    services: [
      {
        name: 'Private room',
        description: 'Enjoy your treatment in a private setting.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: 'Per session', price: 0 }]
      },
      {
        name: 'Hairwash',
        description: 'Refreshing hair wash and scalp care.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 0 }]
      },
      {
        name: 'Facial',
        description: 'Basic facial care.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 0 }]
      },
      {
        name: 'Heel',
        description: 'Heel care and scrub.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 0 }]
      },
      {
        name: 'Nailcut',
        description: 'Basic nail trimming and shaping.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 0 }]
      },
      {
        name: 'Head, Neck, Shoulder, Arm',
        description: 'Targeted relaxation for upper body.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 0 }]
      },
      {
        name: 'Back',
        description: 'Targeted back massage.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 0 }]
      }
    ]
  }
];