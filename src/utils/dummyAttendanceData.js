/** Sample attendance rows for local UI testing (Tirunelveli GPS fix verification). */
const today = () => {
  const d = new Date();
  d.setHours(9, 15, 0, 0);
  return d;
};

const todayOut = () => {
  const d = new Date();
  d.setHours(18, 30, 0, 0);
  return d;
};

export const DUMMY_DASHBOARD_SUMMARY = {
  totalEmployees: 12,
  presentToday: 4,
  absentToday: 8,
};

export const DUMMY_ATTENDANCE_LOGS = [
  {
    employeeName: 'Sakthi Naren T',
    userId: 'dummy-tvl-001',
    type: 'check-in',
    timestamp: today().toISOString(),
    location: '8.7237565,77.722212',
    isInOffice: true,
    officeName: 'Outside Office',
    image: '',
    comment: 'Dummy — Tirunelveli office GPS',
  },
  {
    employeeName: 'Sakthi Naren T',
    userId: 'dummy-tvl-001',
    type: 'check-out',
    timestamp: todayOut().toISOString(),
    location: '8.7237012,77.7221980',
    isInOffice: true,
    officeName: 'Outside Office',
    image: '',
    comment: 'Dummy — Tirunelveli check-out',
  },
  {
    employeeName: 'Priya Raman',
    userId: 'dummy-chn-001',
    type: 'check-in',
    timestamp: new Date(today().getTime() + 5 * 60000).toISOString(),
    location: '12.94198577,80.21012198',
    isInOffice: true,
    officeName: 'Pallikaranai',
    image: '',
    comment: 'Dummy — Pallikaranai',
  },
  {
    employeeName: 'Priya Raman',
    userId: 'dummy-chn-001',
    type: 'check-out',
    timestamp: todayOut().toISOString(),
    location: '12.9421000,80.2100500',
    isInOffice: true,
    officeName: 'Pallikaranai',
    image: '',
    comment: '',
  },
  {
    employeeName: 'Arun Kumar',
    userId: 'dummy-chn-002',
    type: 'check-in',
    timestamp: new Date(today().getTime() + 10 * 60000).toISOString(),
    location: '12.9912597,80.2201616',
    isInOffice: true,
    officeName: 'Velachery',
    image: '',
    comment: 'Dummy — Velachery',
  },
  {
    employeeName: 'Arun Kumar',
    userId: 'dummy-chn-002',
    type: 'check-out',
    timestamp: todayOut().toISOString(),
    location: '12.9913000,80.2202000',
    isInOffice: true,
    officeName: 'Velachery',
    image: '',
    comment: '',
  },
  {
    employeeName: 'Test WFH User',
    userId: 'dummy-wfh-001',
    type: 'check-in',
    timestamp: new Date(today().getTime() + 15 * 60000).toISOString(),
    location: '13.0827000,80.2707000',
    isInOffice: false,
    officeName: 'Outside Office',
    image: '',
    comment: 'Dummy — home location (should stay Outside Office)',
  },
];

export const DUMMY_USERS = [
  { _id: 'dummy-tvl-001', name: 'Sakthi Naren T', branch: 'Tirunelveli', company: 'UC', role: 'employee' },
  { _id: 'dummy-chn-001', name: 'Priya Raman', branch: 'Pallikaranai', company: 'UC', role: 'employee' },
  { _id: 'dummy-chn-002', name: 'Arun Kumar', branch: 'Velachery', company: 'JZ', role: 'employee' },
  { _id: 'dummy-wfh-001', name: 'Test WFH User', branch: 'Velachery', company: 'UC', role: 'employee' },
];

/** Tirunelveli Fab Sapphire area — paste into check-in location test. */
export const TEST_GPS = {
  tirunelveliOffice: '8.7237565,77.722212',
  tirunelveliNearby: '8.7237012,77.7221980',
  pallikarani: '12.94198577,80.21012198',
  velachery: '12.9912597,80.2201616',
  outsideChennai: '13.0827000,80.2707000',
};
