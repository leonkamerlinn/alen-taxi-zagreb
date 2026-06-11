export function useScrollAnimation() {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.classList.add('animate-fade-in-up')
            el.style.opacity = '1'
            // Drop the filled animation transform once done so hover effects
            // and future transforms are not overridden
            el.addEventListener(
              'animationend',
              () => el.classList.remove('animate-fade-in-up'),
              { once: true }
            )
            observer?.unobserve(entry.target)
          }
        })
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      // Don't retroactively hide content the user can already see
      // (hydration can land seconds after first paint on slow connections)
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) return

      ;(el as HTMLElement).style.opacity = '0'
      observer!.observe(el)
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })
}
