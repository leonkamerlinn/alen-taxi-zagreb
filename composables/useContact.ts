const PHONE_E164 = '+385957703853'
const PHONE_DISPLAY = '+385 95 770 3853'
const DEFAULT_WHATSAPP_MESSAGE = 'Pozdrav, trebam taxi. Polazna adresa: '

export function useContact() {
  function whatsappLink(message: string = DEFAULT_WHATSAPP_MESSAGE) {
    return `https://wa.me/${PHONE_E164.slice(1)}?text=${encodeURIComponent(message)}`
  }

  return {
    phoneDisplay: PHONE_DISPLAY,
    telHref: `tel:${PHONE_E164}`,
    viberHref: `viber://chat?number=${encodeURIComponent(PHONE_E164)}`,
    whatsappLink,
  }
}
