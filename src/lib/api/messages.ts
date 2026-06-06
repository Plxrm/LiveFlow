import { getSupabaseAdmin } from '../supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

// ─── ดึง templates ทั้งหมด group by step ─────────────────────────────────────

export async function getAllTemplates(): Promise<Record<string, any[]>> {
  if (!supabaseAdmin) return {}
  try {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    const grouped: Record<string, any[]> = {}
    for (const t of data || []) {
      if (!grouped[t.step]) grouped[t.step] = []
      grouped[t.step].push(t)
    }
    return grouped
  } catch (err) {
    console.error('getAllTemplates error:', err)
    return {}
  }
}

// ─── ดึง templates ของ step เดียว (active เท่านั้น) ──────────────────────────

export async function getTemplatesByStep(step: string): Promise<any[]> {
  if (!supabaseAdmin) return []
  try {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .select('*')
      .eq('step', step)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error(`getTemplatesByStep(${step}) error:`, err)
    return []
  }
}

// ─── สร้าง template ใหม่ ──────────────────────────────────────────────────────

export async function createTemplate(data: {
  step: string
  msg_type: 'text' | 'image' | 'flex'
  content?: string
  image_url?: string
  sort_order: number
}): Promise<any | null> {
  if (!supabaseAdmin) return null
  try {
    const { data: t, error } = await supabaseAdmin
      .from('message_templates')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return t
  } catch (err) {
    console.error('createTemplate error:', err)
    return null
  }
}

// ─── อัปเดต template ──────────────────────────────────────────────────────────

export async function updateTemplate(
  id: string,
  data: Partial<{
    content: string
    image_url: string
    msg_type: string
    sort_order: number
    is_active: boolean
  }>
): Promise<any | null> {
  if (!supabaseAdmin) return null
  try {
    const { data: t, error } = await supabaseAdmin
      .from('message_templates')
      .update({ ...data, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return t
  } catch (err) {
    console.error('updateTemplate error:', err)
    return null
  }
}

// ─── ลบ template ─────────────────────────────────────────────────────────────

export async function deleteTemplate(id: string): Promise<boolean> {
  if (!supabaseAdmin) return false
  try {
    const { error } = await supabaseAdmin
      .from('message_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('deleteTemplate error:', err)
    return false
  }
}

// ─── อัปเดตลำดับ (reorder) ───────────────────────────────────────────────────

export async function reorderTemplates(
  updates: Array<{ id: string; sort_order: number }>
): Promise<boolean> {
  if (!supabaseAdmin) return false
  try {
    for (const u of updates) {
      const { error } = await supabaseAdmin
        .from('message_templates')
        .update({ sort_order: u.sort_order, updated_at: new Date().toISOString() } as any)
        .eq('id', u.id)
      if (error) throw error
    }
    return true
  } catch (err) {
    console.error('reorderTemplates error:', err)
    return false
  }
}

// ─── แปลง template → LINE messages ──────────────────────────────────────────
// แทนที่ตัวแปร {{xxx}} ด้วยค่าจริง

export function buildMessages(
  templates: any[],
  variables: Record<string, string>
): any[] {
  return templates.map((t) => {
    if (t.msg_type === 'image') {
      const url = replaceVars(t.image_url || '', variables)
      return {
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
      }
    }
    if (t.msg_type === 'flex') {
      try {
        const flexContent =
          typeof t.content === 'string' ? JSON.parse(t.content) : t.content
        return {
          type: 'flex',
          altText: replaceVars(flexContent?.altText || 'ข้อความ', variables),
          contents: flexContent?.contents || flexContent,
        }
      } catch {
        return { type: 'text', text: replaceVars(t.content || '', variables) }
      }
    }
    // default: text
    return {
      type: 'text',
      text: replaceVars(t.content || '', variables),
    }
  })
}

function replaceVars(text: string, vars: Record<string, string>): string {
  if (!text) return ''
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}
