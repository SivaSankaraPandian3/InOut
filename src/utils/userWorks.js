export const emptyWork = () => ({
  company: '',
  department: '',
  position: '',
});

/** Normalize legacy single company/department/position into a works array. */
export const getUserWorks = (user) => {
  if (!user) return [];
  if (Array.isArray(user.works) && user.works.length > 0) {
    return user.works.map((w) => ({
      company: w.company || '',
      department: w.department || '',
      position: w.position || '',
    }));
  }
  if (user.company || user.department || user.position) {
    return [
      {
        company: user.company || '',
        department: user.department || '',
        position: user.position || '',
      },
    ];
  }
  return [];
};

export const getPrimaryWork = (user) => {
  const works = getUserWorks(user);
  return works[0] || emptyWork();
};

/** Keep top-level fields in sync with the first work entry for older API consumers. */
export const withSyncedWorks = (user) => {
  const works = getUserWorks(user);
  const primary = works[0] || emptyWork();
  return {
    ...user,
    works,
    company: primary.company,
    department: primary.department,
    position: primary.position,
  };
};

export const formatWorksSummary = (user) => {
  const works = getUserWorks(user);
  if (works.length === 0) return '—';
  const primary = works[0];
  const label = [primary.position, primary.company].filter(Boolean).join(' @ ') || '—';
  if (works.length > 1) return `${label} (+${works.length - 1} more)`;
  return label;
};
