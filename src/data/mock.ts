export type ClassType =
  | 'Reformer'
  | 'Mat'
  | 'Contemporary'
  | 'Clinical'
  | 'Pre/postnatal';

export interface Studio {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  city: string;
  address: string;
  blurb: string;
  hero: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  priceFrom: number;
  classTypes: ClassType[];
  loved: string;
  amenities: string[];
  cancellationHours: number;
}

export interface Instructor {
  id: string;
  fullName: string;
  studioId: string;
  portrait: string;
  specialties: ClassType[];
  bio: string;
  certifications: string[];
  yearsTeaching: number;
  rating: number;
  reviewCount: number;
  languages: ('EN' | 'AR' | 'FR')[];
}

export interface ClassSession {
  id: string;
  studioId: string;
  instructorId: string;
  type: ClassType;
  startsAt: string; // human display
  startIso: string;
  durationMin: number;
  capacity: number;
  booked: number;
  priceUsd: number;
  level: 'Beginner' | 'All levels' | 'Intermediate' | 'Advanced';
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
}

export interface Booking {
  id: string;
  studioId: string;
  classId: string;
  instructorId: string;
  date: string;
  time: string;
  countdown: string;
  status: 'upcoming' | 'past';
  outcome?: 'completed' | 'no_show' | 'cancelled';
}

const photo = (id: string, w = 800, h = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const studios: Studio[] = [
  {
    id: 'st_beirut_pilates',
    slug: 'beirut-pilates',
    name: 'Beirut Pilates',
    neighborhood: 'Achrafieh',
    city: 'Beirut',
    address: '37 Rue Sursock, Achrafieh',
    blurb:
      'A six-machine reformer studio in a converted Achrafieh townhouse, run by Yara Saad since 2019.',
    hero: photo('1518611012118-696072aa579a'),
    gallery: [
      photo('1518611012118-696072aa579a'),
      photo('1571902943202-507ec2618e8f'),
      photo('1540206395-68808572332f'),
      photo('1601925260368-ae2f83cf8b7f'),
    ],
    rating: 4.92,
    reviewCount: 184,
    priceFrom: 25,
    classTypes: ['Reformer', 'Mat', 'Pre/postnatal'],
    loved:
      'Six reformers, never seven — the room stays uncrowded by design. Yara works the floor herself, even on Saturdays.',
    amenities: ['Showers', 'Mats provided', 'Tea bar', 'Towel service'],
    cancellationHours: 12,
  },
  {
    id: 'st_reformer_room',
    slug: 'reformer-room',
    name: 'The Reformer Room',
    neighborhood: 'Mar Mikhael',
    city: 'Beirut',
    address: 'Armenia Street, Mar Mikhael',
    blurb:
      'Industrial space on Armenia Street with a contemporary methodology — long, slow holds and breath-led transitions.',
    hero: photo('1599447421416-3414500d18a5'),
    gallery: [
      photo('1599447421416-3414500d18a5'),
      photo('1591291621164-2c6367723315'),
      photo('1518310383802-640c2de311b2'),
    ],
    rating: 4.81,
    reviewCount: 312,
    priceFrom: 28,
    classTypes: ['Reformer', 'Contemporary', 'Mat'],
    loved:
      'The contemporary flow class is unlike anywhere else in Beirut — closer to a moving meditation than a workout.',
    amenities: ['Showers', 'Lockers', 'Mats provided'],
    cancellationHours: 24,
  },
  {
    id: 'st_core_jounieh',
    slug: 'core-studio-jounieh',
    name: 'Core Studio Jounieh',
    neighborhood: 'Kaslik',
    city: 'Jounieh',
    address: 'Highway, Kaslik',
    blurb:
      'Clinical pilates and post-rehabilitation work led by physiotherapist Tarek Sfeir.',
    hero: photo('1591291621164-2c6367723315'),
    gallery: [
      photo('1591291621164-2c6367723315'),
      photo('1518310383802-640c2de311b2'),
      photo('1540206395-68808572332f'),
    ],
    rating: 4.96,
    reviewCount: 98,
    priceFrom: 35,
    classTypes: ['Clinical', 'Reformer', 'Pre/postnatal'],
    loved:
      'The only studio I trust with a knee that’s still healing. Tarek reads bodies the way other people read sheet music.',
    amenities: ['Physio referrals', 'Private sessions', 'Showers'],
    cancellationHours: 24,
  },
  {
    id: 'st_mat_method',
    slug: 'mat-and-method',
    name: 'Mat & Method',
    neighborhood: 'Hamra',
    city: 'Beirut',
    address: 'Bliss Street, Hamra',
    blurb:
      'Mat-only studio above a bookshop — minimal equipment, maximal precision.',
    hero: photo('1540206395-68808572332f'),
    gallery: [photo('1540206395-68808572332f'), photo('1518611012118-696072aa579a')],
    rating: 4.74,
    reviewCount: 221,
    priceFrom: 18,
    classTypes: ['Mat', 'Contemporary'],
    loved:
      'A teacher’s studio. They run a 6am class on weekdays and the regulars treat it like a chapel.',
    amenities: ['Mats provided', 'Tea bar'],
    cancellationHours: 6,
  },
  {
    id: 'st_wave',
    slug: 'wave-studio',
    name: 'Wave Studio',
    neighborhood: 'Saifi',
    city: 'Beirut',
    address: 'Saifi Village',
    blurb:
      'Tucked into Saifi Village, Wave runs a small reformer floor and a daily morning mat practice.',
    hero: photo('1601925260368-ae2f83cf8b7f'),
    gallery: [photo('1601925260368-ae2f83cf8b7f')],
    rating: 4.88,
    reviewCount: 142,
    priceFrom: 22,
    classTypes: ['Reformer', 'Mat'],
    loved:
      'The 7:30am mat class with Reem will reset your week. Worth setting an alarm for.',
    amenities: ['Showers', 'Mats provided'],
    cancellationHours: 12,
  },
];

export const instructors: Instructor[] = [
  {
    id: 'in_yara',
    fullName: 'Yara Saad',
    studioId: 'st_beirut_pilates',
    portrait: photo('1544005313-94ddf0286df2', 600, 800),
    specialties: ['Reformer', 'Pre/postnatal'],
    bio: 'Comparative literature graduate turned pilates teacher. Yara opened Beirut Pilates in 2019 after eight years of teaching in London.',
    certifications: ['STOTT Pilates Comprehensive', 'Pre/Post Natal Pilates'],
    yearsTeaching: 11,
    rating: 4.95,
    reviewCount: 86,
    languages: ['EN', 'AR', 'FR'],
  },
  {
    id: 'in_maya',
    fullName: 'Maya Geagea',
    studioId: 'st_beirut_pilates',
    portrait: photo('1573497019418-b400bb3ab074', 600, 800),
    specialties: ['Mat', 'Reformer'],
    bio: 'Former dancer with the Beirut Modern Dance Company. Maya teaches a slow, articulate mat class that reads like choreography.',
    certifications: ['BASI Pilates Comprehensive'],
    yearsTeaching: 7,
    rating: 4.88,
    reviewCount: 54,
    languages: ['EN', 'AR'],
  },
  {
    id: 'in_karim',
    fullName: 'Karim Haddad',
    studioId: 'st_reformer_room',
    portrait: photo('1507003211169-0a1dd7228f2d', 600, 800),
    specialties: ['Reformer', 'Contemporary'],
    bio: 'Trained in Paris and Berlin. Karim leads the contemporary flow series and runs The Reformer Room’s teacher training in autumn.',
    certifications: ['Polestar Pilates', 'Franklin Method'],
    yearsTeaching: 9,
    rating: 4.86,
    reviewCount: 102,
    languages: ['EN', 'FR'],
  },
  {
    id: 'in_nour',
    fullName: 'Nour Khoury',
    studioId: 'st_reformer_room',
    portrait: photo('1438761681033-6461ffad8d80', 600, 800),
    specialties: ['Mat', 'Reformer'],
    bio: 'Background in physiotherapy. Nour teaches the early-morning reformer block and the Saturday open mat.',
    certifications: ['STOTT Pilates Comprehensive', 'BSc Physiotherapy'],
    yearsTeaching: 6,
    rating: 4.79,
    reviewCount: 47,
    languages: ['EN', 'AR'],
  },
  {
    id: 'in_tarek',
    fullName: 'Tarek Sfeir',
    studioId: 'st_core_jounieh',
    portrait: photo('1492562080023-ab3db95bfbce', 600, 800),
    specialties: ['Clinical', 'Reformer'],
    bio: 'Physiotherapist and clinical pilates instructor. Tarek runs the rehabilitation program at Core Studio and consults with two Beirut sports clinics.',
    certifications: ['DPT', 'APPI Clinical Pilates'],
    yearsTeaching: 14,
    rating: 4.97,
    reviewCount: 71,
    languages: ['EN', 'FR'],
  },
  {
    id: 'in_reem',
    fullName: 'Reem Aoun',
    studioId: 'st_wave',
    portrait: photo('1554151228-14d9def656e4', 600, 800),
    specialties: ['Mat', 'Pre/postnatal'],
    bio: 'Reem teaches the 7:30am mat practice at Wave and a women-only pre/postnatal series on Saturdays.',
    certifications: ['Romana’s Pilates', 'Pre/Post Natal Pilates'],
    yearsTeaching: 8,
    rating: 4.91,
    reviewCount: 63,
    languages: ['EN', 'AR', 'FR'],
  },
];

export const sessions: ClassSession[] = [
  {
    id: 'cs_1',
    studioId: 'st_beirut_pilates',
    instructorId: 'in_yara',
    type: 'Reformer',
    startsAt: 'Tomorrow · 09:00',
    startIso: '2026-05-02T09:00:00+03:00',
    durationMin: 55,
    capacity: 6,
    booked: 4,
    priceUsd: 28,
    level: 'All levels',
  },
  {
    id: 'cs_2',
    studioId: 'st_beirut_pilates',
    instructorId: 'in_maya',
    type: 'Mat',
    startsAt: 'Tomorrow · 12:00',
    startIso: '2026-05-02T12:00:00+03:00',
    durationMin: 50,
    capacity: 12,
    booked: 9,
    priceUsd: 22,
    level: 'Intermediate',
  },
  {
    id: 'cs_3',
    studioId: 'st_beirut_pilates',
    instructorId: 'in_yara',
    type: 'Pre/postnatal',
    startsAt: 'Tomorrow · 18:00',
    startIso: '2026-05-02T18:00:00+03:00',
    durationMin: 55,
    capacity: 6,
    booked: 6,
    priceUsd: 30,
    level: 'All levels',
  },
  {
    id: 'cs_4',
    studioId: 'st_reformer_room',
    instructorId: 'in_karim',
    type: 'Contemporary',
    startsAt: 'Today · 19:30',
    startIso: '2026-05-01T19:30:00+03:00',
    durationMin: 60,
    capacity: 8,
    booked: 5,
    priceUsd: 28,
    level: 'All levels',
  },
  {
    id: 'cs_5',
    studioId: 'st_core_jounieh',
    instructorId: 'in_tarek',
    type: 'Clinical',
    startsAt: 'Saturday · 10:00',
    startIso: '2026-05-03T10:00:00+03:00',
    durationMin: 50,
    capacity: 4,
    booked: 2,
    priceUsd: 35,
    level: 'All levels',
  },
];

export const reviews: Review[] = [
  {
    id: 'rv_1',
    author: 'Lina K.',
    rating: 5,
    date: 'Last week',
    body: 'Yara remembers everyone’s pelvis. Truly. Came in with a stiff lower back, left walking taller.',
  },
  {
    id: 'rv_2',
    author: 'Rana H.',
    rating: 5,
    date: '2 weeks ago',
    body: 'Six reformers, no music blasting, no shouting. The room stays calm and focused. I drive in from Hamra for it.',
  },
  {
    id: 'rv_3',
    author: 'Sara N.',
    rating: 4,
    date: 'Last month',
    body: 'Very precise teaching. The 9am Reformer with Yara is hard to get into — I book a week ahead.',
  },
];

export const upcomingBookings: Booking[] = [
  {
    id: 'bk_1',
    studioId: 'st_beirut_pilates',
    classId: 'cs_1',
    instructorId: 'in_yara',
    date: 'Tomorrow, May 2',
    time: '09:00',
    countdown: 'in 18 hours',
    status: 'upcoming',
  },
  {
    id: 'bk_2',
    studioId: 'st_core_jounieh',
    classId: 'cs_5',
    instructorId: 'in_tarek',
    date: 'Saturday, May 3',
    time: '10:00',
    countdown: 'in 2 days',
    status: 'upcoming',
  },
];

export const pastBookings: Booking[] = [
  {
    id: 'bk_p1',
    studioId: 'st_beirut_pilates',
    classId: 'cs_2',
    instructorId: 'in_maya',
    date: 'Apr 28',
    time: '12:00',
    countdown: '',
    status: 'past',
    outcome: 'completed',
  },
  {
    id: 'bk_p2',
    studioId: 'st_reformer_room',
    classId: 'cs_4',
    instructorId: 'in_karim',
    date: 'Apr 24',
    time: '19:30',
    countdown: '',
    status: 'past',
    outcome: 'completed',
  },
  {
    id: 'bk_p3',
    studioId: 'st_wave',
    classId: 'cs_4',
    instructorId: 'in_reem',
    date: 'Apr 12',
    time: '07:30',
    countdown: '',
    status: 'past',
    outcome: 'cancelled',
  },
];

export const findStudio = (id: string) =>
  studios.find((s) => s.id === id) ?? studios[0]!;
export const findInstructor = (id: string) =>
  instructors.find((i) => i.id === id) ?? instructors[0]!;
export const findSession = (id: string) =>
  sessions.find((s) => s.id === id) ?? sessions[0]!;

// Instructor dashboard mock
export const instructorToday = {
  earningsThisWeek: 980,
  earningsLastWeek: 840,
  payoutNext: 'Mon, May 5',
  profileCompleteness: 0.85,
  upcomingToday: [
    {
      id: 'd1',
      time: '09:00',
      duration: 55,
      type: 'Reformer' as ClassType,
      booked: 6,
      capacity: 6,
      studio: 'Beirut Pilates',
    },
    {
      id: 'd2',
      time: '12:00',
      duration: 50,
      type: 'Mat' as ClassType,
      booked: 4,
      capacity: 12,
      studio: 'Beirut Pilates',
    },
    {
      id: 'd3',
      time: '18:00',
      duration: 55,
      type: 'Pre/postnatal' as ClassType,
      booked: 6,
      capacity: 6,
      studio: 'Beirut Pilates',
    },
  ],
};
