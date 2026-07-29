/** Formal copy for system lock / maintenance shown to participants and staff. */
export function systemAccessTitle(codeOrFlags) {
  const locked = codeOrFlags === 'SYSTEM_LOCKED' || codeOrFlags?.systemLocked
  return locked ? 'Akses sistem ditangguhkan' : 'Pemeliharaan sistem'
}

export function systemAccessMessage(codeOrFlags, maintenanceMessage = '') {
  const locked = codeOrFlags === 'SYSTEM_LOCKED' || codeOrFlags?.systemLocked
  if (locked) {
    return 'Sistem sedang dikunci. Silakan hubungi administrator untuk informasi lebih lanjut.'
  }
  return maintenanceMessage
    || 'Sistem sedang dalam pemeliharaan. Silakan coba kembali nanti.'
}

export function systemAccessIcon(codeOrFlags) {
  const locked = codeOrFlags === 'SYSTEM_LOCKED' || codeOrFlags?.systemLocked
  return locked ? 'lucide:lock' : 'lucide:construction'
}

export function parseSystemAccessError(err) {
  const code = err?.data?.data?.code || err?.data?.code || err?.statusMessage
  if (code === 'SYSTEM_LOCKED' || code === 'MAINTENANCE_MODE') {
    return {
      code,
      title: systemAccessTitle(code),
      message: err?.data?.message || systemAccessMessage(code),
      icon: systemAccessIcon(code),
    }
  }
  return null
}
