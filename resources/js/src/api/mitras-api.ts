import type { InjectionKey } from 'vue'
import type { MitrasApi } from '@/core/types/mitra'

export const mitrasApiKey: InjectionKey<MitrasApi> = Symbol('mitras-api')
