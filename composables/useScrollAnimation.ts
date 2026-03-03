export function useScrollAnimation() {
  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
            ;(entry.target as HTMLElement).style.opacity = '1'
          }
        })
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      ;(el as HTMLElement).style.opacity = '0'
      observer.observe(el)
    })
  })
}
