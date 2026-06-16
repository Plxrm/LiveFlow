import { getSettings } from '../api/settings'

export async function buildPaymentMessages(
  orderNumber: string,
  total: number
): Promise<any[]> {
  const settings = await getSettings()
  const method = settings.payment_method || 'text'
  const messages: any[] = []

  switch (method) {
    case 'text':
      // แบบ 1: ข้อความบัญชีธนาคาร
      messages.push({
        type: 'text',
        text:
          `💳 ช่องทางชำระเงิน\n` +
          `🏦 ${settings.bank_name}\n` +
          `📋 เลขบัญชี: ${settings.bank_account_number}\n` +
          `👤 ชื่อ: ${settings.bank_account_name}\n` +
          `💰 ยอดชำระ: ฿${total.toLocaleString()}\n` +
          `📄 ออเดอร์: ${orderNumber}\n\n` +
          `โอนแล้วส่งสลิปมาได้เลยค่ะ`
      })
      break

    case 'image':
      // แบบ 2: รูป QR ของร้าน
      if (settings.payment_qr_image) {
        messages.push({
          type: 'image',
          originalContentUrl: settings.payment_qr_image,
          previewImageUrl: settings.payment_qr_image
        })
      }
      messages.push({
        type: 'text',
        text:
          `💰 ยอดชำระ: ฿${total.toLocaleString()}\n` +
          `📄 ออเดอร์: ${orderNumber}` +
          (settings.payment_qr_text ? `\n\n${settings.payment_qr_text}` : '') +
          `\n\nโอนแล้วส่งสลิปมาได้เลยค่ะ`
      })
      break

    case 'promptpay':
      // แบบ 3: PromptPay QR อัตโนมัติ
      if (settings.promptpay_number) {
        messages.push({
          type: 'flex',
          altText: `สแกนจ่าย ฿${total.toLocaleString()}`,
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'สแกนจ่ายเงิน',
                  weight: 'bold',
                  size: 'lg',
                  align: 'center'
                },
                {
                  type: 'image',
                  url: `https://promptpay.io/${settings.promptpay_number}/${total}.png`,
                  size: 'full',
                  aspectRatio: '1:1'
                },
                {
                  type: 'text',
                  text: settings.promptpay_name || '',
                  size: 'sm',
                  color: '#888888',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: `฿${total.toLocaleString()}`,
                  weight: 'bold',
                  size: 'xl',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: `ออเดอร์: ${orderNumber}`,
                  size: 'xs',
                  color: '#aaaaaa',
                  align: 'center'
                }
              ]
            }
          }
        })
      }
      messages.push({
        type: 'text',
        text: `โอนแล้วส่งสลิปมาได้เลยค่ะ`
      })
      break

    case 'promptpay_text':
      // แบบ 4: PromptPay QR + ข้อความบัญชีสำรอง
      if (settings.promptpay_number) {
        messages.push({
          type: 'flex',
          altText: `สแกนจ่าย ฿${total.toLocaleString()}`,
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'สแกนจ่ายเงิน',
                  weight: 'bold',
                  size: 'lg',
                  align: 'center'
                },
                {
                  type: 'image',
                  url: `https://promptpay.io/${settings.promptpay_number}/${total}.png`,
                  size: 'full',
                  aspectRatio: '1:1'
                },
                {
                  type: 'text',
                  text: `฿${total.toLocaleString()}`,
                  weight: 'bold',
                  size: 'xl',
                  align: 'center'
                }
              ]
            }
          }
        })
      }
      // ข้อความบัญชีสำรอง
      messages.push({
        type: 'text',
        text:
          `💳 หากสแกนไม่ได้ โอนที่:\n` +
          `🏦 ${settings.bank_name}\n` +
          `📋 เลขบัญชี: ${settings.bank_account_number}\n` +
          `👤 ชื่อ: ${settings.bank_account_name}\n` +
          `💰 ยอด: ฿${total.toLocaleString()}\n` +
          `📄 ออเดอร์: ${orderNumber}\n\n` +
          `โอนแล้วส่งสลิปมาได้เลยค่ะ`
      })
      break
  }

  return messages
}
