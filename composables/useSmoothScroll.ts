export function useSmoothScroll() {
  function scrollTo(hash: string) {
    const target = document.querySelector<HTMLElement>(hash)
    if (target) {
      // html { scroll-padding-top } keeps the target clear of the fixed navbar
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Move keyboard/screen-reader reading position along with the scroll
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
  }

  return { scrollTo }
}
