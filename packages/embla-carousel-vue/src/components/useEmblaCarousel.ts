import {
  ShallowRef,
  MaybeRefOrGetter,
  toValue,
  watch,
  onBeforeUnmount,
  shallowRef
} from 'vue'
import { areOptionsEqual, arePluginsEqual } from 'embla-carousel-reactive-utils'
import EmblaCarousel, {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType
} from 'embla-carousel'
import { isWatchSource } from './utils'

export type UseEmblaCarouselType = [
  ShallowRef<HTMLElement | undefined>,
  ShallowRef<EmblaCarouselType | undefined>,
  EmblaCarouselType
]

function useEmblaCarousel(
  options?: MaybeRefOrGetter<EmblaOptionsType | undefined>,
  plugins?: MaybeRefOrGetter<EmblaPluginType[] | undefined>
): UseEmblaCarouselType {
  EmblaCarousel.globalOptions = useEmblaCarousel.globalOptions

  let storedOptions = toValue(options) ?? {}
  let storedPlugins = toValue(plugins) ?? []

  const serverApi = EmblaCarousel(null, storedOptions, storedPlugins)
  const clientApi = shallowRef<EmblaCarouselType>()
  const rootNode = shallowRef<HTMLElement>()

  function reInit(): void {
    if (!clientApi.value) return
    clientApi.value.reInit(storedOptions, storedPlugins)
  }

  watch(
    () => rootNode.value,
    (node) => {
      if (clientApi.value) {
        clientApi.value.destroy()
        clientApi.value = undefined
      }

      if (node) {
        EmblaCarousel.globalOptions = useEmblaCarousel.globalOptions
        clientApi.value = EmblaCarousel(node, storedOptions, storedPlugins)
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (clientApi.value) clientApi.value.destroy()
  })

  if (isWatchSource(options)) {
    watch(options, (newOptions) => {
      const nextOptions = newOptions ?? {}
      if (areOptionsEqual(storedOptions, nextOptions)) return
      storedOptions = nextOptions
      reInit()
    })
  }

  if (isWatchSource(plugins)) {
    watch(plugins, (newPlugins) => {
      const nextPlugins = newPlugins ?? []
      if (arePluginsEqual(storedPlugins, nextPlugins)) return
      storedPlugins = nextPlugins
      reInit()
    })
  }

  return [rootNode, clientApi, serverApi]
}

declare namespace useEmblaCarousel {
  let globalOptions: EmblaOptionsType | undefined
}

useEmblaCarousel.globalOptions = undefined

export default useEmblaCarousel
