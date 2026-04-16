export const TIME_LABELS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 'Now'];

export const STATUS_COLORS = {
  active:  '#22c55e',
  resting: '#60a5fa',
  warning: '#f59e0b',
  sos:     '#ef4444',
  offline: '#6b7280',
};

// Base: lat -1.0954771917261503, lng 37.01428310094132
export const CAMP_CENTER = { lng: 37.01428310094132, lat: -1.0954771917261503 };

export const HIKERS = [
  {
    id: 'H001',
    name: 'James Kariuki',
    group: 'Alpha-1',
    status: 'active',
    avatar: 'JK',
    lastUpdate: '0m ago',
    currentStats: { heartRate: 112, elevation: 3840, oxygenSat: 94, steps: 14320, temperature: 36.4 },
    // NE ascending trail from base camp
    location: { lng: 37.0368, lat: -1.0792 },
    path: [
      [37.0143, -1.0955], [37.0182, -1.0930], [37.0215, -1.0908],
      [37.0248, -1.0878], [37.0290, -1.0848], [37.0325, -1.0820],
      [37.0347, -1.0806], [37.0368, -1.0792],
    ],
    heartRateHistory:   [82, 85, 88, 92, 95, 100, 105, 108, 110, 112],
    elevationHistory:   [2800, 2950, 3100, 3250, 3400, 3520, 3640, 3720, 3790, 3840],
    oxygenSatHistory:   [98, 97, 97, 97, 96, 96, 95, 95, 94, 94],
    stepsHistory:       [1400, 2900, 4300, 5800, 7200, 8600, 10100, 11500, 12900, 14320],
    emergencyContacts: [
      { id: 1, name: 'Grace Kariuki',    relation: 'Spouse',  phone: '+254 712 456 789', primary: true },
      { id: 2, name: 'Dr. Peter Mwangi', relation: 'Doctor',  phone: '+254 722 123 456', primary: false },
    ],
  },
  {
    id: 'H002',
    name: 'Amina Hassan',
    group: 'Alpha-2',
    status: 'active',
    avatar: 'AH',
    lastUpdate: '1m ago',
    currentStats: { heartRate: 98, elevation: 3420, oxygenSat: 96, steps: 11840, temperature: 36.7 },
    // East trail
    location: { lng: 37.0520, lat: -1.1025 },
    path: [
      [37.0143, -1.0955], [37.0210, -1.0965], [37.0268, -1.0978],
      [37.0330, -1.0990], [37.0400, -1.1005], [37.0460, -1.1015],
      [37.0520, -1.1025],
    ],
    heartRateHistory:   [76, 79, 82, 86, 89, 92, 93, 95, 97, 98],
    elevationHistory:   [2600, 2750, 2900, 3050, 3150, 3220, 3300, 3360, 3400, 3420],
    oxygenSatHistory:   [99, 98, 98, 97, 97, 97, 96, 96, 96, 96],
    stepsHistory:       [1200, 2500, 3800, 5000, 6400, 7700, 8900, 10000, 11000, 11840],
    emergencyContacts: [
      { id: 1, name: 'Samir Hassan',   relation: 'Brother',   phone: '+254 701 987 654', primary: true },
      { id: 2, name: 'Hawa Abdi',      relation: 'Emergency', phone: '+254 733 246 810', primary: false },
    ],
  },
  {
    id: 'H003',
    name: "Tobias Ng'eno",
    group: 'Bravo-1',
    status: 'resting',
    avatar: 'TN',
    lastUpdate: '3m ago',
    currentStats: { heartRate: 68, elevation: 3210, oxygenSat: 97, steps: 8760, temperature: 36.5 },
    // SW of base, stopped on ridge
    location: { lng: 36.9980, lat: -1.1105 },
    path: [
      [37.0143, -1.0955], [37.0105, -1.0990], [37.0072, -1.1020],
      [37.0038, -1.1052], [37.0010, -1.1080], [36.9980, -1.1105],
    ],
    heartRateHistory:   [88, 90, 92, 88, 85, 80, 76, 72, 70, 68],
    elevationHistory:   [2800, 2900, 3000, 3080, 3140, 3190, 3210, 3210, 3210, 3210],
    oxygenSatHistory:   [96, 96, 96, 97, 97, 97, 97, 97, 97, 97],
    stepsHistory:       [1100, 2200, 3400, 4500, 5600, 6700, 7600, 8300, 8700, 8760],
    emergencyContacts: [
      { id: 1, name: "Linet Ng'eno",  relation: 'Spouse',    phone: '+254 718 334 556', primary: true },
      { id: 2, name: 'Moses Kipchoge', relation: 'Team Lead', phone: '+254 726 112 334', primary: false },
      { id: 3, name: 'KNH Emergency',  relation: 'Hospital',  phone: '+254 20 272 6300', primary: false },
    ],
  },
  {
    id: 'H004',
    name: 'Fatuma Odhiambo',
    group: 'Bravo-2',
    status: 'warning',
    avatar: 'FO',
    lastUpdate: '2m ago',
    currentStats: { heartRate: 138, elevation: 4150, oxygenSat: 89, steps: 17200, temperature: 37.2 },
    // North high-altitude trail — pushing too fast
    location: { lng: 37.0285, lat: -1.0658 },
    path: [
      [37.0143, -1.0955], [37.0158, -1.0900], [37.0175, -1.0848],
      [37.0198, -1.0800], [37.0228, -1.0750], [37.0258, -1.0705],
      [37.0285, -1.0658],
    ],
    heartRateHistory:   [95, 100, 108, 114, 118, 122, 126, 130, 135, 138],
    elevationHistory:   [3500, 3620, 3750, 3860, 3950, 4010, 4060, 4100, 4130, 4150],
    oxygenSatHistory:   [95, 94, 93, 92, 91, 91, 90, 90, 89, 89],
    stepsHistory:       [1800, 3600, 5400, 7200, 9100, 11000, 12800, 14500, 16000, 17200],
    emergencyContacts: [
      { id: 1, name: 'John Odhiambo', relation: 'Husband', phone: '+254 711 223 445', primary: true },
      { id: 2, name: 'Dr. Akello',    relation: 'Doctor',  phone: '+254 722 567 890', primary: false },
    ],
  },
  {
    id: 'H005',
    name: 'Samuel Waweru',
    group: 'Charlie-1',
    status: 'active',
    avatar: 'SW',
    lastUpdate: '0m ago',
    currentStats: { heartRate: 105, elevation: 3660, oxygenSat: 95, steps: 15800, temperature: 36.6 },
    // NW ridge trail
    location: { lng: 36.9948, lat: -1.0802 },
    path: [
      [37.0143, -1.0955], [37.0100, -1.0932], [37.0062, -1.0908],
      [37.0025, -1.0878], [36.9990, -1.0848], [36.9965, -1.0828],
      [36.9948, -1.0802],
    ],
    heartRateHistory:   [80, 84, 88, 92, 96, 99, 101, 103, 104, 105],
    elevationHistory:   [2900, 3050, 3200, 3350, 3480, 3560, 3600, 3625, 3645, 3660],
    oxygenSatHistory:   [98, 98, 97, 97, 96, 96, 95, 95, 95, 95],
    stepsHistory:       [1600, 3200, 4800, 6500, 8200, 9800, 11500, 13200, 14600, 15800],
    emergencyContacts: [
      { id: 1, name: 'Joyce Waweru', relation: 'Mother', phone: '+254 715 678 901', primary: true },
    ],
  },
  {
    id: 'H006',
    name: 'Elisha Muthoni',
    group: 'Charlie-2',
    status: 'offline',
    avatar: 'EM',
    lastUpdate: '18m ago',
    currentStats: { heartRate: 0, elevation: 2980, oxygenSat: 0, steps: 6200, temperature: 0 },
    // West valley — signal lost
    location: { lng: 36.9802, lat: -1.1068 },
    path: [
      [37.0143, -1.0955], [37.0078, -1.0978], [37.0015, -1.1005],
      [36.9952, -1.1030], [36.9890, -1.1052], [36.9840, -1.1060],
      [36.9802, -1.1068],
    ],
    heartRateHistory:   [78, 81, 84, 87, 84, 80, 0, 0, 0, 0],
    elevationHistory:   [2600, 2700, 2820, 2920, 2970, 2980, 2980, 2980, 2980, 2980],
    oxygenSatHistory:   [97, 97, 97, 96, 96, 97, 0, 0, 0, 0],
    stepsHistory:       [900, 1800, 2700, 3800, 5000, 6200, 6200, 6200, 6200, 6200],
    emergencyContacts: [
      { id: 1, name: 'Diana Muthoni', relation: 'Sister',  phone: '+254 709 876 543', primary: true },
      { id: 2, name: 'Base Camp Med', relation: 'Medical', phone: '+254 20 888 7777', primary: false },
    ],
  },
];

export const SUMMARY = {
  totalHikers: HIKERS.length,
  active:  HIKERS.filter(h => h.status === 'active').length,
  resting: HIKERS.filter(h => h.status === 'resting').length,
  warning: HIKERS.filter(h => h.status === 'warning').length,
  sos:     HIKERS.filter(h => h.status === 'sos').length,
  offline: HIKERS.filter(h => h.status === 'offline').length,
};
