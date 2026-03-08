/**
 * Push通知クライアント
 *
 * Service Worker登録、Push購読、購読情報のサーバー送信を管理する。
 */

/** Service Workerを登録 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported')
    return null
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration.scope)
    return registration
  } catch (e) {
    console.error('Service Worker registration failed:', e)
    return null
  }
}

/** Push通知がサポートされているか */
function isPushSupported() {
  return 'PushManager' in window && 'serviceWorker' in navigator && 'Notification' in window
}

/** 現在のPush購読状態を取得 */
async function getPushSubscription() {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

/** Push通知を購読 */
async function subscribePush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported')
  }

  // 通知権限をリクエスト
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied')
  }

  // VAPID公開鍵を取得
  const res = await fetch('/api/push/vapid-public-key')
  const { publicKey } = await res.json()
  if (!publicKey) {
    throw new Error('VAPID public key not available')
  }

  // Push購読
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  // サーバーに購読情報を送信
  const subJson = subscription.toJSON()
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
    }),
  })

  return subscription
}

/** Push通知の購読を解除 */
async function unsubscribePush() {
  const subscription = await getPushSubscription()
  if (!subscription) return

  // サーバーから削除
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })

  // ブラウザ側の購読解除
  await subscription.unsubscribe()
}

/** Base64URL → Uint8Array 変換 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** Push購読ボタンの状態を更新 */
async function updatePushButton(btn) {
  if (!isPushSupported()) {
    btn.style.display = 'none'
    return
  }

  const subscription = await getPushSubscription()
  if (subscription) {
    btn.textContent = 'Push ON'
    btn.classList.add('active')
    btn.title = 'プッシュ通知が有効です（クリックで無効化）'
  } else {
    btn.textContent = 'Push OFF'
    btn.classList.remove('active')
    btn.title = 'プッシュ通知を有効にする'
  }
}

/** Push購読ボタンのクリックハンドラ */
async function togglePush(btn) {
  try {
    const subscription = await getPushSubscription()
    if (subscription) {
      await unsubscribePush()
    } else {
      await subscribePush()
    }
    await updatePushButton(btn)
  } catch (e) {
    console.error('Push toggle failed:', e)
    alert('Push notification toggle failed: ' + e.message)
  }
}
