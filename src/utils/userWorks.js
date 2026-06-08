export const emptyWork = () => ({
  company: '',
  department: '',
  position: '',
  branch: '',
});

/** Normalize legacy single company/department/position into a works array. */
export const getUserWorks = (user) => {
  if (!user) return [];
  if (Array.isArray(user.works) && user.works.length > 0) {
    return user.works.map((w) => ({
      company: w.company || '',
      department: w.department || '',
      position: w.position || '',
      branch: w.branch || '',
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
export const withSyncedWorks = (user, branchOverride = '') => {
  const works = getUserWorks(user);
  const primary = works[0] || emptyWork();
  const branch = branchOverride || user.branch || primary.branch || user.bankDetails?.officeBranch || '';
  const worksWithBranch = works.map((w, i) => ({
    ...w,
    branch: i === 0 ? branch : w.branch || branch,
  }));
  return {
    ...user,
    works: worksWithBranch,
    company: primary.company,
    department: primary.department,
    position: primary.position,
    branch,
    bankDetails: {
      ...(user.bankDetails || {}),
      officeBranch: branch,
    },
  };
};

/** Skills / roles may be array, comma string, or legacy single blob — always return string[]. */
export const normalizeStringList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.includes(',') || trimmed.includes(';') || trimmed.includes('|')) {
      return trimmed.split(/[,;|]+/).map((s) => s.trim()).filter(Boolean);
    }
    if (/[a-z][A-Z]/.test(trimmed)) {
      return trimmed.split(/(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return [];
};

export const formatWorksSummary = (user) => {
  const works = getUserWorks(user);
  if (works.length === 0) return '—';
  const primary = works[0];
  const label = [primary.position, primary.company].filter(Boolean).join(' @ ') || '—';
  if (works.length > 1) return `${label} (+${works.length - 1} more)`;
  return label;
};
