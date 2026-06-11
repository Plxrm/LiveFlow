import type { APIRoute } from 'astro'

export const GET: APIRoute = async (context) => {
  try {
    const { getKexConfig } = await import('../../../lib/kex/get-config')
    const runtimeEnv = (context.locals as any)?.runtime?.env || {}
    const config = getKexConfig(runtimeEnv)

    // แสดงค่า masked
    const masked = {
      appKey: config.appKey
        ? config.appKey.substring(0, 4) + '***' + config.appKey.substring(config.appKey.length - 4)
        : 'EMPTY',
      appId: config.appId || 'EMPTY',
      merchantId: config.merchantId || 'EMPTY',
      env: config.env,
      appKeyLength: config.appKey?.length || 0
    }

    // ทดสอบ call KEX API จริง
    const baseUrl = config.env === 'production'
      ? 'https://cms-api.th.kex-express.com/easyship-customer-api/api'
      : 'https://poc-rd.th.kex-express.com/easyship-cust-api/api'

    const testRes = await fetch(
      `${baseUrl}/v1/shipment_tracking`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'app_key': config.appKey,
          'app_id': config.appId,
          'merchant_id': config.merchantId
        },
        body: JSON.stringify({
          language: 'th',
          trackingNo: ['TEST000000001']
        })
      }
    )

    const testText = await testRes.text()

    return new Response(
      JSON.stringify({
        credentials: masked,
        baseUrl,
        kexResponse: testText
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
