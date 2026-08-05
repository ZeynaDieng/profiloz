const pageCountState = ref(1)
const isOverflowingState = ref(false)

export function useCoverLetterPageOverflowState() {
  function updatePageOverflow(count: number, overflowing: boolean) {
    pageCountState.value = Math.max(1, count)
    isOverflowingState.value = overflowing
  }

  return {
    pageCount: readonly(pageCountState),
    isOverflowing: readonly(isOverflowingState),
    updatePageOverflow,
  }
}
