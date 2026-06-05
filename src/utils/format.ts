export function formatPrice(n: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(n)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'รอยืนยัน',
    confirmed: 'ยืนยันแล้ว',
    paid: 'ชำระแล้ว',
    shipping: 'กำลังจัดส่ง',
    completed: 'สำเร็จ',
    cancelled: 'ยกเลิก',
    rejected: 'ปฏิเสธ',
  }
  return statusMap[status.toLowerCase()] || status
}
