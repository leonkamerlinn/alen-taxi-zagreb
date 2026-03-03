export function useSmoothScroll() {
  function scrollTo(hash: string) {
    const target = document.querySelector(hash)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return { scrollTo }
}
